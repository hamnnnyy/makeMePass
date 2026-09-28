import Link from 'next/link';
import { Users, ScanFace, Heart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { getPlayerStats } from '@/features/gamification/server/playerStats';
import { PlayerHub } from '@/features/gamification/components/PlayerHub';
import { Portrait } from '@/features/interviewer/components/Portrait';
import { getPersonaNames } from '@/features/interviewer/personaNames';
import { ROLE_COLORS } from '@/lib/constants/roles';

// 실제 진행 순서
const STEPS = [
  { icon: Users, title: '기관과 면접관 고르기', desc: '공기업 7곳 중 지원할 곳과 현실·편안·압박·애니 네 가지 면접관 모드를 고릅니다.' },
  { icon: ScanFace, title: '3대1로 답하기', desc: '인사·직무·임원 면접관이 번갈아 묻습니다. 답변 내용과 시선·표정·시간을 함께 봅니다.' },
  { icon: Heart, title: '호감도 판정과 도감', desc: '세 명 모두 합격선을 넘기면 합격. 합격한 모드의 면접관은 도감에 모입니다.' },
];

const LINEUP = [
  { role: 'hr', tilt: '-rotate-6 translate-y-6', align: 'text-left' },
  { role: 'exec', tilt: 'z-10 scale-110', align: 'text-center' },
  { role: 'tech', tilt: 'rotate-6 translate-y-6', align: 'text-right' },
] as const;

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

  const names = await getPersonaNames(supabase, 'cute');

  return (
    <main className="bg-night text-white">
      <section className="relative overflow-hidden">
        <Navbar />
        {/* 은은한 무대 조명 */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_70%_40%,#3b1d5e_0%,transparent_55%),radial-gradient(ellipse_at_20%_90%,#4a1530_0%,transparent_50%)] opacity-70" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-16 pt-28 pb-16 md:pt-32 md:pb-24 grid md:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
              합격은<br />사심입니까?
            </h1>
            <p className="text-neutral-300 max-w-md leading-relaxed">
              세 면접관의 호감도를 합격선까지 채우면 합격입니다.
              공기업 실전 질문으로 3대1 모의면접을 치러 보세요.
            </p>
            <div className="flex gap-3">
              <Link
                href="/setup"
                className="px-7 py-3.5 rounded-full bg-pink-500 hover:bg-pink-400 transition-colors font-medium shadow-[0_8px_30px_-6px_#ff4f8b]"
              >
                면접 시작하기
              </Link>
              <Link href="/collection" className="px-6 py-3.5 rounded-full border border-neutral-600 hover:border-neutral-400 transition-colors text-neutral-200">
                면접관 도감
              </Link>
            </div>
          </div>

          {/* 씹덕 모드 면접관 라인업 */}
          <div className="flex justify-center -space-x-6 md:-space-x-8 pb-6">
            {LINEUP.map(({ role, tilt, align }) => (
              <div
                key={role}
                className={`relative w-32 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl ${tilt}`}
                style={{ boxShadow: `0 0 0 2px ${ROLE_COLORS[role]}, 0 20px 50px -10px ${ROLE_COLORS[role]}66` }}
              >
                <Portrait mode="cute" role={role} sizes="(max-width: 768px) 128px, 192px" fallback={null} />
                <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-black via-black/70 to-transparent pt-8">
                  <p className={`font-display text-sm md:text-base drop-shadow ${align}`} style={{ color: ROLE_COLORS[role] }}>{names[role]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hub}

      <section className="px-6 md:px-16 py-20 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl mb-10">면접은 이렇게 진행돼요</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl text-pink-400">{i + 1}</span>
                <Icon className="w-5 h-5 text-neutral-400" aria-hidden />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
