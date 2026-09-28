import type { InterviewerRole } from './roles';

// 다대다·토론·토의 면접의 AI 가상 지원자
export const PEER_IDS = ['p1', 'p2'] as const;
export type PeerId = (typeof PEER_IDS)[number];
export type Speaker = InterviewerRole | PeerId;

export const PEERS: Record<PeerId, { name: string; color: string; style: string }> = {
  p1: {
    name: '강민준',
    color: '#94a3b8',
    style: '자신감 넘치고 말이 빠른 스펙형. 자격증·수치·대외활동을 앞세우고, 가끔 과장하거나 질문 의도를 벗어난다.',
  },
  p2: {
    name: '윤서아',
    color: '#e879f9',
    style: '차분한 공감형. 현장 경험을 이야기로 풀어내지만 결론이 늦고 근거가 약할 때가 있다.',
  },
};

export type PeerTurn = { peer: PeerId; intent: string; text?: string };

export const isPeer = (s: Speaker): s is PeerId => (PEER_IDS as readonly string[]).includes(s);
export const speakerName = (s: Speaker, names: Record<InterviewerRole, string>) =>
  isPeer(s) ? `지원자 ${PEERS[s].name}` : names[s];
