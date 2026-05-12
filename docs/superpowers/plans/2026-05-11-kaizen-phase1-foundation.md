# Forja — Phase 1: Foundation + Auth + Onboarding + Plan Generation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo funcional donde un usuario puede registrarse, completar el onboarding de 5 pasos, y ver su plan de entrenamiento generado por IA en web y móvil.

**Architecture:** Turborepo monorepo con Next.js 14 (web) y Expo Router v3 (móvil). Supabase maneja auth y PostgreSQL. La generación del plan ocurre en una Supabase Edge Function que llama a Claude API. Paquetes compartidos: `types`, `ui` (NativeWind), `api-client`, `ai`.

**Tech Stack:** Turborepo 2, Next.js 14 App Router, Expo SDK 51, Supabase JS v2, NativeWind v4, Claude API (`claude-sonnet-4-6`), TypeScript 5, Vitest (web), Jest (mobile)

**Scope de este plan:** Fases 2-4 (Workout Player, Coach IA, Nutrición/Wearables/Stripe) están en planes separados.

---

## Mapa de archivos

```
fitly/
├── package.json                          ← root workspace config
├── turbo.json                            ← pipeline Turborepo
├── tsconfig.base.json                    ← TS config base
├── .gitignore
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx                  ← redirect a /home o /login
│   │       ├── (auth)/
│   │       │   ├── login/page.tsx
│   │       │   └── signup/page.tsx
│   │       ├── onboarding/
│   │       │   └── page.tsx              ← wizard 5 pasos
│   │       └── (app)/
│   │           ├── layout.tsx            ← layout protegido
│   │           └── home/page.tsx         ← dashboard con plan del día
│   └── mobile/
│       ├── package.json
│       ├── app.json
│       ├── tsconfig.json
│       └── app/
│           ├── _layout.tsx
│           ├── index.tsx                 ← redirect
│           ├── (auth)/
│           │   ├── login.tsx
│           │   └── signup.tsx
│           ├── onboarding/
│           │   └── index.tsx
│           └── (app)/
│               ├── _layout.tsx
│               └── home/index.tsx
├── packages/
│   ├── types/
│   │   └── src/index.ts                 ← todos los tipos compartidos
│   ├── ui/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── api-client/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── auth.ts
│   │       └── plans.ts
│   └── ai/
│       └── src/
│           ├── index.ts
│           └── prompts.ts               ← system prompts para Claude
└── supabase/
    ├── config.toml
    ├── migrations/
    │   ├── 20260511000001_initial_schema.sql
    │   └── 20260511000002_exercise_catalog.sql
    └── functions/
        ├── generate-plan/
        │   └── index.ts
        └── _shared/
            └── claude.ts
```

---

## Task 1: Turborepo monorepo init

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

- [ ] **Step 1: Crear directorio raíz y entrar**

```bash
cd /Users/marcochacon/Desktop/fitly
```

- [ ] **Step 2: Crear package.json raíz**

```json
{
  "name": "forja",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Crear turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Crear tsconfig.base.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

- [ ] **Step 5: Crear .gitignore**

```
node_modules/
.next/
dist/
.expo/
.turbo/
coverage/
*.env.local
.supabase/
```

- [ ] **Step 6: Instalar dependencias raíz**

```bash
npm install
```

Expected: `node_modules/` creado con turbo y typescript.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json turbo.json tsconfig.base.json .gitignore
git commit -m "feat: init turborepo monorepo"
```

---

## Task 2: Paquete `packages/types`

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Crear package.json**

```bash
mkdir -p packages/types/src
```

`packages/types/package.json`:
```json
{
  "name": "@forja/types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Crear tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Escribir todos los tipos compartidos**

`packages/types/src/index.ts`:
```typescript
// ── Auth & User ──────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

// ── User Profile ─────────────────────────────────────────────────
export type FitnessLevel = 'principiante' | 'intermedio' | 'avanzado';
export type FitnessGoal =
  | 'perder_peso'
  | 'ganar_musculo'
  | 'resistencia'
  | 'movilidad'
  | 'fitness_general';
export type Equipment =
  | 'ninguno'
  | 'mancuernas'
  | 'barra'
  | 'anillas'
  | 'gym_completo'
  | 'bandas';

export interface UserProfile {
  user_id: string;
  fitness_level: FitnessLevel;
  goal: FitnessGoal;
  available_equipment: Equipment[];
  days_per_week: number;
  session_duration_min: number;
  injuries: string[];
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: 'masculino' | 'femenino' | 'otro' | null;
}

// ── Workout Plan ──────────────────────────────────────────────────
export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  weeks_total: number;
  generated_by_ai: boolean;
  created_at: string;
}

export interface PlanWeek {
  id: string;
  plan_id: string;
  week_number: number;
  focus: string;
  notes: string | null;
}

export type WorkoutType =
  | 'gym'
  | 'home'
  | 'cardio'
  | 'calistenia'
  | 'yoga'
  | 'movilidad';
export type DayOfWeek =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface Workout {
  id: string;
  plan_week_id: string;
  day_of_week: DayOfWeek;
  name: string;
  type: WorkoutType;
  estimated_duration_min: number;
  difficulty: FitnessLevel;
}

export interface Exercise {
  id: string;
  workout_id: string;
  catalog_id: string;
  order_index: number;
  sets: number;
  reps: string;      // "8-12" o "30seg" para tiempo
  rest_seconds: number;
  tempo: string | null;
  notes: string | null;
}

// ── Exercise Catalog ──────────────────────────────────────────────
export interface ExerciseImages {
  start: string;
  mid?: string;
  end: string;
}

export interface ExerciseCatalog {
  id: string;
  name: string;
  slug: string;
  type: WorkoutType;
  muscles_primary: string[];
  muscles_secondary: string[];
  equipment: Equipment;
  difficulty: FitnessLevel;
  video_url: string;
  images: ExerciseImages;
  cues_correct: string[];
  cues_common_mistakes: string[];
  calistenia_level: number | null;
  created_at: string;
}

// ── Onboarding ────────────────────────────────────────────────────
export interface OnboardingData {
  goal: FitnessGoal;
  fitness_level: FitnessLevel;
  available_equipment: Equipment[];
  days_per_week: number;
  session_duration_min: number;
  injuries: string[];
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: UserProfile['gender'];
}

// ── AI Plan Generation ────────────────────────────────────────────
export interface GeneratePlanRequest {
  user_id: string;
  profile: OnboardingData;
}

