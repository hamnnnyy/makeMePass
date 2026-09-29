'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { judge, type Thresholds } from '../logic/scoring';
import { panelRoles } from '@/lib/constants/interviewTypes';

export async function endSession(sessionId: string) {
  const supabase = await createClient();

  const [{ data: lastQ }, { data: session }] = await Promise.all([
    supabase
      .from('session_questions')
      .select('hr_after, tech_after, exec_after')
      .eq('session_id', sessionId)
      .not('answered_at', 'is', null)
      .order('answered_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('interview_sessions')
      .select('started_at, status, interview_type, panel_size, organizations(pass_threshold, eliminate_threshold)')
      .eq('id', sessionId)
      .single(),
  ]);

  if (!session) throw new Error('세션을 찾을 수 없습니다.');
  if (session.status !== 'in_progress') redirect(`/result/${sessionId}`);

  const favor = { hr: lastQ?.hr_after ?? 50, tech: lastQ?.tech_after ?? 50, exec: lastQ?.exec_after ?? 50 };
  const org = session.organizations as unknown as Thresholds;
  // 한 문항도 답하지 않고 나가면 중도 포기
  const { result, lowRole } = lastQ ? judge(favor, org, panelRoles(session)) : { result: 'pending' as const, lowRole: null };

  await supabase.from('interview_sessions').update({
    status: !lastQ ? 'aborted' : result === 'fail_eliminate' ? 'eliminated' : 'completed',
    result,
    veto_role: lowRole,
    ended_at: new Date().toISOString(),
    duration_seconds: Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000),
  }).eq('id', sessionId);

  // DB 트리거가 status 변경 시 마지막 sequence 문항 기준으로 최종 점수를 다시 쓰는데,
  // 탈락·중단이면 그 문항이 미답변이라 null 이 된다. 상태를 바꾼 뒤 실제 마지막 답변 값으로 덮어쓴다.
  if (lastQ) {
    await supabase.from('interview_sessions').update({
      hr_final_score: favor.hr,
      tech_final_score: favor.tech,
      exec_final_score: favor.exec,
    }).eq('id', sessionId);
  }

  redirect(`/result/${sessionId}`);
}
