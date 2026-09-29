// public/orgs/{code}.{확장자} 로고. 없으면 글자 타일로 보여준다.
// 새 로고는 위키미디어 공용·기관 공식 홈페이지에서 받았다 (2026-09). KORAIL 은 워드마크 부분만 잘라 쓴다.
export const LOGOS: Record<string, string> = {
  BOK: 'png', HF: 'png', HIRA: 'png', HUG: 'png', KAMCO: 'png', KEPCO: 'png', LH: 'png',
  KDB: 'png', IBK: 'gif', KIBO: 'svg', KIC: 'png', KSURE: 'jpg', KOGAS: 'svg', KEA: 'svg', KDN: 'png',
  EX: 'svg', KR: 'png', KAC: 'svg', BPA: 'svg', KWATER: 'png', NHIS: 'png', HRDK: 'svg', KTO: 'svg',
  KOTRA: 'jpg', KOMSCO: 'svg',
  KODIT: 'png', KDIC: 'png', KEXIM: 'png', KOEN: 'png', KOSPO: 'png', EWP: 'png', KOWEPO: 'png', KNOC: 'png',
  KHNP: 'png', KPX: 'png', KOMIPO: 'png', SEOULMETRO: 'png', IIAC: 'png', REB: 'png', KORAIL: 'png', KEIS: 'png',
  KRC: 'png', KECO: 'png', KISA: 'png', NIA: 'png', KINFA: 'png', NPS: 'png', COMWEL: 'png',
};
