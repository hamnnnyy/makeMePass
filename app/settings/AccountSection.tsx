'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { changePassword, deleteAccount, signOut, type ActionState } from '@/features/auth/server/account.server';

const input = 'rounded-lg bg-neutral-800 border border-neutral-700 focus:border-pink-500 outline-none px-3 py-2 text-sm';

function Message({ state }: { state: ActionState }) {
  if (!state) return null;
  return <p className={`text-xs ${state.error ? 'text-red-400' : 'text-emerald-400'}`} role="status">{state.error ?? state.ok}</p>;
}

export function AccountSection({ email }: { email: string }) {
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null);
  const [delState, delAction, delPending] = useActionState(deleteAccount, null);

  return (
    <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">계정</h2>
          <p className="text-xs text-neutral-500">{email}</p>
        </div>
        <form action={signOut}>
          <button className="text-xs rounded-full border border-neutral-600 hover:border-neutral-400 px-4 py-1.5">로그아웃</button>
        </form>
      </div>

      <form action={pwAction} className="flex flex-col gap-2">
        <h3 className="text-xs text-neutral-400">비밀번호 변경</h3>
        <input name="current" type="password" placeholder="현재 비밀번호" autoComplete="current-password" required className={input} />
        <input name="next" type="password" placeholder="새 비밀번호 (8자 이상, 특수문자 포함)" autoComplete="new-password" required className={input} />
        <input name="confirm" type="password" placeholder="새 비밀번호 확인" autoComplete="new-password" required className={input} />
        <div className="flex items-center justify-between gap-3">
          <Message state={pwState} />
          <button disabled={pwPending} className="ml-auto px-4 py-1.5 rounded-full bg-neutral-700 hover:bg-neutral-600 text-xs disabled:opacity-50">
            {pwPending ? '변경 중...' : '변경'}
          </button>
        </div>
      </form>

      <Link href="/privacy" className="text-xs text-neutral-500 hover:text-white transition-colors">개인정보처리방침</Link>

      <details className="group">
        <summary className="text-xs text-neutral-500 hover:text-red-400 cursor-pointer list-none">회원 탈퇴</summary>
        <form
          action={delAction}
          className="mt-3 flex flex-col gap-2 rounded-xl border border-red-900/60 bg-red-950/20 p-4"
          onSubmit={(e) => { if (!confirm('정말 탈퇴할까요? 모든 기록과 녹음이 삭제되며 되돌릴 수 없습니다.')) e.preventDefault(); }}
        >
          <p className="text-xs text-neutral-300">면접 기록, 녹음, 도감, 칭호가 모두 삭제되며 복구할 수 없습니다.</p>
          <input name="confirm" placeholder='확인을 위해 "탈퇴" 입력' required className={input} />
          <div className="flex items-center justify-between gap-3">
            <Message state={delState} />
            <button disabled={delPending} className="ml-auto px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-xs disabled:opacity-50">
              {delPending ? '삭제 중...' : '탈퇴하기'}
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}
