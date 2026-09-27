import type { Database } from '@/types/supabase';

type Achievement = Database['public']['Tables']['achievements_master']['Row'];
type SessionResult = Database['public']['Tables']['interview_sessions']['Row']['result'];

interface CheckContext {
  sessionCount: number;                    // 완료(탈락 포함) 세션 수
  passCount: number;
  passCountByOrg: Record<string, number>;  // 기관 code → 합격 횟수
  eliminateCount: number;
  currentStreak: number;
  sessionResult: SessionResult;
  sessionMode: string;
  minScore: number;                        // 이번 세션 최소 호감도
}

// condition_type 은 achievements_master 에 들어 있는 값과 맞춘다
export function checkAchievements(
  all: Achievement[],
  unlocked: Set<string>,      // 이미 해금된 achievement.code
  ctx: CheckContext,
): Achievement[] {
  return all.filter((a) => {
    if (unlocked.has(a.code)) return false;

    const d = (a.condition_data ?? {}) as Record<string, number | string>;
    const n = (k: string, fallback = 1) => Number(d[k] ?? fallback);
    const passed = ctx.sessionResult === 'pass';

    switch (a.condition_type) {
      case 'session_count':     return ctx.sessionCount >= n('count');
      case 'pass_count':        return ctx.passCount >= n('count');
      case 'org_pass_count':    return (ctx.passCountByOrg[String(d.organization)] ?? 0) >= n('count');
      case 'unanimous_pass':    return passed && ctx.minScore >= n('min_score', 80);
      case 'mode_pass':         return passed && ctx.sessionMode === d.mode;
      case 'streak':            return ctx.currentStreak >= n('days');
      case 'instant_eliminate': return ctx.eliminateCount >= n('count');
      default:                  return false;
    }
  });
}
