'use client';

import { useEffect, useRef, useState } from 'react';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { computeGazeScore } from '../logic/gazeTracker';
import { computeSmileScore } from '../logic/smileDetector';
import { computeStabilityScore } from '../logic/headMovement';
import type { FaceMetrics } from '../types';

const DEFAULT: FaceMetrics = { gazeScore: 0, smileScore: 0, stability: 1, detected: false };

export function useExpressionMetrics(
  resultRef: React.RefObject<FaceLandmarkerResult | null>,
  active: boolean,
): FaceMetrics {
  const [metrics, setMetrics] = useState<FaceMetrics>(DEFAULT);
  const prevYRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    function poll() {
      const result = resultRef.current;
      if (result && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        const blendshapes = result.faceBlendshapes ?? [];

        setMetrics({
          detected: true,
          gazeScore: computeGazeScore(landmarks),
          smileScore: computeSmileScore(blendshapes),
          stability: computeStabilityScore(landmarks, prevYRef),
        });
      } else {
        setMetrics(DEFAULT);
      }
      rafRef.current = requestAnimationFrame(poll);
    }

    rafRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, resultRef]);

  return metrics;
}
