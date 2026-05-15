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
  } catch (_) {
    // fail open — table may not exist yet
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Biblioteca de Ejercicios</h1>
        </div>

        <LibraryClient exercises={exercises} />
      </div>
    </div>
  );
}
