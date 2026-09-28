'use client';

import { BARS, useVoiceLevel } from '@/features/interviewer/components/InterviewerPanel';
import { PEERS, type PeerId } from '@/lib/constants/peers';

interface Props {
  peer: PeerId;
  side?: string;               // 토론: 찬성/반대
  speaking: boolean;
  getLevel?: () => number;
}

// AI 지원자 자리. 말할 때 목소리 크기에 맞춰 빛나고 음파 막대가 움직인다.
export function PeerSeat({ peer, side, speaking, getLevel }: Props) {
  const ref = useVoiceLevel(speaking, getLevel);
  const { name, color } = PEERS[peer];
  return (
    <div
      ref={ref}
      className={`relative rounded-2xl bg-neutral-900 border px-4 py-5 flex flex-col items-center gap-3 transition-[filter,border-color] duration-300 ${speaking ? '' : 'brightness-75'}`}
      style={{
        borderColor: speaking ? color : 'var(--color-neutral-800)',
        boxShadow: speaking ? `0 0 calc(6px + var(--lv, 0) * 30px) ${color}` : undefined,
      }}
    >
      <div
        className="size-16 rounded-full flex items-center justify-center font-display text-2xl text-night"
        style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${color} 60%)` }}
        aria-hidden
      >
        {name[0]}
      </div>
      <div className="text-center">
        <p className="font-display text-lg leading-tight">{name}</p>
        <p className="text-[11px] text-neutral-500">AI 지원자{side ? ` · ${side} 측` : ''}</p>
      </div>
      <div className="flex items-center gap-[3px] h-5">
        {BARS.map((k, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{ background: color, height: speaking ? `calc(3px + var(--lv, 0) * ${k * 17}px)` : '3px', opacity: speaking ? 1 : 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
