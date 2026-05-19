import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DAYS_ES_DISPLAY: Record<string, string> = {
  domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes',
  miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

// Cover image + tint per workout type (Nike-style)
const TYPE_COVER: Record<string, { img: string; tint: string; label: string }> = {
  calistenia: {
    img: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(255,107,53,0.25) 0%, rgba(0,0,0,0.78) 100%)',
    label: 'CALISTENIA',
  },
  gym: {
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(232,255,71,0.18) 0%, rgba(0,0,0,0.8) 100%)',
    label: 'GYM',
  },
  cardio: {
    img: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(255,61,113,0.2) 0%, rgba(0,0,0,0.82) 100%)',
    label: 'CARDIO',
  },
  home: {
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(167,139,250,0.18) 0%, rgba(0,0,0,0.8) 100%)',
    label: 'CASA',
  },
  yoga: {
    img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(106,190,167,0.2) 0%, rgba(0,0,0,0.78) 100%)',
    label: 'YOGA',
  },
  movilidad: {
    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(56,189,248,0.18) 0%, rgba(0,0,0,0.8) 100%)',
    label: 'MOVILIDAD',
  },
  pilates: {
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&h=900&fit=crop&auto=format&q=80',
    tint: 'linear-gradient(180deg, rgba(236,72,153,0.18) 0%, rgba(0,0,0,0.8) 100%)',
    label: 'PILATES',
  },
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
            <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 320 }}>
              {/* Cover image */}
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url('${cover.img}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-hidden
              />
              {/* Tinted dark overlay for readability */}
              <div
                className="absolute inset-0"
                style={{ background: cover.tint }}
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
              <div className="relative p-6 sm:p-8 flex flex-col h-full" style={{ minHeight: 320 }}>
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

        {/* ── EXPLORE GRID — Nike-style con fotos fitness ── */}
        <div>
          <h3 className="font-display text-lg mb-3" style={{ fontWeight: 800, letterSpacing: '1px' }}>
            EXPLORAR
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                href: '/dashboard',
                name: 'Stats',
                desc: 'SOCIO Score · macros',
                // Apple Watch fitness data — Karsten Winegeart
                img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(232,255,71,0.15) 0%, rgba(0,0,0,0.75) 100%)',
              },
              {
                href: '/progress',
                name: 'Progreso',
                desc: '30 días · timeline',
                // Athlete running outdoor — Jonathan Borba
                img: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(255,107,53,0.2) 0%, rgba(0,0,0,0.8) 100%)',
              },
              {
                href: '/library',
                name: 'Ejercicios',
                desc: 'Biblioteca completa',
                // Dumbbells gym dark — Anastase Maragos
                img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(167,139,250,0.15) 0%, rgba(0,0,0,0.78) 100%)',
              },
              {
                href: '/settings',
                name: 'Ajustes',
                desc: 'Tema · cuenta',
                // Sneakers on dark surface — Imani Bahati
                img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=80',
                tint: 'linear-gradient(180deg, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0.78) 100%)',
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="relative rounded-2xl overflow-hidden group"
                style={{ aspectRatio: '1.2 / 1', minHeight: 140 }}
                aria-label={a.name}
              >
                {/* Background image */}
                <div
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url('${a.img}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden
                />
                {/* Tinted dark overlay for text readability */}
                <div className="absolute inset-0" style={{ background: a.tint }} aria-hidden />
                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <p
                    className="font-display"
                    style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.01em', lineHeight: 0.95 }}
                  >
                    {a.name.toUpperCase()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {a.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
