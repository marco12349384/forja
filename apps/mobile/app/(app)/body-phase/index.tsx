import React, { useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { apiCall } from '@/lib/api';
import { spacing, radius, shadows } from '@/design/tokens';
import { useTheme } from '@/design/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────

interface CurrentPhase {
  phase: string;
  day_in_cycle: number;
  days_until_next_period: number;
  recommendation: string;
}

interface BodyPhaseData {
  tracking_enabled: boolean;
  last_period_start: string | null;
  avg_cycle_days: number;
  stress_level: number | null;
  sleep_quality: number | null;
  recovery_mode: boolean;
  current_phase: CurrentPhase | null;
  auto_recovery_today: boolean;
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

// ── Phase card (memoized) ─────────────────────────────────────────

const PhaseCard = memo(function PhaseCard({ phase, colors }: { phase: CurrentPhase; colors: ThemeColors }) {
  const PHASE_META: Record<string, { icon: string; label: string; color: string }> = {
    menstruation: { icon: '🌙', label: 'Menstruación', color: colors.calm },
    follicular:   { icon: '🌱', label: 'Folicular', color: colors.primary },
    ovulation:    { icon: '⚡', label: 'Ovulación', color: colors.energy },
    luteal:       { icon: '🌿', label: 'Lútea', color: colors.ai },
  };
  const meta = PHASE_META[phase.phase] ?? { icon: '🔄', label: phase.phase, color: colors.primary };
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1.5,
          borderColor: `${meta.color}40`,
          gap: spacing.sm,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${meta.color}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 18,
              color: colors.text,
            }}
          >
            Fase {meta.label}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: colors.muted,
              marginTop: 2,
            }}
          >
            Día {phase.day_in_cycle} · {phase.days_until_next_period} días para el próximo período
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: `${meta.color}12`,
          borderRadius: radius.sm,
          padding: spacing.md,
        }}
      >
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
          }}
        >
          {phase.recommendation}
        </Text>
      </View>
    </View>
  );
});

// ── Segmented control (1-5) ───────────────────────────────────────

