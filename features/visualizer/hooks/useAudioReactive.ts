'use client';

import { useAudioAnalyser } from './useAudioAnalyser';

export function useAudioReactive(audioSource?: HTMLAudioElement) {
  const analyserRef = useAudioAnalyser(audioSource);

  const getIntensity = () => analyserRef.current?.getIntensity() ?? 0;
  const getBassIntensity = () => analyserRef.current?.getBassIntensity() ?? 0;

  return { getIntensity, getBassIntensity };
}
