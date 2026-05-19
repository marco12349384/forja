'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileInput {
  goal: string;
  goals?: string[];          // multi-select: array of goals
  fitnessLevel: string;
  equipment: string[];
  daysPerWeek: number;
  sessionDurationMin: number;
  injuries: string[];
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: string;
  dietType?: string;
  allergies?: string[];
  budget?: string;
  cookingFreq?: string;
  trainingLocation?: string;
  mainChallenge?: string;
}

const GOALS = [
  { v: 'perder_peso', l: 'Perder grasa', icon: '🔥' },
  { v: 'ganar_musculo', l: 'Ganar músculo', icon: '💪' },
  { v: 'resistencia', l: 'Resistencia', icon: '🏃' },
  { v: 'movilidad', l: 'Flexibilidad', icon: '🧘' },
  { v: 'fitness_general', l: 'Bienestar', icon: '🌿' },
];

const LEVELS = [
  { v: 'principiante', l: 'Principiante', d: '<6 meses' },
  { v: 'intermedio', l: 'Intermedio', d: '6m – 2 años' },
  { v: 'avanzado', l: 'Avanzado', d: '+2 años' },
];

const EQUIPMENT = [
  { v: 'ninguno', l: 'Sin equipo' },
  { v: 'mancuernas', l: 'Mancuernas' },
  { v: 'barra', l: 'Barra' },
  { v: 'bandas', l: 'Bandas' },
  { v: 'anillas', l: 'Anillas' },
  { v: 'gym_completo', l: 'Gym completo' },
];

const DAY_OPTIONS = [3, 4, 5, 6, 7];
const DURATION_OPTIONS = [20, 30, 45, 60, 75, 90];

