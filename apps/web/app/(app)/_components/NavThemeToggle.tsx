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
      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
      style={{
        background: 'var(--surface2)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
      }}
    >
      {label}
    </button>
  );
}
