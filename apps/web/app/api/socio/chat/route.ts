import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, getActivePlan, getTodayWorkout } from '@forja/api-client';
import { SOCIO_SYSTEM_PROMPT, buildSOCIOContext } from '@forja/ai';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 10;
const STREAK_LOOKBACK_DAYS = 60;
const MODEL_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 800;
const CLAUDE_MODEL = 'claude-3-5-sonnet-latest';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type SocioContext = Parameters<typeof buildSOCIOContext>[0];

async function gatherSocioContext(
  sql: ReturnType<typeof getDb>,
  dbUserId: string,
  clerkUserId: string,
  todayISO: string,
  todayName: string,
): Promise<Omit<SocioContext, 'userName'>> {
  let energyLevel: 1 | 2 | 3 | undefined;
  let socioScore: number | undefined;
  let todayWorkout: { name: string; type: string; durationMin: number } | null | undefined;
  let macrosToday:
    | { kcalConsumed: number; kcalGoal: number; proteinG: number; proteinGoal: number }
    | undefined;
  let waterGlasses: number | undefined;
  let currentStreak: number | undefined;
  let goal: string | undefined;
  let fitnessLevel: string | undefined;
  let injuries: string[] | undefined;

  try {
    const rows = await sql`
      SELECT energy_level FROM energy_checkins
      WHERE user_id = ${dbUserId} AND date = ${todayISO}
      LIMIT 1
    `;
    if (rows[0]) energyLevel = rows[0].energy_level as 1 | 2 | 3;
  } catch (err) {
    console.error('socio/chat: energy_checkin failed', err);
  }

  try {
    const rows = await sql`
      SELECT total FROM socio_scores
      WHERE user_id = ${dbUserId} AND date = ${todayISO}
      LIMIT 1
    `;
    if (rows[0]) socioScore = Number(rows[0].total);
  } catch (err) {
    console.error('socio/chat: socio_scores failed', err);
  }

  try {
    const plan = await getActivePlan(clerkUserId);
    if (plan) {
      const workout: any = await getTodayWorkout(plan.id, todayName);
      if (workout) {
        todayWorkout = {
          name: workout.name,
          type: workout.type,
          durationMin: workout.estimated_duration_min,
        };
      } else {
        todayWorkout = null;
      }
    }
  } catch (err) {
    console.error('socio/chat: today workout failed', err);
  }

  try {
    const rows = await sql`
      SELECT kcal_consumed, kcal_goal, protein_g, protein_goal, water_glasses
      FROM daily_nutrition
      WHERE user_id = ${dbUserId} AND date = ${todayISO}
      LIMIT 1
    `;
    if (rows[0]) {
      macrosToday = {
        kcalConsumed: Number(rows[0].kcal_consumed),
        kcalGoal: Number(rows[0].kcal_goal),
        proteinG: Number(rows[0].protein_g),
        proteinGoal: Number(rows[0].protein_goal),
      };
      waterGlasses = Number(rows[0].water_glasses);
    }
  } catch (err) {
    console.error('socio/chat: daily_nutrition failed', err);
  }

  try {
    // Count consecutive days of energy_checkins ending today (or yesterday)
    const rows = await sql`
      SELECT date FROM energy_checkins
      WHERE user_id = ${dbUserId} AND date <= ${todayISO}
      ORDER BY date DESC
      LIMIT ${STREAK_LOOKBACK_DAYS}
    `;
    let streak = 0;
    const cursor = new Date(todayISO + 'T00:00:00Z');
    // Allow streak to start either today or yesterday
    if (rows.length > 0) {
      const firstDate = new Date(String(rows[0].date) + 'T00:00:00Z');
      const diffDays = Math.round(
        (cursor.getTime() - firstDate.getTime()) / 86400000,
      );
      if (diffDays > 1) {
        streak = 0;
      } else {
        cursor.setUTCDate(cursor.getUTCDate() - diffDays);
        for (const row of rows) {
          const d = new Date(String(row.date) + 'T00:00:00Z');
          if (d.getTime() === cursor.getTime()) {
            streak += 1;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
          } else {
            break;
          }
        }
      }
    }
    currentStreak = streak;
  } catch (err) {
    console.error('socio/chat: streak query failed', err);
    currentStreak = 0;
  }

  try {
    const rows = await sql`
      SELECT goal, fitness_level, injuries
      FROM user_profiles
      WHERE user_id = ${dbUserId}
      LIMIT 1
    `;
    if (rows[0]) {
      goal = rows[0].goal ?? undefined;
      fitnessLevel = rows[0].fitness_level ?? undefined;
      injuries = Array.isArray(rows[0].injuries) ? rows[0].injuries : undefined;
    }
  } catch (err) {
    console.error('socio/chat: user_profile failed', err);
  }

  return {
    energyLevel,
    socioScore,
    todayWorkout,
    macrosToday,
    waterGlasses,
    currentStreak,
    goal,
    fitnessLevel,
    injuries,
  };
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse + validate body
  let message: string;
  let sanitizedHistory: ChatMessage[];
  try {
    const body = await req.json();
    const rawMessage = body?.message;
    const rawHistory = body?.history;

    if (
      typeof rawMessage !== 'string' ||
      rawMessage.trim().length === 0 ||
      rawMessage.length > MAX_MESSAGE_CHARS
    ) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }
    if (rawHistory !== undefined && !Array.isArray(rawHistory)) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }

    message = rawMessage;
    sanitizedHistory = (Array.isArray(rawHistory) ? rawHistory : [])
      .slice(-MAX_HISTORY_ITEMS)
      .filter(
        (m): m is ChatMessage =>
          m != null &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string',
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  } catch {
    return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
  }

  try {
    const sql = getDb();

    // Resolve postgres user id from clerk id
    let dbUserId: string | null = null;
    try {
      const userRows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
      dbUserId = userRows[0]?.id ?? null;
    } catch (err) {
      console.error('socio/chat: lookup user failed', err);
    }

    // Pull clerk first name
    let firstName = '';
    try {
      const user = await currentUser();
      firstName = user?.firstName ?? '';
    } catch (err) {
      console.error('socio/chat: currentUser failed', err);
    }

    // Build context with best-effort queries; never fail the request on a missing signal
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    const todayName = DAYS_ES[today.getDay()];

    const gathered = dbUserId
      ? await gatherSocioContext(sql, dbUserId, userId, todayISO, todayName)
      : {};

    const contextString = buildSOCIOContext({
      userName: firstName || 'tú',
      ...gathered,
    });

    const systemPrompt = `${SOCIO_SYSTEM_PROMPT}\n\n${contextString}`;

    // Build message list for Anthropic
    const messages = [...sanitizedHistory, { role: 'user' as const, content: message }];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    let response;
    try {
      response = await anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages,
        },
        { signal: controller.signal },
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        console.error('socio/chat: model timeout', err);
        return NextResponse.json(
          { reply: 'SOCIO está pensando demasiado. Intenta de nuevo.' },
          { status: 200 },
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const first = response.content[0];
    const reply = first?.type === 'text' ? first.text : '';
    if (!reply) {
      console.error('socio/chat:non-text-reply', { blockType: first?.type });
      return NextResponse.json(
        { reply: 'No pude generar una respuesta ahora mismo. Intenta de nuevo.' },
        { status: 200 },
      );
    }

    // Persist conversation (best-effort, single transactional insert)
    if (dbUserId) {
      try {
        await sql`
          INSERT INTO socio_messages (user_id, role, content) VALUES
            (${dbUserId}, 'user', ${message}),
            (${dbUserId}, 'assistant', ${reply})
        `;
      } catch (err) {
        console.error('socio/chat: persist messages failed', err);
      }
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('socio/chat:fatal', err);
    return NextResponse.json({ error: 'Error interno. Intenta de nuevo.' }, { status: 500 });
  }
}
