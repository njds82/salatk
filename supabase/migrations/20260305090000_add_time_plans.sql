-- ========================================
-- Time Plans (Daily/Weekly)
-- ========================================

create table if not exists public.time_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    scope text not null check (scope in ('daily', 'weekly')),
    date date null,
    weekday smallint null check (weekday between 0 and 6),
    title text not null check (char_length(trim(title)) between 1 and 140),
    notes text null,
    start_time time not null,
    end_time time not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint time_plans_scope_date_check check (
        (scope = 'daily' and date is not null and weekday is null)
        or (scope = 'weekly' and weekday is not null and date is null)
    ),
    constraint time_plans_time_range_check check (start_time < end_time)
);

create index if not exists idx_time_plans_user_date
    on public.time_plans (user_id, date);

create index if not exists idx_time_plans_user_weekday
    on public.time_plans (user_id, weekday);

create index if not exists idx_time_plans_user_scope
    on public.time_plans (user_id, scope);

drop trigger if exists trigger_time_plans_updated_at on public.time_plans;
create trigger trigger_time_plans_updated_at
before update on public.time_plans
for each row
execute function public.update_updated_at_column();

alter table public.time_plans enable row level security;

drop policy if exists "time_plans_select_own" on public.time_plans;
create policy "time_plans_select_own"
on public.time_plans
for select
using (auth.uid() = user_id);

drop policy if exists "time_plans_insert_own" on public.time_plans;
create policy "time_plans_insert_own"
on public.time_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "time_plans_update_own" on public.time_plans;
create policy "time_plans_update_own"
on public.time_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "time_plans_delete_own" on public.time_plans;
create policy "time_plans_delete_own"
on public.time_plans
for delete
using (auth.uid() = user_id);
