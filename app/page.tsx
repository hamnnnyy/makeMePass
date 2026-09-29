import Link from 'next/link';
import { Users, ScanFace, Heart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { getPlayerStats } from '@/features/gamification/server/playerStats';
import { PlayerHub } from '@/features/gamification/components/PlayerHub';
import Image from 'next/image';
import { personaUrl } from '@/features/interviewer/components/Portrait';
import { PEERS } from '@/lib/constants/peers';
import { getPersonaNames } from '@/features/interviewer/personaNames';
import { ROLE_COLORS } from '@/lib/constants/roles';

// 실제 진행 순서
const STEPS = [
  { icon: Users, title: '기관과 면접관 고르기', desc: '공기업 7곳 중 지원할 곳과 현실·편안·압박·애니 네 가지 면접관 모드를 고릅니다.' },
  { icon: ScanFace, title: '3대1로 답하기', desc: '인사·직무·임원 면접관이 번갈아 묻습니다. 답변 내용과 시선·표정·시간을 함께 봅니다.' },
  { icon: Heart, title: '호감도 판정과 도감', desc: '들어온 면접관 모두 합격선을 넘기면 합격. 합격한 모드의 면접관은 도감에 모입니다.' },
];

// 랜딩 배경에 흐르는 카드. 앞줄은 크게·이름표, 뒷줄은 표정 그림을 작고 흐리게.
type Card = { file: string; name?: string; color: string };
const BACK_ROW: Card[] = [
  { file: 'cute-hr-happy', color: ROLE_COLORS.hr }, { file: 'cute-exec-happy', color: ROLE_COLORS.exec },
  { file: 'cute-tech-happy', color: ROLE_COLORS.tech }, { file: 'cute-hr-upset', color: ROLE_COLORS.hr },
  { file: 'cute-exec-upset', color: ROLE_COLORS.exec }, { file: 'cute-tech-upset', color: ROLE_COLORS.tech },
];

// 트랙을 두 번 이어 붙여 끊김 없이 돈다
function Marquee({ cards, className, duration }: { cards: Card[]; className: string; duration: string }) {
  return (
    <div className="flex w-max gap-5 animate-marquee" style={{ ['--marquee-duration' as string]: duration }}>
      {[...cards, ...cards].map((c, i) => (
        <div
          key={i}
          className={`relative shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 ${className}`}
          style={{ boxShadow: `0 0 0 2px ${c.color}, 0 20px 40px -12px ${c.color}88` }}
          aria-hidden={i >= cards.length}
        >
          <Image src={personaUrl(c.file)} alt="" fill sizes="200px" className="object-cover object-[50%_15%]" />
          {c.name && (
            <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-8 bg-gradient-to-t from-black via-black/70 to-transparent">
              <p className="font-display text-base drop-shadow" style={{ color: c.color }}>{c.name}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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

  const [names, casual] = await Promise.all([getPersonaNames(supabase, 'cute'), getPersonaNames(supabase, 'casual')]);
  const frontRow: Card[] = [
    { file: 'cute-hr', name: names.hr, color: ROLE_COLORS.hr },
    { file: 'peer-p2', name: `지원자 ${PEERS.p2.name}`, color: PEERS.p2.color },
    { file: 'cute-tech', name: names.tech, color: ROLE_COLORS.tech },
    { file: 'casual-hr', name: casual.hr, color: ROLE_COLORS.hr },
    { file: 'cute-exec', name: names.exec, color: ROLE_COLORS.exec },
    { file: 'peer-p1', name: `지원자 ${PEERS.p1.name}`, color: PEERS.p1.color },
  ];

  return (
    <main className="bg-night text-white">
      <section className="relative overflow-hidden min-h-[640px] md:min-h-[720px] flex items-center">
        {/* 뒷배경: 면접관 카드 두 줄이 비스듬히 오른쪽에서 왼쪽으로 흐른다 */}
        <div className="absolute inset-0 flex flex-col justify-center gap-6 -rotate-6 scale-110 pointer-events-none" aria-hidden>
          <Marquee cards={frontRow} className="w-40 md:w-52" duration="55s" />
          <Marquee cards={BACK_ROW} className="w-28 md:w-36 opacity-50" duration="80s" />
        </div>
        {/* 글자가 읽히도록 왼쪽(모바일은 전체)을 어둡게 */}
        <div className="absolute inset-0 pointer-events-none bg-night/75 md:bg-transparent md:bg-gradient-to-r md:from-night md:via-night/85 md:to-night/10" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_90%,#4a1530_0%,transparent_50%)] opacity-60" />
        <Navbar />
        <div className="relative w-full max-w-6xl mx-auto px-6 md:px-16 pt-28 pb-16 md:pt-32 md:pb-24">
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
