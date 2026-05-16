import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

// ── Phase computation ─────────────────────────────────────────────

function computePhase(
  lastPeriodStart: Date | null,
  avgDays: number,
  today: Date,
): {
  phase: string;
  day_in_cycle: number;
  days_until_next_period: number;
  recommendation: string;
} | null {
  if (!lastPeriodStart) return null;
  const daysSince = Math.floor(
    (today.getTime() - lastPeriodStart.getTime()) / 86_400_000,
  );
  if (daysSince < 0) return null;
  const dayInCycle = (daysSince % avgDays) + 1;
  let phase: string;
  let recommendation: string;
  if (dayInCycle <= 5) {
    phase = 'menstruation';
    recommendation = 'Yoga suave, caminatas y descanso activo. Escucha a tu cuerpo.';
  } else if (dayInCycle <= 13) {
    phase = 'follicular';
    recommendation = 'Fuerza y HIIT — tu energía está alta, aprovéchala.';
  } else if (dayInCycle <= 16) {
    phase = 'ovulation';
    recommendation = 'Peak performance — perfecto para PRs y entrenamientos intensos.';
  } else {
    phase = 'luteal';
    recommendation = 'Pilates, movilidad y entrenamientos moderados. Recuperación activa.';
  }
  return {
    phase,
    day_in_cycle: dayInCycle,
    days_until_next_period: avgDays - dayInCycle,
    recommendation,
  };
}

