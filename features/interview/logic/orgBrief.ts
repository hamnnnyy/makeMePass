// 평가·질문·주제 생성 프롬프트에 넣는 기관 특징 요약.
// talent_profile: { talents, mission, business, issues, interview } (seed/organizations_profiles.sql), 예전 데이터는 { keywords }
type Profile = {
  talents?: string[]; keywords?: string[]; mission?: string;
  business?: string[]; issues?: string[]; interview?: string;
};

export function orgBrief(org: { name_ko: string; description: string | null; core_values: unknown; talent_profile: unknown }) {
  const p = (org.talent_profile ?? {}) as Profile;
  const values = Array.isArray(org.core_values) ? (org.core_values as string[]) : [];
  const talents = p.talents?.length ? p.talents : p.keywords ?? [];
  return [
    `[기관] ${org.name_ko}${org.description ? ` — ${org.description}` : ''}`,
    p.mission && `- 미션/비전: ${p.mission}`,
    talents.length && `- 인재상: ${talents.join(', ')}`,
    values.length && `- 핵심가치: ${values.join(', ')}`,
    p.business?.length && `- 주요 사업: ${p.business.join(', ')}`,
    p.issues?.length && `- 최근 현안: ${p.issues.join(' / ')}`,
    p.interview && `- 면접 특징: ${p.interview}`,
  ].filter(Boolean).join('\n');
}
