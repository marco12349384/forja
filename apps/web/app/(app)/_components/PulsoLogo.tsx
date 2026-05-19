/**
 * PulsoLogo — Logo oficial de PULSO
 *
 * Concepto refinado: 富士山 (Fuji-san) + 日の出 (hi-no-de, sol naciente)
 * El sol está parcialmente detrás del Monte Fuji — efecto cinematográfico de amanecer.
 *
 * Variantes:
 *   - "mark"     → solo el símbolo. Cuadrado.
 *   - "full"     → símbolo + wordmark PULSO + kanji 力 (chikara/strength)
 *   - "wordmark" → solo el texto PULSO
 */

interface Props {
  variant?: 'mark' | 'full' | 'wordmark';
  size?: number;
  mountainColor?: string;
  sunColor?: string;
  textColor?: string;
  showKanji?: boolean;
  className?: string;
}

export function PulsoLogo({
  variant = 'full',
  size = 40,
  mountainColor = 'currentColor',
  sunColor = 'var(--accent)',
  textColor = 'currentColor',
  showKanji = true,
  className,
}: Props) {
  // ── MARK SVG (Fuji + sol naciente, sol detrás de la montaña) ──
  const Mark = (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
      role="img"
      aria-label="PULSO — Monte Fuji con sol naciente"
    >
      {/* Sol naciente — grande, posición central-alta. El Fuji lo cubre parcialmente. */}
      <circle
        cx="55"
        cy="38"
        r="20"
        fill={sunColor}
      />

      {/* Monte Fuji — silueta elegante con snow cap sutil de 5 puntos */}
      <path
        d="M 8 84
           L 40 34
           L 44 39
           L 48 36
           L 52 39
           L 56 36
           L 60 34
           L 92 84
           Z"
        fill={mountainColor}
      />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={className}>{Mark}</span>;
  }

  // ── WORDMARK ─────────────────────────────────────────────────
  const wordmarkSize = Math.round(size * 0.6);
  const Wordmark = (
    <span
      className="font-display"
      style={{
        fontSize: wordmarkSize,
        fontWeight: 900,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: textColor,
        lineHeight: 1,
      }}
    >
      PULSO
    </span>
  );

  // Kanji 力 (chikara · fuerza) — más sutil, integrado como acento
  const Kanji = showKanji && (
    <span
      style={{
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        color: typeof sunColor === 'string' && sunColor.startsWith('var(') ? 'var(--accent)' : sunColor,
        lineHeight: 1,
        fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
        opacity: 0.85,
        marginLeft: '-2px',
      }}
      aria-hidden
      title="力 chikara · fuerza"
    >
      力
    </span>
  );

  if (variant === 'wordmark') {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'baseline', gap: size * 0.18 }}>
        {Wordmark}
        {Kanji}
      </span>
    );
  }

  // ── FULL (mark + wordmark + kanji) ───────────────────────────
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.24 }}
    >
      {Mark}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: size * 0.15 }}>
        {Wordmark}
        {Kanji}
      </span>
    </span>
  );
}