export interface GeneratePlanResponse {
  plan_id: string;
  plan_name: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/types
git commit -m "feat: add shared types package"
```

---

## Task 3: Paquete `packages/ui`

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/Button.tsx`
- Create: `packages/ui/src/Input.tsx`
- Create: `packages/ui/src/Card.tsx`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Setup**

```bash
mkdir -p packages/ui/src
```

`packages/ui/package.json`:
```json
{
  "name": "@forja/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "react": ">=18",
    "react-native": ">=0.73"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/react": "^18"
  }
}
```

- [ ] **Step 2: Button component**

`packages/ui/src/Button.tsx`:
```tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const base = 'rounded-2xl px-6 py-4 items-center justify-center flex-row gap-2';
  const variants = {
    primary: 'bg-emerald-500 active:bg-emerald-600',
    secondary: 'bg-zinc-800 active:bg-zinc-700',
    ghost: 'bg-transparent border border-zinc-700',
  };
  const textVariants = {
    primary: 'text-white font-bold text-base',
    secondary: 'text-white font-semibold text-base',
    ghost: 'text-zinc-300 font-semibold text-base',
  };

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && <ActivityIndicator size="small" color="white" />}
      <Text className={textVariants[variant]}>{label}</Text>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Input component**

`packages/ui/src/Input.tsx`:
```tsx
import { TextInput, View, Text } from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  className?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  className = '',
}: InputProps) {
  return (
    <View className={`gap-1 ${className}`}>
      {label && (
        <Text className="text-zinc-400 text-sm font-medium">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className={`bg-zinc-900 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 py-3 text-white text-base`}
      />
      {error && <Text className="text-red-400 text-xs">{error}</Text>}
    </View>
  );
}
```

- [ ] **Step 4: Card component**

`packages/ui/src/Card.tsx`:
```tsx
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 ${className}`}>
      {children}
    </View>
  );
}
```

- [ ] **Step 5: Barrel export**

`packages/ui/src/index.ts`:
```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
```

- [ ] **Step 6: Commit**

```bash
git add packages/ui
git commit -m "feat: add shared UI components package"
```

---

## Task 4: Supabase setup + migraciones

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260511000001_initial_schema.sql`
- Create: `supabase/migrations/20260511000002_exercise_catalog.sql`

**Prerequisito:** Tener [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (`brew install supabase/tap/supabase`) y una cuenta en supabase.com con proyecto creado. Anota: `PROJECT_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`.

- [ ] **Step 1: Init Supabase local**

```bash
supabase init
```

Expected: crea `supabase/config.toml`

- [ ] **Step 2: Crear migración del schema principal**

```bash
supabase migration new initial_schema
```

Editar el archivo generado en `supabase/migrations/..._initial_schema.sql`:

```sql
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
```

- [ ] **Step 3: Crear migración del catálogo de ejercicios**

```bash
supabase migration new exercise_catalog
```

```sql
-- Exercise catalog
create table public.exercise_catalog (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  type text not null check (type in ('gym','home','cardio','calistenia','yoga','movilidad')),
  muscles_primary text[] not null,
  muscles_secondary text[] not null default '{}',
  equipment text not null check (equipment in ('ninguno','mancuernas','barra','anillas','gym_completo','bandas')),
  difficulty text not null check (difficulty in ('principiante','intermedio','avanzado')),
  video_url text not null,
  images jsonb not null,        -- {start: url, mid?: url, end: url}
  cues_correct text[] not null default '{}',
  cues_common_mistakes text[] not null default '{}',
  calistenia_level int check (calistenia_level between 1 and 5),
  created_at timestamptz not null default now(),
  constraint exercise_catalog_images_check check (
    images ? 'start' and images ? 'end'
  )
);

-- Catálogo público (solo lectura para usuarios autenticados)
alter table public.exercise_catalog enable row level security;
create policy "Authenticated users can read catalog" on public.exercise_catalog
  for select using (auth.role() = 'authenticated');

-- Foreign key de exercises al catálogo
alter table public.exercises
  add constraint exercises_catalog_id_fkey
  foreign key (catalog_id) references public.exercise_catalog(id);

-- Seed: ejercicios iniciales
insert into public.exercise_catalog
  (name, slug, type, muscles_primary, muscles_secondary, equipment, difficulty, video_url, images, cues_correct, cues_common_mistakes)
values
(
  'Flexión de brazos', 'flexion-brazos',
  'calistenia', ARRAY['pectoral_mayor', 'triceps'], ARRAY['deltoides_anterior', 'core'],
  'ninguno', 'principiante',
  'https://www.youtube.com/embed/IODxDxX7oi4',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400", "end": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=400"}',
  ARRAY['Mantén el cuerpo recto como una tabla', 'Baja hasta casi tocar el suelo', 'Codos a 45° del cuerpo'],
  ARRAY['No dejes caer las caderas', 'No bloquees los codos al subir', 'No mires hacia arriba — cabeza neutra']
),
(
  'Sentadilla', 'sentadilla',
  'home', ARRAY['cuadriceps', 'gluteos'], ARRAY['isquiotibiales', 'core'],
  'ninguno', 'principiante',
  'https://www.youtube.com/embed/aclHkVaku9U',
  '{"start": "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400", "end": "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400"}',
  ARRAY['Rodillas alineadas con los pies', 'Espalda recta, pecho hacia arriba', 'Baja hasta muslos paralelos al suelo'],
  ARRAY['No dejes que las rodillas colapsen hacia adentro', 'No levantes los talones del suelo']
),
(
  'Dominada', 'dominada',
  'calistenia', ARRAY['dorsal_ancho', 'biceps'], ARRAY['romboides', 'core'],
  'barra', 'intermedio',
  'https://www.youtube.com/embed/eGo4IYlbE5g',
  '{"start": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400", "end": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"}',
  ARRAY['Empieza con brazos completamente extendidos', 'Jala los codos hacia las costillas', 'Lleva el pecho a la barra'],
  ARRAY['No uses impulso', 'No encojas los hombros', 'No dejes caer el cuerpo sin control']
),
(
  'Press de banca', 'press-banca',
  'gym', ARRAY['pectoral_mayor'], ARRAY['triceps', 'deltoides_anterior'],
  'barra', 'intermedio',
  'https://www.youtube.com/embed/rT7DgCr-3pg',
  '{"start": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=400", "end": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400"}',
  ARRAY['Pies planos en el suelo', 'Arco natural en la espalda baja', 'Baja la barra al pectoral bajo'],
  ARRAY['No rebotar la barra en el pecho', 'No levantar las caderas del banco', 'No tomar grip demasiado ancho']
);
```

- [ ] **Step 4: Aplicar migraciones en local**

```bash
supabase db push
```

Expected: migraciones aplicadas sin errores.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add supabase schema and exercise catalog seed"
```

---

## Task 5: Paquete `packages/ai` (prompts para Claude)

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/src/prompts.ts`
- Create: `packages/ai/src/index.ts`

- [ ] **Step 1: Setup**

```bash
mkdir -p packages/ai/src
```

`packages/ai/package.json`:
```json
{
  "name": "@forja/ai",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Escribir prompts**

`packages/ai/src/prompts.ts`:
```typescript
import type { OnboardingData } from '@forja/types';

export const COACH_SYSTEM_PROMPT = `Eres Kai, el coach de fitness personal de la app Forja.
Filosofía: mejora continua (forja). Eres motivador, directo y basas todo en ciencia del ejercicio.
Idioma: español. Tutea al usuario.
Conoces el plan actual del usuario, su progreso y sus últimas sesiones — úsalos en cada respuesta.
Máximo 3 párrafos por respuesta. Sin bullet points excesivos.`;

export function buildGeneratePlanPrompt(profile: OnboardingData): string {
  return `Eres un coach de fitness experto. Genera un plan de entrenamiento personalizado en JSON.

PERFIL DEL USUARIO:
- Objetivo: ${profile.goal}
- Nivel: ${profile.fitness_level}
- Equipo disponible: ${profile.available_equipment.join(', ') || 'ninguno'}
- Días por semana: ${profile.days_per_week}
- Duración por sesión: ${profile.session_duration_min} minutos
- Lesiones/restricciones: ${profile.injuries.join(', ') || 'ninguna'}

INSTRUCCIONES:
1. Genera un plan de 4 semanas con ${profile.days_per_week} días de entrenamiento por semana
2. Usa SOLO ejercicios de esta lista (por slug): flexion-brazos, sentadilla, dominada, press-banca
3. Adapta el volumen e intensidad al nivel del usuario
4. Cada workout debe durar aproximadamente ${profile.session_duration_min} minutos

RESPONDE SOLO con JSON válido con esta estructura exacta:
{
  "plan_name": "string",
  "weeks": [
    {
      "week_number": 1,
      "focus": "string",
      "notes": "string",
      "workouts": [
        {
          "day_of_week": "lunes",
          "name": "string",
          "type": "gym|home|calistenia|cardio|yoga|movilidad",
          "estimated_duration_min": 45,
          "difficulty": "principiante|intermedio|avanzado",
          "exercises": [
            {
              "catalog_slug": "flexion-brazos",
              "order_index": 1,
              "sets": 3,
              "reps": "8-12",
              "rest_seconds": 60,
              "notes": null
            }
          ]
        }
      ]
    }
  ]
}`;
}

export function buildAdaptPlanPrompt(
  currentPlan: string,
  recentSessions: string
): string {
  return `Eres un coach de fitness experto. Analiza el progreso del usuario y ajusta las próximas semanas del plan.

PLAN ACTUAL (semanas futuras en JSON):
${currentPlan}

SESIONES RECIENTES (últimas 4 semanas):
${recentSessions}

INSTRUCCIONES:
- Si el usuario completó >80% de las sesiones y el RPE promedio es <7: aumenta sets o carga 5-10%
- Si completó <50% o RPE promedio >8.5: reduce volumen 15%, más días de descanso
- Mantén la misma estructura JSON que recibiste, solo modifica los valores numéricos necesarios

RESPONDE SOLO con el JSON ajustado de las semanas futuras.`;
}
```

- [ ] **Step 3: Barrel export**

`packages/ai/src/index.ts`:
```typescript
export { COACH_SYSTEM_PROMPT, buildGeneratePlanPrompt, buildAdaptPlanPrompt } from './prompts';
```

- [ ] **Step 4: Commit**

```bash
git add packages/ai
git commit -m "feat: add AI prompts package"
```

---

## Task 6: Edge Function `generate-plan`

**Files:**
- Create: `supabase/functions/_shared/claude.ts`
- Create: `supabase/functions/generate-plan/index.ts`

**Prerequisito:** `ANTHROPIC_API_KEY` configurado en Supabase Dashboard → Settings → Edge Functions → Secrets.

- [ ] **Step 1: Claude helper compartido**

```bash
mkdir -p supabase/functions/_shared
mkdir -p supabase/functions/generate-plan
```

`supabase/functions/_shared/claude.ts`:
```typescript
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
```

- [ ] **Step 2: Edge Function generate-plan**

`supabase/functions/generate-plan/index.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callClaude } from '../_shared/claude.ts';

// Inline prompt (cannot import local packages in Edge Functions)
function buildPrompt(profile: Record<string, unknown>): string {
  return `Eres un coach de fitness experto. Genera un plan de entrenamiento personalizado en JSON.

PERFIL DEL USUARIO:
- Objetivo: ${profile.goal}
- Nivel: ${profile.fitness_level}
- Equipo disponible: ${(profile.available_equipment as string[]).join(', ') || 'ninguno'}
- Días por semana: ${profile.days_per_week}
- Duración por sesión: ${profile.session_duration_min} minutos
- Lesiones/restricciones: ${(profile.injuries as string[]).join(', ') || 'ninguna'}

Ejercicios disponibles (slugs): flexion-brazos, sentadilla, dominada, press-banca

Genera un plan de 4 semanas. Responde SOLO con JSON válido:
{
  "plan_name": "string",
  "weeks": [
    {
      "week_number": 1,
      "focus": "string",
      "notes": "string",
      "workouts": [
        {
          "day_of_week": "lunes",
          "name": "string",
          "type": "calistenia",
          "estimated_duration_min": 45,
          "difficulty": "principiante",
          "exercises": [
            {
              "catalog_slug": "flexion-brazos",
              "order_index": 1,
              "sets": 3,
              "reps": "8-12",
              "rest_seconds": 60,
              "notes": null
            }
          ]
        }
      ]
    }
  ]
}`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar JWT del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile } = await req.json();

    // Llamar a Claude
    const rawJson = await callClaude(
      'Eres un coach de fitness experto. Responde solo con JSON válido.',
      buildPrompt(profile),
      4096
    );

    // Parsear respuesta
    const planData = JSON.parse(rawJson);

    // Crear plan en DB
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: planData.plan_name,
        weeks_total: planData.weeks.length,
        generated_by_ai: true,
        ai_context: { profile },
      })
      .select()
      .single();

    if (planError) throw planError;

    // Insertar semanas, workouts y ejercicios
    for (const week of planData.weeks) {
      const { data: planWeek, error: weekError } = await supabase
        .from('plan_weeks')
        .insert({
          plan_id: plan.id,
          week_number: week.week_number,
          focus: week.focus,
          notes: week.notes ?? null,
        })
        .select()
        .single();

      if (weekError) throw weekError;

      for (const workout of week.workouts) {
        const { data: workoutRow, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            plan_week_id: planWeek.id,
            day_of_week: workout.day_of_week,
            name: workout.name,
            type: workout.type,
            estimated_duration_min: workout.estimated_duration_min,
            difficulty: workout.difficulty,
          })
          .select()
          .single();

        if (workoutError) throw workoutError;

        for (const ex of workout.exercises) {
          // Buscar catalog_id por slug
          const { data: catalog } = await supabase
            .from('exercise_catalog')
            .select('id')
            .eq('slug', ex.catalog_slug)
            .single();

          if (!catalog) continue; // skip si el slug no existe

          await supabase.from('exercises').insert({
            workout_id: workoutRow.id,
            catalog_id: catalog.id,
            order_index: ex.order_index,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes ?? null,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ plan_id: plan.id, plan_name: plan.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

- [ ] **Step 3: Deploy Edge Function**

```bash
supabase functions deploy generate-plan
```

Expected: `Function generate-plan deployed`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add generate-plan edge function"
```

---

## Task 7: Paquete `packages/api-client`

**Files:**
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/src/auth.ts`
- Create: `packages/api-client/src/plans.ts`
- Create: `packages/api-client/src/index.ts`

- [ ] **Step 1: Setup**

```bash
mkdir -p packages/api-client/src
```

`packages/api-client/package.json`:
```json
{
  "name": "@forja/api-client",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@forja/types": "*",
    "@supabase/supabase-js": "^2.43.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Auth client**

`packages/api-client/src/auth.ts`:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export async function signUpWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string,
  name: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
}

export async function signInWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut(supabase: SupabaseClient) {
  return supabase.auth.signOut();
}

export async function getCurrentUser(supabase: SupabaseClient) {
  return supabase.auth.getUser();
}
```

- [ ] **Step 3: Plans client**

`packages/api-client/src/plans.ts`:
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { OnboardingData, WorkoutPlan, Workout, Exercise, ExerciseCatalog } from '@forja/types';

export async function saveUserProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: OnboardingData
) {
  return supabase.from('user_profiles').upsert({
    user_id: userId,
    ...profile,
  });
}

export async function generatePlan(
  supabase: SupabaseClient,
  profile: OnboardingData
): Promise<{ plan_id: string; plan_name: string }> {
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: { profile },
  });
  if (error) throw error;
  return data;
}

export async function getActivePlan(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function getTodayWorkout(
  supabase: SupabaseClient,
  planId: string,
  dayOfWeek: string
): Promise<(Workout & { exercises: (Exercise & { catalog: ExerciseCatalog })[] }) | null> {
  const today = new Date();
  const weekNumber = Math.ceil(
    (Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7
  );
  const currentWeek = ((weekNumber - 1) % 4) + 1; // ciclo de 4 semanas

  const { data: planWeek } = await supabase
    .from('plan_weeks')
    .select('id')
    .eq('plan_id', planId)
    .eq('week_number', currentWeek)
    .single();

  if (!planWeek) return null;

  const { data } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (
        *,
        catalog:exercise_catalog (*)
      )
    `)
    .eq('plan_week_id', planWeek.id)
    .eq('day_of_week', dayOfWeek)
    .single();

  return data ?? null;
}
```

- [ ] **Step 4: Barrel export**

`packages/api-client/src/index.ts`:
```typescript
export { createSupabaseClient, signUpWithEmail, signInWithEmail, signOut, getCurrentUser } from './auth';
export { saveUserProfile, generatePlan, getActivePlan, getTodayWorkout } from './plans';
```

- [ ] **Step 5: Install deps y commit**

```bash
npm install
git add packages/api-client
git commit -m "feat: add api-client package"
```

---

## Task 8: Next.js app — scaffold + auth

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/signup/page.tsx`
- Create: `apps/web/lib/supabase.ts`

