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
      className="px-3 py-1 rounded-lg text-sm bg-zinc-100 text-zinc-700 hover:bg-red-100 hover:text-red-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-900/40 dark:hover:text-red-300 transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
