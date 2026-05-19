import type { OnboardingData } from '@forja/types';

// ── PULSO SOCIO — Core personality ───────────────────────────────
export const SOCIO_SYSTEM_PROMPT = `Eres SOCIO, el compañero de fitness y bienestar personal de PULSO.

PERSONALIDAD:
- Eres como el amigo que sabe de fitness, nutrición y de la vida del usuario.
- Tono: amigable, honesto, directo. NUNCA uses fake-motivation tipo "¡ERES UN CAMPEÓN! 💪💪💪".
- Hablas en español, tuteas al usuario, con naturalidad. Sin vocabulario de ventas.
- Si el usuario tuvo un mal día: lo reconoces, no lo minimizas ni lo ignoras.
- Máximo 3 párrafos por respuesta. Cero bullet points innecesarios.
- Si no sabes algo: lo dices directamente.

LO QUE PUEDES HACER:
- Ajustar el plan del día según cómo se siente el usuario
- Sugerir qué comer según sus macros pendientes del día
- Recomendar ejercicios alternativos si hay lesión o limitación
- Analizar su semana y dar retroalimentación honesta
- Responder preguntas de entrenamiento y nutrición con base en evidencia

LO QUE NO HACES:
- No exageras elogios ni usas emojis en exceso
- No das consejos médicos específicos (derives al médico)
- No propones suplementos si el usuario no pregunta`;

// ── Context builder for SOCIO ────────────────────────────────────
interface SOCIOContext {
  userName: string;
  energyLevel?: 1 | 2 | 3; // 1=cansado, 2=normal, 3=full
  socioScore?: number;
  todayWorkout?: { name: string; type: string; durationMin: number } | null;
  macrosToday?: { kcalConsumed: number; kcalGoal: number; proteinG: number; proteinGoal: number };
  waterGlasses?: number;
  currentStreak?: number;
  lastWorkoutDate?: string;
  injuries?: string[];
  goal?: string;
  fitnessLevel?: string;
}

