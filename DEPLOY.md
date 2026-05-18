# Deployment Guide — PULSO

Guía completa para llevar PULSO de tu máquina local a producción.

---

## Resumen visual

```
[Supabase Postgres]  ←──  [Next.js API en Vercel]  ←──  [App móvil Expo/EAS]
       ↑                          ↑
       └──── 7 migraciones        └──── Clerk auth + Anthropic API
```

---

## 1. Supabase (DB)

### 1.1 Crear proyecto

1. Ve a https://supabase.com/dashboard/projects
2. Click **New project** → elige nombre `pulso-prod`, región más cercana, contraseña fuerte
3. Espera ~2 minutos a que se aprovisione

### 1.2 Obtener credenciales

- **Project Ref:** Settings → General → "Reference ID" (algo como `abcdefghijklmn`)
- **DATABASE_URL:** Settings → Database → Connection string → **"Transaction"** → URI
  - Reemplaza `[YOUR-PASSWORD]` con la contraseña que pusiste al crear el proyecto
  - Debe verse así: `postgresql://postgres.abcdefg:tuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

### 1.3 Correr migraciones

```bash
cd /Users/marcochacon/Documents/fitly
npx supabase login          # primera vez — abre el browser
cd supabase
npx supabase link --project-ref TU_PROJECT_REF   # te pide la DB password
npx supabase db push         # corre las 7 migraciones
```

Si todo va bien verás: `Applied migration 20260511000001_initial_schema.sql` × 7 veces.

### 1.4 Verificar

En el dashboard de Supabase → Table Editor, deberías ver:
- `users`, `user_profiles`, `workout_plans`, `plan_weeks`, `workouts`, `exercises`, `exercise_catalog`
- `energy_checkins`, `socio_scores`, `mini_missions`, `daily_nutrition`, `food_logs`, `weekly_retros`, `socio_messages`, `diet_profiles`
- `workout_sessions`, `body_phases`, `analytics_events`

Total: **17 tablas**.

---

## 2. Clerk (Auth)

### 2.1 Crear aplicación

1. https://dashboard.clerk.com → **+ Create application**
2. Nombre: `pulso`, habilita **Email** y **Google** (recomendado)
3. Te muestra dos keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → empieza con `pk_test_...`
   - `CLERK_SECRET_KEY` → empieza con `sk_test_...`

### 2.2 Habilitar para mobile

En tu Clerk app → **Sessions** → habilita **"Allow long-lived sessions"** (necesario para Expo).

### 2.3 URLs permitidas

**Paths & URLs** → agrega:
- Sign-in URL: `/login`
- After sign-in: `/home`
- After sign-up: `/onboarding`

---

## 3. Anthropic (AI)

1. https://console.anthropic.com/settings/keys → **+ Create key**
2. Nombre: `pulso-prod`
3. Cópialo (empieza con `sk-ant-...`) — solo se muestra una vez
4. Asegúrate de tener **créditos** o un payment method configurado (https://console.anthropic.com/settings/billing)

**Costo estimado por usuario activo/mes:** ~$0.50–$2 (chat + plan + snap-eat)

---

## 4. Vercel (Web Backend)

### 4.1 Setup

```bash
cd /Users/marcochacon/Documents/fitly/apps/web
npx vercel login
npx vercel link    # te pregunta si crear nuevo proyecto → sí, nombre "pulso-web"
```

### 4.2 Variables de entorno

Sube cada variable. Las marcadas `Sensitive` no se muestran en logs:

```bash
# Sensitive (server-side only)
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add CLERK_SECRET_KEY production
npx vercel env add DATABASE_URL production

# Public (expuestas al cliente — son seguras de exponer)
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

Pega el valor cuando te lo pida. **NO uses comillas alrededor del valor.**

### 4.3 Deploy

```bash
npx vercel deploy --prod
```

Te dará una URL como `https://pulso-web.vercel.app`. Anótala — la necesitas para mobile.

### 4.4 Verificar

Abre `https://pulso-web.vercel.app/api/me/today` en el browser. Debe responder:
```json
{ "error": "Unauthorized" }
```
Eso es correcto (no estás autenticado, pero el endpoint funciona).

