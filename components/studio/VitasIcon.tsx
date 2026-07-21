'use client';

/**
 * components/studio/VitasIcon.tsx — glyph riêng của Vitas AI (thay Lucide `Sparkles`).
 *
 * Hình: GIỌT NƯỚC cách điệu — nói tiếp ngôn ngữ "giọt kính lỏng" đã dùng ở StageSwitcher
 * (kéo tab xuống → giọt Vitas mọc ra). Bên trong giọt có chữ V (Vitas) đọc thoáng, không hét.
 *
 * viewBox 24×24 · stroke=currentColor để tự ăn theo màu chữ (không hardcode).
 * fill=none để chỉ là đường nét mảnh, phù hợp gu hairline/quiet-luxury.
 */

import type { SVGProps } from 'react';

interface VitasIconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  size?: number | string;
}

export default function VitasIcon({ size = 16, strokeWidth = 1.5, ...rest }: VitasIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* Giọt — bezier đối xứng, đỉnh nhọn (2,3), đáy bo tròn */}
      <path d="M12 3 C 8 8.5, 5.5 12, 5.5 15.5 A 6.5 6.5 0 0 0 18.5 15.5 C 18.5 12, 16 8.5, 12 3 Z" />
      {/* Chữ V mảnh bên trong — dấu chỉ Vitas, không hét */}
      <path d="M9.5 12.5 L 12 16.5 L 14.5 12.5" opacity="0.55" />
    </svg>
  );
}
