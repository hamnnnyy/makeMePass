'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SystemAudioAnalyser } from '../engine/SystemAudioAnalyser';

export function useSystemAudioReactive() {
  const ref = useRef<SystemAudioAnalyser | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (ref.current) return;
    const analyser = new SystemAudioAnalyser();
    try {
      await analyser.connect();
      ref.current = analyser;
      setActive(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오디오 캡처에 실패했습니다.');
    }
  }, []);

  const stop = useCallback(() => {
    ref.current?.disconnect();
    ref.current = null;
    setActive(false);
  }, []);

  useEffect(
    () => () => {
      ref.current?.disconnect();
      ref.current = null;
    },
    []
  );

  const getFrequencyData = useCallback(
    (): Uint8Array<ArrayBuffer> => ref.current?.getFrequencyData() ?? new Uint8Array(0),
    []
  );
  const getAmplitude = useCallback(
    () => ref.current?.getAmplitude() ?? 0,
    []
  );

  return { start, stop, active, error, getFrequencyData, getAmplitude };
}
