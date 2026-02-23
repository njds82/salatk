-- ========================================
-- Tasks Table & Policies for Salatk
-- ========================================

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

alter table public.tasks enable row level security;

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
