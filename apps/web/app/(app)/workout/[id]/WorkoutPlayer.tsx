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

const TYPE_EMOJI: Record<string, string> = {
  calistenia: '🤸', gym: '🏋️', cardio: '🏃', home: '🏠', yoga: '🧘', movilidad: '🔄',
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
  const [submitting, setSubmitting] = useState(false);

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
      // Try to vibrate (mobile browsers)
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
    const kcalEstimate = Math.round(durationMin * 7); // rough
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
      if (!res.ok) {
        console.warn('complete failed', res.status);
      }
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[2px] uppercase" style={{ color: 'var(--muted)' }}>
              {workout.day_of_week} · {workout.difficulty}
            </div>
            <h1 className="font-display text-xl" style={{ fontWeight: 800 }}>
              {TYPE_EMOJI[workout.type] ?? '⚡'} {workout.name}
            </h1>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl" style={{ fontWeight: 800, color: 'var(--accent)' }}>{pct}%</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              {doneSets}/{totalSets} sets
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1" style={{ background: 'var(--surface2)' }}>
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* Timer Widget */}
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[2px]" style={{ color: 'var(--muted)' }}>
              Descanso entre series
            </div>
            <div className="font-display text-4xl" style={{ fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
              {formatTime(restSeconds)}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setRestRunning((r) => !r)}
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              {restRunning ? '⏸ Pausar' : '▶ Inicio'}
            </button>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setRestMax(45); setRestSeconds(45); setRestRunning(false); }}
                className="px-3 py-1 rounded-md text-[11px] font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                45s
              </button>
              <button
                onClick={() => { setRestMax(60); setRestSeconds(60); setRestRunning(false); }}
                className="px-3 py-1 rounded-md text-[11px] font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                60s
              </button>
              <button
                onClick={() => { setRestMax(90); setRestSeconds(90); setRestRunning(false); }}
                className="px-3 py-1 rounded-md text-[11px] font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                90s
              </button>
            </div>
          </div>
        </div>

        {/* Exercises */}
        {workout.exercises.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--muted)' }}>Este entrenamiento aún no tiene ejercicios asignados.</p>
          </div>
        ) : (
          workout.exercises.map((ex, idx) => {
            const isOpen = openExercise === ex.id;
            const setsArr = completedSets[ex.id] ?? new Array(ex.sets).fill(false);
            const doneCount = setsArr.filter(Boolean).length;
            const allDone = doneCount === ex.sets;
            return (
              <div
                key={ex.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${allDone ? 'rgba(232,255,71,0.4)' : 'var(--border)'}`,
                }}
              >
                <button
                  onClick={() => setOpenExercise(isOpen ? null : ex.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                  style={{ background: allDone ? 'rgba(232,255,71,0.06)' : 'transparent' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm flex-shrink-0"
                    style={{
                      background: allDone ? 'var(--accent)' : 'rgba(232,255,71,0.1)',
                      color: allDone ? '#000' : 'var(--accent)',
                      fontWeight: 800,
                    }}
                  >
                    {allDone ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base truncate" style={{ fontWeight: 700 }}>
                      {ex.catalog.name}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {ex.catalog.muscles_primary?.join(' · ') || ex.catalog.type}
                    </div>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--accent)', color: '#000', fontFamily: 'Syne' }}
                  >
                    {ex.sets}×{ex.reps}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-3" style={{ borderColor: 'var(--border)' }}>
                    {/* Set checkboxes */}
                    <div className="space-y-2">
                      {Array.from({ length: ex.sets }).map((_, setIdx) => {
                        const done = setsArr[setIdx];
                        return (
                          <button
                            key={setIdx}
                            onClick={() => toggleSet(ex.id, setIdx, ex.sets)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                            style={{
                              background: done ? 'rgba(232,255,71,0.1)' : 'var(--surface2)',
                              border: `1px solid ${done ? 'rgba(232,255,71,0.4)' : 'var(--border)'}`,
                            }}
                          >
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                              style={{
                                background: done ? 'var(--accent)' : 'transparent',
                                color: done ? '#000' : 'var(--muted)',
                                border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                              }}
                            >
                              {done && '✓'}
                            </div>
                            <span className="text-sm flex-1 text-left" style={{ color: done ? 'var(--text)' : 'var(--muted)' }}>
                              Set {setIdx + 1} · {ex.reps} reps
                            </span>
                            {!done && (
                              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                Marca al terminar
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tips */}
                    {(ex.catalog.cues_correct?.length ?? 0) > 0 && (
                      <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                        <div className="font-bold mb-1" style={{ color: 'var(--accent)' }}>✓ Técnica</div>
                        {(ex.catalog.cues_correct ?? []).slice(0, 3).map((c, i) => (
                          <div key={i}>• {c}</div>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] flex justify-between" style={{ color: 'var(--muted)' }}>
                      <span>⏱ Descanso: {ex.rest_seconds}s</span>
                      <span>{doneCount}/{ex.sets} sets</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Action buttons */}
        <div className="flex gap-3 sticky bottom-0 pb-4 pt-4" style={{ background: 'var(--bg)' }}>
          <button
            onClick={() => router.push('/home')}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="flex-[2] py-3 rounded-xl font-display"
            style={{
              background: pct === 100 ? '#22c55e' : 'var(--accent)',
              color: '#000',
              fontWeight: 800,
              fontSize: '15px',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Guardando...' : pct === 100 ? '🎉 Terminar entreno' : 'Terminar entreno →'}
          </button>
        </div>
      </div>
    </div>
  );
}
