-- 면접 진행 언어: 영어면접 외에 다대다·토론·토의도 영어로 진행할 수 있다
alter table public.interview_sessions add column if not exists language text not null default 'ko'
  check (language in ('ko', 'en'));
update public.interview_sessions set language = 'en' where interview_type = 'english';
