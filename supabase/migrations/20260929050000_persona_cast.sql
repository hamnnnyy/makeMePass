-- 애니 모드 두 번째 면접관(2기). 모드·역할마다 여러 캐릭터를 둘 수 있게 cast_no 를 추가한다.
alter table public.interviewer_personas add column if not exists cast_no smallint not null default 1;
alter table public.interviewer_personas drop constraint if exists interviewer_personas_mode_role_key;
alter table public.interviewer_personas add constraint interviewer_personas_mode_role_cast_key unique (mode, role, cast_no);

-- 면접마다 어느 기수가 들어오는지 (애니 모드만 2기가 있다)
alter table public.interview_sessions add column if not exists cast_no smallint not null default 1
  check (cast_no in (1, 2));

insert into public.interviewer_personas (mode, role, cast_no, label_ko, position_ko, voice_id, tone_description, character_data)
values
  ('cute', 'hr',   2, '소악마 후배',     '채용팀',     'tc_6076e25ac80469168e3771cf',
   '장난스럽게 놀리는 말투. 좋은 답엔 칭찬을 쏟아내고, 모호한 답은 콕 찔러서 되묻는다.', '{"character_type":"koakuma","mood":"playful"}'),
  ('cute', 'tech', 2, '무표정 천재',     '개발팀',     'tc_618203f635ea62f8574c7d8a',
   '말수가 적고 건조한 톤. 핵심만 짧게 말하고, 틀린 부분은 정확히 짚는다. 인정할 땐 작게 "…나쁘지 않네."', '{"character_type":"kuudere","mood":"sleepy"}'),
  ('cute', 'exec', 2, '학생회장 위원장', '인사위원회', 'tc_6731b307df12333201d12b94',
   '늠름하고 단호한 톤. 원칙과 책임감을 중시하고, 각오가 보이는 답변을 높이 산다.', '{"character_type":"council_president","mood":"dignified"}')
on conflict (mode, role, cast_no) do nothing;
