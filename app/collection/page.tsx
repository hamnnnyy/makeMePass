import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { INTERVIEWER_ROLES } from '@/lib/constants/roles';
import { INTERVIEW_MODES, MODE_LABELS } from '@/lib/constants/modes';
import { PersonaCard } from '@/features/interviewer/components/PersonaCard';
import { RARITY_COLOR, RARITY_LABEL } from '@/features/gamification/constants';
import { equipTitle } from '@/features/gamification/server/equipTitle.server';
import { PageHeader } from '@/components/layout/PageHeader';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(iso)).replaceAll('-', '.');

// 도감: 면접관(모드별 합격 시 들어온 면접관 수집) + 칭호(업적)
export default async function CollectionPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === 'titles' ? 'titles' : 'personas';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/collection');

  // 수집 기록·숨김 칭호는 service role 로 읽는다 (user.id 로 한정)
  const admin = createServiceClient();
  const [{ data: personas }, { data: owned }, { data: titles }, { data: earned }, { data: profile }] = await Promise.all([
    supabase.from('interviewer_personas').select('id, mode, role, cast_no, label_ko, position_ko'),
    admin.from('user_unlocked_personas').select('persona_id').eq('user_id', user.id),
    admin.from('achievements_master').select('id, name_ko, description, rarity, is_hidden'),
    admin.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
    admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  ]);
  const earnedAt = new Map((earned ?? []).map((e) => [e.achievement_id, e.unlocked_at]));
  const equippedId = profile?.equipped_achievement_id ?? null;
  const rarityOrder = ['legendary', 'epic', 'rare', 'common'];
  const sortedTitles = [...(titles ?? [])].sort((a, b) =>
    Number(earnedAt.has(b.id)) - Number(earnedAt.has(a.id)) || rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
  const ownedIds = new Set((owned ?? []).map((o) => o.persona_id));
  const total = personas?.length ?? 0;
  const count = (personas ?? []).filter((p) => ownedIds.has(p.id)).length;

  return (
    <div className="min-h-screen bg-night text-white flex flex-col gap-8 pb-12">
      <PageHeader
        title="도감"
        back={{ href: '/', label: '홈' }}
        right={
          <span className="font-display text-lg text-pink-400 tabular-nums">
            {tab === 'personas' ? `${count} / ${total}` : `${earnedAt.size} / ${titles?.length ?? 0}`}
          </span>
        }
      />

      <nav className="max-w-2xl mx-auto w-full grid grid-cols-2 text-sm border-b border-neutral-800">
        {([['personas', '면접관'], ['titles', '칭호']] as const).map(([key, label]) => (
          <Link
            key={key}
            href={key === 'personas' ? '/collection' : '/collection?tab=titles'}
            className={`text-center pb-2.5 -mb-px border-b-2 ${tab === key ? 'border-pink-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === 'titles' && (
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
          {sortedTitles.map((t) => {
            const at = earnedAt.get(t.id);
            const secret = t.is_hidden && !at;
            const equipped = equippedId === t.id;
            return (
              <div
                key={t.id}
                className={`rounded-xl bg-neutral-900 px-4 py-3 flex items-center gap-4 ${at ? '' : 'opacity-50'}`}
                style={equipped ? { boxShadow: '0 0 0 1px #f97316' } : undefined}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: at ? RARITY_COLOR[t.rarity] : '#52525b' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {secret ? '???' : t.name_ko}
                    <span className="ml-2 text-[11px] font-normal" style={{ color: RARITY_COLOR[t.rarity] }}>
                      {secret ? '' : RARITY_LABEL[t.rarity]}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">{secret ? '숨겨진 칭호' : t.description}</p>
                </div>
                {at && (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-neutral-600">{formatDate(at)}</span>
                    <form action={equipTitle.bind(null, equipped ? null : t.id)}>
                      <button className={`text-xs rounded-full px-3 py-1 ${equipped ? 'bg-pink-500' : 'border border-neutral-600 hover:border-neutral-400'}`}>
                        {equipped ? '장착 중' : '장착'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'personas' && <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        {INTERVIEW_MODES.map((mode) => {
          // 애니 모드처럼 기수가 여럿이면 기수마다 한 줄
          const casts = [...new Set((personas ?? []).filter((p) => p.mode === mode).map((p) => p.cast_no))].sort();
          const rows = casts.map((c) => INTERVIEWER_ROLES.map((role) => personas?.find((p) => p.mode === mode && p.role === role && p.cast_no === c)));
          const done = rows.flat().every((p) => p && ownedIds.has(p.id));
          return (
            <section key={mode}>
              <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-4">
                <span className="font-display text-xl">{MODE_LABELS[mode]} 모드</span>
                <span className="text-xs text-neutral-500">
                  {done ? '수집 완료' : `${MODE_LABELS[mode]} 모드로 합격하면 획득`}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {rows.map((row, k) => (
                  <div key={casts[k]} className="flex flex-col gap-2">
                    {casts.length > 1 && <span className="text-xs text-neutral-500">{casts[k]}기</span>}
                    <div className="grid grid-cols-3 gap-4">
                      {row.map((p, i) => p && (
                        <PersonaCard
                          key={p.id}
                          mode={mode}
                          role={INTERVIEWER_ROLES[i]}
                          cast={p.cast_no}
                          name={p.label_ko}
                          position={p.position_ko}
                          collected={ownedIds.has(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>}
    </div>
  );
}
