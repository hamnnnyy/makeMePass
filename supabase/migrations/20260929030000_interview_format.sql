-- 면접 형식을 유형과 분리: 지원자 구성(with_peers), 면접관 수(panel_size), 언어(language, 20260929020000)
alter table public.interview_sessions add column if not exists with_peers boolean not null default false;
alter table public.interview_sessions add column if not exists panel_size smallint not null default 3
  check (panel_size in (1, 3));

-- 기존 '다대다'는 종합+AI 지원자, '영어면접'은 종합+영어 (language 는 이미 'en')
update public.interview_sessions set with_peers = true where interview_type in ('group', 'debate', 'discussion');
update public.interview_sessions set interview_type = 'general' where interview_type in ('group', 'english');

alter table public.interview_sessions drop constraint if exists interview_sessions_interview_type_check;
alter table public.interview_sessions add constraint interview_sessions_interview_type_check
  check (interview_type in ('general', 'personality', 'job', 'executive', 'pt', 'debate', 'discussion'));
