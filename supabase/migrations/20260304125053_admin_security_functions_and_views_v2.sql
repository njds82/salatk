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

drop view if exists public.admin_user_directory;
create view public.admin_user_directory as
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
    coalesce(p.is_public, true) as is_public,
    coalesce(sum(ph.amount), 0)::bigint as total_points
from public.profiles p
left join public.points_history ph on ph.user_id = p.id
left join public.user_access_status uas on uas.user_id = p.id
where coalesce(p.is_public, true) = true
  and coalesce(uas.is_blocked, false) = false
group by p.id, p.full_name, p.username, p.is_public;

grant select on public.leaderboard to anon, authenticated;

insert into public.admin_users (user_id, expected_username, is_active)
values ('d06e0bfc-c18e-4c02-887f-774415148b11', 'khaled', true)
on conflict (user_id) do update
set expected_username = excluded.expected_username,
    is_active = excluded.is_active;;
