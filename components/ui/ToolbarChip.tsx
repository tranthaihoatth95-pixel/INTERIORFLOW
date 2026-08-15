'use client';

/**
 * components/ui/ToolbarChip.tsx — nút công cụ dùng CHUNG cho cả 3 thanh công cụ chặng
 * (2D `CadToolbar` · 3D `ToolDock3D` · Trình bày `present-editor/Toolbar`).
 *
 * Nguồn gốc: 2D `CadToolbar.tsx` (`btn()`/`btnSize()`) đã có ĐÚNG ngôn ngữ NT-5 (capsule/pill,
 * bo tròn `RADIUS.full`, ghost-khi-bật thay vì tô đặc) — file này TRÍCH NGUYÊN kiểu đó thành
 * component dùng chung, không phát minh kiểu mới. 3D và Trình bày hiện mỗi nơi tự viết style
 * riêng (điều tra 14/08, `docs/00-CHOT.md` mục "L1"), khiến 3 chặng trông như 3 app khác nhau.
 *
 * Token: `lib/geometry.ts` RADIUS.full (999) cho hình tròn; size 2 nấc theo mật độ con trỏ
 * (44 chạm/Sketch · 36 chuột/Pro — chốt ticket "THANH TOOL 2D DESIGN" 04/08, không phát minh
 * số mới). Nhãn kèm icon (tuỳ chọn `label`) đúng luật K14/NT-8 "icon luôn có chữ".
 *
 * §9 "cấm nút giả": `disabled` BẮT BUỘC đi kèm `disabledReason` hiện trong `title` — không cho
 * disabled câm lặng không lý do.
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
  /** Chạm (Sketch/3D) ưu tiên 44px; chuột (Pro) 36px — 2 nấc chuẩn, không số lẻ. */
  size?: 44 | 36;
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
  size = 36,
  showLabel = false,
  shortcutHint,
}: ToolbarChipProps) {
  if (disabled && !disabledReason) {
    // Phát triển sai luật §9 — báo ngay thay vì render nút câm lặng không giải thích được vì sao mờ.
    console.warn(`ToolbarChip "${label}": disabled=true nhưng thiếu disabledReason — trái luật §9.`);
  }

  const style: CSSProperties = showLabel
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 'auto',
        minWidth: size + 22,
        padding: '8px 10px',
        borderRadius: RADIUS.r2,
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        touchAction: 'manipulation',
        transition: 'background .15s, color .15s',
        fontSize: 10.5,
        whiteSpace: 'nowrap',
      }
    : {
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: RADIUS.full,
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
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
    </button>
  );

  if (disabled) return button; // Tooltip không cần cho nút mờ — title đã có lý do.

  return (
    <Tooltip label={label} desc={desc} shortcut={shortcutHint}>
      {button}
    </Tooltip>
  );
}
