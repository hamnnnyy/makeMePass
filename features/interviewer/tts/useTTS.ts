'use client';

import { useState, useCallback, useRef } from 'react';
import { getCachedAudio, setCachedAudio } from './audioCache';
import type { InterviewerRole } from '@/lib/constants/roles';

const PITCH: Record<InterviewerRole, number> = { hr: 1.1, tech: 0.9, exec: 0.8 };

// 서버 TTS가 모두 실패하면 브라우저 내장 음성으로 읽는다
function speakWithBrowser(text: string, role: InterviewerRole): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.pitch = PITCH[role];
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, role: InterviewerRole) => {
    stop();
    setSpeaking(true);

    try {
      const cacheKey = `${role}:${text}`;
      let src = getCachedAudio(cacheKey) ?? null;

      if (!src) {
        const { ttsSpeak } = await import('./ttsSpeak.server');
        src = await ttsSpeak(text, role).catch(() => null);
        if (src) setCachedAudio(cacheKey, src);
      }

      if (!src) {
        await speakWithBrowser(text, role);
        return;
      }

      const audio = new Audio(src);
      audioRef.current = audio;
      const played = await new Promise<boolean>((resolve) => {
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.play().catch(() => resolve(false));
      });
      if (!played) await speakWithBrowser(text, role);
    } finally {
      audioRef.current = null;
      setSpeaking(false);
    }
  }, [stop]);

  // 답변하는 동안 다음 질문 음성을 미리 받아 둔다 (Gemini TTS 는 한 문장에 수 초 걸림)
  const prefetch = useCallback(async (text: string, role: InterviewerRole) => {
    const cacheKey = `${role}:${text}`;
    if (getCachedAudio(cacheKey)) return;
    const { ttsSpeak } = await import('./ttsSpeak.server');
    const src = await ttsSpeak(text, role).catch(() => null);
    if (src) setCachedAudio(cacheKey, src);
  }, []);

  return { speak, stop, prefetch, speaking };
}
