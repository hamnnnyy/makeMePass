import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// FaceLandmarker 랜드마크 인덱스
// 왼쪽 눈 안쪽 끝: 133, 바깥쪽 끝: 33
// 오른쪽 눈 안쪽 끝: 362, 바깥쪽 끝: 263
// 왼쪽 홍채 중심: 468, 오른쪽 홍채 중심: 473
const L_INNER = 133, L_OUTER = 33, L_IRIS = 468;
const R_INNER = 362, R_OUTER = 263, R_IRIS = 473;

export function computeGazeScore(landmarks: NormalizedLandmark[]): number {
  if (landmarks.length < 478) return 0.5;

  function irisRatio(inner: number, outer: number, iris: number): number {
    const range = landmarks[outer].x - landmarks[inner].x;
    if (Math.abs(range) < 0.001) return 0.5;
    return (landmarks[iris].x - landmarks[inner].x) / range;
  }

  const lRatio = irisRatio(L_INNER, L_OUTER, L_IRIS);
  const rRatio = irisRatio(R_INNER, R_OUTER, R_IRIS);
  const avg = (lRatio + rRatio) / 2;

  // 0.5에 가까울수록 정면 응시 → score 1
  const deviation = Math.abs(avg - 0.5);
  return Math.max(0, 1 - deviation * 4);
}
