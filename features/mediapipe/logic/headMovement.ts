import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// 코 끝(1)과 턱 중앙(152)으로 수직 방향 추정
const NOSE_TIP = 1;
const CHIN = 152;

export function computeStabilityScore(
  landmarks: NormalizedLandmark[],
  prevY: React.MutableRefObject<number>,
): number {
  if (landmarks.length < 200) return 1;

  const noseY = landmarks[NOSE_TIP].y;
  const chinY = landmarks[CHIN].y;
  const faceHeight = Math.abs(chinY - noseY);
  const movement = Math.abs(noseY - prevY.current) / (faceHeight + 0.001);

  prevY.current = noseY;
  return Math.max(0, 1 - movement * 20);
}
