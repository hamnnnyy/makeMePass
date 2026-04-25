'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MicAnalyser } from '../engine/MicAnalyser';

export function useMicReactive() {
  const ref = useRef<MicAnalyser | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (ref.current) return;
    const mic = new MicAnalyser();
    try {
      await mic.connect();
      ref.current = mic;
      setActive(true);
      setError(null);
    } catch {
      setError('마이크 접근이 거부되었습니다.');
    }
  }, []);

  useEffect(
    () => () => {
      ref.current?.disconnect();
      ref.current = null;
    },
    []
  );

  const getPitch      = useCallback(() => ref.current?.getPitch()      ?? 0, []);
  const getSpeechRate = useCallback(() => ref.current?.getSpeechRate() ?? 0, []);
  const getAmplitude  = useCallback(() => ref.current?.getAmplitude()  ?? 0, []);

  return { start, active, error, getPitch, getSpeechRate, getAmplitude };
}
