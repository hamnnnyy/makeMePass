'use server';

import { generateWithFallback } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import { createClient } from '@/lib/supabase/server';
import { uploadSessionAudio } from '@/lib/storage/uploadBlob';
import { CLOSING_QUESTION, FOLLOW_UP_OFFSET, INTRO_QUESTION, MODE_TONE, type AnswerKind } from '@/lib/constants/interview';
import { INTERVIEWER_ROLES, type InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';
import type { NonVerbalSummary } from '@/features/mediapipe/logic/nonVerbal';
import type { AudioStats } from '../logic/audio';
import { scoreNonVerbal, scoreTiming, finalDeltas, applyDeltas, judge, type RoleValues } from '../logic/scoring';

export type FavorState = RoleValues;

export interface EvaluateResult {
  favor: FavorState;
  reaction: string;             // 면접관이 소리 내어 하는 짧은 반응 (평가 내용 노출 없음)
  reactionRole: InterviewerRole;
  followUp: { id: string; text: string; role: InterviewerRole } | null;
  eliminatedBy: InterviewerRole | null;  // 탈락이면 탈락시킨 면접관
}

interface Verbal {
  transcript: string;
  filler_count: number;
  score_content: number;
  score_fluency: number;
  deltas: RoleValues;
  strengths: string;
  improvement: string;
  nonverbal_feedback: string;
  reaction: string;
  follow_up: { ask: boolean; role: InterviewerRole; question: string };
}

const roleEnum = { type: 'string', enum: [...INTERVIEWER_ROLES] };
const VERBAL_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string', description: '답변 전사. 음, 어, 그, 저 같은 군말도 빠짐없이 그대로 적는다. 말이 없으면 빈 문자열.' },
    filler_count: { type: 'integer', description: '군말(음, 어, 그, 저, 이제, 약간, 뭔가 등 의미 없는 삽입어) 개수' },
    score_content: { type: 'integer', minimum: 0, maximum: 100, description: '질문 적합성, 구체성(경험·수치·STAR), 논리 구조, 기관 이해도' },
    score_fluency: { type: 'integer', minimum: 0, maximum: 100, description: '발음 명료도, 목소리 자신감과 크기, 말 속도, 머뭇거림, 군말' },
    deltas: {
      type: 'object',
      description: '각 면접관 관점의 호감도 변화 -10~10. hr=인성·조직적합·태도, tech=직무역량·전문성, exec=가치관·비전·기관 이해',
      properties: { hr: { type: 'integer' }, tech: { type: 'integer' }, exec: { type: 'integer' } },
      required: ['hr', 'tech', 'exec'],
    },
    strengths: { type: 'string', description: '잘한 점 한 문장' },
    improvement: { type: 'string', description: '고칠 점 한 문장. 가능하면 더 나은 표현 예시 포함' },
    nonverbal_feedback: { type: 'string', description: '[비언어 측정] 값을 근거로 시선·표정·자세·긴장도에 대한 조언 한 문장. 측정값이 없으면 빈 문자열' },
    reaction: { type: 'string', description: '질문한 면접관이 답변 직후 말하는 짧은 한마디(15자 이내). 점수나 평가를 드러내지 않는다. 예: "네, 알겠습니다."' },
    follow_up: {
      type: 'object',
      description: '실제 면접관이라면 꼬리질문을 할지. 답변이 모호하거나, 흥미로운 경험을 더 파고들 가치가 있거나, 자소서와 어긋날 때 ask=true',
      properties: { ask: { type: 'boolean' }, role: roleEnum, question: { type: 'string', description: '40자 이내 구어체 질문' } },
      required: ['ask', 'role', 'question'],
    },
  },
  required: ['transcript', 'filler_count', 'score_content', 'score_fluency', 'deltas', 'strengths', 'improvement', 'nonverbal_feedback', 'reaction', 'follow_up'],
};

