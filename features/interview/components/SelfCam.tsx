'use client';

import { useEffect, useRef } from 'react';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { FaceMetrics } from '@/features/mediapipe/types';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  resultRef: React.RefObject<FaceLandmarkerResult | null>;
  metrics: FaceMetrics;
}

export function SelfCam({ videoRef, resultRef, metrics }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 캔버스에 랜드마크 오버레이 그리기
  useEffect(() => {
    let raf: number;

    async function draw() {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { raf = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const result = resultRef.current;
      if (result && result.faceLandmarks.length > 0) {
        const { DrawingUtils, FaceLandmarker } = await import('@mediapipe/tasks-vision');
        const drawingUtils = new DrawingUtils(ctx);

        drawingUtils.drawConnectors(
          result.faceLandmarks[0],
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: '#FFFFFF08', lineWidth: 0.5 },
        );
        drawingUtils.drawConnectors(
          result.faceLandmarks[0],
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: '#FF3030', lineWidth: 1 },
        );
        drawingUtils.drawConnectors(
          result.faceLandmarks[0],
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: '#30FF30', lineWidth: 1 },
        );
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, resultRef]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover -scale-x-100"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100"
      />
      {/* 지표 오버레이 */}
      {metrics.detected && (
        <div className="absolute bottom-2 left-2 flex gap-2">
          <MetricPill label="시선" value={metrics.gazeScore} />
          <MetricPill label="표정" value={metrics.smileScore} />
          <MetricPill label="자세" value={metrics.stability} />
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 60 ? '#22c55e' : pct >= 30 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 text-xs">
      <span className="text-neutral-400">{label}</span>
      <span style={{ color }} className="font-bold">{pct}</span>
    </div>
  );
}
