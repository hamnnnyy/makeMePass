-- 지원 직무 계열: general(사무·일반) / it(전산). 전산 질문(tags 에 'IT')은 it 계열 면접에만 나온다.
alter table public.interview_sessions add column if not exists track text not null default 'general'
  check (track in ('general', 'it'));
