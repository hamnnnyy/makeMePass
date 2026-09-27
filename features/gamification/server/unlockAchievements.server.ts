'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { checkAchievements } from '../logic/achievementCheck';
import { computeNewStreak } from '../logic/streakUpdater';
import type { GamificationResult } from '../types';

export async function unlockAchievements(sessionId: string): Promise<GamificationResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newAchievements: [], collected: [], newStreak: 0, isNewRecord: false };

  // 이번 세션 정보
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('result, mode, ended_at, hr_final_score, tech_final_score, exec_final_score')
    .eq('id', sessionId)
    .single();

  if (!session) return { newAchievements: [], collected: [], newStreak: 0, isNewRecord: false };

  // 유저 통계
  const { data: allSessions } = await supabase
    .from('interview_sessions')
    .select('result, organizations(code)')
    .eq('user_id', user.id)
    .in('status', ['completed', 'eliminated']);

  const sessions = allSessions ?? [];
  const sessionCount = sessions.length;
  const passes = sessions.filter((s) => s.result === 'pass');
  const passCountByOrg: Record<string, number> = {};
  for (const s of passes) {
    const code = s.organizations?.code;
    if (code) passCountByOrg[code] = (passCountByOrg[code] ?? 0) + 1;
  }
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
    last_practiced_at: new Date().toISOString().slice(0, 10), // date 컬럼
    freeze_tokens: streak?.freeze_tokens ?? 0,
  }, { onConflict: 'user_id' });

  // 업적 체크. 숨김 업적은 RLS 로 사용자에게 안 보이므로 service role 로 읽고 쓴다.
  // (세션 소유는 위에서 사용자 권한 조회로 확인됨)
  const admin = createServiceClient();
  const [{ data: allAchievements }, { data: userAchievements }] = await Promise.all([
    admin.from('achievements_master').select('*'),
    admin.from('user_achievements').select('achievements_master(code)').eq('user_id', user.id),
  ]);

  const unlockedCodes = new Set(
    (userAchievements ?? []).map((ua) => ua.achievements_master?.code).filter((c): c is string => !!c)
  );

  const toUnlock = checkAchievements(allAchievements ?? [], unlockedCodes, {
    sessionCount,
    passCount: passes.length,
    passCountByOrg,
    eliminateCount: sessions.filter((s) => s.result === 'fail_eliminate').length,
    currentStreak: newStreak,
    sessionResult: session.result,
    sessionMode: session.mode,
    minScore,
  });

  if (toUnlock.length > 0) {
    await admin.from('user_achievements').insert(
      toUnlock.map((a) => ({ user_id: user.id, achievement_id: a.id, unlock_session_id: sessionId }))
    );
  }

  // 결과 페이지가 다시 렌더돼도 같은 칭호가 보이도록 "이 세션에서 해금된 것"을 조회해서 반환
  const { data: earned } = await admin
    .from('user_achievements')
    .select('achievements_master(code, name_ko, icon, rarity)')
    .eq('user_id', user.id)
    .eq('unlock_session_id', sessionId);

  // 도감: 합격하면 이 모드의 면접관 3명을 수집. 이미 있으면 그대로 두고,
  // 세션 종료 이후에 들어온 것만 NEW 로 표시해서 다시 렌더해도 결과가 같다.
  let collected: GamificationResult['collected'] = [];
  if (session.result === 'pass') {
    const { data: personas } = await admin
      .from('interviewer_personas')
      .select('id, role, label_ko')
      .eq('mode', session.mode);
    const ids = (personas ?? []).map((p) => p.id);
    await admin.from('user_unlocked_personas').upsert(
      ids.map((persona_id) => ({ user_id: user.id, persona_id })),
      { onConflict: 'user_id,persona_id', ignoreDuplicates: true },
    );
    const { data: owned } = await admin
      .from('user_unlocked_personas')
      .select('persona_id, unlocked_at')
      .eq('user_id', user.id)
      .in('persona_id', ids);
    const since = new Date(session.ended_at ?? 0).getTime();
    collected = (personas ?? []).map((p) => ({
      role: p.role,
      label_ko: p.label_ko,
      isNew: (owned ?? []).some((o) => o.persona_id === p.id && new Date(o.unlocked_at).getTime() >= since),
    }));
  }

  return {
    collected,
    newAchievements: (earned ?? []).flatMap((e) => (e.achievements_master ? [e.achievements_master] : [])),
    newStreak,
    isNewRecord,
  };
}
