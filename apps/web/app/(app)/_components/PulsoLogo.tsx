/**
 * PulsoLogo — Logo oficial de PULSO
 *
 * Concepto: ENSO (円相) — círculo zen japonés, dibujado en una sola exhalación.
 * Una línea de pulso (heartbeat ECG) lo atraviesa: balance entre meditación y acción.
 *
 * Variantes:
 *   - "mark"     → solo el símbolo (enso + pulse). Cuadrado.
 *   - "full"     → símbolo + wordmark PULSO. Horizontal.
 *   - "wordmark" → solo el texto PULSO.
 */

interface Props {
  variant?: 'mark' | 'full' | 'wordmark';
  size?: number;
  /** Color del enso (círculo). Default: blanco */
  ringColor?: string;
  /** Color de la línea de pulso. Default: accent amarillo */
  pulseColor?: string;
  /** Color del wordmark. Default: blanco */
  textColor?: string;
  className?: string;
}

export function PulsoLogo({
  variant = 'full',
  size = 40,
  ringColor = 'currentColor',
  pulseColor = 'var(--accent)',
  textColor = 'currentColor',
  className,
}: Props) {
  // ── MARK SVG (Enso + pulse) ──────────────────────────────────────
  const Mark = (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
      role="img"
      aria-label="PULSO"
    >
      {/* Enso (zen circle) — abierto arriba-derecha al estilo tradicional */}
      <path
        d="M 72 12 A 42 42 0 1 0 87 47"
        fill="none"
        stroke={ringColor}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pulse line — ECG cruzando horizontalmente */}
      <path
        d="M 14 50 L 30 50 L 36 40 L 44 62 L 50 50 L 86 50"
        fill="none"
        stroke={pulseColor}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={className}>{Mark}</span>;
  }

  // ── WORDMARK ───────────────────────────────────────────────────
  const wordmarkSize = Math.round(size * 0.6); // proportional
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
        // Subtle text effect — wordmark feels carved
      }}
    >
      PULSO
    </span>
  );

  if (variant === 'wordmark') {
    return <span className={className}>{Wordmark}</span>;
  }

  // ── FULL (mark + wordmark) ─────────────────────────────────────
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.2 }}
    >
      {Mark}
      {Wordmark}
    </span>
  );
}
