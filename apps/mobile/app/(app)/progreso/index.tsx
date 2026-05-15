import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '@/design/tokens';

// ── Workout heatmap (last 5 weeks) ───────────────────────────────
const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
// Mock data: 0=rest, 1=light, 2=medium, 3=intense
const HEAT_DATA = [
  [2, 0, 3, 0, 2, 1, 0],
  [3, 0, 2, 1, 3, 0, 0],
  [1, 2, 0, 3, 0, 2, 0],
  [2, 0, 3, 0, 2, 0, 1],
  [3, 1, 0, 2, 0, 0, 0], // current week (partial)
];

function HeatCell({ level }: { level: number }) {
  const colors_map = [
    `${colors.primary}10`,
    `${colors.calm}40`,
    `${colors.calm}80`,
    colors.calm,
  ];
  return (
    <View
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: 5,
        backgroundColor: colors_map[level] ?? colors_map[0],
        margin: 2,
      }}
    />
  );
}

// ── SOCIO Score history ───────────────────────────────────────────
const SCORE_HISTORY = [68, 72, 65, 80, 75, 58, 82, 79, 70, 84, 76, 88, 72, 90];

function ScoreHistory() {
  const max = Math.max(...SCORE_HISTORY);
  const avg = Math.round(SCORE_HISTORY.reduce((a, b) => a + b, 0) / SCORE_HISTORY.length);

  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
        <View>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>SOCIO Score</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted }}>Últimas 2 semanas</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 22, color: colors.ai }}>{avg}</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted }}>promedio</Text>
        </View>
      </View>
      {/* Mini bar chart */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {SCORE_HISTORY.map((score, i) => {
          const h = (score / 100) * 60;
          const isToday = i === SCORE_HISTORY.length - 1;
          return (
            <View key={i} style={{ flex: 1, height: 60, justifyContent: 'flex-end' }}>
              <View style={{
                height: h,
                borderRadius: 4,
                backgroundColor: isToday ? colors.ai : `${colors.ai}50`,
              }} />
            </View>
          );
        })}
      </View>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.subtle, marginTop: spacing.sm, textAlign: 'right' }}>
        Hoy: {SCORE_HISTORY[SCORE_HISTORY.length - 1]} · Mejor: {max}
      </Text>
    </View>
  );
}

// ── Personal records ──────────────────────────────────────────────
const RECORDS = [
  { exercise: 'Dominadas', icon: '🔝', value: '12 reps', date: 'hace 3 días', best: true },
  { exercise: 'Sentadilla', icon: '🏋️', value: '80 kg', date: 'hace 1 semana', best: false },
  { exercise: 'Plancha', icon: '⏱️', value: '2:30 min', date: 'hace 2 días', best: true },
  { exercise: 'Fondos', icon: '💪', value: '20 reps', date: 'ayer', best: false },
];

// ── Retrospectiva card ────────────────────────────────────────────
function RetroCard() {
  return (
    <View style={{
      backgroundColor: `${colors.primary}10`,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      gap: spacing.sm,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text }}>
          Retrospectiva semanal
        </Text>
        <Text style={{ fontSize: 16 }}>📋</Text>
      </View>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, lineHeight: 20 }}>
        "Completaste 4 de 5 entrenamientos — buen trabajo. Noté que siempre omites el martes. ¿Qué pasa ese día? Ajusto tu plan para la próxima semana."
      </Text>
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: colors.ai, letterSpacing: 0.3 }}>
        — Tu SOCIO · Domingo pasado
      </Text>
    </View>
  );
}

// ── Main Progress Screen ──────────────────────────────────────────
export default function ProgresoScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 60, paddingBottom: 100, paddingHorizontal: spacing.lg, gap: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>Tu evolución</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.text }}>Progreso 📈</Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          { label: 'Racha', value: '14', unit: 'días', color: colors.energy, icon: '🔥' },
          { label: 'Esta semana', value: '4', unit: 'sesiones', color: colors.calm, icon: '✅' },
          { label: 'Mes', value: '18', unit: 'entrenos', color: colors.ai, icon: '📅' },
        ].map((stat) => (
          <View key={stat.label} style={[{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }, shadows.card]}>
            <Text style={{ fontSize: 18, marginBottom: 2 }}>{stat.icon}</Text>
            <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 20, color: stat.color }}>{stat.value}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.muted, textAlign: 'center' }}>
              {stat.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* SOCIO Score history */}
      <ScoreHistory />

      {/* Retrospectiva */}
      <RetroCard />

      {/* Heatmap */}
      <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadows.card]}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: colors.text, marginBottom: spacing.md }}>
          Actividad — Últimas 5 semanas
        </Text>
        {/* Day labels */}
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          {DAYS_SHORT.map((d) => (
            <Text key={d} style={{ flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.subtle, textAlign: 'center' }}>{d}</Text>
          ))}
        </View>
        {HEAT_DATA.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row' }}>
            {week.map((level, di) => (
              <HeatCell key={di} level={level} />
            ))}
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.subtle }}>Menos</Text>
          {[0, 1, 2, 3].map((l) => (
            <HeatCell key={l} level={l} />
          ))}
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.subtle }}>Más</Text>
        </View>
      </View>

      {/* Personal records */}
      <View>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text, marginBottom: spacing.md }}>
          Récords personales 🏆
        </Text>
        {RECORDS.map((rec) => (
          <View key={rec.exercise} style={[{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: rec.best ? `${colors.energy}40` : colors.border }, shadows.card]}>
            <Text style={{ fontSize: 22 }}>{rec.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: colors.text }}>{rec.exercise}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted }}>{rec.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: rec.best ? colors.energy : colors.muted }}>{rec.value}</Text>
              {rec.best && <Text style={{ fontSize: 10, color: colors.energy }}>🏆 nuevo PR</Text>}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