- [ ] **Step 1: Crear app web**

```bash
mkdir -p apps/web/app/\(auth\)/login
mkdir -p apps/web/app/\(auth\)/signup
mkdir -p apps/web/app/\(app\)/home
mkdir -p apps/web/app/onboarding
mkdir -p apps/web/lib
```

`apps/web/package.json`:
```json
{
  "name": "@forja/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@forja/types": "*",
    "@forja/ui": "*",
    "@forja/api-client": "*",
    "next": "14.2.3",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/node": "^20",
    "typescript": "^5.4.5",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^1.6.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

- [ ] **Step 2: next.config.ts**

`apps/web/next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@forja/ui', '@forja/api-client', '@forja/types', '@forja/ai'],
};

export default config;
```

- [ ] **Step 3: tailwind.config.ts**

`apps/web/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#10b981', // emerald-500
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: tsconfig.json**

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [".", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Supabase client para web**

`apps/web/lib/supabase.ts`:
```typescript
import { createSupabaseClient } from '@forja/api-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 6: Root layout**

`apps/web/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forja — Mejora continua',
  description: 'Tu app de fitness con IA personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-black text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
```

`apps/web/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Root page (redirect)**

`apps/web/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');
  redirect('/login');
}
```

- [ ] **Step 8: Login page**

`apps/web/app/(auth)/login/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signInWithEmail } from '@forja/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signInWithEmail(supabase, email, password);
    if (error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }
    router.push('/home');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-emerald-400">⚒️</h1>
          <p className="text-2xl font-bold mt-2">Forja</p>
          <p className="text-zinc-400 mt-1">Tu mejora continua comienza aquí</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm">
          ¿Sin cuenta?{' '}
          <Link href="/signup" className="text-emerald-400 hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Signup page**

`apps/web/app/(auth)/signup/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signUpWithEmail } from '@forja/api-client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signUpWithEmail(supabase, email, password, name);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/onboarding');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-emerald-400">⚒️</h1>
          <p className="text-2xl font-bold mt-2">Forja</p>
          <p className="text-zinc-400 mt-1">Crea tu cuenta gratis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta — Es gratis'}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Variables de entorno**

