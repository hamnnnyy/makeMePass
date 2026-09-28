import type { ReactNode } from 'react';
import { ROLE_COLORS, type InterviewerRole } from '@/lib/constants/roles';

interface Props {
  role?: InterviewerRole | null;  // 말하는 면접관 (없으면 이름표 없이 안내문)
  color?: string;                 // 면접관이 아닌 화자(AI 지원자·나)의 이름표 색
  name?: string;
  tag?: string;                   // 이름표 옆 작은 표시 (예: 꼬리질문)
  children: ReactNode;
}

// 비주얼노벨 대사창: 말하는 면접관 이름표 + 대사
export function DialogueBox({ role, color: own, name, tag, children }: Props) {
  const color = own ?? (role ? ROLE_COLORS[role] : undefined);
  return (
    <div className="relative mt-3 w-full">
      {color && (
        <div
          className="absolute -top-3.5 left-5 z-10 flex items-center gap-2 rounded-lg px-3 py-1 font-display text-base shadow-lg"
          style={{ background: color, color: '#0e1020' }}
        >
          {name}
          {tag && <span className="text-[11px] font-sans font-bold opacity-70">{tag}</span>}
        </div>
      )}
      <div
        className="rounded-2xl bg-neutral-900/90 border px-6 pt-6 pb-5 min-h-[88px] text-base leading-relaxed text-neutral-100"
        style={{ borderColor: color ? `${color}66` : 'var(--color-neutral-800)', boxShadow: color ? `0 10px 40px -20px ${color}` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
