import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DAYS_ES_DISPLAY: Record<string, string> = {
  domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes',
  miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

// Gradient cover per workout type (Nike-style)
const TYPE_COVER: Record<string, { gradient: string; label: string }> = {
  calistenia: { gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', label: 'CALISTENIA' },
  gym:        { gradient: 'linear-gradient(135deg, #E8FF47 0%, #B8DD0F 100%)', label: 'GYM' },
  cardio:     { gradient: 'linear-gradient(135deg, #FF3D71 0%, #C70039 100%)', label: 'CARDIO' },
  home:       { gradient: 'linear-gradient(135deg, #A78BFA 0%, #6B21A8 100%)', label: 'CASA' },
  yoga:       { gradient: 'linear-gradient(135deg, #6ABEA7 0%, #2D8F7C 100%)', label: 'YOGA' },
  movilidad:  { gradient: 'linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)', label: 'MOVILIDAD' },
  pilates:    { gradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', label: 'PILATES' },
};

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const userName = user?.firstName ?? 'Atleta';

  const plan = await getActivePlan(userId);
  const todayName = DAYS_ES[new Date().getDay()];
  const todayWorkout = plan ? await getTodayWorkout(plan.id, todayName) : null;

  const cover = todayWorkout ? (TYPE_COVER[todayWorkout.type] ?? TYPE_COVER.home) : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Hero header — Nike style: gigantic name */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="deco-text font-display">HOY</div>
        <div className="page-hero-content max-w-3xl">
          <div className="page-hero-tag">⚡ {DAYS_ES_DISPLAY[todayName]}</div>
          <h1>
            <span style={{ color: 'var(--text)' }}>HOLA</span>{' '}
            <span style={{ color: 'var(--accent)' }}>{userName.toUpperCase()}</span>
          </h1>
          {plan && (
            <p className="text-sm mt-4 uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
              Plan · <span style={{ color: 'var(--text)' }}>{plan.name}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── HERO WORKOUT CARD (Nike-style with cover) ── */}
        {todayWorkout && cover ? (
          <Link href={`/workout/${todayWorkout.id}`} className="block group" aria-label={`Iniciar ${todayWorkout.name}`}>
            <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 280 }}>
              {/* Cover gradient */}
              <div className="absolute inset-0" style={{ background: cover.gradient }} aria-hidden />
              {/* Dark overlay for readability */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)' }}
                aria-hidden
              />
              {/* Decorative pattern */}
              <div
                aria-hidden
                className="absolute font-display select-none pointer-events-none"
                style={{
                  right: '-20px', bottom: '-30px',
                  fontSize: 'clamp(120px, 22vw, 240px)',
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.08)',
                  lineHeight: 0.85,
                  textTransform: 'uppercase',
                }}
              >
                {cover.label.slice(0, 4)}
              </div>

              {/* Content */}
              <div className="relative p-6 sm:p-8 flex flex-col h-full" style={{ minHeight: 280 }}>
                <div className="flex items-start justify-between mb-auto">
                  <div className="text-xs font-bold tracking-[3px] uppercase" style={{ color: '#fff' }}>
                    ⚡ Tu entreno · {cover.label}
                  </div>
                  <div
                    className="px-3 py-1 rounded-full font-display text-xs"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      fontWeight: 800,
                      letterSpacing: '1px',
                    }}
                  >
                    {todayWorkout.estimated_duration_min} MIN
                  </div>
                </div>

                <div className="mt-12">
                  <h2
                    className="font-display"
                    style={{
                      color: '#fff',
                      fontSize: 'clamp(40px, 8vw, 60px)',
                      lineHeight: 0.92,
                      fontWeight: 900,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {todayWorkout.name.toUpperCase()}
                  </h2>

                  <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <span className="font-bold uppercase tracking-wider">
                      📊 {todayWorkout.difficulty}
                    </span>
                    <span>•</span>
                    <span className="font-bold uppercase tracking-wider">
                      💪 {(todayWorkout.exercises?.length ?? 0)} ejercicios
                    </span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full font-display transition-transform group-hover:scale-105"
                    style={{
                      background: '#fff',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '15px',
                      letterSpacing: '1px',
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
          /* Rest day or no plan */
          <div className="card p-10 text-center" style={{ minHeight: 240 }}>
            {plan ? (
              <>
                <p className="text-5xl mb-4">🌙</p>
                <h2 className="font-display text-3xl" style={{ fontWeight: 800 }}>Día de descanso</h2>
                <p className="text-sm mt-3 max-w-xs mx-auto" style={{ color: 'var(--muted)' }}>
                  Tu cuerpo crece descansando. Aprovecha para recargar.
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl mb-4">⚡</p>
                <h2 className="font-display text-3xl" style={{ fontWeight: 800 }}>Empieza aquí</h2>
                <p className="text-sm mt-3 mb-6 max-w-sm mx-auto" style={{ color: 'var(--muted)' }}>
                  Genera tu plan personalizado con SOCIO en 30 segundos.
                </p>
                <Link href="/onboarding" className="btn btn-primary inline-flex">
                  Crear mi plan
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── EXERCISE PREVIEW (collapsible-feel) ── */}
        {todayWorkout && (todayWorkout.exercises?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg" style={{ fontWeight: 800, letterSpacing: '1px' }}>
                EJERCICIOS DE HOY
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                {todayWorkout.exercises?.length ?? 0} total
              </span>
            </div>
            <div className="space-y-2">
              {todayWorkout.exercises?.slice(0, 5).map((ex: any, i: number) => (
                <div key={ex.id} className="card p-3 flex items-center gap-3">
                  <span
                    className="font-display text-2xl flex-shrink-0 w-10 text-center"
                    style={{ color: 'var(--accent)', fontWeight: 900 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate uppercase tracking-wide text-sm">
                      {ex.catalog?.name}
                    </p>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
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

        {/* ── EXPLORE GRID — Nike-style ── */}
        <div>
          <h3 className="font-display text-lg mb-3" style={{ fontWeight: 800, letterSpacing: '1px' }}>
            EXPLORAR
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard', emoji: '📊', name: 'Stats',      desc: 'SOCIO Score · macros',  gradient: 'linear-gradient(135deg, #E8FF47 0%, #B8DD0F 100%)' },
              { href: '/progress',  emoji: '📈', name: 'Progreso',   desc: '30 días · timeline',    gradient: 'linear-gradient(135deg, #FF6B35 0%, #C70039 100%)' },
              { href: '/library',   emoji: '📚', name: 'Ejercicios', desc: 'Biblioteca completa',    gradient: 'linear-gradient(135deg, #A78BFA 0%, #6B21A8 100%)' },
              { href: '/settings',  emoji: '⚙️', name: 'Ajustes',    desc: 'Tema · cuenta',          gradient: 'linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="relative rounded-2xl overflow-hidden group"
                style={{ aspectRatio: '1.2 / 1', minHeight: 140 }}
                aria-label={a.name}
              >
                <div className="absolute inset-0" style={{ background: a.gradient }} aria-hidden />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }}
                  aria-hidden
                />
                <div className="absolute inset-0 p-4 flex flex-col justify-between transition-transform group-hover:scale-[1.02]">
                  <span className="text-2xl" aria-hidden>{a.emoji}</span>
                  <div>
                    <p
                      className="font-display"
                      style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.01em' }}
                    >
                      {a.name.toUpperCase()}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {a.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
