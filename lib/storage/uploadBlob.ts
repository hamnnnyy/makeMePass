import 'server-only';
import { createClient } from '@/lib/supabase/service-role';

export async function uploadSessionAudio(
  blob: Blob,
  sessionId: string,
  questionId: string,
): Promise<string> {
  const supabase = createClient();
  const path = `${sessionId}/${questionId}.webm`;

  const { data, error } = await supabase.storage
    .from('session-audio')
    .upload(path, blob, { contentType: 'audio/webm', upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('session-audio')
    .getPublicUrl(data.path);

  return publicUrl;
}
