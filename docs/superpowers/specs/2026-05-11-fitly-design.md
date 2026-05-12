# Forja — App de Fitness con IA: Especificación de Diseño
*Fecha: 2026-05-11*

---

## Contexto

Forja es una app de fitness que usa IA (Claude) para generar planes de entrenamiento personalizados, adaptarlos semana a semana según el progreso del usuario, y ofrecer un coach conversacional en tiempo real. El catálogo de ejercicios cubre todos los niveles y tipos (gimnasio, casa, cardio, calistenia, yoga, movilidad), y cada ejercicio incluye video + imágenes de forma correcta.

El modelo de referencia para las rutinas de alta intensidad es el estilo P4P Español (ej. "Entrenamiento Pectorales Edición Insana"), mejorado con tracking interactivo, progresión automática y feedback de forma.

---

## Stack

| Capa | Tecnología |
|---|---|
| Monorepo | Turborepo |
| Web | Next.js 14 (App Router) |
| Mobile | Expo (React Native) |
| UI compartida | NativeWind (Tailwind para RN) |
| Backend | Supabase (auth, PostgreSQL, Edge Functions, Realtime, Storage) |
| IA | Claude API — `claude-sonnet-4-6` |
| Pagos | Stripe |
| Nutrición | Open Food Facts API |
| Wearables | HealthKit (iOS) / Google Health Connect (Android) |

---

## Estructura del Monorepo

```
fitly/
├── apps/
│   ├── web/              ← Next.js 14
│   └── mobile/           ← Expo
├── packages/
│   ├── types/            ← Tipos TypeScript compartidos
│   ├── api-client/       ← Hooks + clientes Supabase
│   ├── ui/               ← Componentes compartidos (NativeWind)
│   └── ai/               ← Lógica de prompts y contexto para Claude
└── supabase/
    ├── migrations/
    ├── functions/        ← Edge Functions
    └── seed/
```

---

## Modelo de Datos (Supabase PostgreSQL)

```sql
-- Usuarios y perfil
users (id, email, name, avatar_url, subscription_tier, created_at)
user_profiles (user_id, fitness_level, goal, available_equipment[], 
               days_per_week, session_duration_min, injuries[], 
               weight_kg, height_cm, age, gender)

-- Planes y entrenamientos
workout_plans (id, user_id, name, weeks_total, generated_by_ai, 
               ai_context jsonb, created_at)
plan_weeks (id, plan_id, week_number, focus, notes)
workouts (id, plan_week_id, day_of_week, name, type, 
          estimated_duration_min, difficulty)
exercises (id, workout_id, catalog_id, order_index, sets, reps, 
           rest_seconds, tempo, notes)

-- Catálogo de ejercicios (con media obligatoria)
exercise_catalog (
  id, name, slug,
  type: 'gym'|'home'|'cardio'|'calistenia'|'yoga'|'movilidad',
  muscles_primary[], muscles_secondary[],
  equipment: 'ninguno'|'mancuernas'|'barra'|'anillas'|'gym_completo'|...,
  difficulty: 'principiante'|'intermedio'|'avanzado',
  video_url NOT NULL,          ← obligatorio
  images jsonb NOT NULL,       ← {start, mid, end} — mínimo 2 (validado en app layer)
  cues_correct[],              ← puntos clave de forma correcta
  cues_common_mistakes[],      ← errores frecuentes y cómo corregirlos
  progressions jsonb,          ← versión más fácil / más difícil
  calistenia_level int,        ← para progresiones (1=básico … 5=élite)
  created_at
)

-- Sesiones completadas
workout_sessions (id, user_id, workout_id, date, duration_real_min, 
                  notes, rating, completed)
session_sets (id, session_id, exercise_id, set_number, reps_done, 
              weight_kg, rpe, notes)

-- Coach IA
coach_messages (id, user_id, role: 'user'|'assistant', content, 
                context_snapshot jsonb, created_at)

-- Métricas y nutrición
body_metrics (id, user_id, date, weight_kg, body_fat_pct, 
              measurements jsonb, photos[])
nutrition_logs (id, user_id, date, meal_name, food_items jsonb, 
                calories, protein_g, carbs_g, fat_g)
wearable_data (id, user_id, date, source, steps, calories_burned, 
               avg_heart_rate, active_minutes, data_raw jsonb)
```

---

## Edge Functions (Supabase)

### `generate-plan`
**Trigger:** POST tras completar onboarding  
**Input:** `user_profile`, `equipment`, `days_per_week`, `goal`  
**Proceso:** Llama a Claude con el perfil completo → Claude devuelve estructura JSON del plan → se inserta en `workout_plans`, `plan_weeks`, `workouts`, `exercises` (usando solo ejercicios del catálogo con media validada)  
**Output:** `plan_id`