---

## 5. Mobile (Expo / EAS Build)

### 5.1 Actualizar `.env.local` con la URL real

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL=https://pulso-web.vercel.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 5.2 Login en Expo

```bash
cd /Users/marcochacon/Documents/fitly/apps/mobile
npx expo login    # crea cuenta gratis si no tienes
```

### 5.3 Configurar EAS (build para App Store / Play Store)

```bash
npx eas-cli build:configure
```

Esto crea `eas.json`. Edítalo si necesario para añadir env vars en builds.

### 5.4 Build de prueba (Internal Distribution)

```bash
# iOS — primero necesitas Apple Developer ($99/año) o usa simulator build
npx eas-cli build --platform ios --profile preview

# Android — gratis, se instala APK directamente
npx eas-cli build --platform android --profile preview
```

EAS te da una URL para descargar/instalar el build cuando termine (~20 min).

### 5.5 Submit a stores (cuando estés listo)

```bash
npx eas-cli submit --platform ios       # App Store Connect
npx eas-cli submit --platform android   # Google Play
```

---

## 6. Probar end-to-end en producción

Sigue [TESTING.md](./TESTING.md) — 10 flujos críticos a verificar.

---

## 7. Cron jobs pendientes (post-launch)

Estos eventos requieren un job server-side que NO se construyó (deferred):

| Evento | Frecuencia | Qué hace |
|---|---|---|
| `streak_maintained` | Diario 00:05 | Compara streak actual vs ayer, dispara analytic |
| Weekly retro generator | Domingo 22:00 | Llama Claude para generar `weekly_retros` row |
| Plan week advancement | Lunes 00:01 | Avanza `getTodayWorkout` a la siguiente semana |

**Recomendación:** usa **Vercel Cron Jobs** o **Supabase pg_cron**.

Ejemplo Vercel Cron en `apps/web/vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/weekly-retro", "schedule": "0 22 * * 0" }
  ]
}
```

---

## 8. Monitoreo recomendado

| Tool | Para qué | Free tier |
|---|---|---|
| Vercel Analytics | Latencia API + edge | ✅ |
| Supabase Logs | DB errors + slow queries | ✅ |
| Sentry | Crashes mobile + web | Sí (5k events/mes) |
| Clerk Dashboard | Auth events | ✅ |
| Anthropic Console | Token usage + costo | ✅ |

---

## 9. Checklist final pre-launch

- [ ] Las 7 migraciones aplicadas en Supabase prod
- [ ] Vercel deploy live con todas las env vars
- [ ] Mobile build EAS exitoso (iOS + Android)
- [ ] `https://tu-web.vercel.app/api/me/today` responde `{"error":"Unauthorized"}` (no crashea)
- [ ] Onboarding completo funciona: cuenta → 7 pasos → plan generado en <30s
- [ ] SOCIO chat responde en <5s
- [ ] Snap & Eat reconoce un plato real en <8s
- [ ] Dark mode toggle funciona en mobile + web
- [ ] Analytics están llegando a la tabla `analytics_events` (verifica en Supabase)
- [ ] App Store listing / Play Store listing creado con screenshots
- [ ] Política de privacidad publicada (obligatorio para stores)

---

## Troubleshooting común

**"Postgres connection refused"**
→ Verifica que `DATABASE_URL` usa el **Transaction pooler** (puerto 6543), no Session (5432). Vercel functions necesitan pooled connections.

**"Clerk: clerk_id is null"**
→ Asegúrate de haber corrido la migración `20260517000007_fix_clerk_compat.sql`.

**"Claude API: 401"**
→ La key está bien, pero falta agregar créditos en https://console.anthropic.com/settings/billing.

**"Snap & Eat siempre devuelve low confidence"**
→ Verifica que el base64 no incluya el prefijo `data:image/...`. expo-image-picker con `base64: true` lo retorna limpio.

**Mobile no se conecta a la API**
→ Verifica que `EXPO_PUBLIC_API_URL` apunta a `https://...` (no `http://localhost` en builds de prod).
