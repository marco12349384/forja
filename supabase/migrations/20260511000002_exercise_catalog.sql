-- Exercise catalog
create table public.exercise_catalog (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  type text not null check (type in ('gym','home','cardio','calistenia','yoga','movilidad')),
  muscles_primary text[] not null,
  muscles_secondary text[] not null default '{}',
  equipment text not null check (equipment in ('ninguno','mancuernas','barra','anillas','gym_completo','bandas')),
  difficulty text not null check (difficulty in ('principiante','intermedio','avanzado')),
  video_url text not null,
  images jsonb not null,
  cues_correct text[] not null default '{}',
  cues_common_mistakes text[] not null default '{}',
  calistenia_level int check (calistenia_level between 1 and 5),
  created_at timestamptz not null default now(),
  constraint exercise_catalog_images_check check (
    images ? 'start' and images ? 'end'
  )
);

alter table public.exercise_catalog enable row level security;
create policy "Authenticated users can read catalog" on public.exercise_catalog
  for select using (auth.role() = 'authenticated');

-- FK de exercises al catálogo
alter table public.exercises
  add constraint exercises_catalog_id_fkey
  foreign key (catalog_id) references public.exercise_catalog(id);

-- Seed: ejercicios iniciales
insert into public.exercise_catalog
  (name, slug, type, muscles_primary, muscles_secondary, equipment, difficulty, video_url, images, cues_correct, cues_common_mistakes, calistenia_level)
