import { createClient } from '@/lib/supabase/server';
import { SessionView } from './SessionView';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session, error }, { data: questions }] = await Promise.all([
    supabase.from('interview_sessions').select('*').eq('id', id).single(),
    supabase.from('session_questions').select('*').eq('session_id', id).order('sequence'),
  ]);

  if (error || !session) throw new Error('면접 세션을 찾을 수 없습니다.');

  return <SessionView session={session} questions={questions ?? []} />;
}
