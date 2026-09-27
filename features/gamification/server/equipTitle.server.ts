'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';

// 획득한 칭호만 장착할 수 있다. null 이면 해제.
export async function equipTitle(achievementId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const admin = createServiceClient();
  if (achievementId) {
    const { data: owned } = await admin
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .maybeSingle();
    if (!owned) throw new Error('획득하지 않은 칭호입니다.');
  }

  const { error } = await admin.from('profiles').update({ equipped_achievement_id: achievementId }).eq('id', user.id);
  if (error) throw error;

  revalidatePath('/collection');
  revalidatePath('/');
}
