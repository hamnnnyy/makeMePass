'use client';

import { ROLE_COLORS, type InterviewerRole } from '@/lib/constants/roles';
import { ANSWER_LIMIT_SEC, type AnswerKind } from '@/lib/constants/interview';
import type { FaceMetrics } from '@/features/mediapipe/types';

// 답변 종류별 권장 길이 (scoring.ts IDEAL_LENGTH 와 같은 기준)
const GUIDE: Record<AnswerKind, string> = {
  intro: '1분 자기소개 · 45~90초',
  main: '결론 먼저 · 30~90초',
  followUp: '짧고 정확하게 · 15~60초',
  closing: '마지막 한마디 · 10~60초',
  pt: '서론-본론-결론 · 2~3분',
  turn: '앞 발언을 짚고 · 30~80초',
};

interface Props {
  questions: { id: string; question_text: string; asked_by_role: string; is_follow_up: boolean }[];
  idx: number;
  names: Record<InterviewerRole, string>;
  results: Record<string, number>;  // 답한 문항 id → 호감도 변화 합
  kind: AnswerKind | null;
  answering: boolean;
  remaining: number;
  metrics: FaceMetrics;
}

// 면접 화면 아래: 문항 진행표 + 실시간 태도·시간 안내
export function SessionStatus({ questions, idx, names, results, kind, answering, remaining, metrics }: Props) {
  let no = 0;
  const labels = questions.map((q) => (q.is_follow_up ? '꼬리' : `Q${++no}`));
  const limit = kind ? ANSWER_LIMIT_SEC[kind] : 0;
  const used = answering && limit ? Math.min(1, Math.max(0, (limit - remaining) / limit)) : 0;
  const live = [
    { label: '시선', value: metrics.gazeScore, tip: '카메라 렌즈를 보세요' },
    { label: '표정', value: metrics.smileScore, tip: '가볍게 미소 지어 보세요' },
    { label: '자세', value: metrics.stability, tip: '고개를 덜 움직여 보세요' },
  ];
  const weakest = metrics.detected ? live.reduce((a, b) => (b.value < a.value ? b : a)) : null;

  return (
    <div className="w-full grid gap-4 md:grid-cols-[1fr_20rem]">
      <section className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 flex flex-col gap-3 min-w-0">
        <h2 className="text-xs text-neutral-500 tracking-widest">진행 상황</h2>
        <ol className="flex flex-col gap-1.5">
          {questions.map((q, i) => {
            const role = q.asked_by_role as InterviewerRole;
            const delta = results[q.id];
            const current = i === idx;
            return (
              <li
                key={q.id}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${current ? 'bg-pink-500/10 ring-1 ring-pink-500/40' : ''} ${i > idx ? 'text-neutral-500' : ''} ${q.is_follow_up ? 'ml-4' : ''}`}
              >
                <span className="w-9 shrink-0 font-display text-xs" style={{ color: current ? '#f472b6' : undefined }}>{labels[i]}</span>
                <span className="size-2 rounded-full shrink-0" style={{ background: ROLE_COLORS[role] }} title={names[role]} />
                {/* 아직 묻지 않은 질문은 가린다 (실제 면접처럼 미리 볼 수 없게) */}
                <span className="truncate flex-1">{i <= idx ? q.question_text.split('\n')[0] : '···'}</span>
                {delta !== undefined && (
                  <span className={`shrink-0 text-xs font-bold tabular-nums ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-neutral-500'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <h2 className="text-xs text-neutral-500 tracking-widest">답변 시간</h2>
            {kind && <span className="text-[11px] text-neutral-400">{GUIDE[kind]}</span>}
          </div>
          <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full bg-pink-500 transition-[width] duration-1000 ease-linear" style={{ width: `${used * 100}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xs text-neutral-500 tracking-widest">실시간 태도</h2>
          {live.map((m) => {
            const pct = metrics.detected ? Math.round(m.value * 100) : 0;
            const color = pct >= 60 ? '#22c55e' : pct >= 30 ? '#f97316' : '#ef4444';
            return (
              <div key={m.label} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-xs">
                <span className="text-neutral-400">{m.label}</span>
                <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-right tabular-nums" style={{ color }}>{metrics.detected ? pct : '-'}</span>
              </div>
            );
          })}
          <p className="text-[11px] text-neutral-400 min-h-4">
            {!metrics.detected ? '얼굴이 보이도록 카메라를 맞춰 주세요' : weakest && weakest.value < 0.5 ? weakest.tip : '좋아요, 이대로 유지하세요'}
          </p>
        </div>
      </section>
    </div>
  );
}
