import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  // Guard against invalid / missing id
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return NextResponse.json({ error: 'ID de misión inválido' }, { status: 400 });
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
      console.error('mini-missions/complete: currentUser failed', err);
    }

    const dbUserId = await ensureUser(userId, email, name);

    const rows = await sql`
      UPDATE mini_missions
      SET done = true, done_at = now()
      WHERE id = ${id} AND user_id = ${dbUserId} AND done = false
      RETURNING id, label, icon, category, points_value, done, done_at
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Misión no encontrada o ya completada' },
        { status: 404 },
      );
    }

    const r = rows[0];
    return NextResponse.json({
      id: r.id,
      label: r.label,
      icon: r.icon,
      category: r.category,
      points_value: Number(r.points_value),
      done: Boolean(r.done),
      done_at: r.done_at ?? null,
    });
  } catch (err) {
    console.error('mini-missions/complete:fatal', err);
    return NextResponse.json(
      { error: 'No se pudo completar la misión. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
