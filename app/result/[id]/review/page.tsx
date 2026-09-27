import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROLE_LABELS, ROLE_COLORS, INTERVIEWER_ROLES, type InterviewerRole } from '@/lib/constants/roles';

type ScoreKey = 'score_content' | 'score_fluency' | 'score_eye_contact' | 'score_expression' | 'score_timing';
const SCORE_GROUPS: { title: string; items: [ScoreKey, string][] }[] = [
  { title: '언어', items: [['score_content', '답변 내용'], ['score_fluency', '전달력']] },
  { title: '비언어', items: [['score_eye_contact', '시선'], ['score_expression', '표정'], ['score_timing', '시간 배분']] },
];

function ScorePill({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f97316' : '#ef4444';
  return (
    <span className="text-[11px] bg-neutral-800 rounded-full px-2 py-0.5">
      <span className="text-neutral-500">{label} </span>
      <span style={{ color }} className="font-bold">{value}</span>
    </span>
  );
}

// 복기: 영역별 평균과 문항별 녹취·녹음·점수·피드백
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from('session_questions')
    .select('id, sequence, question_text, asked_by_role, is_follow_up, transcript, filler_count, audio_url, score_content, score_fluency, score_eye_contact, score_expression, score_timing, hr_delta, tech_delta, exec_delta, claude_feedback, answered_at')
    .eq('session_id', id)
    .order('sequence');

  const answered = (questions ?? []).filter((q) => q.answered_at);
  const avg = (key: ScoreKey) => {
    const vals = answered.map((q) => q[key]).filter((v): v is number => v !== null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const fillers = answered.reduce((sum, q) => sum + (q.filler_count ?? 0), 0);
  const fbOf = (q: { claude_feedback: unknown }) =>
    q.claude_feedback as { strengths?: string; improvement?: string; nonverbalFeedback?: string; posture?: number | null } | null;
  const postures = answered.map((q) => fbOf(q)?.posture).filter((v): v is number => typeof v === 'number');
  const postureAvg = postures.length ? Math.round(postures.reduce((a, b) => a + b, 0) / postures.length) : null;

  // 녹음은 비공개 버킷이라 1시간짜리 signed URL로 재생
  const paths = answered.map((q) => q.audio_url).filter((p): p is string => !!p);
  const { data: signed } = paths.length
    ? await supabase.storage.from('session-audio').createSignedUrls(paths, 3600)
    : { data: [] };
  const audioUrl = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col px-6 py-6 max-w-xl mx-auto w-full gap-8">
      <div className="flex items-center justify-between">
        <Link href={`/result/${id}`} className="text-sm text-neutral-400 hover:text-white transition-colors">← 결과</Link>
        <h1 className="text-sm font-medium">복기</h1>
        <div className="w-12" />
      </div>

      {answered.length === 0 && <p className="text-sm text-neutral-500 text-center">답변한 문항이 없습니다.</p>}

      {/* 영역별 평균 */}
      {answered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {SCORE_GROUPS.map((g) => (
            <div key={g.title} className="bg-neutral-900 rounded-2xl px-4 py-3 flex flex-col gap-2">
              <h2 className="text-xs text-neutral-500 font-medium uppercase tracking-widest">{g.title}</h2>
              {g.items.map(([key, label]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-neutral-400">{label}</span>
                  <span className="font-bold">{avg(key) ?? '-'}</span>
                </div>
              ))}
              {g.title === '비언어' && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">자세</span>
                  <span className="font-bold">{postureAvg ?? '-'}</span>
                </div>
              )}
              {g.title === '언어' && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">군말</span>
                  <span className="font-bold">{fillers}회</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 문항별 리뷰 */}
      {answered.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 font-medium uppercase tracking-widest">문항별 리뷰</h2>
          {(questions ?? []).map((q, i, all) => {
            const no = all.slice(0, i + 1).filter((x) => !x.is_follow_up).length;
            const fb = fbOf(q);
            const role = q.asked_by_role as InterviewerRole;
            const src = q.audio_url ? audioUrl.get(q.audio_url) : undefined;
            return (
              <div key={q.id} className={`bg-neutral-900 rounded-xl px-4 py-3 flex flex-col gap-2 ${q.is_follow_up ? 'ml-4' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: ROLE_COLORS[role] }}>{ROLE_LABELS[role]}</span>
                  <span className="text-xs text-neutral-600">{q.is_follow_up ? '꼬리질문' : `Q${no}`}</span>
                  {q.answered_at ? (
                    <span className="text-xs text-neutral-500 ml-auto">
                      {INTERVIEWER_ROLES.map((r) => `${ROLE_LABELS[r]} ${q[`${r}_delta`] >= 0 ? '+' : ''}${q[`${r}_delta`]}`).join(' · ')}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-600 ml-auto">미답변</span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{q.question_text}</p>
                {q.transcript && (
                  <p className="text-xs text-neutral-500 leading-relaxed border-l-2 border-neutral-700 pl-2">{q.transcript}</p>
                )}
                {src && <audio controls src={src} className="h-8 w-full" />}
                {q.answered_at && (
                  <div className="flex flex-wrap gap-1.5">
                    {SCORE_GROUPS.flatMap((g) => g.items).map(([key, label]) => (
                      <ScorePill key={key} label={label} value={q[key]} />
                    ))}
                    <ScorePill label="자세" value={typeof fb?.posture === 'number' ? fb.posture : null} />
                    {q.filler_count ? (
                      <span className="text-[11px] bg-neutral-800 rounded-full px-2 py-0.5 text-neutral-400">군말 {q.filler_count}회</span>
                    ) : null}
                  </div>
                )}
                {fb?.strengths && <p className="text-xs text-green-400">+ {fb.strengths}</p>}
                {fb?.improvement && <p className="text-xs text-orange-400">− {fb.improvement}</p>}
                {fb?.nonverbalFeedback && <p className="text-xs text-sky-400">◉ {fb.nonverbalFeedback}</p>}
              </div>
            );
          })}
        </div>
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
