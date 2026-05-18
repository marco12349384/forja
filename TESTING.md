# Testing Manual End-to-End — PULSO

Plan completo de pruebas para verificar que **TODO** funciona antes de lanzar.

**Tiempo estimado:** 45 min para correr todos los flujos.

---

## Pre-requisitos

- [ ] Backend web corriendo (local o Vercel)
- [ ] App móvil instalada en device físico (Expo Go o EAS build)
- [ ] Cuenta de Clerk creada con email de prueba
- [ ] Internet estable (Snap & Eat sube imágenes ~500KB)

---

## 🟦 Flujo 1: Onboarding completo (cuenta nueva)

**Objetivo:** Usuario nuevo crea cuenta y obtiene su primer plan personalizado.

| # | Acción | Resultado esperado |
|---|---|---|
| 1.1 | Abrir app → tap "Crear cuenta" | Pantalla Clerk de registro |
| 1.2 | Registrar con email + verificar código | Te lleva a `/onboarding` |
| 1.3 | Paso 1: Welcome → tap "Comenzar" | Avanza con slide animation |
| 1.4 | Paso 2: Altura 175cm, peso 70kg, edad 28 | Inputs validan |
| 1.5 | Paso 3: Objetivo "Ganar músculo" | Avanza |
| 1.6 | Paso 4: Nivel Intermedio, 4 días/sem, 45min | Avanza |
| 1.7 | Paso 5: Sin lesiones, sexo masculino, reto "tiempo" | Avanza |
| 1.8 | Paso 6: Casa con equipo + pesas + barra | Avanza |
| 1.9 | Paso 7: Omnívoro, sin alergias, presupuesto medio, cocino a veces | Aparece "Crear mi plan" |
| 1.10 | Tap "Crear mi plan" | **Loading 15-30s** → llega a `/home` con plan generado |

**Verificar en DB (Supabase Table Editor):**
- `users` tiene 1 row con tu clerk_id
- `user_profiles` tiene tus datos
- `diet_profiles` tiene tu config de dieta
- `workout_plans` tiene 1 row con `is_active = true`
- `plan_weeks` tiene 4 rows
- `workouts` tiene ~16 rows (4 sem × 4 días)
- `exercises` tiene rows asociadas

**Verificar analytics:**
- `analytics_events` tiene row `onboarding_completed` con `time_to_complete` en segundos

---

## 🟦 Flujo 2: Daily Hub (Home) en frío

**Objetivo:** El home carga con datos reales del usuario nuevo.

| # | Acción | Resultado esperado |
|---|---|---|
| 2.1 | En home, mirar el saludo | "Buenas tardes, [tu nombre]!" |
| 2.2 | Mirar el SOCIO Score donut | Score cuenta de 0 → valor real (~50-70) en 800ms |
| 2.3 | Mirar la explicación bajo el donut | Texto con tu pillar más bajo |
| 2.4 | Mirar el card de Body Phase | "Configurar fase corporal" (si no configuraste) |
| 2.5 | Mirar plan del día | Card con nombre del workout + duración + tipo |
| 2.6 | Mirar las 3 Mini Misiones | "Toma 2 vasos de agua", etc. |

**Verificar analytics:**
- `analytics_events` tiene `socio_score_viewed` con score y lowest_component

---

## 🟦 Flujo 3: Check-in de energía

**Objetivo:** Tap en energía actualiza el plan del día.

| # | Acción | Resultado esperado |
|---|---|---|
| 3.1 | Tap ícono "⚡ Normal" | Ícono se selecciona con breathing animation suave |
| 3.2 | Pull-to-refresh el home | SOCIO Score recalcula (sleep_pts cambia) |

**Verificar DB:** `energy_checkins` tiene 1 row con `energy_level=2` y fecha de hoy.

**Verificar analytics:** `daily_checkin_done` con energy_level=2.

---

## 🟦 Flujo 4: Workout completo

**Objetivo:** Iniciar y terminar un entreno; verificar tracking.

| # | Acción | Resultado esperado |
|---|---|---|
| 4.1 | Tap "Iniciar entrenamiento" | Pantalla Workout Player con primer ejercicio |
| 4.2 | Marcar set 1 ✅ | Checkmark spring-anima, se marca verde |
| 4.3 | Esperar 60s rest timer | Número pulsa cada segundo, llega a 0 |
| 4.4 | Marcar todos los sets de 4 ejercicios | Cada uno con animación |
| 4.5 | Tap "Terminar 🎉" | Pantalla `done.tsx` con stats |
| 4.6 | Verificar stats: minutos, kcal, sets, ejercicios | Números reales (no mock) |
| 4.7 | Auto-navega a /home después de ~1.5s | Vuelves al home |

