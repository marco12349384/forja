import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { apiCall } from '@/lib/api';
import { spacing, radius, shadows } from '@/design/tokens';
import { useTheme } from '@/design/ThemeContext';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';
import { BreathingPulse } from '@/components/BreathingPulse';

// ── Types ────────────────────────────────────────────────────────
type EnergyLevel = 1 | 2 | 3;

interface BodyPhaseSummary {
  tracking_enabled: boolean;
  recovery_mode: boolean;
  auto_recovery_today: boolean;
  current_phase: {
    phase: string;
    day_in_cycle: number;
    recommendation: string;
  } | null;
}

interface MiniMission {
  id: string;
  label: string;
  icon: string;
  done: boolean;
}

// ── Check-in Energía ─────────────────────────────────────────────
function CheckInEnergia({
  value,
  onChange,
  colors,
}: {
  value: EnergyLevel | null;
  onChange: (v: EnergyLevel) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const options: { level: EnergyLevel; icon: string; label: string; color: string }[] = [
    { level: 1, icon: '🌙', label: 'Cansado', color: colors.calm },
    { level: 2, icon: '✨', label: 'Normal', color: colors.ai },
    { level: 3, icon: '🔥', label: 'Con todo', color: colors.energy },
  ];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <Text
        style={{
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 18,
          color: colors.text,
          marginBottom: spacing.md,
        }}
      >
        ¿Cómo amaneciste?
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {options.map((opt) => {
          const active = value === opt.level;
          return (
            <PressableScale
              key={opt.level}
              onPress={() => onChange(opt.level)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: active ? opt.color : colors.border,
                backgroundColor: active ? `${opt.color}15` : colors.card,
              }}
            >
              <BreathingPulse active={active}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</Text>
              </BreathingPulse>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular',
                  color: active ? opt.color : colors.muted,
                }}
              >
                {opt.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

// ── SOCIO Score ──────────────────────────────────────────────────
function SOCIOScoreCard({ score, colors }: { score: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const listener = scoreAnim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    const anim = Animated.timing(scoreAnim, { toValue: score, duration: 800, useNativeDriver: false });
    anim.start();
    return () => {
      scoreAnim.removeListener(listener);
      anim.stop();
    };
  }, [score, scoreAnim]);

  const getScoreColor = () => {
    if (score >= 75) return colors.calm;
    if (score >= 50) return colors.ai;
    return colors.energy;
  };
  const getScoreLabel = () => {
    if (score >= 80) return '¡Gran día!';
    if (score >= 60) return 'Va bien';
    if (score >= 40) return 'Puede mejorar';
    return 'Día difícil';
  };
  const color = getScoreColor();
  const pct = score / 100;
  const circumference = 2 * Math.PI * 30;
  const strokeDash = circumference * pct;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
        },
        shadows.card,
      ]}
    >
      {/* Score circle (simplified — SVG not available inline) */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: 5,
          borderColor: `${color}30`,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}10`,
        }}
      >
        <Text
          style={{
            fontFamily: 'SpaceMono_400Regular',
            fontSize: 20,
            color,
          }}
        >
          {displayScore}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 18,
            color: colors.text,
          }}
        >
          {getScoreLabel()}
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 13,
            color: colors.muted,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          Sueño · Nutrición · Movimiento · Hidratación
        </Text>
        <View
          style={{
            marginTop: spacing.sm,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${score}%`,
              height: 4,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        </View>
      </View>
    </View>
  );
}