function SegmentedSlider({
  value,
  onChange,
  emojis,
  colors,
}: {
  value: number | null;
  onChange: (v: number) => void;
  emojis: string[];
  colors: ThemeColors;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {emojis.map((emoji, idx) => {
        const level = idx + 1;
        const active = value === level;
        return (
          <TouchableOpacity
            key={level}
            onPress={() => onChange(level)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.sm,
              borderRadius: radius.sm,
              borderWidth: 1.5,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? `${colors.primary}15` : colors.card,
            }}
          >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 10,
                color: active ? colors.primary : colors.muted,
                marginTop: 2,
              }}
            >
              {level}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function BodyPhaseScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { colors, mode, setMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BodyPhaseData | null>(null);

  // Form state
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [avgCycleDays, setAvgCycleDays] = useState('28');
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const result: BodyPhaseData = await apiCall('/api/body-phase', token);
        setData(result);
        setTrackingEnabled(result.tracking_enabled);
        setLastPeriodStart(result.last_period_start ?? '');
        setAvgCycleDays(String(result.avg_cycle_days ?? 28));
        setStressLevel(result.stress_level);
        setSleepQuality(result.sleep_quality);
        setRecoveryMode(result.recovery_mode);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la fase corporal. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    // Validate
    const cycleDaysNum = parseInt(avgCycleDays, 10);
    if (isNaN(cycleDaysNum) || cycleDaysNum < 21 || cycleDaysNum > 40) {
      Alert.alert('Error', 'La duración del ciclo debe estar entre 21 y 40 días.');
      return;
    }
    if (
      trackingEnabled &&
      lastPeriodStart !== '' &&
      !ISO_DATE_RE.test(lastPeriodStart)
    ) {
      Alert.alert('Error', 'El formato de fecha debe ser YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');

      await apiCall('/api/body-phase', token, {
        method: 'POST',
        body: JSON.stringify({
          tracking_enabled: trackingEnabled,
          last_period_start: trackingEnabled && lastPeriodStart !== '' ? lastPeriodStart : null,
          avg_cycle_days: cycleDaysNum,
          stress_level: stressLevel,
          sleep_quality: sleepQuality,
          recovery_mode: recoveryMode,
        }),
      });

      Alert.alert('Guardado', 'Tu fase corporal se actualizó correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
            color: colors.muted,
            marginTop: spacing.md,
            fontSize: 14,
          }}
        >
          Cargando...
        </Text>
      </View>
    );
  }

  const autoRecovery = data?.auto_recovery_today ?? false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View
            style={{
              paddingTop: spacing.lg,
              paddingBottom: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'PlayfairDisplay_700Bold',
                  fontSize: 24,
                  color: colors.text,
                }}
              >
                Fase corporal
              </Text>
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 13,
                  color: colors.muted,
                }}
              >
                SOCIO ajusta tu plan según tu cuerpo
              </Text>
            </View>
          </View>

          {/* ── Cycle tracking toggle ── */}
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: spacing.md,
              },
              shadows.card,
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text
                  style={{
                    fontFamily: 'DMSans_700Bold',
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  Seguimiento de ciclo menstrual
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
                  SOCIO adapta tus entrenamientos a cada fase del ciclo
                </Text>
              </View>
              <Switch
                value={trackingEnabled}
                onValueChange={setTrackingEnabled}
                trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                thumbColor={trackingEnabled ? colors.primary : colors.subtle}
              />
            </View>

            {/* Cycle fields — shown when tracking is ON */}
            {trackingEnabled && (
              <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
                {/* Last period start */}
                <View style={{ gap: spacing.xs }}>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      fontSize: 12,
                      color: colors.muted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Inicio del último período
                  </Text>
                  <TextInput
                    value={lastPeriodStart}
                    onChangeText={setLastPeriodStart}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.subtle}
                    keyboardType="numbers-and-punctuation"
                    style={{
                      backgroundColor: colors.bg,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.sm,
                      fontFamily: 'SpaceMono_400Regular',
                      fontSize: 14,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Avg cycle days */}
                <View style={{ gap: spacing.xs }}>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      fontSize: 12,
                      color: colors.muted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Duración promedio del ciclo (21-40 días)
                  </Text>
                  <TextInput
                    value={avgCycleDays}
                    onChangeText={setAvgCycleDays}
                    placeholder="28"
                    placeholderTextColor={colors.subtle}
                    keyboardType="number-pad"
                    style={{
                      backgroundColor: colors.bg,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.sm,
                      fontFamily: 'SpaceMono_400Regular',
                      fontSize: 14,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Current phase card — shown when data available */}
                {data?.current_phase && (
                  <View style={{ marginTop: spacing.xs }}>
                    <Text
                      style={{
                        fontFamily: 'DMSans_500Medium',
                        fontSize: 12,
                        color: colors.muted,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: spacing.sm,
                      }}
                    >
                      Tu fase actual
                    </Text>
                    <PhaseCard phase={data.current_phase} colors={colors} />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Today's wellness ── */}
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: spacing.md,
                gap: spacing.lg,
              },
              shadows.card,
            ]}
          >
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 18,
                color: colors.text,
              }}
            >
              Bienestar de hoy
            </Text>

            {/* Stress */}
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 13,
                  color: colors.muted,
                }}
              >
                Nivel de estrés
              </Text>
              <SegmentedSlider
                value={stressLevel}
                onChange={setStressLevel}
                emojis={['😌', '😐', '😟', '😰', '🥵']}
                colors={colors}
              />
            </View>

            {/* Sleep quality */}
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 13,
                  color: colors.muted,
                }}
              >
                Calidad del sueño
              </Text>
              <SegmentedSlider
                value={sleepQuality}
                onChange={setSleepQuality}
                emojis={['😴', '😪', '🥱', '🙂', '😎']}
                colors={colors}
              />
            </View>
          </View>

          {/* ── Apariencia (theme toggle) ── */}
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: spacing.md,
                gap: spacing.md,
              },
              shadows.card,
            ]}
          >
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 18,
                color: colors.text,
              }}
            >
              Apariencia
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['light', 'dark', 'system'] as const).map((m) => {
                const active = mode === m;
                const label = m === 'light' ? '☀️ Claro' : m === 'dark' ? '🌙 Oscuro' : '⚙️ Sistema';
                return (
                  <PressableScale
                    key={m}
                    onPress={() => setMode(m)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.xs,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : colors.card,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? 'DMSans_700Bold' : 'DMSans_400Regular',
                        fontSize: 12,
                        color: active ? '#FFF' : colors.text,
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* ── Recovery mode ── */}
          <View
            style={[
              {
                backgroundColor: autoRecovery
                  ? `${colors.calm}12`
                  : colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: autoRecovery
                  ? `${colors.calm}40`
                  : colors.border,
                marginTop: spacing.md,
                gap: spacing.sm,
              },
              shadows.card,
            ]}
          >
            {autoRecovery && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  backgroundColor: `${colors.calm}20`,
                  borderRadius: radius.sm,
                  padding: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 16 }}>🌙</Text>
                <Text
                  style={{
                    fontFamily: 'DMSans_700Bold',
                    fontSize: 12,
                    color: colors.calm,
                    flex: 1,
                  }}
                >
                  Modo recuperación activado automáticamente — SOCIO Score bajo hoy
                </Text>
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text
                  style={{
                    fontFamily: 'DMSans_700Bold',
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  Modo recuperación
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
                  Cuando está activo, SOCIO ajusta tu plan a entrenamientos
                  ligeros y movilidad.
                </Text>
              </View>
              <Switch
                value={recoveryMode || autoRecovery}
                onValueChange={(v) => {
                  if (!autoRecovery) setRecoveryMode(v);
                }}
                disabled={autoRecovery}
                trackColor={{
                  false: colors.border,
                  true: `${colors.calm}60`,
                }}
                thumbColor={
                  recoveryMode || autoRecovery ? colors.calm : colors.subtle
                }
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Save button ── */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: spacing.lg,
            paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
            paddingTop: spacing.md,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
            style={[
              {
                backgroundColor: saving
                  ? `${colors.primary}70`
                  : colors.primary,
                borderRadius: radius.md,
                paddingVertical: 16,
                alignItems: 'center',
              },
              shadows.card,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                style={{
                  fontFamily: 'DMSans_700Bold',
                  fontSize: 16,
                  color: '#FFF',
                  letterSpacing: 0.3,
                }}
              >
                Guardar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
