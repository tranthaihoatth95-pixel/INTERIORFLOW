'use client';

/**
 * AvatarRenderer — SVG portrait bust 200x240, Pixar-stylized. Circle frame hairline
 * bên ngoài. Layer: circle bg → shoulders/shirt → head → face features → hair → hat → glasses.
 *
 * Không dùng ảnh ngoài, không webfont, hoàn toàn SVG path. Gradient nhẹ cho depth
 * (kính cửa sổ + shadow). Palette lấy từ lib/avatar.ts.
 */

import { useId } from 'react';
import {
  AvatarConfig,
  BASE_TONES,
  HAIR_COLORS,
  SHIRT_COLORS,
} from '@/lib/avatar';

interface Props {
  config: AvatarConfig;
  size?: number;
  frame?: boolean; // hairline circle frame
  className?: string;
}

export function AvatarRenderer({ config, size = 96, frame = true, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const skin = BASE_TONES[config.base];
  const hair = HAIR_COLORS[config.hairColor];
  const shirt = SHIRT_COLORS[config.shirtColor];
  // Đen viền và điểm mắt — dùng nâu đen cho stylized ấm.
  const ink = '#1B1512';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 200 240"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#FAF7F1" />
          <stop offset="100%" stopColor="#E8E1D3" />
        </radialGradient>
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin} />
          <stop offset="100%" stopColor={darken(skin, 0.15)} />
        </linearGradient>
        <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shirt} />
          <stop offset="100%" stopColor={darken(shirt, 0.2)} />
        </linearGradient>
        <clipPath id={`frame-${uid}`}>
          <circle cx="100" cy="120" r="96" />
        </clipPath>
      </defs>

      {/* Background circle bên trong frame */}
      <g clipPath={`url(#frame-${uid})`}>
        <circle cx="100" cy="120" r="96" fill={`url(#bg-${uid})`} />

        {/* Shoulders + shirt */}
        <ShirtShape shirt={config.shirt} fill={`url(#shirt-${uid})`} accent={darken(shirt, 0.35)} />

        {/* Neck */}
        <path d="M85 170 L85 190 L115 190 L115 170 Z" fill={`url(#skin-${uid})`} />

        {/* Head */}
        <ellipse cx="100" cy="115" rx="52" ry="58" fill={`url(#skin-${uid})`} />

        {/* Ears */}
        <ellipse cx="49" cy="118" rx="7" ry="12" fill={skin} />
        <ellipse cx="151" cy="118" rx="7" ry="12" fill={skin} />

        {/* Face features */}
        {/* Cheeks blush */}
        <ellipse cx="72" cy="130" rx="8" ry="5" fill={darken(skin, -0.1)} opacity="0.6" />
        <ellipse cx="128" cy="130" rx="8" ry="5" fill={darken(skin, -0.1)} opacity="0.6" />
        {/* Eyes */}
        <ellipse cx="82" cy="115" rx="3.5" ry="4.5" fill={ink} />
        <ellipse cx="118" cy="115" rx="3.5" ry="4.5" fill={ink} />
        <circle cx="83" cy="113.5" r="1.2" fill="#fff" />
        <circle cx="119" cy="113.5" r="1.2" fill="#fff" />
        {/* Nose (subtle) */}
        <path d="M100 122 Q98 132 100 138 Q102 132 100 122" fill="none" stroke={darken(skin, 0.25)} strokeWidth="1.2" strokeLinecap="round" />
        {/* Mouth — half smile */}
        <path d="M88 150 Q100 158 112 150" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />

        {/* Hair (behind hat) */}
        <HairShape hair={config.hair} fill={hair} accent={darken(hair, 0.25)} />

        {/* Glasses */}
        <GlassesShape glasses={config.glasses} />

        {/* Hat/headwear */}
        <HatShape hat={config.hat} accent="#002850" />
      </g>

      {/* Frame ring hairline */}
      {frame && (
        <circle cx="100" cy="120" r="96" fill="none" stroke="#1B1512" strokeWidth="1.2" opacity="0.85" />
      )}
    </svg>
  );
}

