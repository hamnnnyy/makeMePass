import { createClient } from '@/lib/supabase/server';
import { ttsSpeak } from '@/features/interviewer/tts/ttsSpeak.server';
import { INTERVIEW_MODES, type InterviewMode } from '@/lib/constants/modes';
import type { Speaker } from '@/lib/constants/peers';
import type { TtsLanguage } from '@/lib/typecast/client';

const SPEAKERS: Speaker[] = ['hr', 'tech', 'exec', 'p1', 'p2'];

// 면접관·AI 지원자 음성. 서버 액션은 한 번에 하나씩 처리돼서, 다음 질문 음성을 미리 받는 동안
// 답변 평가가 줄 서서 기다렸다 → 일반 API 로 따로 받는다. 음성 합성은 유료라 로그인한 사용자만.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ src: null }, { status: 401 });

  const b = await request.json().catch(() => ({}));
  const text = typeof b.text === 'string' ? b.text.slice(0, 600) : '';
  if (!text || !SPEAKERS.includes(b.speaker) || !INTERVIEW_MODES.includes(b.mode)) return Response.json({ src: null }, { status: 400 });
  const src = await ttsSpeak(text, b.speaker as Speaker, b.mode as InterviewMode, (b.language === 'eng' ? 'eng' : 'kor') as TtsLanguage, b.cast === 2 ? 2 : 1);
  return Response.json({ src });
}
