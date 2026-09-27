'use server';

import { synthesizeSpeech } from '@/lib/google-tts/client';
import { GEMINI_TTS_VOICES, TTS_VOICES } from '@/lib/google-tts/voices';
import { getGeminiClient } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import type { InterviewerRole } from '@/lib/constants/roles';

// Cloud TTS 키가 막혀 있으면 서버가 살아 있는 동안 다시 시도하지 않는다
let cloudDisabled = !process.env.GOOGLE_TTS_API_KEY;
// Gemini TTS 무료 한도(하루 10회)를 넘기면 한동안 건너뛴다
let geminiDisabledUntil = 0;

// 재생 가능한 data URL. 둘 다 실패하면 null → 브라우저 음성으로 대체.
export async function ttsSpeak(text: string, role: InterviewerRole): Promise<string | null> {
  if (!cloudDisabled) {
    try {
      return `data:audio/mp3;base64,${await synthesizeSpeech(text, TTS_VOICES[role])}`;
    } catch (e) {
      console.error('Cloud TTS failed, switching to Gemini TTS', e);
      cloudDisabled = true;
    }
  }

  if (Date.now() < geminiDisabledUntil) return null;
  try {
    const res = await getGeminiClient().models.generateContent({
      model: MODELS.tts,
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICES[role] } } },
        httpOptions: { timeout: 20_000 },
      },
    });
    const audio = res.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (audio?.data && audio.mimeType === 'audio/wav') return `data:audio/wav;base64,${audio.data}`;
    console.error('Gemini TTS returned', audio?.mimeType);
  } catch (e) {
    if ((e as { status?: number }).status === 429) geminiDisabledUntil = Date.now() + 10 * 60_000;
    console.error('Gemini TTS failed', (e as Error).message?.slice(0, 200));
  }
  return null;
}
