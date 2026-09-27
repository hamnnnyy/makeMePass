import type { Database } from '@/types/supabase';

type Achievement = Database['public']['Tables']['achievements_master']['Row'];
type SessionResult = Database['public']['Tables']['interview_sessions']['Row']['result'];

interface CheckContext {
  sessionCount: number;       // 유저의 총 완료 세션 수
  passCount: number;          // 합격 횟수
  currentStreak: number;
  sessionResult: SessionResult;
  minScore: number;           // 이번 세션 최소 점수
}

export function checkAchievements(
  all: Achievement[],
  unlocked: Set<string>,      // 이미 해금된 achievement.code
  ctx: CheckContext,
): Achievement[] {
  return all.filter((a) => {
    if (unlocked.has(a.code)) return false;

    const d = (a.condition_data ?? {}) as Record<string, number>;

    switch (a.condition_type) {
      case 'first_session':  return ctx.sessionCount >= 1;
      case 'first_pass':     return ctx.passCount >= 1;
      case 'session_count':  return ctx.sessionCount >= (d.count ?? 1);
      case 'streak':         return ctx.currentStreak >= (d.days ?? 1);
      case 'score_all_high': return ctx.minScore >= (d.threshold ?? 80);
      default:               return false;
    }
  });
}
