import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROLE_LABELS, ROLE_COLORS, ROLE_ACCENT_HEX, INTERVIEWER_ROLES, type InterviewerRole } from '@/lib/constants/roles';
import { getPersonaNames } from '@/features/interviewer/personaNames';
import { Portrait, moodOf } from '@/features/interviewer/components/Portrait';
import type { InterviewMode } from '@/lib/constants/modes';

type ScoreKey = 'score_content' | 'score_fluency' | 'score_eye_contact' | 'score_expression' | 'score_timing';
const SCORE_GROUPS: { title: string; items: [ScoreKey, string][] }[] = [
  { title: '언어', items: [['score_content', '답변 내용'], ['score_fluency', '전달력']] },
  { title: '비언어', items: [['score_eye_contact', '시선'], ['score_expression', '표정'], ['score_timing', '시간 배분']] },
];

interface Feedback {
  strengths?: string;
  improvement?: string;
  nonverbalFeedback?: string;
  posture?: number | null;
  reasons?: Partial<Record<InterviewerRole, string>> | null;
  voices?: Partial<Record<InterviewerRole, string>> | null;
  verbalDeltas?: Record<InterviewerRole, number>;
  audio?: { speechSpanSec: number; leadingSilenceSec: number; longestPauseSec: number };
}

const scoreColor = (v: number) => (v >= 70 ? '#22c55e' : v >= 40 ? '#f97316' : '#ef4444');
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const deltaClass = (n: number) =>
  n > 0 ? 'text-green-400 bg-green-500/10' : n < 0 ? 'text-red-400 bg-red-500/10' : 'text-neutral-400 bg-neutral-800';

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-neutral-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        {value !== null && <div className="h-full rounded-full" style={{ width: `${value}%`, background: scoreColor(value) }} />}
      </div>
      <span className="w-7 text-right font-bold tabular-nums" style={{ color: value === null ? undefined : scoreColor(value) }}>
        {value ?? '-'}
      </span>
    </div>
  );
}

function DeltaBadge({ n, className = '' }: { n: number; className?: string }) {
  return <span className={`rounded-md px-1.5 py-0.5 font-bold tabular-nums ${deltaClass(n)} ${className}`}>{signed(n)}</span>;
}

// 도감 카드와 같은 CSS 구슬 (면접관 캐릭터)
function Orb({ role, size = 28 }: { role: InterviewerRole; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ROLE_ACCENT_HEX[role]} 35%, ${ROLE_COLORS[role]} 70%, #000 100%)`,
        boxShadow: `0 0 ${size / 2}px ${ROLE_ACCENT_HEX[role]}55`,
      }}
    />
  );
}

// 면접관 얼굴 아바타. 일러스트가 없으면 구슬.
function Avatar({ mode, role, delta, size }: { mode: InterviewMode; role: InterviewerRole; delta?: number; size: number }) {
  return (
    <span
      className="relative rounded-full overflow-hidden shrink-0 inline-block bg-neutral-800"
      style={{ width: size, height: size, boxShadow: `0 0 0 1.5px ${ROLE_COLORS[role]}` }}
    >
      <Portrait mode={mode} role={role} mood={moodOf(delta)} face sizes={`${size * 3}px`} fallback={<Orb role={role} size={size} />} />
    </span>
  );
}

// 호감도 하트 게이지. 점선 = 합격선
function HeartGauge({ value, passLine }: { value: number; passLine: number | null }) {
  const color = passLine !== null && value >= passLine ? '#f472b6' : '#be185d';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs leading-none" style={{ color }}>♥</span>
      <div className="relative flex-1 h-1.5 rounded-full bg-neutral-700/60">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg, #9d174d, ${color})` }} />
        {passLine !== null && <div className="absolute -top-0.5 h-2.5 border-l border-dashed border-white/60" style={{ left: `${passLine}%` }} />}
      </div>
    </div>
  );
}

