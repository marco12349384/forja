import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { saveUserProfile, generatePlan } from '@forja/api-client';
import type { OnboardingData, FitnessGoal, FitnessLevel, Equipment } from '@forja/types';

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

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6];
const DURATION_OPTIONS = [20, 30, 45, 60, 75, 90];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Partial<OnboardingData>>({
    available_equipment: [],
    injuries: [],
    days_per_week: 3,
    session_duration_min: 45,
  });

  function toggleEquipment(eq: Equipment) {
    setData((prev) => {
      const current = prev.available_equipment ?? [];
      if (current.includes(eq)) return { ...prev, available_equipment: current.filter((e) => e !== eq) };
      return { ...prev, available_equipment: [...current, eq] };
    });
  }

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const profile = data as OnboardingData;
      await saveUserProfile(supabase, user.id, profile);
      await generatePlan(supabase, profile);
      router.replace('/(app)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar tu plan');
      setLoading(false);
    }
  }

  const canContinue =
    (step === 1 && !!data.goal) ||
    (step === 2 && !!data.fitness_level) ||
    step >= 3;

  return (
    <View className="flex-1 bg-black">
      {/* Progress */}
      <View className="flex-row gap-1 px-6 pt-14 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-orange-500' : 'bg-zinc-800'}`} />
        ))}
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-6 gap-6">
        {step === 1 && (
          <>
            <Text className="text-2xl font-bold text-white">¿Cuál es tu objetivo?</Text>
            {GOALS.map((g) => (
              <TouchableOpacity key={g.value}
                onPress={() => setData((p) => ({ ...p, goal: g.value }))}
                className={`flex-row items-center gap-4 p-4 rounded-2xl border ${data.goal === g.value ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                <Text className="text-2xl">{g.emoji}</Text>
                <Text className="text-white font-semibold text-base">{g.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text className="text-2xl font-bold text-white">¿Cuál es tu nivel?</Text>
            {LEVELS.map((l) => (
              <TouchableOpacity key={l.value}
                onPress={() => setData((p) => ({ ...p, fitness_level: l.value }))}
                className={`p-4 rounded-2xl border ${data.fitness_level === l.value ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                <Text className="text-white font-semibold">{l.label}</Text>
                <Text className="text-zinc-400 text-sm">{l.description}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Text className="text-2xl font-bold text-white">¿Qué equipo tienes?</Text>
            <View className="flex-row flex-wrap gap-3">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <TouchableOpacity key={eq.value} onPress={() => toggleEquipment(eq.value)}
                  className={`items-center gap-2 p-4 rounded-2xl border w-[47%] ${data.available_equipment?.includes(eq.value) ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                  <Text className="text-2xl">{eq.emoji}</Text>
                  <Text className="text-white text-sm font-medium text-center">{eq.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text className="text-2xl font-bold text-white">¿Cuánto tiempo tienes?</Text>
            <Text className="text-zinc-400 font-medium">
              Días por semana: <Text className="text-white font-bold">{data.days_per_week}</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DAYS_OPTIONS.map((d) => (
                <TouchableOpacity key={d} onPress={() => setData((p) => ({ ...p, days_per_week: d }))}
                  className={`flex-1 min-w-[30%] py-3 rounded-xl border items-center ${data.days_per_week === d ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800'}`}>
                  <Text className="text-white">{d} {d === 1 ? 'día' : 'días'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-zinc-400 font-medium mt-2">
              Minutos por sesión: <Text className="text-white font-bold">{data.session_duration_min}</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DURATION_OPTIONS.map((m) => (
                <TouchableOpacity key={m} onPress={() => setData((p) => ({ ...p, session_duration_min: m }))}
                  className={`flex-1 min-w-[30%] py-3 rounded-xl border items-center ${data.session_duration_min === m ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800'}`}>
                  <Text className="text-white">{m} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Text className="text-2xl font-bold text-white">¿Alguna restricción?</Text>
            <Text className="text-zinc-400">Lesiones, zonas a evitar (opcional)</Text>
            <TextInput
              value={data.injuries?.join(', ') ?? ''}
              onChangeText={(t) => setData((p) => ({ ...p, injuries: t ? t.split(',').map(s => s.trim()).filter(Boolean) : [] }))}
              placeholder="Ej: rodilla derecha, lumbar..."
              placeholderTextColor="#71717a"
              multiline numberOfLines={3}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
            />
            {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
            {loading && (
              <View className="items-center gap-3 py-4">
                <ActivityIndicator color="#f97316" size="large" />
                <Text className="text-zinc-400">Forjando tu plan personalizado...</Text>
                <Text className="text-zinc-600 text-sm">Esto puede tardar 10-15 segundos</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Navigation */}
      <View className="flex-row gap-3 px-6 pb-10 pt-4 border-t border-zinc-900">
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)}
            className="flex-1 border border-zinc-700 rounded-2xl py-4 items-center">
            <Text className="text-zinc-300 font-semibold">Atrás</Text>
          </TouchableOpacity>
        )}
        {step < 5 ? (
          <TouchableOpacity onPress={() => setStep(s => s + 1)} disabled={!canContinue}
            className={`flex-1 bg-orange-500 rounded-2xl py-4 items-center ${!canContinue ? 'opacity-40' : ''}`}>
            <Text className="text-white font-bold">Continuar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleFinish} disabled={loading}
            className="flex-1 bg-orange-500 rounded-2xl py-4 items-center">
            <Text className="text-white font-bold">
              {loading ? 'Forjando plan...' : '⚒️ Crear mi plan con IA'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
