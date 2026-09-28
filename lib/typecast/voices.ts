import type { InterviewMode } from '@/lib/constants/modes';
import type { InterviewerRole } from '@/lib/constants/roles';
import type { PeerId } from '@/lib/constants/peers';

// 타입캐스트 음성 (GET https://api.typecast.ai/v3/voices 에서 골랐다). 모드마다 캐릭터가 달라 목소리도 다르다.
export const INTERVIEWER_VOICES: Record<InterviewMode, Record<InterviewerRole, string>> = {
  // 애니: 츤데레 인사쌤(가희) · 쿨한 선배(예준) · 천재형 위원장(혜민) — 사용자 선택
  cute: { hr: 'tc_624ccc04adcd568510764d3f', tech: 'tc_63edf3d68aab086d6b782a55', exec: 'tc_667ce80314cb3a612d6959e8' },
  // 현실: 서현 · 원우 · 대진
  realistic: { hr: 'tc_69f2e455ea79fd197aa0476f', tech: 'tc_686dc43ebd6351e06ee64d74', exec: 'tc_6a0e85a97f7750959b970d5d' },
  // 편안: 다은 · 도윤 · 경애
  casual: { hr: 'tc_692799c46508f6b9468c54c7', tech: 'tc_6a3350f8e5a50a4abe948fa8', exec: 'tc_6a867e7a0e6ddfd2f2dd17b6' },
  // 압박: 재선 · 강일 · 하데스
  boss: { hr: 'tc_684a7a1446e2a628b5b07230', tech: 'tc_68d4b115f0486108a7eefb37', exec: 'tc_6a867e6bd49b8f6a07db59da' },
};

// AI 지원자: 강민준(상우) · 윤서아(은채) — 사용자 선택
export const PEER_VOICES: Record<PeerId, string> = {
  p1: 'tc_6243facd089d0be613ffe643',
  p2: 'tc_663343c5b1f85ebd9f4896b9',
};
