'use client';

import { useEffect, useState } from 'react';
import type { InterviewerRole } from '@/lib/constants/roles';

// ponytail: 브라우저(localStorage)에만 저장. 기기 간 동기화가 필요하면 profiles 컬럼으로 옮길 것.
const KEY = 'hapsaca:orb-colors';
const EVENT = 'hapsaca:orb-colors';
type OrbColors = Partial<Record<InterviewerRole, string>>;

function read(): OrbColors {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveOrbColor(role: InterviewerRole, hex: string | null) {
  const next = read();
  if (hex) next[role] = hex;
  else delete next[role];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 시크릿 모드 등에서 저장 불가 — 기본색 유지
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useOrbColors(): OrbColors {
  const [colors, setColors] = useState<OrbColors>({});
  useEffect(() => {
    const sync = () => setColors(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return colors;
}
