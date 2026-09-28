'use server';

import { synthesizeSpeech } from '@/lib/google-tts/client';
import { TTS_VOICES } from '@/lib/google-tts/voices';
import type { InterviewerRole } from '@/lib/constants/roles';

// Cloud TTS 키가 없거나 막혀 있으면 서버가 살아 있는 동안 다시 시도하지 않는다
let cloudDisabled = !process.env.GOOGLE_TTS_API_KEY;

// 재생 가능한 data URL. 실패하면 null → 클라이언트가 브라우저 음성으로 읽는다.
// (Gemini TTS 는 문장당 ~4초에 무료 한도 하루 10회라 면접 흐름을 늦춰서 쓰지 않는다)
export async function ttsSpeak(text: string, role: InterviewerRole): Promise<string | null> {
  if (cloudDisabled) return null;
  try {
    return `data:audio/mp3;base64,${await synthesizeSpeech(text, TTS_VOICES[role])}`;
  } catch (e) {
    console.error('Cloud TTS failed, using browser speech', (e as Error).message);
    cloudDisabled = true;
    return null;
  }
}
