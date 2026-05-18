import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

const ALLOWED_EVENTS = new Set([
  'onboarding_completed', 'daily_checkin_done', 'workout_started',
  'workout_completed', 'workout_skipped', 'meal_logged', 'snap_eat_used',
  'socio_message_sent', 'mini_mission_completed', 'streak_maintained',
  'weekly_retro_viewed', 'socio_score_viewed',
]);
const MAX_BATCH = 50;
const MAX_PROPS_SIZE = 4000; // bytes per event

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const events = Array.isArray(body?.events) ? body.events : null;
    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'events array requerido' }, { status: 400 });
    }
    if (events.length > MAX_BATCH) {
      return NextResponse.json({ error: 'demasiados eventos en el batch' }, { status: 400 });
    }

    // Validate each event
    const validated: Array<{ event: string; properties: Record<string, unknown>; occurred_at: string }> = [];
    for (const e of events) {
      if (!e || typeof e.event !== 'string' || !ALLOWED_EVENTS.has(e.event)) continue;
      const props = e.properties ?? {};
      if (typeof props !== 'object' || Array.isArray(props)) continue;
      const propsStr = JSON.stringify(props);
      if (propsStr.length > MAX_PROPS_SIZE) continue;
      const occurred_at = typeof e.occurred_at === 'string' ? e.occurred_at : new Date().toISOString();
      validated.push({ event: e.event, properties: props, occurred_at });
    }

    if (validated.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    let email = '';
    let name = '';
    try {
      const user = await currentUser();
      email = user?.emailAddresses[0]?.emailAddress ?? '';
      name = user?.firstName ?? '';
    } catch {
      // Non-fatal — proceed without user details
    }

    const dbUserId = await ensureUser(userId, email, name);
    const sql = getDb();

    // Multi-row INSERT
    const rows = validated.map((v) => ({
      user_id: dbUserId,
      event_name: v.event,
      properties: v.properties,
      occurred_at: v.occurred_at,
    }));

    await sql`
      INSERT INTO analytics_events ${sql(rows, 'user_id', 'event_name', 'properties', 'occurred_at')}
    `;

    return NextResponse.json({ inserted: validated.length });
  } catch (err: unknown) {
    console.error('track error:', err);
    return NextResponse.json({ error: 'No se pudo registrar eventos.' }, { status: 500 });
  }
}
