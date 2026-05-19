import { auth } from '@clerk/nextjs/server';
import { getDb } from '@forja/api-client';
import { redirect } from 'next/navigation';
import { WorkoutPlayer } from './WorkoutPlayer';

interface ExerciseRow {
  id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
  catalog: {
    id: string;
    name: string;
    slug: string;
    type: string;
    difficulty: string;
    cues_correct?: string[] | null;
    cues_common_mistakes?: string[] | null;
    muscles_primary?: string[] | null;
  };
}

interface WorkoutData {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  estimated_duration_min: number;
  day_of_week: string;
  exercises: ExerciseRow[];
}

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const { id } = await params;
  const sql = getDb();

  // Verify ownership via plan_weeks → workout_plans → users
  const rows = await sql`
    SELECT w.id, w.name, w.type, w.difficulty, w.estimated_duration_min, w.day_of_week,
      COALESCE(json_agg(
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
            'difficulty', ec.difficulty,
            'cues_correct', ec.cues_correct,
            'cues_common_mistakes', ec.cues_common_mistakes,
            'muscles_primary', ec.muscles_primary
          )
        ) ORDER BY e.order_index
      ) FILTER (WHERE e.id IS NOT NULL), '[]'::json) AS exercises
    FROM workouts w
    JOIN plan_weeks pw ON pw.id = w.plan_week_id
    JOIN workout_plans p ON p.id = pw.plan_id
    JOIN users u ON u.id = p.user_id
    LEFT JOIN exercises e ON e.workout_id = w.id
    LEFT JOIN exercise_catalog ec ON ec.id = e.catalog_id
    WHERE w.id = ${id} AND u.clerk_id = ${userId}
    GROUP BY w.id
    LIMIT 1
  `;

  const workout = rows[0] as unknown as WorkoutData | undefined;

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <h1 className="font-display text-2xl mb-2" style={{ fontWeight: 700 }}>Entrenamiento no encontrado</h1>
          <p style={{ color: 'var(--muted)' }}>Vuelve al inicio y elige otro día.</p>
          <a href="/home" className="inline-block mt-4 px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--accent)', color: '#000' }}>
            ← Volver
          </a>
        </div>
      </div>
    );
  }

  return <WorkoutPlayer workout={workout} />;
}