**Verificar DB:** `workout_sessions` tiene 1 row con `intensity='intense'` y `completed_sets` real.

**Verificar analytics:** `workout_started` y `workout_completed` ambos presentes.

---

## 🟦 Flujo 5: SOCIO Score sube después del workout

**Objetivo:** El score se recalcula con el workout completado.

| # | Acción | Resultado esperado |
|---|---|---|
| 5.1 | En home, scroll al SOCIO Score | Number cuenta hasta nuevo valor (más alto) |
| 5.2 | Mirar componentes | `movement` ahora es 25 (era 0) |

---

## 🟦 Flujo 6: Log de comida manual

**Objetivo:** Registrar una comida con macros manuales.

| # | Acción | Resultado esperado |
|---|---|---|
| 6.1 | Tap tab "Nutrición" | Pantalla con macros en 0/2200 kcal |
| 6.2 | Tap "Registrar comida" en Desayuno | Modal slide-up con backdrop fade |
| 6.3 | Completar: "Avena con plátano", 400 kcal, 12g prot | Botón Submit se habilita |
| 6.4 | Tap "Registrar" | Modal cierra, macros actualizadas |
| 6.5 | Verificar card de Desayuno | Muestra "Avena con plátano (400 kcal)" |

**Verificar DB:** `food_logs` + `daily_nutrition` ambas con la nueva entrada.

**Verificar analytics:** `meal_logged` con `method: 'manual'` y kcal=400.

---

## 🟦 Flujo 7: Snap & Eat (cámara + AI)

**Objetivo:** Foto de plato → AI identifica → guarda macros.

| # | Acción | Resultado esperado |
|---|---|---|
| 7.1 | En Nutrición, tap "📸 Snap & Eat" | Pantalla cámara |
| 7.2 | Seleccionar meal_type "Almuerzo" | Botón resaltado |
| 7.3 | Tap "Tomar foto" → permitir cámara | Cámara se abre |
| 7.4 | Foto a un plato (real, prueba con uno que tengas) | Preview + Analizando spinner |
| 7.5 | Esperar 3-8s | Si confianza ≥0.3 → "Registrado ✅ +X kcal" |
| 7.5b | Si confianza <0.3 | Pantalla preview con macros editables |
| 7.6 | Auto-navega a Nutrición | Card de Almuerzo muestra la comida |

**Verificar DB:** `food_logs` con `logged_via='snap_eat'` y `confidence_score` numérico.

**Verificar analytics:** `snap_eat_used` con confidence_score real.

---

## 🟦 Flujo 8: SOCIO Chat

**Objetivo:** Conversar con el AI socio, verificar contexto.

| # | Acción | Resultado esperado |
|---|---|---|
| 8.1 | Tap tab "💬 SOCIO" | Pantalla con saludo inicial |
| 8.2 | Tap quick prompt "Dormí poco" | Mensaje se envía + dots animados |
| 8.3 | Esperar respuesta (~3-5s) | SOCIO responde con tono honesto + considera tu día |
| 8.4 | Verificar que conoce contexto | Si mencionas tu workout, debe saber cuál fue |
| 8.5 | Escribir mensaje custom: "qué cenar?" | Recomendación basada en tu macros restantes |

**Verificar DB:** `socio_messages` tiene 2 rows por turno (user + assistant).

**Verificar analytics:** `socio_message_sent` con `response_time_ms`.

---

## 🟦 Flujo 9: Fase Corporal + Recovery Mode

**Objetivo:** Configurar ciclo y activar recovery manualmente.

| # | Acción | Resultado esperado |
|---|---|---|
| 9.1 | En home, tap card "Configurar fase corporal" | Pantalla body-phase |
| 9.2 | Activar toggle "Seguimiento de ciclo" | Aparecen campos de fecha |
| 9.3 | Ingresar fecha del último periodo (hoy - 8 días) | Card de fase aparece: "follicular" |
| 9.4 | Mover slider de stress a 4 | UI actualiza |
| 9.5 | Mover slider de sleep a 2 | UI actualiza |
| 9.6 | Activar "Modo recuperación" manualmente | Banner "🌙 Activo" |
| 9.7 | Tap "Apariencia" sección al final | 3 opciones: Claro/Oscuro/Sistema |
| 9.8 | Tap "🌙 Oscuro" | UI cambia a dark mode inmediatamente |
| 9.9 | Tap "Guardar" | Toast de éxito, vuelve a home |
| 9.10 | En home, card de Body Phase | Muestra "🌙 Modo recuperación activo" |

