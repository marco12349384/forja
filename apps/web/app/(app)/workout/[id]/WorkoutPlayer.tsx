'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExerciseRow {
  id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
  catalog: {
    id: string;
    name: string;
    slug: string;
    type: string;
    difficulty: string;
    cues_correct?: string[] | null;
    cues_common_mistakes?: string[] | null;
    muscles_primary?: string[] | null;
  };
}

interface WorkoutData {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  estimated_duration_min: number;
  day_of_week: string;
  exercises: ExerciseRow[];
}

const TYPE_LABEL: Record<string, string> = {
  calistenia: 'CALISTENIA', gym: 'GYM', cardio: 'CARDIO', home: 'CASA',
  yoga: 'YOGA', movilidad: 'MOVILIDAD', pilates: 'PILATES',
};

const TYPE_IMG: Record<string, string> = {
  calistenia: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1600&h=600&fit=crop&auto=format&q=80',
  gym:        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=600&fit=crop&auto=format&q=80',
  cardio:     'https://images.unsplash.com/photo-1486218119243-13883505764c?w=1600&h=600&fit=crop&auto=format&q=80',
  home:       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&h=600&fit=crop&auto=format&q=80',
  yoga:       'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600&h=600&fit=crop&auto=format&q=80',
  movilidad:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&h=600&fit=crop&auto=format&q=80',
  pilates:    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1600&h=600&fit=crop&auto=format&q=80',
};

