'use client';
import { useSignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const { signUp, isLoaded } = useSignUp();
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
      if (result.status === 'complete') router.push('/onboarding');
    } catch (err: any) {
      setError('Código incorrecto');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-5xl mb-2">⚒️</p>
          <p className="text-3xl font-bold">Forja</p>
          <p className="text-zinc-400 mt-1">{step === 'form' ? 'Crea tu cuenta gratis' : 'Verifica tu email'}</p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="Tu nombre" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="tu@email.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading || !isLoaded}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {loading ? 'Creando cuenta...' : 'Crear cuenta — Es gratis'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-zinc-400 text-sm text-center">Enviamos un código a <strong className="text-white">{email}</strong></p>
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Código de verificación</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-center text-2xl tracking-widest"
                placeholder="000000" maxLength={6} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {loading ? 'Verificando...' : 'Verificar y continuar →'}
            </button>
          </form>
        )}

        <p className="text-center text-zinc-400 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-orange-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
