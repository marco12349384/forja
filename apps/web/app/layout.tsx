import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forja — Forja tu cuerpo',
  description: 'Tu app de fitness con coach IA personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="bg-black text-white min-h-screen antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
