import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '@/design/tokens';

// ── Discipline filter ─────────────────────────────────────────────
const DISCIPLINES = [
  { value: 'todos', label: 'Todos', icon: '⚡' },
  { value: 'gym', label: 'Gym', icon: '🏋️' },
  { value: 'calistenia', label: 'Calistenia', icon: '🤸' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'pilates', label: 'Pilates', icon: '🌀' },
  { value: 'hiit', label: 'HIIT', icon: '🏃' },
  { value: 'movilidad', label: 'Movilidad', icon: '🔄' },
];

const DISC_COLORS: Record<string, string> = {
  gym: colors.energy,
  calistenia: colors.energy,
  yoga: colors.calm,
  pilates: colors.calm,
  hiit: colors.energy,
  movilidad: colors.calm,
  todos: colors.primary,
};

// ── Mock workouts library ─────────────────────────────────────────
const WORKOUTS = [
  { id: '1', name: 'Fuerza Upper Body', discipline: 'gym', duration: 45, level: 'intermedio', exercises: 8, icon: '🏋️' },
  { id: '2', name: 'Full Body Calistenia', discipline: 'calistenia', duration: 40, level: 'intermedio', exercises: 7, icon: '🤸' },
  { id: '3', name: 'Yoga Mañanero', discipline: 'yoga', duration: 25, level: 'principiante', exercises: 12, icon: '🧘' },
  { id: '4', name: 'Pilates Core', discipline: 'pilates', duration: 30, level: 'principiante', exercises: 10, icon: '🌀' },
  { id: '5', name: 'HIIT Express', discipline: 'hiit', duration: 20, level: 'avanzado', exercises: 6, icon: '🏃' },
  { id: '6', name: 'Movilidad de Cadera', discipline: 'movilidad', duration: 20, level: 'principiante', exercises: 8, icon: '🔄' },
  { id: '7', name: 'Legs Day', discipline: 'gym', duration: 50, level: 'avanzado', exercises: 9, icon: '🏋️' },
  { id: '8', name: 'Dominadas Progresivas', discipline: 'calistenia', duration: 35, level: 'intermedio', exercises: 6, icon: '🤸' },
];

const LEVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function WorkoutCard({ w, onPress }: { w: typeof WORKOUTS[0]; onPress: () => void }) {
  const accent = DISC_COLORS[w.discipline] ?? colors.energy;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }, shadows.card]}
    >
      <View style={{ backgroundColor: `${accent}12`, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text, flex: 1 }}>{w.name}</Text>
        <Text style={{ fontSize: 28 }}>{w.icon}</Text>
      </View>
      <View style={{ padding: spacing.md, flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: `${accent}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, color: accent, textTransform: 'capitalize' }}>{w.discipline}</Text>
        </View>
        <View style={{ backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted }}>⏱ {w.duration} min</Text>
        </View>
        <View style={{ backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted }}>{w.exercises} ejercicios</Text>
        </View>
        <View style={{ backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted }}>{LEVEL_LABEL[w.level]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EntrenaScreen() {
  const [activeDisc, setActiveDisc] = useState('todos');

  const filtered = activeDisc === 'todos' ? WORKOUTS : WORKOUTS.filter((w) => w.discipline === activeDisc);
  const accent = DISC_COLORS[activeDisc] ?? colors.primary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 60, paddingBottom: 100, gap: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>Elige tu sesión</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.text }}>Entrena ⚡</Text>
      </View>

      {/* Mode banner */}
      <View style={{ marginHorizontal: spacing.lg, backgroundColor: `${colors.primary}10`, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', borderWidth: 1, borderColor: `${colors.primary}20` }}>
        <Text style={{ fontSize: 18 }}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: colors.primary }}>Modo Libre activado</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 }}>
            Elige cualquier sesión. SOCIO aprende de tus elecciones y mejora tu plan.
          </Text>
        </View>
      </View>

      {/* Discipline filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
        style={{ maxHeight: 52, flexGrow: 0 }}
      >
        {DISCIPLINES.map((d) => {
          const active = activeDisc === d.value;
          const dAccent = DISC_COLORS[d.value] ?? colors.primary;
          return (
            <TouchableOpacity
              key={d.value}
              onPress={() => setActiveDisc(d.value)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: spacing.md,
                paddingVertical: 8,
                borderRadius: radius.full,
                backgroundColor: active ? dAccent : colors.surface,
                borderWidth: 1.5,
                borderColor: active ? dAccent : colors.border,
              }}
            >
              <Text style={{ fontSize: 14 }}>{d.icon}</Text>
              <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? '#FFF' : colors.muted }}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>
          {filtered.length} sesiones disponibles
        </Text>
      </View>

      {/* Workout cards */}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {filtered.map((w) => (
          <WorkoutCard key={w.id} w={w} onPress={() => {}} />
        ))}
      </View>
    </ScrollView>
  );
}