**Verificar DB:** `body_phases` tiene 1 row con `recovery_mode=true`.

**Verificar persistencia:** Cierra la app completamente y vuelve a abrir → dark mode persiste.

---

## 🟦 Flujo 10: Progreso con datos reales

**Objetivo:** Después de todo lo anterior, Progreso debe mostrar todo.

| # | Acción | Resultado esperado |
|---|---|---|
| 10.1 | Tap tab "📈 Progreso" | Loading → render con datos |
| 10.2 | Stats row | Racha: 1, Esta semana: 1, Mes: 1 |
| 10.3 | SOCIO Score chart | Barra para hoy con valor real |
| 10.4 | Workout heatmap | Cell de hoy con color intensity correcta |
| 10.5 | Personal Records | Placeholder "Próximamente" |
| 10.6 | Retrospectiva | Vacío hasta que haya cron Sunday |

---

## 🟦 Flujo 11: Web companion

**Objetivo:** Dashboard web muestra el mismo usuario.

| # | Acción | Resultado esperado |
|---|---|---|
| 11.1 | Abrir `https://tu-web.vercel.app` en browser | Landing → tap login |
| 11.2 | Login con la misma cuenta Clerk del mobile | Redirect a `/home` o `/dashboard` |
| 11.3 | Tap "Dashboard" en nav | SOCIO Score real + macros + energy timeline |
| 11.4 | Tap "Progreso" | Bar charts con datos reales |
| 11.5 | Tap "Biblioteca" | Lista de ejercicios filtrable |
| 11.6 | Tap "Ajustes" | Theme toggle |
| 11.7 | Tap "🌙" en nav | Web cambia a dark mode |
| 11.8 | Recargar página | Theme persiste (localStorage) |

---

## 🟦 Flujo 12: Mini Misiones

**Objetivo:** Completar misiones acumula puntos.

| # | Acción | Resultado esperado |
|---|---|---|
| 12.1 | En home, tap círculo de Mini Misión "Toma 2 vasos de agua" | Check ✓ verde (optimistic) |
| 12.2 | Contador "1/3" actualiza | UI inmediata |
| 12.3 | Si la API falla (offline), revierte | Volvería a uncheck |
| 12.4 | Completar las 3 misiones | "3/3 ¡Todas hechas!" |

**Verificar DB:** `mini_missions` tienen `done=true` y `done_at` con timestamp.

**Verificar analytics:** 3 × `mini_mission_completed`.

---

## ❌ Casos negativos (deben fallar elegantemente)

| Test | Esperado |
|---|---|
| Cortar internet → enviar mensaje SOCIO | "Hubo un error al conectarme. ¿Tienes internet?" |
| Pasar `kcal: -50` al log endpoint | 400 con "kcal debe ser un número >= 0" |
| Foto en blanco a Snap & Eat | low-confidence preview con kcal=0 |
| Borrar token Clerk → llamar API | 401 Unauthorized |
| Subir imagen 10MB a Snap & Eat | 400 "Imagen muy grande" |

---

## 📊 Reporte final

Al terminar, verifica en Supabase Table Editor:

| Tabla | Rows mínimos esperados |
|---|---|
| `users` | 1 |
| `user_profiles` | 1 |
| `workout_plans` | 1 (is_active=true) |
| `plan_weeks` | 4 |
| `workouts` | ~16 |
| `exercises` | >40 |
| `energy_checkins` | 1 |
| `socio_scores` | 1 |
| `mini_missions` | 3 |
| `daily_nutrition` | 1 |
| `food_logs` | 2+ (1 manual, 1 snap) |
| `socio_messages` | 4+ (2+ turnos) |
| `body_phases` | 1 |
| `workout_sessions` | 1 |
| `analytics_events` | 10+ |

---

## Si encuentras un bug

1. **Captura:** screenshot + logs (Vercel logs / Expo Dev Tools)
2. **Reproduce:** verifica que pasa 2/2 veces
3. **Documenta:** crea issue en GitHub con pasos exactos
4. **Severidad:**
   - 🔴 Critical: app crashea, no se puede usar
   - 🟡 Important: feature no funciona pero hay workaround
   - 🟢 Minor: cosmético o edge case raro

---

¡Si pasaste los 12 flujos sin bloqueos, **PULSO está listo para beta**! 🚀
