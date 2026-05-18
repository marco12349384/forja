# PULSO — Tu Socio de Vida Activa

> *"No otro trainer. Tu socio."*

App de fitness con AI partner real. Diferente a Nike Training, MyFitnessPal y Freeletics:
combina gym + calistenia + yoga + pilates + HIIT con un SOCIO (chat AI) que conoce tu
rutina, tu energía y tu fase corporal, y ajusta tu plan según cómo te sientes hoy.

---

## Stack

| Capa | Tech |
|---|---|
| Mobile | React Native + Expo SDK 52 (Expo Router) |
| Web | Next.js 14 (App Router) |
| Backend | Next.js API routes + Postgres directo (postgres.js) |
| DB | Supabase (Postgres) — con RLS |
| Auth | Clerk |
| AI | Claude 3.5 Sonnet (chat + vision para Snap & Eat) |
| Monorepo | Turborepo + npm workspaces |

---

## Estructura

```
fitly/
├── apps/
│   ├── web/          ← Next.js (API routes + dashboard companion)
│   └── mobile/       ← Expo React Native (la app principal)
├── packages/
│   ├── api-client/   ← Helpers de DB (ensureUser, getDb, etc.)
│   ├── ai/           ← System prompts + context builder de SOCIO
│   ├── types/        ← Tipos compartidos
│   └── ui/           ← Components compartidos
└── supabase/
    └── migrations/   ← 7 migraciones SQL
```

---

## Features implementadas (14 tareas)

1. **Onboarding 7 pasos** con animaciones spring
2. **Daily Hub** con check-in energía, SOCIO Score donut, mini misiones, plan del día
3. **Workout Player** activo con timer de descanso, tracking de sets
4. **Web dashboard** con SOCIO Score, energy timeline, macros, semana
5. **Generate-plan** con Claude (modelo `claude-3-5-sonnet-latest`)
6. **SOCIO Chat** con typing indicators animados + quick prompts
7. **Nutrición** con macro tracking real, water tracker, log manual
8. **Mini Misiones** API + SOCIO Score real
9. **Progreso** con score history, workout heatmap (5 sem × 7 días), streak
10. **Snap & Eat** con cámara + Claude vision + low-confidence preview
11. **Fase Corporal** con ciclo menstrual, stress/sleep, recovery mode
12. **Animaciones** spring physics (PressableScale, FadeInView, BreathingPulse)
13. **Dark mode** completo (light/dark/system con AsyncStorage)
14. **Analytics tracking** de 9 eventos con batched queue

---

## Setup local

### 1. Instalar dependencias

```bash
git clone https://github.com/marco12349384/forja.git pulso
cd pulso
npm install
```

### 2. Setup de servicios externos

Necesitas 3 cuentas (todas con free tier):

- **Supabase** → https://supabase.com/dashboard/projects (crea proyecto)
- **Clerk** → https://dashboard.clerk.com (crea app, modo "Development")
- **Anthropic** → https://console.anthropic.com/settings/keys (crea API key)

### 3. Configurar `.env.local`

Copia los ejemplos y rellena con tus credenciales:

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.local.example apps/mobile/.env.local
```

Edita `apps/web/.env.local` con tu `ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`,
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, y `DATABASE_URL` (de Supabase).

Edita `apps/mobile/.env.local` con `EXPO_PUBLIC_API_URL=http://localhost:3000` y
el mismo `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` que el web.

### 4. Aplicar migraciones de DB

```bash
# Login una sola vez
npx supabase login

# Linkea con tu proyecto (Settings → General → Reference ID)
cd supabase && npx supabase link --project-ref TU_PROJECT_REF

# Aplica las 7 migraciones
npx supabase db push
```

### 5. Correr en desarrollo

```bash
# Terminal 1 — el backend web (incluye API routes)
cd apps/web && npm run dev    # http://localhost:3000

# Terminal 2 — la app móvil
cd apps/mobile && npx expo start   # escanea el QR con Expo Go
```

---

## Documentación

- 📦 **[DEPLOY.md](./DEPLOY.md)** — Guía paso a paso para deployar a producción (Vercel + Supabase + EAS)
- 🧪 **[TESTING.md](./TESTING.md)** — Plan de pruebas end-to-end manuales

---

## Arquitectura SOCIO (chat AI)

```
Usuario escribe → API /socio/chat
  ↓
gatherSocioContext() ejecuta 5 queries en paralelo:
  - últimos 20 mensajes
  - plan activo del día
  - SOCIO Score de hoy
  - último workout + macros
  - body_phases (fase corporal + recovery_mode)
  ↓
Claude 3.5 Sonnet con system prompt construido en @forja/ai
  ↓
Respuesta + persiste user + assistant messages
```

---

## SOCIO Score (cálculo)

`total = sleep_pts + nutrition_pts + movement_pts + hydration_pts` (column GENERATED)

| Componente | Cálculo |
|---|---|
| Sleep (25) | energy_level 1→10pts, 2→18pts, 3→25pts |
| Nutrition (25) | full si ratio kcal_consumed/goal in [0.8, 1.1]; penaliza overshoot |
| Movement (25) | 25 si hay workout_session hoy; fallback proxy en missions cap 15 |
| Hydration (25) | min(25, round((water_glasses / 8) × 25)) |

Si `total < 50` → auto-recovery mode activo → SOCIO ajusta tono y recomendaciones.

---

## Convenciones

- **Safe 500 strings** — nunca retornar `err.message` al cliente
- **Promise.allSettled** para queries DB independientes
- **Transacciones SQL** (`sql.begin`) para writes que tocan múltiples tablas
- **AbortController** con timeout en todas las llamadas a Anthropic
- **Validación runtime** de inputs antes de DB ops (no confiar en TS solo)
- **Analytics fire-and-forget** — nunca bloquea el UX

---

## Licencia

Privado. Todo derecho reservado.
