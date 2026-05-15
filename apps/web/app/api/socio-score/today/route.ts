import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

// Map energy_level int (1-3) to sleep points
// 3 = 'fuego' → 25, 2 = 'normal' → 18, 1 = 'cansado' → 10, no checkin → 15
function energyLevelToSleepPts(level: number | null): number {
  if (level === 3) return 25;
  if (level === 2) return 18;
  if (level === 1) return 10;
  return 15; // default when no check-in
}

function buildExplanation(components: {
  sleep: number;
  nutrition: number;
  movement: number;
  hydration: number;
}): string {
  if (components.movement < 10) return 'Aún no te has movido hoy.';
  if (components.hydration < 10) return 'Te falta agua hoy.';
  if (components.nutrition < 10) return 'Te falta comida hoy.';
  if (components.sleep < 10) return 'Hoy parece que dormiste poco.';
  return 'Vas bien — sigue así.';
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();

    let email = '';
    let name = '';
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress ?? '';
      name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    } catch (err) {
      console.error('socio-score/today: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const todayISO = new Date().toISOString().split('T')[0];

    // Run 4 independent queries in parallel with Promise.allSettled
    const [energyResult, nutritionResult, movementResult, waterResult] =
      await Promise.allSettled([
        // 1. Sleep: today's energy checkin
        sql`
          SELECT energy_level
          FROM energy_checkins
          WHERE user_id = ${dbUserId} AND date = ${todayISO}
          LIMIT 1
        `,
        // 2. Nutrition: kcal_consumed vs kcal_goal
        sql`
          SELECT kcal_consumed, kcal_goal
          FROM daily_nutrition
          WHERE user_id = ${dbUserId} AND date = ${todayISO}
          LIMIT 1
        `,
        // 3. Movement: count completed mini_missions with category='movement' today
        // TODO: replace with workout_sessions lookup once that table exists
        sql`
          SELECT COUNT(*) AS done_count
          FROM mini_missions
          WHERE user_id = ${dbUserId}
            AND date = ${todayISO}
            AND category = 'movement'
            AND done = true
        `,
        // 4. Hydration: water_glasses from daily_nutrition
        sql`
          SELECT water_glasses
          FROM daily_nutrition
          WHERE user_id = ${dbUserId} AND date = ${todayISO}
          LIMIT 1
        `,
      ]);

    // ── Sleep (25 pts) ──────────────────────────────────────────────
    let sleepPts = 15; // default
    if (energyResult.status === 'fulfilled' && energyResult.value.length > 0) {
      const level = Number(energyResult.value[0].energy_level);
      sleepPts = energyLevelToSleepPts(level);
    } else if (energyResult.status === 'rejected') {
      console.error('socio-score/today: energy_checkins query failed', energyResult.reason);
    }

    // ── Nutrition (25 pts) ──────────────────────────────────────────
    let nutritionPts = 0;
    if (nutritionResult.status === 'fulfilled' && nutritionResult.value.length > 0) {
      const row = nutritionResult.value[0];
      const consumed = Number(row.kcal_consumed ?? 0);
      const goal = Number(row.kcal_goal ?? 2000);
      if (goal > 0) {
        const ratio = consumed / goal;
        // 0.8–1.1 of goal = full points
        if (ratio >= 0.8 && ratio <= 1.1) {
          nutritionPts = 25;
        } else {
          nutritionPts = Math.min(25, Math.round(ratio * 25));
        }
      }
    } else if (nutritionResult.status === 'rejected') {
      console.error('socio-score/today: nutrition query failed', nutritionResult.reason);
    }

    // ── Movement (25 pts) ───────────────────────────────────────────
    // TODO: When workout_sessions table exists, check if user completed a workout today.
    // For now, award points if user has completed any movement mini_mission today.
    let movementPts = 0;
    if (movementResult.status === 'fulfilled' && movementResult.value.length > 0) {
      const doneCount = Number(movementResult.value[0].done_count ?? 0);
      if (doneCount > 0) movementPts = 25;
    } else if (movementResult.status === 'rejected') {
      console.error('socio-score/today: movement query failed', movementResult.reason);
    }

    // ── Hydration (25 pts) ──────────────────────────────────────────
    let hydrationPts = 0;
    if (waterResult.status === 'fulfilled' && waterResult.value.length > 0) {
      const glasses = Number(waterResult.value[0].water_glasses ?? 0);
      hydrationPts = Math.min(25, Math.round((glasses / 8) * 25));
    } else if (waterResult.status === 'rejected') {
      console.error('socio-score/today: water query failed', waterResult.reason);
    }

    const components = {
      sleep: sleepPts,
      nutrition: nutritionPts,
      movement: movementPts,
      hydration: hydrationPts,
    };
    const total = sleepPts + nutritionPts + movementPts + hydrationPts;
    const explanation = buildExplanation(components);

    // ── Upsert computed score for history ──────────────────────────
    try {
      await sql`
        INSERT INTO socio_scores (user_id, date, sleep_pts, nutrition_pts, movement_pts, hydration_pts)
        VALUES (${dbUserId}, ${todayISO}, ${sleepPts}, ${nutritionPts}, ${movementPts}, ${hydrationPts})
        ON CONFLICT (user_id, date) DO UPDATE SET
          sleep_pts = EXCLUDED.sleep_pts,
          nutrition_pts = EXCLUDED.nutrition_pts,
          movement_pts = EXCLUDED.movement_pts,
          hydration_pts = EXCLUDED.hydration_pts
      `;
    } catch (err) {
      console.error('socio-score/today: upsert socio_scores failed', err);
    }

    return NextResponse.json({ total, components, explanation });
  } catch (err) {
    console.error('socio-score/today:fatal', err);
    return NextResponse.json(
      { error: 'No se pudo calcular el score. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
