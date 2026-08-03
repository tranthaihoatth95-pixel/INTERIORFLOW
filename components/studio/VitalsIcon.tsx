'use client';

/**
 * components/studio/VitalsIcon.tsx — glyph Vitals AI.
 *
 * 05/08 VIỆC 1 (a): bỏ hẳn gradient cam→navy thương hiệu cũ (2 mã hex nằm trong danh sách màu
 * CẤM của design system — đây từng là chỗ duy nhất trong app còn phá luật). Nay chỉ dùng MỘT sắc
 * accent tím của hệ (`currentColor`, mặc định `var(--accent)` qua CSS kế thừa) — không hardcode
 * hex, gọi site nào cần đổi màu chỉ cần set `color`/`style.color` như trước giờ vẫn làm (xem
 * `ProjectSelect.tsx`/`VitalsGesture.tsx` đã truyền `style={{ color: ACCENT }}`).
 *
 * Giữ nguyên hình khối squircle iOS 27 (tròn hairline ngoài + ô vuông bo góc trong) — chỉ đổi
 * chất liệu màu, không đổi hình. Backward-compat: mọi call-site cũ chỉ truyền `size` vẫn chạy
 * đúng, `currentColor` kế thừa từ CSS `color` bao ngoài (mặc định là `var(--t1)`/`var(--accent)`
 * tuỳ nơi mount) nên không cần sửa call-site nào.
 *
 * viewBox 40×40. Ô vuông rx=8, ~32×32 (padding 4px trong tròn 40).
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
      {/* Tròn ngoài — nét mảnh 1px, currentColor mờ 45% (bậc xám/nhấn của hệ, không fill để
          giữ nền canvas ánh qua). */}
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      {/* Ô vuông bo góc bên trong — fill đặc currentColor (accent tím của hệ), đường kính gần
          bằng tròn. Ô 32×32 tại (4,4), rx=8 → tinh thần "squircle" iOS 27. */}
      <rect x="4" y="4" width="32" height="32" rx="8" ry="8" fill="currentColor" />
    </svg>
  );
}
