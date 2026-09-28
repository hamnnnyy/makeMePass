import { PEERS } from '@/lib/constants/peers';

// AI 지원자 발언에서 이름을 지운다. 프롬프트로 금지해도 모델이 가끔 "지원자 강민준입니다"처럼 말한다.
// - 자기소개형 ("(지원자) 강민준입니다", "저는 강민준이라고 합니다") → 문장째 제거
// - 남을 부를 때 ("윤서아 씨", "서아 님", "강민준 지원자님") → "앞 지원자님"
export function stripNames(text: string): string {
  let t = text;
  for (const { name } of Object.values(PEERS)) {
    const given = name.slice(1);
    const who = `(?:${name}|${given})`;
    t = t
      // "안녕하십니까, 지원자 강민준입니다. 저는…" → "안녕하십니까. 저는…"
      .replace(new RegExp(`(,\\s*)?(?:저는\\s*)?(?:지원자\\s*)?${name}\\s*(?:입니다|이라고 합니다|라고 합니다)([.!]?)\\s*`, 'g'),
        (_, comma, end) => (comma && end ? '. ' : ''))
      .replace(new RegExp(`${who}\\s*(?:지원자님|지원자|씨|님)`, 'g'), '앞 지원자님')
      .replace(new RegExp(name, 'g'), '앞 지원자');
  }
  return t.replace(/,\s*\./g, '.').replace(/^[,.\s]+/, '').replace(/\s{2,}/g, ' ').trim();
}
