import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getActivePlan, getTodayWorkout } from '@forja/api-client';

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const plan = await getActivePlan(userId);
    const todayName = DAYS_ES[new Date().getDay()];
    const today = plan ? await getTodayWorkout(plan.id, todayName) : null;
    return NextResponse.json({ plan, today });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
