import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { NavThemeToggle } from './_components/NavThemeToggle';
import { NavSignOut } from './_components/NavSignOut';
import { PulsoLogo } from './_components/PulsoLogo';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav
        className="border-b px-4 py-3 flex items-center gap-4 sm:gap-6"
        style={{ borderColor: 'var(--border)', background: 'linear-gradient(180deg, #0d0d0d 0%, #111 100%)' }}
      >
        <a href="/home" className="flex items-center mr-2 sm:mr-4" aria-label="PULSO inicio">
          <PulsoLogo variant="full" size={36} mountainColor="#F0F0F0" sunColor="var(--accent)" textColor="#F0F0F0" />
        </a>
        <a href="/home" className="text-sm transition-colors hover:opacity-100" style={{ color: 'var(--muted)' }}>Inicio</a>
        <a href="/dashboard" className="text-sm transition-colors hover:opacity-100 hidden sm:inline" style={{ color: 'var(--muted)' }}>Dashboard</a>
        <a href="/progress" className="text-sm transition-colors hover:opacity-100 hidden sm:inline" style={{ color: 'var(--muted)' }}>Progreso</a>
        <a href="/library" className="text-sm transition-colors hover:opacity-100 hidden md:inline" style={{ color: 'var(--muted)' }}>Biblioteca</a>
        <a href="/settings" className="text-sm transition-colors hover:opacity-100 hidden md:inline" style={{ color: 'var(--muted)' }}>Ajustes</a>
        <div className="ml-auto flex items-center gap-2">
          <NavThemeToggle />
          <NavSignOut />
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
