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
  return `${day} ${d} de ${month}`;
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
      dbUserId
        ? sql`
            SELECT total, sleep_pts, nutrition_pts, movement_pts, hydration_pts, narrative
            FROM socio_scores
            WHERE user_id = ${dbUserId} AND date = CURRENT_DATE LIMIT 1
          `
        : Promise.resolve([]),
      dbUserId
        ? sql`
            SELECT date::text, energy_level
            FROM energy_checkins
            WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY date DESC
          `
        : Promise.resolve([]),
      dbUserId
        ? sql`
            SELECT COUNT(*)::int as count FROM workout_sessions
            WHERE user_id = ${dbUserId} AND date >= date_trunc('week', CURRENT_DATE) AND date <= CURRENT_DATE
          `
        : Promise.resolve([]),
      dbUserId
        ? sql`
            SELECT kcal_consumed, kcal_goal, protein_g, protein_goal, water_glasses
            FROM daily_nutrition
            WHERE user_id = ${dbUserId} AND date = CURRENT_DATE LIMIT 1
          `
        : Promise.resolve([]),
      getActivePlan(userId),
    ]);

  const socioScore: SocioScore | null =
    scoreResult.status === 'fulfilled' && scoreResult.value.length > 0
      ? (scoreResult.value[0] as unknown as SocioScore)
      : null;
  const energyCheckins: EnergyCheckin[] =
    energyResult.status === 'fulfilled' ? (energyResult.value as unknown as EnergyCheckin[]) : [];
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

  const kcalGoal = nutrition?.kcal_goal ?? 2000;
  const proteinGoal = nutrition?.protein_goal ?? 180;
  const kcalPct = nutrition ? Math.min(100, Math.round((nutrition.kcal_consumed / kcalGoal) * 100)) : 0;
  const proteinPct = nutrition ? Math.min(100, Math.round((nutrition.protein_g / proteinGoal) * 100)) : 0;
  const waterGlasses = nutrition?.water_glasses ?? 0;
  const totalGlasses = 12;

  // Goal compact display (compute deficit / surplus dynamically)
  const deficitText = nutrition ? `${nutrition.kcal_consumed} / ${kcalGoal} kcal hoy` : `${kcalGoal} kcal/día`;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* HERO HEADER */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-12 relative">
          {/* Decorative FIT background */}
          <div
            aria-hidden
            className="absolute font-display pointer-events-none select-none"
            style={{
              right: '-10px', top: '-20px',
              fontSize: 'clamp(80px, 14vw, 180px)',
              fontWeight: 800,
              color: 'rgba(232,255,71,0.04)',
              lineHeight: 1,
            }}
          >
            FIT
          </div>

          <div className="text-xs font-semibold tracking-[3px] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            ⚡ Tu plan personal · {MONTHS_ES[today.getMonth()]} {today.getFullYear()}
          </div>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(36px, 8vw, 64px)', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>{userName.toUpperCase()},</span><br />
            <span style={{ color: 'var(--accent)' }}>VAMOS</span>
          </h1>
          <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
            {formatDateES(today)}
            {plan && <> · Plan: <span style={{ color: 'var(--text)' }}>{plan.name}</span></>}
          </p>

          {/* Stats pills */}
          <div className="flex gap-2 mt-5 flex-wrap">
            <span className="pill pill-hi">{kcalGoal} kcal/día</span>
            {socioScore && <span className="pill pill-hi">SOCIO Score · {socioScore.total}</span>}
            <span className="pill">{proteinGoal}g proteína</span>
            {workoutCount > 0 && (
              <span className="pill">{workoutCount} entreno{workoutCount !== 1 ? 's' : ''} esta semana</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* SOCIO SCORE — Editorial style */}
        {socioScore ? (
          <div
            className="rounded-2xl p-6 flex items-center gap-6"
            style={{
              background: 'linear-gradient(135deg, rgba(232,255,71,0.12), rgba(232,255,71,0.04))',
              border: '1px solid rgba(232,255,71,0.2)',
            }}
          >
            <div>
              <div className="text-xs uppercase tracking-[2px] mb-1" style={{ color: 'var(--muted)' }}>
                SOCIO Score
              </div>
              <div className="font-display leading-none" style={{ fontSize: '56px', fontWeight: 800, color: 'var(--accent)' }}>
                {socioScore.total}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>de 100</div>
            </div>
            <div className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {socioScore.narrative ? (
                <p style={{ color: 'var(--text)' }}>{socioScore.narrative}</p>
              ) : (
                <p>Día completado. Sigue así para subir mañana.</p>
              )}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[
                  { e: '🌙', l: 'Sueño', v: socioScore.sleep_pts },
                  { e: '🥗', l: 'Nutri', v: socioScore.nutrition_pts },
                  { e: '🏃', l: 'Movim.', v: socioScore.movement_pts },
                  { e: '💧', l: 'H2O', v: socioScore.hydration_pts },
                ].map(({ e, l, v }) => (
                  <div key={l} className="text-center">
                    <div className="text-base">{e}</div>
                    <div className="font-display text-sm" style={{ color: 'var(--accent)' }}>{v}/25</div>
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p style={{ color: 'var(--muted)' }}>Completa tu check-in del día en la app móvil para ver tu SOCIO Score.</p>
          </div>
        )}

        {/* MACROS GRID 3 cols */}
        {nutrition && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'Proteína', val: nutrition.protein_g, goal: proteinGoal, color: '#f97316', kcal: Math.round(nutrition.protein_g * 4) },
              { name: 'Calorías', val: nutrition.kcal_consumed, goal: kcalGoal, color: '#38bdf8', kcal: nutrition.kcal_consumed },
              { name: 'Agua', val: nutrition.water_glasses, goal: 12, color: '#22c55e', kcal: 0 },
            ].map((m) => (
              <div
                key={m.name}
                className="rounded-2xl p-3 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: m.color, lineHeight: 1 }}>
                  {m.val}
                  <span className="text-xs ml-0.5" style={{ color: 'var(--muted)' }}>
                    {m.name === 'Proteína' ? 'g' : m.name === 'Agua' ? '' : ''}
                  </span>
                </div>
                {m.kcal > 0 && (
                  <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{m.kcal} kcal</div>
                )}
                <div className="text-[9px] uppercase tracking-[2px] mt-1" style={{ color: 'var(--muted)' }}>
                  {m.name} / {m.goal}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ESTA SEMANA — energy dots */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-display text-base mb-4" style={{ fontWeight: 700 }}>
            Esta semana
          </h2>
          <div className="flex items-end justify-between gap-1">
            {last7Days.map((day) => {
              const dotColor = day.level === 3 ? '#ff6b35' : day.level === 2 ? 'var(--accent)' : day.level === 1 ? '#38bdf8' : 'var(--border)';
              return (
                <div key={day.dateStr} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: dotColor }}
                    title={day.level !== null ? `${day.shortLabel}: ${ENERGY_LABEL[day.level]}` : `${day.shortLabel}: sin datos`}
                  />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    {day.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-[10px]" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: '#ff6b35' }} /> Con todo</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} /> Normal</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: '#38bdf8' }} /> Cansado</div>
          </div>
        </div>

        {/* AGUA TRACKER — visual 12 vasos */}
        {nutrition && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="font-display text-base" style={{ fontWeight: 700 }}>💧 Hidratación</h2>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Meta: 3 litros · {(waterGlasses * 0.25).toFixed(2).replace(/\.?0+$/, '')} litros 💧
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalGlasses }).map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                  style={{
                    background: i < waterGlasses ? 'rgba(56,189,248,0.15)' : 'var(--surface2)',
                    border: `2px solid ${i < waterGlasses ? '#38bdf8' : 'var(--border)'}`,
                  }}
                >
                  💧
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIPS — Reglas de oro */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-display text-base mb-3" style={{ fontWeight: 700 }}>⚡ Reglas de oro</h2>
          {[
            { i: '⚖️', t: 'Pesa la comida los primeros 15 días — sin adivinar' },
            { i: '🍳', t: 'Cocina con spray o teflón — mínimo aceite' },
            { i: '🚫', t: '0 alcohol de lunes a sábado' },
            { i: '😴', t: '7-8 horas de sueño — el músculo crece dormido' },
            { i: '📱', t: 'Registra cada comida con Snap & Eat en la app móvil' },
          ].map((tip, idx, arr) => (
            <div
              key={tip.t}
              className="flex items-start gap-3 py-2 text-sm"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="text-base flex-shrink-0">{tip.i}</span>
              <span>{tip.t}</span>
            </div>
          ))}
        </div>

        {/* CTA — Active plan banner */}
        {plan && (
          <div
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))',
              border: '1px solid rgba(255,107,53,0.2)',
            }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[2px] mb-1" style={{ color: 'var(--muted)' }}>Plan activo</p>
              <p className="font-display text-lg" style={{ fontWeight: 700 }}>{plan.name}</p>
              <span className="text-xs mt-1 inline-block" style={{ color: 'var(--accent2)' }}>
                Generado por SOCIO AI
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>App móvil →</span>
          </div>
        )}
      </div>
    </div>
  );
}
