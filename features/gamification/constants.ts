import type { AchievementRarity } from '@/types/supabase';

export const RARITY_COLOR: Record<AchievementRarity, string> = {
  common:    '#a3a3a3',
  rare:      '#60a5fa',
  epic:      '#a78bfa',
  legendary: '#fbbf24',
};

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
};
