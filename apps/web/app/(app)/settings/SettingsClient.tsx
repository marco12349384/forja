'use client';
import { useTheme } from '@/app/providers';

export function SettingsClient() {
  const { mode, setMode } = useTheme();
  const options: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
    { value: 'light', label: '☀️ Claro' },
    { value: 'dark', label: '🌙 Oscuro' },
    { value: 'system', label: '⚙️ Sistema' },
  ];

  return (
    <section>
      <h2 className="font-display text-xl mb-4" style={{ fontWeight: 700 }}>
        Apariencia
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = mode === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setMode(o.value)}
              className="px-4 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface)',
                color: active ? '#000' : 'var(--text)',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
        El modo Sistema usa la preferencia de tu dispositivo automáticamente.
      </p>
    </section>
  );
}
