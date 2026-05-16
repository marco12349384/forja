create table public.body_phases (
  user_id uuid primary key references public.users(id) on delete cascade,
  cycle_tracking_enabled boolean not null default false,
  last_period_start date,
  avg_cycle_days int not null default 28 check (avg_cycle_days between 21 and 40),
  stress_level int check (stress_level is null or stress_level between 1 and 5),
  sleep_quality int check (sleep_quality is null or sleep_quality between 1 and 5),
  recovery_mode boolean not null default false,
  recovery_triggered_at timestamptz,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.body_phases enable row level security;
create policy "Users can read own body_phases" on public.body_phases for select using (auth.uid() = user_id);
create policy "Users can insert own body_phases" on public.body_phases for insert with check (auth.uid() = user_id);
create policy "Users can update own body_phases" on public.body_phases for update using (auth.uid() = user_id);
create policy "Users can delete own body_phases" on public.body_phases for delete using (auth.uid() = user_id);