// ── SOCIO Message ─────────────────────────────────────────────────
function SOCIOMessage({ message, colors }: { message: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View
      style={{
        backgroundColor: `${colors.ai}12`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: colors.ai,
        flexDirection: 'row',
        gap: spacing.md,
      }}
    >
      <Text style={{ fontSize: 20 }}>💬</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'DMSans_700Bold',
            fontSize: 12,
            color: colors.ai,
            letterSpacing: 0.5,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}
        >
          Tu SOCIO dice
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

// ── Mini Misiones ─────────────────────────────────────────────────
function MiniMisiones({ missions, onToggle, colors }: {
  missions: MiniMission[];
  onToggle: (id: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const done = missions.filter((m) => m.done).length;
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>
          Mini Misiones
        </Text>
        <View style={{ backgroundColor: `${colors.energy}15`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: colors.energy }}>
            {done}/{missions.length}
          </Text>
        </View>
      </View>
      {missions.map((m) => (
        <PressableScale
          key={m.id}
          onPress={() => onToggle(m.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: m.done ? colors.calm : colors.border,
              backgroundColor: m.done ? `${colors.calm}20` : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {m.done && <Text style={{ fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 16, marginRight: 4 }}>{m.icon}</Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 14,
              color: m.done ? colors.muted : colors.text,
              textDecorationLine: m.done ? 'line-through' : 'none',
              flex: 1,
            }}
          >
            {m.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

// ── Plan del Día Card ─────────────────────────────────────────────
function PlanDiaCard({ workout, onStart, colors }: {
  workout: any;
  onStart: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const TYPE_COLOR: Record<string, string> = {
    gym: colors.energy,
    calistenia: colors.energy,
    yoga: colors.calm,
    pilates: colors.calm,
    movilidad: colors.calm,
    cardio: colors.ai,
    home: colors.ai,
  };
  const TYPE_ICON: Record<string, string> = {
    gym: '🏋️', calistenia: '🤸', yoga: '🧘', pilates: '🌀',
    movilidad: '🔄', cardio: '🏃', home: '🏠',
  };

  if (!workout) {
    return (
      <View
        style={[
          {
            backgroundColor: `${colors.calm}12`,
            borderRadius: radius.lg,
            padding: spacing.lg,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: `${colors.calm}30`,
          },
        ]}
      >
        <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🌿</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>
          Día de recuperación activa
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
          Tu cuerpo también crece descansando. La racha sigue.
        </Text>
      </View>
    );
  }

  const accentColor = TYPE_COLOR[workout.type] ?? colors.energy;
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      {/* Header strip */}
      <View style={{ backgroundColor: `${accentColor}15`, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.text }}>
            {workout.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 }}>
            <View style={{ backgroundColor: `${accentColor}25`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, color: accentColor, textTransform: 'capitalize' }}>
                {workout.type}
              </Text>
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted }}>
              · {workout.estimated_duration_min} min
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 32 }}>{TYPE_ICON[workout.type] ?? '⚡'}</Text>
      </View>

      {/* Exercises preview */}
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        {workout.exercises?.slice(0, 4).map((ex: any, i: number) => (
          <View key={ex.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: `${accentColor}20`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: accentColor }}>{i + 1}</Text>
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.text, flex: 1 }}>
              {ex.catalog?.name ?? ex.name}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>
              {ex.sets}×{ex.reps}
            </Text>
          </View>
        ))}
        {(workout.exercises?.length ?? 0) > 4 && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, paddingLeft: 32 }}>
            +{workout.exercises.length - 4} ejercicios más
          </Text>
        )}
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <PressableScale
          onPress={onStart}
          style={[
            {
              backgroundColor: accentColor,
              borderRadius: radius.md,
              paddingVertical: 16,
              alignItems: 'center',
            },
            shadows.energy,
          ]}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFF', letterSpacing: 0.3 }}>
            Iniciar entrenamiento →
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

// ── Body Phase Card ───────────────────────────────────────────────
const PHASE_ICONS: Record<string, string> = {
  menstruation: '🌙',
  follicular: '🌱',
  ovulation: '⚡',
  luteal: '🌿',
};

