import Link from 'next/link';
import { Users, ScanFace, Heart, MessageSquareText, Mic, Eye, Smile, Timer, Building2, ShieldAlert } from 'lucide-react';
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
import { INTERVIEW_TYPES, INTERVIEW_TYPE_INFO } from '@/lib/constants/interviewTypes';
import { MODE_ACCENT, MODE_LABELS, type InterviewMode } from '@/lib/constants/modes';
import { LOGOS } from '@/lib/constants/orgLogos';

// 실제 진행 순서
const STEPS = [
  { icon: Users, title: '기관과 면접 방식 고르기', desc: '공기업·공공기관 중 지원할 곳, 면접관 모드, 면접 유형과 형식(면접관 수·AI 지원자·언어)을 고릅니다.' },
  { icon: ScanFace, title: '카메라 앞에서 답하기', desc: '면접관이 목소리로 묻고, 답변 내용과 시선·표정·시간을 함께 봅니다. 말하기 어려우면 텍스트로도 답할 수 있어요.' },
  { icon: Heart, title: '호감도 판정과 복기', desc: '들어온 면접관 모두 합격선을 넘기면 합격. 문항마다 면접관 속마음과 득실 이유를 복기하고, 합격하면 도감에 모읍니다.' },
];

// 면접관 모드 (그림이 있는 모드는 대표 면접관을 보여준다)
const MODES: { mode: InterviewMode; desc: string; image?: string }[] = [
  { mode: 'cute', desc: '일본 애니 풍 캐릭터 면접관 1기·2기. 답변에 따라 표정이 바뀌고 속마음이 들려요.', image: 'cute-exec' },
  { mode: 'casual', desc: '선배처럼 편하게 이끌어 주는 면접관. 첫 연습에 좋아요.', image: 'casual-hr' },
  { mode: 'realistic', desc: '실제 공기업 면접처럼 담담하고 사무적인 면접관.' },
  { mode: 'boss', desc: '날카로운 꼬리질문으로 몰아붙이는 압박 면접관.' },
];

// 평가 항목
const CRITERIA = [
  { icon: MessageSquareText, title: '답변 내용', desc: '질문 의도, 구체성(경험·수치), 논리 구조' },
  { icon: Mic, title: '전달력', desc: '발음, 말 속도, 머뭇거림과 군말' },
  { icon: Eye, title: '시선', desc: '카메라(면접관)를 바라본 시간' },
  { icon: Smile, title: '표정·자세', desc: '미소, 굳은 인상, 긴장, 흔들림' },
  { icon: Timer, title: '답변 시간', desc: '질문별 권장 길이와 첫 마디까지 걸린 시간' },
  { icon: Building2, title: '기관 적합도', desc: '인재상·핵심가치·사업·현안과의 연결' },
];

