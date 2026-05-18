import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser, saveUserProfile } from '@forja/api-client';
import { buildGeneratePlanPrompt } from '@forja/ai';
import type { PulsoOnboardingData } from '@forja/types';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL_TIMEOUT_MS = 55_000;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { profile }: { profile: PulsoOnboardingData } = await req.json();
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? '';
    const name = user?.firstName ?? '';

    // Ensure user exists in DB and resolve DB user ID before AI call
    const dbUserId = await ensureUser(userId, email, name);
    const sql = getDb();

    // Save core fitness profile (now includes weight/height/age/gender)
    await saveUserProfile(userId, profile);

    // Save diet profile (PULSO extended fields)
    if (profile.dietType || profile.budget || profile.cookingFreq || profile.allergies) {
      await sql`
        INSERT INTO diet_profiles (user_id, diet_type, allergies, budget, cooking_freq, training_location, main_challenge)
        VALUES (
          ${dbUserId},
          ${profile.dietType ?? 'omnivoro'},
          ${sql.array(profile.allergies ?? [])},
          ${profile.budget ?? 'medio'},
          ${profile.cookingFreq ?? 'aveces'},
          ${profile.trainingLocation ?? null},
          ${profile.mainChallenge ?? null}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          diet_type = EXCLUDED.diet_type,
          allergies = EXCLUDED.allergies,
          budget = EXCLUDED.budget,
          cooking_freq = EXCLUDED.cooking_freq,
          training_location = EXCLUDED.training_location,
          main_challenge = EXCLUDED.main_challenge,
          updated_at = now()
      `;
    }

    // Build prompt using PULSO context
    const prompt = buildGeneratePlanPrompt(profile);

    // AI call with timeout — keeps the DB out of long-held connections
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    let message;
    try {
      message = await anthropic.messages.create(
        {
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        },
        { signal: controller.signal },
      );
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        return NextResponse.json(
          { error: 'La generación del plan tardó demasiado. Intenta de nuevo.' },
          { status: 504 },
        );
      }
      throw e;
    }
    clearTimeout(timer);

    const first = message.content[0];
    if (!first || first.type !== 'text') {
      return NextResponse.json({ error: 'No se pudo generar el plan. Intenta de nuevo.' }, { status: 500 });
    }
    const raw = first.text.trim();
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const planData = JSON.parse(cleaned);

    const weeks: any[] = planData.weeks ?? [];
    const weeksTotal = weeks.length || 4;

    // Atomic plan persistence: deactivation + plan/weeks/workouts/exercises in one transaction.
    // If any insert fails, prior deactivation rolls back so user is never left without a plan.
    const planId: string = await sql.begin(async (tx: any) => {
      await tx`UPDATE workout_plans SET is_active = false WHERE user_id = ${dbUserId}`;

      const planRows = await tx`
        INSERT INTO workout_plans (user_id, name, weeks_total, generated_by_ai, is_active)
        VALUES (${dbUserId}, ${planData.plan_name}, ${weeksTotal}, true, true)
        RETURNING id
      `;
      const newPlanId = planRows[0].id;

      for (const week of weeks) {
        const weekRows = await tx`
          INSERT INTO plan_weeks (plan_id, week_number, focus)
          VALUES (${newPlanId}, ${week.week_number}, ${week.focus})
          RETURNING id
        `;
        const weekId = weekRows[0].id;

        for (const workout of week.workouts) {
          const workoutRows = await tx`
            INSERT INTO workouts (plan_week_id, day_of_week, name, type, estimated_duration_min, difficulty)
            VALUES (${weekId}, ${workout.day_of_week}, ${workout.name}, ${workout.type},
                    ${workout.estimated_duration_min}, ${workout.difficulty})
            RETURNING id
          `;
          const workoutId = workoutRows[0].id;

          for (let i = 0; i < workout.exercises.length; i++) {
            const ex = workout.exercises[i];
            const catalogRows = await tx`
              SELECT id FROM exercise_catalog WHERE slug = ${ex.catalog_slug}
            `;
            if (catalogRows.length === 0) continue;

            await tx`
              INSERT INTO exercises (workout_id, catalog_id, order_index, sets, reps, rest_seconds)
              VALUES (${workoutId}, ${catalogRows[0].id}, ${ex.order_index ?? i}, ${ex.sets}, ${ex.reps}, ${ex.rest_seconds ?? 60})
            `;
          }
        }
      }

      return newPlanId;
    });

    return NextResponse.json({ plan_id: planId, plan_name: planData.plan_name });
  } catch (err: any) {
    console.error('generate-plan error:', err);
    return NextResponse.json({ error: 'No se pudo generar el plan. Intenta de nuevo.' }, { status: 500 });
  }
}
