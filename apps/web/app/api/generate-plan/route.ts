import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser, saveUserProfile } from '@forja/api-client';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { profile } = await req.json();
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? '';
    const name = user?.firstName ?? '';

    // Ensure user exists in DB
    await ensureUser(userId, email, name);
    await saveUserProfile(userId, profile);

    // Build prompt
    const prompt = `Eres un coach de fitness experto. Genera un plan de entrenamiento personalizado en JSON para:
- Objetivo: ${profile.goal}
- Nivel: ${profile.fitnessLevel}
- Equipo disponible: ${(profile.equipment ?? []).join(', ') || 'ninguno'}
- Días por semana: ${profile.daysPerWeek}
- Minutos por sesión: ${profile.sessionDurationMin}
- Restricciones/lesiones: ${(profile.injuries ?? []).join(', ') || 'ninguna'}

Responde SOLO con este JSON (sin markdown, sin explicaciones):
{
  "plan_name": "nombre motivador del plan",
  "weeks_total": 4,
  "weeks": [
    {
      "week_number": 1,
      "focus": "descripción del foco de la semana",
      "workouts": [
        {
          "day_of_week": "lunes",
          "name": "nombre del workout",
          "type": "calistenia|gym|home|cardio|yoga|movilidad",
          "estimated_duration_min": 45,
          "difficulty": "principiante|intermedio|avanzado",
          "exercises": [
            {
              "exercise_slug": "flexion-brazos",
              "sets": 3,
              "reps": "10",
              "rest_seconds": 60
            }
          ]
        }
      ]
    }
  ]
}

Slugs disponibles: flexion-brazos, flexion-diamante, flexion-arquero, sentadilla, pistol-squat, dominada, dominada-lastrada, press-banca, press-inclinado, apertura-mancuernas, fondos-paralelas, hollow-body-hold, l-sit, plancha, muscle-up

Genera exactamente ${profile.daysPerWeek} workouts por semana durante 4 semanas. Usa solo los slugs de la lista.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as any).text.trim();
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const planData = JSON.parse(cleaned);

    // Save plan to DB
    const sql = getDb();
    const userRows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
    const dbUserId = userRows[0].id;

    // Deactivate old plans
    await sql`UPDATE workout_plans SET is_active = false WHERE user_id = ${dbUserId}`;

    const planRows = await sql`
      INSERT INTO workout_plans (user_id, name, weeks_total, generated_by_ai, is_active)
      VALUES (${dbUserId}, ${planData.plan_name}, ${planData.weeks_total}, true, true)
      RETURNING id
    `;
    const planId = planRows[0].id;

    for (const week of planData.weeks) {
      const weekRows = await sql`
        INSERT INTO plan_weeks (plan_id, week_number, focus)
        VALUES (${planId}, ${week.week_number}, ${week.focus})
        RETURNING id
      `;
      const weekId = weekRows[0].id;

      for (const workout of week.workouts) {
        const workoutRows = await sql`
          INSERT INTO workouts (plan_week_id, day_of_week, name, type, estimated_duration_min, difficulty)
          VALUES (${weekId}, ${workout.day_of_week}, ${workout.name}, ${workout.type},
                  ${workout.estimated_duration_min}, ${workout.difficulty})
          RETURNING id
        `;
        const workoutId = workoutRows[0].id;

        for (let i = 0; i < workout.exercises.length; i++) {
          const ex = workout.exercises[i];
          const catalogRows = await sql`
            SELECT id FROM exercise_catalog WHERE slug = ${ex.exercise_slug}
          `;
          if (catalogRows.length === 0) continue;

          await sql`
            INSERT INTO exercises (workout_id, catalog_id, order_index, sets, reps, rest_seconds)
            VALUES (${workoutId}, ${catalogRows[0].id}, ${i}, ${ex.sets}, ${ex.reps}, ${ex.rest_seconds})
          `;
        }
      }
    }

    return NextResponse.json({ plan_id: planId, plan_name: planData.plan_name });
  } catch (err: any) {
    console.error('generate-plan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
