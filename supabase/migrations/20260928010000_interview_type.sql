-- 면접 유형: 종합 / 인성 / 직무 / 임원 / PT
alter table public.interview_sessions
  add column if not exists interview_type text not null default 'general'
  check (interview_type in ('general', 'personality', 'job', 'executive', 'pt'));
