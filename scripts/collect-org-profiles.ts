// 인재상이 비어 있는 기관의 프로필을 Gemini + Google 검색으로 채운다.
// 실행: bun --env-file=.env.local scripts/collect-org-profiles.ts
// gemini-2.5-flash 무료 한도(하루 20회 안팎)에 걸리면 멈추고, 다음 날 다시 실행하면 남은 기관부터 이어서 채운다.
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const { data: orgs } = await sb.from('organizations').select('code, name_ko, core_values, talent_profile');
const todo = (orgs ?? []).filter((o) => !(o.talent_profile as { talents?: string[] } | null)?.talents?.length);
console.log(`인재상 없는 기관 ${todo.length}곳`);

for (const org of todo) {
  const prompt = `${org.name_ko}의 신입 채용 면접 준비용 기관 정보를 공식 홈페이지·채용 공고·최근 기사로 확인해서 아래 JSON 하나만 출력하세요. 확인되지 않는 항목은 빈 배열.
{"mission":"미션 또는 비전 한 문장","talents":["공식 인재상 항목(짧게)"],"core_values":["공식 핵심가치"],"issues":["최근 1~2년 주요 현안·과제 2~3개(각 40자 이내)"],"interview":"신입 면접 전형의 특징(예: 토론면접·PT·인성 비중, 평가 포인트) 1~2문장"}`;
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2, httpOptions: { timeout: 60_000 } },
    });
    const text = r.text ?? '';
    const p = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const profile = { ...(org.talent_profile as object ?? {}) };
    for (const k of ['mission', 'talents', 'issues', 'interview'] as const) {
      if (p[k]?.length) Object.assign(profile, { [k]: p[k] });
    }
    const { error } = await sb.from('organizations').update({
      talent_profile: profile,
      ...(p.core_values?.length ? { core_values: p.core_values } : {}),
    }).eq('code', org.code);
    console.log(org.code, error ? `저장 실패 ${error.message}` : `ok ${p.talents?.join('/') ?? ''}`);
  } catch (e) {
    const msg = String(e);
    console.log(org.code, '실패', msg.slice(0, 120));
    if (msg.includes('PerDay')) break;  // 하루 한도 소진
  }
  await new Promise((r) => setTimeout(r, 7000));  // 분당 한도
}
