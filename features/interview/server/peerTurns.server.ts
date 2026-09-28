'use server';

import { generateWithFallback } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import { createClient } from '@/lib/supabase/server';
import { INTERVIEW_TYPE_INFO } from '@/lib/constants/interviewTypes';
import { PEERS, type PeerTurn } from '@/lib/constants/peers';
import { orgBrief } from '../logic/orgBrief';
import { stripNames } from '../logic/peerText';

// 다대다에서 AI 지원자 답변 수준을 섞는다. 늘 잘하거나 늘 못하면 비교가 안 된다.
const LEVELS = ['인상적인 답변 (구체적 경험과 수치, 기관 연결)', '평범한 답변 (무난하지만 구체성 부족)', '아쉬운 답변 (추상적이거나 질문 의도와 조금 어긋남)'];
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
// 모델이 길이를 넘기면 마지막 문장 끝에서 자른다 (음성으로 읽기 때문에 길면 흐름이 늘어진다)
const MAX_CHARS = 220;
function trim(text: string) {
  const t = text.trim();
  if (t.length <= MAX_CHARS) return t;
  const cut = t.slice(0, MAX_CHARS);
  const end = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('?'), cut.lastIndexOf('!'));
  return end > 60 ? cut.slice(0, end + 1) : `${cut}…`;
}

// 이 문항에서 사용자보다 먼저 말할 AI 지원자 발언. 이미 만들었으면 그대로 돌려준다(새로고침 대비).
// 토론·토의는 사용자의 직전 발언에 반응해야 해서 묻는 시점에 만든다.
export async function getPeerTurns(sessionQuestionId: string): Promise<Required<PeerTurn>[]> {
  const supabase = await createClient();
  const { data: sq } = await supabase
    .from('session_questions')
    .select('session_id, question_text, sequence, peer_turns')
    .eq('id', sessionQuestionId)
    .single();
  const plan = sq?.peer_turns ?? [];
  if (!sq || plan.length === 0) return [];
  if (plan.every((t) => t.text)) return plan as Required<PeerTurn>[];

  const [{ data: session }, { data: history }] = await Promise.all([
    supabase.from('interview_sessions')
      .select('interview_type, group_setup, organizations(name_ko, description, core_values, talent_profile)')
      .eq('id', sq.session_id)
      .single(),
    supabase.from('session_questions')
      .select('question_text, transcript, peer_turns')
      .eq('session_id', sq.session_id)
      .lt('sequence', sq.sequence)
      .order('sequence'),
  ]);
  if (!session) return [];
  const org = session.organizations as unknown as { name_ko: string; description: string | null; core_values: unknown; talent_profile: unknown };
  const setup = session.group_setup;
  const type = session.interview_type;

  const log = (history ?? []).map((h) => [
    `[진행] ${h.question_text}`,
    ...(h.peer_turns ?? []).filter((t) => t.text).map((t) => `[${PEERS[t.peer].name}] ${t.text}`),
    `[지원자(실제 사용자)] ${h.transcript || '(무응답)'}`,
  ].join('\n')).join('\n');

  const turns = plan.map((t) => ({
    ...t,
    guide: type === 'group' ? `${t.intent} — 이번에는 ${pick(LEVELS)}` : t.intent,
  }));

  const prompt = `${orgBrief(org)}\n\n위 기관 신입 공채 ${INTERVIEW_TYPE_INFO[type].label}에 함께 참여한 가상 지원자들의 발언을 쓰세요. 기관 정보를 아는 지원자답게 말하되, 지원자마다 이해 수준은 다르다.
실제 사람이 말하듯 구어체 존댓말로, 한 발언은 ${type === 'group' ? '20초 안팎(100~170자)' : '15초 안팎(70~130자)'}이고 이 글자 수를 넘기지 않는다.
누구도 이름을 말하지 않는다. 다른 사람은 ${type === 'debate' ? "'찬성 측 지원자님'처럼 편으로" : "'앞 지원자님'처럼"} 부르고, 평가받는 실제 지원자는 '지원자님'이라고 부른다.

[지원자 성격]
${turns.map((t) => `- ${t.peer} (${PEERS[t.peer].name}): ${PEERS[t.peer].style}`).join('\n')}
${setup ? `\n[${type === 'debate' ? '논제' : '과제'}] ${setup.topic}${setup.userSide ? `\n실제 지원자는 ${setup.userSide} 측, 가상 지원자들은 ${setup.peerSide} 측` : ''}` : ''}

[지금까지 진행]
${log || '(처음)'}

[이번 차례] ${sq.question_text}
다음 순서대로 발언을 하나씩 쓰세요:
${turns.map((t, i) => `${i + 1}. ${t.peer}: ${t.guide}`).join('\n')}`;

  const res = await generateWithFallback(MODELS.evaluation, {
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: { lines: { type: 'array', items: { type: 'string' }, minItems: turns.length, maxItems: turns.length } },
        required: ['lines'],
      },
      temperature: 0.9,
      httpOptions: { timeout: 12_000 },
    },
  });
  const lines = (JSON.parse(res.text ?? '{}') as { lines?: string[] }).lines ?? [];
  const filled = plan.map((t, i) => ({ ...t, text: trim(stripNames(lines[i] ?? '')) || '저도 같은 생각입니다.' }));

  await supabase.from('session_questions').update({ peer_turns: filled }).eq('id', sessionQuestionId);
  return filled;
}