values
(
  'Flexión de brazos', 'flexion-brazos',
  'calistenia', ARRAY['pectoral_mayor', 'triceps'], ARRAY['deltoides_anterior', 'core'],
  'ninguno', 'principiante',
  'https://www.youtube.com/embed/IODxDxX7oi4',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600", "mid": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600", "end": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600"}',
  ARRAY['Mantén el cuerpo recto como una tabla', 'Baja hasta casi tocar el suelo', 'Codos a 45° del cuerpo'],
  ARRAY['No dejes caer las caderas', 'No bloquees los codos al subir', 'No mires hacia arriba — cabeza neutra'],
  1
),
(
  'Flexión diamante', 'flexion-diamante',
  'calistenia', ARRAY['triceps', 'pectoral_mayor'], ARRAY['deltoides_anterior'],
  'ninguno', 'intermedio',
  'https://www.youtube.com/embed/J0DXGHysAH4',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600", "end": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
  ARRAY['Manos formando un diamante bajo el pecho', 'Mantén los codos pegados al cuerpo', 'Core apretado en todo momento'],
  ARRAY['No separar demasiado los codos', 'No dejar caer las caderas'],
  2
),
(
  'Flexión arquero', 'flexion-arquero',
  'calistenia', ARRAY['pectoral_mayor'], ARRAY['triceps', 'deltoides_anterior'],
  'ninguno', 'avanzado',
  'https://www.youtube.com/embed/kBWAon7ItAw',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600", "end": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"}',
  ARRAY['Extiende completamente el brazo lateral', 'Baja lentamente hacia el lado activo', 'Mantén el cuerpo alineado'],
  ARRAY['No rotar las caderas', 'No doblar el brazo extendido'],
  3
),
(
  'Sentadilla', 'sentadilla',
  'home', ARRAY['cuadriceps', 'gluteos'], ARRAY['isquiotibiales', 'core'],
  'ninguno', 'principiante',
  'https://www.youtube.com/embed/aclHkVaku9U',
  '{"start": "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600", "mid": "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=600", "end": "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=600"}',
  ARRAY['Rodillas alineadas con los pies', 'Espalda recta, pecho hacia arriba', 'Baja hasta muslos paralelos al suelo'],
  ARRAY['No dejes que las rodillas colapsen hacia adentro', 'No levantes los talones del suelo'],
  null
),
(
  'Pistol squat', 'pistol-squat',
  'calistenia', ARRAY['cuadriceps', 'gluteos'], ARRAY['isquiotibiales', 'core', 'tobillo'],
  'ninguno', 'avanzado',
  'https://www.youtube.com/embed/qDcniqddTeE',
  '{"start": "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600", "end": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
  ARRAY['Extiende la pierna libre hacia adelante', 'Baja controlado hasta el fondo', 'Usa los brazos para balance'],
  ARRAY['No dejes caer la rodilla hacia adentro', 'No redondear la espalda baja'],
  4
),
(
  'Dominada', 'dominada',
  'calistenia', ARRAY['dorsal_ancho', 'biceps'], ARRAY['romboides', 'core'],
  'barra', 'intermedio',
  'https://www.youtube.com/embed/eGo4IYlbE5g',
  '{"start": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600", "mid": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600", "end": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
  ARRAY['Empieza con brazos completamente extendidos', 'Jala los codos hacia las costillas', 'Lleva el pecho a la barra'],
  ARRAY['No uses impulso', 'No encojas los hombros', 'No dejes caer el cuerpo sin control'],
  2
),
(
  'Dominada lastrada', 'dominada-lastrada',
  'calistenia', ARRAY['dorsal_ancho', 'biceps'], ARRAY['romboides', 'core'],
  'barra', 'avanzado',
  'https://www.youtube.com/embed/eGo4IYlbE5g',
  '{"start": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600", "end": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"}',
  ARRAY['Usa cinturón con peso o mochila', 'Misma técnica que dominada estándar', 'Aumenta peso gradualmente'],
  ARRAY['No uses impulso con el peso adicional', 'No sacrifiques la técnica por el peso'],
  4
),
(
  'Press de banca', 'press-banca',
  'gym', ARRAY['pectoral_mayor'], ARRAY['triceps', 'deltoides_anterior'],
  'barra', 'intermedio',
  'https://www.youtube.com/embed/rT7DgCr-3pg',
  '{"start": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600", "mid": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600", "end": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
  ARRAY['Pies planos en el suelo', 'Arco natural en la espalda baja', 'Baja la barra al pectoral bajo'],
  ARRAY['No rebotar la barra en el pecho', 'No levantar las caderas del banco', 'No tomar grip demasiado ancho'],
  null
),
(
  'Press inclinado', 'press-inclinado',
  'gym', ARRAY['pectoral_mayor_superior'], ARRAY['triceps', 'deltoides_anterior'],
  'mancuernas', 'intermedio',
  'https://www.youtube.com/embed/8iPEnn-ltC8',
  '{"start": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600", "end": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"}',
  ARRAY['Banco a 30-45 grados', 'Baja las mancuernas controlado', 'Empuja hacia arriba y ligeramente adentro'],
  ARRAY['No dejes caer los codos demasiado abajo', 'No arquear exageradamente la espalda'],
  null
),
(
  'Apertura con mancuernas', 'apertura-mancuernas',
  'gym', ARRAY['pectoral_mayor'], ARRAY['deltoides_anterior'],
  'mancuernas', 'intermedio',
  'https://www.youtube.com/embed/eozdVDA78K0',
  '{"start": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600", "end": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"}',
  ARRAY['Ligera flexión en los codos durante todo el movimiento', 'Baja hasta sentir estiramiento en el pecho', 'Sube como si abrazaras un árbol grande'],
  ARRAY['No bajar demasiado (lesión de hombro)', 'No usar demasiado peso'],
  null
),
(
  'Fondos en paralelas', 'fondos-paralelas',
  'calistenia', ARRAY['pectoral_mayor', 'triceps'], ARRAY['deltoides_anterior', 'core'],
  'anillas', 'intermedio',
  'https://www.youtube.com/embed/2z8JmcrW-As',
  '{"start": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600", "end": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"}',
  ARRAY['Inclina el torso ligeramente hacia adelante para pecho', 'Baja hasta codos a 90 grados', 'Empuja hasta bloquear los codos'],
  ARRAY['No bajes demasiado (lesión de hombro)', 'No balancees el cuerpo'],
  2
),
(
  'Hollow body hold', 'hollow-body-hold',
  'calistenia', ARRAY['core', 'recto_abdominal'], ARRAY['psoas', 'oblicuos'],
  'ninguno', 'intermedio',
  'https://www.youtube.com/embed/LlDNef_Ztsc',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600", "end": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
  ARRAY['Presiona la espalda baja contra el suelo', 'Brazos extendidos sobre la cabeza', 'Piernas a 45 grados del suelo'],
  ARRAY['No dejar que la espalda baja se separe del suelo', 'No aguantar la respiración'],
  2
),
(
  'L-sit', 'l-sit',
  'calistenia', ARRAY['core', 'cuadriceps'], ARRAY['triceps', 'hombros'],
  'ninguno', 'avanzado',
  'https://www.youtube.com/embed/IUZJoSP66HI',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600", "end": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
  ARRAY['Piernas completamente extendidas y paralelas al suelo', 'Empuja el suelo con las manos', 'Mantén los hombros deprimidos'],
  ARRAY['No doblar las rodillas', 'No encogerse de hombros'],
  4
),
(
  'Plancha', 'plancha',
  'home', ARRAY['core', 'recto_abdominal'], ARRAY['hombros', 'gluteos'],
  'ninguno', 'principiante',
  'https://www.youtube.com/embed/pSHjTRCQxIw',
  '{"start": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600", "end": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600"}',
  ARRAY['Cuerpo recto de cabeza a talones', 'Core apretado, no dejes caer las caderas', 'Respira de forma controlada'],
  ARRAY['No elevar las caderas en pico', 'No hundir las caderas hacia el suelo'],
  null
),
(
  'Muscle-up', 'muscle-up',
  'calistenia', ARRAY['dorsal_ancho', 'pectoral_mayor', 'triceps'], ARRAY['biceps', 'core'],
  'barra', 'avanzado',
  'https://www.youtube.com/embed/3VcKaXpzqRo',
  '{"start": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600", "end": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=600"}',
  ARRAY['Genera impulso desde el hollow body', 'Transición rápida cuando el pecho llega a la barra', 'Empuja hasta los fondos'],
  ARRAY['No kippear de más — controla el impulso', 'No cortar el rango de movimiento'],
  5
);

-- Pectorales Edición Insana (basada en modelo P4P Español)
-- Los ejercicios ya están insertados arriba (press-banca, press-inclinado, apertura-mancuernas, fondos-paralelas, flexion-brazos)
-- Este comentario documenta que esa rutina usa: press-banca, press-inclinado, apertura-mancuernas, fondos-paralelas, flexion-arquero
