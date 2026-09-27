'use client';

import { useEffect, useRef, useState } from 'react';
import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function useFaceLandmarker(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [ready, setReady] = useState(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const resultRef = useRef<FaceLandmarkerResult | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      if (cancelled) { landmarker.close(); return; }
      landmarkerRef.current = landmarker;
      setReady(true);
    }

    init().catch(console.error);
    return () => { cancelled = true; };
  }, []);

  // 매 프레임 추론
  useEffect(() => {
    if (!ready) return;

    let lastTime = -1;

    function loop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (video && landmarker && video.readyState >= 2) {
        const now = performance.now();
        if (now !== lastTime) {
          resultRef.current = landmarker.detectForVideo(video, now);
          lastTime = now;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, videoRef]);

  return { ready, resultRef };
}
