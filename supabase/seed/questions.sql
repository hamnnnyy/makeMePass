-- 기관 전용 질문 추가 (HIRA 는 이미 65문항이 있어 제외). organizations.sql 다음에 실행.
-- 같은 text 가 있으면 건너뛰므로 여러 번 실행해도 안전.
drop table if exists seed_q;
create temp table seed_q (code text, text text, category text, role text, difficulty int);
insert into seed_q values
  ('KAMCO', '채무조정 상담에서 상환 능력이 부족한 고객을 어떻게 설득하고 지원하시겠습니까?', 'personality',    'hr',   3),
  ('KAMCO', '국유재산을 효율적으로 활용하는 방안이 있다면 제시해 주세요.',                    'job_competency', 'tech', 4),
  ('KAMCO', '공적 자산관리 기관으로서 캠코의 역할은 무엇이라고 생각하나요?',                  'motivation',     'exec', 3),
  ('KEPCO', '전력 공급 안정성과 탄소중립 사이에서 균형을 어떻게 잡아야 한다고 생각하나요?',   'job_competency', 'tech', 4),
  ('KEPCO', '정전 민원이 몰리는 상황에서 현장과 고객 대응을 어떻게 하시겠습니까?',           'personality',    'hr',   3),
  ('KEPCO', '전기요금 결정에서 공공성과 재무 건전성 중 무엇을 우선해야 한다고 보나요?',       'values_ethics',  'exec', 4),
  ('LH',    '공공임대주택에 대한 지역 주민의 반대가 있을 때 어떻게 설득하시겠습니까?',        'personality',    'hr',   3),
  ('LH',    '주거복지 사업을 더 잘 알리기 위한 방안을 제시해 주세요.',                        'job_competency', 'tech', 3),
  ('LH',    '공기업 직원의 내부정보 이용 문제를 막기 위해 무엇이 필요하다고 생각하나요?',     'values_ethics',  'exec', 4),
  ('BOK',   '기준금리 인상이 가계와 기업에 각각 어떤 영향을 주는지 설명해 주세요.',           'job_competency', 'tech', 4),
  ('BOK',   '중앙은행의 독립성이 왜 중요하다고 생각하나요?',                                  'motivation',     'exec', 3),
  ('BOK',   '물가안정과 금융안정이 충돌할 때 어떤 기준으로 판단해야 한다고 보나요?',          'values_ethics',  'exec', 4),
  ('HF',    '주택연금을 처음 듣는 어르신께 제도를 어떻게 설명하시겠습니까?',                  'personality',    'hr',   3),
  ('HF',    '정책모기지가 주택시장에 미치는 영향은 무엇이라고 생각하나요?',                    'job_competency', 'tech', 4),
  ('HF',    '서민 주거 안정에서 한국주택금융공사의 역할은 무엇이라고 보나요?',                  'motivation',     'exec', 3),
  ('HUG',   '전세 피해를 줄이기 위해 보증기관이 할 수 있는 일은 무엇일까요?',                  'job_competency', 'tech', 4),
  ('HUG',   '보증 사고로 피해를 입은 임차인이 강하게 항의한다면 어떻게 응대하시겠습니까?',       'personality',    'hr',   3),
  ('HUG',   '공공 보증기관으로서 리스크 관리와 서민 지원 사이 균형을 어떻게 잡아야 할까요?',     'values_ethics',  'exec', 4);

-- enum 타입 이름에 의존하지 않도록 대상 컬럼 타입으로 캐스팅
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
