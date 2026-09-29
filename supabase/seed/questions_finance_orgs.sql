-- HUG·IBK·신용보증기금 기출 질문과 인재상 보강 (2026-09-29, Claude 웹 조사). 여러 번 실행해도 안전.
-- 출처
--   신보 인재상: kodit.or.kr 인재상 페이지 / 기출: 링커리어 '2025 신용보증기금 합격 후기 모음집', 잡코리아·캐치 요약
--   IBK 인재상: 경향신문 2016-08-29 기업특집 (최신 공식 인재상 문구는 확인 못 함) / 기출: 링커리어 2025 하반기 합격자료, gooinjob 1·2차 면접 후기
--   HUG 기출: 링커리어 2022 상·하반기 면접 후기, 자소설닷컴 합격 후기 (공식 인재상 페이지는 확인 못 해 기존 값 유지)
-- 질문은 후기 원문의 뜻을 살려 면접관 말투로 다듬었다.
drop table if exists seed_fin;
create temp table seed_fin (code text, text text, category text, role text, difficulty int);
insert into seed_fin values
  -- 신용보증기금
  ('KODIT', '신용보증기금과 신용보증재단의 차이를 설명해 주십시오.',                                  'job_competency', 'tech', 2),
  ('KODIT', '기업을 평가할 때 수익성과 성장성 중 무엇을 더 중요하게 보시겠습니까?',                    'job_competency', 'tech', 3),
  ('KODIT', '공동대표와 각자대표는 무엇이 다릅니까?',                                                  'job_competency', 'tech', 3),
  ('KODIT', '기업을 심사할 때 비재무적 요소 중 무엇이 중요하고, 그것을 어떻게 확인하시겠습니까?',       'job_competency', 'tech', 3),
  ('KODIT', '발생주의와 현금주의의 차이를 설명해 주십시오.',                                          'job_competency', 'tech', 3),
  ('KODIT', '재무상태표와 현금흐름표는 무엇이 다르고, 심사에서 각각 무엇을 보십니까?',                 'job_competency', 'tech', 3),
  ('KODIT', '기업을 판단할 때 가장 중요한 요소는 무엇이라고 생각하십니까?',                           'job_competency', 'tech', 2),
  ('KODIT', '미국 금리 인상이 우리나라 경제와 중소기업에 어떤 영향을 준다고 보십니까?',                 'job_competency', 'exec', 3),
  ('KODIT', '최근 관심 있게 본 경제 뉴스나 이슈는 무엇입니까?',                                       'job_competency', 'exec', 2),
  ('KODIT', '신용보증기금에 오기 위해 어떤 노력을 하셨습니까?',                                        'motivation',     'exec', 1),
  ('KODIT', '본인의 인생 로드맵과 좌우명을 말씀해 주십시오.',                                          'personality',    'exec', 1),
  ('KODIT', '두 상사가 동시에 업무를 요청하면 어떤 일부터 처리하시겠습니까?',                           'personality',    'hr',   2),
  ('KODIT', '업무가 몰리는 시기에는 우선순위를 어떻게 정하시겠습니까?',                                 'personality',    'hr',   2),
  ('KODIT', '고객이 들어줄 수 없는 요청을 계속 반복한다면 어떻게 대처하시겠습니까?',                    'personality',    'hr',   2),
  ('KODIT', '억울하게 누명을 쓰게 된다면 어떻게 대응하시겠습니까?',                                    'values_ethics',  'hr',   2),
  ('KODIT', '3개월 전에 처리한 업무에서 본인의 실수를 발견했다면 어떻게 하시겠습니까?',                 'values_ethics',  'hr',   2),
  -- IBK기업은행
  ('IBK',   '여러 은행 중에서 IBK기업은행을 선택하신 이유는 무엇입니까?',                              'motivation',     'exec', 1),
  ('IBK',   'IBK에 입행하기 위해 어떤 노력과 준비를 하셨습니까?',                                      'motivation',     'hr',   1),
  ('IBK',   '은행원으로서 가장 중요한 덕목은 무엇이며, 그 이유는 무엇입니까?',                          'values_ethics',  'exec', 2),
  ('IBK',   'IBK 핵심가치 중 가장 중요하다고 생각하는 것은 무엇입니까?',                                'values_ethics',  'exec', 2),
  ('IBK',   '은행원이 아니라면 어떤 직업을 갖고 싶었고, 왜 그 일에 어울린다고 생각하십니까?',           'personality',    'hr',   2),
  ('IBK',   '스트레스는 어떻게 관리하십니까?',                                                         'personality',    'hr',   1),
  ('IBK',   '본인에게 부족한 역량 중 가장 개선하고 싶은 것은 무엇입니까?',                              'personality',    'hr',   2),
  ('IBK',   '취업에 실패했던 경험이 있다면, 그 원인은 무엇이었다고 생각하십니까?',                      'personality',    'exec', 3),
  ('IBK',   '업무나 활동 중 실수했던 경험과 그것을 어떻게 수습했는지 말씀해 주십시오.',                 'experience',     'hr',   2),
  ('IBK',   '다른 사람을 위해 희생했던 경험을 말씀해 주십시오.',                                        'experience',     'hr',   2),
  ('IBK',   '중소기업 전문 은행으로서 IBK만의 강점은 무엇이라고 생각하십니까?',                         'job_competency', 'exec', 2),
  ('IBK',   '디지털 금융 변화 속에서 IBK가 나아가야 할 방향은 무엇입니까?',                              'job_competency', 'exec', 3),
  ('IBK',   '은행 업무는 영업이 핵심인데, 영업에 자신 있으십니까?',                                      'job_competency', 'hr',   2),
  ('IBK',   '최근 IBK가 추진하는 중요한 사업을 알고 계십니까?',                                          'job_competency', 'exec', 2),
  ('IBK',   '부동산 PF 부실의 원인은 무엇이라고 생각하십니까?',                                          'job_competency', 'tech', 3),
  ('IBK',   '1인 가구 고객을 위한 금융 상품을 만든다면 어떻게 설계하시겠습니까?',                        'job_competency', 'tech', 3),
  ('IBK',   'ESG 경영에서 IBK가 중점을 두어야 할 부분은 무엇입니까?',                                    'job_competency', 'exec', 3),
  -- 주택도시보증공사
  ('HUG',   'HUG와 LH는 무엇이 다르다고 생각하십니까?',                                                  'job_competency', 'tech', 2),
  ('HUG',   'HUG의 보증상품 종류와 각각의 역할을 설명해 주십시오.',                                      'job_competency', 'tech', 2),
  ('HUG',   '개인보증과 기업보증의 차이를 설명해 주십시오.',                                             'job_competency', 'tech', 3),
  ('HUG',   'SWOT 관점에서 HUG가 마주한 위협 요인은 무엇이라고 보십니까?',                               'job_competency', 'exec', 3),
  ('HUG',   '주택시장 안정을 위해 HUG가 할 수 있는 역할은 무엇입니까?',                                  'job_competency', 'exec', 3),
  ('HUG',   'HUG의 최근 이슈에 대한 본인의 견해를 말씀해 주십시오.',                                     'job_competency', 'exec', 2),
  ('HUG',   '입사하면 희망하는 부서와 그 이유를 말씀해 주십시오.',                                       'motivation',     'hr',   1),
  ('HUG',   '회사를 선택할 때 가장 중요하게 보는 기준 세 가지는 무엇입니까?',                            'personality',    'hr',   1),
  ('HUG',   '민원이 많은 업무입니다. 소통에 대해 어떻게 생각하시고, 관련 경험이 있습니까?',              'personality',    'hr',   2),
  ('HUG',   '담당자 공석으로 다른 부서 업무를 맡게 되면 어떻게 대처하시겠습니까?',                       'personality',    'hr',   2),
  ('HUG',   '본인을 비우호적으로 대하는 유관기관 직원이 있다면 어떻게 대처하시겠습니까?',                 'personality',    'hr',   2),
  ('HUG',   '다른 사람이 어려워하는 일을 보며 나라면 쉽게 처리하겠다고 생각한 적이 있습니까?',            'personality',    'hr',   2),
  ('HUG',   '이해관계가 부딪혀 어려웠던 경험을 말씀해 주십시오.',                                        'experience',     'hr',   2);

