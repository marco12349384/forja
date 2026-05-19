/**
 * PulsoLogo — Logo oficial de PULSO
 *
 * Concepto: 富士山 (Fuji-san) + 日の出 (hi-no-de, sol naciente)
 * - Monte Fuji = el camino, la cumbre, la disciplina
 * - Sol naciente = energía, nuevo día, el latido (pulso) del despertar
 *
 * Inspirado en la estética minimalista japonesa: Hokusai, Muji, Issey Miyake.
 *
 * Variantes:
 *   - "mark"     → solo el símbolo (Fuji + sol). Cuadrado.
 *   - "full"     → símbolo + wordmark PULSO + furigana 力 (chikara/strength)
 *   - "wordmark" → solo el texto PULSO
 */

interface Props {
  variant?: 'mark' | 'full' | 'wordmark';
  size?: number;
  /** Color del Fuji (montaña). Default: blanco */
  mountainColor?: string;
  /** Color del sol. Default: accent yellow */
  sunColor?: string;
  /** Color del wordmark. Default: blanco */
  textColor?: string;
  /** Mostrar kanji 力 al lado del wordmark */
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
  // ── MARK SVG (Fuji + sol) ─────────────────────────────────────
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
      {/* Sol naciente — círculo arriba-derecha (rising sun) */}
      <circle
        cx="68"
        cy="28"
        r="13"
        fill={sunColor}
      />

      {/* Monte Fuji — silueta con pico nevado estilizado */}
      <path
        d="M 8 85
           L 38 38
           L 44 46
           L 48 41
           L 52 41
           L 56 46
           L 62 38
           L 92 85
           Z"
        fill={mountainColor}
      />

      {/* Línea de horizonte / base sutil (opcional) */}
      <line x1="6" y1="86" x2="94" y2="86" stroke={mountainColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
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

  // Japanese kanji — 力 (chikara = strength/power)
  const Kanji = showKanji && (
    <span
      style={{
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        color: typeof sunColor === 'string' && sunColor.startsWith('var(') ? 'var(--accent)' : sunColor,
        lineHeight: 1,
        fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
        opacity: 0.9,
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.22 }}
    >
      {Mark}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: size * 0.16 }}>
        {Wordmark}
        {Kanji}
      </span>
    </span>
  );
}
