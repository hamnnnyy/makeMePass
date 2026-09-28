-- 기관 전용 질문 확장 (기관당 9문항 추가 → 12문항). questions.sql 과 같은 방식이라 여러 번 실행해도 안전.
drop table if exists seed_q;
create temp table seed_q (code text, text text, category text, role text, difficulty int);
insert into seed_q values
  -- KAMCO 한국자산관리공사
  ('KAMCO', '캠코가 운영하는 온비드 공매 시스템을 더 많은 국민이 쓰게 하려면 무엇을 바꿔야 할까요?',        'job_competency', 'tech', 3),
  ('KAMCO', '새출발기금처럼 채무를 감면하는 제도에 대한 도덕적 해이 비판을 어떻게 생각하나요?',          'values_ethics',  'exec', 4),
  ('KAMCO', '부실채권을 인수해 정리하는 과정에서 공공기관이 지켜야 할 원칙은 무엇이라고 보나요?',        'values_ethics',  'exec', 4),
  ('KAMCO', '빚 때문에 힘들어하는 고객이 상담 중 화를 낸다면 어떻게 대응하시겠습니까?',                   'personality',    'hr',   3),
  ('KAMCO', '방치된 국유지를 발견했다면 어떤 순서로 활용 방안을 검토하시겠습니까?',                       'job_competency', 'tech', 4),
  ('KAMCO', '금융 지식이 없는 사람에게 복잡한 제도를 쉽게 설명해 본 경험이 있나요?',                      'experience',     'hr',   3),
  ('KAMCO', '여러 기관이 얽힌 일을 조율해 결과를 낸 경험을 말씀해 주세요.',                               'experience',     'hr',   3),
  ('KAMCO', '캠코의 사업 중 가장 관심 있는 분야와 그 이유는 무엇인가요?',                                'motivation',     'exec', 2),
  ('KAMCO', '경기 침체기에 캠코의 역할은 어떻게 달라져야 한다고 생각하나요?',                            'job_competency', 'exec', 4),
  -- KEPCO 한국전력공사
  ('KEPCO', '한전의 누적 적자 문제를 해결하기 위해 무엇이 필요하다고 생각하나요?',                       'job_competency', 'exec', 4),
  ('KEPCO', '송전망 건설에 반대하는 지역 주민을 어떻게 설득하시겠습니까?',                                'personality',    'hr',   4),
  ('KEPCO', '재생에너지 확대가 전력망 운영에 주는 부담은 무엇이고 어떻게 대응해야 할까요?',               'job_competency', 'tech', 4),
  ('KEPCO', '현장 안전 규정을 지키면 작업이 늦어지는 상황이라면 어떻게 하시겠습니까?',                    'values_ethics',  'exec', 3),
  ('KEPCO', '전력 데이터를 활용해 고객 서비스를 개선할 수 있는 아이디어가 있나요?',                       'job_competency', 'tech', 3),
  ('KEPCO', '순환 근무로 지방 사업소에 발령받는다면 어떻게 적응하시겠습니까?',                           'personality',    'hr',   2),
  ('KEPCO', '예상치 못한 문제가 생겼을 때 침착하게 해결한 경험을 말씀해 주세요.',                         'experience',     'hr',   3),
  ('KEPCO', '에너지 취약계층 지원에서 한전이 더 해야 할 일은 무엇이라고 보나요?',                        'values_ethics',  'exec', 3),
  ('KEPCO', '한전에 입사하려는 이유를 다른 에너지 공기업과 비교해 말씀해 주세요.',                        'motivation',     'exec', 3),
  -- LH 한국토지주택공사
  ('LH',    'LH에 대한 국민 신뢰가 떨어진 원인은 무엇이고, 신입으로서 무엇을 할 수 있을까요?',           'values_ethics',  'exec', 4),
  ('LH',    '아파트 시공 부실을 막기 위해 발주기관이 해야 할 역할은 무엇이라고 보나요?',                  'job_competency', 'tech', 4),
  ('LH',    '신도시 개발에서 원주민 보상 갈등을 줄이는 방법은 무엇일까요?',                               'job_competency', 'tech', 4),
  ('LH',    '공공임대주택 입주민의 민원이 반복될 때 어떻게 대응하시겠습니까?',                             'personality',    'hr',   3),
  ('LH',    '지인이 개발 예정지 정보를 물어본다면 어떻게 하시겠습니까?',                                   'values_ethics',  'exec', 3),
  ('LH',    '청년 주거 문제를 해결하기 위한 LH의 정책을 하나 제안해 주세요.',                               'job_competency', 'tech', 3),
  ('LH',    '규정과 현장 상황이 맞지 않아 곤란했던 경험이 있나요?',                                       'experience',     'hr',   3),
  ('LH',    '공공의 이익을 위해 개인의 손해를 감수한 경험을 말씀해 주세요.',                              'experience',     'hr',   3),
  ('LH',    'LH에서 이루고 싶은 목표를 10년 뒤 모습으로 말씀해 주세요.',                                  'motivation',     'exec', 2),
  -- BOK 한국은행
  ('BOK',   '최근 환율 변동이 국내 물가에 어떤 경로로 영향을 주는지 설명해 주세요.',                      'job_competency', 'tech', 4),
  ('BOK',   '중앙은행 디지털화폐(CBDC)가 도입되면 은행 시스템은 어떻게 바뀔까요?',                         'job_competency', 'tech', 5),
  ('BOK',   '가계부채가 높은 상황에서 금리 정책의 한계는 무엇이라고 보나요?',                             'job_competency', 'exec', 5),
  ('BOK',   '통화정책 결정을 국민에게 이해하기 쉽게 알리려면 어떻게 해야 할까요?',                        'personality',    'hr',   3),
  ('BOK',   '데이터를 분석해 결론을 이끌어 낸 경험을 말씀해 주세요.',                                     'experience',     'hr',   3),
  ('BOK',   '정부 정책과 한국은행의 판단이 다를 때 어떻게 해야 한다고 생각하나요?',                       'values_ethics',  'exec', 4),
  ('BOK',   '한국은행 직원에게 가장 필요한 자질은 무엇이라고 생각하나요?',                                'motivation',     'exec', 2),
  ('BOK',   '자신의 분석이 틀렸다는 걸 알게 됐을 때 어떻게 행동했나요?',                                  'personality',    'hr',   3),
  ('BOK',   '저출산·고령화가 잠재성장률과 통화정책에 주는 영향은 무엇일까요?',                            'job_competency', 'tech', 5),
  -- HF 한국주택금융공사
  ('HF',    '보금자리론과 시중은행 주택담보대출의 차이를 설명해 주세요.',                                 'job_competency', 'tech', 3),
  ('HF',    '금리가 오를 때 정책모기지 공급을 늘려야 할까요, 줄여야 할까요?',                             'job_competency', 'exec', 4),
  ('HF',    '주택연금 가입을 망설이는 자녀 세대의 우려에 어떻게 답하시겠습니까?',                         'personality',    'hr',   3),
  ('HF',    'MBS 발행이 주택금융 시장에서 하는 역할은 무엇인가요?',                                       'job_competency', 'tech', 4),
  ('HF',    '대출 심사 기준에 조금 못 미치는 딱한 사정의 고객을 만난다면 어떻게 하시겠습니까?',            'values_ethics',  'exec', 4),
  ('HF',    '어르신이나 금융 취약계층을 도와 본 경험이 있나요?',                                          'experience',     'hr',   3),
  ('HF',    '꼼꼼함이 필요한 일을 실수 없이 끝낸 경험을 말씀해 주세요.',                                  'experience',     'hr',   3),
  ('HF',    '한국주택금융공사가 청년층에게 더 알려져야 할 제도는 무엇이라고 보나요?',                      'motivation',     'exec', 3),
  ('HF',    '주택가격이 크게 떨어지면 주택연금 사업에 어떤 위험이 생길까요?',                             'job_competency', 'tech', 5),
  -- HUG 주택도시보증공사
  ('HUG',   '전세보증금반환보증의 구조와 한계를 설명해 주세요.',                                          'job_competency', 'tech', 4),
  ('HUG',   '전세사기를 사전에 걸러내기 위해 어떤 데이터를 활용할 수 있을까요?',                          'job_competency', 'tech', 4),
  ('HUG',   '보증 손실이 커질 때 보증 요건을 강화하면 서민 부담이 늘어납니다. 어떻게 판단하시겠습니까?',   'values_ethics',  'exec', 5),
  ('HUG',   '분양보증이 주택 공급에서 하는 역할은 무엇인가요?',                                           'job_competency', 'tech', 3),
  ('HUG',   '전세사기 피해자를 상담할 때 가장 신경 써야 할 점은 무엇일까요?',                             'personality',    'hr',   3),
  ('HUG',   '도시재생 사업에서 HUG가 기여할 수 있는 부분은 무엇이라고 보나요?',                           'motivation',     'exec', 3),
  ('HUG',   '위험 신호를 먼저 발견해 문제를 막은 경험이 있나요?',                                         'experience',     'hr',   3),
  ('HUG',   '팀원과 의견이 달랐지만 원칙을 지켜 설득한 경험을 말씀해 주세요.',                            'experience',     'hr',   3),
  ('HUG',   '주택도시기금 운용에서 공공성과 수익성은 어떻게 균형을 맞춰야 할까요?',                       'values_ethics',  'exec', 4);

do $$
declare r record;
begin
  for r in select * from seed_q loop
    execute format(
      'insert into public.questions (text, category, target_role, difficulty, is_ncs_based, is_general)
       select %L, %L, %L, %s, true, false
       where not exists (select 1 from public.questions where text = %L)',
      r.text, r.category, r.role, r.difficulty, r.text);
  end loop;
end $$;

insert into public.question_organizations (question_id, organization_id)
select q.id, o.id
from seed_q s
join public.questions q on q.text = s.text
join public.organizations o on o.code = s.code
on conflict do nothing;
