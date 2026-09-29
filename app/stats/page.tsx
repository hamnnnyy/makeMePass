import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { PageHeader } from '@/components/layout/PageHeader';
import { INTERVIEW_TYPE_INFO, type InterviewType } from '@/lib/constants/interviewTypes';
import { aggregate, type StatAnswer, type StatSession } from '@/features/stats/logic/aggregate';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(new Date(iso));
const RESULT_COLOR: Record<string, string> = { pass: '#22c55e', fail_veto: '#f97316', fail_eliminate: '#ef4444', fail_disqualified: '#dc2626' };

// Supabase 는 한 번에 1000행까지만 돌려준다
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return rows;
  }
}

// 연습 기록 대시보드. ADMIN_EMAILS 에 든 계정은 ?scope=all 로 전체 사용자 지표를 본다 (학교 배포·상품화 근거 자료).
export default async function StatsPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/stats');

  const isAdmin = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean).includes(user.email ?? '');
  const all = isAdmin && (await searchParams).scope === 'all';
  const db = all ? createServiceClient() : supabase;

  const sessionRows = await fetchAll((from, to) => {
    const q = db.from('interview_sessions')
      .select('id, user_id, result, interview_type, started_at, organizations(name_ko)')
      .neq('status', 'in_progress')
      .order('started_at')
      .range(from, to);
    return all ? q : q.eq('user_id', user.id);
  });
  const sessions: StatSession[] = sessionRows.map((s) => ({
    ...s,
    interview_type: s.interview_type as InterviewType,
    org: (s.organizations as unknown as { name_ko: string } | null)?.name_ko ?? '-',
  }));
  // 본인 권한 클라이언트는 RLS 로 본인 답변만 보인다
  const answers = sessions.length
    ? await fetchAll<StatAnswer>((from, to) => db.from('session_questions')
        .select('session_id, score_content, score_fluency, score_eye_contact, score_expression, score_timing, org_fit:claude_feedback->orgFit, criteria:claude_feedback->criteria')
        .not('answered_at', 'is', null)
        .order('id')
        .range(from, to) as unknown as PromiseLike<{ data: StatAnswer[] | null; error: unknown }>)
    : [];
  const s = aggregate(sessions, answers);

  const tiles = [
    ...(all ? [{ label: '사용자', value: `${s.users}명` }] : []),
    { label: '완료한 면접', value: `${s.total}회` },
    { label: '합격률', value: `${s.passRate}%`, sub: `합격 ${s.passes}회` },
    { label: '답변한 질문', value: `${s.answered}개` },
  ];

  return (
    <div className="min-h-screen bg-night text-white flex flex-col gap-8 pb-12">
      <PageHeader
        title={all ? '전체 이용 지표' : '연습 기록'}
        back={{ href: '/', label: '홈' }}
        right={isAdmin ? (
          <Link href={all ? '/stats' : '/stats?scope=all'} className="text-xs text-pink-400 hover:text-pink-300">
            {all ? '내 기록' : '전체 지표'}
          </Link>
        ) : null}
      />

      <main className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-6">
        {s.total === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-10 text-center flex flex-col items-center gap-4">
            <p className="text-neutral-300">아직 끝까지 본 면접이 없어요.</p>
            <Link href="/setup" className="px-5 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 text-sm font-medium">면접 보러 가기</Link>
          </div>
        ) : (
          <>
            <section className={`grid ${all ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'} gap-3`}>
              {tiles.map((t) => (
                <div key={t.label} className="rounded-2xl bg-neutral-900 border border-neutral-800 px-4 py-3">
                  <p className="text-[11px] text-neutral-500">{t.label}</p>
                  <p className="font-display text-2xl tabular-nums mt-1">{t.value}</p>
                  {t.sub && <p className="text-[11px] text-neutral-500 mt-0.5">{t.sub}</p>}
                </div>
              ))}
            </section>

            {s.weakest && (
              <section className="rounded-2xl border border-pink-500/40 bg-pink-500/10 p-5 flex flex-col gap-1.5">
                <p className="text-xs text-pink-300">{all ? '사용자들이 가장 어려워하는 영역' : '가장 보완이 필요한 영역'}</p>
                <p className="text-lg font-semibold">{s.weakest.label} <span className="text-pink-300 tabular-nums">평균 {s.weakest.avg}점</span></p>
                <p className="text-sm text-neutral-300">{s.weakest.tip}</p>
              </section>
            )}

            <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-4">
              <h2 className="text-sm text-neutral-300">영역별 평균 점수</h2>
              <ul className="flex flex-col gap-3">
                {s.areas.map((a) => (
                  <li key={a.key} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
                    <span className="text-neutral-400">{a.label}</span>
                    <div className="h-2.5 rounded-full bg-neutral-800 overflow-hidden" role="img" aria-label={`${a.label} ${a.avg ?? '측정 없음'}`}>
                      <div
                        className={`h-full rounded-full ${a.key === s.weakest?.key ? 'bg-pink-500' : 'bg-sky-400'}`}
                        style={{ width: `${a.avg ?? 0}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums">{a.avg ?? '-'}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-neutral-500">전달력은 음성 답변, 시선·표정은 카메라에 얼굴이 잡힌 답변만 측정해요.</p>
            </section>

            {s.habits.some((h) => h.avg !== null) && (
              <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-4">
                <h2 className="text-sm text-neutral-300">답변 습관</h2>
                <ul className="flex flex-col gap-3">
                  {s.habits.map((h) => (
                    <li key={h.key} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
                      <span className="text-neutral-400">{h.label}</span>
                      <div className="h-2.5 rounded-full bg-neutral-800 overflow-hidden" role="img" aria-label={`${h.label} ${h.avg ?? '측정 없음'}`}>
                        <div className={`h-full rounded-full ${h.key === s.weakestHabit?.key ? 'bg-pink-500' : 'bg-violet-400'}`} style={{ width: `${h.avg ?? 0}%` }} />
                      </div>
                      <span className="text-right tabular-nums">{h.avg ?? '-'}</span>
                    </li>
                  ))}
                </ul>
                {s.weakestHabit && <p className="text-xs text-neutral-300"><span className="text-pink-400">{s.weakestHabit.label}</span> {s.weakestHabit.tip}</p>}
              </section>
            )}

            {s.trend.length > 1 && (
              <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-4">
                <h2 className="text-sm text-neutral-300">최근 면접별 답변 내용 점수</h2>
                <div className="flex items-end gap-1.5 h-36">
                  {s.trend.map((t) => (
                    <div key={t.id} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${formatDate(t.date)} · ${t.avg}점`}>
                      <span className="text-[10px] text-neutral-400 tabular-nums">{t.avg}</span>
                      <div className="w-full max-w-8 rounded-t" style={{ height: `${Math.max(t.avg, 3)}%`, background: RESULT_COLOR[t.result] ?? '#737373' }} />
                      <span className="text-[10px] text-neutral-500 tabular-nums">{formatDate(t.date)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500">
                  <span className="text-green-500">■</span> 합격 <span className="text-orange-500 ml-2">■</span> 결렬 <span className="text-red-500 ml-2">■</span> 탈락·실격
                </p>
              </section>
            )}

            <section className="grid md:grid-cols-2 gap-3">
              {([['면접 유형별', s.byType.map((g) => ({ ...g, label: INTERVIEW_TYPE_INFO[g.key as InterviewType]?.label ?? g.key }))],
                 ['많이 본 기관', s.byOrg.map((g) => ({ ...g, label: g.key }))]] as const).map(([title, rows]) => (
                <div key={title} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-3">
                  <h2 className="text-sm text-neutral-300">{title}</h2>
                  <ul className="flex flex-col gap-2 text-sm">
                    {rows.map((g) => (
                      <li key={g.key} className="flex justify-between gap-3">
                        <span className="truncate">{g.label}</span>
                        <span className="text-neutral-400 tabular-nums shrink-0">{g.count}회 · 합격 {g.passes}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
