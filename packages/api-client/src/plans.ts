import type { WorkoutPlan, PulsoOnboardingData } from '@forja/types';
import { getDb } from './db';

export async function saveUserProfile(clerkId: string, data: PulsoOnboardingData): Promise<void> {
  const sql = getDb();
  const users = await sql`SELECT id FROM users WHERE clerk_id = ${clerkId}`;
  if (users.length === 0) throw new Error('User not found');
  const userId = users[0].id;

  await sql`
    INSERT INTO user_profiles (
      user_id, fitness_level, goal, available_equipment,
      days_per_week, session_duration_min, injuries,
      weight_kg, height_cm, age, gender
    ) VALUES (
      ${userId},
      ${data.fitnessLevel ?? (data as any).fitness_level},
      ${data.goal},
      ${sql.array(data.equipment ?? (data as any).available_equipment ?? [])},
      ${data.daysPerWeek ?? (data as any).days_per_week},
      ${data.sessionDurationMin ?? (data as any).session_duration_min},
      ${sql.array(data.injuries ?? [])},
      ${data.weightKg ?? null},
      ${data.heightCm ?? null},
      ${data.age ?? null},
      ${data.gender ?? null}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      fitness_level = EXCLUDED.fitness_level,
      goal = EXCLUDED.goal,
      available_equipment = EXCLUDED.available_equipment,
      days_per_week = EXCLUDED.days_per_week,
      session_duration_min = EXCLUDED.session_duration_min,
      injuries = EXCLUDED.injuries,
      weight_kg = EXCLUDED.weight_kg,
      height_cm = EXCLUDED.height_cm,
      age = EXCLUDED.age,
      gender = EXCLUDED.gender,
      updated_at = now()
  `;
}

export async function getActivePlan(clerkId: string): Promise<WorkoutPlan | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT wp.* FROM workout_plans wp
    JOIN users u ON u.id = wp.user_id
    WHERE u.clerk_id = ${clerkId} AND wp.is_active = true
    ORDER BY wp.created_at DESC
    LIMIT 1
  `;
  return (rows[0] as WorkoutPlan) ?? null;
}

export async function getTodayWorkout(planId: string, dayName: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT w.*,
      json_agg(
        json_build_object(
          'id', e.id,
          'sets', e.sets,
          'reps', e.reps,
          'rest_seconds', e.rest_seconds,
          'order_index', e.order_index,
          'catalog', json_build_object(
            'id', ec.id,
            'name', ec.name,
            'slug', ec.slug,
            'type', ec.type,
            'video_url', ec.video_url,
            'images', ec.images,
            'cues_correct', ec.cues_correct,
            'cues_common_mistakes', ec.cues_common_mistakes,
            'difficulty', ec.difficulty,
            'muscles_primary', ec.muscles_primary
          )
        ) ORDER BY e.order_index
      ) FILTER (WHERE e.id IS NOT NULL) AS exercises
    FROM workouts w
    JOIN plan_weeks pw ON pw.id = w.plan_week_id
    LEFT JOIN exercises e ON e.workout_id = w.id
    LEFT JOIN exercise_catalog ec ON ec.id = e.catalog_id
    WHERE pw.plan_id = ${planId}
      AND w.day_of_week = ${dayName}
      AND pw.week_number = 1
    GROUP BY w.id
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getUserProfile(clerkId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT up.* FROM user_profiles up
    JOIN users u ON u.id = up.user_id
    WHERE u.clerk_id = ${clerkId}
  `;
  return rows[0] ?? null;
}

export async function ensureUser(clerkId: string, email: string, name: string): Promise<string> {
  const sql = getDb();
  const existing = await sql`SELECT id FROM users WHERE clerk_id = ${clerkId}`;
  if (existing.length > 0) return existing[0].id;
  const created = await sql`
    INSERT INTO users (clerk_id, email, name)
    VALUES (${clerkId}, ${email}, ${name})
    RETURNING id
  `;
  return created[0].id;
}
