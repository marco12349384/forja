import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-xs font-semibold tracking-[3px] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            ⚡ Configuración
          </div>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(36px, 7vw, 56px)', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>AJUSTES</span>
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <SettingsClient />
      </div>
    </div>
  );
}