Crear `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

(Reemplazar con valores reales del dashboard de Supabase)

- [ ] **Step 11: Instalar deps y verificar**

```bash
npm install
cd apps/web && npm run type-check
```

Expected: 0 errores de TypeScript.

- [ ] **Step 12: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold next.js app with auth pages"
```

---

## Task 9: Onboarding flow (web)

**Files:**
- Create: `apps/web/app/onboarding/page.tsx`

- [ ] **Step 1: Escribir wizard de onboarding**

`apps/web/app/onboarding/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveUserProfile, generatePlan } from '@forja/api-client';
import type { OnboardingData, FitnessGoal, FitnessLevel, Equipment } from '@forja/types';

const TOTAL_STEPS = 5;

const GOALS: { value: FitnessGoal; label: string; emoji: string }[] = [
  { value: 'perder_peso', label: 'Perder peso', emoji: '🔥' },
  { value: 'ganar_musculo', label: 'Ganar músculo', emoji: '💪' },
  { value: 'resistencia', label: 'Resistencia', emoji: '🏃' },
  { value: 'movilidad', label: 'Movilidad', emoji: '🧘' },
  { value: 'fitness_general', label: 'Fitness general', emoji: '⚡' },
];

const LEVELS: { value: FitnessLevel; label: string; description: string }[] = [
  { value: 'principiante', label: 'Principiante', description: 'Menos de 6 meses entrenando' },
  { value: 'intermedio', label: 'Intermedio', description: '6 meses a 2 años' },
  { value: 'avanzado', label: 'Avanzado', description: 'Más de 2 años' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: 'ninguno', label: 'Sin equipo', emoji: '🏠' },
  { value: 'mancuernas', label: 'Mancuernas', emoji: '🏋️' },
  { value: 'barra', label: 'Barra', emoji: '🔩' },
  { value: 'anillas', label: 'Anillas', emoji: '⭕' },
  { value: 'bandas', label: 'Bandas', emoji: '🔗' },
  { value: 'gym_completo', label: 'Gimnasio completo', emoji: '🏟️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [data, setData] = useState<Partial<OnboardingData>>({
    available_equipment: [],
    injuries: [],
  });

  function toggleEquipment(eq: Equipment) {
    setData((prev) => {
      const current = prev.available_equipment ?? [];
      if (current.includes(eq)) {
        return { ...prev, available_equipment: current.filter((e) => e !== eq) };
      }
      return { ...prev, available_equipment: [...current, eq] };
    });
  }

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const profile = data as OnboardingData;
      await saveUserProfile(supabase, user.id, profile);
      await generatePlan(supabase, profile);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar tu plan');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-zinc-800'}`}
          />
        ))}
      </div>

      <div className="flex-1">
        {/* Step 1: Objetivo */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Cuál es tu objetivo?</h2>
              <p className="text-zinc-400 mt-1">La IA diseñará tu plan según esto</p>
            </div>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setData((p) => ({ ...p, goal: g.value }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                    data.goal === g.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="font-semibold">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Nivel */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Cuál es tu nivel?</h2>
              <p className="text-zinc-400 mt-1">Sé honesto — la IA se adapta</p>
            </div>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setData((p) => ({ ...p, fitness_level: l.value }))}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                    data.fitness_level === l.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <p className="font-semibold">{l.label}</p>
                  <p className="text-sm text-zinc-400">{l.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Equipo */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Qué equipo tienes?</h2>
              <p className="text-zinc-400 mt-1">Selecciona todo lo disponible</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq.value}
                  onClick={() => toggleEquipment(eq.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${
                    data.available_equipment?.includes(eq.value)
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-2xl">{eq.emoji}</span>
                  <span className="text-sm font-medium text-center">{eq.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Disponibilidad */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Cuánto tiempo tienes?</h2>
              <p className="text-zinc-400 mt-1">Seremos realistas con tu agenda</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm text-zinc-400 font-medium">
                  Días por semana: <span className="text-white font-bold">{data.days_per_week ?? 3}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={data.days_per_week ?? 3}
                  onChange={(e) => setData((p) => ({ ...p, days_per_week: Number(e.target.value) }))}
                  className="w-full mt-2 accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>1 día</span><span>6 días</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 font-medium">
                  Minutos por sesión: <span className="text-white font-bold">{data.session_duration_min ?? 45}</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={5}
                  value={data.session_duration_min ?? 45}
                  onChange={(e) => setData((p) => ({ ...p, session_duration_min: Number(e.target.value) }))}
                  className="w-full mt-2 accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>20 min</span><span>90 min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Restricciones */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Alguna restricción?</h2>
              <p className="text-zinc-400 mt-1">Lesiones, zonas a evitar (opcional)</p>
            </div>
            <textarea
              value={data.injuries?.join(', ') ?? ''}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  injuries: e.target.value
                    ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    : [],
                }))
              }
              placeholder="Ej: rodilla derecha, lumbar..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-emerald-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {loading && (
              <div className="text-center space-y-2">
                <div className="text-4xl animate-spin inline-block">⚡</div>
                <p className="text-zinc-400">Kai está creando tu plan personalizado...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 border border-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl hover:border-zinc-500 transition-colors"
          >
            Atrás
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 1 && !data.goal) ||
              (step === 2 && !data.fitness_level) ||
              (step === 4 && (!data.days_per_week || !data.session_duration_min))
            }
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Generando plan...' : '¡Crear mi plan con IA!'}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/onboarding
git commit -m "feat: add onboarding wizard (web)"
```

---

## Task 10: Home screen (web)

**Files:**
- Create: `apps/web/app/(app)/layout.tsx`
- Create: `apps/web/app/(app)/home/page.tsx`

- [ ] **Step 1: Layout protegido**

`apps/web/app/(app)/layout.tsx`:
```tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <>{children}</>;
}
```

- [ ] **Step 2: Home page**

`apps/web/app/(app)/home/page.tsx`:
```tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';
import { createSupabaseClient } from '@forja/api-client';
import Link from 'next/link';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  const plan = await getActivePlan(supabase as any, user.id);
  const todayIndex = new Date().getDay();
  const todayName = DAYS_ES[todayIndex];

  const todayWorkout = plan
    ? await getTodayWorkout(supabase as any, plan.id, todayName)
    : null;

  return (
    <div className="min-h-screen bg-black px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-zinc-400 text-sm">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold">{userData?.name ?? 'Atleta'} 👋</h1>
        </div>
        <span className="text-3xl font-bold text-emerald-400">⚒️</span>
      </div>

      {/* Plan status */}
      {plan && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Plan activo</p>
          <p className="font-semibold">{plan.name}</p>
        </div>
      )}

      {/* Today's workout */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 capitalize">
          Entrenamiento de hoy — {todayName}
        </h2>

        {todayWorkout ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{todayWorkout.name}</h3>
                <p className="text-zinc-400 text-sm capitalize">
                  {todayWorkout.type} · {todayWorkout.estimated_duration_min} min · {todayWorkout.difficulty}
                </p>
              </div>
              <span className="text-2xl">
                {todayWorkout.type === 'calistenia' ? '🤸' :
                 todayWorkout.type === 'gym' ? '🏋️' :
                 todayWorkout.type === 'cardio' ? '🏃' : '⚡'}
              </span>
            </div>

            <div className="space-y-2">
              {todayWorkout.exercises?.slice(0, 4).map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400 font-bold w-5">{i + 1}</span>
                  <span className="flex-1">{ex.catalog?.name}</span>
                  <span className="text-zinc-400">{ex.sets}×{ex.reps}</span>
                </div>
              ))}
              {(todayWorkout.exercises?.length ?? 0) > 4 && (
                <p className="text-zinc-500 text-sm pl-8">
                  +{(todayWorkout.exercises?.length ?? 0) - 4} ejercicios más
                </p>
              )}
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors">
              Iniciar entrenamiento →
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            {plan ? (
              <>
                <p className="text-4xl mb-3">🧘</p>
                <p className="font-semibold">Día de descanso</p>
                <p className="text-zinc-400 text-sm mt-1">Tu cuerpo también mejora descansando</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">🤖</p>
                <p className="font-semibold">Sin plan activo</p>
                <Link
                  href="/onboarding"
                  className="inline-block mt-3 bg-emerald-500 text-white font-semibold px-6 py-2 rounded-xl text-sm"
                >
                  Crear mi plan con IA
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/coach"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-emerald-500 transition-colors"
        >
          <p className="text-2xl mb-2">💬</p>
          <p className="font-semibold text-sm">Coach Kai</p>
          <p className="text-zinc-400 text-xs">Pregúntame lo que sea</p>
        </Link>
        <Link
          href="/progress"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-emerald-500 transition-colors"
        >
          <p className="text-2xl mb-2">📈</p>
          <p className="font-semibold text-sm">Mi progreso</p>
          <p className="text-zinc-400 text-xs">Ver estadísticas</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Instalar `@supabase/ssr`**

```bash
cd apps/web && npm install @supabase/ssr
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(app\)
git commit -m "feat: add protected home screen with today's workout"
```

---

## Task 11: Expo app — scaffold + auth + onboarding

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/app/(auth)/signup.tsx`
- Create: `apps/mobile/app/onboarding/index.tsx`
- Create: `apps/mobile/app/(app)/_layout.tsx`
- Create: `apps/mobile/app/(app)/home/index.tsx`
- Create: `apps/mobile/lib/supabase.ts`

- [ ] **Step 1: Setup**

```bash
mkdir -p apps/mobile/app/\(auth\)
mkdir -p apps/mobile/app/onboarding
mkdir -p apps/mobile/app/\(app\)/home
mkdir -p apps/mobile/lib
```

`apps/mobile/package.json`:
```json
{
  "name": "@forja/mobile",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@forja/types": "*",
    "@forja/ui": "*",
    "@forja/api-client": "*",
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "nativewind": "^4.0.1",
    "@supabase/supabase-js": "^2.43.0",
    "react-native-url-polyfill": "^2.0.0",
    "@react-native-async-storage/async-storage": "1.23.1"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.4.5",
    "tailwindcss": "^3.4.0"
  }
}
```

- [ ] **Step 2: app.json**

`apps/mobile/app.json`:
```json
{
  "expo": {
    "name": "Forja",
    "slug": "forja",
    "scheme": "forja",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#000000",
    "splash": {
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.forja.app"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#000000"
      },
      "package": "com.forja.app"
    },
    "plugins": ["expo-router"]
  }
}
```

- [ ] **Step 3: tsconfig.json**

`apps/mobile/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "jsx": "react-native",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["."]
}
```

- [ ] **Step 4: Supabase client**

`apps/mobile/lib/supabase.ts`:
```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 5: Root layout**

