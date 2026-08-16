'use client';

/**
 * components/ui/ToolbarChip.tsx — nút công cụ dùng CHUNG cho cả 3 thanh công cụ chặng
 * (2D `CadToolbar` · 3D `ToolDock3D` · Trình bày `present-editor/Toolbar`).
 *
 * Nguồn gốc: 2D `CadToolbar.tsx` (`btn()`/`btnSize()`) có ĐÚNG ngôn ngữ NT-5 (capsule/pill, bo
 * tròn, ghost-khi-bật thay vì tô đặc) — file này TRÍCH kiểu đó thành component dùng chung.
 *
 * 15/08 — SỬA theo `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md:83` KB-1 (T tự bác bỏ một phần
 * tiền đề phiếu `toolbar-mot-khuon`: bản 14/08 mới TRÍCH NGUYÊN kiểu 2D (44/36 cứng), CHƯA khớp
 * KB-1 "capsule 44/r22 → nút 34/r17"). Đổi: kích thước qua CSS var thay vì literal 44|36 —
 * `size="tap"` (mặc định) = `var(--tap)` (32 desktop · 44 cảm ứng, override sẵn ở
 * `app/globals.css:164`, KHÔNG viết media query mới) · `size="tap-lg"` = `var(--tap-lg)` (44 cố
 * định, dùng cho Sketch/mode chạm và nhóm lệnh "big") · số cụ thể vẫn nhận để chặng nào cần ghim
 * đúng con số hiện có (không ép mọi nơi qua CSS var cùng lúc, tránh vỡ layout ăn theo — vd
 * `Divider` trong `CadToolbar.tsx` cần một con số JS để tính chiều cao). `RADIUS.full` (999px)
 * tự concentric ở MỌI cỡ vì border-radius clamp về nửa cạnh ngắn — không cần breakpoint riêng
 * cho bo góc.
 *
 * Nhãn kèm icon (tuỳ chọn `label`) đúng luật K14/NT-8 "icon luôn có chữ".
 * §9 "cấm nút giả": `disabled` BẮT BUỘC đi kèm `disabledReason` hiện trong `title`.
 */

import type { CSSProperties, ReactNode } from 'react';
import { RADIUS } from '@/lib/geometry';
import Tooltip from './Tooltip';

export interface ToolbarChipProps {
  icon: ReactNode;
  /** Nhãn chữ — hiện CẠNH icon khi có (dock mở rộng); ẩn chữ vẫn bắt buộc truyền cho a11y/tooltip. */
  label: string;
  /** Giải thích ngắn cho Tooltip — mặc định dùng `label`. */
  desc?: string;
  active?: boolean;
  disabled?: boolean;
  /** BẮT BUỘC khi disabled=true — §9 cấm nút giả không lý do. */
  disabledReason?: string;
  onClick?: () => void;
  /**
   * `'tap'` (mặc định) = `var(--tap)` (32 desktop · 44 cảm ứng, tự đổi theo thiết bị) ·
   * `'tap-lg'` = `var(--tap-lg)` (44 cố định, KHÔNG đổi theo thiết bị — dùng cho Sketch/lệnh to) ·
   * số cụ thể = ghim literal (chặng nào cần một con số JS ổn định để tính layout ăn theo, vd
   * chiều cao Divider — không dùng CSS var ở đó được vì cần số thật lúc render).
   */
  size?: 'tap' | 'tap-lg' | number;
  /** Hiện nhãn chữ cạnh icon (khuôn dock mở rộng) thay vì chỉ icon tròn. */
  showLabel?: boolean;
  shortcutHint?: string;
}

