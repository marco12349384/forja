import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

// ── Helpers ────────────────────────────────────────────────────────────

function intensityToLevel(intensity: string | null): number {
  if (intensity === 'light') return 1;
  if (intensity === 'medium') return 2;
  if (intensity === 'intense') return 3;
  return 0;
}

/** Returns YYYY-MM-DD for a Date shifted by `days` days from today */
function shiftDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/** Returns the most-recent Monday on or before `date` */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = d.getUTCDay(); // 0=Sun … 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
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
      console.error('progress: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);

    // Date anchors (UTC)
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];
    const date13ago = shiftDate(now, -13); // 14-day window (today + 13 before)
    const date29ago = shiftDate(now, -29); // 30-day window
    const date34ago = shiftDate(now, -34); // 35-day window for heatmap
    const date59ago = shiftDate(now, -59); // 60-day window for streak
    const weekStart = startOfWeek(now).toISOString().split('T')[0];

    // ── 5 independent queries ──────────────────────────────────────────
    const [
      scoreHistoryResult,
      heatmapResult,
      weekSessionsResult,
      monthSessionsResult,
      streakDatesResult,
      latestRetroResult,
    ] = await Promise.allSettled([
      // 1. Score history — last 14 days
      sql`
        SELECT date::text, total
        FROM socio_scores
        WHERE user_id = ${dbUserId}
          AND date >= ${date13ago}::date
        ORDER BY date ASC
      `,
      // 2. Heatmap sessions — last 35 days, grouped by date
      sql`
        SELECT
          date::text,
          COUNT(*)::int AS session_count,
          MAX(
            CASE intensity
              WHEN 'intense' THEN 3
              WHEN 'medium'  THEN 2
              WHEN 'light'   THEN 1
              ELSE 0
            END
          ) AS max_level
        FROM workout_sessions
        WHERE user_id = ${dbUserId}
          AND date >= ${date34ago}::date
        GROUP BY date
        ORDER BY date ASC
      `,
      // 3. Week sessions count
      sql`
        SELECT COUNT(*)::int AS c
        FROM workout_sessions
        WHERE user_id = ${dbUserId}
          AND date >= ${weekStart}::date
      `,
      // 4. Month sessions count
      sql`
        SELECT COUNT(*)::int AS c
        FROM workout_sessions
        WHERE user_id = ${dbUserId}
          AND date >= ${date29ago}::date
      `,
      // 5. Distinct activity dates (last 60 days) for streak
      sql`
        SELECT DISTINCT date::text
        FROM (
          SELECT date FROM energy_checkins
          WHERE user_id = ${dbUserId} AND date >= ${date59ago}::date
          UNION
          SELECT date FROM workout_sessions
          WHERE user_id = ${dbUserId} AND date >= ${date59ago}::date
        ) combined
        ORDER BY date DESC
      `,
      // 6. Latest retro
      sql`
        SELECT id, week_number, year, narrative, avg_socio_score, created_at
        FROM weekly_retros
        WHERE user_id = ${dbUserId}
        ORDER BY created_at DESC
        LIMIT 1
      `,
    ]);

    // ── Score history ──────────────────────────────────────────────────
    let scoreHistory: Array<{ date: string; total: number }> = [];
    if (scoreHistoryResult.status === 'fulfilled') {
      scoreHistory = scoreHistoryResult.value.map((r: Record<string, unknown>) => ({
        date: String(r.date),
        total: Number(r.total ?? 0),
      }));
    } else {
      console.error('progress: score_history query failed', scoreHistoryResult.reason);
    }

    // ── Heatmap ────────────────────────────────────────────────────────
    // Build a map from date string → level (0-3)
    const sessionByDate = new Map<string, number>();
    if (heatmapResult.status === 'fulfilled') {
      for (const row of heatmapResult.value as Array<Record<string, unknown>>) {
        sessionByDate.set(String(row.date), Number(row.max_level ?? 0));
      }
    } else {
      console.error('progress: heatmap query failed', heatmapResult.reason);
    }

    // Build 35-cell grid (5 weeks × 7 days), each week starting on Monday
    // We want the grid to end on the Sunday of the current week (or today if mid-week).
    // Strategy: find the Monday of the week containing today, then go back 4 more weeks.
    const gridStartMonday = startOfWeek(now);
    gridStartMonday.setUTCDate(gridStartMonday.getUTCDate() - 28); // go back 4 weeks

    const heatmap: Array<Array<{ date: string; level: number }>> = [];
    for (let week = 0; week < 5; week++) {
      const weekRow: Array<{ date: string; level: number }> = [];
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(gridStartMonday);
        cellDate.setUTCDate(gridStartMonday.getUTCDate() + week * 7 + day);
        const dateStr = cellDate.toISOString().split('T')[0];
        // Future dates get level 0
        const level = dateStr > todayISO ? 0 : (sessionByDate.get(dateStr) ?? 0);
        weekRow.push({ date: dateStr, level });
      }
      heatmap.push(weekRow);
    }

    // ── Stats ──────────────────────────────────────────────────────────
    const weekSessions =
      weekSessionsResult.status === 'fulfilled'
        ? Number((weekSessionsResult.value as Array<Record<string, unknown>>)[0]?.c ?? 0)
        : 0;

    const monthSessions =
      monthSessionsResult.status === 'fulfilled'
        ? Number((monthSessionsResult.value as Array<Record<string, unknown>>)[0]?.c ?? 0)
        : 0;

    // Streak: count consecutive days back from today
    let streak = 0;
    if (streakDatesResult.status === 'fulfilled') {
      const activeDates = new Set(
        (streakDatesResult.value as Array<Record<string, unknown>>).map((r) => String(r.date))
      );
      let cursor = new Date(now);
      if (!activeDates.has(todayISO)) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      while (true) {
        const dateStr = cursor.toISOString().split('T')[0];
        if (!activeDates.has(dateStr)) break;
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    } else {
      console.error('progress: streak query failed', streakDatesResult.reason);
    }

    const stats = { streak, week_sessions: weekSessions, month_sessions: monthSessions };

    // ── Latest retro ───────────────────────────────────────────────────
    let latestRetro: {
      id: string;
      week_number: number;
      year: number;
      narrative: string;
      avg_socio_score: number | null;
    } | null = null;

    if (latestRetroResult.status === 'fulfilled' && (latestRetroResult.value as unknown[]).length > 0) {
      const r = (latestRetroResult.value as Array<Record<string, unknown>>)[0];
      latestRetro = {
        id: String(r.id),
        week_number: Number(r.week_number),
        year: Number(r.year),
        narrative: String(r.narrative ?? ''),
        avg_socio_score: r.avg_socio_score != null ? Number(r.avg_socio_score) : null,
      };
    } else if (latestRetroResult.status === 'rejected') {
      console.error('progress: latest_retro query failed', latestRetroResult.reason);
    }

    return NextResponse.json({
      stats,
      score_history: scoreHistory,
      heatmap,
      latest_retro: latestRetro,
      personal_records: [],
    });
  } catch (err) {
    console.error('progress:fatal', err);
    return NextResponse.json(
      { error: 'No se pudo cargar el progreso. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