/* ─────────────────────── Sub-shapes ─────────────────────── */

function ShirtShape({ shirt, fill, accent }: { shirt: AvatarConfig['shirt']; fill: string; accent: string }) {
  // Base torso path chung, biến thể qua cổ áo / hood / lapel.
  const base = <path d="M20 240 L20 205 Q40 175 85 172 L115 172 Q160 175 180 205 L180 240 Z" fill={fill} />;
  switch (shirt) {
    case 'hoodie':
      return (
        <>
          {base}
          {/* Hood behind neck */}
          <path d="M60 185 Q100 155 140 185 Q140 175 130 168 Q100 158 70 168 Q60 175 60 185 Z" fill={accent} opacity="0.55" />
          {/* Drawstring */}
          <line x1="95" y1="188" x2="93" y2="210" stroke={accent} strokeWidth="1.5" />
          <line x1="105" y1="188" x2="107" y2="210" stroke={accent} strokeWidth="1.5" />
        </>
      );
    case 'blazer':
      return (
        <>
          {base}
          {/* Lapels */}
          <path d="M85 172 L75 240 L95 195 Z" fill={accent} opacity="0.5" />
          <path d="M115 172 L125 240 L105 195 Z" fill={accent} opacity="0.5" />
          <line x1="100" y1="195" x2="100" y2="240" stroke={accent} strokeWidth="1" opacity="0.4" />
        </>
      );
    case 'turtleneck':
      return (
        <>
          {base}
          <path d="M78 172 Q100 158 122 172 L122 185 Q100 178 78 185 Z" fill={fill} stroke={accent} strokeWidth="0.8" />
        </>
      );
    case 'sweater':
      return (
        <>
          {base}
          {/* Knit texture */}
          <g stroke={accent} strokeWidth="0.6" opacity="0.35" fill="none">
            <line x1="40" y1="210" x2="160" y2="210" />
            <line x1="40" y1="220" x2="160" y2="220" />
            <line x1="40" y1="230" x2="160" y2="230" />
          </g>
        </>
      );
    case 'dress':
      return (
        <>
          {base}
          {/* Collar */}
          <path d="M85 172 L100 195 L115 172 Z" fill="#fff" opacity="0.6" />
        </>
      );
    case 'tshirt':
    default:
      return base;
  }
}

function HairShape({ hair, fill, accent }: { hair: AvatarConfig['hair']; fill: string; accent: string }) {
  switch (hair) {
    case 1: // short crop
      return <path d="M52 105 Q60 60 100 55 Q140 60 148 105 Q140 90 100 88 Q60 90 52 105 Z" fill={fill} />;
    case 2: // buzz/pixel cạo
      return <path d="M55 100 Q60 70 100 65 Q140 70 145 100 Q135 88 100 87 Q65 88 55 100 Z" fill={fill} opacity="0.9" />;
    case 3: // side-swept
      return <path d="M50 108 Q55 55 100 55 Q160 55 150 108 Q145 75 100 68 Q80 68 65 90 Q58 100 50 108 Z" fill={fill} />;
    case 4: // long straight
      return <path d="M45 175 Q40 90 100 55 Q160 90 155 175 Q150 130 145 105 Q140 88 100 85 Q60 88 55 105 Q50 130 45 175 Z" fill={fill} />;
    case 5: // bob
      return <path d="M50 145 Q45 75 100 58 Q155 75 150 145 Q145 115 140 100 Q120 88 100 87 Q80 88 60 100 Q55 115 50 145 Z" fill={fill} />;
    case 6: // curly afro
      return (
        <>
          <ellipse cx="100" cy="80" rx="60" ry="35" fill={fill} />
          <circle cx="70" cy="95" r="14" fill={fill} />
          <circle cx="130" cy="95" r="14" fill={fill} />
          <circle cx="55" cy="115" r="12" fill={fill} />
          <circle cx="145" cy="115" r="12" fill={fill} />
        </>
      );
    case 7: // topknot / bun
      return (
        <>
          <path d="M55 105 Q60 75 100 68 Q140 75 145 105 Q135 92 100 90 Q65 92 55 105 Z" fill={fill} />
          <circle cx="100" cy="55" r="14" fill={fill} />
          <circle cx="100" cy="55" r="10" fill={accent} opacity="0.5" />
        </>
      );
    case 8: // undercut long top
      return (
        <>
          <path d="M62 115 Q55 70 100 55 Q145 70 138 115 Q120 85 100 82 Q80 85 62 115 Z" fill={fill} />
          <rect x="55" y="115" width="90" height="8" fill={accent} opacity="0.3" />
        </>
      );
    default:
      return null;
  }
}

