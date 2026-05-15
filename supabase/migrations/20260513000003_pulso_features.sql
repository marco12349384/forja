-- PULSO: nuevas funcionalidades (energy check-ins, SOCIO scores, mini misiones,
-- nutrición, retros semanales, chat SOCIO, perfil dietético)

-- Energy check-ins (chequeo diario de energía)
create table public.energy_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  energy_level int not null check (energy_level between 1 and 3),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.energy_checkins enable row level security;
create policy "Users can read own energy_checkins" on public.energy_checkins
  for select using (auth.uid() = user_id);
create policy "Users can insert own energy_checkins" on public.energy_checkins
  for insert with check (auth.uid() = user_id);
create policy "Users can update own energy_checkins" on public.energy_checkins
  for update using (auth.uid() = user_id);
create policy "Users can delete own energy_checkins" on public.energy_checkins
  for delete using (auth.uid() = user_id);

create index energy_checkins_user_date_idx
  on public.energy_checkins (user_id, date desc);

-- SOCIO scores (puntaje diario de bienestar 0-100)
create table public.socio_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  sleep_pts int not null default 0 check (sleep_pts between 0 and 25),
  nutrition_pts int not null default 0 check (nutrition_pts between 0 and 25),
  movement_pts int not null default 0 check (movement_pts between 0 and 25),
  hydration_pts int not null default 0 check (hydration_pts between 0 and 25),
  total int generated always as (sleep_pts + nutrition_pts + movement_pts + hydration_pts) stored,
  narrative text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.socio_scores enable row level security;
create policy "Users can read own socio_scores" on public.socio_scores
  for select using (auth.uid() = user_id);
create policy "Users can insert own socio_scores" on public.socio_scores
  for insert with check (auth.uid() = user_id);
create policy "Users can update own socio_scores" on public.socio_scores
  for update using (auth.uid() = user_id);
create policy "Users can delete own socio_scores" on public.socio_scores
  for delete using (auth.uid() = user_id);

create index socio_scores_user_date_idx
  on public.socio_scores (user_id, date desc);

-- Mini misiones (micro-retos diarios)
create table public.mini_missions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  label text not null,
  icon text not null default '⚡',
  category text not null check (category in ('nutrition', 'movement', 'hydration', 'mindset')),
  points_value int not null default 10,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  check ((done = false and done_at is null) or (done = true and done_at is not null))
);

alter table public.mini_missions enable row level security;
create policy "Users can read own mini_missions" on public.mini_missions
  for select using (auth.uid() = user_id);
create policy "Users can insert own mini_missions" on public.mini_missions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own mini_missions" on public.mini_missions
  for update using (auth.uid() = user_id);
create policy "Users can delete own mini_missions" on public.mini_missions
  for delete using (auth.uid() = user_id);

create index mini_missions_user_date_idx
  on public.mini_missions (user_id, date);
create index mini_missions_user_pending_idx
  on public.mini_missions (user_id, date) where done = false;

-- Daily nutrition (macros agregados diarios)
create table public.daily_nutrition (
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  kcal_consumed int not null default 0 check (kcal_consumed >= 0),
  kcal_goal int not null default 2000 check (kcal_goal >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  protein_goal numeric not null default 100 check (protein_goal >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  water_glasses int not null default 0 check (water_glasses >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.daily_nutrition enable row level security;
create policy "Users can read own daily_nutrition" on public.daily_nutrition
  for select using (auth.uid() = user_id);
create policy "Users can insert own daily_nutrition" on public.daily_nutrition
  for insert with check (auth.uid() = user_id);
create policy "Users can update own daily_nutrition" on public.daily_nutrition
  for update using (auth.uid() = user_id);
create policy "Users can delete own daily_nutrition" on public.daily_nutrition
  for delete using (auth.uid() = user_id);

-- Food logs (entradas individuales de comidas)
create table public.food_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  meal_type text not null check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack')),
  description text not null,
  kcal int not null check (kcal >= 0),
  protein_g numeric check (protein_g is null or protein_g >= 0),
  carbs_g numeric check (carbs_g is null or carbs_g >= 0),
  fat_g numeric check (fat_g is null or fat_g >= 0),
  logged_via text not null default 'manual' check (logged_via in ('manual', 'snap_eat')),
  confidence_score numeric check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.food_logs enable row level security;
create policy "Users can read own food_logs" on public.food_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own food_logs" on public.food_logs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own food_logs" on public.food_logs
  for update using (auth.uid() = user_id);
create policy "Users can delete own food_logs" on public.food_logs
  for delete using (auth.uid() = user_id);

create index food_logs_user_date_idx
  on public.food_logs (user_id, date desc);

-- Weekly retros (retrospectiva semanal de SOCIO)
create table public.weekly_retros (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  week_number int not null check (week_number between 1 and 53),
  year int not null check (year between 2024 and 2100),
  completed_workouts int not null default 0,
  planned_workouts int not null default 0,
  avg_socio_score int check (avg_socio_score is null or avg_socio_score between 0 and 100),
  narrative text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_number, year)
);

alter table public.weekly_retros enable row level security;
create policy "Users can read own weekly_retros" on public.weekly_retros
  for select using (auth.uid() = user_id);
create policy "Users can insert own weekly_retros" on public.weekly_retros
  for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly_retros" on public.weekly_retros
  for update using (auth.uid() = user_id);
create policy "Users can delete own weekly_retros" on public.weekly_retros
  for delete using (auth.uid() = user_id);

create index weekly_retros_user_year_week_idx
  on public.weekly_retros (user_id, year desc, week_number desc);

-- SOCIO messages (historial de chat con SOCIO AI)
create table public.socio_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.socio_messages enable row level security;
create policy "Users can read own socio_messages" on public.socio_messages
  for select using (auth.uid() = user_id);
create policy "Users can insert own socio_messages" on public.socio_messages
  for insert with check (auth.uid() = user_id);
create policy "Users can update own socio_messages" on public.socio_messages
  for update using (auth.uid() = user_id);
create policy "Users can delete own socio_messages" on public.socio_messages
  for delete using (auth.uid() = user_id);

create index socio_messages_user_created_idx
  on public.socio_messages (user_id, created_at desc);

-- Diet profiles (perfil dietético extendido, uno por usuario)
create table public.diet_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  diet_type text not null default 'omnivoro' check (diet_type in ('omnivoro', 'vegetariano', 'vegano', 'sin_gluten', 'sin_lactosa', 'otro')),
  allergies text[] not null default '{}',
  budget text not null default 'medio' check (budget in ('bajo', 'medio', 'alto')),
  cooking_freq text not null default 'aveces' check (cooking_freq in ('siempre', 'aveces', 'casi_nunca')),
  training_location text,
  main_challenge text,
  updated_at timestamptz not null default now()
);

alter table public.diet_profiles enable row level security;
create policy "Users can read own diet_profiles" on public.diet_profiles
  for select using (auth.uid() = user_id);
create policy "Users can insert own diet_profiles" on public.diet_profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own diet_profiles" on public.diet_profiles
  for update using (auth.uid() = user_id);
create policy "Users can delete own diet_profiles" on public.diet_profiles
  for delete using (auth.uid() = user_id);
