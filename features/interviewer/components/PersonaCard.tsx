import { ROLE_ACCENT_HEX, ROLE_COLORS, ROLE_LABELS, type InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';
import { Portrait } from './Portrait';

interface Props {
  mode: InterviewMode;
  role: InterviewerRole;
  name: string;
  position?: string | null;
  collected: boolean;
  isNew?: boolean;
}

// 도감 카드. WebGL 캔버스를 여러 개 띄우면 브라우저 컨텍스트 한도에 걸려서 CSS 구체로 그린다.
export function PersonaCard({ mode, role, name, position, collected, isNew }: Props) {
  const accent = ROLE_ACCENT_HEX[role];
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-black aspect-[3/4] flex flex-col ${collected ? '' : 'opacity-60'}`}
      style={collected ? { boxShadow: `0 0 0 1px ${ROLE_COLORS[role]}55` } : undefined}
    >
      {isNew && (
        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold bg-orange-500 rounded-full px-2 py-0.5">NEW</span>
      )}
      {/* 일러스트가 있으면 캐릭터 (미수집은 실루엣), 없으면 구슬 */}
      <div className="relative flex-1 flex items-center justify-center">
        <Portrait
          mode={mode}
          role={role}
          silhouette={!collected}
          sizes="(max-width: 768px) 33vw, 240px"
          fallback={
            <div
              className="w-2/3 aspect-square rounded-full"
              style={collected
                ? { background: `radial-gradient(circle at 35% 30%, #fff 0%, ${accent} 35%, ${ROLE_COLORS[role]} 70%, #000 100%)`, boxShadow: `0 0 40px ${accent}88` }
                : { background: 'radial-gradient(circle at 35% 30%, #3f3f46, #18181b 70%)' }}
            />
          }
        />
      </div>
      <div className="relative px-3 py-2.5 bg-gradient-to-t from-black to-transparent -mt-12 pt-12">
        <p className="text-[11px] font-bold" style={{ color: collected ? ROLE_COLORS[role] : '#71717a' }}>{ROLE_LABELS[role]}</p>
        <p className="text-sm">{collected ? name : '???'}</p>
        {collected && position && <p className="text-[11px] text-neutral-500">{position}</p>}
      </div>
    </div>
  );
}
