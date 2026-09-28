-- 실격: 블라인드 위반·부적절한 발언이면 호감도와 관계없이 즉시 면접이 끝난다
alter type public.session_result add value if not exists 'fail_disqualified';
-- { type: 'blind' | 'conduct', quote, detail, question, role }
alter table public.interview_sessions add column if not exists disqualification jsonb;