export function ToolbarChip({
  icon,
  label,
  desc,
  active = false,
  disabled = false,
  disabledReason,
  onClick,
  size = 'tap',
  showLabel = false,
  shortcutHint,
}: ToolbarChipProps) {
  if (disabled && !disabledReason) {
    // Phát triển sai luật §9 — báo ngay thay vì render nút câm lặng không giải thích được vì sao mờ.
    console.warn(`ToolbarChip "${label}": disabled=true nhưng thiếu disabledReason — trái luật §9.`);
  }

  const sizeValue: number | string =
    size === 'tap' ? 'var(--tap)' : size === 'tap-lg' ? 'var(--tap-lg)' : size;
  // minWidth ở nhãn dạng cột cần một con số CSS hợp lệ dù size là chuỗi var(); calc() cộng được
  // thẳng với biến CSS nên không cần quy đổi ra số JS ở đây.
  const minWidthShowLabel = typeof sizeValue === 'number' ? sizeValue + 22 : `calc(${sizeValue} + 22px)`;

  const style: CSSProperties = showLabel
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 'auto',
        minWidth: minWidthShowLabel,
        padding: '8px 10px',
        borderRadius: RADIUS.r2,
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        // 16/08 (B2, a11y): 0.35 → 0.5. Ở 0.35 nét icon tụt xuống ~2,2:1 trên nền panel — dưới cả
        // ngưỡng 3:1 của WCAG 1.4.11 cho thành phần giao diện, tức nút mờ thành nút ĐỌC KHÔNG RA.
        // Trái đúng ý §9: mờ là để nói "chưa dùng được", không phải để biến mất khỏi mắt.
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation',
        transition: 'background .15s, color .15s',
        fontSize: 10.5,
        whiteSpace: 'nowrap',
      }
    : {
        display: 'grid',
        placeItems: 'center',
        width: sizeValue,
        height: sizeValue,
        borderRadius: RADIUS.full,
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        // 16/08 (B2, a11y): 0.35 → 0.5. Ở 0.35 nét icon tụt xuống ~2,2:1 trên nền panel — dưới cả
        // ngưỡng 3:1 của WCAG 1.4.11 cho thành phần giao diện, tức nút mờ thành nút ĐỌC KHÔNG RA.
        // Trái đúng ý §9: mờ là để nói "chưa dùng được", không phải để biến mất khỏi mắt.
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation',
        transition: 'background .15s, color .15s',
        flexShrink: 0,
      };

  const button = (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={disabled ? disabledReason : undefined}
      style={style}
    >
      {icon}
      {showLabel && <span>{label}</span>}
      {/* Dock 3D mở rộng vốn hiện phím tắt LUÔN THẤY (không chỉ lúc hover) — giữ hành vi cũ khi
          gộp vào ToolbarChip, không lùi một bậc discoverability. */}
      {showLabel && shortcutHint && (
        <span style={{ fontSize: 9, opacity: active ? 0.8 : 0.6 }}>{shortcutHint}</span>
      )}
    </button>
  );

  if (disabled) return button; // Tooltip không cần cho nút mờ — title đã có lý do.

  return (
    <Tooltip label={label} desc={desc} shortcut={shortcutHint}>
      {button}
    </Tooltip>
  );
}

/**
 * `ToolbarBar` — vỏ capsule dùng chung cho thanh công cụ (KB-1: h44 · r-full · đệm 6 · gap 2).
 *
 * 16/08 (B2) — ĐÃ WIRE, hết nợ 15/08. Nó nay mang cả MẶT (nền · viền · đổ bóng), không chỉ khung
 * xếp: KB-1 gọi đây là "vỏ capsule", mà vỏ thì phải có mặt — để mỗi chặng tự vẽ nền là chỗ ba
 * chặng lại trôi ra ba kiểu.
 *
 * ▸ BO ĐỒNG TÂM TỰ ĐÚNG, không cần khai số: `RADIUS.full` (999) bị trình duyệt kẹp về nửa cạnh
 *   ngắn ⇒ vỏ 44 cho bo 22, nút 32 cho bo 16, mà `22 − đệm 6 = 16` — đúng công thức
 *   `rInner = rOuter − pad` của luật §2d, ở MỌI cỡ, kể cả khi `--tap` nở lên 44 lúc chạm.
 *   Vì thế KHÔNG được thay `RADIUS.full` bằng một con số cụ thể: thay là mất tính đồng tâm.
 *
 * `style` chỉ nhận phần ĐỊNH VỊ của nơi gọi (absolute/bottom/z-index…) — dock 3D nổi trên khung
 * nhìn, thanh 2D nằm trong toolbelt; hình dạng thì tuyệt đối không cho ghi đè.
 */
export function ToolbarBar({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: 'var(--tap-lg)',
        padding: '0 6px',
        borderRadius: RADIUS.full,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-pop)',
      }}
    >
      {children}
    </div>
  );
}

/** Separator KB-1: "bỏ gạch | lửng" — vạch cao ≤20 canh giữa, không phải ký tự pipe. */
ToolbarBar.Sep = function ToolbarBarSep() {
  return <span aria-hidden style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />;
};
