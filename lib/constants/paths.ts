export const PATHS = {
  home: '/',
  session: (id: string) => `/session/${id}`,
  results: (id: string) => `/session/${id}/results`,
  review: '/review',
  profile: '/profile',
} as const;
