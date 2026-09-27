'use client';

import { useEffect, useState } from 'react';
import type { AchievementUnlock } from '../types';

const RARITY_COLOR: Record<string, string> = {
  common:    '#a3a3a3',
  rare:      '#60a5fa',
  epic:      '#a78bfa',
  legendary: '#fbbf24',
};

export function AchievementToast({ achievements }: { achievements: AchievementUnlock[] }) {
  const [visible, setVisible] = useState(achievements.length > 0);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      if (idx + 1 < achievements.length) setIdx((i) => i + 1);
      else setVisible(false);
    }, 2800);
    return () => clearTimeout(t);
  }, [idx, visible, achievements.length]);

  if (!visible || !achievements[idx]) return null;

  const a = achievements[idx];
  const color = RARITY_COLOR[a.rarity] ?? RARITY_COLOR.common;

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 border rounded-2xl px-5 py-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300"
      style={{ borderColor: color }}
    >
      {a.icon && <span className="text-2xl">{a.icon}</span>}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          업적 해금
        </span>
        <span className="text-sm font-medium text-white">{a.name_ko}</span>
      </div>
    </div>
  );
}
