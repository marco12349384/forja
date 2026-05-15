import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

const DEFAULT_MISSIONS = [
  { label: 'Toma 2 vasos de agua al despertar', icon: '💧', category: 'hydration', points_value: 10 },
  { label: 'Camina 10 minutos al aire libre', icon: '🚶', category: 'movement', points_value: 10 },
  { label: 'Desayuna con proteína hoy', icon: '🥚', category: 'nutrition', points_value: 15 },
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();

    let email = '';
    let name = '';
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress ?? '';
      name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    } catch (err) {
      console.error('mini-missions/GET: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);
    const todayISO = new Date().toISOString().split('T')[0];

    let rows = await sql`
      SELECT id, label, icon, category, points_value, done, done_at, created_at
      FROM mini_missions
      WHERE user_id = ${dbUserId} AND date = ${todayISO}
      ORDER BY created_at ASC
    `;

    if (rows.length === 0) {
      // Insert 3 default missions for today in a single multi-row INSERT
      await sql`
        INSERT INTO mini_missions (user_id, date, label, icon, category, points_value)
        VALUES
          (${dbUserId}, ${todayISO}, ${DEFAULT_MISSIONS[0].label}, ${DEFAULT_MISSIONS[0].icon}, ${DEFAULT_MISSIONS[0].category}, ${DEFAULT_MISSIONS[0].points_value}),
          (${dbUserId}, ${todayISO}, ${DEFAULT_MISSIONS[1].label}, ${DEFAULT_MISSIONS[1].icon}, ${DEFAULT_MISSIONS[1].category}, ${DEFAULT_MISSIONS[1].points_value}),
          (${dbUserId}, ${todayISO}, ${DEFAULT_MISSIONS[2].label}, ${DEFAULT_MISSIONS[2].icon}, ${DEFAULT_MISSIONS[2].category}, ${DEFAULT_MISSIONS[2].points_value})
      `;

      rows = await sql`
        SELECT id, label, icon, category, points_value, done, done_at, created_at
        FROM mini_missions
        WHERE user_id = ${dbUserId} AND date = ${todayISO}
        ORDER BY created_at ASC
      `;
    }

    const missions = rows.map((r) => ({
      id: r.id,
      label: r.label,
      icon: r.icon,
      category: r.category,
      points_value: Number(r.points_value),
      done: Boolean(r.done),
      done_at: r.done_at ?? null,
    }));

    return NextResponse.json(missions);
  } catch (err) {
    console.error('mini-missions/GET:fatal', err);
    return NextResponse.json(
      { error: 'No se pudo cargar las misiones. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
