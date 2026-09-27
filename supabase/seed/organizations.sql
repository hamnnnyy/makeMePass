-- 기관 추가 (기존 4곳의 합격선·탈락선은 건드리지 않는다). 여러 번 실행해도 안전.
insert into public.organizations (code, name_ko, name_en, description, pass_threshold, veto_threshold, eliminate_threshold)
values
  ('BOK', '한국은행',         'Bank of Korea',
   '통화신용정책을 수립·집행해 물가안정과 금융안정을 도모하는 대한민국 중앙은행', 65, 45, 30),
  ('HF',  '한국주택금융공사', 'Korea Housing Finance Corporation',
   '보금자리론 등 정책모기지, 주택연금, 주택보증과 주택저당증권 발행으로 주택금융을 공급하는 공기업', 65, 45, 30),
  ('HUG', '주택도시보증공사', 'Korea Housing & Urban Guarantee Corporation',
   '분양보증, 전세보증금반환보증 등 주택 관련 보증과 주택도시기금 운용을 담당하는 공기업', 65, 45, 30)
on conflict (code) do nothing;

-- 평가 프롬프트에 들어가는 기관 설명. 비어 있을 때만 채운다.
update public.organizations o set description = v.description
from (values
  ('HIRA',  '요양급여비용 심사와 요양급여 적정성 평가를 통해 국민 의료비 지출의 적정성과 의료 질을 관리하는 준정부기관'),
  ('KAMCO', '부실채권 인수·정리, 국유재산 관리, 체납조세 공매, 가계·기업 재기 지원을 수행하는 금융 공기업'),
  ('KEPCO', '전력의 송전·배전·판매와 전력망 운영을 담당하는 에너지 공기업'),
  ('LH',    '공공주택 공급, 택지·신도시 개발, 도시재생과 주거복지 사업을 수행하는 공기업')
) as v(code, description)
where o.code = v.code and o.description is null;
