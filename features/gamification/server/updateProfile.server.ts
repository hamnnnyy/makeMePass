'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { INTERVIEW_MODES, type InterviewMode } from '@/lib/constants/modes';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const name = String(formData.get('display_name') ?? '').trim();
  const mode = String(formData.get('preferred_mode') ?? '') as InterviewMode;
  if (name.length < 1 || name.length > 20) throw new Error('이름은 1~20자로 입력해 주세요.');
  if (!INTERVIEW_MODES.includes(mode)) throw new Error('알 수 없는 모드입니다.');

  const { error } = await createServiceClient()
    .from('profiles')
    .update({ display_name: name, preferred_mode: mode })
    .eq('id', user.id);
  if (error) throw error;

  revalidatePath('/', 'layout');
}
