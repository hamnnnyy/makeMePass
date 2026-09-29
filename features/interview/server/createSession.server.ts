'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateWithFallback } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import { sampleN } from '@/lib/utils/sample';
import { CLOSING_QUESTION, CLOSING_QUESTION_EN, GROUP_CLOSING_QUESTION, GROUP_CLOSING_QUESTION_EN, INTRO_QUESTION, INTRO_QUESTION_EN, SEQUENCE_STEP } from '@/lib/constants/interview';
import { INTERVIEWER_ROLES, type InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';
import { INTERVIEW_TYPES, INTERVIEW_TYPE_INFO, PEER_OPTIONAL, PEER_REQUIRED, PT_TOPIC_PREFIX, SOLO_ROLE, TURN_TYPES, type InterviewType } from '@/lib/constants/interviewTypes';
import type { PeerId, PeerTurn } from '@/lib/constants/peers';
import { orgBrief } from '../logic/orgBrief';

type Planned = { text: string; role: InterviewerRole; questionId: string | null; peers?: PeerTurn[] };

const MAX_PDF_BYTES = 5 * 1024 * 1024;
// 하루 면접 시작 횟수 (Gemini 비용·남용 방지). KST 자정 기준.
const DAILY_SESSION_LIMIT = 10;

// 자소서 PDF를 요약하고, 자소서 기반 질문을 만든다
async function readCoverLetter(file: File, orgName: string, count: number, english: boolean) {
  const res = await generateWithFallback(MODELS.evaluation, {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'application/pdf', data: Buffer.from(await file.arrayBuffer()).toString('base64') } },
        { text: `${orgName} 신입 공채 지원자의 자기소개서입니다. 문항별 핵심 내용을 요약하고, 실제 면접관이 이 자소서를 보고 물어볼 질문 ${count}개를 만드세요. 질문은 자소서의 구체적 경험·수치·주장을 검증하는 ${english ? '자연스러운 영어 한 문장(20단어 이내). 요약은 한국어로' : '구어체 한 문장(50자 이내)'}.` },
      ],
    }],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          summary: { type: 'object', additionalProperties: { type: 'string' }, description: '문항 제목 → 요약' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: { role: { type: 'string', enum: [...INTERVIEWER_ROLES] }, text: { type: 'string' } },
              required: ['role', 'text'],
            },
          },
        },
        required: ['summary', 'questions'],
      },
    },
  });
  const out = JSON.parse(res.text ?? '{}') as { summary?: Record<string, string>; questions?: { role: InterviewerRole; text: string }[] };
  return {
    summary: out.summary ?? {},
    questions: (out.questions ?? [])
      .filter((q) => q.text && INTERVIEWER_ROLES.includes(q.role))
      .slice(0, count),
  };
}

// PT면접 주제: 기관 업무와 연결된 실제형 과제
async function makePtTopic(brief: string, english: boolean): Promise<string> {
  const res = await generateWithFallback(MODELS.evaluation, {
    contents: `${brief}\n\n위 기관 신입 공채 PT면접 주제를 하나 만드세요. 기관의 주요 사업·최근 현안과 연결되고, 3분 발표로 해결 방안을 제시할 수 있는 과제여야 합니다.${english ? ' 영어로 진행하는 면접이므로 title·background·task 는 자연스러운 영어로 쓰세요.' : ''}`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '주제 한 줄 (40자 이내)' },
          background: { type: 'string', description: '배경 상황 1~2문장' },
          task: { type: 'string', description: '지원자가 발표할 과제 1문장' },
        },
        required: ['title', 'background', 'task'],
      },
    },
  });
  const t = JSON.parse(res.text ?? '{}') as { title?: string; background?: string; task?: string };
  if (!t.title) throw new Error('PT 주제를 만들지 못했습니다.');
  return english
    ? `${PT_TOPIC_PREFIX}${t.title}\nBackground: ${t.background ?? ''}\nTask: ${t.task ?? ''}`
    : `${PT_TOPIC_PREFIX}${t.title}\n배경: ${t.background ?? ''}\n과제: ${t.task ?? ''}`;
}

