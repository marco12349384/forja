import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function migrate() {
  console.log('🚀 Running Forja migrations on Neon...\n');

  try {
    // Schema
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log('✓ uuid-ossp extension');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clerk_id text NOT NULL UNIQUE,
        email text NOT NULL,
        name text NOT NULL DEFAULT '',
        avatar_url text,
        subscription_tier text NOT NULL DEFAULT 'free'
          CHECK (subscription_tier IN ('free', 'premium')),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    console.log('✓ users table');

    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id uuid REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
        fitness_level text NOT NULL
          CHECK (fitness_level IN ('principiante', 'intermedio', 'avanzado')),
        goal text NOT NULL
          CHECK (goal IN ('perder_peso', 'ganar_musculo', 'resistencia', 'movilidad', 'fitness_general')),
        available_equipment text[] NOT NULL DEFAULT '{}',
        days_per_week int NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
        session_duration_min int NOT NULL CHECK (session_duration_min BETWEEN 20 AND 120),
        injuries text[] NOT NULL DEFAULT '{}',
        weight_kg numeric,
        height_cm numeric,
        age int,
        gender text CHECK (gender IN ('masculino', 'femenino', 'otro')),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    console.log('✓ user_profiles table');

    await sql`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name text NOT NULL,
        weeks_total int NOT NULL,
        generated_by_ai boolean NOT NULL DEFAULT true,
        ai_context jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    console.log('✓ workout_plans table');

    await sql`
      CREATE TABLE IF NOT EXISTS plan_weeks (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id uuid REFERENCES workout_plans(id) ON DELETE CASCADE NOT NULL,
        week_number int NOT NULL,
        focus text NOT NULL,
        notes text
      )
    `;
    console.log('✓ plan_weeks table');

    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_week_id uuid REFERENCES plan_weeks(id) ON DELETE CASCADE NOT NULL,
        day_of_week text NOT NULL
          CHECK (day_of_week IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
        name text NOT NULL,
        type text NOT NULL
          CHECK (type IN ('gym','home','cardio','calistenia','yoga','movilidad')),
        estimated_duration_min int NOT NULL,
        difficulty text NOT NULL
          CHECK (difficulty IN ('principiante','intermedio','avanzado'))
      )
    `;
    console.log('✓ workouts table');

    await sql`
      CREATE TABLE IF NOT EXISTS exercise_catalog (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        type text NOT NULL CHECK (type IN ('gym','home','cardio','calistenia','yoga','movilidad')),
        muscles_primary text[] NOT NULL,
        muscles_secondary text[] NOT NULL DEFAULT '{}',
        equipment text NOT NULL
          CHECK (equipment IN ('ninguno','mancuernas','barra','anillas','gym_completo','bandas')),
        difficulty text NOT NULL
          CHECK (difficulty IN ('principiante','intermedio','avanzado')),
        video_url text NOT NULL,
        images jsonb NOT NULL,
        cues_correct text[] NOT NULL DEFAULT '{}',
        cues_common_mistakes text[] NOT NULL DEFAULT '{}',
        calistenia_level int CHECK (calistenia_level BETWEEN 1 AND 5),
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT exercise_catalog_images_check CHECK (
          images ? 'start' AND images ? 'end'
        )
      )
    `;
    console.log('✓ exercise_catalog table');

    await sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
        catalog_id uuid REFERENCES exercise_catalog(id) NOT NULL,
        order_index int NOT NULL,
        sets int NOT NULL,
        reps text NOT NULL,
        rest_seconds int NOT NULL,
        tempo text,
        notes text
      )
    `;
    console.log('✓ exercises table');

    // Seed exercise catalog
    const count = await sql`SELECT COUNT(*) FROM exercise_catalog`;
    if (parseInt(count[0].count) === 0) {
      await sql`
        INSERT INTO exercise_catalog
          (name, slug, type, muscles_primary, muscles_secondary, equipment, difficulty, video_url, images, cues_correct, cues_common_mistakes, calistenia_level)
        VALUES
        ('Flexión de brazos', 'flexion-brazos', 'calistenia',
          ARRAY['pectoral_mayor','triceps'], ARRAY['deltoides_anterior','core'],
          'ninguno', 'principiante',
          'https://www.youtube.com/embed/IODxDxX7oi4',
          '{"start":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","mid":"https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600","end":"https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600"}',
          ARRAY['Mantén el cuerpo recto como una tabla','Baja hasta casi tocar el suelo','Codos a 45° del cuerpo'],
          ARRAY['No dejes caer las caderas','No bloquees los codos al subir','No mires hacia arriba — cabeza neutra'], 1),
        ('Flexión diamante', 'flexion-diamante', 'calistenia',
          ARRAY['triceps','pectoral_mayor'], ARRAY['deltoides_anterior'],
          'ninguno', 'intermedio',
          'https://www.youtube.com/embed/J0DXGHysAH4',
          '{"start":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","end":"https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
          ARRAY['Manos formando un diamante bajo el pecho','Mantén los codos pegados al cuerpo','Core apretado en todo momento'],
          ARRAY['No separar demasiado los codos','No dejar caer las caderas'], 2),
        ('Flexión arquero', 'flexion-arquero', 'calistenia',
          ARRAY['pectoral_mayor'], ARRAY['triceps','deltoides_anterior'],
          'ninguno', 'avanzado',
          'https://www.youtube.com/embed/kBWAon7ItAw',
          '{"start":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","end":"https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"}',
          ARRAY['Extiende completamente el brazo lateral','Baja lentamente hacia el lado activo','Mantén el cuerpo alineado'],
          ARRAY['No rotar las caderas','No doblar el brazo extendido'], 3),
        ('Sentadilla', 'sentadilla', 'home',
          ARRAY['cuadriceps','gluteos'], ARRAY['isquiotibiales','core'],
          'ninguno', 'principiante',
          'https://www.youtube.com/embed/aclHkVaku9U',
          '{"start":"https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600","mid":"https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=600","end":"https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=600"}',
          ARRAY['Rodillas alineadas con los pies','Espalda recta pecho hacia arriba','Baja hasta muslos paralelos al suelo'],
          ARRAY['No dejes que las rodillas colapsen hacia adentro','No levantes los talones del suelo'], null),
        ('Pistol squat', 'pistol-squat', 'calistenia',
          ARRAY['cuadriceps','gluteos'], ARRAY['isquiotibiales','core','tobillo'],
          'ninguno', 'avanzado',
          'https://www.youtube.com/embed/qDcniqddTeE',
          '{"start":"https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600","end":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
          ARRAY['Extiende la pierna libre hacia adelante','Baja controlado hasta el fondo','Usa los brazos para balance'],
          ARRAY['No dejes caer la rodilla hacia adentro','No redondear la espalda baja'], 4),
        ('Dominada', 'dominada', 'calistenia',
          ARRAY['dorsal_ancho','biceps'], ARRAY['romboides','core'],
          'barra', 'intermedio',
          'https://www.youtube.com/embed/eGo4IYlbE5g',
          '{"start":"https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600","mid":"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600","end":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
          ARRAY['Empieza con brazos completamente extendidos','Jala los codos hacia las costillas','Lleva el pecho a la barra'],
          ARRAY['No uses impulso','No encojas los hombros','No dejes caer el cuerpo sin control'], 2),
        ('Dominada lastrada', 'dominada-lastrada', 'calistenia',
          ARRAY['dorsal_ancho','biceps'], ARRAY['romboides','core'],
          'barra', 'avanzado',
          'https://www.youtube.com/embed/eGo4IYlbE5g',
          '{"start":"https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600","end":"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"}',
          ARRAY['Usa cinturón con peso o mochila','Misma técnica que dominada estándar','Aumenta peso gradualmente'],
          ARRAY['No uses impulso con el peso adicional','No sacrifiques la técnica por el peso'], 4),
        ('Press de banca', 'press-banca', 'gym',
          ARRAY['pectoral_mayor'], ARRAY['triceps','deltoides_anterior'],
          'barra', 'intermedio',
          'https://www.youtube.com/embed/rT7DgCr-3pg',
          '{"start":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600","mid":"https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600","end":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
          ARRAY['Pies planos en el suelo','Arco natural en la espalda baja','Baja la barra al pectoral bajo'],
          ARRAY['No rebotar la barra en el pecho','No levantar las caderas del banco','No tomar grip demasiado ancho'], null),
        ('Press inclinado', 'press-inclinado', 'gym',
          ARRAY['pectoral_mayor_superior'], ARRAY['triceps','deltoides_anterior'],
          'mancuernas', 'intermedio',
          'https://www.youtube.com/embed/8iPEnn-ltC8',
          '{"start":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600","end":"https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"}',
          ARRAY['Banco a 30-45 grados','Baja las mancuernas controlado','Empuja hacia arriba y ligeramente adentro'],
          ARRAY['No dejes caer los codos demasiado abajo','No arquear exageradamente la espalda'], null),
        ('Apertura con mancuernas', 'apertura-mancuernas', 'gym',
          ARRAY['pectoral_mayor'], ARRAY['deltoides_anterior'],
          'mancuernas', 'intermedio',
          'https://www.youtube.com/embed/eozdVDA78K0',
          '{"start":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600","end":"https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"}',
          ARRAY['Ligera flexión en los codos durante todo el movimiento','Baja hasta sentir estiramiento en el pecho','Sube como si abrazaras un árbol grande'],
          ARRAY['No bajar demasiado (lesión de hombro)','No usar demasiado peso'], null),
        ('Fondos en paralelas', 'fondos-paralelas', 'calistenia',
          ARRAY['pectoral_mayor','triceps'], ARRAY['deltoides_anterior','core'],
          'anillas', 'intermedio',
          'https://www.youtube.com/embed/2z8JmcrW-As',
          '{"start":"https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600","end":"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"}',
          ARRAY['Inclina el torso ligeramente hacia adelante para pecho','Baja hasta codos a 90 grados','Empuja hasta bloquear los codos'],
          ARRAY['No bajes demasiado (lesión de hombro)','No balancees el cuerpo'], 2),
        ('Hollow body hold', 'hollow-body-hold', 'calistenia',
          ARRAY['core','recto_abdominal'], ARRAY['psoas','oblicuos'],
          'ninguno', 'intermedio',
          'https://www.youtube.com/embed/LlDNef_Ztsc',
          '{"start":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","end":"https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
          ARRAY['Presiona la espalda baja contra el suelo','Brazos extendidos sobre la cabeza','Piernas a 45 grados del suelo'],
          ARRAY['No dejar que la espalda baja se separe del suelo','No aguantar la respiración'], 2),
        ('L-sit', 'l-sit', 'calistenia',
          ARRAY['core','cuadriceps'], ARRAY['triceps','hombros'],
          'ninguno', 'avanzado',
          'https://www.youtube.com/embed/IUZJoSP66HI',
          '{"start":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","end":"https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
          ARRAY['Piernas completamente extendidas y paralelas al suelo','Empuja el suelo con las manos','Mantén los hombros deprimidos'],
          ARRAY['No doblar las rodillas','No encogerse de hombros'], 4),
        ('Plancha', 'plancha', 'home',
          ARRAY['core','recto_abdominal'], ARRAY['hombros','gluteos'],
          'ninguno', 'principiante',
          'https://www.youtube.com/embed/pSHjTRCQxIw',
          '{"start":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","end":"https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
          ARRAY['Cuerpo recto de cabeza a talones','Core apretado no dejes caer las caderas','Respira de forma controlada'],
          ARRAY['No elevar las caderas en pico','No hundir las caderas hacia el suelo'], null),
        ('Muscle-up', 'muscle-up', 'calistenia',
          ARRAY['dorsal_ancho','pectoral_mayor','triceps'], ARRAY['biceps','core'],
          'barra', 'avanzado',
          'https://www.youtube.com/embed/3VcKaXpzqRo',
          '{"start":"https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600","end":"https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
          ARRAY['Genera impulso desde el hollow body','Transición rápida cuando el pecho llega a la barra','Empuja hasta los fondos'],
          ARRAY['No kippear de más — controla el impulso','No cortar el rango de movimiento'], 5)
      `;
      console.log('✓ exercise catalog seeded (15 exercises)');
    } else {
      console.log('✓ exercise catalog already has data, skipping seed');
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
