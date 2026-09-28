import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPlayerStats } from '@/features/gamification/server/playerStats';
import { LevelBar } from '@/features/gamification/components/LevelBar';
import { OrbColorPicker } from './OrbColorPicker';
import { AccountSection } from './AccountSection';
import { ProfileForm } from './ProfileForm';

// 프로필·꾸미기·계정: 이름·기본 모드·구슬 색·비밀번호·로그아웃·탈퇴 (칭호는 도감에서 장착)
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/settings');

  const [stats, { data: profile }] = await Promise.all([
    getPlayerStats(supabase, user.id),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  ]);

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 md:px-8 py-6 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-400 hover:text-white transition-colors">← 홈</Link>
        <h1 className="text-sm font-medium">프로필 · 설정</h1>
        <div className="w-12" />
      </div>

      <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
        <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
          <LevelBar level={stats.level} into={stats.into} need={stats.need} />
          <p className="text-[11px] text-neutral-500 mt-2">답변 +10 · 완주 +30 · 합격 +100 XP. 레벨이 오르면 새 구슬 색이 해금됩니다.</p>
        </section>

        <ProfileForm name={profile?.display_name ?? ''} mode={profile?.preferred_mode ?? 'realistic'} />

        <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold">면접관 구슬 색</h2>
            <p className="text-[11px] text-neutral-500">숫자가 적힌 색은 해당 레벨에 해금됩니다. 이 브라우저에 저장됩니다.</p>
          </div>
          <OrbColorPicker level={stats.level} />
        </section>

        <Link href="/collection?tab=titles" className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 text-sm hover:bg-neutral-800 flex justify-between">
          <span>칭호 장착</span>
          <span className="text-neutral-500">{stats.titles} / {stats.titlesTotal} →</span>
        </Link>

        <AccountSection email={user.email ?? ''} />
      </div>
    </div>
  );
}
