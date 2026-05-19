'use client';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function NavSignOut() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    if (confirm('¿Cerrar sesión?')) {
      await signOut();
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      title="Cerrar sesión"
      className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
      style={{
        background: 'var(--surface2)',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,107,53,0.15)';
        e.currentTarget.style.color = 'var(--accent2)';
        e.currentTarget.style.borderColor = 'var(--accent2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface2)';
        e.currentTarget.style.color = 'var(--muted)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      Cerrar sesión
    </button>
  );
}
