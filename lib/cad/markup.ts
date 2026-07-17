/**
 * lib/cad/markup.ts — Sprint 7 Việc 3+4: tạo/dò MarkupPin (ghim ghi chú) và PhotoEmbed (ảnh
 * hiện trường). THUẦN (không React/DOM ngoài `Image` cho preload) — test được độc lập.
 *
 * Cả 2 là annotation RỜI lưu ở `Doc.markups`/`Doc.photos` (KHÔNG phải Entity hình học —
 * xem lib/cad/model.ts). id tự sinh cục bộ (không cần đụng lib/cad/store.ts newId() vốn có
 * side-effect biến đếm module-level dùng cho undo id — annotation không cần trùng khớp đó).
 */

import type { MarkupPin, PhotoEmbed, Pt } from './model';

let seq = 0;
function localId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Màu ghim mặc định — coral, khớp accent CommentLayer (nổi trên mọi nền, không lẫn hatch/layer). */
export const DEFAULT_MARKUP_COLOR = '#e0603a';

export function createMarkupPin(at: Pt, text: string, color: string = DEFAULT_MARKUP_COLOR, now: number = Date.now()): MarkupPin {
  return { id: localId('mk'), at, text: text.trim(), color, ts: now };
}

export function createPhotoEmbed(at: Pt, src: string, caption = '', now: number = Date.now()): PhotoEmbed {
  return { id: localId('ph'), at, src, caption: caption.trim(), ts: now };
}

/** Ghim/ảnh gần điểm `at` nhất trong bán kính `tol` (world mm) — dùng cho hitTest hover/click. */
export function nearestMarkup(pins: MarkupPin[], at: Pt, tol: number): MarkupPin | null {
  let best: MarkupPin | null = null;
  let bestD = tol;
  for (const p of pins) {
    const d = Math.hypot(p.at.x - at.x, p.at.y - at.y);
    if (d <= bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export function nearestPhoto(photos: PhotoEmbed[], at: Pt, tol: number): PhotoEmbed | null {
  let best: PhotoEmbed | null = null;
  let bestD = tol;
  for (const p of photos) {
    const d = Math.hypot(p.at.x - at.x, p.at.y - at.y);
    if (d <= bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/** Định dạng epoch ms → chuỗi giờ:phút ngày/tháng/năm (vi-VN) cho tooltip ghim. */
export function formatMarkupTime(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
