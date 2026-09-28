import type { Speaker } from '@/lib/constants/peers';

export const TTS_VOICES: Record<Speaker, string> = {
  hr:   'ko-KR-Neural2-A',
  tech: 'ko-KR-Neural2-C',
  exec: 'ko-KR-Neural2-B',
  // AI 지원자는 면접관과 다른 음성 계열
  p1:   'ko-KR-Wavenet-C',
  p2:   'ko-KR-Wavenet-B',
};
