-- Fix users table for Clerk auth (was wired for Supabase auth originally)
-- Drop trigger and function that reference auth.users
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop FK to auth.users from public.users.id so we can use UUID v4 defaults
alter table public.users drop constraint if exists users_id_fkey;

-- Make users.id a standalone UUID with default
alter table public.users alter column id set default uuid_generate_v4();

-- Add clerk_id column (used by every API route to map Clerk userId -> DB user)
alter table public.users add column if not exists clerk_id text;
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_clerk_id_unique'
  ) then
    alter table public.users add constraint users_clerk_id_unique unique (clerk_id);
  end if;
end $$;

-- Make clerk_id required for new rows
alter table public.users alter column clerk_id set not null;

-- Add is_active to workout_plans (used by generate-plan route to deactivate previous plans)
alter table public.workout_plans
  add column if not exists is_active boolean not null default true;

create index if not exists workout_plans_user_active_idx
  on public.workout_plans (user_id) where is_active = true;

-- Note: RLS policies that compare auth.uid() = id won't trigger for Clerk-authenticated
-- server requests because the backend uses a raw `postgres` connection that bypasses RLS.
-- Client code only talks to /api/* routes (validated by Clerk middleware), so the policies
-- are effectively dormant safety nets. Leaving them in place — no action needed.