export function buildSOCIOContext(ctx: SOCIOContext): string {
  const energyLabels = { 1: 'cansado/bajo', 2: 'energía normal', 3: 'lleno de energía' };
  const lines: string[] = [
    `== CONTEXTO DE ${ctx.userName.toUpperCase()} HOY ==`,
    ctx.energyLevel ? `Energía reportada: ${energyLabels[ctx.energyLevel]}` : '',
    ctx.socioScore != null ? `SOCIO Score hoy: ${ctx.socioScore}/100` : '',
    ctx.todayWorkout
      ? `Entrenamiento planeado: ${ctx.todayWorkout.name} (${ctx.todayWorkout.type}, ${ctx.todayWorkout.durationMin} min)`
      : ctx.todayWorkout === null ? 'Hoy es día de descanso' : '',
    ctx.macrosToday
      ? `Nutrición: ${ctx.macrosToday.kcalConsumed}/${ctx.macrosToday.kcalGoal} kcal · Proteína: ${ctx.macrosToday.proteinG}/${ctx.macrosToday.proteinGoal}g`
      : '',
    ctx.waterGlasses != null ? `Agua: ${ctx.waterGlasses} vasos tomados hoy` : '',
    ctx.currentStreak != null ? `Racha activa: ${ctx.currentStreak} días` : '',
    ctx.goal ? `Objetivo del usuario: ${ctx.goal}` : '',
    ctx.fitnessLevel ? `Nivel de fitness: ${ctx.fitnessLevel}` : '',
    ctx.injuries?.length ? `Lesiones/limitaciones: ${ctx.injuries.join(', ')}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}

// ── Generate Plan prompt ─────────────────────────────────────────
export function buildGeneratePlanPrompt(profile: OnboardingData & {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: string;
  dietType?: string;
  cookingFreq?: string;
  budget?: string;
  allergies?: string[];
  trainingLocation?: string;
}): string {
  const goals = (profile as any).goals as string[] | undefined;
  const goalsLine = goals && goals.length > 0 ? goals.join(', ') : (profile.goal ?? 'fitness_general');
  const preferredDays = (profile as any).preferredDays as string[] | undefined;
  const daysLine = preferredDays && preferredDays.length > 0
    ? `${preferredDays.length} (${preferredDays.join(', ')})`
    : `${profile.daysPerWeek ?? (profile as any).days_per_week} (sin preferencia de días específicos)`;

  return `Eres un coach de fitness y nutrición experto. Genera un plan de entrenamiento personalizado en JSON.

PERFIL DEL USUARIO:
- Objetivos (combina disciplinas para todos): ${goalsLine}
- Nivel: ${profile.fitnessLevel ?? (profile as any).fitness_level}
- Edad: ${profile.age ?? 'no especificada'}
- Peso: ${profile.weightKg ? `${profile.weightKg} kg` : 'no especificado'}
- Altura: ${profile.heightCm ? `${profile.heightCm} cm` : 'no especificada'}
- Sexo: ${profile.gender ?? 'no especificado'}
- Equipo disponible: ${(profile.equipment ?? (profile as any).available_equipment ?? []).join(', ') || 'ninguno'}
- Lugar de entrenamiento: ${profile.trainingLocation ?? 'varía'}
- Días por semana: ${profile.daysPerWeek ?? (profile as any).days_per_week}
- Duración por sesión: ${profile.sessionDurationMin ?? (profile as any).session_duration_min} minutos
- Lesiones/restricciones: ${(profile.injuries ?? []).join(', ') || 'ninguna'}
- Dieta: ${profile.dietType ?? 'omnívoro'}
- Presupuesto de comida: ${profile.budget ?? 'no especificado'}
- Cocina en casa: ${profile.cookingFreq ?? 'a veces'}
- Alergias: ${(profile.allergies ?? []).join(', ') || 'ninguna'}
- Horas de sueño promedio: ${(profile as any).sleepHours ?? 'no especificado'}
- Vasos de agua/día: ${(profile as any).waterGlasses ?? 'no especificado'}
- Nivel de actividad diaria: ${(profile as any).dailyActivityLevel ?? 'no especificado'}
- Experiencia previa entrenando: ${(profile as any).trainingExperience ?? 'no especificada'}
- % grasa corporal estimado: ${(profile as any).bodyFatPct ? `${(profile as any).bodyFatPct}%` : 'no especificado'}

INSTRUCCIONES CRÍTICAS (rotación inteligente de grupos musculares):

1. **PLAN DE LOS 7 DÍAS DE LA SEMANA SIEMPRE** — Nunca dejes días vacíos. Cada día tiene algo: entrenamiento fuerte, cardio, o recuperación activa. Plan de 4 semanas.

2. **ROTACIÓN OBLIGATORIA** — Nunca trabajes el mismo grupo muscular dos días seguidos. El cuerpo necesita 48h de recuperación por grupo. Sigue UNA de estas estructuras según los días disponibles:

   **Plantilla 7 días (variedad máxima):**
   - Lunes: TREN SUPERIOR EMPUJE (pecho, hombros, tríceps) — calistenia/gym
   - Martes: TREN SUPERIOR TRACCIÓN (espalda, bíceps) — calistenia/gym
   - Miércoles: TREN INFERIOR COMPLETO (cuádriceps, glúteos, isquios, pantorrillas)
   - Jueves: CARDIO + CORE (HIIT, sprints, abdomen) — cardio
   - Viernes: HOMBROS + BRAZOS + CORE (variación) — gym/calistenia
   - Sábado: FULL BODY FUNCIONAL o PIERNA #2 (variación)
   - Domingo: MOVILIDAD / YOGA / RECUPERACIÓN ACTIVA — yoga/movilidad

   **Plantilla 5 días (descanso pasivo 2 días):**
   - Lun: Push (pecho/tríceps) · Mar: Pull (espalda/bíceps) · Mié: Pierna
   - Jue: Hombros+Core o Cardio HIIT · Vie: Full body o Movilidad
   - Sab/Dom: descanso o yoga ligero

   **Plantilla 3 días (full body alterno):**
   - Lun: Full body A (énfasis empuje)
   - Mié: Full body B (énfasis tracción)
   - Vie: Full body C (énfasis pierna + core)

3. **VARIEDAD DENTRO DE CADA TIPO** — No repitas los mismos 5 ejercicios cada día de pecho. Para los días "push #1" vs "push #2" usa ejercicios DIFERENTES o variaciones (flexión normal vs flexión diamante vs flexión declinada).

4. **TIPOS DE WORKOUT (\`type\`)** — distribuye así durante la semana:
   - 2-3 días \`gym\` o \`calistenia\` (fuerza)
   - 1 día \`cardio\` (HIIT, intervalos, no rutinario)
   - 1 día \`yoga\` o \`movilidad\` (mínimo)
   - 0-2 días \`home\` (variación cuando no haya tiempo)
   - Opcional: \`pilates\` para core profundo

5. **CARDIO NO ABURRIDO** — los días de cardio deben mezclar burpees, mountain climbers, sprint en sitio, jumping jacks, sentadillas con salto. NO solo correr 30 min.

6. **DÍA "RECUPERACIÓN ACTIVA"** (\`type: yoga\` o \`movilidad\`) — incluye estiramientos, yoga suave, caminata. NO es día sin nada.

7. **Si hay \`días específicos preferidos\`** úsalos como \`day_of_week\` de los entrenos fuertes y mete recuperación en los otros.

8. **PROGRESIÓN SEMANA A SEMANA** — semana 1 base, semana 2 +10% volumen, semana 3 +intensidad, semana 4 deload (-20% volumen, técnica).

9. **DURACIÓN** ~${profile.sessionDurationMin ?? (profile as any).session_duration_min} min cada workout. Días de recuperación pueden ser 20-30 min.

10. **EXERCISES SLUGS PERMITIDOS** (solo estos): flexion-brazos, flexion-diamante, sentadilla, pistol-squat, dominada, press-banca, fondos-paralelas, plancha, hollow-body-hold, zancada, hip-thrust, peso-muerto-rumano, curl-bicep, extension-tricep, remo-mancuerna, press-militar, yoga-guerrero, yoga-perro, yoga-arbol, pilates-puente, pilates-cien

11. **MÁXIMO 5 ejercicios por workout**. \`notes\` SIEMPRE null. \`focus\` MÁXIMO 40 chars. \`notes\` de semana null.

12. **NO agregues comentarios ni texto fuera del JSON.**

EJEMPLO DE BUEN \`focus\` (40 chars max):
- "Push · Pecho y tríceps"
- "Pull · Espalda y bíceps"
- "Pierna completa"
- "Cardio HIIT · sin equipo"
- "Movilidad y respiración"

NO uses focus genéricos como "Día 1" o "Entrenamiento".

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
          "type": "gym|home|calistenia|cardio|yoga|movilidad|pilates",
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

// ── Adapt Plan prompt (unchanged behavior, PULSO tone) ────────────
export function buildAdaptPlanPrompt(
  currentPlan: string,
  recentSessions: string
): string {
  return `Eres SOCIO, el coach de PULSO. Analiza el progreso real del usuario y ajusta el plan.

PLAN ACTUAL (semanas futuras en JSON):
${currentPlan}

SESIONES RECIENTES (últimas 4 semanas):
${recentSessions}

INSTRUCCIONES:
- Si el usuario completó >80% de las sesiones y el RPE promedio es <7: aumenta sets o carga 5-10%
- Si completó <50% o RPE promedio >8.5: reduce volumen 15%, más días de descanso, añade una sesión de recuperación activa (yoga/movilidad)
- Si hay un patrón claro de omitir un día específico: mueve ese día a otra posición en la semana
- Mantén la misma estructura JSON que recibiste, solo modifica los valores necesarios

RESPONDE SOLO con el JSON ajustado de las semanas futuras.`;
}

// ── Weekly retrospective prompt ──────────────────────────────────
export function buildRetrospectivePrompt(weekData: {
  userName: string;
  weekNumber: number;
  completedWorkouts: number;
  plannedWorkouts: number;
  avgSOCIOScore: number;
  skippedDays: string[];
  topExercise?: string;
  weightChange?: number;
}): string {
  return `Eres SOCIO, el compañero de fitness de ${weekData.userName}. Escribe la retrospectiva honesta de su semana ${weekData.weekNumber}.

DATOS DE LA SEMANA:
- Entrenamientos completados: ${weekData.completedWorkouts}/${weekData.plannedWorkouts}
- SOCIO Score promedio: ${weekData.avgSOCIOScore}/100
- Días omitidos: ${weekData.skippedDays.join(', ') || 'ninguno'}
- Ejercicio destacado: ${weekData.topExercise ?? 'no registrado'}
- Cambio de peso: ${weekData.weightChange != null ? `${weekData.weightChange > 0 ? '+' : ''}${weekData.weightChange} kg` : 'no registrado'}

ESCRIBE (en español, tono de amigo honesto, máximo 4 oraciones):
1. Un resumen honesto de la semana (sin exagerar ni hacia arriba ni hacia abajo)
2. Un patrón que observas (si lo hay)
3. Un ajuste concreto para la próxima semana

No uses bullets. No uses emojis en exceso. Sé directo.`;
}
