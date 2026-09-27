'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sampleN } from '@/lib/utils/sample';
import type { InterviewMode } from '@/lib/constants/modes';

export default async function createSession(
  orgCode: string,
  mode: InterviewMode,
  questionCount: number,
  // TODO: upload file to Supabase Storage, insert into cover_letters table, pass cover_letter_id
  _coverLetterFile: File | null,
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('code', orgCode)
    .single();

  if (orgError || !org) throw new Error(`기관을 찾을 수 없습니다: ${orgCode}`);

  const { data: session, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      mode,
      status: 'in_progress' as const,
      result: 'pending' as const,
      total_questions: questionCount,
      cover_letter_id: null,
      hr_final_score: null,
      tech_final_score: null,
      exec_final_score: null,
      veto_role: null,
      elimination_question_id: null,
      duration_seconds: null,
      video_url: null,
      ended_at: null,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Sample questions and insert into session_questions
  const { data: pool } = await supabase
    .from('questions')
    .select('id, text, target_role');

  const selected = sampleN(pool ?? [], questionCount);

  if (selected.length > 0) {
    await supabase.from('session_questions').insert(
      selected.map((q, i) => ({
        session_id: session.id,
        question_id: q.id,
        question_text: q.text,
        asked_by_role: q.target_role,
        sequence: i + 1,
        is_follow_up: false,
        parent_session_question_id: null,
        audio_url: null,
        transcript: null,
        duration_seconds: null,
        filler_count: null,
        score_content: null,
        score_fluency: null,
        score_eye_contact: null,
        score_timing: null,
        score_expression: null,
        hr_delta: 0,
        tech_delta: 0,
        exec_delta: 0,
        hr_after: null,
        tech_after: null,
        exec_after: null,
        claude_feedback: null,
        answered_at: null,
      }))
    );
  }

  redirect(`/session/${session.id}`);
}
