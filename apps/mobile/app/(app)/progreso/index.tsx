import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { apiCall } from '@/lib/api';
import { spacing, radius, shadows } from '@/design/tokens';
import { useTheme } from '@/design/ThemeContext';

// ── Types ────────────────────────────────────────────────────────────

interface ScoreEntry {
  date: string;
  total: number;
}

interface HeatCell {
  date: string;
  level: number; // 0-3
}

interface LatestRetro {
  id: string;
  week_number: number;
  year: number;
  narrative: string;
  avg_socio_score: number | null;
}

interface ProgressData {
  stats: {
    streak: number;
    week_sessions: number;
    month_sessions: number;
  };
  score_history: ScoreEntry[];
  heatmap: HeatCell[][];
  latest_retro: LatestRetro | null;
  personal_records: unknown[];
}

// ── Constants ─────────────────────────────────────────────────────────

const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type ThemeColors = ReturnType<typeof useTheme>['colors'];

// ── Sub-components ────────────────────────────────────────────────────

function HeatCellView({ level, colors }: { level: number; colors: ThemeColors }) {
  const bgMap = [
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
        backgroundColor: bgMap[level] ?? bgMap[0],
        margin: 2,
      }}
    />
  );
}

const ScoreHistory = React.memo(function ScoreHistory({
  data,
  colors,
}: {
  data: ScoreEntry[];
  colors: ThemeColors;
}) {
  if (data.length === 0) {
    return (
      <View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          },
          shadows.card,
        ]}
      >
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 16,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          SOCIO Score
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 13,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          Registra tu primer día para ver el historial de tu score.
        </Text>
      </View>
    );
  }

  const scores = data.map((d) => d.total);
  const max = Math.max(...scores);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const latest = scores[scores.length - 1];

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
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.lg,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 16,
              color: colors.text,
            }}
          >
            SOCIO Score
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 12,
              color: colors.muted,
            }}
          >
            Últimas 2 semanas
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: 'SpaceMono_400Regular',
              fontSize: 22,
              color: colors.ai,
            }}
          >
            {avg}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 11,
              color: colors.muted,
            }}
          >
            promedio
          </Text>
        </View>
      </View>
      {/* Mini bar chart */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {scores.map((score, i) => {
          const h = (score / 100) * 60;
          const isToday = i === scores.length - 1;
          return (
            <View key={i} style={{ flex: 1, height: 60, justifyContent: 'flex-end' }}>
              <View
                style={{
                  height: h,
                  borderRadius: 4,
                  backgroundColor: isToday ? colors.ai : `${colors.ai}50`,
                }}
              />
            </View>
          );
        })}
      </View>
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 11,
          color: colors.subtle,
          marginTop: spacing.sm,
          textAlign: 'right',
        }}
      >
        Hoy: {latest} · Mejor: {max}
      </Text>
    </View>
  );
});

const RetroCard = React.memo(function RetroCard({
  retro,
  colors,
}: {
  retro: LatestRetro;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        backgroundColor: `${colors.primary}10`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 16,
            color: colors.text,
          }}
        >
          Retrospectiva semanal
        </Text>
        <Text style={{ fontSize: 16 }}>📋</Text>
      </View>
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 14,
          color: colors.muted,
          lineHeight: 20,
        }}
      >
        "{retro.narrative}"
      </Text>
      <Text
        style={{
          fontFamily: 'DMSans_700Bold',
          fontSize: 12,
          color: colors.ai,
          letterSpacing: 0.3,
        }}
      >
        — Tu SOCIO · Semana {retro.week_number}, {retro.year}
      </Text>
    </View>
  );
});

// ── Main Progress Screen ──────────────────────────────────────────────

export default function ProgresoScreen() {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) {
          setError(true);
          return;
        }
        const result = await apiCall('/api/progress', token);
        setData(result as ProgressData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: colors.muted,
          }}
        >
          Cargando tu progreso…
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
          gap: spacing.md,
        }}
      >
        <Text style={{ fontSize: 40 }}>😔</Text>
        <Text
          style={{
            fontFamily: 'DMSans_700Bold',
            fontSize: 16,
            color: colors.text,
            textAlign: 'center',
          }}
        >
          No se pudo cargar el progreso
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          Revisa tu conexión e intenta de nuevo.
        </Text>
      </View>
    );
  }

  const { stats, score_history, heatmap, latest_retro, personal_records } = data;

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
      {/* Header */}
      <View>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 13,
            color: colors.muted,
          }}
        >
          Tu evolución
        </Text>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 28,
            color: colors.text,
          }}
        >
          Progreso 📈
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          {
            label: 'Racha',
            value: String(stats.streak),
            unit: 'días',
            color: colors.energy,
            icon: '🔥',
          },
          {
            label: 'Esta semana',
            value: String(stats.week_sessions),
            unit: 'sesiones',
            color: colors.calm,
            icon: '✅',
          },
          {
            label: 'Mes',
            value: String(stats.month_sessions),
            unit: 'entrenos',
            color: colors.ai,
            icon: '📅',
          },
        ].map((stat) => (
          <View
            key={stat.label}
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
            <Text style={{ fontSize: 18, marginBottom: 2 }}>{stat.icon}</Text>
            <Text
              style={{
                fontFamily: 'SpaceMono_400Regular',
                fontSize: 20,
                color: stat.color,
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 10,
                color: colors.muted,
                textAlign: 'center',
              }}
            >
              {stat.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* SOCIO Score history */}
      <ScoreHistory data={score_history} colors={colors} />

      {/* Retrospectiva (only if available) */}
      {latest_retro ? <RetroCard retro={latest_retro} colors={colors} /> : null}

      {/* Heatmap */}
      {heatmap.length > 0 ? (
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
              fontSize: 16,
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Actividad — Últimas 5 semanas
          </Text>
          {/* Day labels */}
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {DAYS_SHORT.map((d) => (
              <Text
                key={d}
                style={{
                  flex: 1,
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 10,
                  color: colors.subtle,
                  textAlign: 'center',
                }}
              >
                {d}
              </Text>
            ))}
          </View>
          {heatmap.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row' }}>
              {week.map((cell, di) => (
                <HeatCellView key={di} level={cell.level} colors={colors} />
              ))}
            </View>
          ))}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 11,
                color: colors.subtle,
              }}
            >
              Menos
            </Text>
            {[0, 1, 2, 3].map((l) => (
              <HeatCellView key={l} level={l} colors={colors} />
            ))}
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 11,
                color: colors.subtle,
              }}
            >
              Más
            </Text>
          </View>
        </View>
      ) : null}

      {/* Personal records */}
      <View>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 20,
            color: colors.text,
            marginBottom: spacing.md,
          }}
        >
          Récords personales 🏆
        </Text>
        {personal_records.length === 0 ? (
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                gap: spacing.sm,
              },
              shadows.card,
            ]}
          >
            <Text style={{ fontSize: 32 }}>🏅</Text>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 13,
                color: colors.muted,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Próximamente — registra entrenamientos para ver tus récords.
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
