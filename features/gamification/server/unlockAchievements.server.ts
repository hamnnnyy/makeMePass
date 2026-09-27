'use server';

import { createClient } from '@/lib/supabase/server';
import { checkAchievements } from '../logic/achievementCheck';
import { computeNewStreak } from '../logic/streakUpdater';
import type { GamificationResult } from '../types';

export async function unlockAchievements(sessionId: string): Promise<GamificationResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newAchievements: [], newStreak: 0, isNewRecord: false };

  // 이번 세션 정보
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('result, hr_final_score, tech_final_score, exec_final_score')
    .eq('id', sessionId)
    .single();

  if (!session) return { newAchievements: [], newStreak: 0, isNewRecord: false };

  // 유저 통계
  const { data: allSessions } = await supabase
    .from('interview_sessions')
    .select('result')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const sessionCount = allSessions?.length ?? 0;
  const passCount = allSessions?.filter((s) => s.result === 'pass').length ?? 0;
  const minScore = Math.min(
    session.hr_final_score ?? 50,
    session.tech_final_score ?? 50,
    session.exec_final_score ?? 50,
  );

  // 스트릭 조회/업데이트
  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { newStreak, longestStreak, isNewRecord } = computeNewStreak(
    streak?.current_streak ?? 0,
    streak?.longest_streak ?? 0,
    streak?.last_practiced_at ?? null,
  );

  await supabase.from('streaks').upsert({
    user_id: user.id,
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_practiced_at: new Date().toISOString(),
    freeze_tokens: streak?.freeze_tokens ?? 0,
  }, { onConflict: 'user_id' });

  // 업적 체크
  const { data: allAchievements } = await supabase
    .from('achievements_master')
    .select('*');

  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, achievements_master(code)')
    .eq('user_id', user.id);

  const unlockedCodes = new Set(
    userAchievements?.map((ua) => (ua.achievements_master as any)?.code as string).filter(Boolean) ?? []
  );

  const toUnlock = checkAchievements(allAchievements ?? [], unlockedCodes, {
    sessionCount,
    passCount,
    currentStreak: newStreak,
    sessionResult: session.result,
    minScore,
  });

  if (toUnlock.length > 0) {
    await supabase.from('user_achievements').insert(
      toUnlock.map((a) => ({
        user_id: user.id,
        achievement_id: a.id,
        unlock_session_id: sessionId,
      }))
    );
  }

  return {
    newAchievements: toUnlock.map((a) => ({
      code: a.code,
      name_ko: a.name_ko,
      icon: a.icon,
      rarity: a.rarity,
    })),
    newStreak,
    isNewRecord,
  };
}
