import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callClaude } from '../_shared/claude.ts';

function buildPrompt(profile: Record<string, unknown>): string {
  const equipment = (profile.available_equipment as string[]).join(', ') || 'ninguno';
  const injuries = (profile.injuries as string[]).join(', ') || 'ninguna';

  return `Eres un coach de fitness experto. Genera un plan de entrenamiento personalizado en JSON.

PERFIL DEL USUARIO:
- Objetivo: ${profile.goal}
- Nivel: ${profile.fitness_level}
- Equipo disponible: ${equipment}
- Días por semana: ${profile.days_per_week}
- Duración por sesión: ${profile.session_duration_min} minutos
- Lesiones/restricciones: ${injuries}

Ejercicios disponibles (usa solo estos slugs):
flexion-brazos, flexion-diamante, flexion-arquero, sentadilla, pistol-squat,
dominada, dominada-lastrada, press-banca, press-inclinado, apertura-mancuernas,
fondos-paralelas, hollow-body-hold, l-sit, plancha, muscle-up

Genera un plan de 4 semanas progresivo. Responde SOLO con JSON válido:
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

    const rawJson = await callClaude(
      'Eres un coach de fitness experto. Responde solo con JSON válido, sin texto adicional.',
      buildPrompt(profile),
      4096
    );

    // Limpiar el JSON (Claude a veces envuelve en ```json```)
    const cleaned = rawJson.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const planData = JSON.parse(cleaned);

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
          const { data: catalog } = await supabase
            .from('exercise_catalog')
            .select('id')
            .eq('slug', ex.catalog_slug)
            .single();

          if (!catalog) continue;

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
    console.error('generate-plan error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
