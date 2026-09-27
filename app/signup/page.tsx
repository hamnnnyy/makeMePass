'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return '특수문자를 포함해야 합니다.';
  return null;
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== checkPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message === 'User already registered'
        ? '이미 가입된 이메일입니다.'
        : '회원가입 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    router.push('/login?signup=success');
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-neutral-400">합사카 계정을 만들어보세요.</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="김춘자"
              required
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-600"
            />
            <label className="text-xs text-neutral-400">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상, 특수문자 포함"
              required
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400">비밀번호 확인</label>
            <input
              type="password"
              value={checkPassword}
              onChange={(e) => setCheckPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              required
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-600"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-orange-500 hover:bg-orange-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          이미 회원이신가요?{' '}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