// 복기: 호감도 흐름·명장면, 영역별 평균, 문항별 면접관 속마음·득실 근거·녹취·녹음·피드백
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session }, { data: questions }] = await Promise.all([
    supabase.from('interview_sessions').select('mode, organizations(pass_threshold)').eq('id', id).single(),
    supabase
      .from('session_questions')
      .select('id, sequence, question_text, asked_by_role, is_follow_up, transcript, filler_count, audio_url, score_content, score_fluency, score_eye_contact, score_expression, score_timing, hr_delta, tech_delta, exec_delta, hr_after, tech_after, exec_after, claude_feedback, answered_at')
      .eq('session_id', id)
      .order('sequence'),
  ]);
  const names = session ? await getPersonaNames(supabase, session.mode) : ROLE_LABELS;
  const mode: InterviewMode = session?.mode ?? 'realistic';

  const all = questions ?? [];
  const answered = all.filter((q) => q.answered_at);
  const fbOf = (q: { claude_feedback: unknown }) => q.claude_feedback as Feedback | null;
  const avg = (vals: (number | null | undefined)[]) => {
    const v = vals.filter((x): x is number => typeof x === 'number');
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  const fillers = answered.reduce((sum, q) => sum + (q.filler_count ?? 0), 0);
  const postureAvg = avg(answered.map((q) => fbOf(q)?.posture));

  // 문항 번호: 꼬리질문은 부모 번호를 따른다
  const labelOf = new Map<string, string>();
  let no = 0;
  for (const q of all) labelOf.set(q.id, q.is_follow_up ? `Q${no}-꼬리` : `Q${++no}`);

  const net = (q: (typeof all)[number]) => q.hr_delta + q.tech_delta + q.exec_delta;
  const best = answered.reduce<(typeof all)[number] | null>((a, q) => (!a || net(q) > net(a) ? q : a), null);
  const worst = answered.reduce<(typeof all)[number] | null>((a, q) => (!a || net(q) < net(a) ? q : a), null);
  const last = answered.findLast((q) => q.hr_after !== null);
  const finalFavor = (r: InterviewerRole) => (last?.[`${r}_after`] as number | null) ?? 50;
  const passLine = (session?.organizations as { pass_threshold: number } | null)?.pass_threshold ?? null;

  // 명장면: 면접관마다 호감도가 가장 크게 오른 문항(반한 순간)과 떨어진 문항(등 돌린 순간)
  const moments = INTERVIEWER_ROLES.flatMap((r) => {
    const d = (q: (typeof all)[number]) => q[`${r}_delta`] as number;
    const up = answered.reduce<(typeof all)[number] | null>((a, q) => (d(q) >= 5 && (!a || d(q) > d(a)) ? q : a), null);
    const down = answered.reduce<(typeof all)[number] | null>((a, q) => (d(q) <= -5 && (!a || d(q) < d(a)) ? q : a), null);
    return [
      ...(up ? [{ role: r, q: up, delta: d(up), kind: '반한 순간' }] : []),
      ...(down ? [{ role: r, q: down, delta: d(down), kind: '등 돌린 순간' }] : []),
    ];
  });

  // 녹음은 비공개 버킷이라 1시간짜리 signed URL로 재생
  const paths = answered.map((q) => q.audio_url).filter((p): p is string => !!p);
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from('session-audio').createSignedUrls(paths, 3600)
    : { data: [] };
  const audioUrl = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col px-5 py-6 max-w-xl mx-auto w-full gap-6">
      <div className="flex items-center justify-between">
        <Link href={`/result/${id}`} className="text-sm text-neutral-400 hover:text-white transition-colors">← 결과</Link>
        <h1 className="text-sm font-medium">복기</h1>
        <div className="w-12" />
      </div>

      {answered.length === 0 && <p className="text-sm text-neutral-500 text-center py-12">답변한 문항이 없습니다.</p>}

      {/* 호감도 요약: 시작 50 → 최종, 가장 크게 얻고 잃은 문항 */}
      {answered.length > 0 && (
        <section className="bg-neutral-900 rounded-2xl p-4 flex flex-col gap-4">
          <h2 className="text-xs text-neutral-500 font-medium tracking-widest">호감도 흐름</h2>
          <div className="grid grid-cols-3 gap-2">
            {INTERVIEWER_ROLES.map((r) => {
              const f = finalFavor(r);
              return (
                <div key={r} className="rounded-xl bg-neutral-800/60 px-3 py-2.5 flex flex-col gap-1">
                  <span className="text-[11px] font-bold truncate" style={{ color: ROLE_COLORS[r] }}>{names[r]}</span>
                  <span className="text-lg font-bold tabular-nums leading-none">
                    {f}<span className="text-xs text-neutral-500 font-normal">%</span>
                  </span>
                  <DeltaBadge n={f - 50} className="text-[10px] self-start" />
                  <HeartGauge value={f} passLine={passLine} />
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            {best && net(best) > 0 && (
              <a href={`#q-${best.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-800 transition-colors">
                <span className="text-neutral-500 w-16 shrink-0">최대 득점</span>
                <span className="font-bold">{labelOf.get(best.id)}</span>
                <span className="text-neutral-400 truncate flex-1">{best.question_text}</span>
                <DeltaBadge n={net(best)} />
              </a>
            )}
            {worst && net(worst) < 0 && (
              <a href={`#q-${worst.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-800 transition-colors">
                <span className="text-neutral-500 w-16 shrink-0">최대 실점</span>
                <span className="font-bold">{labelOf.get(worst.id)}</span>
                <span className="text-neutral-400 truncate flex-1">{worst.question_text}</span>
                <DeltaBadge n={net(worst)} />
              </a>
            )}
          </div>
        </section>
      )}

      {/* 명장면: 면접관별 반한 순간·등 돌린 순간 */}
      {moments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 font-medium tracking-widest">명장면</h2>
          <div className="flex gap-3 overflow-x-auto snap-x pb-1 -mx-5 px-5">
            {moments.map((m) => {
              const fb = fbOf(m.q);
              const line = fb?.voices?.[m.role] ?? fb?.reasons?.[m.role];
              const up = m.delta > 0;
              return (
                <a
                  key={`${m.role}-${m.kind}`}
                  href={`#q-${m.q.id}`}
                  className="snap-start shrink-0 w-60 rounded-2xl p-4 flex flex-col gap-3 border transition-colors hover:bg-neutral-800/80"
                  style={{ background: up ? '#2a0f1f' : '#141a24', borderColor: up ? '#f472b655' : '#60a5fa33' }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar mode={mode} role={m.role} delta={m.delta} size={44} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold truncate" style={{ color: ROLE_COLORS[m.role] }}>{names[m.role]}</span>
                      <span className={`text-sm font-bold ${up ? 'text-pink-300' : 'text-sky-300'}`}>{up ? '♥ ' : '💔 '}{m.kind}</span>
                    </div>
                    <DeltaBadge n={m.delta} className="ml-auto text-xs" />
                  </div>
                  {line && <p className="text-sm text-neutral-100 leading-relaxed">“{line}”</p>}
                  <p className="text-[11px] text-neutral-500 truncate">{labelOf.get(m.q.id)} · {m.q.question_text}</p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 영역별 평균 */}
      {answered.length > 0 && (
        <section className="grid grid-cols-2 gap-3">
          {SCORE_GROUPS.map((g) => (
            <div key={g.title} className="bg-neutral-900 rounded-2xl px-4 py-3 flex flex-col gap-2">
              <h2 className="text-xs text-neutral-500 font-medium tracking-widest">{g.title}</h2>
              {g.items.map(([key, label]) => (
                <ScoreBar key={key} label={label} value={avg(answered.map((q) => q[key]))} />
              ))}
              {g.title === '비언어' && <ScoreBar label="자세" value={postureAvg} />}
              {g.title === '언어' && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">군말</span>
                  <span className="font-bold">{fillers}회</span>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 문항별 리뷰 */}
      {answered.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 font-medium tracking-widest">문항별 리뷰</h2>
          {all.map((q) => {
            const fb = fbOf(q);
            const role = q.asked_by_role as InterviewerRole;
            const src = q.audio_url ? audioUrl.get(q.audio_url) : undefined;
            const done = !!q.answered_at;
            return (
              <article
                key={q.id}
                id={`q-${q.id}`}
                className={`scroll-mt-6 bg-neutral-900 rounded-2xl p-4 flex flex-col gap-3 border-l-2 ${q.is_follow_up ? 'ml-4' : ''}`}
                style={{ borderLeftColor: ROLE_COLORS[role] }}
              >
                <header className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-neutral-200">{labelOf.get(q.id)}</span>
                  <span className="font-medium" style={{ color: ROLE_COLORS[role] }}>{names[role]}</span>
                  {done ? <DeltaBadge n={net(q)} className="ml-auto" /> : <span className="text-neutral-600 ml-auto">미답변</span>}
                </header>
                <p className="text-sm text-neutral-100 leading-relaxed">{q.question_text}</p>

                {done && (
                  <>
                    {/* 면접관 속마음 말풍선 */}
                    {fb?.voices && (
                      <div className="flex flex-col gap-2">
                        {INTERVIEWER_ROLES.map((r) => {
                          const v = fb.voices?.[r];
                          if (!v) return null;
                          const d = q[`${r}_delta`] as number;
                          return (
                            <div key={r} className="flex items-end gap-2">
                              <Avatar mode={mode} role={r} delta={d} size={36} />
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[10px] font-bold" style={{ color: ROLE_COLORS[r] }}>
                                  {names[r]} <span className={d > 0 ? 'text-pink-400' : d < 0 ? 'text-sky-400' : 'text-neutral-500'}>{d > 0 ? `♥ +${d}` : d < 0 ? `💔 ${d}` : '·'}</span>
                                </span>
                                <p className="text-sm text-neutral-100 bg-neutral-800 rounded-2xl rounded-bl-sm px-3 py-2 leading-relaxed">{v}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 면접관별 득실과 이유 */}
                    <div className="rounded-xl bg-neutral-950/60 p-3 flex flex-col gap-2.5">
                      {INTERVIEWER_ROLES.map((r) => {
                        const d = q[`${r}_delta`] as number;
                        const after = q[`${r}_after`] as number | null;
                        const verbal = fb?.verbalDeltas?.[r];
                        const adj = verbal === undefined ? 0 : d - verbal;
                        return (
                          <div key={r} className="flex gap-2.5 text-xs">
                            <span className="w-[4.5rem] shrink-0 font-bold truncate pt-0.5" style={{ color: ROLE_COLORS[r] }}>{names[r]}</span>
                            <div className="flex-1 flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <DeltaBadge n={d} />
                                {after !== null && <span className="text-neutral-500 tabular-nums">→ {after}%</span>}
                                {verbal !== undefined && adj !== 0 && (
                                  <span className="text-[10px] text-neutral-500 ml-auto">
                                    답변 {signed(verbal)} · 태도·시간 {signed(adj)}
                                  </span>
                                )}
                              </div>
                              {fb?.reasons?.[r] && <p className="text-neutral-400 leading-relaxed">{fb.reasons[r]}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(fb?.strengths || fb?.improvement || fb?.nonverbalFeedback) && (
                      <ul className="flex flex-col gap-1.5 text-xs leading-relaxed">
                        {fb?.strengths && <li className="flex gap-2"><span className="text-green-400 shrink-0">잘한 점</span><span className="text-neutral-300">{fb.strengths}</span></li>}
                        {fb?.improvement && <li className="flex gap-2"><span className="text-orange-400 shrink-0">고칠 점</span><span className="text-neutral-300">{fb.improvement}</span></li>}
                        {fb?.nonverbalFeedback && <li className="flex gap-2"><span className="text-sky-400 shrink-0">태도</span><span className="text-neutral-300">{fb.nonverbalFeedback}</span></li>}
                      </ul>
                    )}

                    <details className="group text-xs">
                      <summary className="cursor-pointer list-none text-neutral-500 hover:text-neutral-300 transition-colors select-none">
                        <span className="group-open:hidden">▸ 내 답변·세부 점수 보기</span>
                        <span className="hidden group-open:inline">▾ 접기</span>
                      </summary>
                      <div className="mt-3 flex flex-col gap-3">
                        {q.transcript && (
                          <p className="text-neutral-400 leading-relaxed border-l-2 border-neutral-700 pl-2 whitespace-pre-wrap">{q.transcript}</p>
                        )}
                        {src && <audio controls src={src} className="h-8 w-full" />}
                        <div className="flex flex-col gap-1.5">
                          {SCORE_GROUPS.flatMap((g) => g.items).map(([key, label]) =>
                            q[key] === null ? null : <ScoreBar key={key} label={label} value={q[key]} />,
                          )}
                          {typeof fb?.posture === 'number' && <ScoreBar label="자세" value={fb.posture} />}
                        </div>
                        {(fb?.audio || q.filler_count) && (
                          <p className="text-neutral-500">
                            {[
                              fb?.audio && `답변 ${Math.round(fb.audio.speechSpanSec)}초`,
                              fb?.audio && `첫 마디까지 ${fb.audio.leadingSilenceSec.toFixed(1)}초`,
                              fb?.audio && fb.audio.longestPauseSec > 4 && `최장 침묵 ${fb.audio.longestPauseSec.toFixed(1)}초`,
                              q.filler_count ? `군말 ${q.filler_count}회` : null,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </details>
                  </>
                )}
              </article>
            );
          })}
        </section>
      )}

      <Link
        href="/setup"
        className="w-full py-3 bg-orange-500 hover:bg-orange-400 transition-colors text-white text-sm font-medium rounded-full text-center"
      >
        다시 도전하기
      </Link>
    </div>
  );
}
