'use client';

/**
 * components/studio/VitalsIcon.tsx — glyph Vitals AI.
 *
 * Đổi 21/07: logo mới style Siri iOS 27 — **tròn chứa 1 ô vuông bo góc** với gradient cam TTT
 * `#F06020` → navy TTT `#002850`. Glow subtle (feGaussianBlur) — không bling. Backward-compat:
 * mọi call-site cũ chỉ truyền `size` là còn chạy được, không phá layout.
 *
 * viewBox 40×40. Ô vuông rx=8, ~32×32 (padding 4px trong tròn 40).
 *
 * Vì gradient/glow được `<defs>` khai báo với id cố định, khi render nhiều instance trên cùng
 * trang các id không đụng nhau (id `vitals-*` là stable — SVG spec cho phép id trùng cùng doc
 * miễn cùng ref). Nếu sau này cần isolate, thêm suffix theo `useId()`.
 */

import type { SVGProps } from 'react';

interface VitalsIconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  size?: number | string;
}

export default function VitalsIcon({ size = 16, ...rest }: VitalsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id="vitals-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F06020" />
          <stop offset="100%" stopColor="#002850" />
        </linearGradient>
        <filter id="vitals-glow" x="-30%" y="-30%" width="160%" height="160%">
          {/* Subtle glow — không phát sáng chói, chỉ thoáng viền mềm. */}
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>
      {/* Tròn ngoài — nét mảnh 1px kiểu hairline TTT, KHÔNG fill (để giữ nền canvas ánh qua). */}
      <circle
        cx="20"
        cy="20"
        r="19"
        fill="none"
        stroke="url(#vitals-grad)"
        strokeWidth="1.2"
        filter="url(#vitals-glow)"
      />
      {/* Ô vuông bo góc bên trong — filled gradient cam→navy, đường kính gần bằng tròn.
          Ô 32×32 tại (4,4), rx=8 → gần vuông theo gu TTT (0–4px bo trên UI element,
          ở đây bo lớn hơn để mang tinh thần "squircle" iOS 27). */}
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="8"
        ry="8"
        fill="url(#vitals-grad)"
      />
    </svg>
  );
}
