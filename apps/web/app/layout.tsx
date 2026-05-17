import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PULSO — Tu coach de fitness con IA',
  description: 'Tu app de fitness con coach IA personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className="dark">
        <body className="bg-white text-zinc-900 dark:bg-black dark:text-white min-h-screen antialiased">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
