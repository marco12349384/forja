import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall } from '@/lib/api';
import { colors, spacing, radius, shadows } from '@/design/tokens';

// ── Constants ────────────────────────────────────────────────────────
const DONE_MESSAGES = [
  'Buen trabajo. La constancia es lo que cuenta — no la perfección de un día.',
  'Terminaste. Eso es más que el 80% de las personas. Toma agua.',
  'Hoy entrenaste. Mañana lo decide tu yo del mañana. Por hoy, ya está.',
  'No hace falta que haya sido perfecto. Hace falta que haya sido.',
  'Un workout más en el banco. Sigue sumando.',
];

// ── Stat Column ──────────────────────────────────────────────────────
function StatCol({
  value,
  label,
  suffix,
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text
          style={{
            fontFamily: 'SpaceMono_400Regular',
            fontSize: 24,
            color: colors.primary,
            lineHeight: 30,
          }}
        >
          {value}
        </Text>
        {suffix ? (
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 12,
          color: colors.muted,
          marginTop: 3,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function WorkoutDoneScreen() {
  const { duration, exercises, kcal, workoutId, totalSets, completedSets } =
    useLocalSearchParams<{
      duration: string;
      exercises: string;
      kcal: string;
      workoutId: string;
      totalSets: string;
      completedSets: string;
    }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  // ── Animation ─────────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  // ── Record workout session (silent fail) ───────────────────────────
  useEffect(() => {
    async function record() {
      try {
        const token = await getToken();
        if (!token || !workoutId) return;
        await apiCall(`/api/workouts/${workoutId}/complete`, token, {
          method: 'POST',
          body: JSON.stringify({
            duration_min: Number(duration ?? 0),
            kcal_estimate: Number(kcal ?? 0),
            total_sets: Number(totalSets ?? 0),
            completed_sets: Number(completedSets ?? 0),
          }),
        });
      } catch {
        // Silent fail — don't block celebration
      }
    }
    record();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  // ── SOCIO message (random on mount) ───────────────────────────────
  const [doneMsg] = useState(
    () => DONE_MESSAGES[Math.floor(Math.random() * DONE_MESSAGES.length)]
  );

  // ── Derived display values ─────────────────────────────────────────
  const durationVal = duration ?? '0';
  const exercisesVal = exercises ?? '0';
  const kcalVal = kcal ?? '0';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero emoji (animated) ────────────────────────────────────── */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={{ fontSize: 80, textAlign: 'center' }}>🎉</Text>
      </Animated.View>

      {/* ── Headline ─────────────────────────────────────────────────── */}
      <Text
        style={{
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 32,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        ¡Listo, socio!
      </Text>

      {/* ── Stats grid ───────────────────────────────────────────────── */}
      <View
        style={[
          {
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        <StatCol value={durationVal} label="Duración" suffix=" min" />

        {/* Divider */}
        <View
          style={{
            width: 1,
            backgroundColor: colors.border,
            marginVertical: 4,
          }}
        />

        <StatCol value={exercisesVal} label="Ejercicios" />

        {/* Divider */}
        <View
          style={{
            width: 1,
            backgroundColor: colors.border,
            marginVertical: 4,
          }}
        />

        <StatCol value={kcalVal} label="Estimado" suffix=" kcal" />
      </View>

      {/* ── SOCIO message card ───────────────────────────────────────── */}
      <View
        style={{
          width: '100%',
          backgroundColor: colors.aiFade,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ fontSize: 18 }}>💜</Text>
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 13,
              color: colors.ai,
            }}
          >
            SOCIO dice:
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: colors.text,
            lineHeight: 21,
          }}
        >
          {doneMsg}
        </Text>
      </View>

      {/* ── Action buttons ───────────────────────────────────────────── */}
      <View style={{ width: '100%', gap: spacing.md }}>
        {/* Primary: back to home */}
        <TouchableOpacity
          onPress={() => router.replace('/(app)/home')}
          activeOpacity={0.8}
          accessibilityLabel="Volver al inicio"
          style={[
            {
              width: '100%',
              height: 52,
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            },
            shadows.card,
          ]}
        >
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 16,
              color: '#FFFFFF',
            }}
          >
            Volver al inicio
          </Text>
        </TouchableOpacity>

        {/* Secondary: share */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Próximamente', 'El compartir llegará pronto 🔥')
          }
          activeOpacity={0.7}
          accessibilityLabel="Compartir progreso"
          style={{
            width: '100%',
            height: 52,
            borderRadius: radius.md,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 16,
              color: colors.primary,
            }}
          >
            Compartir progreso
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