export default async function createSession(
  orgCode: string,
  mode: InterviewMode,
  interviewType: InterviewType,
  questionCount: number,
  coverLetterFile: File | null,
  // 면접 형식: AI 지원자 참여, 면접관 수, 영어 진행
  format: { withPeers: boolean; panelSize: 1 | 3; english: boolean } = { withPeers: false, panelSize: 3, english: false },
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const todayKst = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const { count: todayCount } = await supabase
    .from('interview_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('started_at', `${todayKst}T00:00:00+09:00`);
  // 서버 액션의 throw 메시지는 프로덕션에서 가려지므로 알려줄 오류는 값으로 돌려준다
  if ((todayCount ?? 0) >= DAILY_SESSION_LIMIT) {
    return { error: `오늘은 면접을 ${DAILY_SESSION_LIMIT}번까지 볼 수 있어요. 내일 다시 도전해 주세요.` };
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name_ko, description, core_values, talent_profile')
    .eq('code', orgCode)
    .single();
  if (orgError || !org) throw new Error(`기관을 찾을 수 없습니다: ${orgCode}`);
// 토론 논제 / 토의 과제: 기관 사업·공공 이슈와 연결
async function makeGroupTopic(brief: string, type: 'debate' | 'discussion', english: boolean): Promise<string> {
  const ask = type === 'debate'
    ? '찬반이 분명히 갈리는 토론면접 논제를 하나 만드세요. "~해야 한다" 형태의 한 문장 논제와, 양측 입장을 이해할 배경 1~2문장.'
    : '지원자들이 함께 해결책을 합의해야 하는 토의면접 과제를 하나 만드세요. 구체적 상황과 합의해야 할 결과물(예: 우선 추진할 방안 한 가지)을 담은 과제 한 문장과 배경 1~2문장.';
  const res = await generateWithFallback(MODELS.evaluation, {
    contents: `${brief}\n\n위 기관 신입 공채 ${ask} 기관의 주요 사업과 최근 현안에 연결하세요.${english ? ' 영어로 진행하는 면접이므로 title 과 background 는 자연스러운 영어로 쓰세요 (title 20단어 이내).' : ''}`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: type === 'debate' ? '논제 한 문장 (40자 이내)' : '과제 한 문장 (60자 이내)' },
          background: { type: 'string', description: '배경 1~2문장' },
        },
        required: ['title', 'background'],
      },
    },
  });
  const t = JSON.parse(res.text ?? '{}') as { title?: string; background?: string };
  if (!t.title) throw new Error('주제를 만들지 못했습니다.');
  return `${t.title}\n${english ? 'Background' : '배경'}: ${t.background ?? ''}`;
}

// 기관 전용 질문이 적은 기관: 기관 특징(인재상·사업·현안)으로 맞춤 질문을 만든다
async function makeOrgQuestions(brief: string, count: number, focus: string, english = false): Promise<Planned[]> {
  const res = await generateWithFallback(MODELS.evaluation, {
    contents: `${brief}\n\n위 기관 신입 공채 면접관이 실제로 물을 법한 기관 맞춤 질문 ${count}개를 만드세요. 인재상·핵심가치·주요 사업·최근 현안 중 서로 다른 것을 하나씩 겨냥하고, 어느 기관에나 통하는 일반 질문은 피하세요. 면접 관점: ${focus} ${english ? '질문은 영어 면접관이 말하듯 자연스러운 영어 한 문장(20단어 이내)으로 쓰세요.' : '구어체 한 문장(60자 이내).'}`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: { role: { type: 'string', enum: [...INTERVIEWER_ROLES] }, text: { type: 'string' } },
              required: ['role', 'text'],
            },
          },
        },
        required: ['questions'],
      },
      httpOptions: { timeout: 12_000 },
    },
  });
  const out = JSON.parse(res.text ?? '{}') as { questions?: { role: InterviewerRole; text: string }[] };
  return (out.questions ?? [])
    .filter((q) => q.text && INTERVIEWER_ROLES.includes(q.role))
    .slice(0, count)
    .map((q) => ({ text: q.text, role: q.role, questionId: null }));
}

const turn = (peer: PeerId, intent: string): PeerTurn => ({ peer, intent });

// 토론: 사용자 한 편, AI 지원자 둘은 반대편. 입론 → 반론 → 재반론 → 최종 발언
// 진행 멘트는 [한국어, 영어]. 발언 지시(intent)는 모델에게 주는 것이라 한국어로 둔다.
function debatePlan(peerSide: string, english: boolean): Planned[] {
  const t = (ko: string, en: string) => (english ? en : ko);
  return [
    { text: t('입론 시간입니다. 논제에 대한 입장과 근거를 말씀해 주세요.', 'Let us begin with opening statements. Please state your position and your reasons.'), role: 'exec', questionId: null,
      peers: [turn('p1', `입론. ${peerSide} 측 입장과 핵심 근거 두 가지`)] },
    { text: t('상대 측 입론에 대해 반론해 주세요.', 'Please give your rebuttal to the other side.'), role: 'tech', questionId: null,
      peers: [turn('p2', `입론. ${peerSide} 측 입장을 보강하고 사용자 입론의 약점 하나를 짚는다`)] },
    { text: t('방금 반론에 대한 재반론과 보완 근거를 말씀해 주세요.', 'Please respond to that rebuttal and strengthen your argument.'), role: 'hr', questionId: null,
      peers: [turn('p1', '반론. 사용자의 직전 발언을 구체적으로 인용해 반박한다')] },
    { text: t('최종 발언을 해 주세요.', 'Please give your closing statement.'), role: 'exec', questionId: null,
      peers: [turn('p2', `최종 발언. ${peerSide} 측 입장을 정리한다`)] },
  ];
}

