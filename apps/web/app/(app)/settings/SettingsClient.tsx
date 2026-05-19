'use client';
import { useTheme } from '@/app/providers';
import Link from 'next/link';

export function SettingsClient() {
  const { mode, setMode } = useTheme();
  const options: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
    { value: 'light', label: '☀️ Claro' },
    { value: 'dark', label: '🌙 Oscuro' },
    { value: 'system', label: '⚙️ Sistema' },
  ];

  return (
    <div className="space-y-7">
      {/* PLAN — primera sección porque es lo más importante */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>MI PLAN</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
          Cambia tu rutina cuando quieras
        </p>
        <Link
          href="/regenerate-plan"
          className="card card-interactive p-5 flex items-center gap-4 group"
        >
          <div
            className="flex-shrink-0 rounded-2xl flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <span className="text-2xl" aria-hidden>⚡</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base sm:text-lg" style={{ letterSpacing: '0.5px' }}>
              REGENERAR PLAN
            </p>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              Ajusta días, duración, equipo y objetivos. SOCIO arma uno nuevo.
            </p>
          </div>
          <span className="font-display text-2xl flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--accent)' }}>
            →
          </span>
        </Link>
      </section>

      {/* APARIENCIA */}
      <section>
        <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>APARIENCIA</h2>
        <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
          Tema visual de la app
        </p>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => {
            const active = mode === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setMode(o.value)}
                className="card p-3 sm:p-4 transition-all active:scale-95"
                style={{
                  background: active ? 'var(--accent)' : 'var(--surface)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  color: active ? '#000' : 'var(--text)',
                }}
              >
                <span className="font-display text-sm" style={{ letterSpacing: '0.5px' }}>
                  {o.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          El modo Sistema usa la preferencia de tu dispositivo automáticamente.
        </p>
      </section>
    </div>
  );
}
