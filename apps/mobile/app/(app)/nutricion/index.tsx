import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '@/design/tokens';

// ── Macro Ring ────────────────────────────────────────────────────
function MacroRing({ label, current, goal, color }: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min(current / goal, 1);
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
        {/* inner progress indicator */}
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
          {current}
        </Text>
      </View>
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.muted }}>{label}</Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.subtle }}>/{goal}g</Text>
    </View>
  );
}

// ── Meal card ─────────────────────────────────────────────────────
function MealCard({ title, icon, items, kcal, logged }: {
  title: string;
  icon: string;
  items: string[];
  kcal: number;
  logged: boolean;
}) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: logged ? `${colors.calm}40` : colors.border }, shadows.card]}>
      <View style={{ backgroundColor: logged ? `${colors.calm}12` : colors.card, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: logged ? colors.calm : colors.muted }}>
            {kcal} kcal
          </Text>
          {logged && <Text style={{ fontSize: 14 }}>✅</Text>}
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 6 }}>
        {items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: logged ? colors.calm : colors.subtle }} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted }}>{item}</Text>
          </View>
        ))}
        {!logged && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ marginTop: spacing.xs, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: `${colors.calm}15`, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: colors.calm }}>+ Registrar comida</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── SnapEat button ────────────────────────────────────────────────
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

// ── Water tracker ─────────────────────────────────────────────────
function WaterTracker({ current, goal }: { current: number; goal: number }) {
  const [glasses, setGlasses] = useState(current);
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>Hidratación</Text>
        <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: colors.calm }}>{glasses}/{goal} 💧</Text>
      </View>
      {/* Water fill bar */}
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.md }}>
        <View style={{ width: `${(glasses / goal) * 100}%`, height: '100%', backgroundColor: colors.calm, borderRadius: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => setGlasses((g) => Math.max(0, g - 1))}
          style={{ flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: colors.muted }}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setGlasses((g) => Math.min(g + 1, 16))}
          style={{ flex: 2, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: `${colors.calm}15`, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: colors.calm }}>+ Vaso de agua</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Nutrition Screen ─────────────────────────────────────────
export default function NutricionScreen() {
  const totalKcal = 1850;
  const goalKcal = 2200;

  return (
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

      {/* Calorie overview */}
      <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md }}>
          <View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>Calorías hoy</Text>
            <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 32, color: colors.text }}>
              {totalKcal}
              <Text style={{ fontSize: 16, color: colors.muted }}> / {goalKcal}</Text>
            </Text>
          </View>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.calm }}>
            {goalKcal - totalKcal} restantes
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.lg }}>
          <View style={{ width: `${(totalKcal / goalKcal) * 100}%`, height: '100%', backgroundColor: colors.calm, borderRadius: 4 }} />
        </View>
        {/* Macros */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <MacroRing label="Proteína" current={102} goal={150} color={colors.energy} />
          <MacroRing label="Carbos" current={180} goal={220} color={colors.ai} />
          <MacroRing label="Grasas" current={58} goal={73} color={colors.calm} />
        </View>
      </View>

      {/* Snap & Eat */}
      <SnapEatButton />

      {/* Meals */}
      <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text }}>Comidas del día</Text>
      <MealCard
        title="Desayuno"
        icon="☀️"
        items={['Avena con plátano y nueces', 'Huevos revueltos (2)', 'Café negro']}
        kcal={480}
        logged={true}
      />
      <MealCard
        title="Almuerzo"
        icon="🌤️"
        items={['Arroz integral 200g', 'Pechuga de pollo 180g', 'Ensalada mixta']}
        kcal={620}
        logged={true}
      />
      <MealCard
        title="Cena"
        icon="🌙"
        items={['Salmón al horno 200g', 'Brócoli salteado', 'Quinoa 150g']}
        kcal={550}
        logged={false}
      />
      <MealCard
        title="Snacks"
        icon="🍎"
        items={['Fruta de temporada', 'Puñado de almendras']}
        kcal={200}
        logged={false}
      />

      {/* Water */}
      <WaterTracker current={4} goal={8} />
    </ScrollView>
  );
}
