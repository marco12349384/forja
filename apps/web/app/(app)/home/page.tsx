import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const WORKOUT_EMOJI: Record<string, string> = {
  calistenia: '🤸', gym: '🏋️', cardio: '🏃', home: '🏠', yoga: '🧘', movilidad: '🔄',
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
    <div className="min-h-screen bg-black px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-zinc-400 text-sm">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold">{userName} 👋</h1>
        </div>
        <span className="text-3xl">⚒️</span>
      </div>

      {/* Plan activo */}
      {plan && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Plan activo</p>
          <p className="font-semibold">{plan.name}</p>
        </div>
      )}

      {/* Workout de hoy */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 capitalize">
          Entrenamiento de hoy — {todayName}
        </h2>

        {todayWorkout ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{todayWorkout.name}</h3>
                <p className="text-zinc-400 text-sm capitalize">
                  {todayWorkout.type} · {todayWorkout.estimated_duration_min} min · {todayWorkout.difficulty}
                </p>
              </div>
              <span className="text-2xl">{WORKOUT_EMOJI[todayWorkout.type] ?? '⚡'}</span>
            </div>

            <div className="space-y-2">
              {todayWorkout.exercises?.slice(0, 5).map((ex: any, i: number) => (
                <div key={ex.id} className="flex items-center gap-3 text-sm">
                  <span className="text-orange-400 font-bold w-5">{i + 1}</span>
                  <span className="flex-1">{ex.catalog?.name}</span>
                  <span className="text-zinc-400">{ex.sets}×{ex.reps}</span>
                </div>
              ))}
              {(todayWorkout.exercises?.length ?? 0) > 5 && (
                <p className="text-zinc-500 text-sm pl-8">
                  +{(todayWorkout.exercises?.length ?? 0) - 5} ejercicios más
                </p>
              )}
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
              Iniciar entrenamiento →
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            {plan ? (
              <>
                <p className="text-4xl mb-3">🧘</p>
                <p className="font-semibold">Día de descanso</p>
                <p className="text-zinc-400 text-sm mt-1">Tu cuerpo también se forja descansando</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">⚒️</p>
                <p className="font-semibold">Sin plan activo</p>
                <Link
                  href="/onboarding"
                  className="inline-block mt-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors"
                >
                  Crear mi plan con IA
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/coach" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-orange-500 transition-colors block">
          <p className="text-2xl mb-2">💬</p>
          <p className="font-semibold text-sm">Coach Forja</p>
          <p className="text-zinc-400 text-xs">Pregúntame lo que sea</p>
        </Link>
        <Link href="/progress" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-orange-500 transition-colors block">
          <p className="text-2xl mb-2">📈</p>
          <p className="font-semibold text-sm">Mi progreso</p>
          <p className="text-zinc-400 text-xs">Ver estadísticas</p>
        </Link>
        <Link href="/catalog" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-orange-500 transition-colors block">
          <p className="text-2xl mb-2">📚</p>
          <p className="font-semibold text-sm">Catálogo</p>
          <p className="text-zinc-400 text-xs">Ejercicios con videos</p>
        </Link>
        <Link href="/nutrition" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-orange-500 transition-colors block">
          <p className="text-2xl mb-2">🥗</p>
          <p className="font-semibold text-sm">Nutrición</p>
          <p className="text-zinc-400 text-xs">Registrar comidas</p>
        </Link>
      </div>
    </div>
  );
}
