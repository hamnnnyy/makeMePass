'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { validatePassword } from '@/lib/utils/password';

export type ActionState = { error?: string; ok?: string } | null;

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: '로그인이 필요합니다.' };

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  if (next !== String(formData.get('confirm') ?? '')) return { error: '새 비밀번호가 일치하지 않습니다.' };
  const invalid = validatePassword(next);
  if (invalid) return { error: invalid };

  // 현재 비밀번호 확인 (세션만 탈취된 경우를 막는다)
  const { error: wrong } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (wrong) return { error: '현재 비밀번호가 올바르지 않습니다.' };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message.includes('different') ? '기존과 다른 비밀번호를 입력해 주세요.' : '비밀번호를 바꾸지 못했습니다.' };
  return { ok: '비밀번호를 변경했습니다.' };
}

// 회원 탈퇴: 녹음 파일과 모든 기록을 지우고 계정을 삭제한다. 되돌릴 수 없다.
export async function deleteAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };
  if (String(formData.get('confirm') ?? '').trim() !== '탈퇴') return { error: '확인란에 "탈퇴"를 입력해 주세요.' };

  const admin = createServiceClient();
  const uid = user.id;

  // 녹음: {uid}/{sessionId}/{questionId}.wav
  const { data: folders } = await admin.storage.from('session-audio').list(uid);
  for (const folder of folders ?? []) {
    const { data: files } = await admin.storage.from('session-audio').list(`${uid}/${folder.name}`);
    const paths = (files ?? []).map((f) => `${uid}/${folder.name}/${f.name}`);
    if (paths.length) await admin.storage.from('session-audio').remove(paths);
  }

  // FK 에 ON DELETE CASCADE 가 없어서 참조하는 쪽부터 지운다
  const { data: sessions } = await admin.from('interview_sessions').select('id').eq('user_id', uid);
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const steps = [
    admin.from('daily_challenges').delete().eq('user_id', uid),
    admin.from('user_achievements').delete().eq('user_id', uid),
    admin.from('user_unlocked_personas').delete().eq('user_id', uid),
    admin.from('streaks').delete().eq('user_id', uid),
  ];
  for (const step of steps) {
    const { error } = await step;
    if (error) return { error: '탈퇴 처리 중 오류가 발생했습니다.' };
  }
  if (sessionIds.length) {
    const { error } = await admin.from('session_questions').delete().in('session_id', sessionIds);
    if (error) return { error: '탈퇴 처리 중 오류가 발생했습니다.' };
  }
  for (const step of [
    admin.from('interview_sessions').delete().eq('user_id', uid),
    admin.from('cover_letters').delete().eq('user_id', uid),
    admin.from('questions').update({ created_by: null }).eq('created_by', uid),
    admin.from('profiles').delete().eq('id', uid),
  ]) {
    const { error } = await step;
    if (error) return { error: '탈퇴 처리 중 오류가 발생했습니다.' };
  }

  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) return { error: '계정을 삭제하지 못했습니다.' };

  await supabase.auth.signOut();
  redirect('/');
}
