import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workoutId } = params;

  // Parse & validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { duration_min, kcal_estimate, total_sets, completed_sets } = body as Record<string, unknown>;

  if (
    typeof duration_min !== 'number' || duration_min < 0 ||
    typeof kcal_estimate !== 'number' || kcal_estimate < 0 ||
    typeof total_sets !== 'number' || total_sets < 0 ||
    typeof completed_sets !== 'number' || completed_sets < 0
  ) {
    return NextResponse.json(
      { error: 'Parámetros inválidos: duration_min, kcal_estimate, total_sets y completed_sets deben ser números >= 0' },
      { status: 400 },
    );
  }

  // Determine intensity from completion ratio
  let intensity: 'light' | 'medium' | 'intense' = 'light';
  if (total_sets > 0) {
    const ratio = completed_sets / total_sets;
    if (ratio >= 0.85) intensity = 'intense';
    else if (ratio >= 0.5) intensity = 'medium';
    else intensity = 'light';
  } else {
    // No sets tracked — default to medium if there was any duration
    intensity = duration_min > 0 ? 'medium' : 'light';
  }

  try {
    const sql = getDb();

    let email = '';
    let name = '';
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress ?? '';
      name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    } catch (err) {
      console.error('workouts/complete: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const todayISO = new Date().toISOString().split('T')[0];

    const rows = await sql`
      INSERT INTO workout_sessions
        (user_id, workout_id, date, duration_min, kcal_estimate, total_sets, completed_sets, intensity)
      VALUES
        (
          ${dbUserId},
          ${workoutId || null},
          ${todayISO},
          ${Math.round(duration_min)},
          ${Math.round(kcal_estimate)},
          ${Math.round(total_sets)},
          ${Math.round(completed_sets)},
          ${intensity}
        )
      RETURNING id, user_id, workout_id, date, completed_at, duration_min, kcal_estimate,
                total_sets, completed_sets, intensity, created_at
    `;

    if (!rows[0]) {
      console.error('workouts/complete: INSERT returned no row');
      return NextResponse.json({ error: 'No se pudo guardar la sesión. Intenta de nuevo.' }, { status: 500 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('workouts/complete:fatal', err);
    return NextResponse.json(
      { error: 'No se pudo guardar la sesión. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
