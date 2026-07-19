'use client';

/**
 * components/ui/Tooltip.tsx — "chú thích thông minh" dùng chung toàn app.
 *
 * Thay cho `title="..."` gốc HTML (tooltip mặc định trình duyệt: chậm, xấu, không
 * nhất quán). Bọc quanh 1 icon/nút; hover/focus → hiện 1 tag nhỏ ghi tên chức năng
 * ngay cạnh (trên/dưới), trễ ngắn ~150ms cho hiện, biến mất NGAY khi rời chuột.
 *
 * Tag portal ra `document.body` (position: fixed, toạ độ đo bằng
 * getBoundingClientRect) — KHÔNG render lồng bên trong nút. Lý do: vài toolbar
 * (vd CadToolbar — pill nổi có `overflow-x: auto` để cuộn ngang khi màn hẹp) vô tình
 * kẹp `overflow-y` theo hành vi CSS chuẩn (setter 1 trục non-visible ép trục kia
 * cũng thành 'auto'), nên tag định vị `absolute` bên trong sẽ bị CẮT MẤT phía trên/
 * dưới icon dù `opacity` đã lên 1. Portal + `position: fixed` né hẳn kiểu kẹp này.
 *
 * Hiện/ẩn vẫn chỉ dùng CSS transition (opacity/transform, xem .if-tooltip-* trong
 * app/globals.css) — không thêm thư viện ngoài, chỉ dùng `react-dom` (đã có sẵn).
 * Phần logic JS duy nhất: đo vị trí neo + tính lệch ngang tránh tràn viewport
 * (lib/ui/tooltip-position.ts).
 *
 * Gu màu: tag dùng --t1/--bg đảo ngược (giống tooltip hệ thống) + --border/--shadow-pop
 * sẵn có trong globals.css — KHÔNG bịa màu mới.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clampHorizontalOffset } from '@/lib/ui/tooltip-position';

interface TooltipProps {
  /** tên chức năng hiện trên tag (tiếng Việt, ngắn gọn). */
  label: string;
  children: React.ReactNode;
  /** tag hiện phía trên (mặc định) hay phía dưới icon — dùng 'bottom' cho hàng nút sát mép trên màn hình. */
  side?: 'top' | 'bottom';
  /** tắt tooltip hoàn toàn (vẫn render children bình thường) — vd nút đã có UI hint khác. */
  disabled?: boolean;
  /** style bổ sung cho span bọc ngoài (hiếm khi cần — component vốn chỉ display:inline-flex). */
  style?: React.CSSProperties;
}

interface Anchor {
  /** tâm ngang icon (viewport px) — neo để tag canh giữa. */
  left: number;
  /** mép trên/dưới icon tuỳ `side` (viewport px). */
  y: number;
  /** lệch ngang (px) cộng thêm để tag không tràn mép trái/phải viewport. */
  offset: number;
}

export default function Tooltip({ label, children, side = 'top', disabled, style }: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>({ left: 0, y: 0, offset: 0 });
  // mounted-gate chuẩn: server luôn render false, client vẫn render false ở lần
  // hydrate ĐẦU TIÊN (khớp cây DOM server) — chỉ bật true trong useEffect (chạy
  // SAU khi mount xong), từ đó mới cho phép createPortal ra document.body. Tránh
  // dùng thẳng `typeof document !== 'undefined'` — biểu thức đó true NGAY ở lần
  // render client đầu tiên (trước cả khi hydrate xong) → lệch cây DOM server/client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const reposition = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof window === 'undefined') return;
    const wrapRect = wrap.getBoundingClientRect();
    const centerX = wrapRect.left + wrapRect.width / 2;
    const tagWidth = tagRef.current?.getBoundingClientRect().width ?? 0;
    const offset = clampHorizontalOffset(centerX, tagWidth / 2, window.innerWidth);
    setAnchor({ left: centerX, y: side === 'top' ? wrapRect.top : wrapRect.bottom, offset });
    setOpen(true);
  }, [side]);

  const close = useCallback(() => setOpen(false), []);

  if (disabled || !label) return <>{children}</>;

  return (
    <span
      ref={wrapRef}
      className="if-tooltip-wrap"
      style={style}
      onMouseEnter={reposition}
      onMouseLeave={close}
      onFocus={reposition}
      onBlur={close}
    >
      {children}
      {mounted &&
        createPortal(
          <span
            role="tooltip"
            ref={tagRef}
            className={`if-tooltip-tag if-tooltip-${side}${open ? ' if-tooltip-visible' : ''}`}
            style={
              {
                left: anchor.left,
                top: anchor.y,
                '--tt-offset': `${anchor.offset}px`,
              } as React.CSSProperties
            }
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
