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

  const [scoresResult, energyResult, nutritionResult, sessionsResult, weekSessionsResult] = await Promise.allSettled([
    dbUserId ? sql`SELECT date::text, total FROM socio_scores WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY date ASC` : Promise.resolve([]),
    dbUserId ? sql`SELECT date::text, energy_level FROM energy_checkins WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY date ASC` : Promise.resolve([]),
    dbUserId ? sql`SELECT date_trunc('week', date)::text AS week_start, ROUND(AVG(kcal_consumed)) AS avg_kcal, ROUND(AVG(protein_g)) AS avg_protein FROM daily_nutrition WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '28 days' GROUP BY date_trunc('week', date) ORDER BY date_trunc('week', date) ASC` : Promise.resolve([]),
    dbUserId ? sql`SELECT COUNT(*)::int AS n FROM workout_sessions WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '56 days'` : Promise.resolve([]),
    dbUserId ? sql`SELECT COUNT(*)::int AS n FROM workout_sessions WHERE user_id = ${dbUserId} AND date >= date_trunc('week', CURRENT_DATE)` : Promise.resolve([]),
  ]);

  const scores: ScoreRow[] = scoresResult.status === 'fulfilled' ? (scoresResult.value as unknown as ScoreRow[]) : [];
  const energyHistory: EnergyRow[] = energyResult.status === 'fulfilled' ? (energyResult.value as unknown as EnergyRow[]) : [];
  const weeklyNutrition: NutritionWeekRow[] = nutritionResult.status === 'fulfilled' ? (nutritionResult.value as unknown as NutritionWeekRow[]) : [];
  const totalSessions = sessionsResult.status === 'fulfilled' ? Number((sessionsResult.value as unknown as Array<{ n: number }>)[0]?.n ?? 0) : 0;
  const weekSessions = weekSessionsResult.status === 'fulfilled' ? Number((weekSessionsResult.value as unknown as Array<{ n: number }>)[0]?.n ?? 0) : 0;

  const today = new Date();
  const last30Dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last30Dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const scoreMap = new Map(scores.map((s) => [s.date.slice(0, 10), s.total]));
  const energyMap = new Map(energyHistory.map((e) => [e.date.slice(0, 10), e.energy_level]));

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + Number(s.total), 0) / scores.length) : null;
  const maxScore = scores.length > 0 ? Math.max(...scores.map(s => Number(s.total))) : null;
  const minScore = scores.length > 0 ? Math.min(...scores.map(s => Number(s.total))) : null;

  // Compute current week of 8-week journey
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
      {/* ════════ HERO (con imagen de atleta corriendo / progresión) ════════ */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1486218119243-13883505764c?w=1600&h=600&fit=crop&auto=format&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(255,107,53,0.12) 0%, rgba(255,255,255,0.92) 100%)' }}
          aria-hidden
        />
        <div className="deco-text font-display">EVO</div>
        <div className="page-hero-content max-w-4xl relative">
          <div className="page-hero-tag">⚡ ÚLTIMOS 30 DÍAS</div>
          <h1>
            <span style={{ color: 'var(--text)' }}>TU</span>{' '}
            <span style={{ color: 'var(--accent)' }}>EVOLUCIÓN</span>
          </h1>
          <p className="text-xs sm:text-sm mt-3 uppercase tracking-[2px] font-semibold" style={{ color: 'var(--muted)' }}>
            Semana <span style={{ color: 'var(--text)' }}>{currentWeek}</span> de 8 · Total <span style={{ color: 'var(--text)' }}>{totalSessions}</span> entrenos
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5 sm:space-y-7">

        {/* ════════ TOP STATS BAR ════════ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="card p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="stat-num" style={{ fontSize: 'clamp(32px, 8vw, 52px)', color: 'var(--accent)' }}>
                {avgScore ?? '—'}
              </span>
              {avgScore !== null && <span className="text-xs" style={{ color: 'var(--muted)' }}>/100</span>}
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[2px] mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
              Score Promedio
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--accent)', opacity: avgScore !== null ? 1 : 0.2 }} />
          </div>

          <div className="card p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="stat-num" style={{ fontSize: 'clamp(32px, 8vw, 52px)', color: '#22c55e' }}>
                {maxScore ?? '—'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[2px] mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
              Mejor Día
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: '#22c55e', opacity: maxScore !== null ? 1 : 0.2 }} />
          </div>

          <div className="card p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="stat-num" style={{ fontSize: 'clamp(32px, 8vw, 52px)', color: 'var(--accent2)' }}>
                {weekSessions}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>/sem</span>
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[2px] mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
              Entrenos
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--accent2)', opacity: weekSessions > 0 ? 1 : 0.2 }} />
          </div>
        </div>

        {/* ════════ TIMELINE 8 SEMANAS (con banner de imagen) ════════ */}
        <div className="card overflow-hidden">
          {/* Banner image */}
          <div
            className="relative h-32 sm:h-40"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1400&h=400&fit=crop&auto=format&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(22,22,22,0.95) 100%)' }}
              aria-hidden
            />
            <div className="absolute inset-0 flex items-end p-5 sm:p-6">
              <div className="flex items-end justify-between w-full">
                <div>
                  <h2 className="font-display" style={{ fontSize: 'clamp(20px, 5vw, 28px)', letterSpacing: '1px', color: '#fff', fontWeight: 900 }}>
                    📈 TU CAMINO
                  </h2>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[2px] font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Plan 8 semanas · Estás en semana {currentWeek}
                  </p>
                </div>
                <div className="text-right">
                  <span className="stat-num" style={{ fontSize: 'clamp(32px, 7vw, 48px)', color: 'var(--accent)' }}>{currentWeek}</span>
                  <p className="text-[10px] uppercase tracking-[1.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>de 8</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6">

          <div className="relative pl-6">
            <div className="absolute left-2 top-3 bottom-3 w-0.5" style={{ background: 'var(--border)' }} />
            {phases.map((p, idx) => {
              const isNow = p.weeks.includes(currentWeek);
              const isDone = p.weeks.every((w) => w < currentWeek);
              const dotColor = isNow ? 'var(--accent)' : isDone ? '#22c55e' : 'var(--border)';
              const badge = isNow ? 'AHORA' : isDone ? 'DONE' : null;
              return (
                <div key={p.range} className="relative mb-5 pl-5 last:mb-0">
                  <div
                    className="absolute w-4 h-4 rounded-full"
                    style={{
                      left: '-22px',
                      top: '4px',
                      background: dotColor,
                      border: '3px solid var(--bg)',
                      boxShadow: isNow ? '0 0 0 4px rgba(232,255,71,0.18)' : 'none',
                    }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-sm sm:text-base" style={{ letterSpacing: '1px' }}>
                      {p.range}
                    </span>
                    {badge && (
                      <span
                        className="text-[9px] uppercase tracking-[1.5px] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: isNow ? 'rgba(232,255,71,0.15)' : 'rgba(34,197,94,0.15)',
                          color: isNow ? 'var(--accent)' : '#22c55e',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm mt-1.5" style={{ color: isNow ? 'var(--text)' : 'var(--muted)' }}>
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* ════════ SOCIO SCORE CHART 30D ════════ */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>SOCIO SCORE</h2>
              <p className="text-[10px] uppercase tracking-[2px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                Últimos 30 días
              </p>
            </div>
            {avgScore !== null && (
              <div className="text-right">
                <span className="stat-num" style={{ fontSize: 36, color: 'var(--accent)' }}>{avgScore}</span>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: 'var(--muted)' }}>promedio</p>
              </div>
            )}
          </div>
          <div className="flex items-end gap-0.5" style={{ height: 'clamp(80px, 18vw, 140px)' }}>
            {last30Dates.map((dateStr) => {
              const score = scoreMap.get(dateStr);
              if (score === undefined) {
                return <div key={dateStr} className="flex-1 rounded-sm" style={{ height: '4px', background: 'var(--border)' }} title={`${dateStr}: sin datos`} />;
              }
              const heightPct = Math.max(3, Math.round((score / 100) * 100));
              const color = score >= 75 ? 'var(--accent)' : score >= 50 ? '#fbbf24' : 'var(--accent2)';
              return (
                <div
                  key={dateStr}
                  className="flex-1 rounded-sm transition-all"
                  style={{ height: `${heightPct}%`, background: color }}
                  title={`${dateStr.slice(5)}: ${score}/100`}
                />
              );
            })}
          </div>
          {scores.length > 0 ? (
            <div className="flex justify-between mt-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
              <span>hace 30 días</span>
              <span>{minScore !== null && `min · ${minScore}`}</span>
              <span>hoy</span>
            </div>
          ) : (
            <p className="text-sm text-center mt-4" style={{ color: 'var(--muted)' }}>
              Completa check-ins diarios para ver tu historial.
            </p>
          )}
        </div>

        {/* ════════ ENERGY DOTS 30D (heatmap) ════════ */}
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>ENERGÍA DIARIA</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mt-0.5 mb-5" style={{ color: 'var(--muted)' }}>
            Heatmap · 30 días
          </p>
          <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
            {last30Dates.map((dateStr) => {
              const level = energyMap.get(dateStr);
              const color = level === 3 ? 'var(--accent2)' : level === 2 ? 'var(--accent)' : level === 1 ? '#38bdf8' : 'var(--surface2)';
              const opacity = level !== undefined ? 1 : 0.5;
              return (
                <div
                  key={dateStr}
                  className="aspect-square rounded-md"
                  style={{ background: color, opacity }}
                  title={`${dateStr.slice(5)}: ${level !== undefined ? `nivel ${level}` : 'sin datos'}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent2)' }} /> Con todo</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} /> Normal</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#38bdf8' }} /> Cansado</div>
          </div>
        </div>

        {/* ════════ WEEKLY KCAL ════════ */}
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>CALORÍAS</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mt-0.5 mb-5" style={{ color: 'var(--muted)' }}>
            Promedio por semana
          </p>
          {weeklyNutrition.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Empieza a registrar comidas para ver tu historial semanal.
            </p>
          ) : (
            <div className="space-y-3">
              {weeklyNutrition.map((week, idx) => {
                const kcal = Number(week.avg_kcal);
                const widthPct = Math.min(100, Math.round((kcal / KCAL_MAX) * 100));
                return (
                  <div key={week.week_start} className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold w-12 shrink-0" style={{ color: 'var(--muted)' }}>
                      SEM {idx + 1}
                    </span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${widthPct}%`, background: 'var(--accent2)' }}
                        role="progressbar"
                        aria-valuenow={Math.round(widthPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <span className="stat-num text-right shrink-0" style={{ fontSize: 18, color: 'var(--accent)', minWidth: 80 }}>
                      {kcal}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>kcal</span>
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
