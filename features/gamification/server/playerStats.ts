import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import type { Database } from '@/types/supabase';
import { XP, levelInfo } from '../logic/level';

// 홈·결과·설정에서 쓰는 플레이어 기록. supabase 는 사용자 권한 클라이언트 (본인 세션만 보임).
export async function getPlayerStats(supabase: SupabaseClient<Database>, userId: string) {
  const admin = createServiceClient();
  const count = { count: 'exact', head: true } as const;
  const [sessions, answered, personas, personasTotal, titles, titlesTotal, streak, recent] = await Promise.all([
    supabase.from('interview_sessions').select('result, status').eq('user_id', userId),
    supabase.from('session_questions').select('id', count).not('answered_at', 'is', null),
    admin.from('user_unlocked_personas').select('persona_id', count).eq('user_id', userId),
    admin.from('interviewer_personas').select('id', count),
    admin.from('user_achievements').select('id', count).eq('user_id', userId),
    admin.from('achievements_master').select('id', count),
    supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', userId).maybeSingle(),
    supabase
      .from('interview_sessions')
      .select('id, result, status, mode, started_at, organizations(code)')
      .eq('user_id', userId)
      .neq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(3),
  ]);

  const rows = sessions.data ?? [];
  const finished = rows.filter((s) => s.status === 'completed' || s.status === 'eliminated').length;
  const passes = rows.filter((s) => s.result === 'pass').length;
  const xp = (answered.count ?? 0) * XP.answer + finished * XP.finish + passes * XP.pass;

  return {
    ...levelInfo(xp),
    finished,
    passes,
    streak: streak.data?.current_streak ?? 0,
    longestStreak: streak.data?.longest_streak ?? 0,
    personas: personas.count ?? 0,
    personasTotal: personasTotal.count ?? 0,
    titles: titles.count ?? 0,
    titlesTotal: titlesTotal.count ?? 0,
    recent: recent.data ?? [],
  };
}

export type PlayerStats = Awaited<ReturnType<typeof getPlayerStats>>;
