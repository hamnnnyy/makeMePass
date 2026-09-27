'use client';

import { INTERVIEWER_ROLES, ROLE_ACCENT_HEX, ROLE_LABELS } from '@/lib/constants/roles';
import { ORB_COLORS } from '@/features/gamification/logic/level';
import { saveOrbColor, useOrbColors } from '@/features/interviewer/orbColors';

// 역할별 구슬 색. 레벨이 모자라면 잠금 표시.
export function OrbColorPicker({ level }: { level: number }) {
  const colors = useOrbColors();
  return (
    <div className="flex flex-col gap-4">
      {INTERVIEWER_ROLES.map((role) => {
        const current = colors[role] ?? ROLE_ACCENT_HEX[role];
        return (
          <div key={role} className="flex items-center gap-4">
            <span className="w-12 text-xs font-bold">{ROLE_LABELS[role]}</span>
            <div className="flex flex-wrap gap-2">
              {ORB_COLORS.map((c) => {
                const locked = c.level > level;
                const selected = current === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    disabled={locked}
                    title={locked ? `Lv.${c.level}에 해금` : c.label}
                    aria-label={`${ROLE_LABELS[role]} ${c.label}${locked ? ' (잠김)' : ''}`}
                    aria-pressed={selected}
                    onClick={() => saveOrbColor(role, c.hex === ROLE_ACCENT_HEX[role] ? null : c.hex)}
                    className={`relative w-8 h-8 rounded-full transition ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''} ${locked ? 'opacity-25 cursor-not-allowed' : 'hover:scale-110'}`}
                    style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${c.hex} 45%, #000 110%)` }}
                  >
                    {locked && <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{c.level}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
