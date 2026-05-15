import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-3 flex items-center gap-6">
        <span className="font-bold text-violet-400 mr-4">PULSO</span>
        <a href="/home" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Inicio
        </a>
        <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Dashboard
        </a>
        <a href="/progress" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Progreso
        </a>
        <a href="/library" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Biblioteca
        </a>
      </nav>
      <main>{children}</main>
    </div>
  );
}
