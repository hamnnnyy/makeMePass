import 'server-only';
import { createClient } from '@/lib/supabase/service-role';

// 목소리는 개인정보라 비공개 버킷에 저장하고 경로만 반환한다. 재생은 signed URL로.
export async function uploadSessionAudio(
  blob: Blob,
  userId: string,
  sessionId: string,
  questionId: string,
): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/${sessionId}/${questionId}.wav`;

  const { error } = await supabase.storage
    .from('session-audio')
    .upload(path, blob, { contentType: 'audio/wav', upsert: true });

  if (error) throw error;
  return path;
}
