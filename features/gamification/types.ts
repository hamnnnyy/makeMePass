export interface AchievementUnlock {
  code: string;
  name_ko: string;
  icon: string | null;
  rarity: string;
}

export interface GamificationResult {
  newAchievements: AchievementUnlock[];
  newStreak: number;
  isNewRecord: boolean;
}