export function WorkoutPlayer({ workout }: { workout: WorkoutData }) {
  const router = useRouter();

  // Tracking state
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [openExercise, setOpenExercise] = useState<string | null>(workout.exercises[0]?.id ?? null);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(60);
  const [restMax, setRestMax] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session start
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedMin, setElapsedMin] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Elapsed counter (updates every 30s for the header)
  useEffect(() => {
    const id = setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - startTimeRef.current) / 60000));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (restRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setRestSeconds((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [restRunning]);

  useEffect(() => {
    if (restSeconds === 0 && restRunning) {
      setRestRunning(false);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([200, 100, 200]); } catch {}
      }
      setTimeout(() => setRestSeconds(restMax), 1500);
    }
  }, [restSeconds, restRunning, restMax]);

  const toggleSet = (exId: string, setIdx: number, totalSets: number) => {
    setCompletedSets((prev) => {
      const arr = prev[exId] ? [...prev[exId]] : new Array(totalSets).fill(false);
      arr[setIdx] = !arr[setIdx];
      return { ...prev, [exId]: arr };
    });
  };

  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets, 0);
  const doneSets = Object.values(completedSets).reduce((acc, arr) => acc + arr.filter(Boolean).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const handleFinish = async () => {
    setSubmitting(true);
    const durationMin = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    const kcalEstimate = Math.round(durationMin * 7);
    try {
      const res = await fetch(`/api/workouts/${workout.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_min: durationMin,
          kcal_estimate: kcalEstimate,
          total_sets: totalSets,
          completed_sets: doneSets,
        }),
      });
      if (!res.ok) console.warn('complete failed', res.status);
    } catch (e) {
      console.warn('complete error', e);
    } finally {
      router.push('/home');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const typeLabel = TYPE_LABEL[workout.type] ?? workout.type.toUpperCase();
  const typeImg = TYPE_IMG[workout.type] ?? TYPE_IMG.home;

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ════════ STICKY HEADER ════════ */}
      <div className="border-b sticky top-0 z-30" style={{ borderColor: 'var(--border)', background: 'rgba(191,184,171,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.push('/home')} className="btn-back flex-shrink-0" aria-label="Volver al inicio">
            ← Inicio
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[9px] sm:text-[10px] tracking-[2px] uppercase font-bold" style={{ color: 'var(--accent)' }}>
              {typeLabel}
            </div>
            <h1 className="font-display truncate" style={{ fontSize: 'clamp(15px, 4vw, 19px)', letterSpacing: '0' }}>
              {workout.name.toUpperCase()}
            </h1>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="stat-num" style={{ fontSize: 24, color: 'var(--accent)' }}>{pct}%</div>
            <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--muted)' }}>
              {doneSets}/{totalSets}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1" style={{ background: 'var(--surface2)' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--accent)' }}
          />
        </div>
      </div>

      {/* ════════ HERO BANNER (imagen del tipo) ════════ */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 'clamp(140px, 28vw, 220px)',
          backgroundImage: `url(${typeImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(13,13,13,1) 100%)' }}
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute font-display select-none pointer-events-none"
          style={{
            right: '-20px', bottom: '-30px',
            fontSize: 'clamp(80px, 18vw, 160px)',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.08)',
            lineHeight: 0.82,
          }}
        >
          {typeLabel.slice(0, 4)}
        </div>
        <div className="absolute inset-0 max-w-3xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-5">
          <div className="text-[10px] sm:text-xs font-bold tracking-[3px] uppercase mb-1" style={{ color: 'var(--accent)' }}>
            ⚡ EN PROGRESO · {typeLabel}
          </div>
          <h2
            className="font-display"
            style={{
              color: '#fff',
              fontSize: 'clamp(28px, 6vw, 44px)',
              lineHeight: 0.9,
              fontWeight: 900,
              letterSpacing: '-0.01em',
            }}
          >
            {workout.name.toUpperCase()}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-[11px] uppercase tracking-[1.5px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <span>{workout.difficulty}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{workout.estimated_duration_min} min</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{workout.exercises.length} ejercicios</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5">

        {/* ════════ TIMER WIDGET ════════ */}
        <div
          className="rounded-3xl p-5 sm:p-6 relative overflow-hidden"
          style={{
            background: restRunning
              ? 'linear-gradient(135deg, rgba(232,255,71,0.15), rgba(232,255,71,0.04))'
              : 'var(--surface)',
            border: `1px solid ${restRunning ? 'var(--accent-border)' : 'var(--border)'}`,
            transition: 'all 300ms ease',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs uppercase tracking-[3px] font-bold mb-1" style={{ color: restRunning ? 'var(--accent)' : 'var(--muted)' }}>
                {restRunning ? '⏳ DESCANSANDO' : 'DESCANSO ENTRE SERIES'}
              </div>
              <div className="stat-num" style={{ fontSize: 'clamp(48px, 11vw, 72px)', color: 'var(--accent)' }}>
                {formatTime(restSeconds)}
              </div>
              <div className="flex gap-1.5 mt-3">
                {[45, 60, 90].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setRestMax(s); setRestSeconds(s); setRestRunning(false); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: restMax === s ? 'var(--accent)' : 'var(--surface2)',
                      color: restMax === s ? '#000' : 'var(--muted)',
                      border: `1px solid ${restMax === s ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setRestRunning((r) => !r)}
              className="flex-shrink-0 rounded-full flex items-center justify-center font-display transition-transform active:scale-95"
              style={{
                width: 'clamp(64px, 14vw, 88px)',
                height: 'clamp(64px, 14vw, 88px)',
                background: 'var(--accent)',
                color: '#000',
                fontSize: 'clamp(24px, 5vw, 32px)',
                fontWeight: 900,
                boxShadow: restRunning ? '0 0 0 8px rgba(232,255,71,0.15)' : 'none',
              }}
              aria-label={restRunning ? 'Pausar descanso' : 'Iniciar descanso'}
            >
              {restRunning ? '❚❚' : '▶'}
            </button>
          </div>
        </div>

        {/* ════════ EXERCISES ════════ */}
        {workout.exercises.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-3" aria-hidden>🏋️</p>
            <p className="font-display text-base" style={{ letterSpacing: '1px' }}>SIN EJERCICIOS</p>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Este entrenamiento aún no tiene ejercicios asignados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base sm:text-lg" style={{ letterSpacing: '1px' }}>EJERCICIOS</h2>
              <span className="text-[10px] uppercase tracking-[2px] font-semibold" style={{ color: 'var(--muted)' }}>
                {workout.exercises.length} total
              </span>
            </div>
            {workout.exercises.map((ex, idx) => {
              const isOpen = openExercise === ex.id;
              const setsArr = completedSets[ex.id] ?? new Array(ex.sets).fill(false);
              const doneCount = setsArr.filter(Boolean).length;
              const allDone = doneCount === ex.sets;
              return (
                <div
                  key={ex.id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${allDone ? 'var(--accent-border)' : 'var(--border)'}`,
                  }}
                >
                  <button
                    onClick={() => setOpenExercise(isOpen ? null : ex.id)}
                    className="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left transition-colors"
                    style={{ background: allDone ? 'var(--accent-soft)' : 'transparent' }}
                  >
                    {/* Number/check badge */}
                    <div
                      className="flex-shrink-0 rounded-xl flex items-center justify-center font-display transition-all"
                      style={{
                        width: 'clamp(48px, 10vw, 56px)',
                        height: 'clamp(48px, 10vw, 56px)',
                        background: allDone ? 'var(--accent)' : 'rgba(232,255,71,0.1)',
                        color: allDone ? '#000' : 'var(--accent)',
                        fontSize: 'clamp(20px, 4vw, 26px)',
                        fontWeight: 900,
                      }}
                    >
                      {allDone ? '✓' : String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display truncate" style={{ fontSize: 'clamp(15px, 3.5vw, 18px)', letterSpacing: '0.5px' }}>
                        {ex.catalog.name.toUpperCase()}
                      </div>
                      <div className="text-[10px] sm:text-[11px] uppercase tracking-[1.5px] mt-0.5 font-semibold" style={{ color: 'var(--muted)' }}>
                        {ex.catalog.muscles_primary?.slice(0, 2).join(' · ') || ex.catalog.type}
                      </div>
                      {/* Mini progress dots */}
                      {!isOpen && doneCount > 0 && (
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: ex.sets }).map((_, i) => (
                            <div
                              key={i}
                              className="rounded-full"
                              style={{
                                width: 6, height: 6,
                                background: setsArr[i] ? 'var(--accent)' : 'var(--border)',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="set-pill flex-shrink-0">
                      {ex.sets}×{ex.reps}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 border-t pt-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                      {/* Set checkboxes — bigger and more tactile */}
                      <div className="space-y-2">
                        {Array.from({ length: ex.sets }).map((_, setIdx) => {
                          const done = setsArr[setIdx];
                          return (
                            <button
                              key={setIdx}
                              onClick={() => toggleSet(ex.id, setIdx, ex.sets)}
                              className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all active:scale-[0.99]"
                              style={{
                                background: done ? 'var(--accent-soft)' : 'var(--surface2)',
                                border: `1.5px solid ${done ? 'var(--accent-border)' : 'var(--border)'}`,
                                minHeight: 56,
                              }}
                              aria-label={`Set ${setIdx + 1}${done ? ' completado' : ''}`}
                            >
                              <div
                                className="rounded-lg flex items-center justify-center font-display flex-shrink-0 transition-all"
                                style={{
                                  width: 32, height: 32,
                                  background: done ? 'var(--accent)' : 'transparent',
                                  color: done ? '#000' : 'var(--muted)',
                                  border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                                  fontSize: 16,
                                  fontWeight: 900,
                                }}
                              >
                                {done && '✓'}
                              </div>
                              <div className="flex-1 text-left">
                                <span className="font-display text-sm sm:text-base" style={{ letterSpacing: '0.5px', color: done ? 'var(--text)' : 'var(--text-dim)' }}>
                                  SET {setIdx + 1}
                                </span>
                                <span className="text-[11px] sm:text-xs ml-2 uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
                                  {ex.reps} reps
                                </span>
                              </div>
                              {!done && (
                                <span className="text-[9px] uppercase tracking-[1.5px] font-bold flex-shrink-0" style={{ color: 'var(--muted)' }}>
                                  TOCA AL TERMINAR
                                </span>
                              )}
                              {done && (
                                <span className="text-[9px] uppercase tracking-[1.5px] font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>
                                  ✓ HECHO
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tips */}
                      {(ex.catalog.cues_correct?.length ?? 0) > 0 && (
                        <div className="rounded-xl p-3 sm:p-4" style={{ background: 'var(--surface2)' }}>
                          <div className="text-[10px] uppercase tracking-[2px] font-bold mb-2" style={{ color: 'var(--accent)' }}>
                            ✓ TÉCNICA
                          </div>
                          <ul className="space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-dim)' }}>
                            {(ex.catalog.cues_correct ?? []).slice(0, 3).map((c, i) => (
                              <li key={i} className="flex gap-2">
                                <span style={{ color: 'var(--accent)' }}>•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold pt-1" style={{ color: 'var(--muted)' }}>
                        <span>⏱ Descanso · {ex.rest_seconds}s</span>
                        <span>{doneCount} / {ex.sets} sets</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════ STICKY ACTION BAR ════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t safe-bottom"
        style={{
          background: 'rgba(191,184,171,0.97)',
          backdropFilter: 'blur(24px)',
          borderColor: 'var(--border)',
          paddingTop: '12px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/home')}
            disabled={submitting}
            className="btn btn-secondary flex-shrink-0"
            style={{ minWidth: 100 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="btn flex-1"
            style={{
              background: pct === 100 ? 'var(--success)' : 'var(--accent)',
              color: '#000',
              fontSize: 'clamp(13px, 3vw, 15px)',
            }}
            aria-label={pct === 100 ? 'Terminar entrenamiento — completado' : 'Terminar entrenamiento'}
          >
            {submitting ? '⏳ GUARDANDO...' : pct === 100 ? '🎉 TERMINAR · 100%' : `TERMINAR · ${pct}%`}
          </button>
        </div>
      </div>
    </div>
  );
}
