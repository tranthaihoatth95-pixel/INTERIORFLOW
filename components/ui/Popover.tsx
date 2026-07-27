'use client';

/**
 * components/ui/Popover.tsx — định vị nổi (context menu/dropdown) LUÔN nằm trong viewport.
 *
 * Lỗi hệ thống đã sửa (28/07): menu chuột phải tự chế (vd EditorCanvas.tsx) định vị bằng
 * `left/top` tĩnh, không đo viewport → chuột phải gần mép màn hình bị cắt mục cuối. Component
 * này đo kích thước thật SAU khi render (useLayoutEffect, tránh nháy hình), rồi lật hướng:
 * thiếu chỗ bên phải → mở sang trái · thiếu chỗ bên dưới → mở lên trên · luôn chừa `margin`
 * cách mép viewport.
 *
 * PORTAL vào `document.body` (bắt buộc, không phải tuỳ chọn): tự kiểm bằng DOM phát hiện nếu
 * render tại chỗ (absolute trong container gọi nó), một ancestor `overflow:hidden` bất kỳ (vd
 * sân khấu slide Present — "giấy" luôn overflow:hidden theo SPEC-UI-SHELL §3B) sẽ CẮT mất phần
 * popover lật ra ngoài container đó, dù toạ độ tính đúng theo viewport. Portal + `position:fixed`
 * bằng toạ độ viewport thẳng né hoàn toàn mọi ancestor clip/overflow.
 */

import { createPortal } from 'react-dom';
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface PopoverProps {
  /** toạ độ neo THEO VIEWPORT (vd e.clientX/e.clientY). */
  anchorX: number;
  anchorY: number;
  /** khoảng cách tối thiểu tới mép viewport (px). Mặc định 8. */
  margin?: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export default function Popover({ anchorX, anchorY, margin = 8, children, style, className }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const reposition = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Thiếu chỗ bên phải/dưới → lật sang trái/lên trên. Sau đó kẹp lại trong [margin, vw-margin]
    // để trường hợp menu RỘNG HƠN cả viewport (hiếm) vẫn không tràn ra ngoài.
    let x = anchorX + width + margin > vw ? anchorX - width : anchorX;
    let y = anchorY + height + margin > vh ? anchorY - height : anchorY;
    x = Math.min(Math.max(x, margin), Math.max(margin, vw - width - margin));
    y = Math.min(Math.max(y, margin), Math.max(margin, vh - height - margin));
    setPos({ left: x, top: y });
  }, [anchorX, anchorY, margin]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  // Đo lại nếu KÍCH THƯỚC THẬT đổi sau khi mount (vd font web-font swap làm rộng/hẹp chữ đi vài
  // px) — 1 lần đo duy nhất lúc mount có thể LỆCH, khiến margin 8px không còn đúng dù vẫn nằm
  // trong viewport (không tràn, nhưng sát mép hơn ý định). ResizeObserver bắt mọi nguyên nhân
  // reflow, không chỉ riêng font.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => reposition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [reposition]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={ref}
      className={className}
      role="menu"
      style={{
        position: 'fixed',
        left: pos ? pos.left : anchorX,
        top: pos ? pos.top : anchorY,
        // Ẩn khung tới khi đo xong 1 nhịp — tránh nháy vị trí sai (chưa lật) trước mắt user.
        visibility: pos ? 'visible' : 'hidden',
        // Cao hơn mọi z-index đã dùng trong app (tối đa hiện tại 90, dialog "Thay ảnh") — menu
        // ngữ cảnh không được để dialog/overlay nào đè lên khi cả hai cùng mở.
        zIndex: 1000,
        ...style,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
