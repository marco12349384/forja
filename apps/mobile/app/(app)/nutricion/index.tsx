import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, spacing, radius, shadows } from '@/design/tokens';
import { apiCall } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────
type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack';

interface FoodLogItem {
  id: string;
  description: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface Macros {
  kcal: number;
  kcalGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  fat: number;
  water: number;
}

interface NutritionData {
  macros: Macros;
  meals: Record<MealType, FoodLogItem[]>;
}

const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack'];

const DEFAULT_DATA: NutritionData = {
  macros: {
    kcal: 0,
    kcalGoal: 2200,
    protein: 0,
    proteinGoal: 150,
    carbs: 0,
    fat: 0,
    water: 0,
  },
  meals: { desayuno: [], almuerzo: [], cena: [], snack: [] },
};

// ── Macro Ring ────────────────────────────────────────────────────
function MacroRing({ label, current, goal, color, unit = 'g' }: {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 5,
          borderColor: `${color}25`,
          backgroundColor: `${color}10`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 32,
            borderWidth: 5,
            borderColor: 'transparent',
            borderTopColor: color,
            transform: [{ rotate: `${pct * 360 - 90}deg` }],
          }}
        />
        <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 13, color }}>
          {Math.round(current)}
        </Text>
      </View>
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.muted }}>{label}</Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.subtle }}>/{goal}{unit}</Text>
    </View>
  );
}

// ── Log Food Modal ─────────────────────────────────────────────────
interface LogFoodModalProps {
  visible: boolean;
  initialMealType: MealType;
  onClose: () => void;
  onSuccess: () => void;
  getToken: () => Promise<string | null>;
}

const MEAL_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack: 'Snack',
};

const LogFoodModal = memo(function LogFoodModal({
  visible,
  initialMealType,
  onClose,
  onSuccess,
  getToken,
}: LogFoodModalProps) {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [description, setDescription] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setMealType(initialMealType);
      setDescription('');
      setKcal('');
      setProteinG('');
      setCarbsG('');
      setFatG('');
      setError(null);
    }
  }, [visible, initialMealType]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Descripción es requerida.');
      return;
    }
    const kcalNum = parseFloat(kcal);
    if (isNaN(kcalNum) || kcalNum < 0) {
      setError('Ingresa un valor de calorías válido (>= 0).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');
      await apiCall('/api/nutrition/log', token, {
        method: 'POST',
        body: JSON.stringify({
          meal_type: mealType,
          description: description.trim(),
          kcal: kcalNum,
          protein_g: proteinG !== '' ? parseFloat(proteinG) : null,
          carbs_g: carbsG !== '' ? parseFloat(carbsG) : null,
          fat_g: fatG !== '' ? parseFloat(fatG) : null,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('No se pudo registrar la comida. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text }}>
            Registrar comida
          </Text>

          {/* Meal type selector */}
          <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
            {MEAL_TYPES.map((mt) => (
              <TouchableOpacity
                key={mt}
                onPress={() => setMealType(mt)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: mealType === mt ? colors.calm : `${colors.calm}15`,
                  borderWidth: 1,
                  borderColor: mealType === mt ? colors.calm : colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    fontSize: 13,
                    color: mealType === mt ? '#FFF' : colors.calm,
                  }}
                >
                  {MEAL_LABELS[mt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted }}>
              Descripción *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ej. Avena con plátano y nueces"
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

          {/* Kcal */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted }}>
              Calorías (kcal) *
            </Text>
            <TextInput
              value={kcal}
              onChangeText={setKcal}
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

          {/* Optional macros */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {([
              ['Proteína (g)', proteinG, setProteinG],
              ['Carbos (g)', carbsG, setCarbsG],
              ['Grasas (g)', fatG, setFatG],
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
                    fontSize: 13,
                    color: colors.text,
                    textAlign: 'center',
                  }}
                />
              </View>
            ))}
          </View>

          {/* Error */}
          {error && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.energy }}>
              {error}
            </Text>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            style={{
              backgroundColor: submitting ? `${colors.calm}70` : colors.calm,
              borderRadius: radius.md,
              paddingVertical: spacing.md,
              alignItems: 'center',
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#FFF' }}>
                Guardar comida
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ── Meal Card ─────────────────────────────────────────────────────
interface MealCardProps {
  title: string;
  icon: string;
  mealType: MealType;
  items: FoodLogItem[];
  onRegister: (mealType: MealType) => void;
}

function MealCard({ title, icon, mealType, items, onRegister }: MealCardProps) {
  const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0);
  const logged = items.length > 0;

  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: logged ? `${colors.calm}40` : colors.border }, shadows.card]}>
      <View style={{ backgroundColor: logged ? `${colors.calm}12` : colors.surface, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: logged ? colors.calm : colors.muted }}>
            {totalKcal} kcal
          </Text>
          {logged && <Text style={{ fontSize: 14 }}>✅</Text>}
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 6 }}>
        {items.length > 0 ? (
          items.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.calm }} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, flex: 1 }}>
                {item.description}
              </Text>
              <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: colors.subtle }}>
                {item.kcal} kcal
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.subtle }}>
            Sin registros aún
          </Text>
        )}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onRegister(mealType)}
          style={{ marginTop: spacing.xs, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: `${colors.calm}15`, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: colors.calm }}>+ Registrar comida</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Snap & Eat Button ─────────────────────────────────────────────
