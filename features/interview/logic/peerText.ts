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

// 블라인드 면접이라 AI 지원자도 인적사항을 말하면 안 된다. 프롬프트로 막고, 새어 나오면 그 문장을 지운다.
// "대학 때", "학부 프로젝트" 같은 일반 언급은 실격 규정상 괜찮아서 남긴다.
const BLIND = [
  /[가-힣A-Za-z]{2,}(?:대학교|대학원|고등학교|여고|과학고|외고)/,         // 학교 이름
  /[가-힣]{2,}(?:대|고)\s*(?:출신|졸업|재학|나왔)/,                       // "서울대 출신", "한국고 졸업"
  /고향|출신 지역|(?:에서|에) (?:태어|자랐)|사는 곳|거주/,               // 출신 지역·거주지
  /부모님|아버지|어머니|아버님|어머님|형제|자매|외동/,                   // 가족
  /\d{2}\s*살|\d{2}\s*세|\d{2,4}\s*년생|키가|몸무게/,                    // 나이·신체
];
export function stripBlind(text: string): string {
  const sentences = text.match(/[^.!?…]+[.!?…]*/g) ?? [text];
  return sentences.filter((s) => !BLIND.some((re) => re.test(s))).join('').replace(/\s{2,}/g, ' ').trim();
}
