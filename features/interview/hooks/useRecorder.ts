'use client';

import { useCallback, useRef, useState } from 'react';

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const recorder = new MediaRecorder(stream);
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }, []);

  // 녹음을 멈추고 전체 오디오를 돌려준다
  const stop = useCallback((): Promise<Blob> => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    if (!recorder) return Promise.resolve(new Blob());

    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.stop();
    });
  }, []);

  return { recording, start, stop };
}
