import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DAYS_ES_DISPLAY: Record<string, string> = {
  domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes',
  miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};
const WORKOUT_EMOJI: Record<string, string> = {
  calistenia: '🤸', gym: '🏋️', cardio: '🏃', home: '🏠', yoga: '🧘', movilidad: '🔄', pilates: '🧘‍♂️',
};

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const userName = user?.firstName ?? 'Atleta';

  const plan = await getActivePlan(userId);
  const todayName = DAYS_ES[new Date().getDay()];
  const todayWorkout = plan ? await getTodayWorkout(plan.id, todayName) : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Hero header */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          aria-hidden
          className="absolute font-display pointer-events-none select-none"
          style={{
            right: '-10px', top: '-30px',
            fontSize: 'clamp(80px, 14vw, 180px)',
            fontWeight: 800,
            color: 'rgba(232,255,71,0.04)',
            lineHeight: 1,
          }}
        >
          HOY
        </div>
        <div className="max-w-2xl mx-auto px-6 py-10 relative">
          <div className="text-xs font-semibold tracking-[3px] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            ⚡ {DAYS_ES_DISPLAY[todayName]}
          </div>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(36px, 8vw, 56px)', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>HOLA,</span>{' '}
            <span style={{ color: 'var(--accent)' }}>{userName.toUpperCase()}</span>
          </h1>
          {plan && (
            <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
              Plan: <span style={{ color: 'var(--text)' }}>{plan.name}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

        {/* Workout de hoy */}
        {todayWorkout ? (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-[2px] mb-2" style={{ color: 'var(--accent)' }}>
                Tu entreno de hoy
              </div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-2xl" style={{ fontWeight: 800 }}>{todayWorkout.name}</h3>
                  <p className="text-sm mt-1 capitalize" style={{ color: 'var(--muted)' }}>
                    {todayWorkout.type} · {todayWorkout.estimated_duration_min} min · {todayWorkout.difficulty}
                  </p>
                </div>
                <span className="text-3xl">{WORKOUT_EMOJI[todayWorkout.type] ?? '⚡'}</span>
              </div>

              {/* Exercise preview */}
              <div className="space-y-1.5 mb-5">
                {todayWorkout.exercises?.slice(0, 5).map((ex: any, i: number) => (
                  <div
                    key={ex.id}
                    className="flex items-center gap-3 p-2 rounded-lg text-sm"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center font-display text-xs"
                      style={{ background: 'rgba(232,255,71,0.1)', color: 'var(--accent)', fontWeight: 800 }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{ex.catalog?.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-display"
                      style={{ background: 'var(--accent)', color: '#000', fontWeight: 700 }}
                    >
                      {ex.sets}×{ex.reps}
                    </span>
                  </div>
                ))}
                {(todayWorkout.exercises?.length ?? 0) > 5 && (
                  <p className="text-xs pl-2" style={{ color: 'var(--muted)' }}>
                    +{(todayWorkout.exercises?.length ?? 0) - 5} ejercicios más al abrir
                  </p>
                )}
              </div>

              {/* CTA button */}
              <Link
                href={`/workout/${todayWorkout.id}`}
                className="btn btn-primary w-full text-base"
                style={{ fontSize: '15px', minHeight: 52 }}
              >
                ▶ Iniciar entrenamiento
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {plan ? (
              <>
                <p className="text-5xl mb-3">🧘</p>
                <p className="font-display text-xl" style={{ fontWeight: 700 }}>Día de descanso</p>
                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                  Tu cuerpo también se forja descansando
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl mb-3">⚡</p>
                <p className="font-display text-xl" style={{ fontWeight: 700 }}>Sin plan activo</p>
                <Link href="/onboarding" className="btn btn-primary mt-4 inline-flex">
                  Crear mi plan con IA
                </Link>
              </>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/dashboard', emoji: '📊', name: 'Dashboard', desc: 'SOCIO Score + macros' },
            { href: '/progress',  emoji: '📈', name: 'Progreso',  desc: '30 días + timeline' },
            { href: '/library',   emoji: '📚', name: 'Biblioteca', desc: 'Ejercicios catalogados' },
            { href: '/settings',  emoji: '⚙️', name: 'Ajustes',    desc: 'Tema · cuenta' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="card card-interactive p-4 block" aria-label={a.name}>
              <p className="text-2xl mb-2" aria-hidden>{a.emoji}</p>
              <p className="font-display text-sm" style={{ fontWeight: 700 }}>{a.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
