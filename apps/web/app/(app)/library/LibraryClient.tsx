'use client';

import { useState } from 'react';

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  type: string;
  muscles_primary: string[] | null;
  difficulty: string;
  equipment_needed: string[] | null;
}

const TABS = ['Todos', 'Gym', 'Calistenia', 'Yoga', 'Pilates', 'HIIT', 'Movilidad'] as const;
type Tab = (typeof TABS)[number];

function chipStyle(type: string): string {
  const t = (type ?? '').toLowerCase();
  if (['gym', 'calistenia', 'hiit'].includes(t)) {
    return 'bg-orange-500/20 text-orange-400';
  }
  return 'bg-teal-500/20 text-teal-400';
}

function difficultyStyle(difficulty: string): string {
  const d = (difficulty ?? '').toLowerCase();
  if (d === 'principiante' || d === 'beginner') return 'text-green-400';
  if (d === 'intermedio' || d === 'intermediate') return 'text-yellow-400';
  return 'text-red-400';
}

function tabMatchesType(tab: Tab, type: string): boolean {
  const t = (type ?? '').toLowerCase();
  return t === tab.toLowerCase();
}

export default function LibraryClient({ exercises }: { exercises: Exercise[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('Todos');

  const filtered =
    activeTab === 'Todos'
      ? exercises
      : exercises.filter((ex) => tabMatchesType(activeTab, ex.type));

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          {exercises.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              La biblioteca se llena con tu plan. Genera un plan desde la app.
            </p>
          ) : (
            <p className="text-zinc-400 text-sm">
              No hay ejercicios en esta categoría.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
            >
              {/* Type chip */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${chipStyle(ex.type)}`}
              >
                {ex.type}
              </span>

              {/* Name */}
              <p className="font-semibold text-sm mt-2 mb-1 leading-snug">{ex.name}</p>

              {/* Muscles */}
              {(ex.muscles_primary?.length ?? 0) > 0 && (
                <p className="text-zinc-500 text-xs mb-1.5">
                  {(ex.muscles_primary ?? []).join(', ')}
                </p>
              )}

              {/* Difficulty */}
              <p className={`text-xs font-medium ${difficultyStyle(ex.difficulty)}`}>
                {ex.difficulty}
              </p>

              {/* Equipment */}
              {(ex.equipment_needed?.length ?? 0) > 0 && (
                <p className="text-zinc-600 text-xs mt-1">
                  {(ex.equipment_needed ?? []).filter(Boolean).length === 0
                    ? 'Sin equipo'
                    : (ex.equipment_needed ?? []).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