function SnapEatButton() {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: colors.calm,
          borderRadius: radius.lg,
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        shadows.card,
      ]}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24 }}>📸</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: '#FFF' }}>Snap & Eat</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
          Foto de tu plato → SOCIO registra los macros
        </Text>
      </View>
      <Text style={{ fontSize: 20, color: '#FFF' }}>→</Text>
    </TouchableOpacity>
  );
}

// ── Water Tracker ─────────────────────────────────────────────────
interface WaterTrackerProps {
  water: number;
  onDelta: (delta: 1 | -1) => void;
}

function WaterTracker({ water, onDelta }: WaterTrackerProps) {
  const goal = 8;
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>Hidratación</Text>
        <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: colors.calm }}>{water}/{goal} 💧</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.md }}>
        <View style={{ width: `${Math.min((water / goal) * 100, 100)}%`, height: '100%', backgroundColor: colors.calm, borderRadius: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => onDelta(-1)}
          style={{ flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: colors.muted }}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelta(1)}
          style={{ flex: 2, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: `${colors.calm}15`, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: colors.calm }}>+ Vaso de agua</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Meal config ───────────────────────────────────────────────────
const MEAL_CONFIG: { mealType: MealType; title: string; icon: string }[] = [
  { mealType: 'desayuno', title: 'Desayuno', icon: '☀️' },
  { mealType: 'almuerzo', title: 'Almuerzo', icon: '🌤️' },
  { mealType: 'cena', title: 'Cena', icon: '🌙' },
  { mealType: 'snack', title: 'Snacks', icon: '🍎' },
];

// ── Main Nutrition Screen ─────────────────────────────────────────
export default function NutricionScreen() {
  const { getToken } = useAuth();
  const [data, setData] = useState<NutritionData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('desayuno');

  const fetchToday = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');
      const result = await apiCall('/api/nutrition/today', token);
      if (result?.macros && result?.meals) {
        setData(result);
        setError(null);
      } else {
        setError('Datos incorrectos del servidor');
      }
    } catch (err: any) {
      setError('No se pudieron cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleWaterDelta = async (delta: 1 | -1) => {
    // Optimistic update
    setData((prev) => ({
      ...prev,
      macros: {
        ...prev.macros,
        water: Math.max(0, prev.macros.water + delta),
      },
    }));
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión');
      const result = await apiCall('/api/nutrition/water', token, {
        method: 'POST',
        body: JSON.stringify({ delta }),
      });
      setData((prev) => ({
        ...prev,
        macros: { ...prev.macros, water: result.water },
      }));
    } catch {
      // Revert optimistic update on error
      setData((prev) => ({
        ...prev,
        macros: {
          ...prev.macros,
          water: Math.max(0, prev.macros.water - delta),
        },
      }));
    }
  };

  const handleOpenModal = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setModalVisible(true);
  };

  const { macros, meals } = data;
  const remaining = macros.kcalGoal - macros.kcal;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 100, paddingHorizontal: spacing.lg, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>Nutrición de hoy</Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.text }}>Tu plato 🥗</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.calm} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: spacing.sm }}>
              Cargando nutrición...
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={{ backgroundColor: `${colors.energy}15`, borderRadius: radius.sm, padding: spacing.sm }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.energy }}>{error}</Text>
              </View>
            )}

            {/* Calorie overview */}
            <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md }}>
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>Calorías hoy</Text>
                  <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 32, color: colors.text }}>
                    {macros.kcal}
                    <Text style={{ fontSize: 16, color: colors.muted }}> / {macros.kcalGoal}</Text>
                  </Text>
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: remaining >= 0 ? colors.calm : colors.energy }}>
                  {remaining >= 0 ? `${remaining} restantes` : `${Math.abs(remaining)} excedido`}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.lg }}>
                <View style={{ width: `${Math.min((macros.kcal / macros.kcalGoal) * 100, 100)}%`, height: '100%', backgroundColor: macros.kcal > macros.kcalGoal ? colors.energy : colors.calm, borderRadius: 4 }} />
              </View>
              {/* Macros */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <MacroRing label="Proteína" current={macros.protein} goal={macros.proteinGoal} color={colors.energy} />
                <MacroRing label="Carbos" current={macros.carbs} goal={220} color={colors.ai} />
                <MacroRing label="Grasas" current={macros.fat} goal={73} color={colors.calm} />
              </View>
            </View>

            {/* Snap & Eat */}
            <SnapEatButton />

            {/* Meals */}
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text }}>Comidas del día</Text>
            {MEAL_CONFIG.map(({ mealType, title, icon }) => (
              <MealCard
                key={mealType}
                title={title}
                icon={icon}
                mealType={mealType}
                items={meals[mealType] ?? []}
                onRegister={handleOpenModal}
              />
            ))}

            {/* Water */}
            <WaterTracker water={macros.water} onDelta={handleWaterDelta} />
          </>
        )}
      </ScrollView>

      <LogFoodModal
        visible={modalVisible}
        initialMealType={selectedMealType}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchToday}
        getToken={getToken}
      />
    </>
  );
}
