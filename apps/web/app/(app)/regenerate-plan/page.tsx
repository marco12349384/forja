import { auth } from '@clerk/nextjs/server';
import { getDb, getActivePlan } from '@forja/api-client';
import { redirect } from 'next/navigation';
import { RegenerateForm } from './RegenerateForm';
import { JapaneseAmbient } from '../_components/JapaneseAmbient';

interface UserProfile {
  goal: string;
  fitness_level: string;
  available_equipment: string[];
  days_per_week: number;
  session_duration_min: number;
  injuries: string[];
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
}

interface DietProfile {
  diet_type: string;
  allergies: string[];
  budget: string;
  cooking_freq: string;
  training_location: string | null;
  main_challenge: string | null;
}

export default async function RegeneratePlanPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const sql = getDb();
  let dbUserId: string | null = null;
  try {
    const rows = await sql`SELECT id FROM users WHERE clerk_id = ${userId}`;
    dbUserId = rows[0]?.id ?? null;
  } catch {}

  if (!dbUserId) redirect('/onboarding');

  const [profileResult, dietResult, planResult] = await Promise.allSettled([
    sql`SELECT goal, fitness_level, available_equipment, days_per_week, session_duration_min, injuries, weight_kg, height_cm, age, gender FROM user_profiles WHERE user_id = ${dbUserId} LIMIT 1`,
    sql`SELECT diet_type, allergies, budget, cooking_freq, training_location, main_challenge FROM diet_profiles WHERE user_id = ${dbUserId} LIMIT 1`,
    getActivePlan(userId),
  ]);

  const profile = profileResult.status === 'fulfilled' && profileResult.value.length > 0
    ? (profileResult.value[0] as unknown as UserProfile) : null;
  const diet = dietResult.status === 'fulfilled' && dietResult.value.length > 0
    ? (dietResult.value[0] as unknown as DietProfile) : null;
  const currentPlan = planResult.status === 'fulfilled' ? planResult.value : null;

  if (!profile) redirect('/onboarding');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Hero con ambient japonés */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <JapaneseAmbient variant="fuji" opacity={0.14} color="#9E1818" />
        <JapaneseAmbient variant="sun" opacity={0.14} position="top-right" color="#9E1818" />
        <div className="deco-text font-display" style={{ position: 'relative', zIndex: 1 }}>PLAN</div>
        <div className="page-hero-content max-w-3xl relative" style={{ zIndex: 2 }}>
          <div className="page-hero-tag">⚡ AJUSTA TU PLAN</div>
          <h1>
            <span style={{ color: 'var(--text)' }}>CAMBIA</span>{' '}
            <span style={{ color: 'var(--accent)' }}>TU PLAN</span>
          </h1>
          <p className="text-xs sm:text-sm mt-3 uppercase tracking-[2px] font-semibold" style={{ color: 'var(--muted)' }}>
            Plan actual: <span style={{ color: 'var(--text)' }}>{currentPlan?.name ?? 'sin plan'}</span>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RegenerateForm
          initialProfile={{
            goal: profile.goal,
            fitnessLevel: profile.fitness_level,
            equipment: profile.available_equipment ?? [],
            daysPerWeek: profile.days_per_week,
            sessionDurationMin: profile.session_duration_min,
            injuries: profile.injuries ?? [],
            weightKg: profile.weight_kg ?? undefined,
            heightCm: profile.height_cm ?? undefined,
            age: profile.age ?? undefined,
            gender: profile.gender ?? undefined,
            dietType: diet?.diet_type,
            allergies: diet?.allergies ?? [],
            budget: diet?.budget,
            cookingFreq: diet?.cooking_freq,
            trainingLocation: diet?.training_location ?? undefined,
            mainChallenge: diet?.main_challenge ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
