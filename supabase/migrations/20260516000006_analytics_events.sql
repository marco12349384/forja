create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  ingested_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;
create policy "Users can insert own analytics_events" on public.analytics_events
  for insert with check (auth.uid() = user_id);
create policy "Users can read own analytics_events" on public.analytics_events
  for select using (auth.uid() = user_id);

create index analytics_events_user_event_time_idx
  on public.analytics_events (user_id, event_name, occurred_at desc);

create index analytics_events_event_time_idx
  on public.analytics_events (event_name, occurred_at desc);
