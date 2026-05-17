import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { NavThemeToggle } from './_components/NavThemeToggle';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-white">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-6">
        <span className="font-bold text-violet-600 dark:text-violet-400 mr-4">PULSO</span>
        <a href="/home" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Inicio</a>
        <a href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Dashboard</a>
        <a href="/progress" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Progreso</a>
        <a href="/library" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Biblioteca</a>
        <a href="/settings" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Ajustes</a>
        <NavThemeToggle />
      </nav>
      <main>{children}</main>
    </div>
  );
}
