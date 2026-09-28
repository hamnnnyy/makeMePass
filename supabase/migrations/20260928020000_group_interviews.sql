-- 다대다·토론·토의 면접: AI 가상 지원자(peer)가 사용자 차례 전에 발언한다
alter table public.interview_sessions drop constraint if exists interview_sessions_interview_type_check;
alter table public.interview_sessions add constraint interview_sessions_interview_type_check
  check (interview_type in ('general', 'personality', 'job', 'executive', 'pt', 'group', 'debate', 'discussion'));

-- 토론·토의 주제와 편 배정 { topic, userSide?, peerSide? }
alter table public.interview_sessions add column if not exists group_setup jsonb;

-- 이 문항에서 사용자보다 먼저 말하는 AI 지원자 발언 [{ peer, intent, text? }]
-- intent 는 면접 생성 때 정하고, text 는 문항을 물을 때 이전 발언을 보고 만든다
alter table public.session_questions add column if not exists peer_turns jsonb;
