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
  fitnessLevel: FitnessLevel;
  equipment: Equipment[];
  daysPerWeek: number;
  sessionDurationMin: number;
  injuries: string[];
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: UserProfile['gender'];
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
