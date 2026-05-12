-- Extensiones
create extension if not exists "uuid-ossp";

-- Tabla users (extiende auth.users de Supabase)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null default '',
  avatar_url text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Trigger para crear user al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User profiles
create table public.user_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  fitness_level text not null check (fitness_level in ('principiante', 'intermedio', 'avanzado')),
  goal text not null check (goal in ('perder_peso', 'ganar_musculo', 'resistencia', 'movilidad', 'fitness_general')),
  available_equipment text[] not null default '{}',
  days_per_week int not null check (days_per_week between 1 and 7),
  session_duration_min int not null check (session_duration_min between 20 and 120),
  injuries text[] not null default '{}',
  weight_kg numeric,
  height_cm numeric,
  age int,
  gender text check (gender in ('masculino', 'femenino', 'otro')),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "Users can read own profile" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = user_id);

-- Workout plans
create table public.workout_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  weeks_total int not null,
  generated_by_ai boolean not null default true,
  ai_context jsonb,
  created_at timestamptz not null default now()
);

alter table public.workout_plans enable row level security;
create policy "Users can read own plans" on public.workout_plans
  for select using (auth.uid() = user_id);
create policy "Service role can insert plans" on public.workout_plans
  for insert with check (true);

-- Plan weeks
create table public.plan_weeks (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  week_number int not null,
  focus text not null,
  notes text
);

alter table public.plan_weeks enable row level security;
create policy "Users can read own plan weeks" on public.plan_weeks
  for select using (
    auth.uid() = (select user_id from public.workout_plans where id = plan_id)
  );

-- Workouts
create table public.workouts (
  id uuid primary key default uuid_generate_v4(),
  plan_week_id uuid references public.plan_weeks(id) on delete cascade not null,
  day_of_week text not null check (day_of_week in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  name text not null,
  type text not null check (type in ('gym','home','cardio','calistenia','yoga','movilidad')),
  estimated_duration_min int not null,
  difficulty text not null check (difficulty in ('principiante','intermedio','avanzado'))
);

alter table public.workouts enable row level security;
create policy "Users can read own workouts" on public.workouts
  for select using (
    auth.uid() = (
      select wp.user_id from public.workout_plans wp
      join public.plan_weeks pw on pw.plan_id = wp.id
      where pw.id = plan_week_id
    )
  );

-- Exercises (dentro de un workout)
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references public.workouts(id) on delete cascade not null,
  catalog_id uuid not null,
  order_index int not null,
  sets int not null,
  reps text not null,
  rest_seconds int not null,
  tempo text,
  notes text
);

alter table public.exercises enable row level security;
create policy "Users can read own exercises" on public.exercises
  for select using (
    auth.uid() = (
      select wp.user_id from public.workout_plans wp
      join public.plan_weeks pw on pw.plan_id = wp.id
      join public.workouts w on w.plan_week_id = pw.id
      where w.id = workout_id
    )
  );
