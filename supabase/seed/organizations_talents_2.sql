-- 인재상을 못 찾았던 7곳 재조사 (2026-10-01, Claude). 여러 번 실행해도 안전.
-- 출처: 한국중부발전·한국석유공사 공식 인재상 페이지, 한국은행 조직가치 페이지, NIA 비전·목표 페이지와 2026 상반기 채용공고(PDF),
--       KISA 비전 및 목표 페이지(검색 결과 요약, 사이트가 스크립트 접근을 막아 직접 확인은 못 함).
-- 국민연금공단·한국조폐공사·한국인터넷진흥원·한국은행·NIA 는 공식 '인재상' 문구를 찾지 못해 핵심가치·미션·면접 특징만 넣었다.
begin;
update public.organizations set talent_profile = coalesce(talent_profile, '{}'::jsonb) - 'talentsChecked' || '{"talents": ["Creative Global KOMIPO Challenger: 창조적 에너지로 세계와 소통하여 KOMIPO의 미래를 이끄는 인재", "Creative Challenger: 혁신적 사고와 열정으로 새로운 가치창출에 도전하는 인재", "Performance Leader: 강한 자부심과 책임감으로 자기업무에 주도적인 인재", "Global Communicator: 상호 존중과 배려로 세계와 소통하는 인재"]}'::jsonb where code = 'KOMIPO';
update public.organizations set core_values = '["안전환경", "미래성장", "혁신소통", "국민신뢰"]'::jsonb where code = 'KOMIPO';
update public.organizations set talent_profile = coalesce(talent_profile, '{}'::jsonb) - 'talentsChecked' || '{"talents": ["국민과 함께 끊임없이 혁신하며 열정적으로 도전하는 석유인", "열정과 도전", "안전과 환경", "혁신과 성장"]}'::jsonb where code = 'KNOC';
update public.organizations set core_values = '["공익", "중립", "책임", "소통", "전문성"]'::jsonb where code = 'BOK';
update public.organizations set core_values = '["도전: 혁신을 향한 도전", "신뢰: 신뢰받는 전문성", "공익: 청렴에 기반한 공익"]'::jsonb where code = 'NIA';
update public.organizations set talent_profile = coalesce(talent_profile, '{}'::jsonb) || '{"mission": "디지털로 사회 현안을 해결하고, 국가 미래를 열어간다 (비전: 국가 디지털 대전환 선도기관)", "interview": "필기는 TOPCIT. 1차 면접은 발표자료를 작성해 발표하고 질의응답하며 직무수행능력과 의사소통 능력을 본다(입사지원서 내용 포함). 2차 면접은 직무역량, 문제해결능력, 인성·가치관, 조직관을 종합 심사한다. AI·데이터·클라우드 등 국가 디지털 대전환 사업 이해가 중요하다."}'::jsonb where code = 'NIA';
update public.organizations set core_values = '["Cooperation(협력적 사고)", "Openness(개방적 태도)", "Responsibility(사회적 책임의식)", "Excellency(탁월한 역량)"]'::jsonb where code = 'KISA';
update public.organizations set talent_profile = coalesce(talent_profile, '{}'::jsonb) || '{"mission": "안전하고 신뢰할 수 있는 디지털 미래사회 선도"}'::jsonb where code = 'KISA';
commit;
