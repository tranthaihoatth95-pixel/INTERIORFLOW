'use client';

/**
 * components/intro/svgs/index.tsx — SVG stylized assets cho Intro Sequence.
 * Tất cả tự vẽ, KHÔNG emoji, KHÔNG asset ngoài. Isometric 30° hint qua transform.
 * Palette: cam #F06020, navy #002850, beige #F1ECE3, ink #1B1512, cool gray #6b7280.
 */

const ORANGE = '#F06020';
const NAVY = '#002850';
const BEIGE = '#F1ECE3';
const INK = '#1B1512';
const COOL = '#6b7280';

interface IconProps {
  size?: number;
  tinted?: boolean; // Cảnh 1: xám lạnh
}

export function Desk({ size = 200, tinted }: IconProps) {
  const wood = tinted ? COOL : '#8b6a4a';
  const wood2 = tinted ? '#4b5058' : '#5a4530';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="desk-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wood} />
          <stop offset="1" stopColor={wood2} />
        </linearGradient>
        <filter id="desk-shadow"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      {/* shadow */}
      <ellipse cx="100" cy="170" rx="70" ry="6" fill={INK} opacity="0.2" filter="url(#desk-shadow)" />
      {/* top isometric */}
      <path d="M40 100 L100 70 L180 90 L120 120 Z" fill="url(#desk-top)" stroke={INK} strokeWidth="1" />
      {/* front edge */}
      <path d="M40 100 L120 120 L120 135 L40 115 Z" fill={wood2} stroke={INK} strokeWidth="1" />
      {/* legs */}
      <rect x="48" y="115" width="4" height="45" fill={wood2} />
      <rect x="110" y="130" width="4" height="45" fill={wood2} />
    </svg>
  );
}

export function Monitor({ size = 200, tinted }: IconProps) {
  const c = tinted ? COOL : NAVY;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mon-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tinted ? '#9ca3af' : '#004080'} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="30" y="40" width="140" height="90" rx="4" fill="url(#mon-screen)" stroke={INK} strokeWidth="1.5" />
      {/* Reflection */}
      <path d="M35 45 L80 45 L60 90 L35 70 Z" fill="#fff" opacity="0.08" />
      {/* stand */}
      <rect x="90" y="130" width="20" height="18" fill={INK} opacity="0.7" />
      <rect x="60" y="148" width="80" height="6" rx="2" fill={INK} opacity="0.85" />
      {/* screen content: grid hint */}
      <g stroke="#fff" strokeWidth="0.4" opacity="0.35" fill="none">
        <line x1="45" y1="60" x2="155" y2="60" />
        <line x1="45" y1="85" x2="155" y2="85" />
        <line x1="45" y1="110" x2="155" y2="110" />
        <line x1="80" y1="50" x2="80" y2="125" />
        <line x1="120" y1="50" x2="120" y2="125" />
      </g>
    </svg>
  );
}

export function Blueprint({ size = 200, tinted }: IconProps) {
  const paper = tinted ? '#d1d5db' : BEIGE;
  const line = tinted ? '#6b7280' : NAVY;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="30" width="140" height="140" rx="2" fill={paper} stroke={INK} strokeWidth="1" />
      {/* grid */}
      <g stroke={line} strokeWidth="0.3" opacity="0.4">
        {[...Array(13)].map((_, i) => (
          <line key={`h${i}`} x1="35" y1={35 + i * 10} x2="165" y2={35 + i * 10} />
        ))}
        {[...Array(13)].map((_, i) => (
          <line key={`v${i}`} x1={35 + i * 10} y1="35" x2={35 + i * 10} y2="165" />
        ))}
      </g>
      {/* floor plan lines */}
      <path
        d="M55 55 L145 55 L145 100 L110 100 L110 140 L55 140 Z"
        fill="none"
        stroke={line}
        strokeWidth="2"
      />
      <line x1="55" y1="100" x2="90" y2="100" stroke={line} strokeWidth="2" />
      <circle cx="110" cy="100" r="3" fill={line} />
    </svg>
  );
}

export function Ruler({ size = 200, tinted }: IconProps) {
  const c = tinted ? COOL : ORANGE;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-15 100 100)">
        <rect x="20" y="90" width="160" height="20" rx="1" fill={c} stroke={INK} strokeWidth="1" />
        {[...Array(16)].map((_, i) => (
          <line
            key={i}
            x1={25 + i * 10}
            y1="90"
            x2={25 + i * 10}
            y2={i % 5 === 0 ? '102' : '96'}
            stroke={INK}
            strokeWidth="0.8"
          />
        ))}
      </g>
    </svg>
  );
}

export function Mouse({ size = 200, tinted }: IconProps) {
  const c = tinted ? COOL : '#333';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="110" rx="35" ry="55" fill={c} stroke={INK} strokeWidth="1" />
      <line x1="100" y1="60" x2="100" y2="105" stroke={INK} strokeWidth="1" />
      <circle cx="100" cy="80" r="4" fill="#fff" opacity="0.3" />
    </svg>
  );
}

