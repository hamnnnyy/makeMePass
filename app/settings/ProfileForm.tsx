'use client';

import { useActionState } from 'react';
import { INTERVIEW_MODES, MODE_LABELS, type InterviewMode } from '@/lib/constants/modes';
import { updateProfile } from '@/features/gamification/server/updateProfile.server';

export function ProfileForm({ name, mode }: { name: string; mode: InterviewMode }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-400">이름</span>
        <input
          name="display_name"
          defaultValue={name}
          maxLength={20}
          required
          className="rounded-lg bg-neutral-800 border border-neutral-700 focus:border-pink-500 outline-none px-3 py-2 text-sm"
        />
      </label>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs text-neutral-400 mb-1.5">기본 면접 모드</legend>
        <div className="grid grid-cols-4 gap-2">
          {INTERVIEW_MODES.map((m) => (
            <label key={m} className="cursor-pointer">
              <input type="radio" name="preferred_mode" value={m} defaultChecked={mode === m} className="peer sr-only" />
              <span className="block text-center text-xs rounded-lg py-2 bg-neutral-800 peer-checked:bg-pink-500 peer-focus-visible:ring-2 ring-white">
                {MODE_LABELS[m]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center justify-between gap-3">
        {state && (
          <p role="status" className={`text-xs ${state.error ? 'text-red-400' : 'text-emerald-400'}`}>{state.error ?? state.ok}</p>
        )}
        <button disabled={pending} className="ml-auto px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-400 text-sm font-medium disabled:opacity-50">
          {pending ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
