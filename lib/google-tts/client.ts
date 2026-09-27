import 'server-only';
import { assertEnv } from '@/lib/utils/assertEnv';

export async function synthesizeSpeech(text: string, voiceName: string): Promise<string> {
  const apiKey = assertEnv('GOOGLE_TTS_API_KEY');

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'ko-KR', name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Google TTS error: ${res.status}`);
  const data = await res.json();
  return data.audioContent as string; // base64 MP3
}