`apps/mobile/app/_layout.tsx`:
```tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && (inAuth || segments.length === 0)) {
      router.replace('/(app)/home');
    }
  }, [session, segments]);

  return <Slot />;
}
```

- [ ] **Step 6: Login screen**

`apps/mobile/app/(auth)/login.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signInWithEmail } from '@forja/api-client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error } = await signInWithEmail(supabase, email, password);
    if (error) {
      setError('Email o contraseña incorrectos');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1 justify-center px-6 gap-8">
        <View className="items-center">
          <Text className="text-5xl font-bold text-emerald-400">⚒️</Text>
          <Text className="text-2xl font-bold text-white mt-2">Forja</Text>
          <Text className="text-zinc-400 mt-1">Tu mejora continua comienza aquí</Text>
        </View>

        <View className="gap-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#71717a"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#71717a"
            secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base"
          />
          {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-emerald-500 rounded-2xl py-4 items-center opacity-100 disabled:opacity-50"
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-zinc-400">
          ¿Sin cuenta?{' '}
          <Link href="/(auth)/signup" className="text-emerald-400 font-semibold">
            Regístrate gratis
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 7: Signup screen**

`apps/mobile/app/(auth)/signup.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signUpWithEmail } from '@forja/api-client';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signUpWithEmail(supabase, email, password, name);
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 gap-8 py-12">
        <View className="items-center">
          <Text className="text-5xl font-bold text-emerald-400">⚒️</Text>
          <Text className="text-2xl font-bold text-white mt-2">Forja</Text>
          <Text className="text-zinc-400 mt-1">Crea tu cuenta gratis</Text>
        </View>
        <View className="gap-4">
          <TextInput value={name} onChangeText={setName} placeholder="Tu nombre"
            placeholderTextColor="#71717a"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base" />
          <TextInput value={email} onChangeText={setEmail} placeholder="Email"
            placeholderTextColor="#71717a" keyboardType="email-address" autoCapitalize="none"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Contraseña (min 8 caracteres)"
            placeholderTextColor="#71717a" secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base" />
          {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
          <TouchableOpacity onPress={handleSignup} disabled={loading}
            className="bg-emerald-500 rounded-2xl py-4 items-center">
            <Text className="text-white font-bold text-base">
              {loading ? 'Creando cuenta...' : 'Crear cuenta — Es gratis'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-center text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/(auth)/login" className="text-emerald-400 font-semibold">Inicia sesión</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 8: Onboarding screen (mobile)**

`apps/mobile/app/onboarding/index.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { saveUserProfile, generatePlan } from '@forja/api-client';
import type { OnboardingData, FitnessGoal, FitnessLevel, Equipment } from '@forja/types';

const GOALS: { value: FitnessGoal; label: string; emoji: string }[] = [
  { value: 'perder_peso', label: 'Perder peso', emoji: '🔥' },
  { value: 'ganar_musculo', label: 'Ganar músculo', emoji: '💪' },
  { value: 'resistencia', label: 'Resistencia', emoji: '🏃' },
  { value: 'movilidad', label: 'Movilidad', emoji: '🧘' },
  { value: 'fitness_general', label: 'Fitness general', emoji: '⚡' },
];

const LEVELS: { value: FitnessLevel; label: string; description: string }[] = [
  { value: 'principiante', label: 'Principiante', description: 'Menos de 6 meses entrenando' },
  { value: 'intermedio', label: 'Intermedio', description: '6 meses a 2 años' },
  { value: 'avanzado', label: 'Avanzado', description: 'Más de 2 años' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: 'ninguno', label: 'Sin equipo', emoji: '🏠' },
  { value: 'mancuernas', label: 'Mancuernas', emoji: '🏋️' },
  { value: 'barra', label: 'Barra', emoji: '🔩' },
  { value: 'anillas', label: 'Anillas', emoji: '⭕' },
  { value: 'bandas', label: 'Bandas', emoji: '🔗' },
  { value: 'gym_completo', label: 'Gimnasio completo', emoji: '🏟️' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Partial<OnboardingData>>({
    available_equipment: [],
    injuries: [],
    days_per_week: 3,
    session_duration_min: 45,
  });

  function toggleEquipment(eq: Equipment) {
    setData((prev) => {
      const current = prev.available_equipment ?? [];
      if (current.includes(eq)) return { ...prev, available_equipment: current.filter((e) => e !== eq) };
      return { ...prev, available_equipment: [...current, eq] };
    });
  }

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const profile = data as OnboardingData;
      await saveUserProfile(supabase, user.id, profile);
      await generatePlan(supabase, profile);
      router.replace('/(app)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar tu plan');
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      {/* Progress */}
      <View className="flex-row gap-1 px-6 pt-14 pb-6">
        {[1,2,3,4,5].map((i) => (
          <View key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        ))}
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-6">
        {step === 1 && (
          <View className="gap-4">
            <Text className="text-2xl font-bold text-white">¿Cuál es tu objetivo?</Text>
            <Text className="text-zinc-400">La IA diseñará tu plan según esto</Text>
            {GOALS.map((g) => (
              <TouchableOpacity key={g.value} onPress={() => setData((p) => ({ ...p, goal: g.value }))}
                className={`flex-row items-center gap-4 p-4 rounded-2xl border ${data.goal === g.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                <Text className="text-2xl">{g.emoji}</Text>
                <Text className="text-white font-semibold text-base">{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View className="gap-4">
            <Text className="text-2xl font-bold text-white">¿Cuál es tu nivel?</Text>
            {LEVELS.map((l) => (
              <TouchableOpacity key={l.value} onPress={() => setData((p) => ({ ...p, fitness_level: l.value }))}
                className={`p-4 rounded-2xl border ${data.fitness_level === l.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                <Text className="text-white font-semibold">{l.label}</Text>
                <Text className="text-zinc-400 text-sm">{l.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <Text className="text-2xl font-bold text-white">¿Qué equipo tienes?</Text>
            <View className="flex-row flex-wrap gap-3">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <TouchableOpacity key={eq.value} onPress={() => toggleEquipment(eq.value)}
                  className={`items-center gap-2 p-4 rounded-2xl border w-[47%] ${data.available_equipment?.includes(eq.value) ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                  <Text className="text-2xl">{eq.emoji}</Text>
                  <Text className="text-white text-sm font-medium text-center">{eq.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View className="gap-6">
            <Text className="text-2xl font-bold text-white">¿Cuánto tiempo tienes?</Text>
            <View className="gap-2">
              <Text className="text-zinc-400">Días por semana: <Text className="text-white font-bold">{data.days_per_week}</Text></Text>
              {[1,2,3,4,5,6].map((d) => (
                <TouchableOpacity key={d} onPress={() => setData((p) => ({ ...p, days_per_week: d }))}
                  className={`py-3 rounded-xl border ${data.days_per_week === d ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800'}`}>
                  <Text className="text-center text-white">{d} {d === 1 ? 'día' : 'días'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="gap-2">
              <Text className="text-zinc-400">Minutos por sesión: <Text className="text-white font-bold">{data.session_duration_min}</Text></Text>
              {[20, 30, 45, 60, 75, 90].map((m) => (
                <TouchableOpacity key={m} onPress={() => setData((p) => ({ ...p, session_duration_min: m }))}
                  className={`py-3 rounded-xl border ${data.session_duration_min === m ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800'}`}>
                  <Text className="text-center text-white">{m} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 5 && (
          <View className="gap-4">
            <Text className="text-2xl font-bold text-white">¿Alguna restricción?</Text>
            <Text className="text-zinc-400">Lesiones, zonas a evitar (opcional)</Text>
            <TextInput
              value={data.injuries?.join(', ') ?? ''}
              onChangeText={(t) => setData((p) => ({ ...p, injuries: t ? t.split(',').map(s => s.trim()).filter(Boolean) : [] }))}
              placeholder="Ej: rodilla derecha, lumbar..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
            />
            {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
            {loading && (
              <View className="items-center gap-3">
                <ActivityIndicator color="#10b981" size="large" />
                <Text className="text-zinc-400">Kai está creando tu plan...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View className="flex-row gap-3 px-6 pb-10 pt-4">
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)}
            className="flex-1 border border-zinc-700 rounded-2xl py-4 items-center">
            <Text className="text-zinc-300 font-semibold">Atrás</Text>
          </TouchableOpacity>
        )}
        {step < 5 ? (
          <TouchableOpacity
            onPress={() => setStep(s => s + 1)}
            disabled={(step === 1 && !data.goal) || (step === 2 && !data.fitness_level)}
            className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center">
            <Text className="text-white font-bold">Continuar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleFinish} disabled={loading}
            className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center">
            <Text className="text-white font-bold">
              {loading ? 'Generando plan...' : '¡Crear mi plan con IA!'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 9: Protected layout for (app) group**

`apps/mobile/app/(app)/_layout.tsx`:
```tsx
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
  return (
    <View className="flex-1 bg-black">
      <Slot />
    </View>
  );
}
```

- [ ] **Step 10: Home screen (mobile)**

`apps/mobile/app/(app)/home/index.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';
import type { WorkoutPlan } from '@forja/types';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single();
      if (userData) setUserName(userData.name);

      const activePlan = await getActivePlan(supabase, user.id);
      setPlan(activePlan);

      if (activePlan) {
        const dayName = DAYS_ES[new Date().getDay()];
        const workout = await getTodayWorkout(supabase, activePlan.id, dayName);
        setTodayWorkout(workout);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  const todayName = DAYS_ES[new Date().getDay()];

  return (
    <ScrollView className="flex-1 bg-black" contentContainerClassName="px-6 py-14">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-8">
        <View>
          <Text className="text-zinc-400 text-sm">Bienvenido de vuelta</Text>
          <Text className="text-2xl font-bold text-white">{userName || 'Atleta'} 👋</Text>
        </View>
        <Text className="text-3xl font-bold text-emerald-400">⚒️</Text>
      </View>

      {/* Plan activo */}
      {plan && (
        <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
          <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Plan activo</Text>
          <Text className="text-white font-semibold">{plan.name}</Text>
        </View>
      )}

      {/* Workout de hoy */}
      <Text className="text-lg font-semibold text-white mb-3 capitalize">
        Entrenamiento de hoy — {todayName}
      </Text>

      {todayWorkout ? (
        <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 gap-4 mb-6">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{todayWorkout.name}</Text>
              <Text className="text-zinc-400 text-sm capitalize">
                {todayWorkout.type} · {todayWorkout.estimated_duration_min} min
              </Text>
            </View>
            <Text className="text-2xl">
              {todayWorkout.type === 'calistenia' ? '🤸' : todayWorkout.type === 'gym' ? '🏋️' : '⚡'}
            </Text>
          </View>
          {todayWorkout.exercises?.slice(0, 4).map((ex: any, i: number) => (
            <View key={ex.id} className="flex-row items-center gap-3">
              <Text className="text-emerald-400 font-bold w-5">{i + 1}</Text>
              <Text className="flex-1 text-white text-sm">{ex.catalog?.name}</Text>
              <Text className="text-zinc-400 text-sm">{ex.sets}×{ex.reps}</Text>
            </View>
          ))}
          <TouchableOpacity className="bg-emerald-500 rounded-2xl py-4 items-center">
            <Text className="text-white font-bold">Iniciar entrenamiento →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 items-center mb-6">
          <Text className="text-4xl mb-3">{plan ? '🧘' : '🤖'}</Text>
          <Text className="text-white font-semibold">{plan ? 'Día de descanso' : 'Sin plan activo'}</Text>
          {!plan && (
            <Link href="/onboarding" asChild>
              <TouchableOpacity className="mt-3 bg-emerald-500 px-6 py-2 rounded-xl">
                <Text className="text-white font-semibold text-sm">Crear mi plan con IA</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      )}

      {/* Quick actions */}
      <View className="flex-row gap-3">
        <Link href="/(app)/coach" asChild>
          <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <Text className="text-2xl mb-2">💬</Text>
            <Text className="text-white font-semibold text-sm">Coach Kai</Text>
            <Text className="text-zinc-400 text-xs">Pregúntame lo que sea</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(app)/progress" asChild>
          <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <Text className="text-2xl mb-2">📈</Text>
            <Text className="text-white font-semibold text-sm">Mi progreso</Text>
            <Text className="text-zinc-400 text-xs">Ver estadísticas</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 10: Variables de entorno mobile**

Crear `apps/mobile/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

- [ ] **Step 11: Commit**

```bash
git add apps/mobile
git commit -m "feat: scaffold expo app with auth, onboarding, and home screen"
```

---

## Task 12: Verificación end-to-end

- [ ] **Step 1: Levantar web**

```bash
cd apps/web && npm run dev
```

Expected: `http://localhost:3000` abre. Redirige a `/login`.

- [ ] **Step 2: Flujo completo web**

1. Ir a `/signup` → crear cuenta con email real
2. Verificar email en Supabase Dashboard → Auth → Users (confirmar usuario creado)
3. Hacer login → redirige a `/onboarding`
4. Completar los 5 pasos → click "Crear mi plan con IA"
5. Esperar ~10-15 segundos mientras Claude genera el plan
6. Verificar redirect a `/home` con el plan del día
7. Verificar en Supabase Dashboard → Table Editor → `workout_plans` que existe el plan

- [ ] **Step 3: Levantar mobile**

```bash
cd apps/mobile && npx expo start
```

Expected: QR para escanear con Expo Go en el teléfono.

- [ ] **Step 4: Flujo completo mobile**

1. Abrir en Expo Go → pantalla de login
2. Login con la misma cuenta creada en web
3. Ver home screen con el plan generado (mismo plan que en web)

- [ ] **Step 5: Verificar Edge Function logs**

```bash
supabase functions logs generate-plan --tail
```

Expected: ver log de la llamada exitosa a Claude y la inserción en DB.

- [ ] **Step 6: Test de error — plan sin equipo**

En onboarding, no seleccionar ningún equipo + nivel principiante → verificar que Claude genera un plan de calistenia/home apropiado.

---

## Próximos pasos — Fases siguientes

- **Plan 2:** Workout Player interactivo + catálogo completo de ejercicios con media
- **Plan 3:** Coach IA (chat) + adaptación semanal del plan + pantalla de progreso
- **Plan 4:** Nutrición (Open Food Facts) + Wearables (HealthKit/Google Health) + Stripe
