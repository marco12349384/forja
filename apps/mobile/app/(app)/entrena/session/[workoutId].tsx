import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall } from '@/lib/api';
import { colors, spacing, radius, shadows } from '@/design/tokens';

// ── Types ────────────────────────────────────────────────────────────
interface ExerciseCatalog {
  name: string;
  slug: string;
  muscles_primary: string[];
}

interface WorkoutExercise {
  id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  catalog: ExerciseCatalog;
}

interface Workout {
  name: string;
  type: string;
  estimated_duration_min: number;
  exercises: WorkoutExercise[];
}

// ── Constants ────────────────────────────────────────────────────────
const KCAL_PER_MIN = 7;

const MOCK_WORKOUT: Workout = {
  name: 'Full Body Calistenia',
  type: 'calistenia',
  estimated_duration_min: 40,
  exercises: [
    { id: '1', sets: 3, reps: '10', rest_seconds: 60, catalog: { name: 'Flexiones', slug: 'flexion-brazos', muscles_primary: ['Pecho', 'Tríceps'] } },
    { id: '2', sets: 3, reps: '12', rest_seconds: 45, catalog: { name: 'Sentadillas', slug: 'sentadilla', muscles_primary: ['Piernas', 'Glúteos'] } },
    { id: '3', sets: 3, reps: '8', rest_seconds: 90, catalog: { name: 'Dominadas', slug: 'dominada', muscles_primary: ['Espalda', 'Bíceps'] } },
    { id: '4', sets: 3, reps: '30 seg', rest_seconds: 45, catalog: { name: 'Plancha', slug: 'plancha', muscles_primary: ['Core', 'Hombros'] } },
  ],
};

const SOCIO_TIPS = [
  'Mantén el core activado durante todo el movimiento.',
  'Respira: exhala en el esfuerzo, inhala en el retorno.',
  'Mejor 8 reps perfectas que 12 con mala técnica.',
  'Hidratación: toma agua entre series, no solo al terminar.',
  'La mente va antes que el músculo — foco en la contracción.',
  'Si sientes dolor agudo (no ardor), para. SOCIO prefiere que dures.',
];

// ── Discipline chip helpers ───────────────────────────────────────────
function getDisciplineColors(type: string): { bg: string; text: string } {
  const t = type.toLowerCase();
  if (t === 'gym' || t === 'calistenia' || t === 'hiit') {
    return { bg: colors.energyFade, text: colors.energy };
  }
  if (t === 'yoga' || t === 'pilates' || t === 'movilidad') {
    return { bg: colors.calmFade, text: colors.calm };
  }
  return { bg: colors.aiFade, text: colors.ai };
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Sub-components ───────────────────────────────────────────────────

function DisciplineChip({ type }: { type: string }) {
  const { bg, text } = getDisciplineColors(type);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.full,
      }}
    >
      <Text
        style={{
          fontFamily: 'DMSans_700Bold',
          fontSize: 12,
          color: text,
          textTransform: 'capitalize',
        }}
      >
        {capitalize(type)}
      </Text>
    </View>
  );
}

