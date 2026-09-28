'use client';

import { useEffect, useRef } from 'react';
import { InterviewerSceneClient } from '@/features/visualizer/scenes/InterviewerSceneClient';
import { useOrbColors } from '../orbColors';
import { ROLE_ACCENT_HEX, ROLE_COLORS, ROLE_LABELS, type InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';
import { Portrait, type Mood } from './Portrait';

interface Props {
  mode: InterviewMode;
  role: InterviewerRole;
  mood?: Mood;         // 일러스트 표정
  name: string;
  favor: number;
  passLine?: number;   // 합격선(%) — 이 선까지 호감도를 채워야 한다
  delta?: { value: number; key: number };  // 방금 답변으로 변한 호감도 (팝업)
  large?: boolean;     // 결과 화면에서 결정적인 면접관을 크게 보여줌
  speaking?: boolean;  // 말하는 중이면 역할 색 테두리
  danger?: boolean;    // 탈락·반대 표시
  dimmed?: boolean;    // 다른 면접관이 말하는 중이면 어둡게
  getLevel?: () => number;  // 말하는 음성 크기 0~1 (-1 = 측정 불가)
}

// 말하는 동안 음성 크기를 CSS 변수 --lv 로 흘려 캐릭터 흔들림·빛·음파 막대를 움직인다
function useVoiceLevel(active: boolean, getLevel: (() => number) | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active) { el.style.setProperty('--lv', '0'); return; }
    let raf = 0, smooth = 0;
    const loop = (t: number) => {
      const real = getLevel?.() ?? -1;
      // 측정이 안 되면 말하는 느낌의 가짜 파형
      const target = real >= 0 ? real : 0.45 + 0.35 * Math.sin(t / 70) * Math.sin(t / 190);
      smooth += (target - smooth) * 0.35;
      el.style.setProperty('--lv', smooth.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, getLevel]);
  return ref;
}

const BARS = [0.5, 0.8, 1, 0.8, 0.5];

export function InterviewerPanel({ mode, role, mood, name, favor, passLine, delta, large, speaking, danger, dimmed, getLevel }: Props) {
  const levelRef = useVoiceLevel(!!speaking, getLevel);
  const orb = useOrbColors()[role] ?? ROLE_ACCENT_HEX[role];
  const ring = danger ? '#7f1d1d' : speaking ? ROLE_COLORS[role] : undefined;
  return (
    <div
      ref={levelRef}
      className={`relative rounded-2xl overflow-hidden bg-neutral-900 transition-[filter] duration-300 ${large ? 'h-[300px]' : 'h-[220px]'} ${dimmed ? 'brightness-[0.55] saturate-50' : ''}`}
      style={ring ? {
        boxShadow: speaking
          ? `0 0 0 2px ${ring}, 0 0 calc(8px + var(--lv, 0) * 36px) ${ring}`
          : `0 0 0 2px ${ring}`,
      } : undefined}
    >
      {/* 일러스트가 있으면 캐릭터를 크게, 음성 반응 구슬은 왼쪽 위에 작게. 없으면 구슬만. */}
      {/* 말하는 동안 목소리 크기에 맞춰 살짝 커지고 들썩인다 */}
      <div
        className="absolute inset-0 origin-bottom"
        style={speaking ? { transform: 'scale(calc(1 + var(--lv, 0) * 0.04)) translateY(calc(var(--lv, 0) * -4px))' } : undefined}
      >
        <Portrait
          mode={mode}
          role={role}
          mood={mood}
          sizes="(max-width: 768px) 33vw, 320px"
          fallback={<InterviewerSceneClient key={orb} color={orb} controls={false} />}
        >
          <div className="absolute top-2 left-2 size-11 rounded-full overflow-hidden bg-black/60 ring-1 ring-white/20">
            <InterviewerSceneClient key={orb} color={orb} controls={false} />
          </div>
        </Portrait>
      </div>
      {speaking && (
        <>
          {/* 아래에서 올라오는 역할 색 빛 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 110%, ${ROLE_COLORS[role]}, transparent 60%)`, opacity: 'calc(0.15 + var(--lv, 0) * 0.5)' }}
          />
          {/* 음파 막대 */}
          <div className="absolute bottom-14 right-3 flex items-center gap-[3px] h-5">
            {BARS.map((k, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full"
                style={{ background: ROLE_ACCENT_HEX[role], height: `calc(3px + var(--lv, 0) * ${k * 17}px)` }}
              />
            ))}
          </div>
        </>
      )}
      {delta && delta.value !== 0 && (
        <span
          key={delta.key}
          className={`absolute top-3 right-3 z-10 text-2xl font-black animate-float-up drop-shadow ${delta.value > 0 ? 'text-emerald-300' : 'text-red-400'}`}
        >
          {delta.value > 0 ? `+${delta.value}` : `−${-delta.value}`}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 flex flex-col gap-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex justify-between items-center">
          <span className={`font-display ${large ? 'text-lg' : 'text-base'}`}>
            {ROLE_LABELS[role]}
            <span className="font-normal text-neutral-300"> | {name}</span>
          </span>
          <span className={`${passLine !== undefined && favor >= passLine ? 'text-white font-semibold' : 'text-neutral-400'} ${large ? 'text-sm' : 'text-xs'}`}>
            {passLine !== undefined && favor >= passLine && '♥ '}{Math.round(favor)}%
          </span>
        </div>
        <div className="relative h-[3px] w-full bg-neutral-700 rounded-full">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${favor}%`, backgroundColor: ROLE_COLORS[role] }}
          />
          {passLine !== undefined && (
            <div
              title={`합격선 ${passLine}%`}
              className={`absolute -top-1 h-[11px] w-[2px] rounded ${favor >= passLine ? 'bg-white' : 'bg-white/40'}`}
              style={{ left: `${passLine}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
