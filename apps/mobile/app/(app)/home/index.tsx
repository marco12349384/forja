import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { apiCall } from '@/lib/api';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const WORKOUT_EMOJI: Record<string, string> = {
  calistenia: '🤸', gym: '🏋️', cardio: '🏃', home: '🏠', yoga: '🧘', movilidad: '🔄',
};

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [plan, setPlan] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const result = await apiCall('/api/me/today', token);
        setPlan(result.plan);
        setTodayWorkout(result.today);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    );
  }

  const todayName = DAYS_ES[new Date().getDay()];
  const userName = user?.firstName ?? 'Atleta';

  return (
    <ScrollView className="flex-1 bg-black" contentContainerClassName="px-6 pt-14 pb-10 gap-6">
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-zinc-400 text-sm">Bienvenido de vuelta</Text>
          <Text className="text-2xl font-bold text-white">{userName} 👋</Text>
        </View>
        <Text className="text-3xl">⚒️</Text>
      </View>

      {plan && (
        <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Plan activo</Text>
          <Text className="text-white font-semibold">{plan.name}</Text>
        </View>
      )}

      <View>
        <Text className="text-lg font-semibold text-white mb-3 capitalize">
          Hoy — {todayName}
        </Text>

        {todayWorkout ? (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 gap-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{todayWorkout.name}</Text>
                <Text className="text-zinc-400 text-sm capitalize">
                  {todayWorkout.type} · {todayWorkout.estimated_duration_min} min
                </Text>
              </View>
              <Text className="text-2xl">{WORKOUT_EMOJI[todayWorkout.type] ?? '⚡'}</Text>
            </View>
            {todayWorkout.exercises?.slice(0, 5).map((ex: any, i: number) => (
              <View key={ex.id} className="flex-row items-center gap-3">
                <Text className="text-orange-400 font-bold w-5 text-sm">{i + 1}</Text>
                <Text className="flex-1 text-white text-sm">{ex.catalog?.name}</Text>
                <Text className="text-zinc-400 text-sm">{ex.sets}×{ex.reps}</Text>
              </View>
            ))}
            {(todayWorkout.exercises?.length ?? 0) > 5 && (
              <Text className="text-zinc-500 text-sm pl-8">
                +{(todayWorkout.exercises?.length ?? 0) - 5} más
              </Text>
            )}
            <TouchableOpacity className="bg-orange-500 rounded-2xl py-4 items-center">
              <Text className="text-white font-bold">Iniciar entrenamiento →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 items-center">
            <Text className="text-4xl mb-3">{plan ? '🧘' : '⚒️'}</Text>
            <Text className="text-white font-semibold">
              {plan ? 'Día de descanso' : 'Sin plan activo'}
            </Text>
            {plan ? (
              <Text className="text-zinc-400 text-sm mt-1 text-center">Tu cuerpo también se forja descansando</Text>
            ) : (
              <Link href="/onboarding" asChild>
                <TouchableOpacity className="mt-3 bg-orange-500 px-6 py-2 rounded-xl">
                  <Text className="text-white font-semibold text-sm">Crear mi plan con IA</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <Text className="text-2xl mb-2">💬</Text>
          <Text className="text-white font-semibold text-sm">Coach</Text>
          <Text className="text-zinc-400 text-xs">Pregúntame</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <Text className="text-2xl mb-2">📈</Text>
          <Text className="text-white font-semibold text-sm">Progreso</Text>
          <Text className="text-zinc-400 text-xs">Estadísticas</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <Text className="text-2xl mb-2">📚</Text>
          <Text className="text-white font-semibold text-sm">Catálogo</Text>
          <Text className="text-zinc-400 text-xs">Ejercicios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