### `adapt-plan`
**Trigger:** Cron cada domingo a las 06:00 UTC  
**Input:** Últimas 4 semanas de `workout_sessions` + `session_sets`  
**Proceso:** Claude analiza adherencia, progreso de cargas, RPE promedio → ajusta semanas futuras del plan  
**Output:** Actualiza `workouts` y `exercises` de las próximas semanas

### `coach-chat`
**Trigger:** POST por cada mensaje del usuario  
**Input:** Mensaje del usuario + contexto (plan actual, últimas 3 sesiones, métricas recientes, historial de chat)  
**Proceso:** Claude responde como coach personal con contexto completo  
**Output:** Mensaje del coach, guardado en `coach_messages`

---

## Pantallas

### Onboarding (5 pasos)
1. Objetivo: perder peso / ganar músculo / resistencia / movilidad / fitness general
2. Nivel: principiante / intermedio / avanzado (con ejemplos visuales)
3. Equipo disponible (multi-select)
4. Disponibilidad: días/semana + minutos por sesión
5. Restricciones físicas (lesiones, zonas a evitar)
→ IA genera el plan automáticamente al finalizar

### Pantallas principales
| Pantalla | Descripción |
|---|---|
| **Home** | Plan de hoy, racha activa, resumen semanal, acceso al coach |
| **Workout Player** | Ejercicio activo con video/imagen, timer de descanso, registro de sets |
| **Coach IA** | Chat conversacional, historial, contexto automático del usuario |
| **Progreso** | Gráficas de peso, volumen, adherencia, fotos de progreso |
| **Explorar** | Catálogo de ejercicios con filtros, media completa por ejercicio |
| **Nutrición** | Log de comidas, macros del día, sincronización wearables |
| **Perfil** | Datos personales, plan activo, gestión de suscripción Stripe |

---

## Workout Player — Detalle

El corazón de la app:
- Muestra el ejercicio activo a pantalla completa
- Video en loop o imagen de forma correcta siempre visible
- Cues de forma ("mantén core activado", "codos a 45°")
- Input de peso + reps por set
- Timer de descanso con notificación
- Botón "¿Muy fácil / Muy difícil?" → el coach adapta en próxima sesión
- Al terminar: resumen de la sesión, racha actualizada, mensaje motivacional del coach

---

## Catálogo — Rutinas destacadas

### "Pectorales Edición Insana" (basada en modelo P4P Español)
- Tipo: Gym + versión calistenia sin equipo
- Nivel: Avanzado
- Músculos: Pectoral mayor/menor, tríceps, deltoides anterior
- Ejercicios: Press plano, press inclinado, fondos, aperturas, push-up variantes, crossover
- Cada ejercicio: video demostrativo + imágenes inicio/ejecución/fin + cues de errores comunes
- La IA recomienda este workout solo cuando el usuario lleva ≥6 semanas y nivel avanzado

### Progresiones de Calistenia
- Push: knee push-up → push-up → diamond → archer → one-arm push-up
- Pull: dead hang → scapular → negative pull-up → pull-up → weighted → one-arm
- Core: plank → hollow body → L-sit → dragon flag
- Legs: squat → jump squat → pistol squat progression
- Skills: handstand, muscle-up, front lever (nivel élite)

---

## Monetización

| Tier | Precio | Incluye |
|---|---|---|
| **Free** | $0 | 3 entrenamientos/semana, catálogo básico, sin coach IA |
| **Premium** | $9.99/mes | Planes ilimitados + coach IA + wearables + nutrición + todo el catálogo |

- Trial de 7 días del plan Premium al registrarse
- Gestión de pagos vía Stripe

---

## Verificación

1. **Onboarding → plan generado:** completar el flow de 5 pasos, verificar que se creen filas en `workout_plans`, `workouts`, `exercises`
2. **Workout Player:** iniciar una sesión, registrar sets, verificar que se guarden en `workout_sessions` y `session_sets`
3. **Coach chat:** enviar mensaje, verificar respuesta con contexto correcto del usuario
4. **Adapt plan:** simular 1 semana de sesiones, ejecutar `adapt-plan` manualmente, verificar cambios en semanas futuras
5. **Media obligatoria:** intentar insertar ejercicio sin `video_url` → debe fallar (constraint DB)
6. **Stripe:** completar checkout de prueba, verificar cambio de tier en `users`
7. **Wearables:** sincronizar HealthKit en iOS, verificar datos en `wearable_data`
