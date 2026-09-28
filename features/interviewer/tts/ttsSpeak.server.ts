'use server';

import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { synthesize } from '@/lib/typecast/client';
import { INTERVIEWER_VOICES, PEER_VOICES } from '@/lib/typecast/voices';
import { createClient as createServiceClient } from '@/lib/supabase/service-role';
import { isPeer, type Speaker } from '@/lib/constants/peers';
import type { InterviewMode } from '@/lib/constants/modes';

const BUCKET = 'tts-cache';
// 타입캐스트 키가 없거나 막혀 있으면 서버가 살아 있는 동안 다시 시도하지 않는다
let disabled = !process.env.TYPECAST_API_KEY;

// 재생할 음성 주소. 캐시에 있으면 공개 URL, 새로 만들면 data URL(저장은 뒤에서).
// 실패하면 null → 클라이언트가 브라우저 음성으로 읽는다.
export async function ttsSpeak(text: string, speaker: Speaker, mode: InterviewMode): Promise<string | null> {
  if (disabled || !text.trim()) return null;
  const voice = isPeer(speaker) ? PEER_VOICES[speaker] : INTERVIEWER_VOICES[mode][speaker];
  const path = `${voice}/${createHash('sha1').update(text).digest('hex')}.mp3`;
  const storage = createServiceClient().storage.from(BUCKET);
  const url = storage.getPublicUrl(path).data.publicUrl;

  // 같은 목소리·문장을 전에 만들었으면 그대로 쓴다 (질문 은행·인사말은 반복된다)
  const cached = await fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
  if (cached) return url;

  try {
    const mp3 = await synthesize(text, voice);
    // 캐시 저장은 응답을 보낸 뒤에 한다 (실패해도 재생에는 영향 없음)
    after(() => storage.upload(path, mp3, { contentType: 'audio/mpeg', upsert: true }).then(() => undefined, () => undefined));
    return `data:audio/mpeg;base64,${Buffer.from(mp3).toString('base64')}`;
  } catch (e) {
    const msg = (e as Error).message;
    console.error('Typecast TTS failed, using browser speech', msg);
    // 키 오류·크레딧 소진이면 이후 요청도 실패하므로 끈다 (일시적 오류는 다음에 다시 시도)
    if (/Typecast (401|402|403)/.test(msg)) disabled = true;
    return null;
  }
}
