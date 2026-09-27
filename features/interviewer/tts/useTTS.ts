'use client';

import { useState, useCallback, useRef } from 'react';
import { getCachedAudio, setCachedAudio } from './audioCache';
import type { InterviewerRole } from '@/lib/constants/roles';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, role: InterviewerRole) => {
    stop();
    setSpeaking(true);

    try {
      const cacheKey = `${role}:${text}`;
      let base64 = getCachedAudio(cacheKey);

      if (!base64) {
        const { ttsSpeak } = await import('./ttsSpeak.server');
        base64 = await ttsSpeak(text, role);
        setCachedAudio(cacheKey, base64);
      }

      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve(); // 실패해도 진행
        audio.play().catch(() => resolve());
      });
    } catch {
      // TTS 실패해도 면접은 계속
    } finally {
      audioRef.current = null;
      setSpeaking(false);
    }
  }, [stop]);

  return { speak, stop, speaking };
}