do $$
declare r record;
begin
  for r in select * from seed_fin loop
    execute format(
      'insert into public.questions (text, category, target_role, difficulty, is_ncs_based, is_general, language)
       select %L, %L, %L, %s, false, false, ''ko''
       where not exists (select 1 from public.questions where text = %L)',
      r.text, r.category, r.role, r.difficulty, r.text);
  end loop;
end $$;

insert into public.question_organizations (question_id, organization_id)
select q.id, o.id
from seed_fin s
join public.questions q on q.text = s.text
join public.organizations o on o.code = s.code
on conflict do nothing;

-- 인재상·면접 특징 (면접 특징의 기출 PT·토론 주제는 주제 생성 프롬프트에 들어간다)
update public.organizations set talent_profile = talent_profile || jsonb_build_object(
  'talents', jsonb_build_array(
    '공기업인으로서의 기본인품과 금융인으로서의 성장자질을 갖추고 신보의 미래가치를 창출하며 사회적 책임을 다하는 인재',
    '기본인품: 기본예절, 공인정신, 애사심, 책임감·열정, 적응력·인내심',
    '성장자질: 혁신·소통의지, 논리적 사고력, 직관적 통찰력, 문제해결능력, 통섭능력·확장가능성'),
  'interview', '면접은 과제수행, 실무, 심층면접으로 진행되며 협업·논리적 사고·직무수행역량·청렴성·조직적합성을 본다. 재무제표·회계(발생주의, 현금흐름표), 기업 심사 기준(수익성과 성장성, 비재무 요소), 금리 등 거시경제 질문이 자주 나오고, 상사 요청 충돌·민원·실수 수습 같은 상황 질문이 많다.'
) where code = 'KODIT';

