-- 사용자가 준 실제 면접 기출 질문 (2026-09-29). 여러 번 실행해도 안전.
-- 1분 자기소개는 INTRO_QUESTION, 다대다 마무리 질문은 GROUP_CLOSING_QUESTION(lib/constants/interview.ts) 으로 들어간다.
-- '나를 뽑아야 하는 이유'·'실패 경험과 배운 점'은 같은 뜻의 질문이 이미 있어 넣지 않았다.
drop table if exists seed_user;
create temp table seed_user (text text, category text, role text, difficulty int);
insert into seed_user values
  ('우리 기관에 지원하신 동기를 말씀해 주십시오.',                                                  'motivation',  'exec', 1),
  ('본인의 단점은 무엇입니까?',                                                                    'personality', 'hr',   1),
  ('상사와 의견이 맞지 않는다면 어떻게 하시겠습니까?',                                              'personality', 'hr',   2),
  ('기다리느라 고생 많으셨죠? 본인에게 기다림이란 무엇입니까?',                                     'personality', 'hr',   2),
  ('본인이 행복하기 위해 꼭 필요한 것 세 가지를 꼽는다면 무엇입니까?',                              'personality', 'hr',   2),
  ('지금까지 말씀하신 경험 중에 본인이 직접 해낸 부분만 구체적으로 설명해 주십시오. 진짜 해 보신 거 맞죠?', 'experience',  'tech', 3);

do $$
declare r record;
begin
  for r in select * from seed_user loop
    execute format(
      'insert into public.questions (text, category, target_role, difficulty, is_ncs_based, is_general, language)
       select %L, %L, %L, %s, false, true, ''ko''
       where not exists (select 1 from public.questions where text = %L)',
      r.text, r.category, r.role, r.difficulty, r.text);
  end loop;
end $$;