function BodyPhaseCard({
  data,
  onPress,
  colors,
}: {
  data: BodyPhaseSummary | null;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  // Recovery mode banner
  if (data?.recovery_mode) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          {
            backgroundColor: `${colors.calm}15`,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1.5,
            borderColor: `${colors.calm}40`,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          },
          shadows.card,
        ]}
      >
        <Text style={{ fontSize: 24 }}>🌙</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 14,
              color: colors.calm,
            }}
          >
            Modo recuperación activo
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: colors.muted,
              marginTop: 2,
              lineHeight: 18,
            }}
          >
            Hoy SOCIO recomienda descanso activo y movilidad.
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.muted }}>→</Text>
      </TouchableOpacity>
    );
  }

  // Phase info card
  if (data?.tracking_enabled && data.current_phase) {
    const icon = PHASE_ICONS[data.current_phase.phase] ?? '🔄';
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          },
          shadows.card,
        ]}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 13,
              color: colors.text,
              textTransform: 'capitalize',
            }}
          >
            Fase {data.current_phase.phase} · Día {data.current_phase.day_in_cycle}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 12,
              color: colors.muted,
              marginTop: 2,
              lineHeight: 16,
            }}
            numberOfLines={2}
          >
            {data.current_phase.recommendation}
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.muted }}>→</Text>
      </TouchableOpacity>
    );
  }

  // Default: invite to configure
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: `${colors.ai}25`,
          borderStyle: 'dashed',
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
      ]}
    >
      <Text style={{ fontSize: 22 }}>🌿</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'DMSans_700Bold',
            fontSize: 13,
            color: colors.text,
          }}
        >
          Configurar fase corporal
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 12,
            color: colors.muted,
            marginTop: 2,
          }}
        >
          SOCIO ajusta tu plan a tu ciclo y bienestar
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: colors.muted }}>→</Text>
    </TouchableOpacity>
  );
}

// ── Quick Log ─────────────────────────────────────────────────────
function QuickLog({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const [water, setWater] = useState(0); // glasses
  const [steps, setSteps] = useState(0);

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {/* Water */}
      <TouchableOpacity
        onPress={() => setWater((w) => Math.min(w + 1, 12))}
        activeOpacity={0.7}
        style={[
          {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        <Text style={{ fontSize: 22, marginBottom: 4 }}>💧</Text>
        <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 18, color: colors.calm }}>
          {water}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 }}>
          vasos · toca +1
        </Text>
      </TouchableOpacity>

      {/* SOCIO Score mini */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          {
            flex: 1,
            backgroundColor: `${colors.primary}10`,
            borderRadius: radius.md,
            padding: spacing.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: `${colors.primary}20`,
          },
        ]}
      >
        <Text style={{ fontSize: 22, marginBottom: 4 }}>⭐</Text>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: colors.primary }}>
          Racha activa
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 }}>
          ver progreso →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Home Screen ──────────────────────────────────────────────
const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const SOCIO_MESSAGES = [
  '¿Dormiste bien? Tu cuerpo usa el sueño para construir músculo. Hoy es un buen día para entrenar fuerte.',
  'Recuerda: la consistencia supera a la intensidad. Un entrenamiento mediocre hoy vale más que el perfecto que nunca hiciste.',
  'Hydratación: ¿ya tomaste agua? En los primeros 30 min del día es cuando más importa.',
];

