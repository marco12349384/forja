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
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Apariencia</h2>
      <div className="grid grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setMode(o.value)}
            className={
              mode === o.value
                ? 'px-4 py-3 rounded-xl bg-violet-600 text-white font-medium transition-all'
                : 'px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 transition-all'
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        El modo Sistema usa la preferencia de tu dispositivo automáticamente.
      </p>
    </section>
  );
}
