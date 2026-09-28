import type { InterviewMode } from '@/lib/constants/modes';
import type { InterviewerRole } from '@/lib/constants/roles';
import type { PeerId } from '@/lib/constants/peers';

// 타입캐스트 음성 (GET https://api.typecast.ai/v3/voices 에서 골랐다). 모드마다 캐릭터가 달라 목소리도 다르다.
export const INTERVIEWER_VOICES: Record<InterviewMode, Record<InterviewerRole, string>> = {
  // 애니: 츤데레 인사쌤(라일리) · 쿨한 선배(세우) · 천재형 위원장(아테나)
  cute: { hr: 'tc_67db7504d5ebacf7578e68f1', tech: 'tc_67d2346b8572120c4aa63e33', exec: 'tc_63745dc2d87a09363fb4391d' },
  // 현실: 서현 · 원우 · 대진
  realistic: { hr: 'tc_69f2e455ea79fd197aa0476f', tech: 'tc_686dc43ebd6351e06ee64d74', exec: 'tc_6a0e85a97f7750959b970d5d' },
  // 편안: 다은 · 도윤 · 경애
  casual: { hr: 'tc_692799c46508f6b9468c54c7', tech: 'tc_6a3350f8e5a50a4abe948fa8', exec: 'tc_6a867e7a0e6ddfd2f2dd17b6' },
  // 압박: 재선 · 강일 · 하데스
  boss: { hr: 'tc_684a7a1446e2a628b5b07230', tech: 'tc_68d4b115f0486108a7eefb37', exec: 'tc_6a867e6bd49b8f6a07db59da' },
};

// AI 지원자: 강민준(노엘) · 윤서아(오드리)
export const PEER_VOICES: Record<PeerId, string> = {
  p1: 'tc_638efbb7fac82cf52330aa49',
  p2: 'tc_67e38e6d4600650873ac157c',
};
