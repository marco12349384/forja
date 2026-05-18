import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { spacing, radius, shadows } from '@/design/tokens';
import { useTheme } from '@/design/ThemeContext';
import { apiCall } from '@/lib/api';
import { analytics } from '@/lib/analytics';

// ── Types ─────────────────────────────────────────────────────────
type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack';
type ScreenState = 'idle' | 'uploading' | 'preview' | 'done';

const MEAL_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack: 'Snack',
};
const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack'];

interface SnapResult {
  preview: boolean;
  confidence_score: number;
  description: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  message?: string;
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

// ── Confidence Bar ─────────────────────────────────────────────────
function ConfidenceBar({ score, colors }: { score: number; colors: ThemeColors }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? colors.calm : score >= 0.3 ? colors.warning : colors.error;
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.muted }}>
          Confianza
        </Text>
        <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 12, color }}>
          {pct}%
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function SnapEatScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { colors } = useTheme();

  const [state, setState] = useState<ScreenState>('idle');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('almuerzo');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable form state (for preview mode)
  const [editDescription, setEditDescription] = useState('');
  const [editKcal, setEditKcal] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const populateEditForm = (result: SnapResult) => {
    setEditDescription(result.description);
    setEditKcal(String(result.kcal));
    setEditProtein(String(Math.round(result.protein_g)));
    setEditCarbs(String(Math.round(result.carbs_g)));
    setEditFat(String(Math.round(result.fat_g)));
  };

  const analyzeImage = async (base64: string, uri: string) => {
    setState('uploading');
    setImageUri(uri);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');

      const data: SnapResult = await apiCall('/api/nutrition/snap-eat', token, {
        method: 'POST',
        body: JSON.stringify({
          image_base64: base64,
          meal_type: selectedMealType,
        }),
      });

      setSnapResult(data);

      analytics.track('snap_eat_used', {
        confidence_score: data.confidence_score,
        manual_correction: data.preview,
      });

      if (data.preview) {
        // Low confidence — show edit form
        populateEditForm(data);
        setState('preview');
      } else {
        // High confidence — logged automatically
        analytics.track('meal_logged', {
          method: 'snap',
          kcal: data.kcal,
        });
        setState('done');
        setTimeout(() => router.back(), 1500);
      }
    } catch (err: any) {
      let msg = 'No se pudo procesar la imagen. Intenta de nuevo.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error) msg = parsed.error;
      } catch {
        // keep default
      }
      setError(msg);
      setState('idle');
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para Snap & Eat.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.5,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.base64) {
      await analyzeImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.5,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.base64) {
      await analyzeImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const handleConfirmPreview = async () => {
    const kcalNum = parseFloat(editKcal);
    if (!editDescription.trim()) {
      Alert.alert('Error', 'La descripción es requerida.');
      return;
    }
    if (isNaN(kcalNum) || kcalNum < 0) {
      Alert.alert('Error', 'Ingresa un valor de calorías válido.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');

      await apiCall('/api/nutrition/log', token, {
        method: 'POST',
        body: JSON.stringify({
          meal_type: selectedMealType,
          description: editDescription.trim(),
          kcal: kcalNum,
          protein_g: editProtein !== '' ? parseFloat(editProtein) : null,
          carbs_g: editCarbs !== '' ? parseFloat(editCarbs) : null,
          fat_g: editFat !== '' ? parseFloat(editFat) : null,
        }),
      });

      setSnapResult({
        ...snapResult!,
        description: editDescription.trim(),
        kcal: kcalNum,
        protein_g: editProtein !== '' ? parseFloat(editProtein) : 0,
        carbs_g: editCarbs !== '' ? parseFloat(editCarbs) : 0,
        fat_g: editFat !== '' ? parseFloat(editFat) : 0,
        preview: false,
      });
      analytics.track('meal_logged', {
        method: 'snap',
        kcal: kcalNum,
      });
      setState('done');
      setTimeout(() => router.back(), 1500);
    } catch {
      Alert.alert('Error', 'No se pudo registrar la comida. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setState('idle');
    setImageUri(null);
    setSnapResult(null);
    setError(null);
  };

  // ── Meal type selector (used in idle + preview states) ──────────
  const MealSelector = () => (
    <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
      {MEAL_TYPES.map((mt) => (
        <TouchableOpacity
          key={mt}
          onPress={() => setSelectedMealType(mt)}
          style={{
            paddingVertical: 6,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.full,
            backgroundColor: selectedMealType === mt ? colors.calm : `${colors.calm}15`,
            borderWidth: 1,
            borderColor: selectedMealType === mt ? colors.calm : colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: 13,
              color: selectedMealType === mt ? '#FFF' : colors.calm,
            }}
          >
            {MEAL_LABELS[mt]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: colors.text }}>
                Snap & Eat
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>
                Foto de tu plato → SOCIO identifica los macros
              </Text>
            </View>
          </View>

          {/* ── IDLE STATE ──────────────────────────────────── */}
          {state === 'idle' && (
            <View style={{ gap: spacing.lg }}>
              {/* Meal type selector */}
              <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted, marginBottom: spacing.sm }}>
                  ¿Para qué comida?
                </Text>
                <MealSelector />
              </View>

              {/* Camera preview placeholder */}
              <View
                style={{
                  height: 220,
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 48 }}>📸</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted }}>
                  Tu foto aparecerá aquí
                </Text>
              </View>

              {/* Error */}
              {error && (
                <View style={{ backgroundColor: `${colors.error}15`, borderRadius: radius.sm, padding: spacing.sm }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.error }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <TouchableOpacity
                onPress={handleCamera}
                activeOpacity={0.85}
                style={[
                  {
                    backgroundColor: colors.calm,
                    borderRadius: radius.lg,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                  },
                  shadows.card,
                ]}
              >
                <Text style={{ fontSize: 20 }}>📷</Text>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFF' }}>
                  Tomar foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGallery}
                activeOpacity={0.7}
                style={{ alignItems: 'center', paddingVertical: spacing.sm }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.calm }}>
                  🖼️  Elegir de galería
                </Text>
              </TouchableOpacity>

              {/* How it works */}
              <View style={[{ backgroundColor: `${colors.ai}10`, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: `${colors.ai}20` }, shadows.card]}>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text, marginBottom: spacing.sm }}>
                  ¿Cómo funciona?
                </Text>
                {[
                  ['📸', 'Toma una foto de tu plato'],
                  ['🤖', 'SOCIO analiza los ingredientes con IA'],
                  ['📊', 'Los macros se registran automáticamente'],
                ].map(([icon, text]) => (
                  <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <Text style={{ fontSize: 16 }}>{icon}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, flex: 1 }}>
                      {text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── UPLOADING STATE ──────────────────────────────── */}
          {state === 'uploading' && (
            <View style={{ gap: spacing.lg }}>
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 260, borderRadius: radius.lg }}
                  resizeMode="cover"
                />
              )}
              <View
                style={[
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    alignItems: 'center',
                    gap: spacing.md,
                    borderWidth: 1,
                    borderColor: `${colors.ai}30`,
                  },
                  shadows.card,
                ]}
              >
                <ActivityIndicator size="large" color={colors.ai} />
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.text }}>
                  Analizando...
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                  SOCIO está identificando los ingredientes y calculando los macros
                </Text>
                {/* Animated dots hint */}
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  {[colors.ai, `${colors.ai}70`, `${colors.ai}40`].map((c, i) => (
                    <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── PREVIEW STATE (low confidence) ───────────────── */}
          {state === 'preview' && snapResult && (
            <View style={{ gap: spacing.lg }}>
              {/* Image */}
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 200, borderRadius: radius.lg }}
                  resizeMode="cover"
                />
              )}

              {/* AI result card */}
              <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                  <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>
                    Análisis de SOCIO
                  </Text>
                </View>

                <ConfidenceBar score={snapResult.confidence_score} colors={colors} />

                {snapResult.message && (
                  <View style={{ backgroundColor: `${colors.warning}15`, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted }}>
                      {snapResult.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* Meal type */}
              <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted, marginBottom: spacing.sm }}>
                  Tipo de comida
                </Text>
                <MealSelector />
              </View>

              {/* Editable form */}
              <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>
                  Confirma o edita los datos
                </Text>

                {/* Description */}
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.muted }}>
                    Descripción *
                  </Text>
                  <TextInput
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Descripción del plato"
                    placeholderTextColor={colors.subtle}
                    style={{
                      backgroundColor: colors.bg,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.sm,
                      fontFamily: 'DMSans_400Regular',
                      fontSize: 14,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Calories */}
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.muted }}>
                    Calorías (kcal) *
                  </Text>
                  <TextInput
                    value={editKcal}
                    onChangeText={setEditKcal}
                    placeholder="0"
                    placeholderTextColor={colors.subtle}
                    keyboardType="decimal-pad"
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

                {/* Macros row */}
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {([
                    ['Proteína (g)', editProtein, setEditProtein],
                    ['Carbos (g)', editCarbs, setEditCarbs],
                    ['Grasas (g)', editFat, setEditFat],
                  ] as [string, string, (v: string) => void][]).map(([label, value, setter]) => (
                    <View key={label} style={{ flex: 1, gap: spacing.xs }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.muted }}>
                        {label}
                      </Text>
                      <TextInput
                        value={value}
                        onChangeText={setter}
                        placeholder="—"
                        placeholderTextColor={colors.subtle}
                        keyboardType="decimal-pad"
                        style={{
                          backgroundColor: colors.bg,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                          padding: spacing.sm,
                          fontFamily: 'SpaceMono_400Regular',
                          fontSize: 12,
                          color: colors.text,
                          textAlign: 'center',
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>

              {/* Action buttons */}
              <TouchableOpacity
                onPress={handleConfirmPreview}
                disabled={submitting}
                activeOpacity={0.85}
                style={[
                  {
                    backgroundColor: submitting ? `${colors.calm}70` : colors.calm,
                    borderRadius: radius.lg,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                  },
                  shadows.card,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFF' }}>
                    Registrar comida
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReset}
                disabled={submitting}
                activeOpacity={0.7}
                style={{ alignItems: 'center', paddingVertical: spacing.sm }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.muted }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── DONE STATE ───────────────────────────────────── */}
          {state === 'done' && snapResult && (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: spacing.xxl,
                gap: spacing.lg,
              }}
            >
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 200, borderRadius: radius.lg, opacity: 0.85 }}
                  resizeMode="cover"
                />
              )}

              <View
                style={[
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    alignItems: 'center',
                    gap: spacing.md,
                    borderWidth: 1,
                    borderColor: `${colors.calm}40`,
                    width: '100%',
                  },
                  shadows.card,
                ]}
              >
                <Text style={{ fontSize: 48 }}>✅</Text>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: colors.text, textAlign: 'center' }}>
                  Registrado
                </Text>
                <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 28, color: colors.calm }}>
                  +{snapResult.kcal} kcal
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                  {snapResult.description}
                </Text>

                {/* Macro summary */}
                <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs }}>
                  {[
                    { label: 'Proteína', value: snapResult.protein_g, color: colors.energy },
                    { label: 'Carbos', value: snapResult.carbs_g, color: colors.ai },
                    { label: 'Grasas', value: snapResult.fat_g, color: colors.calm },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={{ alignItems: 'center', gap: 2 }}>
                      <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 16, color }}>
                        {Math.round(value)}g
                      </Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted }}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.subtle }}>
                  Volviendo...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
