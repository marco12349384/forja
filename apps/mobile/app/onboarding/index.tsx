import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { apiCall } from '@/lib/api';
import { spacing, radius, shadows } from '@/design/tokens';
import { useTheme } from '@/design/ThemeContext';
import type { OnboardingData, FitnessGoal, FitnessLevel, Equipment } from '@forja/types';
import { PressableScale } from '@/components/PressableScale';
import { analytics } from '@/lib/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Extended onboarding data ─────────────────────────────────────
interface PulsoOnboardingData extends Partial<OnboardingData> {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  mainChallenge?: string;
  trainingLocation?: string;
  dietType?: string;
  cookingFreq?: string;
  budget?: string;
  allergies?: string[];
  injuries?: string[];
}

const TOTAL_STEPS = 7;

// ── Step data ────────────────────────────────────────────────────
const GOALS: { value: FitnessGoal; label: string; icon: string; desc: string }[] = [
  { value: 'perder_peso', label: 'Perder grasa', icon: '🔥', desc: 'Reducir % de grasa corporal' },
  { value: 'ganar_musculo', label: 'Ganar músculo', icon: '💪', desc: 'Aumentar masa y fuerza' },
  { value: 'resistencia', label: 'Resistencia', icon: '🏃', desc: 'Aguantar más, cansar menos' },
  { value: 'movilidad', label: 'Flexibilidad', icon: '🧘', desc: 'Yoga, pilates, movilidad' },
  { value: 'fitness_general', label: 'Bienestar general', icon: '🌿', desc: 'Todo en balance' },
];

const LEVELS: { value: FitnessLevel; label: string; desc: string; icon: string }[] = [
  { value: 'principiante', label: 'Sedentario / Principiante', desc: 'Menos de 6 meses activo', icon: '🌱' },
  { value: 'intermedio', label: 'Intermedio', desc: '1-2 años entrenando', icon: '🌿' },
  { value: 'avanzado', label: 'Avanzado', desc: '3+ años, entreno seguido', icon: '🌳' },
];

const EQUIPMENT_LIST: { value: Equipment; label: string; icon: string }[] = [
  { value: 'ninguno', label: 'Sin equipo', icon: '🏠' },
  { value: 'mancuernas', label: 'Mancuernas', icon: '🏋️' },
  { value: 'barra', label: 'Barra + pesas', icon: '🔩' },
  { value: 'anillas', label: 'Anillas / TRX', icon: '⭕' },
  { value: 'bandas', label: 'Bandas elásticas', icon: '🔗' },
  { value: 'gym_completo', label: 'Gym completo', icon: '🏟️' },
];

const DIET_TYPES = [
  { value: 'omnivoro', label: 'Omnívoro', icon: '🍖' },
  { value: 'vegetariano', label: 'Vegetariano', icon: '🥦' },
  { value: 'vegano', label: 'Vegano', icon: '🌱' },
  { value: 'sin_gluten', label: 'Sin gluten', icon: '🌾' },
  { value: 'sin_lactosa', label: 'Sin lactosa', icon: '🥛' },
  { value: 'otro', label: 'Otra / Mixta', icon: '🍽️' },
];

const CHALLENGES = [
  { value: 'motivacion', label: 'Mantener motivación', icon: '🔋' },
  { value: 'tiempo', label: 'Falta de tiempo', icon: '⏰' },
  { value: 'que_hacer', label: 'No sé qué hacer', icon: '❓' },
  { value: 'dieta', label: 'Controlar la dieta', icon: '🥗' },
];

const TRAINING_LOCATIONS = [
  { value: 'casa_sin', label: 'Casa sin equipo', icon: '🛋️' },
  { value: 'casa_con', label: 'Casa con equipo', icon: '🏠' },
  { value: 'gym', label: 'Gym completo', icon: '🏋️' },
  { value: 'exterior', label: 'Al aire libre', icon: '🌳' },
  { value: 'varia', label: 'Varía', icon: '🔄' },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6];
const DURATION_OPTIONS = [20, 45, 60, 90];

type ThemeColors = ReturnType<typeof useTheme>['colors'];

