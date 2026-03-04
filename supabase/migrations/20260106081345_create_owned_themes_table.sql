create table public.owned_themes (
  user_id uuid references public.profiles(id) on delete cascade,
  theme_id text,
  purchased_at timestamp with time zone default now(),
  primary key (user_id, theme_id)
);

alter table public.owned_themes enable row level security;

create policy "Users can view their own owned themes"
  on public.owned_themes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own owned themes"
  on public.owned_themes for insert
  with check (auth.uid() = user_id);;
