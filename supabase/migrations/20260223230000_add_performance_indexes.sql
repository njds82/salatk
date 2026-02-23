create index if not exists idx_points_history_user_id
    on public.points_history (user_id);

create index if not exists idx_points_history_user_recorded_at
    on public.points_history (user_id, recorded_at desc);

create index if not exists idx_habits_user_id
    on public.habits (user_id);

create index if not exists idx_habit_history_user_date
    on public.habit_history (user_id, date);

create index if not exists idx_qada_prayers_user_recorded_at
    on public.qada_prayers (user_id, recorded_at desc);

create index if not exists idx_profiles_public_id
    on public.profiles (is_public, id);
