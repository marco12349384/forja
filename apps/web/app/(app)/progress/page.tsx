import { auth } from '@clerk/nextjs/server';
import { getDb } from '@forja/api-client';

interface ScoreRow { date: string; total: number; }
interface EnergyRow { date: string; energy_level: number; }
interface NutritionWeekRow { week_start: string; avg_kcal: number; avg_protein: number; }

export default async function ProgressPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const sql = getDb();
  let dbUserId: string | null = null;
  try {
    const rows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
    dbUserId = rows[0]?.id ?? null;
  } catch {}

  const [scoresResult, energyResult, nutritionResult, sessionsResult] = await Promise.allSettled([
    dbUserId
      ? sql`SELECT date::text, total FROM socio_scores WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY date ASC`
      : Promise.resolve([]),
    dbUserId
      ? sql`SELECT date::text, energy_level FROM energy_checkins WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY date ASC`
      : Promise.resolve([]),
    dbUserId
      ? sql`
          SELECT date_trunc('week', date)::text AS week_start,
                 ROUND(AVG(kcal_consumed)) AS avg_kcal,
                 ROUND(AVG(protein_g)) AS avg_protein
          FROM daily_nutrition
          WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '28 days'
          GROUP BY date_trunc('week', date) ORDER BY date_trunc('week', date) ASC
        `
      : Promise.resolve([]),
    dbUserId
      ? sql`SELECT COUNT(*)::int AS n FROM workout_sessions WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '56 days'`
      : Promise.resolve([]),
  ]);

  const scores: ScoreRow[] = scoresResult.status === 'fulfilled' ? (scoresResult.value as unknown as ScoreRow[]) : [];
  const energyHistory: EnergyRow[] = energyResult.status === 'fulfilled' ? (energyResult.value as unknown as EnergyRow[]) : [];
  const weeklyNutrition: NutritionWeekRow[] = nutritionResult.status === 'fulfilled' ? (nutritionResult.value as unknown as NutritionWeekRow[]) : [];
  const totalSessions: number = sessionsResult.status === 'fulfilled'
    ? Number((sessionsResult.value as unknown as Array<{ n: number }>)[0]?.n ?? 0) : 0;

  const today = new Date();
  const last30Dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last30Dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const scoreMap = new Map(scores.map((s) => [s.date.slice(0, 10), s.total]));
  const energyMap = new Map(energyHistory.map((e) => [e.date.slice(0, 10), e.energy_level]));

  // Compute average score
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + Number(s.total), 0) / scores.length) : null;

  // Compute current week of 8-week journey (based on first score date or today)
  const firstScoreDate = scores[0]?.date ? new Date(scores[0].date) : today;
  const daysSinceStart = Math.floor((today.getTime() - firstScoreDate.getTime()) / 86400000);
  const currentWeek = Math.min(8, Math.max(1, Math.floor(daysSinceStart / 7) + 1));

  const phases = [
    { range: 'SEMANAS 1–2', desc: 'Adaptación. Bajas retención. Te ves más seco rápido.', weeks: [1, 2] },
    { range: 'SEMANAS 3–4', desc: 'Primera bajada visible. Diferencia en abdomen y cara.', weeks: [3, 4] },
    { range: 'SEMANAS 5–6', desc: 'Definición clara en abdomen, pecho y brazos.', weeks: [5, 6] },
    { range: 'SEMANAS 7–8', desc: 'Pico físico. Igual o mejor que tus fotos anteriores.', weeks: [7, 8] },
  ];

  const KCAL_MAX = 3000;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="text-xs font-semibold tracking-[3px] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            ⚡ Progreso · Últimos 30 días
          </div>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(36px, 7vw, 56px)', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>TU</span>{' '}
            <span style={{ color: 'var(--accent)' }}>EVOLUCIÓN</span>
          </h1>
          <div className="flex gap-2 mt-5 flex-wrap">
            {avgScore !== null && <span className="pill pill-hi">Score promedio · {avgScore}</span>}
            <span className="pill">{totalSessions} entrenos · 8 semanas</span>
            <span className="pill">Semana {currentWeek} de 8</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* TIMELINE 8 SEMANAS */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-display text-base mb-4" style={{ fontWeight: 700 }}>📈 Tu camino · 8 semanas</h2>
          <div className="relative pl-5">
            <div className="absolute left-1 top-2 bottom-2 w-0.5" style={{ background: 'var(--border)' }} />
            {phases.map((p) => {
              const isNow = p.weeks.includes(currentWeek);
              const isDone = p.weeks.every((w) => w < currentWeek);
              const dotColor = isNow ? 'var(--accent)' : isDone ? '#22c55e' : 'var(--border)';
              const badge = isNow ? 'AHORA' : isDone ? 'COMPLETADA' : null;
              return (
                <div key={p.range} className="relative mb-5 pl-4 last:mb-0">
                  <div
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      left: '-14px',
                      top: '5px',
                      background: dotColor,
                      border: '2px solid var(--bg)',
                      boxShadow: isNow ? '0 0 0 3px rgba(232,255,71,0.2)' : 'none',
                    }}
                  />
                  <div className="font-display text-sm tracking-[1px]" style={{ fontWeight: 700 }}>
                    {p.range}
                    {badge && (
                      <span
                        className="ml-2 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: isNow ? 'rgba(232,255,71,0.15)' : 'rgba(34,197,94,0.15)',
                          color: isNow ? 'var(--accent)' : '#22c55e',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{p.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SOCIO SCORE CHART */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-display text-base" style={{ fontWeight: 700 }}>SOCIO Score · 30 días</h2>
            {avgScore !== null && (
              <span className="font-display text-2xl" style={{ fontWeight: 800, color: 'var(--accent)' }}>{avgScore}</span>
            )}
          </div>
          <div className="flex items-end gap-0.5 h-32">
            {last30Dates.map((dateStr) => {
              const score = scoreMap.get(dateStr);
              if (score === undefined) {
                return <div key={dateStr} className="flex-1 rounded-sm" style={{ height: '4px', background: 'var(--border)' }} title={dateStr} />;
              }
              const heightPx = Math.max(4, Math.round((score / 100) * 120));
              const color = score >= 70 ? 'var(--accent)' : score >= 50 ? 'rgba(232,255,71,0.5)' : 'var(--muted)';
              return (
                <div key={dateStr} className="flex-1 rounded-sm" style={{ height: `${heightPx}px`, background: color }} title={`${dateStr}: ${score}`} />
              );
            })}
          </div>
          {scores.length === 0 && (
            <p className="text-sm text-center mt-4" style={{ color: 'var(--muted)' }}>
              Completa check-ins diarios para ver tu historial.
            </p>
          )}
        </div>

        {/* ENERGY DOTS */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-display text-base mb-4" style={{ fontWeight: 700 }}>Energía diaria · 30 días</h2>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
            {last30Dates.map((dateStr) => {
              const level = energyMap.get(dateStr);
              const color = level === 3 ? '#ff6b35' : level === 2 ? 'var(--accent)' : level === 1 ? '#38bdf8' : 'var(--border)';
              return <div key={dateStr} className="aspect-square rounded-md" style={{ background: color }} title={dateStr} />;
            })}
          </div>
          <div className="flex gap-3 mt-4 text-[11px]" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff6b35' }} /> Con todo</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} /> Normal</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#38bdf8' }} /> Cansado</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border)' }} /> Sin datos</div>
          </div>
        </div>

        {/* WEEKLY NUTRITION */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-display text-base mb-4" style={{ fontWeight: 700 }}>Calorías por semana</h2>
          {weeklyNutrition.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Empieza a registrar comidas para ver tu historial semanal.
            </p>
          ) : (
            <div className="space-y-2.5">
              {weeklyNutrition.map((week, idx) => {
                const kcal = Number(week.avg_kcal);
                const widthPct = Math.min(100, Math.round((kcal / KCAL_MAX) * 100));
                return (
                  <div key={week.week_start} className="flex items-center gap-3">
                    <span className="text-xs w-16 shrink-0 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Sem {idx + 1}
                    </span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${widthPct}%`, background: 'var(--accent2)' }}
                        role="progressbar"
                        aria-valuenow={Math.round(widthPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <span className="font-display text-sm w-20 text-right shrink-0" style={{ color: 'var(--accent)' }}>
                      {kcal} kcal
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
