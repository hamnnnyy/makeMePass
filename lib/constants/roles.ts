export const INTERVIEWER_ROLES = ['hr', 'tech', 'exec'] as const;
export type InterviewerRole = (typeof INTERVIEWER_ROLES)[number];

export const ROLE_LABELS: Record<InterviewerRole, string> = {
  hr: 'HR',
  tech: 'TECH',
  exec: 'EXEC',
};

export const ROLE_COLORS: Record<InterviewerRole, string> = {
  hr: '#f97316',
  tech: '#06b6d4',
  exec: '#a855f7',
};

export const ROLE_ACCENT_HEX: Record<InterviewerRole, string> = {
  hr: '#ffd18a',
  tech: '#7ff8ff',
  exec: '#baa7ff',
};
