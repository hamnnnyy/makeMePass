import type { InterviewType } from '@/lib/constants/interviewTypes';
import { CRITERIA, type CriterionKey } from '@/lib/constants/criteria';

export type StatSession = { id: string; user_id: string; result: string; interview_type: InterviewType; started_at: string; org: string };
export type StatAnswer = {
  session_id: string;
  score_content: number | null;
  score_fluency: number | null;
  score_eye_contact: number | null;
  score_expression: number | null;
  score_timing: number | null;
  org_fit: number | null;
  criteria?: Partial<Record<CriterionKey, number>> | null;  // 답변 습관 (claude_feedback.criteria)
};

export const AREAS = [
  { key: 'score_content', label: '답변 내용', tip: '결론부터 말하고, 경험은 상황·행동·결과와 수치로 뒷받침해 보세요.' },
  { key: 'score_fluency', label: '전달력', tip: '군말(음, 어)을 줄이고 문장을 짧게 끊어 또박또박 말해 보세요. 음성 답변만 측정해요.' },
  { key: 'score_eye_contact', label: '시선 처리', tip: '카메라를 면접관 눈이라 생각하고 답변 내내 정면을 바라보세요.' },
  { key: 'score_expression', label: '표정', tip: '답변 시작과 끝에 가볍게 미소 짓고, 미간에 힘이 들어가지 않게 해 보세요.' },
  { key: 'score_timing', label: '답변 시간', tip: '일반 질문은 40~90초, 1분 자기소개는 50~70초를 목표로 연습해 보세요.' },
  { key: 'org_fit', label: '기관 적합도', tip: '지원 기관의 인재상·핵심가치·최근 현안을 답변에 한 번씩 연결해 보세요.' },
] as const;

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

// 끝난 면접(sessions)과 답변(answers)으로 대시보드 수치를 만든다
export function aggregate(sessions: StatSession[], answers: StatAnswer[]) {
  const ids = new Set(sessions.map((s) => s.id));
  const own = answers.filter((a) => ids.has(a.session_id));
  const passes = sessions.filter((s) => s.result === 'pass').length;

  const areas = AREAS.map((a) => {
    const xs = own.map((q) => q[a.key]).filter((v): v is number => typeof v === 'number');
    return { ...a, avg: avg(xs), n: xs.length };
  });
  // 표본이 너무 적은 영역은 약점으로 꼽지 않는다
  const weakestOf = <T extends { avg: number | null; n: number }>(xs: T[]) => xs.filter((a) => a.avg !== null && a.n >= 3).sort((a, b) => a.avg! - b.avg!)[0] ?? null;
  const weakest = weakestOf(areas);
  const habits = CRITERIA.map((c) => {
    const xs = own.map((q) => q.criteria?.[c.key]).filter((v): v is number => typeof v === 'number');
    return { ...c, avg: avg(xs), n: xs.length };
  });

  // 면접별 답변 내용 평균 (오래된 순, 최근 12회)
  const bySession = new Map<string, number[]>();
  for (const q of own) if (q.score_content !== null) bySession.set(q.session_id, [...(bySession.get(q.session_id) ?? []), q.score_content]);
  const trend = [...sessions]
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .filter((s) => bySession.has(s.id))
    .slice(-12)
    .map((s) => ({ id: s.id, date: s.started_at, result: s.result, avg: avg(bySession.get(s.id)!)! }));

  const group = <K extends string>(key: (s: StatSession) => K) => {
    const m = new Map<K, { count: number; passes: number }>();
    for (const s of sessions) {
      const g = m.get(key(s)) ?? { count: 0, passes: 0 };
      g.count++;
      if (s.result === 'pass') g.passes++;
      m.set(key(s), g);
    }
    return [...m].map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.count - a.count);
  };

  return {
    total: sessions.length,
    users: new Set(sessions.map((s) => s.user_id)).size,
    passes,
    passRate: sessions.length ? Math.round((passes / sessions.length) * 100) : 0,
    answered: own.length,
    areas,
    weakest,
    habits,
    weakestHabit: weakestOf(habits),
    trend,
    byType: group((s) => s.interview_type),
    byOrg: group((s) => s.org).slice(0, 5),
  };
}
