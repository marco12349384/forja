create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade,
  date date not null,
  completed_at timestamptz not null default now(),
  duration_min int not null check (duration_min >= 0),
  kcal_estimate int not null default 0 check (kcal_estimate >= 0),
  total_sets int not null default 0 check (total_sets >= 0),
  completed_sets int not null default 0 check (completed_sets >= 0),
  intensity text not null default 'medium' check (intensity in ('light','medium','intense')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;
create policy "Users can read own workout_sessions" on public.workout_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own workout_sessions" on public.workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own workout_sessions" on public.workout_sessions
  for update using (auth.uid() = user_id);
create policy "Users can delete own workout_sessions" on public.workout_sessions
  for delete using (auth.uid() = user_id);

create index workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date desc);
create index workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at desc);
