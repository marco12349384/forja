import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { getActivePlan, getTodayWorkout, getDb } from '@forja/api-client';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DAYS_ES_DISPLAY: Record<string, string> = {
  domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes',
  miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

// Cover image + tint per workout type
const TYPE_COVER: Record<string, { img: string; tint: string; label: string; equipment: string }> = {
  calistenia: {
    img: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(255,107,53,0.18) 0%, rgba(0,0,0,0.82) 100%)',
    label: 'CALISTENIA',
    equipment: 'SIN EQUIPO',
  },
  gym: {
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(232,255,71,0.15) 0%, rgba(0,0,0,0.83) 100%)',
    label: 'GYM',
    equipment: 'PESAS · BARRA',
  },
  cardio: {
    img: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(255,61,113,0.18) 0%, rgba(0,0,0,0.84) 100%)',
    label: 'CARDIO',
    equipment: 'SIN EQUIPO',
  },
  home: {
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(167,139,250,0.16) 0%, rgba(0,0,0,0.82) 100%)',
    label: 'CASA',
    equipment: 'MÍNIMO EQUIPO',
  },
  yoga: {
    img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(106,190,167,0.18) 0%, rgba(0,0,0,0.8) 100%)',
    label: 'YOGA',
    equipment: 'MAT',
  },
  movilidad: {
    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(56,189,248,0.16) 0%, rgba(0,0,0,0.82) 100%)',
    label: 'MOVILIDAD',
    equipment: 'SIN EQUIPO',
  },
  pilates: {
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1400&h=900&fit=crop&auto=format&q=85',
    tint: 'linear-gradient(180deg, rgba(236,72,153,0.16) 0%, rgba(0,0,0,0.82) 100%)',
    label: 'PILATES',
    equipment: 'MAT',
  },
};

// Honest SOCIO messages — rotate by hour and score state
function getSocioMessage(score: number | null, hour: number): { quote: string; tone: string } {
  // No score yet
  if (score === null) {
    if (hour < 11) return { quote: 'Buenos días. Hoy empezamos sin excusas.', tone: 'wake' };
    if (hour < 18) return { quote: 'La tarde es tuya. ¿Lista la mente?', tone: 'midday' };
    return { quote: 'Noche tranquila. Mañana arrancamos fuerte.', tone: 'evening' };
  }
  // Recovery mode (<50)
  if (score < 50) return { quote: 'Score bajo. Hoy escuchamos al cuerpo, no al ego.', tone: 'rest' };
  // Medium (50-75)
  if (score < 75) return { quote: 'Día normal. Consistencia > intensidad.', tone: 'steady' };
  // High (75+)
  return { quote: 'Día sólido. Hoy se nota.', tone: 'peak' };
}

