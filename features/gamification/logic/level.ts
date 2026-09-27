// 경험치: 답변 1개 10, 면접 완주(탈락 포함) 30, 합격 100. DB 에 따로 저장하지 않고 기록에서 계산한다.
export const XP = { answer: 10, finish: 30, pass: 100 } as const;

export function sessionXp(answered: number, finished: boolean, passed: boolean): number {
  return answered * XP.answer + (finished ? XP.finish : 0) + (passed ? XP.pass : 0);
}

// Lv.n 에 필요한 누적 경험치 = 50·n·(n-1)  → Lv2 100, Lv3 300, Lv4 600, Lv5 1000 …
const threshold = (level: number) => 50 * level * (level - 1);

export function levelInfo(xp: number) {
  let level = 1;
  while (xp >= threshold(level + 1)) level++;
  const base = threshold(level);
  const next = threshold(level + 1);
  return { level, xp, into: xp - base, need: next - base, progress: (xp - base) / (next - base) };
}

const RANKS = ['지원자', '서류 통과', '필기 합격', '면접 단골', '최종 후보', '신입 사원', '인사팀 에이스', '면접관의 면접관'];
export const rankName = (level: number) => RANKS[Math.min(level, RANKS.length) - 1];

// 면접관 구슬 색. 레벨이 오르면 해금된다 (역할 기본색은 항상 사용 가능).
export const ORB_COLORS = [
  { label: 'CYAN',   hex: '#7ff8ff', level: 1 },
  { label: 'AMBER',  hex: '#ffd18a', level: 1 },
  { label: 'VIOLET', hex: '#baa7ff', level: 1 },
  { label: 'AQUA',   hex: '#64ffd8', level: 2 },
  { label: 'ROSE',   hex: '#ff9ecf', level: 3 },
  { label: 'WHITE',  hex: '#ffffff', level: 4 },
  { label: 'CRIMSON', hex: '#ff5a5a', level: 5 },
  { label: 'GOLD',   hex: '#ffd700', level: 6 },
] as const;