const num = (v: unknown, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
const int = (v: unknown, lo: number, hi: number) => Math.round(num(v, lo, hi));

// 클라이언트가 보낸 측정값은 범위만 보정해서 쓴다 (본인 연습용이라 위조 방지까진 하지 않음)
function parseMeta(raw: FormDataEntryValue | null) {
  const m = JSON.parse(typeof raw === 'string' ? raw : '{}');
  const nv: NonVerbalSummary = {
    presence: num(m.nonVerbal?.presence, 0, 1),
    gazeOnRatio: num(m.nonVerbal?.gazeOnRatio, 0, 1),
    smileAvg: num(m.nonVerbal?.smileAvg, 0, 1),
    stabilityAvg: num(m.nonVerbal?.stabilityAvg, 0, 1),
    blinkPerMin: num(m.nonVerbal?.blinkPerMin, 0, 200),
  };
  const audio: AudioStats = {
    durationSec: num(m.audio?.durationSec, 0, 600),
    leadingSilenceSec: num(m.audio?.leadingSilenceSec, 0, 600),
    speechSpanSec: num(m.audio?.speechSpanSec, 0, 600),
    longestPauseSec: num(m.audio?.longestPauseSec, 0, 600),
  };
  return { nv, audio, hasMeta: !!m.nonVerbal };
}

export async function evaluateAnswer(sessionQuestionId: string, formData: FormData): Promise<EvaluateResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // RLS가 본인 세션의 질문만 돌려준다
  const { data: sq } = await supabase
    .from('session_questions')
    .select('question_text, asked_by_role, session_id, sequence, is_follow_up, question_id')
    .eq('id', sessionQuestionId)
    .single();
  if (!sq) throw new Error('질문을 찾을 수 없습니다.');

  const [{ data: session }, { data: history }, { data: personas }] = await Promise.all([
    supabase
      .from('interview_sessions')
      .select('mode, cover_letter_id, organizations(name_ko, description, core_values, talent_profile, pass_threshold, veto_threshold, eliminate_threshold), cover_letters(items)')
      .eq('id', sq.session_id)
      .single(),
    supabase
      .from('session_questions')
      .select('question_text, transcript, hr_after, tech_after, exec_after')
      .eq('session_id', sq.session_id)
      .not('answered_at', 'is', null)
      .order('answered_at'),
    supabase.from('interviewer_personas').select('mode, role, label_ko, position_ko, tone_description'),
  ]);
  if (!session) throw new Error('세션을 찾을 수 없습니다.');

  const org = session.organizations as unknown as {
    name_ko: string; description: string | null; core_values: unknown; talent_profile: unknown;
    pass_threshold: number; veto_threshold: number; eliminate_threshold: number;
  };
  const coverLetter = (session.cover_letters as unknown as { items: Record<string, string> } | null)?.items;

  // 호감도는 클라이언트 값을 믿지 않고 DB의 마지막 답변 기준으로 계산
  const last = history?.at(-1);
  const favorBefore: FavorState = {
    hr: last?.hr_after ?? 50, tech: last?.tech_after ?? 50, exec: last?.exec_after ?? 50,
  };

  // 음성 답변 또는 텍스트 답변. 텍스트는 비언어·전달력·시간을 측정할 수 없어 내용만 평가한다.
  const rawText = formData.get('answerText');
  const answerText = typeof rawText === 'string' ? rawText.trim().slice(0, 2000) : '';
  const audioFile = formData.get('audio');
  const isText = answerText.length > 0;
  if (!isText && (!(audioFile instanceof File) || audioFile.size === 0)) throw new Error('답변이 없습니다.');
  const { nv, audio, hasMeta } = parseMeta(formData.get('meta'));
  const nvAll = scoreNonVerbal(nv);  // 얼굴이 안 잡혀도 0점으로 반영 (카메라를 피한 것도 평가 대상)
  const nvLine = hasMeta
    ? `[비언어 측정] 얼굴 검출 ${Math.round(nv.presence * 100)}%, ${isText ? '' : `정면 응시 ${Math.round(nv.gazeOnRatio * 100)}%, `}평균 미소 ${nv.smileAvg.toFixed(2)}(0.1~0.5 적당), 자세 안정 ${Math.round(nv.stabilityAvg * 100)}%, 분당 눈 깜빡임 ${Math.round(nv.blinkPerMin)}회(35회 이상이면 긴장)`
    : '';

  const role = sq.asked_by_role as InterviewerRole;
  const isClosing = sq.question_text === CLOSING_QUESTION;
  const kind: AnswerKind = isClosing ? 'closing'
    : sq.is_follow_up ? 'followUp'
    : sq.question_text === INTRO_QUESTION ? 'intro'
    : 'main';

  const prevQA = (history ?? [])
    .map((h, i) => `Q${i + 1}. ${h.question_text}\nA${i + 1}. ${h.transcript || '(무응답)'}`)
    .join('\n');

  const prompt = `당신은 ${org.name_ko} 신입 채용 면접의 평가위원 3명(hr, tech, exec)입니다.
${isText
  ? '지원자가 이번 답변을 텍스트로 입력했습니다. 내용만 평가하고, transcript 에는 입력문을 그대로, filler_count 는 0, score_fluency 는 0 으로 두세요.'
  : '첨부된 음성은 지원자의 답변입니다. 음성을 직접 듣고 내용과 전달력을 함께 평가하세요.'}

[기관] ${org.name_ko}${org.description ? ` — ${org.description}` : ''}
${org.core_values ? `[핵심가치/인재상] ${JSON.stringify(org.core_values)} ${JSON.stringify(org.talent_profile ?? '')}` : ''}
${coverLetter ? `[지원자 자기소개서 요약] ${JSON.stringify(coverLetter)}` : ''}
[면접관 말투] ${MODE_TONE[session.mode as InterviewMode]}
${(personas ?? []).filter((p) => p.mode === session.mode)
  .map((p) => `- ${p.role}: ${p.label_ko}${p.position_ko ? `(${p.position_ko})` : ''}. ${p.tone_description ?? ''}`).join('\n')}

[이전 문답]
${prevQA || '(없음)'}

[현재 질문] (${role} 면접관, ${kind === 'intro' ? '1분 자기소개' : kind === 'followUp' ? '꼬리질문' : kind === 'closing' ? '마지막 한마디' : '본 질문'})
${sq.question_text}

${isText ? `${nvLine}\n[지원자 답변(텍스트 입력)]\n${answerText}` : `${nvLine}
[측정된 전달 지표]
- 답변 길이 ${audio.speechSpanSec.toFixed(1)}초, 말 시작까지 ${audio.leadingSilenceSec.toFixed(1)}초, 최장 침묵 ${audio.longestPauseSec.toFixed(1)}초`}

평가 규칙:
- 실제 공기업 면접처럼 엄격하게. 평범한 답변은 deltas 0 근처, 인상적이면 +, 부실하면 -.
- 답변이 없거나 질문과 무관하면 score_content 0~20, deltas는 -8 이하.
- 이전 답변과 모순되거나 자소서와 다르면 감점하고 꼬리질문으로 확인한다.
- ${sq.is_follow_up || isClosing ? '이번 질문에는 꼬리질문을 하지 않는다 (follow_up.ask=false).' : '꼬리질문은 꼭 필요할 때만 한다.'}`;

  const response = await generateWithFallback(MODELS.evaluation, {
    contents: [{
      role: 'user',
      parts: [
        ...(isText || !(audioFile instanceof File) ? [] : [
          { inlineData: { mimeType: 'audio/wav', data: Buffer.from(await audioFile.arrayBuffer()).toString('base64') } },
        ]),
        { text: prompt },
      ],
    }],
    config: { responseMimeType: 'application/json', responseJsonSchema: VERBAL_SCHEMA, temperature: 0.3 },
  });
  const v = JSON.parse(response.text ?? '{}') as Verbal;

  const verbalDeltas: RoleValues = {
    hr: num(v.deltas?.hr, -10, 10), tech: num(v.deltas?.tech, -10, 10), exec: num(v.deltas?.exec, -10, 10),
  };
  // 텍스트 답변도 표정·자세는 평가한다 (타이핑하느라 아래를 보므로 시선은 제외)
  const nvScores = hasMeta ? { ...nvAll, eyeContact: isText ? null : nvAll.eyeContact } : null;
  const timing = isText ? null : scoreTiming(audio, kind);
  const deltas = nvScores
    ? finalDeltas(verbalDeltas, nvScores, timing)
    : { hr: Math.round(verbalDeltas.hr), tech: Math.round(verbalDeltas.tech), exec: Math.round(verbalDeltas.exec) };
  const favor = applyDeltas(favorBefore, deltas);

  // 음성 저장 실패해도 평가는 계속
  let audioPath: string | null = null;
  try {
    if (!isText && audioFile instanceof File) {
      audioPath = await uploadSessionAudio(audioFile, user.id, sq.session_id, sessionQuestionId);
    }
  } catch (e) {
    console.error('audio upload failed', e);
  }

  await supabase.from('session_questions').update({
    audio_url: audioPath,
    transcript: isText ? answerText : v.transcript ?? '',
    duration_seconds: isText ? null : Math.round(audio.speechSpanSec),
    filler_count: isText ? null : int(v.filler_count, 0, 999),
    score_content: int(v.score_content, 0, 100),
    score_fluency: isText ? null : int(v.score_fluency, 0, 100),
    score_eye_contact: nvScores?.eyeContact ?? null,
    score_expression: nvScores?.expression ?? null,
    score_timing: timing,
    hr_delta: deltas.hr, tech_delta: deltas.tech, exec_delta: deltas.exec,
    hr_after: favor.hr, tech_after: favor.tech, exec_after: favor.exec,
    claude_feedback: {
      strengths: v.strengths ?? '',
      improvement: v.improvement ?? '',
      inputMode: isText ? 'text' : 'voice',
      nonverbalFeedback: v.nonverbal_feedback ?? '',
      posture: nvScores?.posture ?? null,
      nonVerbal: nv,
      ...(isText ? {} : { audio }),
    },
    answered_at: new Date().toISOString(),
  }).eq('id', sessionQuestionId);

  const verdict = judge(favor, org);
  const eliminated = verdict.result === 'fail_eliminate';
  // FK 가 questions(id) 라서 질문 은행 문항일 때만 기록된다. 결과 화면은 마지막 답변을 탈락 문항으로 본다.
  if (eliminated && sq.question_id) {
    await supabase.from('interview_sessions')
      .update({ elimination_question_id: sq.question_id })
      .eq('id', sq.session_id);
  }

  let followUp: EvaluateResult['followUp'] = null;
  const fuText = v.follow_up?.question?.trim();
  if (!eliminated && v.follow_up?.ask && fuText && !sq.is_follow_up && !isClosing) {
    const fuRole = INTERVIEWER_ROLES.includes(v.follow_up.role) ? v.follow_up.role : role;
    const { data: inserted } = await supabase
      .from('session_questions')
      .insert({
        session_id: sq.session_id,
        question_id: null,
        question_text: fuText,
        asked_by_role: fuRole,
        sequence: sq.sequence + FOLLOW_UP_OFFSET, // 원 질문 바로 뒤
        is_follow_up: true,
        parent_session_question_id: sessionQuestionId,
        audio_url: null, transcript: null, duration_seconds: null,
        filler_count: null, score_content: null, score_fluency: null,
        score_eye_contact: null, score_timing: null, score_expression: null,
        hr_delta: 0, tech_delta: 0, exec_delta: 0,
        hr_after: null, tech_after: null, exec_after: null,
        claude_feedback: null, answered_at: null,
      })
      .select('id')
      .single();
    if (inserted) followUp = { id: inserted.id, text: fuText, role: fuRole };
  }

  return {
    favor,
    reaction: (v.reaction ?? '').slice(0, 40),
    reactionRole: role,
    followUp,
    eliminatedBy: eliminated ? verdict.lowRole : null,
  };
}