interface SocioScore { total: number; sleep_pts: number; nutrition_pts: number; movement_pts: number; hydration_pts: number; }

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const userName = user?.firstName ?? 'Atleta';

  const sql = getDb();

  // Resolve DB user id
  let dbUserId: string | null = null;
  try {
    const rows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
    dbUserId = rows[0]?.id ?? null;
  } catch {}

  const plan = await getActivePlan(userId);
  const todayName = DAYS_ES[new Date().getDay()];

  // Parallel queries: today's workout, socio score, weekly sessions
  const [todayWorkoutResult, socioScoreResult, weekSessionsResult, streakResult] = await Promise.allSettled([
    plan ? getTodayWorkout(plan.id, todayName) : Promise.resolve(null),
    dbUserId
      ? sql`SELECT total, sleep_pts, nutrition_pts, movement_pts, hydration_pts FROM socio_scores WHERE user_id = ${dbUserId} AND date = CURRENT_DATE LIMIT 1`
      : Promise.resolve([]),
    dbUserId
      ? sql`SELECT COUNT(*)::int AS n FROM workout_sessions WHERE user_id = ${dbUserId} AND date >= date_trunc('week', CURRENT_DATE)`
      : Promise.resolve([]),
    dbUserId
      ? sql`
          WITH active_days AS (
            SELECT DISTINCT date FROM workout_sessions WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '60 days'
            UNION
            SELECT DISTINCT date FROM energy_checkins WHERE user_id = ${dbUserId} AND date >= CURRENT_DATE - INTERVAL '60 days'
          )
          SELECT COUNT(*)::int AS streak FROM active_days WHERE date > (
            SELECT COALESCE(MAX(d), CURRENT_DATE - INTERVAL '61 days')
            FROM (SELECT date AS d, LAG(date) OVER (ORDER BY date DESC) AS prev FROM active_days) g
            WHERE prev IS NULL OR (prev - d) > 1
          )
        `
      : Promise.resolve([]),
  ]);

  const todayWorkout = todayWorkoutResult.status === 'fulfilled' ? todayWorkoutResult.value : null;
  const socioScore: SocioScore | null = socioScoreResult.status === 'fulfilled' && socioScoreResult.value.length > 0
    ? (socioScoreResult.value[0] as unknown as SocioScore) : null;
  const weekSessions = weekSessionsResult.status === 'fulfilled'
    ? Number((weekSessionsResult.value as unknown as Array<{ n: number }>)[0]?.n ?? 0) : 0;
  const streakDays = streakResult.status === 'fulfilled'
    ? Number((streakResult.value as unknown as Array<{ streak: number }>)[0]?.streak ?? 0) : 0;

  const cover = todayWorkout ? (TYPE_COVER[todayWorkout.type] ?? TYPE_COVER.home) : null;
  const hour = new Date().getHours();
  const socioMsg = getSocioMessage(socioScore?.total ?? null, hour);

  // Score ring color
  const scoreColor = !socioScore ? 'var(--muted)'
    : socioScore.total >= 75 ? 'var(--accent)'
    : socioScore.total >= 50 ? '#fbbf24'
    : 'var(--accent2)';

  return (
    <div className="min-h-screen pb-24 sm:pb-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ════════ HERO HEADER ════════ */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="deco-text font-display">HOY</div>
        <div className="page-hero-content max-w-3xl">
          <div className="page-hero-tag">⚡ {DAYS_ES_DISPLAY[todayName].toUpperCase()}</div>
          <h1>
            <span style={{ color: 'var(--text)' }}>HOLA</span>{' '}
            <span style={{ color: 'var(--accent)' }}>{userName.toUpperCase()}</span>
          </h1>
          {plan && (
            <p className="text-xs sm:text-sm mt-3 uppercase tracking-[2px] font-semibold" style={{ color: 'var(--muted)' }}>
              Plan · <span style={{ color: 'var(--text)' }}>{plan.name}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5 sm:space-y-7">

        {/* ════════ TOP STATS BAR (Whoop-style) ════════ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* SOCIO SCORE */}
          <div className="card p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="stat-num" style={{ fontSize: 'clamp(36px, 9vw, 56px)', color: scoreColor }}>
                {socioScore?.total ?? '—'}
              </span>
              {socioScore && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>/100</span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[2px] mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
              Socio Score
            </p>
            {/* Color indicator strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: scoreColor }} />
          </div>

          {/* STREAK */}
          <div className="card p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="stat-num" style={{ fontSize: 'clamp(36px, 9vw, 56px)', color: 'var(--accent)' }}>
                {streakDays}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {streakDays === 1 ? 'día' : 'días'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[2px] mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
              Racha
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--accent)', opacity: streakDays > 0 ? 1 : 0.2 }} />
          </div>

          {/* WEEK SESSIONS */}
          <div className="card p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="stat-num" style={{ fontSize: 'clamp(36px, 9vw, 56px)', color: 'var(--accent2)' }}>
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

        {/* ════════ SOCIO MESSAGE (editorial, unique to PULSO) ════════ */}
        <div className="relative pl-5" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div className="text-[10px] uppercase tracking-[3px] font-bold mb-1.5" style={{ color: 'var(--accent)' }}>
            SOCIO · TU IA
          </div>
          <p
            className="font-display text-xl sm:text-2xl"
            style={{ fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'none' }}
          >
            "{socioMsg.quote}"
          </p>
        </div>

        {/* ════════ HERO WORKOUT CARD ════════ */}
        {todayWorkout && cover ? (
          <Link href={`/workout/${todayWorkout.id}`} className="block group" aria-label={`Iniciar ${todayWorkout.name}`}>
            <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 380 }}>
              {/* Cover image */}
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                style={{
                  backgroundImage: `url('${cover.img}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-hidden
              />
              {/* Tinted overlay */}
              <div className="absolute inset-0" style={{ background: cover.tint }} aria-hidden />
              {/* Deco letters */}
              <div
                aria-hidden
                className="absolute font-display select-none pointer-events-none"
                style={{
                  right: '-30px', bottom: '-40px',
                  fontSize: 'clamp(140px, 26vw, 280px)',
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.06)',
                  lineHeight: 0.82,
                  textTransform: 'uppercase',
                }}
              >
                {cover.label.slice(0, 4)}
              </div>

              <div className="relative p-6 sm:p-8 flex flex-col justify-between" style={{ minHeight: 380 }}>
                {/* TOP META */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] sm:text-xs font-bold tracking-[3px] uppercase" style={{ color: '#fff' }}>
                      Tu entreno · {cover.label}
                    </div>
                    <div className="flex gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full font-display text-[10px] tracking-[1px]"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(12px)',
                          color: '#fff',
                          fontWeight: 800,
                        }}
                      >
                        {cover.equipment}
                      </span>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-full font-display text-xs tracking-[1px]"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(12px)',
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    {todayWorkout.estimated_duration_min} MIN
                  </div>
                </div>

                {/* BOTTOM: title + meta + CTA */}
                <div>
                  <h2
                    className="font-display"
                    style={{
                      color: '#fff',
                      fontSize: 'clamp(38px, 8vw, 64px)',
                      lineHeight: 0.88,
                      fontWeight: 900,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {todayWorkout.name.toUpperCase()}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[11px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <span className="font-bold uppercase tracking-[1.5px]">
                      Nivel · {todayWorkout.difficulty}
                    </span>
                    <span className="opacity-50">·</span>
                    <span className="font-bold uppercase tracking-[1.5px]">
                      {(todayWorkout.exercises?.length ?? 0)} ejercicios
                    </span>
                    <span className="opacity-50">·</span>
                    <span className="font-bold uppercase tracking-[1.5px]">
                      ≈ {Math.round((todayWorkout.estimated_duration_min ?? 30) * 7)} kcal
                    </span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 mt-5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-display transition-transform group-hover:scale-105"
                    style={{
                      background: '#fff',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '14px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    ▶ Iniciar ahora
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          /* Rest day or no plan — WITH IMAGE */
          <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 380 }}>
            {plan ? (
              <>
                {/* Rest day image — serene recovery scene */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&h=900&fit=crop&auto=format&q=85)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(167,139,250,0.15) 0%, rgba(0,0,0,0.85) 100%)' }}
                  aria-hidden
                />
                <div
                  aria-hidden
                  className="absolute font-display select-none pointer-events-none"
                  style={{
                    right: '-30px', bottom: '-40px',
                    fontSize: 'clamp(140px, 26vw, 240px)',
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.06)',
                    lineHeight: 0.82,
                  }}
                >
                  REST
                </div>
                <div className="relative p-8 sm:p-12 flex flex-col justify-center items-center text-center" style={{ minHeight: 380 }}>
                  <p className="text-5xl mb-4" aria-hidden>🌙</p>
                  <div className="text-[10px] sm:text-xs font-bold tracking-[3px] uppercase mb-2" style={{ color: '#fff' }}>
                    Día de recuperación activa
                  </div>
                  <h2
                    className="font-display"
                    style={{
                      color: '#fff',
                      fontSize: 'clamp(36px, 8vw, 64px)',
                      lineHeight: 0.88,
                      fontWeight: 900,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    DÍA DE DESCANSO
                  </h2>
                  <p className="text-sm sm:text-base mt-4 max-w-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Tu cuerpo crece descansando. Hoy: hidrátate, duerme y vuelve mañana con todo.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=900&fit=crop&auto=format&q=85)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(232,255,71,0.15) 0%, rgba(0,0,0,0.85) 100%)' }}
                  aria-hidden
                />
                <div className="relative p-8 sm:p-12 flex flex-col justify-center items-center text-center" style={{ minHeight: 380 }}>
                  <p className="text-5xl mb-4" aria-hidden>⚡</p>
                  <h2 className="font-display" style={{ color: '#fff', fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: 900 }}>
                    EMPIEZA AQUÍ
                  </h2>
                  <p className="text-sm sm:text-base mt-3 mb-6 max-w-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Genera tu plan personalizado con SOCIO en 30 segundos.
                  </p>
                  <Link href="/onboarding" className="btn btn-primary">
                    Crear mi plan
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════ EXERCISE PREVIEW ════════ */}
        {todayWorkout && (todayWorkout.exercises?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>
                EJERCICIOS DE HOY
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                {todayWorkout.exercises?.length ?? 0} total
              </span>
            </div>
            <div className="space-y-2">
              {todayWorkout.exercises?.slice(0, 5).map((ex: any, i: number) => (
                <div key={ex.id} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <span
                    className="font-display flex-shrink-0 w-10 sm:w-12 text-center"
                    style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 'clamp(22px, 5vw, 28px)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate uppercase tracking-wide text-sm">
                      {ex.catalog?.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted)' }}>
                      {ex.catalog?.type || 'ejercicio'} · descanso {ex.rest_seconds}s
                    </p>
                  </div>
                  <span className="set-pill">
                    {ex.sets}×{ex.reps}
                  </span>
                </div>
              ))}
              {(todayWorkout.exercises?.length ?? 0) > 5 && (
                <p className="text-xs text-center pt-1" style={{ color: 'var(--muted)' }}>
                  +{(todayWorkout.exercises?.length ?? 0) - 5} más al iniciar el entreno
                </p>
              )}
            </div>
          </div>
        )}

        {/* ════════ EXPLORE GRID ════════ */}
        <div>
          <h3 className="font-display text-base sm:text-lg mb-3" style={{ letterSpacing: '1px' }}>
            EXPLORAR
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {[
              {
                href: '/dashboard',
                name: 'Stats',
                desc: 'SOCIO Score · macros · agua',
                img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(232,255,71,0.15) 0%, rgba(0,0,0,0.78) 100%)',
              },
              {
                href: '/progress',
                name: 'Progreso',
                desc: '30 días · timeline 8 sem',
                img: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(255,107,53,0.2) 0%, rgba(0,0,0,0.8) 100%)',
              },
              {
                href: '/library',
                name: 'Ejercicios',
                desc: 'Biblioteca completa',
                img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(167,139,250,0.15) 0%, rgba(0,0,0,0.78) 100%)',
              },
              {
                href: '/settings',
                name: 'Ajustes',
                desc: 'Tema · cuenta',
                img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0.78) 100%)',
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="relative rounded-2xl overflow-hidden group"
                style={{ aspectRatio: '1.15 / 1', minHeight: 150 }}
                aria-label={a.name}
              >
                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
                  style={{
                    backgroundImage: `url('${a.img}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0" style={{ background: a.tint }} aria-hidden />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <p
                    className="font-display"
                    style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(22px, 5vw, 28px)', letterSpacing: '-0.01em', lineHeight: 0.95 }}
                  >
                    {a.name.toUpperCase()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {a.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ STICKY CTA (mobile only) ════════ */}
      {todayWorkout && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t safe-bottom"
          style={{
            background: 'rgba(13,13,13,0.92)',
            backdropFilter: 'blur(20px)',
            borderColor: 'var(--border)',
            paddingTop: '12px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <Link
            href={`/workout/${todayWorkout.id}`}
            className="btn btn-primary w-full"
            style={{ fontSize: '14px', minHeight: 52 }}
          >
            ▶ Iniciar {cover?.label.toLowerCase()} · {todayWorkout.estimated_duration_min} min
          </Link>
        </div>
      )}
    </div>
  );
}
