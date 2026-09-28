'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    // ?next=/settings 처럼 보호된 페이지에서 왔으면 그리로 돌려보낸다 (내부 경로만 허용)
    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-neutral-400">합사카에 오신 것을 환영합니다.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
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
              placeholder="비밀번호 입력"
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
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-orange-400 hover:text-orange-300 transition-colors">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
