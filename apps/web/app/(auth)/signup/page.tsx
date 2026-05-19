'use client';
import { useSignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PulsoLogo } from '@/app/(app)/_components/PulsoLogo';
import { JapaneseAmbient } from '@/app/(app)/_components/JapaneseAmbient';

export default function SignupPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true); setError('');
    try {
      await signUp.create({ emailAddress: email, password, firstName: name });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? 'Error al crear cuenta');
    } finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError('Código incorrecto');
    } finally { setLoading(false); }
  }

  const inputStyle = {
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    color: 'var(--text)',
  } as React.CSSProperties;

  const labelStyle = "text-[10px] uppercase tracking-[2px] font-bold block";
  const labelColorStyle = { color: 'var(--muted)' };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* ════ Ambient japonés ════ */}
      <JapaneseAmbient variant="sun" opacity={0.18} position="top-right" color="#9E1818" />
      <JapaneseAmbient variant="waves" opacity={0.10} color="#9E1818" />
      <JapaneseAmbient variant="fuji" opacity={0.08} color="#1A1814" />

      <div className="w-full max-w-md space-y-8 relative" style={{ zIndex: 10 }}>
        {/* HERO */}
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
              {step === 'form' ? 'Crea tu cuenta · gratis' : 'Verifica tu email'}
            </p>
          </div>
        </div>

        {/* FORM o VERIFY */}
        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="card p-6 sm:p-7 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className={labelStyle} style={labelColorStyle}>Nombre</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="given-name"
                className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none"
                style={inputStyle}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className={labelStyle} style={labelColorStyle}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none"
                style={inputStyle}
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className={labelStyle} style={labelColorStyle}>Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none"
                style={inputStyle}
                placeholder="Mínimo 8 caracteres"
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
              {loading ? '⏳ CREANDO...' : 'CREAR CUENTA · GRATIS'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="card p-6 sm:p-7 space-y-4">
            <p className="text-sm text-center" style={{ color: 'var(--text-dim)' }}>
              Enviamos un código a <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>
            <div className="space-y-1.5">
              <label htmlFor="code" className={labelStyle} style={labelColorStyle}>Código de 6 dígitos</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                autoComplete="one-time-code"
                className="w-full rounded-xl px-4 py-3 text-center transition-colors focus:outline-none font-display"
                style={{
                  ...inputStyle,
                  fontSize: 28,
                  letterSpacing: '0.4em',
                  fontWeight: 800,
                }}
                placeholder="000000"
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
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ fontSize: '15px', minHeight: 52 }}
            >
              {loading ? '⏳ VERIFICANDO...' : 'VERIFICAR Y CONTINUAR →'}
            </button>
          </form>
        )}

        <p
          className="text-center text-sm uppercase tracking-[2px] font-semibold"
          style={{ color: 'var(--muted)' }}
        >
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
