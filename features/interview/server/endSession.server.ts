'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SessionResult } from '@/types/supabase';

export async function endSession(sessionId: string) {
  const supabase = await createClient();

  // Get final favor scores from the last answered question
  const { data: lastQ } = await supabase
    .from('session_questions')
    .select('hr_after, tech_after, exec_after')
    .eq('session_id', sessionId)
    .not('answered_at', 'is', null)
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get organization thresholds
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('organization_id')
    .eq('id', sessionId)
    .single();

  let result: SessionResult = 'pending';
  const hr = lastQ?.hr_after ?? 50;
  const tech = lastQ?.tech_after ?? 50;
  const exec = lastQ?.exec_after ?? 50;

  if (session) {
    const { data: org } = await supabase
      .from('organizations')
      .select('pass_threshold, veto_threshold, eliminate_threshold')
      .eq('id', session.organization_id)
      .single();

    if (org) {
      const min = Math.min(hr, tech, exec);
      if (min < org.eliminate_threshold) result = 'eliminated';
      else if (min < org.veto_threshold) result = 'veto';
      else if (Math.min(hr, tech, exec) >= org.pass_threshold) result = 'pass';
      else result = 'fail';
    }
  }

  await supabase.from('interview_sessions').update({
    status: 'completed' as const,
    result,
    ended_at: new Date().toISOString(),
    ...(lastQ ? {
      hr_final_score: hr,
      tech_final_score: tech,
      exec_final_score: exec,
    } : {}),
  }).eq('id', sessionId);

  redirect(`/result/${sessionId}`);
}
