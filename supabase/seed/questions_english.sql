-- 영어면접 질문 은행 (language = 'en'). 여러 번 실행해도 안전.
-- 출처: 공개된 공기업 영어면접 출제 방식(영어 자기소개, 지원동기·강약점·경험 질문,
-- 비즈니스 상황 회화 — 인천국제공항공사 후기 등)을 바탕으로 정리. 기관별 질문은 기관 사업을 바탕으로 작성.
drop table if exists seed_en;
create temp table seed_en (code text, text text, category text, role text, difficulty int);
insert into seed_en values
  -- 공통 (code = null → 모든 기관)
  (null, 'Why do you want to work for a public institution rather than a private company?',                          'motivation',     'exec', 2),
  (null, 'Why did you apply to our organization, and what do you know about what we do?',                            'motivation',     'exec', 2),
  (null, 'Where do you see yourself in five years if you join us?',                                                 'motivation',     'exec', 2),
  (null, 'What is your greatest strength, and how would it help you in this role?',                                 'personality',    'hr',   1),
  (null, 'What is your biggest weakness, and what are you doing to improve it?',                                    'personality',    'hr',   2),
  (null, 'How would your friends or teammates describe you in three words?',                                        'personality',    'hr',   1),
  (null, 'Tell me about a time you had a conflict with a team member. How did you resolve it?',                    'experience',     'hr',   2),
  (null, 'Describe a situation where you had to meet a tight deadline. What did you do?',                           'experience',     'hr',   2),
  (null, 'Tell me about a mistake you made and what you learned from it.',                                         'experience',     'hr',   2),
  (null, 'Describe a time when you took the initiative to improve something.',                                     'experience',     'tech', 2),
  (null, 'Tell me about a project you are most proud of. What was your role?',                                     'experience',     'tech', 2),
  (null, 'How do you handle stress or pressure at work?',                                                           'personality',    'hr',   1),
  (null, 'If your supervisor asked you to do something against the rules, what would you do?',                     'values_ethics',  'exec', 3),
  (null, 'What does integrity mean to you as a public servant?',                                                   'values_ethics',  'exec', 3),
  (null, 'How would you explain a complicated policy to a citizen who is upset and confused?',                     'personality',    'hr',   3),
  (null, 'A foreign client calls to complain about a delayed service. How would you respond?',                     'job_competency', 'tech', 3),
  (null, 'You need to email a foreign partner to reschedule a meeting. Tell me what you would write.',             'job_competency', 'tech', 3),
  (null, 'How do you keep up with changes and new knowledge in your field?',                                       'job_competency', 'tech', 2),
  (null, 'What is one social or economic issue in Korea that public institutions should pay more attention to?',   'values_ethics',  'exec', 4),
  (null, 'How can public institutions use AI and data to serve citizens better?',                                  'job_competency', 'tech', 3),
  (null, 'Tell me about an experience working with people from a different culture or background.',               'experience',     'hr',   2),
  (null, 'What would you do in your first 100 days after joining us?',                                             'motivation',     'exec', 3),
  -- 한국은행
  ('BOK',   'How does a change in the base rate affect households and businesses?',                                  'job_competency', 'tech', 4),
  ('BOK',   'Why is central bank independence important?',                                                           'values_ethics',  'exec', 4),
  ('BOK',   'What do you think is the biggest risk to Korea''s financial stability right now?',                       'job_competency', 'exec', 5),
  -- KOTRA
  ('KOTRA', 'How can KOTRA help small and medium-sized companies enter overseas markets?',                           'job_competency', 'tech', 3),
  ('KOTRA', 'If you worked at an overseas trade office, how would you find new buyers for Korean products?',         'job_competency', 'tech', 3),
  ('KOTRA', 'How are changes in global supply chains affecting Korean exporters?',                                   'job_competency', 'exec', 4),
  -- 인천국제공항공사
  ('IIAC',  'How can Incheon Airport stay competitive as a global hub airport?',                                     'job_competency', 'exec', 3),
  ('IIAC',  'A foreign passenger has lost their baggage and is very angry. How would you handle it?',                'personality',    'hr',   2),
  ('IIAC',  'What service would you add to improve the experience of transit passengers?',                           'job_competency', 'tech', 3),
  -- 한국투자공사
  ('KIC',   'How should a sovereign wealth fund balance return and risk?',                                           'job_competency', 'tech', 4),
  ('KIC',   'What global investment trend are you paying attention to, and why?',                                    'job_competency', 'exec', 4),
  -- 한국수출입은행
  ('KEXIM', 'What role should an export credit agency play when the global economy slows down?',                    'job_competency', 'exec', 4),
  ('KEXIM', 'How would you evaluate the risk of financing an overseas infrastructure project?',                      'job_competency', 'tech', 4),
  -- 한국관광공사
  ('KTO',   'How would you promote a lesser-known Korean region to foreign tourists?',                               'job_competency', 'tech', 3),
  ('KTO',   'What is Korea''s biggest strength and weakness as a tourist destination?',                               'job_competency', 'exec', 3),
  -- 한국무역보험공사
  ('KSURE', 'Explain trade insurance to a small exporter who has never heard of it.',                                'job_competency', 'tech', 3),
  -- 한국공항공사
  ('KAC',   'How can regional airports in Korea attract more international flights?',                                'job_competency', 'exec', 3);

do $$
declare r record;
begin
  for r in select * from seed_en loop
    execute format(
      'insert into public.questions (text, category, target_role, difficulty, is_ncs_based, is_general, language)
       select %L, %L, %L, %s, false, %L::boolean, ''en''
       where not exists (select 1 from public.questions where text = %L)',
      r.text, r.category, r.role, r.difficulty, (r.code is null), r.text);
  end loop;
end $$;

insert into public.question_organizations (question_id, organization_id)
select q.id, o.id
from seed_en s
join public.questions q on q.text = s.text
join public.organizations o on o.code = s.code
where s.code is not null
on conflict do nothing;
