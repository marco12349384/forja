/**
 * PULSO Design System — Design Tokens
 * "Biomorphic Editorial" style
 *
 * Usage:
 *   import { spacing, radius } from '@/design/tokens';
 *   import { useTheme } from '@/design/ThemeContext';
 *   const { colors } = useTheme();
 */

// ── Theme colors type (union shape for both light + dark) ─────────
export interface ThemeColors {
  primary: string;
  energy: string;
  calm: string;
  ai: string;
  success: string;
  warning: string;
  error: string;
  primaryLight: string;
  primaryFade: string;
  energyFade: string;
  calmFade: string;
  aiFade: string;
  bg: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
}

// ── Base / brand colors (same in both themes) ─────────────────────
const baseColors = {
  primary: '#2D1B69',
  energy: '#FF6B47',
  calm: '#6ABEA7',
  ai: '#A78BFA',
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#F87171',
  primaryLight: '#4C2FAB',
  primaryFade: 'rgba(45,27,105,0.08)',
  energyFade: 'rgba(255,107,71,0.12)',
  calmFade: 'rgba(106,190,167,0.12)',
  aiFade: 'rgba(167,139,250,0.12)',
};

export const lightColors: ThemeColors = {
  ...baseColors,
  bg: '#F7F3EF',
  surface: '#FFFFFF',
  card: '#FAFAF8',
  text: '#1C1917',
  muted: '#78716C',
  subtle: '#A8A29E',
  border: '#E7E5E4',
};

export const darkColors: ThemeColors = {
  ...baseColors,
  bg: '#0F0E17',
  surface: '#1C1A2E',
  card: '#252338',
  text: '#F5F3FF',
  muted: '#C4B8E0',
  subtle: '#8B7FB8',
  border: '#3A3458',
};

// Default export — keeps backward compat for static usages (shadows, tabBar defaults)
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  cardStrong: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  energy: {
    shadowColor: colors.energy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ai: {
    shadowColor: colors.ai,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

// Font families — requires expo-google-fonts loaded in root layout
export const fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingMedium: 'PlayfairDisplay_500Medium',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  mono: 'SpaceMono_400Regular',
} as const;

// Type scale
export const typography = {
  display: { fontSize: 36, lineHeight: 44 },
  h1: { fontSize: 28, lineHeight: 36 },
  h2: { fontSize: 22, lineHeight: 30 },
  h3: { fontSize: 18, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  mono: { fontSize: 15, lineHeight: 22 },
} as const;

// Tab bar config (uses lightColors defaults — ThemeContext overrides at runtime)
export const tabBar = {
  height: 72,
  paddingBottom: 12,
  iconSize: 24,
  activeTint: colors.primary,
  inactiveTint: colors.subtle,
  background: colors.surface,
} as const;
