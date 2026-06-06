create table if not exists public.countdown_events (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  title text not null,
  date date not null,
  category text not null default 'custom',
  icon text not null default '',
  repeat_type text not null default 'none',
  repeat_value text not null default '',
  note text not null default '',
  inserted_at timestamptz not null default now()
);

alter table public.countdown_events
  add column if not exists icon text not null default '',
  add column if not exists repeat_type text not null default 'none',
  add column if not exists repeat_value text not null default '';

create index if not exists countdown_events_owner_key_idx
  on public.countdown_events (owner_key);

alter table public.countdown_events enable row level security;

drop policy if exists "countdown events readable by owner key" on public.countdown_events;
create policy "countdown events readable by owner key"
  on public.countdown_events for select
  using (owner_key is not null);

drop policy if exists "countdown events insertable by owner key" on public.countdown_events;
create policy "countdown events insertable by owner key"
  on public.countdown_events for insert
  with check (owner_key is not null);

drop policy if exists "countdown events updatable by owner key" on public.countdown_events;
create policy "countdown events updatable by owner key"
  on public.countdown_events for update
  using (owner_key is not null)
  with check (owner_key is not null);

drop policy if exists "countdown events deletable by owner key" on public.countdown_events;
create policy "countdown events deletable by owner key"
  on public.countdown_events for delete
  using (owner_key is not null);
