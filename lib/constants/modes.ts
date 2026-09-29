export const INTERVIEW_MODES = ['realistic', 'casual', 'boss', 'cute'] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

// 모드마다 있는 면접관 기수 (애니 모드는 1기·2기 중 하나가 들어온다)
export const CAST_COUNT: Record<InterviewMode, number> = { realistic: 1, casual: 1, boss: 1, cute: 2 };

export const MODE_LABELS: Record<InterviewMode, string> = {
  realistic: '현실',
  casual: '편안',
  boss: '압박',
  cute: '애니',
};

export const MODE_ACCENT: Record<InterviewMode, string> = {
  realistic: '#6B7280',
  casual: '#A7F3D0',
  boss: '#DC2626',
  cute: '#EC4899',
};