export function RegenerateForm({ initialProfile }: { initialProfile: ProfileInput }) {
  const router = useRouter();
  // Initialize goals array — use existing goals if available, otherwise start with single goal
  const [profile, setProfile] = useState<ProfileInput>(() => ({
    ...initialProfile,
    goals: initialProfile.goals && initialProfile.goals.length > 0
      ? initialProfile.goals
      : initialProfile.goal ? [initialProfile.goal] : [],
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (g: string) => {
    setProfile((p) => {
      const current = p.goals ?? [];
      const next = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
      return { ...p, goals: next, goal: next[0] ?? '' };
    });
  };

  const toggleEquipment = (e: string) => {
    setProfile((p) => ({
      ...p,
      equipment: p.equipment.includes(e) ? p.equipment.filter((x) => x !== e) : [...p.equipment, e],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo generar el plan. Intenta de nuevo.');
        setSubmitting(false);
        return;
      }
      // Success — redirect to home to see new plan
      router.push('/home');
      router.refresh();
    } catch (e: any) {
      setError('Error de conexión. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          💡 <strong>Cambia lo que quieras y SOCIO regenera tu plan completo.</strong> Tu plan anterior se desactiva pero el progreso se conserva.
        </p>
      </div>

      {/* OBJETIVOS — multi-select */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>OBJETIVOS</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
          Puedes elegir varios · SOCIO combina disciplinas para todos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GOALS.map((g) => {
            const active = (profile.goals ?? []).includes(g.v);
            return (
              <button
                key={g.v}
                onClick={() => toggleGoal(g.v)}
                className="card p-4 text-left transition-all active:scale-95 relative"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface)',
                }}
                aria-pressed={active}
              >
                {/* Checkbox indicator */}
                <div
                  className="absolute top-2 right-2 rounded-md flex items-center justify-center font-display text-xs"
                  style={{
                    width: 22,
                    height: 22,
                    background: active ? 'var(--accent)' : 'transparent',
                    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    color: active ? '#000' : 'var(--muted)',
                  }}
                  aria-hidden
                >
                  {active && '✓'}
                </div>
                <div className="text-2xl mb-1" aria-hidden>{g.icon}</div>
                <div className="font-display text-sm pr-6" style={{ letterSpacing: '0.5px', color: active ? 'var(--accent)' : 'var(--text)' }}>
                  {g.l.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>
        {/* Counter */}
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mt-3 text-center" style={{ color: (profile.goals?.length ?? 0) > 0 ? 'var(--accent)' : 'var(--muted)' }}>
          {(profile.goals?.length ?? 0) === 0
            ? 'Elige al menos uno'
            : `${profile.goals!.length} ${profile.goals!.length === 1 ? 'objetivo seleccionado' : 'objetivos seleccionados'}`}
        </p>
      </section>

      {/* NIVEL */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>NIVEL</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>Sé honesto</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => {
            const active = profile.fitnessLevel === l.v;
            return (
              <button
                key={l.v}
                onClick={() => setProfile((p) => ({ ...p, fitnessLevel: l.v }))}
                className="card p-3 text-center transition-all active:scale-95"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface)',
                }}
              >
                <div className="font-display text-sm" style={{ color: active ? 'var(--accent)' : 'var(--text)' }}>
                  {l.l.toUpperCase()}
                </div>
                <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{l.d}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* DÍAS POR SEMANA */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>DÍAS POR SEMANA</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
          Cuántos días entrenas: <span style={{ color: 'var(--accent)' }}>{profile.daysPerWeek}</span>
        </p>
        <div className="grid grid-cols-5 gap-2">
          {DAY_OPTIONS.map((d) => {
            const active = profile.daysPerWeek === d;
            return (
              <button
                key={d}
                onClick={() => setProfile((p) => ({ ...p, daysPerWeek: d }))}
                className="card py-3 text-center transition-all active:scale-95"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent)' : 'var(--surface)',
                }}
              >
                <span className="stat-num" style={{ fontSize: 22, color: active ? '#000' : 'var(--text)' }}>{d}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* DURACIÓN */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>DURACIÓN POR SESIÓN</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
          Tiempo disponible: <span style={{ color: 'var(--accent)' }}>{profile.sessionDurationMin} min</span>
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DURATION_OPTIONS.map((m) => {
            const active = profile.sessionDurationMin === m;
            return (
              <button
                key={m}
                onClick={() => setProfile((p) => ({ ...p, sessionDurationMin: m }))}
                className="card py-3 text-center transition-all active:scale-95"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface)',
                }}
              >
                <div className="font-display text-sm" style={{ color: active ? 'var(--accent)' : 'var(--text)' }}>
                  {m} MIN
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* EQUIPO */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>EQUIPO DISPONIBLE</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>Marca todo lo que tienes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EQUIPMENT.map((e) => {
            const active = profile.equipment.includes(e.v);
            return (
              <button
                key={e.v}
                onClick={() => toggleEquipment(e.v)}
                className="card p-3 text-left transition-all active:scale-95 flex items-center gap-2.5"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface)',
                }}
              >
                <div
                  className="rounded-md flex items-center justify-center font-display text-sm flex-shrink-0"
                  style={{
                    width: 24, height: 24,
                    background: active ? 'var(--accent)' : 'transparent',
                    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    color: active ? '#000' : 'var(--muted)',
                  }}
                >
                  {active && '✓'}
                </div>
                <span className="font-display text-xs sm:text-sm" style={{ color: active ? 'var(--accent)' : 'var(--text)', letterSpacing: '0.5px' }}>
                  {e.l.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>⚠ {error}</p>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => router.push('/home')}
          disabled={submitting}
          className="btn btn-secondary flex-shrink-0"
          style={{ minWidth: 120 }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || (profile.goals?.length ?? 0) === 0 || !profile.fitnessLevel}
          className="btn btn-primary flex-1"
          style={{ minHeight: 56, fontSize: 15 }}
        >
          {submitting ? '⏳ GENERANDO PLAN...' : '⚡ REGENERAR PLAN'}
        </button>
      </div>

      <p className="text-[10px] sm:text-xs text-center uppercase tracking-[2px] font-semibold" style={{ color: 'var(--muted)' }}>
        SOCIO tarda 15-30 segundos en generar el plan completo
      </p>
    </div>
  );
}
