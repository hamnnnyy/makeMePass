'use client';

import { useRef, useEffect } from 'react';
import { AudioAnalyser } from '../engine/AudioAnalyser';

export function useAudioAnalyser(audioSource?: HTMLAudioElement) {
  const analyserRef = useRef<AudioAnalyser | null>(null);

  useEffect(() => {
    if (!audioSource) return;
    const analyser = new AudioAnalyser();
    analyser.connect(audioSource);
    analyserRef.current = analyser;
    return () => {
      analyser.disconnect();
      analyserRef.current = null;
    };
  }, [audioSource]);

  return analyserRef;
}
