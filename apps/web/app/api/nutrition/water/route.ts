import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Parse and validate body
  let delta: 1 | -1;
  try {
    const body = await req.json();
    if (body?.delta !== 1 && body?.delta !== -1) {
      return NextResponse.json({ error: 'delta debe ser 1 o -1' }, { status: 400 });
    }
    delta = body.delta as 1 | -1;
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
      console.error('nutrition/water: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const todayISO = new Date().toISOString().split('T')[0];

    const result = await sql`
      INSERT INTO daily_nutrition (user_id, date, water_glasses, kcal_goal, protein_goal)
      VALUES (${dbUserId}, ${todayISO}, GREATEST(0, ${delta}::int), 2200, 150)
      ON CONFLICT (user_id, date) DO UPDATE SET
        water_glasses = GREATEST(0, daily_nutrition.water_glasses + ${delta}::int),
        updated_at = now()
      RETURNING water_glasses
    `;

    const water = Number(result[0]?.water_glasses ?? 0);
    return NextResponse.json({ water });
  } catch (err: any) {
    console.error('nutrition/water:fatal', err);
    return NextResponse.json({ error: 'No se pudo actualizar el agua. Intenta de nuevo.' }, { status: 500 });
  }
}
