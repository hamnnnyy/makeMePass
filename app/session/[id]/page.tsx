import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPersonaNames } from '@/features/interviewer/personaNames';
import { SessionView } from './SessionView';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session, error }, { data: questions }] = await Promise.all([
    supabase.from('interview_sessions').select('*, organizations(name_ko, pass_threshold)').eq('id', id).single(),
    supabase.from('session_questions').select('*').eq('session_id', id).order('sequence'),
  ]);

  if (error || !session) throw new Error('면접 세션을 찾을 수 없습니다.');
  if (session.status !== 'in_progress') redirect(`/result/${id}`);

  const orgName = session.organizations?.name_ko ?? '';
  const passLine = session.organizations?.pass_threshold ?? 60;
  const names = await getPersonaNames(supabase, session.mode, session.cast_no);
  return <SessionView session={session} orgName={orgName} passLine={passLine} names={names} questions={questions ?? []} />;
}
