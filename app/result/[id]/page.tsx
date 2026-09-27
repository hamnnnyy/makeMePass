import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/roles';
import type { InterviewerRole } from '@/lib/constants/roles';
import { unlockAchievements } from '@/features/gamification/server/unlockAchievements.server';
import { AchievementToast } from '@/features/gamification/components/AchievementToast';

const RESULT_CONFIG = {
  pass:       { label: '합격',   color: '#22c55e', desc: '모든 면접관의 신뢰를 얻었습니다.' },
  fail:       { label: '불합격', color: '#ef4444', desc: '아쉽지만 이번엔 인연이 닿지 않았습니다.' },
  veto:       { label: '거부권', color: '#f97316', desc: '한 면접관이 강하게 반대했습니다.' },
  eliminated: { label: '탈락',   color: '#6b7280', desc: '면접 도중 탈락 기준에 도달했습니다.' },
  pending:    { label: '집계 중', color: '#a3a3a3', desc: '결과를 집계하고 있습니다.' },
} as const;

const ROLE_ORDER: InterviewerRole[] = ['hr', 'tech', 'exec'];

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session }, { data: questions }, gamification] = await Promise.all([
    supabase
      .from('interview_sessions')
      .select('*, organizations(name_ko, pass_threshold, veto_threshold, eliminate_threshold)')
      .eq('id', id)
      .single(),
    supabase
      .from('session_questions')
      .select('sequence, question_text, asked_by_role, hr_after, tech_after, exec_after, claude_feedback, answered_at')
      .eq('session_id', id)
      .order('sequence'),
    unlockAchievements(id),
  ]);

  if (!session) return (
    <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
      <p className="text-neutral-400">세션을 찾을 수 없습니다.</p>
    </div>
  );

  const result = session.result ?? 'pending';
  const cfg = RESULT_CONFIG[result];
  const org = (session as any).organizations as { name_ko: string; pass_threshold: number; veto_threshold: number; eliminate_threshold: number } | null;

  const scores: Record<InterviewerRole, number | null> = {
    hr:   session.hr_final_score,
    tech: session.tech_final_score,
    exec: session.exec_final_score,
  };

  const durationMin = session.duration_seconds
    ? Math.floor(session.duration_seconds / 60)
    : null;

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col px-6 py-10 max-w-xl mx-auto gap-8">

      {/* Result header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-4"
          style={{ borderColor: cfg.color, color: cfg.color }}
        >
          {result === 'pass' ? '✓' : result === 'eliminated' ? '✕' : '!'}
        </div>
        <h1 className="text-3xl font-bold" style={{ color: cfg.color }}>{cfg.label}</h1>
        <p className="text-sm text-neutral-400">{cfg.desc}</p>
        {org && (
          <p className="text-xs text-neutral-600">{org.name_ko} · {session.mode}</p>
        )}
      </div>

      {/* Score bars */}
      <div className="bg-neutral-900 rounded-2xl px-5 py-4 flex flex-col gap-4">
        <h2 className="text-xs text-neutral-500 font-medium uppercase tracking-widest">최종 호감도</h2>
        {ROLE_ORDER.map((role) => {
          const score = scores[role] ?? 50;
          const threshold = org?.pass_threshold ?? 70;
          return (
            <div key={role} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: ROLE_COLORS[role] }}>
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm font-bold">{Math.round(score)}%</span>
              </div>
              <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, backgroundColor: ROLE_COLORS[role] }}
                />
                {/* Pass threshold marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/30"
                  style={{ left: `${threshold}%` }}
                />
              </div>
            </div>
          );
        })}
        {org && (
          <p className="text-xs text-neutral-600 text-right">
            합격선 {org.pass_threshold}% · 거부권 {org.veto_threshold}% · 탈락 {org.eliminate_threshold}%
          </p>
        )}
      </div>

      {/* Question summary */}
      {questions && questions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 font-medium uppercase tracking-widest">질문 요약</h2>
          {questions.map((q) => {
            const fb = (q.claude_feedback as { feedback?: string } | null)?.feedback;
            return (
              <div key={q.sequence} className="bg-neutral-900 rounded-xl px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: ROLE_COLORS[q.asked_by_role as InterviewerRole] }}>
                    {ROLE_LABELS[q.asked_by_role as InterviewerRole]}
                  </span>
                  <span className="text-xs text-neutral-600">Q{q.sequence}</span>
                  {!q.answered_at && (
                    <span className="text-xs text-neutral-600 ml-auto">미답변</span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{q.question_text}</p>
                {fb && (
                  <p className="text-xs text-orange-400 mt-0.5">{fb}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {/* 업적 토스트 */}
      <AchievementToast achievements={gamification.newAchievements} />

      {/* 스트릭 */}
      {gamification.newStreak > 0 && (
        <div className="bg-neutral-900 rounded-2xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-neutral-400">연속 학습</span>
          <span className="text-sm font-bold text-orange-400">
            {gamification.newStreak}일째
            {gamification.isNewRecord && ' 🏆 최고 기록!'}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <Link
          href="/setup"
          className="w-full py-3 bg-orange-500 hover:bg-orange-400 transition-colors text-white text-sm font-medium rounded-full text-center"
        >
          다시 시작
        </Link>
        <Link
          href="/"
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 transition-colors text-neutral-300 text-sm font-medium rounded-full text-center"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
