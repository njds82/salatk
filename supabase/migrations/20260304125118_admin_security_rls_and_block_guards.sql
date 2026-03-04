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

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'prayer_records',
    'qada_prayers',
    'habits',
    'habit_history',
    'points_history',
    'user_settings',
    'locations',
    'owned_themes',
    'tasks'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_blocked_select_guard', t);
    execute format(
      'create policy %I on public.%I as restrictive for select using (not public.is_user_blocked(auth.uid()))',
      t || '_blocked_select_guard', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_blocked_insert_guard', t);
    execute format(
      'create policy %I on public.%I as restrictive for insert with check (not public.is_user_blocked(auth.uid()))',
      t || '_blocked_insert_guard', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_blocked_update_guard', t);
    execute format(
      'create policy %I on public.%I as restrictive for update using (not public.is_user_blocked(auth.uid())) with check (not public.is_user_blocked(auth.uid()))',
      t || '_blocked_update_guard', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_blocked_delete_guard', t);
    execute format(
      'create policy %I on public.%I as restrictive for delete using (not public.is_user_blocked(auth.uid()))',
      t || '_blocked_delete_guard', t
    );
  end loop;
end $$;;
