import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">Ajustes</h1>
      <SettingsClient />
    </div>
  );
}