// ── Reusable option button ────────────────────────────────────────
function OptionBtn({
  active,
  onPress,
  icon,
  label,
  desc,
  accentColor,
  half = false,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  icon: string;
  label: string;
  desc?: string;
  accentColor?: string;
  half?: boolean;
  colors: ThemeColors;
}) {
  const resolvedAccent = accentColor ?? colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: half ? 'column' : 'row',
        alignItems: half ? 'center' : 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: active ? resolvedAccent : colors.border,
        backgroundColor: active ? `${resolvedAccent}12` : colors.surface,
        width: half ? '48%' : '100%',
      }}
    >
      <Text style={{ fontSize: half ? 26 : 22 }}>{icon}</Text>
      <View style={{ flex: half ? undefined : 1 }}>
        <Text
          style={{
            fontFamily: active ? 'DMSans_700Bold' : 'DMSans_500Medium',
            fontSize: 14,
            color: active ? resolvedAccent : colors.text,
            textAlign: half ? 'center' : 'left',
          }}
        >
          {label}
        </Text>
        {desc && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {desc}
          </Text>
        )}
      </View>
      {active && !half && (
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: resolvedAccent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, color: '#FFF' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Step Header ──────────────────────────────────────────────────
function StepHeader({ step, title, subtitle, colors }: { step: number; title: string; subtitle?: string; colors: ThemeColors }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.ai, letterSpacing: 0.5 }}>
        Paso {step} de {TOTAL_STEPS}
      </Text>
      <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: colors.text, lineHeight: 34 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevStep = useRef(step);

  const startTimeRef = useRef(Date.now());
  const [data, setData] = useState<PulsoOnboardingData>({
    equipment: [],
    injuries: [],
    daysPerWeek: 3,
    sessionDurationMin: 45,
    allergies: [],
  });

  // Animate step transitions
  useEffect(() => {
    const direction = step > prevStep.current ? 1 : -1;
    prevStep.current = step;
    // Slide in from direction
    slideAnim.setValue(direction * SCREEN_WIDTH * 0.3);
    const anim = Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 80, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [step, slideAnim]);

  // ── Helpers ────────────────────────────────────────────────────
  function toggle<T>(field: keyof PulsoOnboardingData, value: T) {
    setData((prev) => {
      const arr = (prev[field] as T[]) ?? [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  }

  const canContinue = (() => {
    if (step === 1) return !!data.goal || (((data as any).goals as string[] | undefined)?.length ?? 0) > 0;
    if (step === 2) return !!(data.weightKg && data.heightCm && data.age);
    if (step === 3) return !!data.fitnessLevel;
    if (step === 4) return !!(data.daysPerWeek && data.sessionDurationMin);
    if (step >= 5) return true; // optional steps
    return true;
  })();

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');
      await apiCall('/api/generate-plan', token, {
        method: 'POST',
        body: JSON.stringify({ profile: data }),
      });
      analytics.track('onboarding_completed', {
        steps_skipped: 0,
        time_to_complete: Math.round((Date.now() - startTimeRef.current) / 1000),
      });
      router.replace('/(app)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tu plan');
      setLoading(false);
    }
  }

  // ── STEP CONTENT ──────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      // STEP 1 — Objetivo (MULTI-SELECT)
      case 1: {
        const selectedGoals = ((data as any).goals as string[] | undefined) ?? (data.goal ? [data.goal] : []);
        const toggleGoal = (g: string) => {
          setData((p) => {
            const current = ((p as any).goals as string[] | undefined) ?? (p.goal ? [p.goal] : []);
            const next = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
            return { ...p, goals: next, goal: next[0] ?? p.goal } as any;
          });
        };
        return (
          <>
            <StepHeader step={1} title="¿Qué quieres lograr?" subtitle="Puedes elegir varios. SOCIO combinará disciplinas para todos." colors={colors} />
            {GOALS.map((g) => {
              const active = selectedGoals.includes(g.value);
              return (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => toggleGoal(g.value)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: active ? colors.energy : colors.border,
                    backgroundColor: active ? `${colors.energy}10` : colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{g.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: active ? colors.energy : colors.text }}>
                      {g.label}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {g.desc}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: active ? colors.energy : colors.border,
                      backgroundColor: active ? colors.energy : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {active && <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle, marginTop: spacing.xs, textAlign: 'center' }}>
              {selectedGoals.length === 0
                ? 'Elige al menos uno para continuar'
                : `${selectedGoals.length} ${selectedGoals.length === 1 ? 'objetivo seleccionado' : 'objetivos seleccionados'}`}
            </Text>
          </>
        );
      }

      // STEP 2 — Datos corporales
      case 2:
        return (
          <>
            <StepHeader step={2} title="Cuéntame de tu cuerpo" subtitle="Esto permite a SOCIO calcular tus necesidades exactas." colors={colors} />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {/* Peso */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: 6 }}>Peso (kg)</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={data.weightKg?.toString() ?? ''}
                  onChangeText={(v) => setData((p) => ({ ...p, weightKg: v ? parseFloat(v) : undefined }))}
                  placeholder="70"
                  placeholderTextColor={colors.subtle}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: data.weightKg ? colors.primary : colors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 14,
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>
              {/* Altura */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: 6 }}>Altura (cm)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={data.heightCm?.toString() ?? ''}
                  onChangeText={(v) => setData((p) => ({ ...p, heightCm: v ? parseInt(v) : undefined }))}
                  placeholder="175"
                  placeholderTextColor={colors.subtle}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: data.heightCm ? colors.primary : colors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 14,
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Edad */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: 6 }}>Edad</Text>
              <TextInput
                keyboardType="number-pad"
                value={data.age?.toString() ?? ''}
                onChangeText={(v) => setData((p) => ({ ...p, age: v ? parseInt(v) : undefined }))}
                placeholder="25"
                placeholderTextColor={colors.subtle}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: data.age ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 14,
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 16,
                  color: colors.text,
                  width: '48%',
                }}
              />
            </View>

            {/* Sexo biológico */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>Sexo biológico</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {(['masculino', 'femenino', 'otro'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setData((p) => ({ ...p, gender: g }))}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: data.gender === g ? colors.ai : colors.border,
                      backgroundColor: data.gender === g ? `${colors.ai}12` : colors.surface,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: data.gender === g ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: data.gender === g ? colors.ai : colors.muted, textTransform: 'capitalize' }}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle, marginTop: 6 }}>
                Se usa para ajustar cálculos hormonales y de recuperación.
              </Text>
            </View>

            {/* % de grasa corporal (opcional) */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: 6 }}>
                % grasa corporal estimado (opcional)
              </Text>
              <TextInput
                keyboardType="number-pad"
                value={(data as any).bodyFatPct?.toString() ?? ''}
                onChangeText={(v) => setData((p) => ({ ...p, bodyFatPct: v ? parseInt(v) : undefined } as any))}
                placeholder="ej. 18"
                placeholderTextColor={colors.subtle}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: (data as any).bodyFatPct ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 14,
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 16,
                  color: colors.text,
                  width: '48%',
                }}
              />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle, marginTop: 6 }}>
                Si no sabes, déjalo en blanco — SOCIO lo estimará.
              </Text>
            </View>

            {/* Horas de sueño */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Horas de sueño promedio
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                {(['<5', '5-6', '6-7', '7-8', '8+'] as const).map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setData((p) => ({ ...p, sleepHours: h } as any))}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.full,
                      borderWidth: 1.5,
                      borderColor: (data as any).sleepHours === h ? colors.calm : colors.border,
                      backgroundColor: (data as any).sleepHours === h ? `${colors.calm}15` : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: (data as any).sleepHours === h ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: (data as any).sleepHours === h ? colors.calm : colors.muted }}>
                      {h} hrs
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Vasos de agua/día */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Vasos de agua que tomas al día
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                {(['<4', '4-6', '6-8', '8+'] as const).map((w) => (
                  <TouchableOpacity
                    key={w}
                    onPress={() => setData((p) => ({ ...p, waterGlasses: w } as any))}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.full,
                      borderWidth: 1.5,
                      borderColor: (data as any).waterGlasses === w ? colors.calm : colors.border,
                      backgroundColor: (data as any).waterGlasses === w ? `${colors.calm}15` : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: (data as any).waterGlasses === w ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: (data as any).waterGlasses === w ? colors.calm : colors.muted }}>
                      💧 {w}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actividad diaria fuera del gym */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Tu día a día (fuera del entreno)
              </Text>
              <View style={{ gap: spacing.xs }}>
                {([
                  { v: 'sedentario', label: 'Sedentario — escritorio, poco movimiento' },
                  { v: 'ligero',     label: 'Ligero — algo de caminata diaria' },
                  { v: 'activo',     label: 'Activo — trabajo de pie / muchos pasos' },
                  { v: 'muy_activo', label: 'Muy activo — trabajo físico' },
                ] as const).map((a) => (
                  <TouchableOpacity
                    key={a.v}
                    onPress={() => setData((p) => ({ ...p, dailyActivityLevel: a.v } as any))}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: (data as any).dailyActivityLevel === a.v ? colors.primary : colors.border,
                      backgroundColor: (data as any).dailyActivityLevel === a.v ? `${colors.primary}10` : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: (data as any).dailyActivityLevel === a.v ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: (data as any).dailyActivityLevel === a.v ? colors.primary : colors.text }}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experiencia previa */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                ¿Cuánto llevas entrenando regularmente?
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                {([
                  { v: 'nunca',     label: 'Nunca / volver de 0' },
                  { v: '<6m',       label: '<6 meses' },
                  { v: '6m-2y',     label: '6m - 2 años' },
                  { v: '2-5y',      label: '2 - 5 años' },
                  { v: '5+y',       label: '5+ años' },
                ] as const).map((e) => (
                  <TouchableOpacity
                    key={e.v}
                    onPress={() => setData((p) => ({ ...p, trainingExperience: e.v } as any))}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.full,
                      borderWidth: 1.5,
                      borderColor: (data as any).trainingExperience === e.v ? colors.ai : colors.border,
                      backgroundColor: (data as any).trainingExperience === e.v ? `${colors.ai}12` : colors.surface,
                    }}
                  >
                    <Text style={{ fontFamily: (data as any).trainingExperience === e.v ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: (data as any).trainingExperience === e.v ? colors.ai : colors.muted }}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      // STEP 3 — Nivel + reto
      case 3:
        return (
          <>
            <StepHeader step={3} title="¿Cuál es tu nivel?" subtitle="Sé honesto — así SOCIO no te mata el primer día 😄" colors={colors} />
            {LEVELS.map((l) => (
              <OptionBtn
                key={l.value}
                active={data.fitnessLevel === l.value}
                onPress={() => setData((p) => ({ ...p, fitnessLevel: l.value }))}
                icon={l.icon}
                label={l.label}
                desc={l.desc}
                accentColor={colors.primary}
                colors={colors}
              />
            ))}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
                ¿Cuál es tu mayor reto?
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {CHALLENGES.map((c) => {
                  const active = data.mainChallenge === c.value;
                  return (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setData((p) => ({ ...p, mainChallenge: c.value }))}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 8,
                        borderRadius: radius.full,
                        borderWidth: 1.5,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? `${colors.primary}12` : colors.surface,
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.primary : colors.muted }}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        );

      // STEP 4 — Disponibilidad
      case 4: {
        const WEEK_DAYS = [
          { key: 'lunes', label: 'L' },
          { key: 'martes', label: 'M' },
          { key: 'miercoles', label: 'X' },
          { key: 'jueves', label: 'J' },
          { key: 'viernes', label: 'V' },
          { key: 'sabado', label: 'S' },
          { key: 'domingo', label: 'D' },
        ] as const;
        const selectedDays = ((data as any).preferredDays as string[] | undefined) ?? [];
        const toggleDay = (k: string) => {
          setData((p) => {
            const curr = ((p as any).preferredDays as string[] | undefined) ?? [];
            const next = curr.includes(k) ? curr.filter((d) => d !== k) : [...curr, k];
            return { ...p, preferredDays: next, daysPerWeek: next.length || p.daysPerWeek } as any;
          });
        };
        return (
          <>
            <StepHeader step={4} title="¿Cuánto tiempo tienes?" subtitle="Marca los días específicos que puedes entrenar y ajusta la duración." colors={colors} />

            {/* Días específicos de la semana */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text, marginBottom: spacing.sm }}>
                Días que puedes entrenar
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {WEEK_DAYS.map((d) => {
                  const active = selectedDays.includes(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => toggleDay(d.key)}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? colors.energy : colors.border,
                        backgroundColor: active ? colors.energy : colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: active ? '#FFF' : colors.muted }}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle, marginTop: 6 }}>
                {selectedDays.length === 0
                  ? 'Si no marcas ninguno, SOCIO escoge los días por ti.'
                  : `${selectedDays.length} ${selectedDays.length === 1 ? 'día' : 'días'} por semana`}
              </Text>
            </View>

            {/* Cantidad de días (alternativa rápida) */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text, marginBottom: spacing.sm }}>
                O elige cantidad de días:{' '}
                <Text style={{ fontFamily: 'SpaceMono_400Regular', color: colors.energy, fontSize: 16 }}>
                  {data.daysPerWeek}
                </Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {DAYS_OPTIONS.map((d) => {
                  const active = data.daysPerWeek === d && selectedDays.length === 0;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setData((p) => ({ ...p, daysPerWeek: d, preferredDays: [] } as any))}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? colors.energy : colors.border,
                        backgroundColor: active ? `${colors.energy}15` : colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: active ? 'SpaceMono_400Regular' : 'DMSans_400Regular', fontSize: 16, color: active ? colors.energy : colors.muted }}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Duración por sesión */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text, marginBottom: spacing.sm }}>
                Minutos por sesión:{' '}
                <Text style={{ fontFamily: 'SpaceMono_400Regular', color: colors.energy, fontSize: 16 }}>
                  {data.sessionDurationMin} min
                </Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                {[20, 30, 45, 60, 75, 90, 120].map((m) => {
                  const active = data.sessionDurationMin === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setData((p) => ({ ...p, sessionDurationMin: m }))}
                      style={{
                        flex: 1,
                        minWidth: 80,
                        paddingVertical: 12,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? colors.energy : colors.border,
                        backgroundColor: active ? `${colors.energy}15` : colors.surface,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.energy : colors.muted }}>
                        {m} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duración custom */}
              <View style={{ marginTop: spacing.sm }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle, marginBottom: 4 }}>
                  ¿Otro tiempo? Escríbelo aquí:
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  value={![20, 30, 45, 60, 75, 90, 120].includes(data.sessionDurationMin ?? 0) ? data.sessionDurationMin?.toString() ?? '' : ''}
                  onChangeText={(v) => {
                    const n = v ? parseInt(v) : undefined;
                    if (n && n >= 10 && n <= 240) setData((p) => ({ ...p, sessionDurationMin: n }));
                  }}
                  placeholder="ej. 50"
                  placeholderTextColor={colors.subtle}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 10,
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 14,
                    color: colors.text,
                    width: 100,
                  }}
                />
              </View>
            </View>
          </>
        );
      }

      // STEP 5 — Cuerpo + lesiones
      case 5:
        return (
          <>
            <StepHeader step={5} title="Limitaciones físicas" subtitle="Esto es importante para evitar lesiones. Es opcional." colors={colors} />
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                ¿Alguna lesión o zona a evitar?
              </Text>
              <TextInput
                value={data.injuries?.join(', ') ?? ''}
                onChangeText={(t) =>
                  setData((p) => ({
                    ...p,
                    injuries: t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [],
                  }))
                }
                placeholder="Ej: rodilla derecha, lumbar, hombro izquierdo..."
                placeholderTextColor={colors.subtle}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 14,
                  color: colors.text,
                  minHeight: 90,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </>
        );

      // STEP 6 — Equipamiento
      case 6:
        return (
          <>
            <StepHeader step={6} title="¿Dónde y con qué entrenas?" colors={colors} />

            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Lugar principal de entrenamiento
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {TRAINING_LOCATIONS.map((loc) => {
                  const active = data.trainingLocation === loc.value;
                  return (
                    <TouchableOpacity
                      key={loc.value}
                      onPress={() => setData((p) => ({ ...p, trainingLocation: loc.value }))}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 10,
                        borderRadius: radius.full,
                        borderWidth: 1.5,
                        borderColor: active ? colors.calm : colors.border,
                        backgroundColor: active ? `${colors.calm}15` : colors.surface,
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{loc.icon}</Text>
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.calm : colors.muted }}>
                        {loc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Equipo disponible (varios)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {EQUIPMENT_LIST.map((eq) => {
                  const active = (data.equipment ?? []).includes(eq.value);
                  return (
                    <TouchableOpacity
                      key={eq.value}
                      onPress={() => toggle<Equipment>('equipment', eq.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 10,
                        borderRadius: radius.full,
                        borderWidth: 1.5,
                        borderColor: active ? colors.calm : colors.border,
                        backgroundColor: active ? `${colors.calm}15` : colors.surface,
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{eq.icon}</Text>
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.calm : colors.muted }}>
                        {eq.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        );

      // STEP 7 — Dieta
      case 7:
        return (
          <>
            <StepHeader step={7} title="Tu alimentación" subtitle="SOCIO te sugerirá comidas que realmente puedas preparar." colors={colors} />

            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Tipo de dieta
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {DIET_TYPES.map((dt) => {
                  const active = data.dietType === dt.value;
                  return (
                    <TouchableOpacity
                      key={dt.value}
                      onPress={() => setData((p) => ({ ...p, dietType: dt.value }))}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 10,
                        borderRadius: radius.full,
                        borderWidth: 1.5,
                        borderColor: active ? colors.calm : colors.border,
                        backgroundColor: active ? `${colors.calm}15` : colors.surface,
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{dt.icon}</Text>
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.calm : colors.muted }}>
                        {dt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Presupuesto semanal para comida
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[
                  { value: 'bajo', label: 'Ajustado', icon: '💰' },
                  { value: 'medio', label: 'Normal', icon: '💵' },
                  { value: 'alto', label: 'Sin límite', icon: '💎' },
                ].map((b) => {
                  const active = data.budget === b.value;
                  return (
                    <TouchableOpacity
                      key={b.value}
                      onPress={() => setData((p) => ({ ...p, budget: b.value }))}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 14,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? colors.calm : colors.border,
                        backgroundColor: active ? `${colors.calm}15` : colors.surface,
                        gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{b.icon}</Text>
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.calm : colors.muted }}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                ¿Cocinas en casa?
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[
                  { value: 'siempre', label: 'Siempre' },
                  { value: 'aveces', label: 'A veces' },
                  { value: 'casi_nunca', label: 'Casi nunca' },
                ].map((c) => {
                  const active = data.cookingFreq === c.value;
                  return (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setData((p) => ({ ...p, cookingFreq: c.value }))}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? colors.calm : colors.border,
                        backgroundColor: active ? `${colors.calm}15` : colors.surface,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: active ? colors.calm : colors.muted }}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Allergies */}
            <View>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text, marginBottom: spacing.sm }}>
                Alergias o intolerancias (opcional)
              </Text>
              <TextInput
                value={data.allergies?.join(', ') ?? ''}
                onChangeText={(t) =>
                  setData((p) => ({
                    ...p,
                    allergies: t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [],
                  }))
                }
                placeholder="Ej: gluten, mariscos, nueces..."
                placeholderTextColor={colors.subtle}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 14,
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 14,
                  color: colors.text,
                }}
              />
            </View>

            {error ? (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.error }}>
                {error}
              </Text>
            ) : null}

            {loading && (
              <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.text, textAlign: 'center' }}>
                  SOCIO está creando tu plan...
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>
                  Esto puede tardar unos segundos
                </Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Progress bar */}
      <View style={{ paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i < step ? colors.primary : `${colors.primary}20`,
              }}
            />
          ))}
        </View>
        {step > 4 && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle, marginTop: 6, textAlign: 'right' }}>
            Opcional — puedes continuar
          </Text>
        )}
      </View>

      <Animated.ScrollView
        style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 100,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </Animated.ScrollView>

      {/* Navigation buttons */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        {step > 1 && (
          <PressableScale
            onPress={() => setStep((s) => s - 1)}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: colors.muted }}>
              Atrás
            </Text>
          </PressableScale>
        )}

        {step < TOTAL_STEPS ? (
          <PressableScale
            onPress={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            style={[
              {
                flex: step > 1 ? 2 : 1,
                paddingVertical: 16,
                borderRadius: radius.md,
                alignItems: 'center',
                backgroundColor: canContinue ? colors.primary : `${colors.primary}40`,
              },
              canContinue ? shadows.card : undefined,
            ]}
          >
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFF' }}>
              Continuar
            </Text>
          </PressableScale>
        ) : (
          <PressableScale
            onPress={handleFinish}
            disabled={loading}
            style={[
              {
                flex: 2,
                paddingVertical: 16,
                borderRadius: radius.md,
                alignItems: 'center',
                backgroundColor: loading ? `${colors.energy}60` : colors.energy,
              },
              !loading ? shadows.energy : undefined,
            ]}
          >
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFF' }}>
              {loading ? 'Creando plan...' : 'Crear mi plan con SOCIO ✨'}
            </Text>
          </PressableScale>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
