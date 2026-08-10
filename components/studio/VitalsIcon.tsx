'use client';

import { useId, type SVGProps } from 'react';

interface VitalsIconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  size?: number | string;
}

/**
 * Glyph Vitals: ba vệt electron hình oval đi về cùng một tâm.
 * Nó là dấu hiệu "đọc – liên hệ – trả lời" của dự án, không phải avatar hay quả cầu AI.
 */
export default function VitalsIcon({ size = 16, ...rest }: VitalsIconProps) {
  const uid = useId().replace(/:/g, '');
  const glow = `vitals-glow-${uid}`;
  const core = `vitals-core-${uid}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" {...rest}>
      <defs>
        <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.25" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={core}><stop offset="0" stopColor="white" /><stop offset=".32" stopColor="currentColor" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient>
      </defs>
      <style>{`
        .vitals-orbit{transform-origin:20px 20px;fill:none;stroke:currentColor;stroke-linecap:round}
        .vitals-orbit--a{animation:vitals-orbit-a 5.4s linear infinite}
        .vitals-orbit--b{animation:vitals-orbit-b 6.2s linear infinite}
        .vitals-orbit--c{animation:vitals-orbit-c 4.8s linear infinite}
        .vitals-core{animation:vitals-core 2.7s ease-in-out infinite}
        @keyframes vitals-orbit-a{to{transform:rotate(360deg)}}
        @keyframes vitals-orbit-b{to{transform:rotate(-360deg)}}
        @keyframes vitals-orbit-c{to{transform:rotate(360deg)}}
        @keyframes vitals-core{50%{opacity:.72;transform:scale(.78)} }
        @media (prefers-reduced-motion:reduce){.vitals-orbit,.vitals-core{animation:none!important}}
      `}</style>
      <g filter={`url(#${glow})`} opacity=".9">
        <ellipse className="vitals-orbit vitals-orbit--a" cx="20" cy="20" rx="15.4" ry="6.2" strokeWidth="1.45" transform="rotate(-27 20 20)" />
        <ellipse className="vitals-orbit vitals-orbit--b" cx="20" cy="20" rx="14.4" ry="5.7" strokeWidth="1.2" opacity=".72" transform="rotate(42 20 20)" />
        <ellipse className="vitals-orbit vitals-orbit--c" cx="20" cy="20" rx="12.9" ry="5.1" strokeWidth="1" opacity=".48" transform="rotate(91 20 20)" />
      </g>
      <g className="vitals-core"><circle cx="20" cy="20" r="6.8" fill={`url(#${core})`} opacity=".46" /><circle cx="20" cy="20" r="1.7" fill="currentColor" /></g>
    </svg>
  );
}
