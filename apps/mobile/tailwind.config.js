/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── PULSO Design System ──────────────────────────
        pulso: {
          // Backgrounds
          bg: '#F7F3EF',           // Warm linen
          'bg-dark': '#0F0E17',    // Deep dark

          // Primary
          primary: '#2D1B69',      // Deep midnight indigo
          'primary-light': '#4C2FAB',

          // Accents
          energy: '#FF6B47',       // Coral energético (exercise/CTAs)
          calm: '#6ABEA7',         // Sage teal (nutrition/rest)
          ai: '#A78BFA',           // Lavender (SOCIO/AI)

          // Surfaces
          surface: '#FFFFFF',
          'surface-dark': '#1C1A2E',
          card: '#FEFCFA',         // Slightly warm white

          // Text
          text: '#1C1917',         // Warm black
          muted: '#78716C',        // Warm gray
          subtle: '#A8A29E',       // Even more muted

          // Borders
          border: '#E7E5E4',
          'border-dark': '#2C2A3E',

          // States
          success: '#4ADE80',
          warning: '#FBBF24',
          error: '#F87171',
        },
      },
      fontFamily: {
        heading: ['PlayfairDisplay_700Bold', 'serif'],
        'heading-m': ['PlayfairDisplay_500Medium', 'serif'],
        body: ['DMSans_400Regular', 'sans-serif'],
        'body-m': ['DMSans_500Medium', 'sans-serif'],
        'body-b': ['DMSans_700Bold', 'sans-serif'],
        mono: ['SpaceMono_400Regular', 'monospace'],
      },
      borderRadius: {
        'pulso-sm': '8px',
        'pulso-md': '16px',
        'pulso-lg': '24px',
        'pulso-xl': '32px',
        'pulso-full': '999px',
      },
    },
  },
  plugins: [],
};
