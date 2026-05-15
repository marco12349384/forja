import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb } from '@forja/api-client';
import { getActivePlan } from '@forja/api-client';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DAYS_ES_FULL = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];
const DAYS_ES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ENERGY_LABEL: Record<number, string> = { 1: 'Cansado', 2: 'Normal', 3: 'Con todo' };

function formatDateES(date: Date): string {
  const day = DAYS_ES_FULL[date.getDay()];
  const d = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${d} de ${month} de ${year}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

interface SocioScore {
  total: number;
  sleep_pts: number;
  nutrition_pts: number;
  movement_pts: number;
  hydration_pts: number;
  narrative: string | null;
}

interface EnergyCheckin {
  date: string;
  energy_level: number;
}

interface DailyNutrition {
  kcal_consumed: number;
  kcal_goal: number;
  protein_g: number;
  protein_goal: number;
  water_glasses: number;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  // Fix 1: Wrap currentUser() in try/catch
  let userName = 'Atleta';
  try {
    const user = await currentUser();
    userName = user?.firstName ?? 'Atleta';
  } catch {
    // fall through to default
  }

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
  const [scoreResult, energyResult, workoutResult, nutritionResult, planResult] =
    await Promise.allSettled([
      dbUserId
        ? sql`
            SELECT total, sleep_pts, nutrition_pts, movement_pts, hydration_pts, narrative
            FROM socio_scores
            WHERE user_id = ${dbUserId}
              AND date = CURRENT_DATE
            LIMIT 1
          `
        : Promise.resolve([]),
      dbUserId
        ? sql`
            SELECT date::text, energy_level
            FROM energy_checkins
            WHERE user_id = ${dbUserId}
              AND date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY date DESC
          `
        : Promise.resolve([]),
      dbUserId
        ? sql`
            SELECT COUNT(*) as count
            FROM workout_logs
            WHERE user_id = ${dbUserId}
              AND date >= date_trunc('week', CURRENT_DATE)
              AND date <= CURRENT_DATE
          `
        : Promise.resolve([]),
      dbUserId
        ? sql`
            SELECT kcal_consumed, kcal_goal, protein_g, protein_goal, water_glasses
            FROM daily_nutrition
            WHERE user_id = ${dbUserId}
              AND date = CURRENT_DATE
            LIMIT 1
          `
        : Promise.resolve([]),
      getActivePlan(userId),
    ]);

  const socioScore: SocioScore | null =
    scoreResult.status === 'fulfilled' && scoreResult.value.length > 0
      ? (scoreResult.value[0] as unknown as SocioScore)
      : null;

  const energyCheckins: EnergyCheckin[] =
    energyResult.status === 'fulfilled'
      ? (energyResult.value as unknown as EnergyCheckin[])
      : [];

  const workoutCount: number =
    workoutResult.status === 'fulfilled'
      ? Number((workoutResult.value as unknown as Array<{ count: number }>)[0]?.count ?? 0)
      : 0;

  const nutrition: DailyNutrition | null =
    nutritionResult.status === 'fulfilled' && nutritionResult.value.length > 0
      ? (nutritionResult.value[0] as unknown as DailyNutrition)
      : null;

  const plan: { name: string } | null =
    planResult.status === 'fulfilled' ? planResult.value : null;

  // Build 7-day energy map: last 7 days starting from today - 6 days
  const today = new Date();
  const last7Days: Array<{ dateStr: string; shortLabel: string; level: number | null }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const shortLabel = DAYS_ES_SHORT[d.getDay()];
    const checkin = energyCheckins.find((c) => c.date.startsWith(dateStr));
    last7Days.push({ dateStr, shortLabel, level: checkin?.energy_level ?? null });
  }

  const energyDotColor = (level: number | null) => {
    if (level === 1) return 'bg-teal-500';
    if (level === 2) return 'bg-violet-500';
    if (level === 3) return 'bg-orange-500';
    return 'bg-zinc-700';
  };

  const kcalPct = nutrition
    ? Math.min(100, Math.round((nutrition.kcal_consumed / (nutrition.kcal_goal || 1)) * 100))
    : 0;
  const proteinPct = nutrition
    ? Math.min(100, Math.round((nutrition.protein_g / (nutrition.protein_goal || 1)) * 100))
    : 0;
  const waterGlasses = nutrition?.water_glasses ?? 0;
  const totalGlasses = 8;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{formatDateES(today)}</p>
        </div>

        {/* SOCIO Score Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-violet-400">
              {socioScore ? socioScore.total : '—'}
            </div>
            <p className="text-zinc-400 text-sm mt-1">SOCIO Score</p>
          </div>

          {/* 4-column breakdown */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { emoji: '🌙', label: 'Sueño', pts: socioScore?.sleep_pts ?? null, max: 25 },
              { emoji: '🥗', label: 'Nutrición', pts: socioScore?.nutrition_pts ?? null, max: 25 },
              { emoji: '🏃', label: 'Movimiento', pts: socioScore?.movement_pts ?? null, max: 25 },
              { emoji: '💧', label: 'Hidratación', pts: socioScore?.hydration_pts ?? null, max: 25 },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xl mb-1">{item.emoji}</div>
                <div className="text-xs text-zinc-400 mb-0.5">{item.label}</div>
                <div className="text-sm font-semibold">
                  {item.pts !== null ? `${item.pts}/${item.max}` : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <p className="text-zinc-300 text-sm italic text-center">
            {socioScore?.narrative
              ? socioScore.narrative
              : 'Completa tu check-in del día para ver tu score.'}
          </p>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Left — Esta semana (energy dots) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider mb-4">
              Esta semana · Energía
            </h2>
            {/* Fix 5: title attribute on each dot */}
            <div className="flex items-end justify-between gap-1">
              {last7Days.map((day) => {
                const dotTitle = day.level !== null
                  ? `${day.shortLabel}: ${ENERGY_LABEL[day.level] ?? 'Sin datos'}`
                  : `${day.shortLabel}: Sin datos`;
                return (
                  <div key={day.dateStr} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded-full ${energyDotColor(day.level)}`}
                      title={dotTitle}
                    />
                    <span className="text-xs text-zinc-500">{day.shortLabel}</span>
                  </div>
                );
              })}
            </div>
            {/* Fix 5: compact legend */}
            <div className="flex gap-3 mt-2">
              {[
                { color: 'bg-orange-500', label: 'Con todo' },
                { color: 'bg-violet-500', label: 'Normal' },
                { color: 'bg-teal-500', label: 'Cansado' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
            {workoutCount > 0 && (
              <p className="text-zinc-500 text-xs mt-4">
                {workoutCount} entrenamiento{workoutCount !== 1 ? 's' : ''} esta semana
              </p>
            )}
          </div>

          {/* Right — Nutrición de hoy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider mb-4">
              Nutrición de hoy
            </h2>

            {nutrition ? (
              <div className="space-y-4">
                {/* Kcal */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calorías</span>
                    <span className="text-zinc-400">
                      {nutrition.kcal_consumed} / {nutrition.kcal_goal} kcal
                    </span>
                  </div>
                  {/* Fix 4: aria attributes on progress bar fill */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${kcalPct}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(kcalPct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Calorías consumidas"
                    />
                  </div>
                </div>

                {/* Protein */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Proteína</span>
                    <span className="text-zinc-400">
                      {nutrition.protein_g}g / {nutrition.protein_goal}g
                    </span>
                  </div>
                  {/* Fix 4: aria attributes on progress bar fill */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${proteinPct}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(proteinPct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Proteína consumida"
                    />
                  </div>
                </div>

                {/* Water */}
                <div>
                  <p className="text-sm mb-1.5">Agua</p>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: totalGlasses }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-base ${i < waterGlasses ? 'opacity-100' : 'opacity-20'}`}
                      >
                        💧
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">
                Registra tu primera comida en la app móvil.
              </p>
            )}
          </div>
        </div>

        {/* Active plan banner */}
        {/* Fix 6: Remove false affordance from "Ver en app →" */}
        {plan && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-0.5">Plan activo</p>
              <p className="font-semibold">{plan.name}</p>
              <span className="text-violet-400 text-xs mt-1 inline-block">
                Generado por SOCIO AI
              </span>
            </div>
            <span className="text-zinc-500 text-sm">Ver en app móvil →</span>
          </div>
        )}
      </div>
    </div>
  );
}