update public.organizations set talent_profile = talent_profile || jsonb_build_object(
  'talents', jsonb_build_array(
    '탄탄한 기본기로 시장 경쟁력을 갖춘 인재',
    '신뢰와 소통 능력으로 고객을 감동시키는 인재',
    '창의력과 융합능력으로 성과를 창출하는 인재'),
  'interview', '서류 → 필기 → 실기 → 면접. 실기는 토론(10분 준비·30분 자유토론), PT(20분 자료 작성 후 발표), 개인 인터뷰이고 최종은 임원 다대다 면접이다. 기출 PT 주제: 지점 활성화, 마이데이터 활용, 인터넷은행 대응, 글로벌 마케팅, ESG 경영 강화. 기출 토론 주제: 탄소 규제 완화, 생체데이터 사용, 지방정부 출자은행 설립. 중소기업 전문 은행으로서의 정체성과 영업 역량을 묻는다.'
) where code = 'IBK';

update public.organizations set talent_profile = talent_profile || jsonb_build_object(
  'interview', '1차는 직무(PT 포함)·인성, 2차는 임원 면접이다. 면접관 5명과 지원자 4명의 다대다로 진행되는 경우가 많고 답변은 40초~1분으로 짧게 해야 한다. PT는 기사 스크랩을 보고 해결 방안을 제시하는 방식이며, 기출 주제는 HUG의 친환경 경영, 대·중소기업 상생, 핀테크 대응이다. HUG와 LH의 차이, 보증상품 구조, 주택시장 안정 역할 같은 사업 이해 질문과 민원·유관기관 갈등 상황 질문이 많다.'
) where code = 'HUG';