function GlassesShape({ glasses }: { glasses: AvatarConfig['glasses'] }) {
  const stroke = '#1B1512';
  const bridge = <line x1="92" y1="118" x2="108" y2="118" stroke={stroke} strokeWidth="1.5" />;
  switch (glasses) {
    case 'round':
      return (
        <g fill="none" stroke={stroke} strokeWidth="1.8">
          <circle cx="82" cy="118" r="10" />
          <circle cx="118" cy="118" r="10" />
          {bridge}
        </g>
      );
    case 'square':
      return (
        <g fill="none" stroke={stroke} strokeWidth="1.8">
          <rect x="72" y="110" width="20" height="16" rx="1.5" />
          <rect x="108" y="110" width="20" height="16" rx="1.5" />
          {bridge}
        </g>
      );
    case 'aviator':
      return (
        <g fill="none" stroke={stroke} strokeWidth="1.6">
          <path d="M72 112 Q72 126 82 128 Q92 126 92 112 Z" />
          <path d="M108 112 Q108 126 118 128 Q128 126 128 112 Z" />
          {bridge}
        </g>
      );
    case 'rimless':
      return (
        <g fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.6">
          <ellipse cx="82" cy="118" rx="10" ry="7" />
          <ellipse cx="118" cy="118" rx="10" ry="7" />
        </g>
      );
    case 'cateye':
      return (
        <g fill="none" stroke={stroke} strokeWidth="1.8">
          <path d="M70 118 Q75 108 92 112 Q95 122 82 124 Q72 124 70 118 Z" />
          <path d="M130 118 Q125 108 108 112 Q105 122 118 124 Q128 124 130 118 Z" />
          {bridge}
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

function HatShape({ hat, accent }: { hat: AvatarConfig['hat']; accent: string }) {
  switch (hat) {
    case 'fedora':
      return (
        <>
          <ellipse cx="100" cy="70" rx="70" ry="10" fill={accent} />
          <path d="M62 68 Q60 40 100 32 Q140 40 138 68 Z" fill={accent} />
          <rect x="62" y="60" width="76" height="6" fill="#F06020" opacity="0.85" />
        </>
      );
    case 'beanie':
      return (
        <>
          <path d="M55 85 Q55 45 100 42 Q145 45 145 85 Z" fill={accent} />
          <rect x="52" y="80" width="96" height="10" rx="3" fill={accent} />
          {/* pom */}
          <circle cx="100" cy="38" r="6" fill="#F1ECE3" opacity="0.8" />
        </>
      );
    case 'cap':
      return (
        <>
          <path d="M58 80 Q58 45 100 42 Q142 45 142 80 Z" fill={accent} />
          <ellipse cx="100" cy="88" rx="55" ry="6" fill={accent} />
        </>
      );
    case 'headphone':
      return (
        <>
          <path d="M48 100 Q48 60 100 55 Q152 60 152 100" fill="none" stroke={accent} strokeWidth="4" />
          <rect x="40" y="100" width="16" height="24" rx="4" fill={accent} />
          <rect x="144" y="100" width="16" height="24" rx="4" fill={accent} />
        </>
      );
    case 'hairband':
      return <path d="M55 90 Q100 65 145 90 L145 96 Q100 72 55 96 Z" fill="#F06020" />;
    case 'none':
    default:
      return null;
  }
}

/* ─────────────────────── Utils ─────────────────────── */

function darken(hex: string, amount: number): string {
  // amount 0..1 (positive=darker, negative=lighter)
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const f = 1 - amount;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
