import 'server-only';
import { assertEnv } from '@/lib/utils/assertEnv';

export type Emotion = 'normal' | 'happy' | 'sad' | 'angry' | 'whisper' | 'toneup' | 'tonedown';
// 타입캐스트 언어 코드 (ISO 639-3)
export type TtsLanguage = 'kor' | 'eng';

// 타입캐스트 음성 합성 → mp3 바이트. https://typecast.ai/docs/quickstart
export async function synthesize(text: string, voiceId: string, language: TtsLanguage = 'kor', emotion: Emotion = 'normal'): Promise<ArrayBuffer> {
  const res = await fetch('https://api.typecast.ai/v1/text-to-speech', {
    method: 'POST',
    headers: { 'X-API-KEY': assertEnv('TYPECAST_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_id: voiceId,
      text,
      model: 'ssfm-v30',
      language,
      prompt: { emotion_preset: emotion },
      output: { audio_format: 'mp3' },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Typecast ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.arrayBuffer();
}
