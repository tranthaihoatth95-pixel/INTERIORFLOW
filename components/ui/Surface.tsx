'use client';

/**
 * components/ui/Surface.tsx — [marker: beMatChrome] BỀ MẶT chrome dùng chung: rail nổi trái ·
 * dock/cửa sổ công cụ dưới · Inspector phải · widget · tấm nổi (sheet).
 *
 * Đo 03/09: 82 chỗ trong components tự viết `backdrop-filter`, mỗi chỗ một công thức blur/alpha —
 * đó là lý do "3 chặng như 3 app" ở cấp VẬT LIỆU. Component này không sáng tác công thức mới: nó
 * chỉ gắn lớp `.if-surface-*` (app/globals.css, khối BỘ NỀN CHROME) vốn rút từ `.nen-mo-panel` ·
 * `.vitals-pop` · `.glass-float` đang chạy, để mọi màn gọi MỘT tên thay vì chép CSS.
 *
 * Kính CHỌN LỌC, không phải mọi thứ đều kính:
 *   rail · dock · sheet → NỔI trên canvas ⇒ kính (`--nen-mo-panel`)
 *   inspector           → nội dung dày chữ ⇒ ĐẶC (`--panel`), chữ nhật dính mép (luật G2)
 *   widget              → card trên hình nền ⇒ kính card (`--nen-mo-card`)
 * `solid` = nấc giảm chói NT-16 (tắt kính, giữ độ đọc). Hệ điều hành bật
 * `prefers-reduced-transparency` thì CSS tự làm điều đó, không cần prop.
 *
 * Hình theo ngữ pháp §7: rail rounded-rect · dock CAPSULE · inspector RECT · widget/sheet rounded.
 * `z-index` đi theo thang `--z-*` — nơi gọi KHÔNG tự gõ số (thứ tự đè nhau là chuyện của thang).
 */

import React from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type SurfaceKind = 'rail' | 'dock' | 'inspector' | 'widget' | 'sheet';

export const SURFACE_KINDS: SurfaceKind[] = ['rail', 'dock', 'inspector', 'widget', 'sheet'];

/** Bề mặt nào là KÍNH (có backdrop-filter) — để nơi dùng trên canvas WebGL đếm trần 4 tấm. */
export const SURFACE_GLASS: Record<SurfaceKind, boolean> = {
  rail: true,
  dock: true,
  inspector: false,
  widget: true,
  sheet: true,
};

export const SURFACE_CLASS: Record<SurfaceKind, string> = {
  rail: 'if-surface-rail',
  dock: 'if-surface-dock',
  inspector: 'if-surface-inspector',
  widget: 'if-surface-widget',
  sheet: 'if-surface-sheet',
};

/** Tên lớp cho nơi không dùng được component (vd portal tự chế, string class). */
export function surfaceClass(kind: SurfaceKind, solid = false, extra?: string): string {
  return [SURFACE_CLASS[kind], solid ? 'if-surface--solid' : '', extra ?? ''].filter(Boolean).join(' ');
}

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  kind: SurfaceKind;
  /** Nấc giảm chói: tắt kính, nền đặc — không bao giờ cắt độ đọc. */
  solid?: boolean;
  /** Thẻ HTML gốc (mặc định `div`; rail/dock thường là `nav`/`aside`). */
  as?: ElementType;
  children?: ReactNode;
}

export function Surface({ kind, solid = false, as, className, children, ...rest }: SurfaceProps) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag data-surface={kind} className={surfaceClass(kind, solid, className)} {...rest}>
      {children}
    </Tag>
  );
}

export default Surface;
