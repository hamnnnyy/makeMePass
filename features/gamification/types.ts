export interface AchievementUnlock {
  code: string;
  name_ko: string;
  icon: string | null;
  rarity: string;
}

export interface CollectedPersona {
  role: 'hr' | 'tech' | 'exec';
  label_ko: string;
  isNew: boolean;  // 이번 합격으로 처음 도감에 들어옴
}

export interface GamificationResult {
  newAchievements: AchievementUnlock[];
  collected: CollectedPersona[];  // 합격 시 이 모드의 면접관 3명
  newStreak: number;
  isNewRecord: boolean;
}
