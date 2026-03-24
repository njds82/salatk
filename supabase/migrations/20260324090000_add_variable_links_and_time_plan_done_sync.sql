-- ========================================
-- Variable Links + Cloud-Synced Time Plan State
-- ========================================

create table if not exists public.variable_links (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    variable text not null check (char_length(trim(variable)) between 1 and 5),
    element_type text not null check (element_type in ('prayer', 'habit', 'task', 'timeplan')),
    element_id text not null,
    trigger_value text not null check (trigger_value in ('done', 'missed', 'completed', 'avoided', 'committed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint variable_links_unique_element unique (user_id, element_type, element_id)
);

create index if not exists idx_variable_links_user_variable
    on public.variable_links (user_id, variable);

create index if not exists idx_variable_links_user_type
    on public.variable_links (user_id, element_type);

drop trigger if exists trigger_variable_links_updated_at on public.variable_links;
create trigger trigger_variable_links_updated_at
before update on public.variable_links
for each row
execute function public.update_updated_at_column();

alter table public.variable_links enable row level security;

drop policy if exists "variable_links_select_own" on public.variable_links;
create policy "variable_links_select_own"
on public.variable_links
for select
using (auth.uid() = user_id);

drop policy if exists "variable_links_insert_own" on public.variable_links;
create policy "variable_links_insert_own"
on public.variable_links
for insert
with check (auth.uid() = user_id);

drop policy if exists "variable_links_update_own" on public.variable_links;
create policy "variable_links_update_own"
on public.variable_links
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "variable_links_delete_own" on public.variable_links;
create policy "variable_links_delete_own"
on public.variable_links
for delete
using (auth.uid() = user_id);

alter table public.time_plans
    add column if not exists is_done boolean not null default false,
    add column if not exists done_at timestamptz null;

create or replace function public.sync_time_plans_done_state()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'INSERT' then
        if new.is_done then
            new.done_at = coalesce(new.done_at, now());
        else
            new.done_at = null;
        end if;
    else
        if new.is_done then
            if old.is_done is distinct from true then
                new.done_at = coalesce(new.done_at, now());
            elsif new.done_at is null then
                new.done_at = old.done_at;
            end if;
        else
            new.done_at = null;
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trigger_time_plans_done_state on public.time_plans;
create trigger trigger_time_plans_done_state
before insert or update on public.time_plans
for each row
execute function public.sync_time_plans_done_state();
