/**
 * JapaneseAmbient — Fondo ambient animado estilo ukiyo-e (poster japonés)
 *
 * Inspirado en posters tradicionales con sol rojo gigante, torii, caligrafía,
 * Fuji silueta, ondas seigaiha, bonsai.
 *
 * Variantes:
 *   - "sun"      → Sol rojo gigante (visible, no tímido)
 *   - "waves"    → Patrón seigaiha 青海波 más visible
 *   - "fuji"     → Silueta de Monte Fuji al fondo
 *   - "torii"    → Puerta torii 鳥居 silueta (estilo poster)
 *   - "kanji"    → Caligrafía kanji 力 enorme al fondo
 *   - "bonsai"   → Sol + árbol bonsai
 *   - "poster"   → Combinación cinematográfica (sol gigante + torii + kanji)
 *   - "combo"    → Sol + ondas (clásico)
 */

interface Props {
  variant?: 'sun' | 'waves' | 'fuji' | 'torii' | 'kanji' | 'bonsai' | 'poster' | 'combo';
  opacity?: number;
  position?: 'top-right' | 'top-left' | 'center' | 'bottom';
  /** Color principal del elemento. Default: rojo akai */
  color?: string;
}

export function JapaneseAmbient({
  variant = 'sun',
  opacity = 0.32,
  position = 'top-right',
  color = '#9E1818',
}: Props) {
  // ── SOL gigante pulsante ───────────────────────────────────────
  const Sun = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...(position === 'top-right' && { top: '-8%', right: '-5%' }),
        ...(position === 'top-left' && { top: '-8%', left: '-5%' }),
        ...(position === 'center' && { top: '-5%', left: '50%', transform: 'translateX(-50%)' }),
        ...(position === 'bottom' && { bottom: '-15%', right: '20%' }),
        width: 'clamp(280px, 50vw, 640px)',
        height: 'clamp(280px, 50vw, 640px)',
        borderRadius: '50%',
        background: `radial-gradient(circle at center, ${color} 0%, ${color} 60%, transparent 72%)`,
        opacity,
        animation: 'sun-pulse 7s ease-in-out infinite',
        pointerEvents: 'none',
        filter: 'blur(0.5px)',
      }}
    />
  );

  // ── ONDAS SEIGAIHA más visibles ────────────────────────────────
  const Waves = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: '-10%',
        right: '-10%',
        height: '45%',
        opacity: opacity * 0.9,
        pointerEvents: 'none',
        animation: 'waves-drift 45s linear infinite',
      }}
    >
      <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" style={{ width: '120%', height: '100%' }}>
        <defs>
          <pattern id="seigaiha" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
            <circle cx="24" cy="24" r="22" fill="none" stroke={color} strokeWidth="1.8" />
            <circle cx="0" cy="24" r="22" fill="none" stroke={color} strokeWidth="1.8" />
            <circle cx="48" cy="24" r="22" fill="none" stroke={color} strokeWidth="1.8" />
            <circle cx="24" cy="24" r="14" fill="none" stroke={color} strokeWidth="1.4" />
            <circle cx="0" cy="24" r="14" fill="none" stroke={color} strokeWidth="1.4" />
            <circle cx="48" cy="24" r="14" fill="none" stroke={color} strokeWidth="1.4" />
            <circle cx="24" cy="24" r="6" fill="none" stroke={color} strokeWidth="1" />
            <circle cx="0" cy="24" r="6" fill="none" stroke={color} strokeWidth="1" />
            <circle cx="48" cy="24" r="6" fill="none" stroke={color} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#seigaiha)" />
      </svg>
    </div>
  );

  // ── FUJI silueta gigante ────────────────────────────────────────
  const Fuji = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        right: '-5%',
        left: '-5%',
        height: '60%',
        opacity: opacity * 1.4,
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

  // ── TORII 鳥居 puerta sagrada (silueta) ─────────────────────────
  const Torii = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'clamp(280px, 65vw, 560px)',
        height: 'clamp(220px, 50vw, 420px)',
        opacity: opacity * 1.5,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 300 240" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%' }}>
        {/* Top kasagi (cap beam) — curved upward at edges */}
        <path
          d="M 30 38
             Q 30 18, 50 18
             L 250 18
             Q 270 18, 270 38
             L 260 50
             L 40 50 Z"
          fill="#1A1814"
        />
        {/* Shimaki (second beam) */}
        <rect x="55" y="58" width="190" height="14" fill="#1A1814" />
        {/* Right pillar */}
        <path d="M 215 72 L 232 72 L 240 235 L 207 235 Z" fill="#1A1814" />
        {/* Left pillar */}
        <path d="M 68 72 L 85 72 L 93 235 L 60 235 Z" fill="#1A1814" />
        {/* Bottom horizontal beam (nuki) */}
        <rect x="78" y="92" width="144" height="9" fill="#1A1814" />
        {/* Small center plaque */}
        <rect x="135" y="56" width="30" height="22" fill="#1A1814" />
      </svg>
    </div>
  );

  // ── KANJI 力 enorme al fondo (poster style) ─────────────────────
  const Kanji = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
        fontWeight: 900,
        fontSize: 'clamp(280px, 60vw, 720px)',
        lineHeight: 1,
        color: '#1A1814',
        opacity: opacity * 0.55,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      力
    </div>
  );

  // ── BONSAI silueta ──────────────────────────────────────────────
  const Bonsai = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        right: '-5%',
        width: '55%',
        height: '85%',
        opacity: opacity * 1.5,
        pointerEvents: 'none',
        animation: 'bonsai-sway 12s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}
    >
      <svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%' }}>
        <path d="M 100 240 C 95 200, 90 160, 100 120 C 105 100, 115 90, 125 85" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M 100 180 C 75 170, 60 140, 50 110" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d="M 110 130 C 130 120, 145 100, 150 80" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="100" r="22" fill={color} />
        <circle cx="65" cy="85" r="18" fill={color} />
        <circle cx="120" cy="75" r="25" fill={color} />
        <circle cx="150" cy="65" r="20" fill={color} />
        <circle cx="100" cy="55" r="22" fill={color} />
        <circle cx="135" cy="50" r="16" fill={color} />
      </svg>
    </div>
  );

  // ── Render según variante ──────────────────────────────────────
  let content: React.ReactNode = null;
  if (variant === 'sun') content = Sun;
  else if (variant === 'waves') content = Waves;
  else if (variant === 'fuji') content = Fuji;
  else if (variant === 'torii') content = Torii;
  else if (variant === 'kanji') content = Kanji;
  else if (variant === 'bonsai') content = <>{Sun}{Bonsai}</>;
  else if (variant === 'combo') content = <>{Sun}{Waves}</>;
  else if (variant === 'poster') content = <>{Kanji}{Sun}{Torii}</>;

  return (
    <>
      {content}
      <KeyframesStyle />
    </>
  );
}

function KeyframesStyle() {
  return (
    <style>{`
      @keyframes sun-pulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.04); }
      }
      @keyframes waves-drift {
        from { transform: translateX(0); }
        to   { transform: translateX(-48px); }
      }
      @keyframes bonsai-sway {
        0%, 100% { transform: rotate(0deg); }
        50%      { transform: rotate(0.6deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        [aria-hidden] { animation: none !important; }
      }
    `}</style>
  );
}
