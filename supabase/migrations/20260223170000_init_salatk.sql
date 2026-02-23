create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    full_name text,
    bio text,
    referral_code text unique,
    referred_by uuid references public.profiles(id),
    is_public boolean not null default true,
    last_completed_stage integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.prayer_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,
    prayer_key text not null,
    status text not null check (status in ('done', 'missed')),
    recorded_at timestamptz not null default now(),
    unique (user_id, date, prayer_key)
);

create table if not exists public.qada_prayers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    original_date date,
    prayer_key text not null,
    rakaat integer not null check (rakaat >= 0),
    is_manual boolean not null default false,
    recorded_at timestamptz not null default now()
);

create unique index if not exists idx_qada_unique_date_prayer
    on public.qada_prayers(user_id, original_date, prayer_key);

create table if not exists public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    type text not null check (type in ('worship', 'sin')),
    created_at timestamptz not null default now()
);

create table if not exists public.habit_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    habit_id uuid not null references public.habits(id) on delete cascade,
    date date not null,
    action text not null check (action in ('done', 'avoided', 'committed')),
    recorded_at timestamptz not null default now(),
    unique (user_id, habit_id, date)
);

create table if not exists public.points_history (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    amount integer not null,
    reason text not null,
    recorded_at timestamptz not null default now()
);

create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    language text,
    theme text,
    calculation_method text,
    madhab text,
    last_visit date,
    initialized_at timestamptz,
    updated_at timestamptz not null default now()
);

create table if not exists public.locations (
    user_id uuid primary key references auth.users(id) on delete cascade,
    latitude double precision not null,
    longitude double precision not null,
    name text,
    is_manual_mode boolean not null default true,
    last_update timestamptz not null default now()
);

create table if not exists public.owned_themes (
    user_id uuid not null references auth.users(id) on delete cascade,
    theme_id text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, theme_id)
);

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(trim(title)) between 1 and 140),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
    due_date date not null,
    status text not null default 'pending' check (status in ('pending', 'completed')),
    completed_at timestamptz null,
    rollover_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_due
    on public.tasks (user_id, due_date);

create index if not exists idx_tasks_user_status_due
    on public.tasks (user_id, status, due_date);

create index if not exists idx_tasks_user_completed_at
    on public.tasks (user_id, completed_at);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
    if new.status = 'completed' then
        if old.status is distinct from 'completed' then
            new.completed_at = now();
        end if;
    else
        new.completed_at = null;
    end if;

    return new;
end;
$$;

drop trigger if exists trigger_tasks_updated_at on public.tasks;
create trigger trigger_tasks_updated_at
before update on public.tasks
for each row
execute function public.update_updated_at_column();

drop trigger if exists trigger_tasks_completed_at on public.tasks;
create trigger trigger_tasks_completed_at
before update of status on public.tasks
for each row
execute function public.set_task_completed_at();

create or replace function public.update_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trigger_profiles_updated_at on public.profiles;
create trigger trigger_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_profile_updated_at();

create or replace function public.update_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trigger_user_settings_updated_at on public.user_settings;
create trigger trigger_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.update_user_settings_updated_at();

alter table public.profiles enable row level security;
alter table public.prayer_records enable row level security;
alter table public.qada_prayers enable row level security;
alter table public.habits enable row level security;
alter table public.habit_history enable row level security;
alter table public.points_history enable row level security;
alter table public.user_settings enable row level security;
alter table public.locations enable row level security;
alter table public.owned_themes enable row level security;
alter table public.tasks enable row level security;

-- profiles
drop policy if exists "profiles_select_self_or_public" on public.profiles;
create policy "profiles_select_self_or_public"
on public.profiles for select
using (auth.uid() = id or is_public = true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- generic helper policies by user_id
drop policy if exists "prayer_records_all_own" on public.prayer_records;
create policy "prayer_records_all_own"
on public.prayer_records for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "qada_prayers_all_own" on public.qada_prayers;
create policy "qada_prayers_all_own"
on public.qada_prayers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habits_all_own" on public.habits;
create policy "habits_all_own"
on public.habits for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_history_all_own" on public.habit_history;
create policy "habit_history_all_own"
on public.habit_history for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "points_history_all_own" on public.points_history;
create policy "points_history_all_own"
on public.points_history for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_settings_all_own" on public.user_settings;
create policy "user_settings_all_own"
on public.user_settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "locations_all_own" on public.locations;
create policy "locations_all_own"
on public.locations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "owned_themes_all_own" on public.owned_themes;
create policy "owned_themes_all_own"
on public.owned_themes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks
for select
using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_restricted" on public.tasks;
create policy "tasks_delete_restricted"
on public.tasks
for delete
using (
    auth.uid() = user_id
    and (
        status = 'pending'
        or (status = 'completed' and completed_at < now() - interval '30 days')
    )
);

create or replace view public.leaderboard as
select
    p.id as user_id,
    coalesce(p.full_name, p.username, 'User') as full_name,
    coalesce(sum(ph.amount), 0)::bigint as total_points
from public.profiles p
left join public.points_history ph on ph.user_id = p.id
where coalesce(p.is_public, true) = true
group by p.id, p.full_name, p.username;

grant select on public.leaderboard to anon, authenticated;
