import { auth } from '@clerk/nextjs/server';
import { getDb } from '@forja/api-client';

interface ScoreRow {
  date: string;
  total: number;
}

interface EnergyRow {
  date: string;
  energy_level: number;
}

interface NutritionWeekRow {
  week_start: string;
  avg_kcal: number;
  avg_protein: number;
}

export default async function ProgressPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const sql = getDb();

  // Fix 2: Resolve internal DB userId ONCE
  let dbUserId: string | null = null;
  try {
    const rows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
    dbUserId = rows[0]?.id ?? null;
  } catch {
    // skip
  }

  // Fix 3: Parallelize all DB queries with Promise.allSettled
  const [scoresResult, energyResult, nutritionResult] = await Promise.allSettled([
    dbUserId
      ? sql`
          SELECT date::text, total
          FROM socio_scores
          WHERE user_id = ${dbUserId}
            AND date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY date ASC
        `
      : Promise.resolve([]),
    dbUserId
      ? sql`
          SELECT date::text, energy_level
          FROM energy_checkins
          WHERE user_id = ${dbUserId}
            AND date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY date ASC
        `
      : Promise.resolve([]),
    dbUserId
      ? sql`
          SELECT
            date_trunc('week', date)::text AS week_start,
            ROUND(AVG(kcal_consumed)) AS avg_kcal,
            ROUND(AVG(protein_g)) AS avg_protein
          FROM daily_nutrition
          WHERE user_id = ${dbUserId}
            AND date >= CURRENT_DATE - INTERVAL '28 days'
          GROUP BY date_trunc('week', date)
          ORDER BY date_trunc('week', date) ASC
        `
      : Promise.resolve([]),
  ]);

  const scores: ScoreRow[] =
    scoresResult.status === 'fulfilled'
      ? (scoresResult.value as unknown as ScoreRow[])
      : [];

  const energyHistory: EnergyRow[] =
    energyResult.status === 'fulfilled'
      ? (energyResult.value as unknown as EnergyRow[])
      : [];

  const weeklyNutrition: NutritionWeekRow[] =
    nutritionResult.status === 'fulfilled'
      ? (nutritionResult.value as unknown as NutritionWeekRow[])
      : [];

  // Build 30-day arrays (index 0 = 29 days ago, index 29 = today)
  const today = new Date();
  const last30Dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    last30Dates.push(`${yyyy}-${mm}-${dd}`);
  }

  const scoreMap = new Map(scores.map((s) => [s.date.slice(0, 10), s.total]));
  const energyMap = new Map(energyHistory.map((e) => [e.date.slice(0, 10), e.energy_level]));

  const firstDate = last30Dates[0];
  const lastDate = last30Dates[last30Dates.length - 1];

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const KCAL_MAX = 3000;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Tu Progreso</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Últimos 30 días</p>
        </div>

        {/* SOCIO Score History — bar chart */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold mb-4 text-zinc-900 dark:text-white">SOCIO Score · 30 días</h2>
          <div className="flex items-end gap-0.5 h-32">
            {last30Dates.map((dateStr) => {
              const score = scoreMap.get(dateStr);
              if (score === undefined) {
                return (
                  <div
                    key={dateStr}
                    className="flex-1 bg-zinc-300 dark:bg-zinc-700 rounded-sm"
                    style={{ height: '4px' }}
                    title={dateStr}
                  />
                );
              }
              const heightPx = Math.max(4, Math.round((score / 100) * 120));
              const barColor =
                score >= 70
                  ? 'bg-violet-500'
                  : score >= 50
                  ? 'bg-violet-400/50'
                  : 'bg-zinc-400 dark:bg-zinc-600';
              return (
                <div
                  key={dateStr}
                  className={`flex-1 ${barColor} rounded-sm`}
                  style={{ height: `${heightPx}px` }}
                  title={`${dateStr}: ${score}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-zinc-500">
            <span>{formatShortDate(firstDate)}</span>
            <span>{formatShortDate(lastDate)}</span>
          </div>
          {scores.length === 0 && (
            <p className="text-zinc-500 text-sm text-center mt-4">
              Completa check-ins diarios para ver tu historial de score.
            </p>
          )}
        </div>

        {/* Energía Diaria — dot grid */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold mb-4 text-zinc-900 dark:text-white">Energía al despertar · 30 días</h2>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {last30Dates.map((dateStr) => {
              const level = energyMap.get(dateStr);
              const dotColor =
                level === 3
                  ? 'bg-orange-500'
                  : level === 2
                  ? 'bg-violet-500'
                  : level === 1
                  ? 'bg-teal-500'
                  : 'bg-zinc-300 dark:bg-zinc-800';
              return (
                <div
                  key={dateStr}
                  className={`w-6 h-6 rounded-full ${dotColor}`}
                  title={dateStr}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Con todo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span>Cansado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-400 dark:bg-zinc-700" />
              <span>Sin registro</span>
            </div>
          </div>
          {energyHistory.length === 0 && (
            <p className="text-zinc-500 text-sm text-center mt-4">
              Registra tu energía cada mañana en la app para ver el historial.
            </p>
          )}
        </div>

        {/* Nutrición Semanal — horizontal bar chart */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4 text-zinc-900 dark:text-white">Calorías promedio por semana</h2>

          {weeklyNutrition.length === 0 ? (
            <p className="text-zinc-500 text-sm">
              Empieza a registrar comidas en la app para ver tu historial.
            </p>
          ) : (
            <div className="space-y-3">
              {weeklyNutrition.map((week, idx) => {
                const kcal = Number(week.avg_kcal);
                const widthPct = Math.min(100, Math.round((kcal / KCAL_MAX) * 100));
                const label = `Semana ${idx + 1}`;
                return (
                  <div key={week.week_start} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 w-16 shrink-0">{label}</span>
                    {/* Fix 4: aria attributes on weekly nutrition progress bar fill */}
                    <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-orange-500/70 rounded-full"
                        style={{ width: `${widthPct}%` }}
                        role="progressbar"
                        aria-valuenow={Math.round(widthPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${label}: calorías promedio`}
                      />
                    </div>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 w-16 text-right shrink-0">
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
