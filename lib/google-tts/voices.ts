import type { InterviewerRole } from '@/lib/constants/roles';

export const TTS_VOICES: Record<InterviewerRole, string> = {
  hr:   'ko-KR-Neural2-A',
  tech: 'ko-KR-Neural2-C',
  exec: 'ko-KR-Neural2-B',
};

// Cloud TTS 키가 없을 때 쓰는 Gemini TTS 기본 음성
export const GEMINI_TTS_VOICES: Record<InterviewerRole, string> = {
  hr:   'Kore',
  tech: 'Charon',
  exec: 'Leda',
};
