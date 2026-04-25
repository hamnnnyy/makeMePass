'use client';

import { useMemo } from 'react';
import { ParticleSystem } from '../engine/ParticleSystem';

interface Options {
  count?: number;
  preset?: 'realistic' | 'performance';
}

export function useParticleSystem({ count = 10800, preset = 'realistic' }: Options = {}) {
  return useMemo(() => {
    const cols = preset === 'realistic' ? 180 : 100;
    const rows = Math.round(count / cols);
    return new ParticleSystem({
      cols,
      rows,
      width: 8,
      height: 2.4,
      waveFrequency: 1.25,
      waveAmplitude: 0.88,
      speed: 0.5,
    });
  }, [count, preset]);
}
