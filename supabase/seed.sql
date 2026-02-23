-- Repeatable seed for Salatk local integration tests.
-- Intentionally lightweight; tests create their own users and data.

-- Keep schema deterministic if developers re-run seed manually.
truncate table public.tasks restart identity cascade;
truncate table public.owned_themes restart identity cascade;
truncate table public.locations restart identity cascade;
truncate table public.user_settings restart identity cascade;
truncate table public.points_history restart identity cascade;
truncate table public.habit_history restart identity cascade;
truncate table public.habits restart identity cascade;
truncate table public.qada_prayers restart identity cascade;
truncate table public.prayer_records restart identity cascade;
truncate table public.profiles restart identity cascade;
