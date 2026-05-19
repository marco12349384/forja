import { auth } from '@clerk/nextjs/server';
import { getDb } from '@forja/api-client';
import LibraryClient, { type Exercise } from './LibraryClient';

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const sql = getDb();

  let exercises: Exercise[] = [];
  try {
    const rows = await sql`
      SELECT id, name, slug, type, muscles_primary, difficulty, equipment_needed
      FROM exercise_catalog
      ORDER BY type, name
    `;
    exercises = rows as unknown as Exercise[];
  } catch (_) {}

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="text-xs font-semibold tracking-[3px] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            ⚡ {exercises.length} ejercicios catalogados
          </div>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(36px, 7vw, 56px)', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>BIBLIO</span>
            <span style={{ color: 'var(--accent)' }}>TECA</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <LibraryClient exercises={exercises} />
      </div>
    </div>
  );
}
