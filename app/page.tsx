import Link from 'next/link';
import { Users, ScanFace, Heart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { InterviewerSceneClient } from '@/features/visualizer/scenes/InterviewerSceneClient';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { getPlayerStats } from '@/features/gamification/server/playerStats';
import { PlayerHub } from '@/features/gamification/components/PlayerHub';

const FEATURES = [
  { icon: Users, title: '3대1 다대일 면접', desc: '인사·직무·임원 면접관 세 명이 동시에 평가하는 실전 구성' },
  { icon: ScanFace, title: '비언어 분석', desc: '시선, 표정, 자세, 답변 시간을 실시간으로 측정' },
  { icon: Heart, title: '면접관 도감', desc: '세 면접관의 호감도를 합격선까지 채우면 합격. 합격한 면접관은 도감에 수집' },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let hub = null;
  if (user) {
    const [stats, { data: profile }] = await Promise.all([
      getPlayerStats(supabase, user.id),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);
    const { data: title } = profile?.equipped_achievement_id
      ? await createServiceClient().from('achievements_master').select('name_ko').eq('id', profile.equipped_achievement_id).maybeSingle()
      : { data: null };
    hub = <PlayerHub stats={stats} name={profile?.display_name ?? '사용자'} title={title?.name_ko ?? null} />;
  }

  return (
    <main className="bg-[#111111] text-white">
      <section className="relative h-[60vh] min-h-[360px] overflow-hidden">
        <Navbar />
        <div className="absolute inset-0">
          <InterviewerSceneClient color="#ffd18a" controls={false} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-center">Future is Conversation</h1>
          <Link
            href="/setup"
            className="pointer-events-auto px-7 py-3 rounded-full bg-orange-500 hover:bg-orange-400 transition-colors text-sm font-medium"
          >
            면접 시작하기
          </Link>
        </div>
      </section>

      {hub}

      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-12">01. Why us?</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <Icon className="w-9 h-9" aria-hidden />
              <h3 className="text-lg">{title}</h3>
              <p className="text-sm text-neutral-400 max-w-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
