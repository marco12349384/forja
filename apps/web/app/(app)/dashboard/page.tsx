import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb, getActivePlan } from '@forja/api-client';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DAYS_ES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_ES_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

function formatDateES(date: Date): string {
  return `${DAYS_ES_FULL[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

interface SocioScore {
  total: number;
  sleep_pts: number;
  nutrition_pts: number;
  movement_pts: number;
  hydration_pts: number;
  narrative: string | null;
}

interface EnergyCheckin { date: string; energy_level: number; }

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

  let userName = 'Atleta';
  try {
    const user = await currentUser();
    userName = user?.firstName ?? 'Atleta';
  } catch {}

  const sql = getDb();
  let dbUserId: string | null = null;
  try {
    const rows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
    dbUserId = rows[0]?.id ?? null;
  } catch {}

  const [scoreResult, energyResult, workoutResult, nutritionResult, planResult] =
    await Promise.allSettled([
      dbUserId ? sql`SELECT total, sleep_pts, nutrition_pts, movement_pts, hydration_pts, narrative FROM socio_scores WHERE user_id = ${dbUserId} AND date = CURRENT_DATE LIMIT 1` : Promise.resolve([]),
      dbUserId ? sql`SELECT date::text, energy_level FROM energy_checkins WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '7 days' ORDER BY date DESC` : Promise.resolve([]),
      dbUserId ? sql`SELECT COUNT(*)::int as count FROM workout_sessions WHERE user_id = ${dbUserId} AND date >= date_trunc('week', CURRENT_DATE)` : Promise.resolve([]),
      dbUserId ? sql`SELECT kcal_consumed, kcal_goal, protein_g, protein_goal, water_glasses FROM daily_nutrition WHERE user_id = ${dbUserId} AND date = CURRENT_DATE LIMIT 1` : Promise.resolve([]),
      getActivePlan(userId),
    ]);

  const socioScore: SocioScore | null = scoreResult.status === 'fulfilled' && scoreResult.value.length > 0
    ? (scoreResult.value[0] as unknown as SocioScore) : null;
  const energyCheckins: EnergyCheckin[] = energyResult.status === 'fulfilled' ? (energyResult.value as unknown as EnergyCheckin[]) : [];
  const workoutCount = workoutResult.status === 'fulfilled' ? Number((workoutResult.value as unknown as Array<{ count: number }>)[0]?.count ?? 0) : 0;
  const nutrition: DailyNutrition | null = nutritionResult.status === 'fulfilled' && nutritionResult.value.length > 0
    ? (nutritionResult.value[0] as unknown as DailyNutrition) : null;
  const plan: { name: string } | null = planResult.status === 'fulfilled' ? planResult.value : null;

  const today = new Date();
  const last7Days: Array<{ dateStr: string; shortLabel: string; level: number | null; isToday: boolean }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const checkin = energyCheckins.find((c) => c.date.startsWith(dateStr));
    last7Days.push({
      dateStr,
      shortLabel: DAYS_ES_SHORT[d.getDay()],
      level: checkin?.energy_level ?? null,
      isToday: i === 0,
    });
  }

  const kcalGoal = nutrition?.kcal_goal ?? 2000;
  const proteinGoal = nutrition?.protein_goal ?? 180;
  const waterGlasses = nutrition?.water_glasses ?? 0;
  const totalGlasses = 12;
  const kcalPct = nutrition ? Math.min(100, Math.round((nutrition.kcal_consumed / kcalGoal) * 100)) : 0;
  const proteinPct = nutrition ? Math.min(100, Math.round((nutrition.protein_g / proteinGoal) * 100)) : 0;
  const waterPct = Math.min(100, Math.round((waterGlasses / 8) * 100));

  // Score color
  const scoreColor = !socioScore ? 'var(--muted)'
    : socioScore.total >= 75 ? 'var(--accent)'
    : socioScore.total >= 50 ? '#fbbf24'
    : 'var(--accent2)';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ════════ HERO HEADER (con imagen) ════════ */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Background: heart-rate / data monitor */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=600&fit=crop&auto=format&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(236,231,220,0.55) 0%, rgba(236,231,220,0.95) 100%)' }}
          aria-hidden
        />
        <div className="deco-text font-display">STATS</div>
        <div className="page-hero-content max-w-4xl relative">
          <div className="page-hero-tag">⚡ {MONTHS_ES[today.getMonth()].toUpperCase()} {today.getFullYear()}</div>
          <h1>
            <span style={{ color: 'var(--text)' }}>{userName.toUpperCase()},</span><br />
            <span style={{ color: 'var(--accent)' }}>VAMOS</span>
          </h1>
          <p className="text-xs sm:text-sm mt-3 uppercase tracking-[2px] font-semibold" style={{ color: 'var(--muted)' }}>
            {formatDateES(today)}{plan && <> · <span style={{ color: 'var(--text)' }}>{plan.name}</span></>}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5 sm:space-y-7">

        {/* ════════ SOCIO SCORE HERO ════════ */}
        {socioScore ? (
          <div
            className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(232,255,71,0.10), rgba(232,255,71,0.02) 80%)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <div
              aria-hidden
              className="absolute font-display select-none pointer-events-none"
              style={{
                right: '-30px', top: '-30px',
                fontSize: 'clamp(160px, 30vw, 280px)',
                fontWeight: 900,
                color: 'rgba(232,255,71,0.06)',
                lineHeight: 0.82,
              }}
            >
              {socioScore.total}
            </div>

            <div className="relative">
              <div className="text-[10px] sm:text-xs uppercase tracking-[3px] font-bold mb-2" style={{ color: 'var(--accent)' }}>
                SOCIO SCORE · HOY
              </div>
              <div className="flex items-baseline gap-3">
                <span className="stat-num" style={{ fontSize: 'clamp(72px, 14vw, 120px)', color: scoreColor }}>
                  {socioScore.total}
                </span>
                <span className="text-base sm:text-lg" style={{ color: 'var(--muted)' }}>/ 100</span>
              </div>

              {/* Narrative */}
              <p className="text-sm sm:text-base mt-3 max-w-xl" style={{ color: 'var(--text-dim)' }}>
                {socioScore.narrative || (
                  socioScore.total >= 75 ? 'Día sólido. Hoy se nota cuando entrenas.' :
                  socioScore.total >= 50 ? 'Día normal. Consistencia gana siempre.' :
                  'Score bajo. Hoy escuchamos al cuerpo, no al ego.'
                )}
              </p>

              {/* 4-component breakdown */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-6">
                {[
                  { e: '🌙', l: 'Sueño', v: socioScore.sleep_pts, color: '#a78bfa' },
                  { e: '🥗', l: 'Nutrición', v: socioScore.nutrition_pts, color: '#22c55e' },
                  { e: '🏃', l: 'Movim.', v: socioScore.movement_pts, color: 'var(--accent2)' },
                  { e: '💧', l: 'Agua', v: socioScore.hydration_pts, color: '#38bdf8' },
                ].map(({ e, l, v, color }) => (
                  <div key={l} className="card p-2 sm:p-3 text-center">
                    <div className="text-base sm:text-lg mb-1" aria-hidden>{e}</div>
                    <div className="stat-num" style={{ fontSize: 'clamp(20px, 4vw, 26px)', color }}>{v}</div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-[1.5px] mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
                      {l} <span style={{ opacity: 0.5 }}>/25</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-3" aria-hidden>📊</p>
            <h2 className="font-display text-2xl mb-2">Sin datos hoy</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Completa tu check-in del día en la app móvil para ver tu SOCIO Score.
            </p>
          </div>
        )}

        {/* ════════ MACROS RING ROW ════════ */}
        {nutrition && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>NUTRICIÓN HOY</h2>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[2px]" style={{ color: 'var(--muted)' }}>
                {nutrition.kcal_consumed} / {kcalGoal} kcal
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { name: 'Calorías', val: nutrition.kcal_consumed, goal: kcalGoal, unit: 'kcal', pct: kcalPct, color: '#38bdf8' },
                { name: 'Proteína', val: nutrition.protein_g, goal: proteinGoal, unit: 'g', pct: proteinPct, color: 'var(--accent2)' },
                { name: 'Agua', val: waterGlasses, goal: 8, unit: 'vasos', pct: waterPct, color: '#22c55e' },
              ].map((m) => (
                <div key={m.name} className="card p-3 sm:p-5 relative overflow-hidden">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="stat-num" style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: m.color }}>
                      {m.val}
                    </span>
                    <span className="text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>/{m.goal} {m.unit}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[2px] font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                    {m.name}
                  </p>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${m.pct}%`, background: m.color }}
                      role="progressbar"
                      aria-valuenow={m.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${m.name}: ${m.pct}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ ENERGY WEEK + WORKOUTS ════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Energy dots */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display text-base mb-1" style={{ letterSpacing: '1px' }}>ESTA SEMANA</h2>
            <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>Energía diaria</p>
            <div className="flex items-end justify-between gap-1">
              {last7Days.map((day) => {
                const dotColor = day.level === 3 ? 'var(--accent2)' : day.level === 2 ? 'var(--accent)' : day.level === 1 ? '#38bdf8' : 'var(--border)';
                const dotSize = day.level !== null ? 14 : 8;
                return (
                  <div key={day.dateStr} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: dotSize,
                        height: dotSize,
                        background: dotColor,
                        boxShadow: day.isToday ? '0 0 0 3px rgba(232,255,71,0.25)' : 'none',
                      }}
                      title={day.level !== null ? `${day.shortLabel}: nivel ${day.level}` : `${day.shortLabel}: sin datos`}
                    />
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold"
                      style={{ color: day.isToday ? 'var(--text)' : 'var(--muted)' }}
                    >
                      {day.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent2)' }} /> Con todo</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} /> Normal</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: '#38bdf8' }} /> Cansado</div>
            </div>
          </div>

          {/* Workouts week + monthly */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display text-base mb-1" style={{ letterSpacing: '1px' }}>ENTRENOS</h2>
            <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>Esta semana</p>
            <div className="flex items-baseline gap-2">
              <span className="stat-num" style={{ fontSize: 'clamp(48px, 10vw, 72px)', color: 'var(--accent)' }}>
                {workoutCount}
              </span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>sesiones</span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
              {workoutCount === 0 ? 'Aún no entrenas esta semana. Hoy es buen día para empezar.' :
               workoutCount < 3 ? 'Buen ritmo. Vamos por el siguiente.' :
               workoutCount < 5 ? 'Semana sólida. Sigue así.' :
               '¡Semana brutal! Cuida la recuperación.'}
            </p>
          </div>
        </div>

        {/* ════════ HIDRATACIÓN — visual 12 vasos ════════ */}
        {nutrition && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>💧 HIDRATACIÓN</h2>
                <p className="text-[10px] uppercase tracking-[2px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                  Meta: 3 litros · 12 vasos
                </p>
              </div>
              <div className="text-right">
                <span className="stat-num" style={{ fontSize: 28, color: '#38bdf8' }}>
                  {(waterGlasses * 0.25).toFixed(2).replace(/\.?0+$/, '')}L
                </span>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: 'var(--muted)' }}>{waterGlasses} vasos</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Array.from({ length: totalGlasses }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg flex items-center justify-center text-base transition-all"
                  style={{
                    width: 'clamp(32px, 7vw, 40px)',
                    height: 'clamp(32px, 7vw, 40px)',
                    background: i < waterGlasses ? 'rgba(56,189,248,0.15)' : 'var(--surface2)',
                    border: `2px solid ${i < waterGlasses ? '#38bdf8' : 'var(--border)'}`,
                    opacity: i < waterGlasses ? 1 : 0.5,
                  }}
                  aria-label={`Vaso ${i + 1} ${i < waterGlasses ? 'completado' : 'pendiente'}`}
                >
                  {i < waterGlasses ? '💧' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ REGLAS DE ORO ════════ */}
        <div className="card p-5">
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>⚡ REGLAS DE ORO</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>5 hábitos · no negociables</p>
          {[
            { i: '⚖️', t: 'Pesa la comida los primeros 15 días — sin adivinar' },
            { i: '🍳', t: 'Cocina con spray o teflón — mínimo aceite' },
            { i: '🚫', t: 'Cero alcohol de lunes a sábado' },
            { i: '😴', t: '7–8 horas de sueño — el músculo crece dormido' },
            { i: '📱', t: 'Registra cada comida con Snap & Eat en la app móvil' },
          ].map((tip, idx, arr) => (
            <div
              key={tip.t}
              className="flex items-start gap-3 py-3 text-sm"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="text-lg flex-shrink-0" aria-hidden>{tip.i}</span>
              <span>{tip.t}</span>
            </div>
          ))}
        </div>

        {/* CTA Mobile */}
        {plan && (
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[2px] font-semibold" style={{ color: 'var(--accent)' }}>Plan activo · SOCIO AI</p>
              <p className="font-display text-base sm:text-lg mt-1" style={{ letterSpacing: '0.5px' }}>{plan.name}</p>
            </div>
            <a href="/home" className="btn btn-secondary" style={{ minHeight: 40, fontSize: 12 }}>
              Ver hoy →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
