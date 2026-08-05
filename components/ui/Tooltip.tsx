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

/** Trễ mặc định trước khi tag hiện (ms) — khớp `.if-tooltip-visible { transition-delay }` cũ. */
export const TOOLTIP_DEFAULT_DELAY_MS = 150;
/** Giữ ngón bao lâu thì tag hiện trên cảm ứng/bút (ms) — mốc long-press quen thuộc của iOS/Android. */
export const TOOLTIP_LONG_PRESS_MS = 500;
/** Sau khi nhấc ngón, tag còn nán lại bấy nhiêu để kịp ĐỌC (ms) — cảm ứng không có "rời chuột". */
const TOUCH_LINGER_MS = 1800;
/** Trượt quá bấy nhiêu px trong lúc giữ = người dùng đang CUỘN, không phải hỏi tooltip → huỷ. */
const LONG_PRESS_SLOP_PX = 8;

interface TooltipProps {
  /** tên chức năng hiện trên tag (tiếng Việt, ngắn gọn). */
  label: string;
  /**
   * Mô tả 1-2 dòng giải thích công cụ làm GÌ — dòng dưới, chữ nhạt hơn tiêu đề. Có `desc` (hoặc
   * `shortcut`) thì tag chuyển sang khuôn "thẻ" (`.if-tooltip-rich`: xuống dòng được, rộng tối đa
   * 260px) thay vì 1 dòng nowrap. Đây là chỗ THAY cho `title=` HTML dài lê thê — `title=` chậm
   * 1-2s, không định dạng được, và KHÔNG bao giờ hiện trên cảm ứng.
   */
  desc?: string;
  /** phím tắt hiện dạng phím bấm ở góc phải tiêu đề (vd 'L', '⌘Z', 'Space'). */
  shortcut?: string;
  /** trễ trước khi hiện (ms). Mặc định `TOOLTIP_DEFAULT_DELAY_MS`; 0 = hiện ngay. */
  delayMs?: number;
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
  /**
   * Tắt nhãn TĨNH cảm ứng (`.if-tooltip-static`). Dùng khi phần tử ĐÃ tự hiện chữ tên của nó
   * (vd nút chặng ở `StageSwitcher` — có icon KÈM chữ), nếu không cảm ứng sẽ thấy tên hai lần.
   * Tắt nhãn tĩnh KHÔNG làm mất tooltip trên cảm ứng: long-press vẫn mở được thẻ đầy đủ.
   */
  hideTouchLabel?: boolean;
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

export default function Tooltip({
  label,
  desc,
  shortcut,
  delayMs = TOOLTIP_DEFAULT_DELAY_MS,
  children,
  side = 'top',
  disabled,
  style,
  touchLabel,
  hideTouchLabel,
}: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  /** true = tag đang mở BẰNG long-press (cảm ứng/bút) → cần bỏ `display:none` của media coarse. */
  const [touchOpen, setTouchOpen] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const lingerTimer = useRef<number | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
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

  const clearTimers = useCallback(() => {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    if (lingerTimer.current !== null) window.clearTimeout(lingerTimer.current);
    pressTimer.current = null;
    lingerTimer.current = null;
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setOpen(false);
    setTouchOpen(false);
  }, [clearTimers]);

  // Dọn hẹn giờ khi component biến mất giữa lúc đang giữ ngón (đổi tool, đóng panel…).
  useEffect(() => clearTimers, [clearTimers]);

  /* ---- Long-press cho CẢM ỨNG & BÚT (§0c mảng 3: `title=` không bao giờ hiện trên iPad).
     Chuột KHÔNG đi đường này — chuột đã có hover (`onMouseEnter`), thêm nữa là hiện hai lần. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      clearTimers();
      pressOrigin.current = { x: e.clientX, y: e.clientY };
      pressTimer.current = window.setTimeout(() => {
        pressTimer.current = null;
        setTouchOpen(true);
        reposition();
      }, TOOLTIP_LONG_PRESS_MS);
    },
    [clearTimers, reposition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Trượt = đang cuộn danh sách/toolbar, không phải muốn xem tooltip → huỷ hẹn giờ.
      const from = pressOrigin.current;
      if (!from || pressTimer.current === null) return;
      if (Math.abs(e.clientX - from.x) > LONG_PRESS_SLOP_PX || Math.abs(e.clientY - from.y) > LONG_PRESS_SLOP_PX) {
        clearTimers();
      }
    },
    [clearTimers],
  );

  const onPointerUp = useCallback(() => {
    pressOrigin.current = null;
    if (pressTimer.current !== null) {
      // Nhấc tay TRƯỚC mốc 500ms ⇒ đó là một cú CHẠM bình thường (bấm nút), không phải long-press.
      clearTimers();
      return;
    }
    if (!touchOpen) return;
    // Đã mở rồi: giữ thêm một nhịp cho kịp đọc rồi tự đóng — cảm ứng không có sự kiện "rời chuột".
    clearTimers();
    lingerTimer.current = window.setTimeout(() => {
      lingerTimer.current = null;
      setOpen(false);
      setTouchOpen(false);
    }, TOUCH_LINGER_MS);
  }, [clearTimers, touchOpen]);

  if (disabled || !label) return <>{children}</>;

  const rich = Boolean(desc || shortcut);

  return (
    <span
      ref={wrapRef}
      className="if-tooltip-wrap"
      style={style}
      onMouseEnter={reposition}
      onMouseLeave={close}
      onFocus={reposition}
      onBlur={close}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={close}
      /* Long-press trên Android/iPadOS mở menu ngữ cảnh hệ thống ("Sao chép/Tra cứu") đè lên
         tag vừa hiện — chặn ĐÚNG lúc tag đang mở, các lúc khác vẫn để trình duyệt xử lý bình thường. */
      onContextMenu={(e) => {
        if (touchOpen) e.preventDefault();
      }}
    >
      {children}
      {/* Nhãn TĨNH cho cảm ứng thật — render bình thường trong flow (KHÔNG portal), ẩn hẳn bằng
          CSS mặc định (chuột), chỉ hiện qua @media (hover:none) and (pointer:coarse). Không cần
          mounted-gate vì đây là span thường, không đụng document.body → hydrate khớp ngay từ đầu. */}
      {!hideTouchLabel && (
        <span className="if-tooltip-static" aria-hidden="true">
          {touchLabel ?? label}
        </span>
      )}
      {mounted &&
        createPortal(
          <span
            role="tooltip"
            ref={tagRef}
            className={
              `if-tooltip-tag if-tooltip-${anchor.renderSide}` +
              (open ? ' if-tooltip-visible' : '') +
              (rich ? ' if-tooltip-rich' : '') +
              (touchOpen ? ' if-tooltip-touch' : '')
            }
            style={
              {
                left: anchor.left,
                top: anchor.y,
                '--tt-offset': `${anchor.offsetX}px`,
                '--tt-offset-y': `${anchor.offsetY}px`,
                '--tt-delay': `${delayMs}ms`,
              } as React.CSSProperties
            }
          >
            {rich ? (
              <>
                <span className="if-tooltip-head">
                  <span className="if-tooltip-title">{label}</span>
                  {shortcut && <kbd className="if-tooltip-kbd">{shortcut}</kbd>}
                </span>
                {desc && <span className="if-tooltip-desc">{desc}</span>}
              </>
            ) : (
              label
            )}
          </span>,
          document.body,
        )}
    </span>
  );
}
