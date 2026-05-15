import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();

    // Resolve or create DB user
    let email = '';
    let name = '';
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress ?? '';
      name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    } catch (err) {
      console.error('nutrition/today: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const todayISO = new Date().toISOString().split('T')[0];

    const [nutritionResult, logsResult] = await Promise.allSettled([
      sql`
        SELECT kcal_consumed, kcal_goal, protein_g, protein_goal, carbs_g, fat_g, water_glasses
        FROM daily_nutrition
        WHERE user_id = ${dbUserId} AND date = ${todayISO}
        LIMIT 1
      `,
      sql`
        SELECT id, meal_type, description, kcal, protein_g, carbs_g, fat_g
        FROM food_logs
        WHERE user_id = ${dbUserId} AND date = ${todayISO}
        ORDER BY created_at ASC
      `,
    ]);

    // Build macros (defaults when no row yet)
    let macros = {
      kcal: 0,
      kcalGoal: 2200,
      protein: 0,
      proteinGoal: 150,
      carbs: 0,
      fat: 0,
      water: 0,
    };

    if (nutritionResult.status === 'fulfilled' && nutritionResult.value.length > 0) {
      const row = nutritionResult.value[0];
      macros = {
        kcal: Number(row.kcal_consumed ?? 0),
        kcalGoal: Number(row.kcal_goal ?? 2200),
        protein: Number(row.protein_g ?? 0),
        proteinGoal: Number(row.protein_goal ?? 150),
        carbs: Number(row.carbs_g ?? 0),
        fat: Number(row.fat_g ?? 0),
        water: Number(row.water_glasses ?? 0),
      };
    } else if (nutritionResult.status === 'rejected') {
      console.error('nutrition/today: daily_nutrition query failed', nutritionResult.reason);
    }

    // Build meals grouped by meal_type
    const meals: Record<string, Array<{ id: string; description: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>> = {
      desayuno: [],
      almuerzo: [],
      cena: [],
      snack: [],
    };

    if (logsResult.status === 'fulfilled') {
      for (const row of logsResult.value) {
        const mealType = row.meal_type as string;
        if (mealType in meals) {
          meals[mealType].push({
            id: row.id,
            description: row.description,
            kcal: Number(row.kcal ?? 0),
            protein_g: Number(row.protein_g ?? 0),
            carbs_g: Number(row.carbs_g ?? 0),
            fat_g: Number(row.fat_g ?? 0),
          });
        }
      }
    } else {
      console.error('nutrition/today: food_logs query failed', logsResult.reason);
    }

    return NextResponse.json({ macros, meals });
  } catch (err: any) {
    console.error('nutrition/today:fatal', err);
    return NextResponse.json({ error: 'No se pudieron cargar los datos de nutrición. Intenta de nuevo.' }, { status: 500 });
  }
}
