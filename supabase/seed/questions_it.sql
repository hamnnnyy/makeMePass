-- 전산(IT) 직무 질문. tags 에 'IT' 가 있으면 전산 직무를 고른 면접에만 나온다. 여러 번 실행해도 안전.
-- 새 질문은 사용자가 준 실제 면접 피드백 메모(2026-09-29: PostgreSQL·MySQL 차이, 인덱스, Redis 특징, 시간복잡도,
-- IT로 해결하는 법, 부족한 점과 채울 방법, 고민의 단계)를 바탕으로 만들었다.

-- 기존 개발·전산 질문에 IT 태그를 붙인다
update public.questions set tags = array_append(coalesce(tags, '{}'), 'IT')
where not ('IT' = any(coalesce(tags, '{}')))
  and (
    (is_general and category = 'job_competency' and text ~ '기술 스택|코드의 가독성|기술적으로 가장 도전|Git|레거시 시스템|기술적 실수|비개발자|개발 시 반드시')
    or ('HIRA' = any(coalesce(tags, '{}')) and text ~ '대용량 데이터|개발 시 고려|시스템을 해외|전산 시스템에 구현|AI 기반 이상 탐지|EDI|전산 담당자|전산직으로|전산 관점|대량의 사용자|다룬 데이터 중')
  );

drop table if exists seed_it;
create temp table seed_it (text text, category text, role text, difficulty int);
insert into seed_it values
  ('PostgreSQL과 MySQL의 차이를 설명하고, 어떤 상황에서 무엇을 고르시겠습니까?',                  'job_competency', 'tech', 3),
  ('인덱스를 걸었는데도 조회가 느리다면 어떤 원인부터 의심하시겠습니까?',                          'job_competency', 'tech', 3),
  ('인덱스를 많이 만들수록 좋지 않은 이유는 무엇입니까?',                                          'job_competency', 'tech', 2),
  ('Redis의 특징을 기능 말고 구조 관점에서 설명해 주십시오. 왜 빠르고, 어떤 한계가 있습니까?',     'job_competency', 'tech', 3),
  ('작성한 코드의 시간복잡도를 줄여 본 경험이 있습니까? 무엇을 어떻게 바꿨습니까?',                'job_competency', 'tech', 3),
  ('O(n²)으로 동작하는 로직을 개선해야 한다면 어떤 순서로 고민하시겠습니까?',                      'job_competency', 'tech', 3),
  ('정규화와 반정규화는 각각 언제 선택하시겠습니까?',                                             'job_competency', 'tech', 3),
  ('캐시를 도입하면 원본 데이터와 어긋날 수 있습니다. 정합성은 어떻게 지키시겠습니까?',            'job_competency', 'tech', 3),
  ('서비스 장애가 났을 때 원인을 찾아가는 본인의 단계를 순서대로 설명해 주십시오.',                'job_competency', 'tech', 3),
  ('우리 기관 업무 중 비효율적인 부분 하나를 골라, IT로 어떻게 해결하시겠습니까?',                 'job_competency', 'exec', 3),
  ('전산 직무를 하기에 본인에게 부족한 역량은 무엇이고, 입사 전까지 어떻게 채우시겠습니까?',       'personality',    'hr',   2);

do $$
declare r record;
begin
  for r in select * from seed_it loop
    execute format(
      'insert into public.questions (text, category, target_role, difficulty, is_ncs_based, is_general, language, tags)
       select %L, %L, %L, %s, false, true, ''ko'', array[''IT'']
       where not exists (select 1 from public.questions where text = %L)',
      r.text, r.category, r.role, r.difficulty, r.text);
  end loop;
end $$;
