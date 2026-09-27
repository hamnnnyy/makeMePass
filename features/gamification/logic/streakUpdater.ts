export interface StreakUpdate {
  newStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}

export function computeNewStreak(
  currentStreak: number,
  longestStreak: number,
  lastPracticedAt: string | null,
): StreakUpdate {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (!lastPracticedAt) {
    return { newStreak: 1, longestStreak: Math.max(1, longestStreak), isNewRecord: longestStreak < 1 };
  }

  const last = lastPracticedAt.slice(0, 10);
  if (last === today) {
    // 오늘 이미 했음 — 스트릭 유지
    return { newStreak: currentStreak, longestStreak, isNewRecord: false };
  }

  const diffDays = Math.round(
    (new Date(today).getTime() - new Date(last).getTime()) / 86400000,
  );

  const newStreak = diffDays === 1 ? currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, longestStreak);
  return { newStreak, longestStreak: newLongest, isNewRecord: newLongest > longestStreak };
}
