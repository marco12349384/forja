'use client';
import { useTheme } from '@/app/providers';

export function NavThemeToggle() {
  const { mode, setMode } = useTheme();
  const cycle = () => {
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light');
  };
  const label = mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '⚙️';
  return (
    <button
      onClick={cycle}
      title={`Tema: ${mode}`}
      className="ml-auto px-3 py-1 rounded-lg text-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition-colors"
    >
      {label}
    </button>
  );
}
