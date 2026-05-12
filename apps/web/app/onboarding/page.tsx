'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { OnboardingData, FitnessGoal, FitnessLevel, Equipment } from '@forja/types';

const TOTAL_STEPS = 5;

const GOALS: { value: FitnessGoal; label: string; emoji: string }[] = [
  { value: 'perder_peso', label: 'Perder peso', emoji: '🔥' },
  { value: 'ganar_musculo', label: 'Ganar músculo', emoji: '💪' },
  { value: 'resistencia', label: 'Resistencia', emoji: '🏃' },
  { value: 'movilidad', label: 'Movilidad', emoji: '🧘' },
  { value: 'fitness_general', label: 'Fitness general', emoji: '⚡' },
];

const LEVELS: { value: FitnessLevel; label: string; description: string }[] = [
  { value: 'principiante', label: 'Principiante', description: 'Menos de 6 meses entrenando' },
  { value: 'intermedio', label: 'Intermedio', description: '6 meses a 2 años' },
  { value: 'avanzado', label: 'Avanzado', description: 'Más de 2 años' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: 'ninguno', label: 'Sin equipo', emoji: '🏠' },
  { value: 'mancuernas', label: 'Mancuernas', emoji: '🏋️' },
  { value: 'barra', label: 'Barra', emoji: '🔩' },
  { value: 'anillas', label: 'Anillas', emoji: '⭕' },
  { value: 'bandas', label: 'Bandas', emoji: '🔗' },
  { value: 'gym_completo', label: 'Gimnasio completo', emoji: '🏟️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Partial<OnboardingData>>({
    equipment: [],
    injuries: [],
    daysPerWeek: 3,
    sessionDurationMin: 45,
  });

  function toggleEquipment(eq: Equipment) {
    setData((prev) => {
      const current = prev.equipment ?? [];
      return current.includes(eq)
        ? { ...prev, equipment: current.filter((e) => e !== eq) }
        : { ...prev, equipment: [...current, eq] };
    });
  }

  async function handleFinish() {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar tu plan');
      setLoading(false);
    }
  }

  const canContinue =
    (step === 1 && !!data.goal) ||
    (step === 2 && !!data.fitnessLevel) ||
    step === 3 || step === 4 || step === 5;

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-orange-500' : 'bg-zinc-800'}`} />
        ))}
      </div>

      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Cuál es tu objetivo?</h2>
              <p className="text-zinc-400 mt-1">La IA diseñará tu plan según esto</p>
            </div>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <button key={g.value} onClick={() => setData((p) => ({ ...p, goal: g.value }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-colors ${data.goal === g.value ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}>
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="font-semibold">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Cuál es tu nivel?</h2>
              <p className="text-zinc-400 mt-1">Sé honesto — la IA se adapta</p>
            </div>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button key={l.value} onClick={() => setData((p) => ({ ...p, fitnessLevel: l.value }))}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors ${data.fitnessLevel === l.value ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}>
                  <p className="font-semibold">{l.label}</p>
                  <p className="text-sm text-zinc-400">{l.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Qué equipo tienes?</h2>
              <p className="text-zinc-400 mt-1">Selecciona todo lo disponible</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button key={eq.value} onClick={() => toggleEquipment(eq.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${data.equipment?.includes(eq.value) ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}>
                  <span className="text-2xl">{eq.emoji}</span>
                  <span className="text-sm font-medium text-center">{eq.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">¿Cuánto tiempo tienes?</h2>
              <p className="text-zinc-400 mt-1">Seremos realistas con tu agenda</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">
                Días por semana: <span className="text-white font-bold text-lg">{data.daysPerWeek}</span>
              </label>
              <input type="range" min={1} max={6} value={data.daysPerWeek ?? 3}
                onChange={(e) => setData((p) => ({ ...p, daysPerWeek: Number(e.target.value) }))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-zinc-500"><span>1 día</span><span>6 días</span></div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">
                Minutos por sesión: <span className="text-white font-bold text-lg">{data.sessionDurationMin}</span>
              </label>
              <input type="range" min={20} max={90} step={5} value={data.sessionDurationMin ?? 45}
                onChange={(e) => setData((p) => ({ ...p, sessionDurationMin: Number(e.target.value) }))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-zinc-500"><span>20 min</span><span>90 min</span></div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">¿Alguna restricción?</h2>
              <p className="text-zinc-400 mt-1">Lesiones, zonas a evitar (opcional)</p>
            </div>
            <textarea
              value={data.injuries?.join(', ') ?? ''}
              onChange={(e) => setData((p) => ({ ...p, injuries: e.target.value ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : [] }))}
              placeholder="Ej: rodilla derecha, lumbar..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-orange-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {loading && (
              <div className="text-center space-y-3 py-4">
                <div className="text-5xl animate-pulse">⚒️</div>
                <p className="text-zinc-400">Forja está creando tu plan personalizado...</p>
                <p className="text-zinc-600 text-sm">Esto puede tardar 10-15 segundos</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="flex-1 border border-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl hover:border-zinc-500 transition-colors">
            Atrás
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">
            Continuar
          </button>
        ) : (
          <button onClick={handleFinish} disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
            {loading ? 'Forjando tu plan...' : '⚒️ Crear mi plan con IA'}
          </button>
        )}
      </div>
    </div>
  );
}