// 토의: 문제 정의 → 방안 제시 → 의견 조율 → 합의안 정리
function discussionPlan(english: boolean): Planned[] {
  const t = (ko: string, en: string) => (english ? en : ko);
  return [
    { text: t('과제를 확인하셨죠. 이 문제를 어떻게 정의하면 좋을지 의견을 나눠 주세요.', 'You have seen the task. How would you define the problem? Please share your views.'), role: 'exec', questionId: null,
      peers: [turn('p1', '문제 정의. 원인을 한 가지로 단정하는 경향이 있다')] },
    { text: t('해결 방안을 제시해 주세요.', 'Please suggest your solutions.'), role: 'tech', questionId: null,
      peers: [turn('p1', '방안 제시. 예산이 많이 드는 대규모 사업'), turn('p2', '방안 제시. 작은 시범 사업부터 하자며 p1 과 부딪힌다')] },
    { text: t('의견이 갈리고 있습니다. 어떻게 조율하면 좋을까요?', 'Opinions are divided. How can we find common ground?'), role: 'hr', questionId: null,
      peers: [turn('p1', '자기 방안을 고집하며 사용자 의견의 약점을 지적한다'), turn('p2', '과제와 조금 벗어난 이야기로 흐름을 흐린다')] },
    { text: t('시간이 얼마 남지 않았습니다. 지금까지 논의를 정리해 합의안을 발표해 주세요.', 'We are almost out of time. Please sum up the discussion and present the agreed plan.'), role: 'exec', questionId: null,
      peers: [turn('p2', '누군가 정리해 주면 좋겠다며 사용자에게 정리를 넘긴다')] },
  ];
}

  const count = Math.max(3, Math.min(10, Math.floor(questionCount)));
  const type: InterviewType = INTERVIEW_TYPES.includes(interviewType) ? interviewType : 'general';
  const categories = INTERVIEW_TYPE_INFO[type].categories;

  // 공통 질문 + question_organizations 로 이 기관에 연결된 질문. 영어로 진행하면 영어 질문만, 아니면 한국어 질문만.
  const english = format.english;
  const language = english ? 'en' : 'ko';
  const [{ data: general }, { data: linkedRows }] = await Promise.all([
    supabase.from('questions').select('id, text, target_role, category').eq('is_general', true).eq('language', language),
    supabase.from('question_organizations').select('questions(id, text, target_role, category, language)').eq('organization_id', org.id),
  ]);
  const linked = (linkedRows ?? []).filter((row) => row.questions?.language === language);
  const byId = new Map((general ?? []).map((q) => [q.id, q]));
  for (const row of linked) if (row.questions) byId.set(row.questions.id, row.questions);
  // 면접 유형에 맞는 카테고리만 (인성/직무/임원)
  const others = [...byId.values()].filter((q) => !categories || categories.includes(q.category));

  // 실제 면접 순서: 1분 자기소개 → (자소서 질문) → 본 질문 → 마지막 한마디
  let coverLetterId: string | null = null;
  let clQuestions: Planned[] = [];
  if (!TURN_TYPES.includes(type) && coverLetterFile && coverLetterFile.size > 0) {
    if (coverLetterFile.type !== 'application/pdf') throw new Error('자기소개서는 PDF만 지원합니다.');
    if (coverLetterFile.size > MAX_PDF_BYTES) throw new Error('자기소개서는 5MB 이하만 가능합니다.');
    const cl = await readCoverLetter(coverLetterFile, org.name_ko, Math.min(3, Math.floor((count - 1) / 2)), english);
    const { data: saved } = await supabase
      .from('cover_letters')
      .insert({ user_id: user.id, organization_id: org.id, position_code: null, items: cl.summary, is_active: true })
      .select('id')
      .single();
    coverLetterId = saved?.id ?? null;
    clQuestions = cl.questions.map((q) => ({ text: q.text, role: q.role, questionId: null }));
  }

  const mainCount = count - 1 - clQuestions.length;
  // 다대다: 자기소개·본 질문에 AI 지원자 둘이 먼저 답한다 (순서는 번갈아). 자소서 질문·마지막 한마디는 사용자만.
  const both = (i: number): PeerTurn[] => (i % 2 ? [turn('p2', '답변'), turn('p1', '답변')] : [turn('p1', '답변'), turn('p2', '답변')]);
  const withPeers = PEER_REQUIRED.includes(type) || (format.withPeers && PEER_OPTIONAL.includes(type));
  const panelSize = format.panelSize === 1 ? 1 : 3;

  let groupSetup: { topic: string; userSide?: string; peerSide?: string } | null = null;
  let planned: Planned[];
  if (type === 'pt') {
    // PT: 주제 발표 1개 + (발표에 대한 꼬리질문은 답변 평가 때 생성) + 마지막 한마디
    planned = [
      { text: await makePtTopic(orgBrief(org), english), role: 'exec', questionId: null },
      withPeers
        // 다대다는 손 들고 먼저 나서는 AI 지원자 한 명 뒤에 내 차례
        ? { text: english ? GROUP_CLOSING_QUESTION_EN : GROUP_CLOSING_QUESTION, role: 'exec', questionId: null,
            peers: [turn(Math.random() < 0.5 ? 'p1' : 'p2', '손을 들고 먼저 나서서 면접 전체를 마무리하는 한마디')] }
        : { text: english ? CLOSING_QUESTION_EN : CLOSING_QUESTION, role: 'exec', questionId: null },
    ];
  } else if (type === 'debate' || type === 'discussion') {
    const topic = await makeGroupTopic(orgBrief(org), type, english);
    if (type === 'debate') {
      const userSide = Math.random() < 0.5 ? '찬성' : '반대';
      const peerSide = userSide === '찬성' ? '반대' : '찬성';
      groupSetup = { topic, userSide, peerSide };
      planned = debatePlan(peerSide, english);
    } else {
      groupSetup = { topic };
      planned = discussionPlan(english);
    }
  } else {
    // 기관 전용 질문이 적으면 기관 특징으로 맞춤 질문 두 개를 만들어 섞는다 (실패해도 면접은 진행)
    const orgQs = linked.length < 6 && mainCount >= 3
      ? await makeOrgQuestions(orgBrief(org), 2, INTERVIEW_TYPE_INFO[type].focus, english).catch(() => [])
      : [];
    const main: Planned[] = sampleN([
      ...sampleN(others, mainCount - orgQs.length).map((q) => ({ text: q.text, role: q.target_role, questionId: q.id })),
      ...orgQs,
    ], mainCount);
    planned = [
      { text: english ? INTRO_QUESTION_EN : INTRO_QUESTION, role: 'hr', questionId: null, ...(withPeers ? { peers: both(0) } : {}) },
      ...clQuestions,
      ...main.map((q, i) => ({ ...q, ...(withPeers ? { peers: both(i + 1) } : {}) })),
      withPeers
        // 다대다는 손 들고 먼저 나서는 AI 지원자 한 명 뒤에 내 차례
        ? { text: english ? GROUP_CLOSING_QUESTION_EN : GROUP_CLOSING_QUESTION, role: 'exec', questionId: null,
            peers: [turn(Math.random() < 0.5 ? 'p1' : 'p2', '손을 들고 먼저 나서서 면접 전체를 마무리하는 한마디')] }
        : { text: english ? CLOSING_QUESTION_EN : CLOSING_QUESTION, role: 'exec', questionId: null },
    ];
  }

  // 면접관 1명이면 모든 질문을 그 면접관이 한다
  if (panelSize === 1) planned = planned.map((q) => ({ ...q, role: SOLO_ROLE[type] }));

  const { data: session, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      mode,
      // 종합은 컬럼 기본값 사용 (interview_type 마이그레이션 전에도 동작)
      ...(type !== 'general' ? { interview_type: type } : {}),
      ...(groupSetup ? { group_setup: groupSetup } : {}),
      language,
      with_peers: withPeers,
      panel_size: panelSize,
      status: 'in_progress' as const,
      result: 'pending' as const,
      total_questions: planned.length,
      cover_letter_id: coverLetterId,
      hr_final_score: null,
      tech_final_score: null,
      exec_final_score: null,
      veto_role: null,
      elimination_question_id: null,
      duration_seconds: null,
      video_url: null,
      ended_at: null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: qError } = await supabase.from('session_questions').insert(
    planned.map((q, i) => ({
      session_id: session.id,
      question_id: q.questionId,
      question_text: q.text,
      asked_by_role: q.role,
      sequence: (i + 1) * SEQUENCE_STEP,
      is_follow_up: false,
      parent_session_question_id: null,
      audio_url: null,
      transcript: null,
      duration_seconds: null,
      filler_count: null,
      score_content: null,
      score_fluency: null,
      score_eye_contact: null,
      score_timing: null,
      score_expression: null,
      hr_delta: 0,
      tech_delta: 0,
      exec_delta: 0,
      hr_after: null,
      tech_after: null,
      exec_after: null,
      claude_feedback: null,
      ...(q.peers ? { peer_turns: q.peers } : {}),
      answered_at: null,
    }))
  );
  if (qError) throw qError;

  redirect(`/session/${session.id}`);
}
