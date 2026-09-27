import type { SupabaseClient } from '@supabase/supabase-js';
import { ROLE_LABELS, type InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';
import type { Database } from '@/types/supabase';

// 모드별 면접관 이름 (interviewer_personas.label_ko). 없으면 역할 라벨로 대체.
export async function getPersonaNames(
  supabase: SupabaseClient<Database>,
  mode: InterviewMode,
): Promise<Record<InterviewerRole, string>> {
  const { data } = await supabase.from('interviewer_personas').select('role, label_ko').eq('mode', mode);
  const names = { ...ROLE_LABELS };
  for (const p of data ?? []) names[p.role] = p.label_ko;
  return names;
}
