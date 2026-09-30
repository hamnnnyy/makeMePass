'use client';

import { useState, useCallback, useRef } from 'react';
import { getCachedAudio, setCachedAudio } from './audioCache';
import type { Speaker } from '@/lib/constants/peers';
import type { InterviewMode } from '@/lib/constants/modes';
import type { TtsLanguage } from '@/lib/typecast/client';

// 서버 음성 주소 (실패하면 null → 브라우저 음성)
async function fetchTts(text: string, speaker: Speaker, mode: InterviewMode, language: TtsLanguage, cast: number): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speaker, mode, language, cast }),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok ? ((await res.json()) as { src: string | null }).src : null;
  } catch {
    return null;
  }
}

// 브라우저 음성은 목소리가 하나라 높낮이·빠르기로 사람을 구분한다
const PITCH: Record<Speaker, number> = { hr: 1.1, tech: 0.9, exec: 0.8, p1: 1.0, p2: 1.35 };
const RATE: Partial<Record<Speaker, number>> = { p1: 1.15, p2: 1.05 };

// 서버 TTS가 모두 실패하면 브라우저 내장 음성으로 읽는다
function speakWithBrowser(text: string, role: Speaker, language: TtsLanguage): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === 'eng' ? 'en-US' : 'ko-KR';
    u.pitch = PITCH[role];
    u.rate = RATE[role] ?? 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

// mode·cast: 모드와 기수마다 면접관 캐릭터와 목소리가 다르다
export function useTTS(mode: InterviewMode, language: TtsLanguage = 'kor', cast = 1) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(256));

  // 재생 중인 음성의 볼륨을 분석기에 연결한다.
  // 오디오 컨텍스트가 멈춘 상태로 연결하면 소리가 안 나므로, 실행 중일 때만 연결한다.
  const attachAnalyser = useCallback(async (audio: HTMLAudioElement) => {
    try {
      const ctx = ctxRef.current ?? (ctxRef.current = new AudioContext());
      if (ctx.state !== 'running') await ctx.resume();
      if (ctx.state !== 'running') return;
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      ctx.createMediaElementSource(audio).connect(node);
      node.connect(ctx.destination);
      analyserRef.current = node;
    } catch {
      analyserRef.current = null;
    }
  }, []);

  // 말하는 음성의 크기 0~1. 분석기가 없으면(브라우저 음성 등) -1.
  const getLevel = useCallback(() => {
    const node = analyserRef.current;
    if (!node) return -1;
    const buf = bufRef.current;
    node.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / buf.length) * 5);
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, role: Speaker) => {
    stop();
    setSpeaking(true);

    try {
      const cacheKey = `${mode}:${cast}:${role}:${text}`;
      let src = getCachedAudio(cacheKey) ?? null;

      if (!src) {
        src = await fetchTts(text, role, mode, language, cast);
        if (src) setCachedAudio(cacheKey, src);
      }

      if (!src) {
        await speakWithBrowser(text, role, language);
        return;
      }

      const audio = new Audio();
      // 캐시 음성은 Supabase 공개 URL 이라, 분석기에 연결하려면 CORS 로 받아야 소리가 난다
      if (src.startsWith('http')) audio.crossOrigin = 'anonymous';
      audio.src = src;
      audioRef.current = audio;
      await attachAnalyser(audio);
      const played = await new Promise<boolean>((resolve) => {
        // 끝났다는 신호가 오지 않으면 면접이 멈춘다 → 불러오기 15초, 재생은 길이 + 3초가 지나면 넘어간다
        let timer = setTimeout(() => resolve(true), 15_000);
        const done = (ok: boolean) => { clearTimeout(timer); resolve(ok); };
        audio.onloadedmetadata = () => {
          clearTimeout(timer);
          timer = setTimeout(() => resolve(true), (Number.isFinite(audio.duration) ? audio.duration : 30) * 1000 + 3000);
        };
        audio.onended = () => done(true);
        audio.onerror = () => done(false);
        audio.play().catch(() => done(false));
      });
      audio.pause();
      if (!played) await speakWithBrowser(text, role, language);
    } finally {
      audioRef.current = null;
      analyserRef.current = null;
      setSpeaking(false);
    }
  }, [stop, attachAnalyser, mode, language, cast]);

  // 답변하는 동안 다음 질문 음성을 미리 받아 둔다 (Gemini TTS 는 한 문장에 수 초 걸림)
  const prefetch = useCallback(async (text: string, role: Speaker) => {
    const cacheKey = `${mode}:${cast}:${role}:${text}`;
    if (getCachedAudio(cacheKey)) return;
    const src = await fetchTts(text, role, mode, language, cast);
    if (src) setCachedAudio(cacheKey, src);
  }, [mode, language, cast]);

  return { speak, stop, prefetch, speaking, getLevel };
}
