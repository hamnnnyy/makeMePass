'use client';

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
}

export function InterviewerPanel({ mode, role, mood, name, favor, passLine, delta, large, speaking, danger }: Props) {
  const orb = useOrbColors()[role] ?? ROLE_ACCENT_HEX[role];
  const ring = danger ? '#7f1d1d' : speaking ? ROLE_COLORS[role] : undefined;
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-neutral-900 transition-shadow ${large ? 'h-[300px]' : 'h-[220px]'}`}
      style={ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined}
    >
      {/* 일러스트가 있으면 캐릭터를 크게, 음성 반응 구슬은 왼쪽 위에 작게. 없으면 구슬만. */}
      <div className="absolute inset-0">
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
          <span className={`font-bold ${large ? 'text-sm' : 'text-xs'}`}>
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
