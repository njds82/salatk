alter table if exists public.profiles add column if not exists bio text;

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
    on public.admin_audit_logs(target_user_id);;