const FORMATS = ['면접관 3명 · 1명', 'AI 지원자와 다대다', '영어로 진행', '자소서 기반 질문', 'PT 준비 2분 · 발표 3분'];

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

  // 기관·질문 수는 공개 정보라 service role 로 센다 (비로그인 방문자에게도 보여 준다)
  const admin = createServiceClient();
  const [names, names2, casual, { count: orgCount }, { count: questionCount }] = await Promise.all([
    getPersonaNames(supabase, 'cute'),
    getPersonaNames(supabase, 'cute', 2),
    getPersonaNames(supabase, 'casual'),
    admin.from('organizations').select('id', { count: 'exact', head: true }),
    admin.from('questions').select('id', { count: 'exact', head: true }),
  ]);
  const logos = Object.entries(LOGOS);
  const frontRow: Card[] = [
    { file: 'cute-hr', name: names.hr, color: ROLE_COLORS.hr },
    { file: 'peer-p2', name: `지원자 ${PEERS.p2.name}`, color: PEERS.p2.color },
    { file: 'cute-tech', name: names.tech, color: ROLE_COLORS.tech },
    { file: 'casual-hr', name: casual.hr, color: ROLE_COLORS.hr },
    { file: 'cute-exec', name: names.exec, color: ROLE_COLORS.exec },
    { file: 'peer-p1', name: `지원자 ${PEERS.p1.name}`, color: PEERS.p1.color },
    { file: 'cute-hr2', name: names2.hr, color: ROLE_COLORS.hr },
    { file: 'cute-tech2', name: names2.tech, color: ROLE_COLORS.tech },
    { file: 'cute-exec2', name: names2.exec, color: ROLE_COLORS.exec },
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
              면접관의 호감도를 합격선까지 채우면 합격입니다.
              공기업·공공기관 실전 질문으로 모의면접을 치러 보세요.
            </p>
            <dl className="flex gap-6 text-center md:text-left">
              {[[`${orgCount ?? 0}곳`, '기관'], [`${questionCount ?? 0}개`, '질문'], [`${INTERVIEW_TYPES.length}가지`, '면접 유형']].map(([v, k]) => (
                <div key={k}>
                  <dt className="text-[11px] text-neutral-400">{k}</dt>
                  <dd className="font-display text-2xl text-pink-300 tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
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

      {/* 면접 유형과 형식 */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl mb-3">실제 전형 그대로</h2>
        <p className="text-neutral-400 mb-8">유형을 고르고, 면접관 수·AI 지원자·언어를 따로 조합해요.</p>
        <ul className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {INTERVIEW_TYPES.map((t) => (
            <li key={t} className="rounded-2xl bg-neutral-900 border border-neutral-800 px-4 py-4 flex flex-col gap-1.5">
              <p className="font-bold">{INTERVIEW_TYPE_INFO[t].label}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{INTERVIEW_TYPE_INFO[t].desc}</p>
            </li>
          ))}
          <li className="rounded-2xl border border-dashed border-pink-500/50 bg-pink-500/5 px-4 py-4 flex flex-col gap-2">
            <p className="font-bold text-pink-300">+ 형식 조합</p>
            <ul className="flex flex-wrap gap-1.5">
              {FORMATS.map((f) => <li key={f} className="text-[11px] rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-300">{f}</li>)}
            </ul>
          </li>
        </ul>
      </section>

      {/* 면접관 모드 */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl mb-3">면접관 모드</h2>
        <p className="text-neutral-400 mb-8">같은 질문도 누가 묻느냐에 따라 달라요. 합격하면 그 모드의 면접관이 도감에 모입니다.</p>
        <ul className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {MODES.map(({ mode, desc, image }) => (
            <li key={mode} className="rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex flex-col">
              <div className="relative aspect-[4/3]" style={{ background: `radial-gradient(circle at 50% 40%, ${MODE_ACCENT[mode]}55, transparent 70%)` }}>
                {image ? (
                  <Image src={personaUrl(image)} alt="" fill sizes="(max-width: 768px) 50vw, 280px" className="object-cover object-[50%_20%]" />
                ) : (
                  <Image src={`/modes/${mode}.png`} alt="" width={72} height={72} className="absolute inset-0 m-auto opacity-80" />
                )}
              </div>
              <div className="p-4 flex flex-col gap-1.5">
                <p className="font-display text-lg" style={{ color: MODE_ACCENT[mode] }}>{MODE_LABELS[mode]}</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 평가 항목 + 복기 미리보기 */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto grid gap-10 md:grid-cols-[1fr_22rem] items-start">
        <div>
          <h2 className="font-display text-3xl mb-3">무엇을 보나요</h2>
          <p className="text-neutral-400 mb-8">AI가 음성과 카메라로 실제 면접관처럼 평가해요. 카메라 영상은 저장하지 않고 시선·표정 수치만 씁니다.</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CRITERIA.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 flex gap-3">
                <Icon className="size-5 text-pink-400 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-bold text-sm">{title}</p>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" aria-hidden />
            블라인드 면접처럼 출신 학교·지역·가족 정보를 말하면 실격이에요.
          </p>
        </div>
        {/* 복기 화면의 '면접관 속마음' 예시 */}
        <figure className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-4" aria-label="복기 화면 예시">
          <figcaption className="text-xs text-neutral-500 tracking-widest">복기 미리보기</figcaption>
          <p className="text-sm">Q2. 우리 기관에 지원하신 동기를 말씀해 주십시오.</p>
          {([['cute-exec-happy', names.exec, ROLE_COLORS.exec, '+6', '사업 구조까지 알아 왔네요? 조금은 인정해 줄게요.'],
             ['cute-tech-upset', names.tech, ROLE_COLORS.tech, '-3', '수치가 하나도 없잖아. 다음엔 근거부터.']] as const).map(([file, name, color, d, line]) => (
            <div key={file} className="flex items-end gap-2">
              <span className="relative size-10 rounded-full overflow-hidden shrink-0 bg-neutral-800" style={{ boxShadow: `0 0 0 1.5px ${color}` }}>
                <Image src={personaUrl(file)} alt="" fill sizes="80px" className="object-cover object-[50%_20%] scale-[2] origin-[50%_28%]" />
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-bold" style={{ color }}>{name} <span className={d.startsWith('+') ? 'text-pink-400' : 'text-sky-400'}>{d.startsWith('+') ? `♥ ${d}` : `💔 ${d}`}</span></span>
                <p className="text-sm bg-neutral-800 rounded-2xl rounded-bl-sm px-3 py-2 leading-relaxed">{line}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-800 pt-3">
            <span className="text-pink-400">고칠 점</span> 지원 동기에 기관 최근 사업 한 가지를 수치와 함께 연결해 보세요.
          </p>
        </figure>
      </section>

      {/* 기관 로고 */}
      <section className="py-16">
        <div className="px-6 md:px-16 max-w-6xl mx-auto mb-8">
          <h2 className="font-display text-3xl mb-3">기관별 맞춤 면접</h2>
          <p className="text-neutral-400">기관마다 인재상·핵심가치·주요 사업·최근 현안과 기출 질문을 반영해요.</p>
        </div>
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]" aria-hidden>
          <div className="flex w-max gap-4 animate-marquee" style={{ ['--marquee-duration' as string]: '90s' }}>
            {[...logos, ...logos].map(([code, ext], i) => (
              <span key={i} className="h-16 w-36 shrink-0 rounded-xl bg-white flex items-center justify-center px-3">
                <Image src={`/orgs/${code}.${ext}`} alt="" width={120} height={48} unoptimized className="max-h-10 w-auto h-auto object-contain" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 마지막 권유 */}
      <section className="px-6 md:px-16 py-20 max-w-6xl mx-auto">
        <div className="rounded-3xl p-10 md:p-14 text-center flex flex-col items-center gap-5 bg-[radial-gradient(ellipse_at_50%_0%,#4a1530,transparent_70%)] border border-pink-500/30">
          <h2 className="font-display text-3xl md:text-4xl">오늘 한 번, 면접관 앞에 서 보세요</h2>
          <p className="text-neutral-300">하루 10번까지 무료로 연습할 수 있어요.</p>
          <Link href="/setup" className="px-8 py-3.5 rounded-full bg-pink-500 hover:bg-pink-400 transition-colors font-medium shadow-[0_8px_30px_-6px_#ff4f8b]">
            면접 시작하기
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-16 py-8 max-w-6xl mx-auto text-xs text-neutral-500 flex justify-between gap-4 border-t border-neutral-800">
        <span>합사카 · 합격은 사심입니까?</span>
        <Link href="/privacy" className="hover:text-neutral-300">개인정보 처리방침</Link>
      </footer>
    </main>
  );
}