function MuscleTag({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.border,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: radius.full,
      }}
    >
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 12,
          color: colors.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const SetRow = React.memo(function SetRow({
  setNumber,
  done,
  onToggle,
}: {
  setNumber: number;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityLabel={`Serie ${setNumber}, ${done ? 'completada' : 'pendiente'}`}
      accessibilityRole="checkbox"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: done ? `${colors.success}18` : colors.card,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: done ? `${colors.success}40` : colors.border,
      }}
    >
      {/* Set label */}
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 14,
          color: done ? colors.muted : colors.text,
          flex: 1,
        }}
      >
        Serie {setNumber}
      </Text>

      {/* Set number pill */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: done ? `${colors.success}30` : `${colors.primary}12`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        }}
      >
        <Text
          style={{
            fontFamily: 'SpaceMono_400Regular',
            fontSize: 12,
            color: done ? colors.success : colors.primary,
          }}
        >
          {setNumber}
        </Text>
      </View>

      {/* Check mark */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.full,
          borderWidth: 1.5,
          borderColor: done ? colors.success : colors.border,
          backgroundColor: done ? colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done && (
          <Text style={{ fontSize: 13, color: '#FFF' }}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

function RestTimer({
  timeLeft,
  onSkip,
}: {
  timeLeft: number;
  onSkip: () => void;
}) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${secs}`;

  return (
    <View
      style={{
        backgroundColor: colors.primaryFade,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
        marginBottom: spacing.md,
      }}
    >
      <Text
        style={{
          fontFamily: 'SpaceMono_400Regular',
          fontSize: 56,
          color: colors.primary,
          lineHeight: 64,
        }}
      >
        {display}
      </Text>
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 14,
          color: colors.muted,
          marginTop: spacing.xs,
        }}
      >
        Descansando...
      </Text>
      <TouchableOpacity
        onPress={onSkip}
        activeOpacity={0.7}
        style={{ marginTop: spacing.md }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text
          style={{
            fontFamily: 'DMSans_500Medium',
            fontSize: 14,
            color: colors.primary,
          }}
        >
          Saltar descanso →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SOCIOTipCard({ tip }: { tip: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.aiFade,
        borderRadius: radius.md,
        padding: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.ai,
        flexDirection: 'row',
        gap: spacing.sm,
      }}
    >
      <Text style={{ fontSize: 16 }}>💜</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'DMSans_700Bold',
            fontSize: 12,
            color: colors.ai,
            marginBottom: 3,
          }}
        >
          SOCIO:
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 13,
            color: colors.text,
            lineHeight: 19,
          }}
        >
          {tip}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function WorkoutPlayerScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [startTime] = useState(() => new Date());
  const [socioTip] = useState(
    () => SOCIO_TIPS[Math.floor(Math.random() * SOCIO_TIPS.length)]
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load workout ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await apiCall(`/api/workouts/${workoutId}`, token!);
        setWorkout(data);
      } catch {
        setWorkout(MOCK_WORKOUT);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workoutId, getToken]);

  // ── Rest timer interval ────────────────────────────────────────────
  useEffect(() => {
    if (isResting) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setRestTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isResting]);

  // ── Stop rest when countdown hits 0 ───────────────────────────────
  useEffect(() => {
    if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
    }
  }, [restTimeLeft, isResting]);

  // ── Toggle set ─────────────────────────────────────────────────────
  const toggleSet = useCallback((
    exerciseId: string,
    setIndex: number,
    totalSets: number,
    restSeconds: number
  ) => {
    setCompletedSets((prev) => {
      const current = prev[exerciseId] ?? Array(totalSets).fill(false);
      const updated = [...current];
      updated[setIndex] = !updated[setIndex];
      // Start rest if set was just completed (not un-completed) and not the last set
      if (updated[setIndex] && setIndex < totalSets - 1) {
        setIsResting(true);
        setRestTimeLeft(restSeconds);
      }
      return { ...prev, [exerciseId]: updated };
    });
  }, []); // no deps needed — only uses setState functions (stable)

  // ── Skip rest ──────────────────────────────────────────────────────
  function skipRest() {
    setIsResting(false);
    setRestTimeLeft(0);
  }

  // ── Exit confirmation ──────────────────────────────────────────────
  function handleExit() {
    Alert.alert(
      '¿Salir del entrenamiento?',
      'Tu progreso de esta sesión se perderá.',
      [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  // ── Navigate exercises ─────────────────────────────────────────────
  function goNext() {
    if (!workout) return;
    const isLast = currentIdx === workout.exercises.length - 1;
    if (isLast) {
      const elapsedMin = Math.round(
        (new Date().getTime() - startTime.getTime()) / 60000
      );
      const exerciseCount = workout.exercises.length;
      router.replace(
        `/(app)/entrena/session/done?duration=${elapsedMin}&exercises=${exerciseCount}&kcal=${elapsedMin * KCAL_PER_MIN}`
      );
    } else {
      setCurrentIdx((i) => i + 1);
      setIsResting(false);
      setRestTimeLeft(0);
    }
  }

  function goPrev() {
    if (currentIdx === 0) return;
    setCurrentIdx((i) => i - 1);
    setIsResting(false);
    setRestTimeLeft(0);
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading || !workout) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: colors.muted,
            marginTop: spacing.md,
          }}
        >
          Cargando tu entrenamiento...
        </Text>
      </View>
    );
  }

  const exercise = workout.exercises[currentIdx];
  const totalExercises = workout.exercises.length;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === totalExercises - 1;
  const exSets = completedSets[exercise.id] ?? Array(exercise.sets).fill(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header Bar ───────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          ...shadows.card,
        }}
      >
        {/* Exit button */}
        <TouchableOpacity
          onPress={handleExit}
          activeOpacity={0.7}
          accessibilityLabel="Salir del entrenamiento"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 20,
              color: colors.muted,
            }}
          >
            ✕
          </Text>
        </TouchableOpacity>

        {/* Center: exercise counter */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: colors.muted,
            }}
          >
            Ejercicio {currentIdx + 1} de {totalExercises}
          </Text>
        </View>

        {/* Right: workout name */}
        <View style={{ width: 100, alignItems: 'flex-end' }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {workout.name}
          </Text>
        </View>
      </View>

      {/* ── Scrollable Content ────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 100,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Exercise Card ────────────────────────────────────────────── */}
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.md,
            },
            shadows.card,
          ]}
        >
          {/* Exercise name */}
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 28,
              color: colors.text,
              lineHeight: 36,
            }}
          >
            {exercise.catalog.name}
          </Text>

          {/* Discipline chip */}
          <DisciplineChip type={workout.type} />

          {/* Muscle group tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {exercise.catalog.muscles_primary.map((m) => (
              <MuscleTag key={m} label={m} />
            ))}
          </View>

          {/* Reps/sets label */}
          <Text
            style={{
              fontFamily: 'SpaceMono_400Regular',
              fontSize: 16,
              color: colors.muted,
            }}
          >
            {exercise.sets} series × {exercise.reps} reps
          </Text>
        </View>

        {/* ── Sets Tracker ─────────────────────────────────────────────── */}
        <View>
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 14,
              color: colors.text,
              marginBottom: spacing.sm,
            }}
          >
            Series
          </Text>
          {Array.from({ length: exercise.sets }, (_, i) => (
            <SetRow
              key={i}
              setNumber={i + 1}
              done={exSets[i] ?? false}
              onToggle={() =>
                toggleSet(exercise.id, i, exercise.sets, exercise.rest_seconds)
              }
            />
          ))}
        </View>

        {/* ── Rest Timer (conditional) ──────────────────────────────────── */}
        {isResting && (
          <RestTimer timeLeft={restTimeLeft} onSkip={skipRest} />
        )}

        {/* ── SOCIO Tip ────────────────────────────────────────────────── */}
        <SOCIOTipCard tip={socioTip} />
      </ScrollView>

      {/* ── Bottom Navigation Bar ────────────────────────────────────── */}
      <View
        style={{
          paddingBottom: insets.bottom + spacing.md,
          paddingTop: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          gap: spacing.md,
          ...shadows.card,
        }}
      >
        {/* Previous button */}
        <TouchableOpacity
          onPress={goPrev}
          disabled={isFirst}
          activeOpacity={0.7}
          accessibilityLabel="Ejercicio anterior"
          style={{
            flex: 1,
            height: 52,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: isFirst ? colors.border : colors.primary,
            backgroundColor: 'transparent',
            opacity: isFirst ? 0.4 : 1,
          }}
        >
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 15,
              color: isFirst ? colors.muted : colors.primary,
            }}
          >
            ← Anterior
          </Text>
        </TouchableOpacity>

        {/* Next / Finish button */}
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.8}
          accessibilityLabel={isLast ? 'Terminar entrenamiento' : 'Siguiente ejercicio'}
          style={[
            {
              flex: 1,
              height: 52,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isLast ? colors.energy : colors.primary,
            },
            isLast ? shadows.energy : shadows.card,
          ]}
        >
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 15,
              color: '#FFFFFF',
            }}
          >
            {isLast ? 'Terminar 🎉' : 'Siguiente →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
