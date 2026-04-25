declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    ANTHROPIC_API_KEY: string;
    GOOGLE_APPLICATION_CREDENTIALS?: string;
    GOOGLE_TTS_PROJECT_ID?: string;
  }
}
