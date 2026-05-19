'use client';
import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PulsoLogo } from '@/app/(app)/_components/PulsoLogo';
import { JapaneseAmbient } from '@/app/(app)/_components/JapaneseAmbient';

export default function LoginPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/home');
      }
    } catch (err: any) {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* ════ Poster japonés: sol gigante + kanji 力 atrás + torii silueta ════ */}
      <JapaneseAmbient variant="poster" opacity={0.35} color="#9E1818" />
      <JapaneseAmbient variant="waves" opacity={0.22} color="#1A1814" />

      <div className="w-full max-w-md space-y-8 relative" style={{ zIndex: 10 }}>
        {/* HERO: Logo + nombre */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <PulsoLogo
              variant="mark"
              size={100}
              mountainColor="var(--text)"
              sunColor="var(--accent)"
            />
          </div>
          <div>
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(48px, 12vw, 72px)',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                color: 'var(--text)',
              }}
            >
              PULSO
              <span
                style={{
                  fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  fontSize: '0.55em',
                  marginLeft: '0.25em',
                  verticalAlign: 'middle',
                }}
              >
                力
              </span>
            </h1>
            <p
              className="text-xs sm:text-sm mt-2 uppercase tracking-[3px] font-semibold"
              style={{ color: 'var(--muted)' }}
            >
              Tu socio · 富士山 · Sin excusas
            </p>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="card p-6 sm:p-7 space-y-4"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[10px] uppercase tracking-[2px] font-bold block"
              style={{ color: 'var(--muted)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none"
              style={{
                background: 'var(--surface2)',
                border: '1.5px solid var(--border)',
                color: 'var(--text)',
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-[10px] uppercase tracking-[2px] font-bold block"
              style={{ color: 'var(--muted)' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none"
              style={{
                background: 'var(--surface2)',
                border: '1.5px solid var(--border)',
                color: 'var(--text)',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg px-3 py-2 text-sm font-semibold"
              style={{
                background: 'rgba(158,24,24,0.10)',
                border: '1px solid rgba(158,24,24,0.3)',
                color: 'var(--accent2)',
              }}
            >
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isLoaded}
            className="btn btn-primary w-full"
            style={{ fontSize: '15px', minHeight: 52 }}
          >
            {loading ? '⏳ ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        {/* SIGN UP LINK */}
        <p
          className="text-center text-sm uppercase tracking-[2px] font-semibold"
          style={{ color: 'var(--muted)' }}
        >
          ¿Sin cuenta?{' '}
          <Link
            href="/signup"
            className="font-bold transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
