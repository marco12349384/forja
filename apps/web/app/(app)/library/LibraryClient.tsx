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

function difficultyColor(difficulty: string): string {
  const d = (difficulty ?? '').toLowerCase();
  if (d === 'principiante' || d === 'beginner') return '#22c55e';
  if (d === 'intermedio' || d === 'intermediate') return 'var(--accent)';
  return 'var(--accent2)';
}

function tabMatchesType(tab: Tab, type: string): boolean {
  return (type ?? '').toLowerCase() === tab.toLowerCase();
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
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface)',
                color: active ? '#000' : 'var(--muted)',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {exercises.length === 0
              ? 'La biblioteca se llena con tu plan. Genera un plan desde la app.'
              : 'No hay ejercicios en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Type chip */}
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block"
                style={{
                  background: 'rgba(255,107,53,0.12)',
                  color: 'var(--accent2)',
                }}
              >
                {ex.type}
              </span>

              {/* Name */}
              <p className="font-display text-base mt-2 mb-1 leading-snug" style={{ fontWeight: 700 }}>
                {ex.name}
              </p>

              {/* Muscles */}
              {(ex.muscles_primary?.length ?? 0) > 0 && (
                <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                  {(ex.muscles_primary ?? []).join(', ')}
                </p>
              )}

              {/* Difficulty */}
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: difficultyColor(ex.difficulty) }}>
                {ex.difficulty}
              </p>

              {/* Equipment */}
              {(ex.equipment_needed?.length ?? 0) > 0 && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}>
                  {(ex.equipment_needed ?? []).filter(Boolean).length === 0
                    ? '✓ Sin equipo'
                    : (ex.equipment_needed ?? []).join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