export default function HomeScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { colors } = useTheme();
  const [plan, setPlan] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [missions, setMissions] = useState<MiniMission[]>([]);
  const [score, setScore] = useState<number>(0);
  const [scoreExplanation, setScoreExplanation] = useState<string | null>(null);
  const [bodyPhase, setBodyPhase] = useState<BodyPhaseSummary | null>(null);
  const [socioMsg] = useState(SOCIO_MESSAGES[new Date().getDay() % SOCIO_MESSAGES.length]);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;

        // Parallelize all 4 initial fetches
        const [todayResult, missionsResult, scoreResult, bodyPhaseResult] = await Promise.allSettled([
          apiCall('/api/me/today', token),
          apiCall('/api/mini-missions', token),
          apiCall('/api/socio-score/today', token),
          apiCall('/api/body-phase', token),
        ]);

        if (todayResult.status === 'fulfilled') {
          setPlan(todayResult.value.plan);
          setTodayWorkout(todayResult.value.today);
        }

        if (missionsResult.status === 'fulfilled' && Array.isArray(missionsResult.value)) {
          setMissions(
            missionsResult.value.map((m: any) => ({
              id: String(m.id),
              label: String(m.label),
              icon: String(m.icon),
              done: Boolean(m.done),
            })),
          );
        }

        if (scoreResult.status === 'fulfilled') {
          const s = scoreResult.value;
          if (typeof s.total === 'number') setScore(s.total);
          if (typeof s.explanation === 'string') setScoreExplanation(s.explanation);
        }

        if (bodyPhaseResult.status === 'fulfilled') {
          const bp = bodyPhaseResult.value;
          setBodyPhase({
            tracking_enabled: Boolean(bp.tracking_enabled),
            recovery_mode: Boolean(bp.recovery_mode),
            auto_recovery_today: Boolean(bp.auto_recovery_today),
            current_phase: bp.current_phase ?? null,
          });
        }
      } catch {
        // Silently continue — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleMission(id: string) {
    // Optimistic update: mark as done locally immediately
    setMissions((prev) =>
      prev.map((m) => (m.id === id && !m.done ? { ...m, done: true } : m)),
    );
    try {
      const token = await getToken();
      if (!token) return;
      await apiCall(`/api/mini-missions/${id}/complete`, token, { method: 'POST' });
      // Refresh missions and score in parallel after completing
      const [missionsResult, scoreResult] = await Promise.allSettled([
        apiCall('/api/mini-missions', token),
        apiCall('/api/socio-score/today', token),
      ]);
      if (missionsResult.status === 'fulfilled' && Array.isArray(missionsResult.value)) {
        setMissions(
          missionsResult.value.map((m: any) => ({
            id: String(m.id),
            label: String(m.label),
            icon: String(m.icon),
            done: Boolean(m.done),
          })),
        );
      }
      if (scoreResult.status === 'fulfilled') {
        const s = scoreResult.value;
        if (typeof s.total === 'number') setScore(s.total);
        if (typeof s.explanation === 'string') setScoreExplanation(s.explanation);
      }
    } catch {
      // Revert optimistic update on failure
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, done: false } : m)),
      );
    }
  }

  const todayName = DAYS_ES[new Date().getDay()];
  const userName = user?.firstName ?? 'Socio';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.muted, marginTop: spacing.md, fontSize: 14 }}>
          Preparando tu día...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: 60,
        paddingBottom: 100,
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted }}>
          {greeting} ·{' '}
          <Text style={{ textTransform: 'capitalize' }}>{todayName}</Text>
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.text }}>
          {userName} 👋
        </Text>
      </View>

      {/* ── Check-in Energía ── */}
      <FadeInView delay={0}>
        <CheckInEnergia value={energy} onChange={setEnergy} colors={colors} />
      </FadeInView>

      {/* ── SOCIO Message ── */}
      <FadeInView delay={80}>
        <SOCIOMessage message={socioMsg} colors={colors} />
      </FadeInView>

      {/* ── SOCIO Score ── */}
      <FadeInView delay={160}>
        <SOCIOScoreCard score={score} colors={colors} />
        {scoreExplanation ? (
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: colors.muted,
              marginTop: -spacing.sm,
              paddingHorizontal: 2,
              lineHeight: 18,
            }}
          >
            {scoreExplanation}
          </Text>
        ) : null}
      </FadeInView>

      {/* ── Body Phase ── */}
      <FadeInView delay={240}>
        <BodyPhaseCard
          data={bodyPhase}
          onPress={() => router.push('/(app)/body-phase')}
          colors={colors}
        />
      </FadeInView>

      {/* ── Plan del Día ── */}
      <FadeInView delay={320}>
        <View>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text, marginBottom: spacing.md }}>
            Tu entrenamiento de hoy
          </Text>
          {plan ? (
            <PlanDiaCard
              workout={todayWorkout}
              onStart={() => router.push('/(app)/entrena')}
              colors={colors}
            />
          ) : (
            <PressableScale
              onPress={() => router.push('/onboarding')}
              style={[
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.xl,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: `${colors.energy}40`,
                  borderStyle: 'dashed',
                },
              ]}
            >
              <Text style={{ fontSize: 40, marginBottom: spacing.md }}>⚡</Text>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.text, textAlign: 'center' }}>
                Crea tu plan con SOCIO
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginTop: spacing.xs, textAlign: 'center' }}>
                Tu plan personalizado en menos de 30 segundos
              </Text>
              <View style={{ marginTop: spacing.md, backgroundColor: colors.energy, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md }}>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#FFF' }}>
                  Empezar →
                </Text>
              </View>
            </PressableScale>
          )}
        </View>
      </FadeInView>

      {/* ── Quick Log ── */}
      <FadeInView delay={400}>
        <QuickLog colors={colors} />
      </FadeInView>

      {/* ── Mini Misiones ── */}
      <FadeInView delay={480}>
        <MiniMisiones missions={missions} onToggle={toggleMission} colors={colors} />
      </FadeInView>
    </ScrollView>
  );
}
