import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PulsoLogo } from '../_components/PulsoLogo';
import { JapaneseAmbient } from '../_components/JapaneseAmbient';

export default async function BrandPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Hero con ambient japonés */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Poster japonés cinematográfico */}
        <JapaneseAmbient variant="bonsai" opacity={0.28} position="top-right" color="#9E1818" />
        <JapaneseAmbient variant="kanji" opacity={0.08} color="#1A1814" />
        <div
          className="deco-text"
          style={{
            fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
            fontWeight: 700,
            position: 'relative',
            zIndex: 1,
          }}
        >
          富士
        </div>
        <div className="page-hero-content max-w-4xl relative" style={{ zIndex: 2 }}>
          <div className="page-hero-tag">⚡ IDENTIDAD VISUAL</div>
          <h1>
            <span style={{ color: 'var(--text)' }}>LOGO</span>{' '}
            <span style={{ color: 'var(--accent)' }}>PULSO</span>
          </h1>
          <p className="text-sm sm:text-base mt-4 max-w-2xl" style={{ color: 'var(--text-dim)' }}>
            Inspirado en el <strong>Monte Fuji (富士山)</strong> con el <strong>sol naciente (日の出)</strong> —
            el motivo más icónico de Japón. La montaña es el camino. El sol es la energía.
            El kanji <strong style={{ color: 'var(--accent)' }}>力</strong> (chikara) significa <em>fuerza</em>.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7 space-y-6 sm:space-y-8">

        {/* CONCEPTO */}
        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>FILOSOFÍA</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-5" style={{ color: 'var(--muted)' }}>3 capas de significado</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div
                className="text-3xl"
                style={{
                  color: 'var(--accent)',
                  fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
                  fontWeight: 700,
                }}
              >
                富士山
              </div>
              <h3 className="font-display text-sm" style={{ letterSpacing: '0.5px' }}>FUJI-SAN · EL CAMINO</h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-dim)' }}>
                La montaña sagrada. Símbolo de disciplina, esfuerzo y la cumbre como recompensa.
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="text-3xl"
                style={{
                  color: 'var(--accent)',
                  fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
                  fontWeight: 700,
                }}
              >
                日の出
              </div>
              <h3 className="font-display text-sm" style={{ letterSpacing: '0.5px' }}>HI-NO-DE · SOL NACIENTE</h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-dim)' }}>
                Cada día empieza con energía nueva. El sol amarillo es tu pulso al despertar.
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="text-3xl"
                style={{
                  color: 'var(--accent)',
                  fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
                  fontWeight: 700,
                }}
              >
                力
              </div>
              <h3 className="font-display text-sm" style={{ letterSpacing: '0.5px' }}>CHIKARA · FUERZA</h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-dim)' }}>
                Dos trazos · una idea. El acto disciplinado de entrenar tu cuerpo y mente.
              </p>
            </div>
          </div>
        </section>

        {/* PRIMARY — LOGO FULL */}
        <section>
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>LOGO PRINCIPAL</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
            Marca + Wordmark · uso primario
          </p>
          <div className="card p-10 sm:p-16 flex items-center justify-center" style={{ minHeight: 200 }}>
            <PulsoLogo variant="full" size={80} mountainColor="#F0F0F0" sunColor="#E8FF47" textColor="#F0F0F0" />
          </div>
        </section>

        {/* MARK ONLY */}
        <section>
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>SOLO MARCA</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
            App icon · favicon · espacios reducidos
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="card aspect-square flex items-center justify-center">
              <PulsoLogo variant="mark" size={80} mountainColor="#F0F0F0" sunColor="#E8FF47" />
            </div>
            <div className="card aspect-square flex items-center justify-center" style={{ background: '#fff', borderColor: '#fff' }}>
              <PulsoLogo variant="mark" size={80} mountainColor="#0d0d0d" sunColor="#FF6B35" />
            </div>
            <div className="aspect-square flex items-center justify-center rounded-2xl" style={{ background: 'var(--accent)' }}>
              <PulsoLogo variant="mark" size={80} mountainColor="#0d0d0d" sunColor="#0d0d0d" />
            </div>
          </div>
        </section>

        {/* WORDMARK */}
        <section>
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>WORDMARK</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>
            Solo texto · Barlow Condensed Black 900
          </p>
          <div className="card p-10 sm:p-16 flex items-center justify-center" style={{ minHeight: 160 }}>
            <PulsoLogo variant="wordmark" size={120} textColor="#F0F0F0" />
          </div>
        </section>

        {/* PALETTE */}
        <section>
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>PALETA</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>Colores oficiales</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'BG SUMI', code: '#0D0D0D', desc: 'Tinta sumi-e' },
              { name: 'ENSO', code: '#F0F0F0', desc: 'Papel washi' },
              { name: 'KI', code: '#E8FF47', desc: 'Pulso · energía' },
              { name: 'TORII', code: '#FF6B35', desc: 'Acento · acción' },
            ].map((c) => (
              <div key={c.name} className="card overflow-hidden">
                <div style={{ background: c.code, height: 80 }} aria-hidden />
                <div className="p-3">
                  <p className="font-display text-sm" style={{ letterSpacing: '0.5px' }}>{c.name}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>{c.code}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--muted)' }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* USAGE */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-base sm:text-lg mb-1" style={{ letterSpacing: '1px' }}>USO</h2>
          <p className="text-[10px] uppercase tracking-[2px] font-semibold mb-4" style={{ color: 'var(--muted)' }}>Reglas básicas</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><span style={{ color: 'var(--accent)' }}>✓</span> Mantén el área de aire alrededor: mínimo 50% del tamaño del enso</li>
            <li className="flex gap-3"><span style={{ color: 'var(--accent)' }}>✓</span> Usa sobre fondos oscuros con enso blanco, o fondos claros con enso negro</li>
            <li className="flex gap-3"><span style={{ color: 'var(--accent)' }}>✓</span> La línea de pulso siempre en accent yellow (#E8FF47)</li>
            <li className="flex gap-3"><span style={{ color: 'var(--danger)' }}>✗</span> No rotes, distorsiones ni cambies las proporciones</li>
            <li className="flex gap-3"><span style={{ color: 'var(--danger)' }}>✗</span> No uses sobre fondos con bajo contraste</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
