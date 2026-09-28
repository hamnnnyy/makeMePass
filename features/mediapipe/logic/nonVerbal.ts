import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { computeGazeScore } from './gazeTracker';
import { computeSmileScore } from './smileDetector';
import { computeStabilityScore } from './headMovement';

export interface NonVerbalSummary {
  presence: number;      // 0-1  얼굴이 화면에 잡힌 비율
  gazeOnRatio: number;   // 0-1  카메라(면접관)를 본 비율
  smileAvg: number;      // 0-1
  smileRatio: number;    // 0-1  미소가 보인 프레임 비율
  frownAvg: number;      // 0-1  미간 찌푸림 (browDown)
  tensionAvg: number;    // 0-1  입 굳음·입꼬리 처짐 (mouthPress·mouthFrown)
  stabilityAvg: number;  // 0-1  1 = 자세 안정
  blinkPerMin: number;
}

// 답변 한 번 동안의 프레임을 누적한다.
export function createTracker() {
  return {
    frames: 0, detected: 0, gazeOn: 0, smile: 0, smileFrames: 0, frown: 0, tension: 0, stability: 0,
    blinks: 0, eyesClosed: false, prevY: { current: 0 }, startMs: 0, lastMs: 0,
  };
}
export type Tracker = ReturnType<typeof createTracker>;

export function addFrame(t: Tracker, result: FaceLandmarkerResult | null, nowMs: number) {
  if (t.frames === 0) t.startMs = nowMs;
  t.lastMs = nowMs;
  t.frames++;
  const landmarks = result?.faceLandmarks[0];
  if (!landmarks) return;

  t.detected++;
  const blend = result.faceBlendshapes ?? [];
  const cat = (name: string) => blend[0]?.categories.find((c) => c.categoryName === name)?.score ?? 0;

  // 좌우 홍채 위치 + 아래를 보는지(원고 읽기 등)를 함께 본다
  const lookDown = (cat('eyeLookDownLeft') + cat('eyeLookDownRight')) / 2;
  if (computeGazeScore(landmarks) >= 0.6 && lookDown < 0.5) t.gazeOn++;

  const smile = computeSmileScore(blend);
  t.smile += smile;
  if (smile >= 0.4) t.smileFrames++;
  t.frown += (cat('browDownLeft') + cat('browDownRight')) / 2;
  t.tension += (cat('mouthPressLeft') + cat('mouthPressRight') + cat('mouthFrownLeft') + cat('mouthFrownRight')) / 4;
  t.stability += computeStabilityScore(landmarks, t.prevY);

  const closed = (cat('eyeBlinkLeft') + cat('eyeBlinkRight')) / 2 > 0.5;
  if (closed && !t.eyesClosed) t.blinks++;
  t.eyesClosed = closed;
}

export function summarize(t: Tracker): NonVerbalSummary {
  const minutes = Math.max((t.lastMs - t.startMs) / 60000, 1 / 60);
  const d = Math.max(t.detected, 1);
  return {
    presence: t.frames ? t.detected / t.frames : 0,
    gazeOnRatio: t.gazeOn / d,
    smileAvg: t.smile / d,
    smileRatio: t.smileFrames / d,
    frownAvg: t.frown / d,
    tensionAvg: t.tension / d,
    stabilityAvg: t.detected ? t.stability / d : 0,
    blinkPerMin: t.blinks / minutes,
  };
}
