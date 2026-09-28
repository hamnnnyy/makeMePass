-- 면접 유형(인성/직무/임원)별 공통 질문 보강. 모든 기관에서 출제(is_general = true).
-- 같은 text 가 있으면 건너뛰므로 여러 번 실행해도 안전.
insert into public.questions (text, category, target_role, difficulty, is_ncs_based, is_general)
select v.text, v.category::public.question_category, v.role::public.interviewer_role, v.difficulty, v.ncs, true
from (values
  -- 임원면접: 가치관·윤리
  ('공공기관 직원으로서 가장 경계해야 할 태도는 무엇이라고 생각하십니까?',                         'values_ethics', 'exec', 3, true),
  ('조직의 이익과 국민의 이익이 충돌한다면 어떤 기준으로 판단하시겠습니까?',                       'values_ethics', 'exec', 4, true),
  ('상사가 규정에 어긋나는 지시를 한다면 어떻게 대응하시겠습니까?',                               'values_ethics', 'exec', 4, true),
  ('작은 규칙 위반을 관행이라며 모두가 넘어갈 때 본인은 어떻게 하시겠습니까?',                     'values_ethics', 'hr',   3, true),
  ('공정함이란 무엇이라고 생각하며, 그것을 지키기 위해 노력한 경험이 있습니까?',                   'values_ethics', 'exec', 3, true),
  ('민원인에게 선물이나 편의를 제안받는다면 어떻게 거절하시겠습니까?',                             'values_ethics', 'hr',   2, true),
  ('개인정보를 다루는 업무에서 가장 중요하게 지켜야 할 원칙은 무엇입니까?',                         'values_ethics', 'tech', 3, true),
  ('본인이 실수로 규정을 어긴 사실을 뒤늦게 알게 된다면 어떻게 하시겠습니까?',                     'values_ethics', 'exec', 3, true),

  -- 임원면접: 지원동기·비전
  ('우리 기관이 앞으로 10년 동안 가장 집중해야 할 과제는 무엇이라고 보십니까?',                    'motivation', 'exec', 4, false),
  ('입사 후 가장 먼저 이루고 싶은 목표는 무엇입니까?',                                             'motivation', 'exec', 2, false),
  ('우리 기관이 국민에게 신뢰받기 위해 개선해야 할 점이 있다면 말씀해 주십시오.',                  'motivation', 'exec', 4, false),
  ('다른 지원자와 비교해 본인을 뽑아야 하는 이유를 말씀해 주십시오.',                              'motivation', 'exec', 3, false),
  ('원하지 않는 부서에 배치된다면 어떻게 적응하시겠습니까?',                                       'motivation', 'hr',   2, false),
  ('공공기관의 안정성 말고, 이 일을 하고 싶은 이유는 무엇입니까?',                                 'motivation', 'exec', 3, false),

  -- 인성면접: 인성·경험
  ('팀에서 본인이 주로 맡는 역할은 무엇이고, 그 이유는 무엇입니까?',                               'personality', 'hr', 2, true),
  ('의견이 다른 동료를 설득해 본 경험을 말씀해 주십시오.',                                         'personality', 'hr', 3, true),
  ('반복적이고 지루한 업무를 꾸준히 해낸 경험이 있다면 말씀해 주십시오.',                          'personality', 'hr', 2, true),
  ('비판이나 부정적인 피드백을 받았을 때 어떻게 받아들이십니까?',                                  'personality', 'hr', 2, true),
  ('예상치 못한 문제로 계획이 틀어졌을 때 어떻게 대처했는지 경험을 들어 말씀해 주십시오.',          'experience',  'hr', 3, true),
  ('다른 사람을 도와 함께 성과를 낸 경험을 말씀해 주십시오.',                                      'experience',  'hr', 2, true),
  ('가장 오래 꾸준히 해 온 활동은 무엇이며, 그것에서 무엇을 배웠습니까?',                          'experience',  'hr', 2, false),
  ('책임감을 발휘해 끝까지 마무리한 경험을 말씀해 주십시오.',                                      'experience',  'tech', 3, true),

  -- 직무면접: NCS 직업기초능력
  ('복잡한 내용을 상대방이 이해하기 쉽게 설명했던 경험을 말씀해 주십시오. (의사소통능력)',          'job_competency', 'tech', 3, true),
  ('자료를 분석해 문제의 원인을 찾아낸 경험을 말씀해 주십시오. (문제해결능력)',                    'job_competency', 'tech', 3, true),
  ('한정된 시간과 예산으로 목표를 달성한 경험이 있습니까? (자원관리능력)',                          'job_competency', 'tech', 3, true),
  ('업무에 필요한 정보를 찾고 정리하는 본인만의 방법은 무엇입니까? (정보능력)',                    'job_competency', 'tech', 2, true),
  ('조직의 규정이나 절차를 이해하고 따라야 했던 경험을 말씀해 주십시오. (조직이해능력)',            'job_competency', 'tech', 2, true),
  ('입사 후 맡을 직무에서 가장 어려울 것 같은 점과 그 준비 방법을 말씀해 주십시오.',               'job_competency', 'tech', 3, true)
) as v(text, category, role, difficulty, ncs)
where not exists (select 1 from public.questions q where q.text = v.text);