// ── GET ───────────────────────────────────────────────────────────

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
      console.error('body-phase/GET: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);

    // Fetch body_phases row and today's socio_score in parallel
    const [phaseResult, scoreResult] = await Promise.allSettled([
      sql`
        SELECT cycle_tracking_enabled, last_period_start, avg_cycle_days,
               stress_level, sleep_quality, recovery_mode, recovery_triggered_at, notes
        FROM body_phases
        WHERE user_id = ${dbUserId}
        LIMIT 1
      `,
      sql`
        SELECT total FROM socio_scores
        WHERE user_id = ${dbUserId} AND date = ${todayISO}
        LIMIT 1
      `,
    ]);

    // Defaults
    let trackingEnabled = false;
    let lastPeriodStart: string | null = null;
    let avgCycleDays = 28;
    let stressLevel: number | null = null;
    let sleepQuality: number | null = null;
    let recoveryMode = false;

    if (phaseResult.status === 'fulfilled' && phaseResult.value.length > 0) {
      const row = phaseResult.value[0];
      trackingEnabled = Boolean(row.cycle_tracking_enabled);
      lastPeriodStart = row.last_period_start
        ? String(row.last_period_start).slice(0, 10)
        : null;
      avgCycleDays = Number(row.avg_cycle_days ?? 28);
      stressLevel = row.stress_level != null ? Number(row.stress_level) : null;
      sleepQuality = row.sleep_quality != null ? Number(row.sleep_quality) : null;
      recoveryMode = Boolean(row.recovery_mode);
    } else if (phaseResult.status === 'rejected') {
      console.error('body-phase/GET: body_phases query failed', phaseResult.reason);
    }

    // Auto-recovery if SOCIO score < 50 today
    let autoRecoveryToday = false;
    if (scoreResult.status === 'fulfilled' && scoreResult.value.length > 0) {
      const total = Number(scoreResult.value[0].total ?? 100);
      if (total < 50) autoRecoveryToday = true;
    } else if (scoreResult.status === 'rejected') {
      console.error('body-phase/GET: socio_scores query failed', scoreResult.reason);
    }

    const effectiveRecoveryMode = recoveryMode || autoRecoveryToday;

    // Compute current cycle phase
    let currentPhase: ReturnType<typeof computePhase> = null;
    if (trackingEnabled && lastPeriodStart) {
      currentPhase = computePhase(new Date(lastPeriodStart), avgCycleDays, today);
    }

    return NextResponse.json({
      tracking_enabled: trackingEnabled,
      last_period_start: lastPeriodStart,
      avg_cycle_days: avgCycleDays,
      stress_level: stressLevel,
      sleep_quality: sleepQuality,
      recovery_mode: effectiveRecoveryMode,
      current_phase: currentPhase,
      auto_recovery_today: autoRecoveryToday,
    });
  } catch (err) {
    console.error('body-phase/GET: fatal', err);
    return NextResponse.json(
      { error: 'No se pudo cargar la fase corporal. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}

// ── POST ──────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  // Validate fields
  const {
    tracking_enabled,
    last_period_start,
    avg_cycle_days,
    stress_level,
    sleep_quality,
    recovery_mode,
  } = body;

  if (tracking_enabled !== undefined && typeof tracking_enabled !== 'boolean') {
    return NextResponse.json({ error: 'tracking_enabled debe ser booleano' }, { status: 400 });
  }
  if (
    last_period_start !== undefined &&
    last_period_start !== null &&
    (typeof last_period_start !== 'string' || !ISO_DATE_RE.test(last_period_start))
  ) {
    return NextResponse.json({ error: 'last_period_start debe ser YYYY-MM-DD' }, { status: 400 });
  }
  if (
    avg_cycle_days !== undefined &&
    (typeof avg_cycle_days !== 'number' || avg_cycle_days < 21 || avg_cycle_days > 40)
  ) {
    return NextResponse.json({ error: 'avg_cycle_days debe estar entre 21 y 40' }, { status: 400 });
  }
  if (
    stress_level !== undefined &&
    stress_level !== null &&
    (typeof stress_level !== 'number' || stress_level < 1 || stress_level > 5)
  ) {
    return NextResponse.json({ error: 'stress_level debe estar entre 1 y 5' }, { status: 400 });
  }
  if (
    sleep_quality !== undefined &&
    sleep_quality !== null &&
    (typeof sleep_quality !== 'number' || sleep_quality < 1 || sleep_quality > 5)
  ) {
    return NextResponse.json({ error: 'sleep_quality debe estar entre 1 y 5' }, { status: 400 });
  }
  if (recovery_mode !== undefined && typeof recovery_mode !== 'boolean') {
    return NextResponse.json({ error: 'recovery_mode debe ser booleano' }, { status: 400 });
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
      console.error('body-phase/POST: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const now = new Date().toISOString();

    // Build upsert values
    const cycleTrackingEnabled =
      tracking_enabled !== undefined ? tracking_enabled : false;
    const lastPeriodStartVal =
      last_period_start !== undefined ? (last_period_start as string | null) : null;
    const avgCycleDaysVal =
      avg_cycle_days !== undefined ? (avg_cycle_days as number) : 28;
    const stressLevelVal =
      stress_level !== undefined ? (stress_level as number | null) : null;
    const sleepQualityVal =
      sleep_quality !== undefined ? (sleep_quality as number | null) : null;
    const recoveryModeVal =
      recovery_mode !== undefined ? (recovery_mode as boolean) : false;
    const recoveryTriggeredAt =
      recoveryModeVal ? now : null;

    const rows = await sql`
      INSERT INTO body_phases (
        user_id, cycle_tracking_enabled, last_period_start, avg_cycle_days,
        stress_level, sleep_quality, recovery_mode, recovery_triggered_at, updated_at
      ) VALUES (
        ${dbUserId}, ${cycleTrackingEnabled}, ${lastPeriodStartVal}, ${avgCycleDaysVal},
        ${stressLevelVal}, ${sleepQualityVal}, ${recoveryModeVal}, ${recoveryTriggeredAt}, ${now}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        cycle_tracking_enabled = EXCLUDED.cycle_tracking_enabled,
        last_period_start = EXCLUDED.last_period_start,
        avg_cycle_days = EXCLUDED.avg_cycle_days,
        stress_level = EXCLUDED.stress_level,
        sleep_quality = EXCLUDED.sleep_quality,
        recovery_mode = EXCLUDED.recovery_mode,
        recovery_triggered_at = CASE
          WHEN EXCLUDED.recovery_mode = true THEN EXCLUDED.recovery_triggered_at
          ELSE body_phases.recovery_triggered_at
        END,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;

    return NextResponse.json(rows[0] ?? {});
  } catch (err) {
    console.error('body-phase/POST: fatal', err);
    return NextResponse.json(
      { error: 'No se pudo actualizar. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
