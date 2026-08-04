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
import { clampHorizontalOffset, pickHorizontalSide } from '@/lib/ui/tooltip-position';

interface TooltipProps {
  /** tên chức năng hiện trên tag (tiếng Việt, ngắn gọn). */
  label: string;
  children: React.ReactNode;
  /**
   * tag hiện phía trên (mặc định) hay phía dưới icon — dùng 'bottom' cho hàng nút sát mép trên
   * màn hình. 'right' (LỖI 4, P8 04/08) — neo cạnh PHẢI nút thay vì canh giữa phía trên; dùng cho
   * lưới nút NHỎ/HẸP (vd lưới 3 cột `Command3DPanel.tsx`) nơi tag `top` canh giữa đủ rộng để đè
   * lên nút liền kề. Tự LẬT sang trái khi không đủ chỗ bên phải (`pickHorizontalSide`).
   */
  side?: 'top' | 'bottom' | 'right';
  /** tắt tooltip hoàn toàn (vẫn render children bình thường) — vd nút đã có UI hint khác. */
  disabled?: boolean;
  /** style bổ sung cho span bọc ngoài (hiếm khi cần — component vốn chỉ display:inline-flex). */
  style?: React.CSSProperties;
  /**
   * VIỆC 3 phần B (26/07) — nhãn RÚT GỌN dành riêng cho nhãn chữ TĨNH hiện trên thiết bị
   * cảm ứng thật (xem `.if-tooltip-static` trong globals.css, kích hoạt bằng
   * `@media (hover:none) and (pointer:coarse)`). Mặc định dùng luôn `label` — chỉ cần truyền
   * khi `label` gốc quá dài (vd "Reference — ảnh / vật liệu") và rail hẹp không đủ chỗ.
   */
  touchLabel?: string;
}

type RenderSide = 'top' | 'bottom' | 'right' | 'left';

interface Anchor {
  /** neo ngang (viewport px) — tâm icon cho top/bottom, mép trái/phải icon cho right/left. */
  left: number;
  /** neo dọc (viewport px) — mép trên/dưới icon cho top/bottom, tâm icon cho right/left. */
  y: number;
  /** lệch ngang (px) cộng thêm để tag không tràn mép trái/phải viewport (mode top/bottom). */
  offsetX: number;
  /** lệch dọc (px) cộng thêm để tag không tràn mép trên/dưới viewport (mode right/left). */
  offsetY: number;
  /** cạnh THẬT SỰ dùng để vẽ — khác `side` yêu cầu khi 'right' phải LẬT sang 'left' (hết chỗ). */
  renderSide: RenderSide;
}

export default function Tooltip({ label, children, side = 'top', disabled, style, touchLabel }: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>({ left: 0, y: 0, offsetX: 0, offsetY: 0, renderSide: side });
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
    const tagRect = tagRef.current?.getBoundingClientRect();

    if (side === 'right') {
      // LỖI 4 (P8) — neo cạnh nút thay vì canh giữa: tránh tag rộng đè lên nút LIỀN KỀ trong
      // lưới hẹp. `pickHorizontalSide` tự lật sang trái khi không đủ chỗ (vd nút sát mép phải
      // panel/viewport).
      const tagWidth = tagRect?.width ?? 0;
      const tagHeight = tagRect?.height ?? 0;
      const renderSide = pickHorizontalSide(wrapRect.left, wrapRect.right, tagWidth, window.innerWidth);
      const centerY = wrapRect.top + wrapRect.height / 2;
      const offsetY = clampHorizontalOffset(centerY, tagHeight / 2, window.innerHeight);
      setAnchor({
        left: renderSide === 'right' ? wrapRect.right : wrapRect.left,
        y: centerY,
        offsetX: 0,
        offsetY,
        renderSide,
      });
      setOpen(true);
      return;
    }

    const centerX = wrapRect.left + wrapRect.width / 2;
    const tagWidth = tagRect?.width ?? 0;
    const offsetX = clampHorizontalOffset(centerX, tagWidth / 2, window.innerWidth);
    setAnchor({
      left: centerX,
      y: side === 'top' ? wrapRect.top : wrapRect.bottom,
      offsetX,
      offsetY: 0,
      renderSide: side,
    });
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
      {/* Nhãn TĨNH cho cảm ứng thật — render bình thường trong flow (KHÔNG portal), ẩn hẳn bằng
          CSS mặc định (chuột), chỉ hiện qua @media (hover:none) and (pointer:coarse). Không cần
          mounted-gate vì đây là span thường, không đụng document.body → hydrate khớp ngay từ đầu. */}
      <span className="if-tooltip-static" aria-hidden="true">
        {touchLabel ?? label}
      </span>
      {mounted &&
        createPortal(
          <span
            role="tooltip"
            ref={tagRef}
            className={`if-tooltip-tag if-tooltip-${anchor.renderSide}${open ? ' if-tooltip-visible' : ''}`}
            style={
              {
                left: anchor.left,
                top: anchor.y,
                '--tt-offset': `${anchor.offsetX}px`,
                '--tt-offset-y': `${anchor.offsetY}px`,
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
