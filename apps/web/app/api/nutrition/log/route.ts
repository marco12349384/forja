import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

const VALID_MEAL_TYPES = ['desayuno', 'almuerzo', 'cena', 'snack'] as const;
type MealType = (typeof VALID_MEAL_TYPES)[number];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Parse and validate body
  let meal_type: MealType;
  let description: string;
  let kcal: number;
  let protein_g: number | null;
  let carbs_g: number | null;
  let fat_g: number | null;

  try {
    const body = await req.json();

    if (!VALID_MEAL_TYPES.includes(body?.meal_type)) {
      return NextResponse.json({ error: 'meal_type inválido' }, { status: 400 });
    }
    if (typeof body?.description !== 'string' || body.description.trim().length === 0) {
      return NextResponse.json({ error: 'description es requerida' }, { status: 400 });
    }
    if (typeof body?.kcal !== 'number' || !isFinite(body.kcal) || body.kcal < 0) {
      return NextResponse.json({ error: 'kcal debe ser un número >= 0' }, { status: 400 });
    }

    meal_type = body.meal_type as MealType;
    description = body.description.trim();
    kcal = body.kcal;
    protein_g = typeof body.protein_g === 'number' ? body.protein_g : null;
    carbs_g = typeof body.carbs_g === 'number' ? body.carbs_g : null;
    fat_g = typeof body.fat_g === 'number' ? body.fat_g : null;
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  try {
    const sql = getDb();

    let email = '';
    let name = '';
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress ?? '';
      name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    } catch (err) {
      console.error('nutrition/log: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const todayISO = new Date().toISOString().split('T')[0];

    // Insert food log
    const inserted = await sql`
      INSERT INTO food_logs (user_id, date, meal_type, description, kcal, protein_g, carbs_g, fat_g, logged_via)
      VALUES (${dbUserId}, ${todayISO}, ${meal_type}, ${description}, ${kcal}, ${protein_g}, ${carbs_g}, ${fat_g}, 'manual')
      RETURNING id, meal_type, description, kcal, protein_g, carbs_g, fat_g
    `;

    // Upsert daily_nutrition aggregate
    await sql`
      INSERT INTO daily_nutrition (user_id, date, kcal_consumed, protein_g, carbs_g, fat_g, kcal_goal, protein_goal)
      VALUES (${dbUserId}, ${todayISO}, ${kcal}, ${protein_g ?? 0}, ${carbs_g ?? 0}, ${fat_g ?? 0}, 2200, 150)
      ON CONFLICT (user_id, date) DO UPDATE SET
        kcal_consumed = daily_nutrition.kcal_consumed + EXCLUDED.kcal_consumed,
        protein_g = daily_nutrition.protein_g + EXCLUDED.protein_g,
        carbs_g = daily_nutrition.carbs_g + EXCLUDED.carbs_g,
        fat_g = daily_nutrition.fat_g + EXCLUDED.fat_g,
        updated_at = now()
    `;

    if (!inserted?.[0]) {
      console.error('nutrition/log: INSERT returned no row');
      return NextResponse.json({ error: 'No se pudo registrar la comida. Intenta de nuevo.' }, { status: 500 });
    }
    const row = inserted[0];
    return NextResponse.json({
      id: row.id,
      meal_type: row.meal_type,
      description: row.description,
      kcal: Number(row.kcal),
      protein_g: row.protein_g !== null ? Number(row.protein_g) : null,
      carbs_g: row.carbs_g !== null ? Number(row.carbs_g) : null,
      fat_g: row.fat_g !== null ? Number(row.fat_g) : null,
    });
  } catch (err: any) {
    console.error('nutrition/log:fatal', err);
    return NextResponse.json({ error: 'No se pudo registrar la comida. Intenta de nuevo.' }, { status: 500 });
  }
}
