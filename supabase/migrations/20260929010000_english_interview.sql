-- 영어면접: 질문 언어 구분 + 면접 유형 추가
alter table public.questions add column if not exists language text not null default 'ko'
  check (language in ('ko', 'en'));

alter table public.interview_sessions drop constraint if exists interview_sessions_interview_type_check;
alter table public.interview_sessions add constraint interview_sessions_interview_type_check
  check (interview_type in ('general', 'personality', 'job', 'executive', 'pt', 'group', 'debate', 'discussion', 'english'));