export function Clock({ size = 200, tinted }: IconProps) {
  const face = tinted ? '#d1d5db' : BEIGE;
  const c = tinted ? COOL : NAVY;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="60" fill={face} stroke={INK} strokeWidth="2" />
      {[0, 3, 6, 9].map((h) => {
        const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={h}
            cx={100 + Math.cos(angle) * 50}
            cy={100 + Math.sin(angle) * 50}
            r="2"
            fill={INK}
          />
        );
      })}
      <line x1="100" y1="100" x2="100" y2="65" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="100" x2="130" y2="100" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="100" r="3" fill={ORANGE} />
    </svg>
  );
}

export function Pencil({ size = 200, tinted }: IconProps) {
  const wood = tinted ? COOL : '#d4a574';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(35 100 100)">
        <rect x="30" y="90" width="130" height="20" fill={wood} stroke={INK} strokeWidth="1" />
        <rect x="150" y="90" width="12" height="20" fill="#F0C060" />
        <polygon points="30,90 15,100 30,110" fill={INK} />
        <rect x="30" y="90" width="8" height="20" fill="#fff" opacity="0.3" />
      </g>
    </svg>
  );
}

export function Architect({ size = 200 }: IconProps) {
  // Chibi KTS — dùng lại phong cách của AvatarRenderer nhưng inline nhỏ gọn.
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="arch-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E0A87E" />
          <stop offset="1" stopColor="#B8875C" />
        </linearGradient>
        <linearGradient id="arch-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={NAVY} />
          <stop offset="1" stopColor="#001830" />
        </linearGradient>
      </defs>
      {/* body/overalls */}
      <path d="M55 280 L55 180 Q100 165 145 180 L145 280 Z" fill="url(#arch-shirt)" stroke={INK} strokeWidth="1" />
      {/* pocket */}
      <rect x="115" y="200" width="20" height="24" rx="1" fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.7" />
      {/* neck */}
      <path d="M85 175 L85 190 L115 190 L115 175 Z" fill="url(#arch-skin)" />
      {/* head */}
      <ellipse cx="100" cy="130" rx="48" ry="55" fill="url(#arch-skin)" stroke={INK} strokeWidth="1" />
      {/* hair pixel cạo */}
      <path d="M56 115 Q60 75 100 72 Q140 75 144 115 Q135 100 100 100 Q65 100 56 115 Z" fill={INK} />
      {/* eyes */}
      <circle cx="82" cy="130" r="3" fill={INK} />
      <circle cx="118" cy="130" r="3" fill={INK} />
      {/* smile */}
      <path d="M88 160 Q100 168 112 160" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      {/* pencil in hand */}
      <g transform="rotate(20 155 240)">
        <rect x="130" y="238" width="35" height="4" fill="#d4a574" stroke={INK} strokeWidth="0.5" />
        <polygon points="130,238 124,240 130,242" fill={INK} />
      </g>
      {/* shadow */}
      <ellipse cx="100" cy="278" rx="45" ry="3" fill={INK} opacity="0.2" />
    </svg>
  );
}

export function LogoIF({ size = 240 }: { size?: number }) {
  return (
    <svg width={size} height={size / 3} viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
      {/* hairline frame */}
      <rect x="4" y="14" width="232" height="52" fill="none" stroke={INK} strokeWidth="1" />
      <text
        x="120"
        y="50"
        textAnchor="middle"
        fontFamily="Archivo, system-ui, sans-serif"
        fontSize="24"
        fontWeight="500"
        letterSpacing="4"
        fill={NAVY}
      >
        INTERIORFLOW
      </text>
      <line x1="60" y1="58" x2="180" y2="58" stroke={ORANGE} strokeWidth="1.5" />
    </svg>
  );
}

export function WaveFlow({ size = 400 }: { size?: number }) {
  return (
    <svg width={size} height={size / 4} viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 50 Q80 20 140 50 T260 50 T380 50"
        fill="none"
        stroke={ORANGE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="50" r="4" fill={ORANGE} />
      <circle cx="200" cy="50" r="4" fill={ORANGE} />
      <circle cx="380" cy="50" r="4" fill={ORANGE} />
    </svg>
  );
}

export function VitalsDrop({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="drop-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor={ORANGE} stopOpacity="0.7" />
          <stop offset="1" stopColor={NAVY} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M20 4 Q8 24 8 38 Q8 50 20 52 Q32 50 32 38 Q32 24 20 4 Z" fill="url(#drop-g)" stroke={ORANGE} strokeWidth="0.8" />
      <ellipse cx="16" cy="20" rx="4" ry="8" fill="#fff" opacity="0.5" />
    </svg>
  );
}
