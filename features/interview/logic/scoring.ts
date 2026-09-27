import type { InterviewerRole } from '@/lib/constants/roles';
import type { AnswerKind } from '@/lib/constants/interview';
import type { NonVerbalSummary } from '@/features/mediapipe/logic/nonVerbal';
import type { AudioStats } from './audio';

export type RoleValues = Record<InterviewerRole, number>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// 비언어 점수 (0-100)
export function scoreNonVerbal(s: NonVerbalSummary) {
  const eyeContact = Math.round(100 * s.gazeOnRatio * s.presence);

  // 무표정(굳음)도, 과한 웃음도 감점. 옅은 미소 0.1~0.5 구간이 만점.
  let expression =
    s.smileAvg < 0.1 ? 50 + (s.smileAvg / 0.1) * 50
    : s.smileAvg > 0.5 ? 100 - (s.smileAvg - 0.5) * 100
    : 100;
  // 평소 분당 15~20회. 35회 넘게 깜빡이면 긴장 신호로 본다.
  if (s.blinkPerMin > 35) expression -= Math.min(30, s.blinkPerMin - 35);

  const posture = Math.round(100 * s.stabilityAvg * s.presence);
  return { eyeContact, expression: Math.round(clamp(expression * s.presence, 0, 100)), posture };
}

const IDEAL_LENGTH: Record<AnswerKind, [number, number]> = {
  intro: [45, 90], main: [30, 90], followUp: [15, 60], closing: [10, 60],
};

// 답변 시간 배분 점수 (0-100)
export function scoreTiming(a: AudioStats, kind: AnswerKind): number {
  if (a.speechSpanSec === 0) return 0;
  const [min, max] = IDEAL_LENGTH[kind];
  let score =
    a.speechSpanSec < min ? (a.speechSpanSec / min) * 100
    : a.speechSpanSec > max ? Math.max(30, 100 - (a.speechSpanSec - max))
    : 100;
  if (a.leadingSilenceSec > 3) score -= Math.min(30, (a.leadingSilenceSec - 3) * 5);
  if (a.longestPauseSec > 4) score -= 10;
  return Math.round(clamp(score, 0, 100));
}

// 호감도 변화 = Gemini의 언어 평가 + 비언어·시간 보정.
// 기술 면접관은 태도보다 내용을 보므로 비언어 가중치를 절반으로 둔다.
// 텍스트 답변은 시선(eyeContact)·시간(timing)을 잴 수 없어 null → 있는 항목만 반영.
const NV_WEIGHT: RoleValues = { hr: 1, tech: 0.5, exec: 1 };

export function finalDeltas(
  verbal: RoleValues,
  nv: { eyeContact: number | null; expression: number; posture: number },
  timing: number | null,
): RoleValues {
  const nvParts = [nv.eyeContact, nv.expression, nv.posture].filter((v): v is number => v !== null);
  const nvAdj = (nvParts.reduce((a, b) => a + b, 0) / nvParts.length - 60) / 10; // -6 ~ +4
  const timingAdj = timing === null ? 0 : (timing - 70) / 15;                    // -4.7 ~ +2
  const out = {} as RoleValues;
  for (const role of Object.keys(NV_WEIGHT) as InterviewerRole[]) {
    out[role] = Math.round(clamp(verbal[role] + NV_WEIGHT[role] * nvAdj + timingAdj, -15, 15));
  }
  return out;
}

export function applyDeltas(favor: RoleValues, delta: RoleValues): RoleValues {
  return {
    hr: clamp(favor.hr + delta.hr, 0, 100),
    tech: clamp(favor.tech + delta.tech, 0, 100),
    exec: clamp(favor.exec + delta.exec, 0, 100),
  };
}

export interface Thresholds { pass_threshold: number; eliminate_threshold: number }

// DB session_result 값 그대로 반환. 탈락선 미만 = 즉시 탈락, 전원 합격선 이상 = 합격, 나머지 = 결렬.
export function judge(favor: RoleValues, t: Thresholds) {
  const [lowRole, min] = (Object.entries(favor) as [InterviewerRole, number][])
    .reduce((a, b) => (b[1] < a[1] ? b : a));
  if (min < t.eliminate_threshold) return { result: 'fail_eliminate' as const, lowRole };
  if (min >= t.pass_threshold) return { result: 'pass' as const, lowRole: null };
  return { result: 'fail_veto' as const, lowRole };
}
