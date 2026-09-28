-- 기관 분야 (면접 준비 화면의 분류·검색용)
alter table public.organizations add column if not exists category text;
