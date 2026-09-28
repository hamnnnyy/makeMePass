import { rankName } from '../logic/level';

export function LevelBar({ level, into, need }: { level: number; into: number; need: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold">
          Lv.{level} <span className="text-pink-400">{rankName(level)}</span>
        </span>
        <span className="text-[11px] text-neutral-500">{into} / {need} XP</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-amber-300" style={{ width: `${(into / need) * 100}%` }} />
      </div>
    </div>
  );
}
