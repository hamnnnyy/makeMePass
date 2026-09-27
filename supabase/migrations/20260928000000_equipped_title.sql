-- 장착한 칭호. 획득한 칭호(user_achievements) 중 하나를 골라 이름 옆에 표시한다.
alter table public.profiles
  add column if not exists equipped_achievement_id uuid
  references public.achievements_master (id) on delete set null;
