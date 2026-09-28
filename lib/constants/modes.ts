export const INTERVIEW_MODES = ['realistic', 'casual', 'boss', 'cute'] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

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
