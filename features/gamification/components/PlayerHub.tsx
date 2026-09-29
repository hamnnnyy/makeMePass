import Link from 'next/link';
import { MODE_LABELS } from '@/lib/constants/modes';
import { formatLabel } from '@/lib/constants/interviewTypes';
import type { PlayerStats } from '../server/playerStats';
import { LevelBar } from './LevelBar';

const RESULT_CHIP = {
  pass: { label: '합격', color: '#22c55e' },
  fail_veto: { label: '결렬', color: '#f97316' },
  fail_eliminate: { label: '탈락', color: '#ef4444' },
  fail_disqualified: { label: '실격', color: '#dc2626' },
  pending: { label: '중단', color: '#737373' },
} as const;

// 로그인 사용자의 홈 카드: 레벨·연속 연습·도감·칭호·최근 면접
export function PlayerHub({ stats, name, title }: { stats: PlayerStats; name: string; title: string | null }) {
  const tiles = [
    { label: '연속 연습', value: `${stats.streak}일`, sub: `최고 ${stats.longestStreak}일`, href: null },
    { label: '면접관 도감', value: `${stats.personas} / ${stats.personasTotal}`, sub: '합격하면 수집', href: '/collection' },
    { label: '칭호', value: `${stats.titles} / ${stats.titlesTotal}`, sub: title ? `장착: ${title}` : '미장착', href: '/collection?tab=titles' },
    { label: '합격', value: `${stats.passes}회`, sub: `완주 ${stats.finished}회`, href: null },
  ];

  return (
    <section className="px-6 md:px-16 pt-12 max-w-6xl mx-auto w-full">
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10">
          <div className="md:w-72 flex flex-col gap-1">
            <p className="text-xs text-neutral-500">{title ? `[${title}]` : '칭호 없음'}</p>
            <p className="text-lg font-semibold">{name}</p>
          </div>
          <div className="flex-1"><LevelBar level={stats.level} into={stats.into} need={stats.need} /></div>
          <Link href="/settings" className="text-xs text-neutral-400 hover:text-white">프로필 · 설정 →</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => {
            const body = (
              <>
                <p className="text-[11px] text-neutral-500">{t.label}</p>
                <p className="text-xl font-semibold">{t.value}</p>
                <p className="text-[11px] text-neutral-500 truncate">{t.sub}</p>
              </>
            );
            return t.href
              ? <Link key={t.label} href={t.href} className="rounded-xl bg-neutral-800/60 hover:bg-neutral-800 px-4 py-3">{body}</Link>
              : <div key={t.label} className="rounded-xl bg-neutral-800/60 px-4 py-3">{body}</div>;
          })}
        </div>

        {stats.recent.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-neutral-500">최근 면접</p>
            {stats.recent.map((s) => {
              const chip = s.status === 'aborted' ? RESULT_CHIP.pending : RESULT_CHIP[s.result];
              return (
                <Link key={s.id} href={`/result/${s.id}`} className="flex items-center gap-3 text-sm rounded-lg hover:bg-neutral-800/60 px-2 py-1.5">
                  <span className="text-[11px] font-bold rounded-full px-2 py-0.5" style={{ color: chip.color, backgroundColor: `${chip.color}22` }}>{chip.label}</span>
                  <span>{s.organizations?.code}</span>
                  <span className="text-neutral-400">{formatLabel(s)}</span>
                  <span className="text-neutral-500">{MODE_LABELS[s.mode]}</span>
                  <span className="ml-auto text-xs text-neutral-600">{s.started_at.slice(0, 10).replaceAll('-', '.')}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
