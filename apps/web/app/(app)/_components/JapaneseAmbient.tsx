/**
 * JapaneseAmbient — Fondo ambient animado estilo ukiyo-e
 *
 * Variantes inspiradas en posters japoneses tradicionales:
 *   - "sun"      → Sol rojo gigante pulsando lentamente (esquina superior)
 *   - "waves"    → Patrón seigaiha (青海波) de olas con drift horizontal sutil
 *   - "fuji"     → Silueta de Monte Fuji al fondo
 *   - "bonsai"   → Silueta de árbol bonsai con sol detrás
 *   - "combo"    → Sol + ondas (más completo)
 *
 * Todos respetan prefers-reduced-motion automáticamente (vía CSS global).
 */

interface Props {
  variant?: 'sun' | 'waves' | 'fuji' | 'bonsai' | 'combo';
  opacity?: number;
  position?: 'top-right' | 'top-left' | 'center' | 'bottom';
  /** Color principal del elemento (sol/silueta). Default: rojo akai */
  color?: string;
}

export function JapaneseAmbient({
  variant = 'sun',
  opacity = 0.16,
  position = 'top-right',
  color = '#9E1818',
}: Props) {
  // ── SOL pulsante ───────────────────────────────────────────────
  const SunElement = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...(position === 'top-right' && { top: '-15%', right: '-10%' }),
        ...(position === 'top-left' && { top: '-15%', left: '-10%' }),
        ...(position === 'center' && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
        ...(position === 'bottom' && { bottom: '-20%', right: '20%' }),
        width: 'clamp(200px, 35vw, 480px)',
        height: 'clamp(200px, 35vw, 480px)',
        borderRadius: '50%',
        background: `radial-gradient(circle at center, ${color} 0%, ${color} 55%, transparent 70%)`,
        opacity,
        animation: 'sun-pulse 8s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    />
  );

  // ── ONDAS SEIGAIHA con drift ───────────────────────────────────
  const WavesElement = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: '-10%',
        right: '-10%',
        height: '60%',
        opacity: opacity * 1.4,
        pointerEvents: 'none',
        animation: 'waves-drift 60s linear infinite',
      }}
    >
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="xMidYMax slice"
        style={{ width: '120%', height: '100%' }}
      >
        <defs>
          <pattern id="seigaiha" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="1.2" />
            <circle cx="0" cy="20" r="18" fill="none" stroke={color} strokeWidth="1.2" />
            <circle cx="40" cy="20" r="18" fill="none" stroke={color} strokeWidth="1.2" />
            <circle cx="20" cy="20" r="12" fill="none" stroke={color} strokeWidth="0.8" />
            <circle cx="0" cy="20" r="12" fill="none" stroke={color} strokeWidth="0.8" />
            <circle cx="40" cy="20" r="12" fill="none" stroke={color} strokeWidth="0.8" />
            <circle cx="20" cy="20" r="6" fill="none" stroke={color} strokeWidth="0.6" />
            <circle cx="0" cy="20" r="6" fill="none" stroke={color} strokeWidth="0.6" />
            <circle cx="40" cy="20" r="6" fill="none" stroke={color} strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#seigaiha)" />
      </svg>
    </div>
  );

  // ── FUJI silueta gigante al fondo ───────────────────────────────
  const FujiElement = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        right: '-5%',
        left: '-5%',
        height: '70%',
        opacity: opacity * 1.2,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" style={{ width: '110%', height: '100%' }}>
        <path
          d="M 0 200 L 130 50 L 145 65 L 158 55 L 170 60 L 182 50 L 200 30 L 218 50 L 230 60 L 242 55 L 255 65 L 270 50 L 400 200 Z"
          fill={color}
        />
      </svg>
    </div>
  );

  // ── BONSAI silueta ──────────────────────────────────────────────
  const BonsaiElement = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        right: '-5%',
        width: '60%',
        height: '85%',
        opacity: opacity * 1.5,
        pointerEvents: 'none',
        animation: 'bonsai-sway 12s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}
    >
      <svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%' }}>
        {/* Tronco */}
        <path
          d="M 100 240 C 95 200, 90 160, 100 120 C 105 100, 115 90, 125 85"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 100 180 C 75 170, 60 140, 50 110"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 110 130 C 130 120, 145 100, 150 80"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Hojas/follaje — círculos orgánicos */}
        <circle cx="50" cy="100" r="22" fill={color} />
        <circle cx="65" cy="85" r="18" fill={color} />
        <circle cx="120" cy="75" r="25" fill={color} />
        <circle cx="150" cy="65" r="20" fill={color} />
        <circle cx="100" cy="55" r="22" fill={color} />
        <circle cx="135" cy="50" r="16" fill={color} />
      </svg>
    </div>
  );

  // ── Decide qué renderizar ──────────────────────────────────────
  if (variant === 'sun') return <>{SunElement}<KeyframesStyle /></>;
  if (variant === 'waves') return <>{WavesElement}<KeyframesStyle /></>;
  if (variant === 'fuji') return <>{FujiElement}<KeyframesStyle /></>;
  if (variant === 'bonsai') return <>{SunElement}{BonsaiElement}<KeyframesStyle /></>;

  // combo: sun + waves
  return (
    <>
      {SunElement}
      {WavesElement}
      <KeyframesStyle />
    </>
  );
}

/** Inyecta keyframes CSS necesarios para las animaciones */
function KeyframesStyle() {
  return (
    <style>{`
      @keyframes sun-pulse {
        0%, 100% { transform: scale(1); opacity: var(--sun-opacity, 1); }
        50%      { transform: scale(1.05); opacity: calc(var(--sun-opacity, 1) * 1.15); }
      }
      @keyframes waves-drift {
        from { transform: translateX(0); }
        to   { transform: translateX(-40px); }
      }
      @keyframes bonsai-sway {
        0%, 100% { transform: rotate(0deg); }
        50%      { transform: rotate(0.6deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        [aria-hidden] {
          animation: none !important;
        }
      }
    `}</style>
  );
}
