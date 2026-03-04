create table if not exists public.admin_users (
    user_id uuid primary key,
    expected_username text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_access_status (
    user_id uuid primary key references auth.users(id) on delete cascade,
    is_blocked boolean not null default false,
    blocked_reason text,
    blocked_by uuid,
    blocked_at timestamptz,
    updated_at timestamptz not null default now()
);

create table if not exists public.user_push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null unique,
    p256dh text not null,
    auth_key text not null,
    is_active boolean not null default true,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_user_push_subscriptions_user_id
    on public.user_push_subscriptions(user_id);

create index if not exists idx_user_push_subscriptions_is_active
    on public.user_push_subscriptions(is_active);

create table if not exists public.user_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    body text not null,
    payload jsonb not null default '{}'::jsonb,
    source text not null default 'admin' check (source in ('admin', 'system')),
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_read
    on public.user_notifications(user_id, is_read, created_at desc);

create table if not exists public.admin_audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_user_id uuid not null,
    action text not null,
    target_user_id uuid,
    status text not null check (status in ('success', 'error')),
    metadata jsonb not null default '{}'::jsonb,
    error_message text,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created_at
    on public.admin_audit_logs(created_at desc);

create index if not exists idx_admin_audit_logs_target_user_id
    on public.admin_audit_logs(target_user_id);

create or replace function public.is_user_blocked(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((
        select uas.is_blocked
        from public.user_access_status uas
        where uas.user_id = target_user_id
    ), false);
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.admin_users au
        left join public.profiles p on p.id = au.user_id
        left join auth.users u on u.id = au.user_id
        where au.user_id = auth.uid()
          and au.is_active = true
          and lower(au.expected_username) = lower(
              coalesce(
                  nullif(p.username, ''),
                  nullif(u.raw_user_meta_data ->> 'username', ''),
                  split_part(coalesce(u.email, ''), '@', 1)
              )
          )
    );
$$;

grant execute on function public.is_user_blocked(uuid) to authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace view public.admin_user_directory as
select
    u.id as user_id,
    coalesce(
        nullif(p.username, ''),
        nullif(lower(u.raw_user_meta_data ->> 'username'), ''),
        split_part(coalesce(u.email, ''), '@', 1)
    ) as username,
    coalesce(
        nullif(p.full_name, ''),
        nullif(u.raw_user_meta_data ->> 'full_name', '')
    ) as full_name,
    p.bio,
    coalesce(p.is_public, true) as is_public,
    coalesce(p.created_at, u.created_at) as created_at,
    coalesce(p.updated_at, u.updated_at, u.created_at) as updated_at,
    coalesce(uas.is_blocked, false) as is_blocked,
    uas.blocked_reason,
    uas.blocked_at
from auth.users u
left join public.profiles p on p.id = u.id
left join public.user_access_status uas on uas.user_id = u.id;

create or replace view public.leaderboard as
select
    p.id as user_id,
    coalesce(p.full_name, p.username, 'User') as full_name,
    coalesce(sum(ph.amount), 0)::bigint as total_points
from public.profiles p
left join public.points_history ph on ph.user_id = p.id
left join public.user_access_status uas on uas.user_id = p.id
where coalesce(p.is_public, true) = true
  and coalesce(uas.is_blocked, false) = false
group by p.id, p.full_name, p.username;

grant select on public.leaderboard to anon, authenticated;

drop trigger if exists trigger_admin_users_updated_at on public.admin_users;
create trigger trigger_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.update_updated_at_column();

drop trigger if exists trigger_user_access_status_updated_at on public.user_access_status;
create trigger trigger_user_access_status_updated_at
before update on public.user_access_status
for each row
execute function public.update_updated_at_column();

drop trigger if exists trigger_user_push_subscriptions_updated_at on public.user_push_subscriptions;
create trigger trigger_user_push_subscriptions_updated_at
before update on public.user_push_subscriptions
for each row
execute function public.update_updated_at_column();

alter table public.admin_users enable row level security;
alter table public.user_access_status enable row level security;
alter table public.user_push_subscriptions enable row level security;
alter table public.user_notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users
for select
using (auth.uid() = user_id);

drop policy if exists "user_access_status_select_self" on public.user_access_status;
create policy "user_access_status_select_self"
on public.user_access_status
for select
using (auth.uid() = user_id);

drop policy if exists "user_push_subscriptions_select_own" on public.user_push_subscriptions;
create policy "user_push_subscriptions_select_own"
on public.user_push_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "user_push_subscriptions_insert_own" on public.user_push_subscriptions;
create policy "user_push_subscriptions_insert_own"
on public.user_push_subscriptions
for insert
with check (
    auth.uid() = user_id
    and not public.is_user_blocked(auth.uid())
);

drop policy if exists "user_push_subscriptions_update_own" on public.user_push_subscriptions;
create policy "user_push_subscriptions_update_own"
on public.user_push_subscriptions
for update
using (
    auth.uid() = user_id
    and not public.is_user_blocked(auth.uid())
)
with check (
    auth.uid() = user_id
    and not public.is_user_blocked(auth.uid())
);

drop policy if exists "user_push_subscriptions_delete_own" on public.user_push_subscriptions;
create policy "user_push_subscriptions_delete_own"
on public.user_push_subscriptions
for delete
using (
    auth.uid() = user_id
    and not public.is_user_blocked(auth.uid())
);

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own"
on public.user_notifications
for select
using (auth.uid() = user_id);

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own"
on public.user_notifications
for update
using (
    auth.uid() = user_id
    and not public.is_user_blocked(auth.uid())
)
with check (
    auth.uid() = user_id
    and not public.is_user_blocked(auth.uid())
);

drop policy if exists "admin_audit_logs_select_admin" on public.admin_audit_logs;
create policy "admin_audit_logs_select_admin"
on public.admin_audit_logs
for select
using (public.is_current_user_admin());

drop policy if exists "profiles_blocked_select_guard" on public.profiles;
create policy "profiles_blocked_select_guard"
on public.profiles
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "profiles_blocked_insert_guard" on public.profiles;
create policy "profiles_blocked_insert_guard"
on public.profiles
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "profiles_blocked_update_guard" on public.profiles;
create policy "profiles_blocked_update_guard"
on public.profiles
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "profiles_blocked_delete_guard" on public.profiles;
create policy "profiles_blocked_delete_guard"
on public.profiles
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "prayer_records_blocked_select_guard" on public.prayer_records;
create policy "prayer_records_blocked_select_guard"
on public.prayer_records
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "prayer_records_blocked_insert_guard" on public.prayer_records;
create policy "prayer_records_blocked_insert_guard"
on public.prayer_records
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "prayer_records_blocked_update_guard" on public.prayer_records;
create policy "prayer_records_blocked_update_guard"
on public.prayer_records
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "prayer_records_blocked_delete_guard" on public.prayer_records;
create policy "prayer_records_blocked_delete_guard"
on public.prayer_records
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "qada_prayers_blocked_select_guard" on public.qada_prayers;
create policy "qada_prayers_blocked_select_guard"
on public.qada_prayers
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "qada_prayers_blocked_insert_guard" on public.qada_prayers;
create policy "qada_prayers_blocked_insert_guard"
on public.qada_prayers
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "qada_prayers_blocked_update_guard" on public.qada_prayers;
create policy "qada_prayers_blocked_update_guard"
on public.qada_prayers
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "qada_prayers_blocked_delete_guard" on public.qada_prayers;
create policy "qada_prayers_blocked_delete_guard"
on public.qada_prayers
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "habits_blocked_select_guard" on public.habits;
create policy "habits_blocked_select_guard"
on public.habits
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "habits_blocked_insert_guard" on public.habits;
create policy "habits_blocked_insert_guard"
on public.habits
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "habits_blocked_update_guard" on public.habits;
create policy "habits_blocked_update_guard"
on public.habits
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "habits_blocked_delete_guard" on public.habits;
create policy "habits_blocked_delete_guard"
on public.habits
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "habit_history_blocked_select_guard" on public.habit_history;
create policy "habit_history_blocked_select_guard"
on public.habit_history
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "habit_history_blocked_insert_guard" on public.habit_history;
create policy "habit_history_blocked_insert_guard"
on public.habit_history
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "habit_history_blocked_update_guard" on public.habit_history;
create policy "habit_history_blocked_update_guard"
on public.habit_history
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "habit_history_blocked_delete_guard" on public.habit_history;
create policy "habit_history_blocked_delete_guard"
on public.habit_history
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "points_history_blocked_select_guard" on public.points_history;
create policy "points_history_blocked_select_guard"
on public.points_history
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "points_history_blocked_insert_guard" on public.points_history;
create policy "points_history_blocked_insert_guard"
on public.points_history
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "points_history_blocked_update_guard" on public.points_history;
create policy "points_history_blocked_update_guard"
on public.points_history
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "points_history_blocked_delete_guard" on public.points_history;
create policy "points_history_blocked_delete_guard"
on public.points_history
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "user_settings_blocked_select_guard" on public.user_settings;
create policy "user_settings_blocked_select_guard"
on public.user_settings
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "user_settings_blocked_insert_guard" on public.user_settings;
create policy "user_settings_blocked_insert_guard"
on public.user_settings
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "user_settings_blocked_update_guard" on public.user_settings;
create policy "user_settings_blocked_update_guard"
on public.user_settings
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "user_settings_blocked_delete_guard" on public.user_settings;
create policy "user_settings_blocked_delete_guard"
on public.user_settings
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "locations_blocked_select_guard" on public.locations;
create policy "locations_blocked_select_guard"
on public.locations
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "locations_blocked_insert_guard" on public.locations;
create policy "locations_blocked_insert_guard"
on public.locations
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "locations_blocked_update_guard" on public.locations;
create policy "locations_blocked_update_guard"
on public.locations
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "locations_blocked_delete_guard" on public.locations;
create policy "locations_blocked_delete_guard"
on public.locations
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "owned_themes_blocked_select_guard" on public.owned_themes;
create policy "owned_themes_blocked_select_guard"
on public.owned_themes
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "owned_themes_blocked_insert_guard" on public.owned_themes;
create policy "owned_themes_blocked_insert_guard"
on public.owned_themes
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "owned_themes_blocked_update_guard" on public.owned_themes;
create policy "owned_themes_blocked_update_guard"
on public.owned_themes
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "owned_themes_blocked_delete_guard" on public.owned_themes;
create policy "owned_themes_blocked_delete_guard"
on public.owned_themes
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "tasks_blocked_select_guard" on public.tasks;
create policy "tasks_blocked_select_guard"
on public.tasks
as restrictive
for select
using (not public.is_user_blocked(auth.uid()));

drop policy if exists "tasks_blocked_insert_guard" on public.tasks;
create policy "tasks_blocked_insert_guard"
on public.tasks
as restrictive
for insert
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "tasks_blocked_update_guard" on public.tasks;
create policy "tasks_blocked_update_guard"
on public.tasks
as restrictive
for update
using (not public.is_user_blocked(auth.uid()))
with check (not public.is_user_blocked(auth.uid()));

drop policy if exists "tasks_blocked_delete_guard" on public.tasks;
create policy "tasks_blocked_delete_guard"
on public.tasks
as restrictive
for delete
using (not public.is_user_blocked(auth.uid()));

insert into public.admin_users (user_id, expected_username, is_active)
values ('d06e0bfc-c18e-4c02-887f-774415148b11', 'khaled', true)
on conflict (user_id) do update
set expected_username = excluded.expected_username,
    is_active = excluded.is_active;
