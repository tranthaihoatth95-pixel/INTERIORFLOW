/**
 * lib/present-editor/align.ts — Căn chỉnh + phân bố đều NHIỀU element đã chọn (multi-select).
 *
 * Thuần (pure), không DOM/side-effect — nhận mảng `Frame` (giữ đúng THỨ TỰ MẢNG GỐC), trả
 * mảng `Frame` mới cùng thứ tự/độ dài để caller map lại theo id dễ dàng (xem cách gọi ở
 * PresentEditor.tsx: `onAlignSelection`/`onDistributeSelection`).
 *
 * Khác `onAlign` (PresentEditor.tsx, cũ) — hàm đó canh 1 phần tử theo BIÊN SÂN KHẤU (0..100).
 * Ở đây canh theo BOUNDING BOX CHUNG của chính các phần tử đã chọn (kiểu PowerPoint/Figma
 * "Align Selected Objects" chứ không phải "Align to Slide").
 *
 * "Phân bố đều" (distribute) cần ≥3 phần tử: giữ nguyên 2 mốc biên (mép ngoài cùng theo trục),
 * chia đều KHOẢNG CÁCH GIỮA CÁC MÉP (gap) cho phần còn lại theo thứ tự vị trí không gian.
 *
 * Test: align.test.ts — `node_modules/.bin/sucrase-node lib/present-editor/align.test.ts`.
 */

import type { Frame } from './model';

export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';

export interface GroupBounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Bounding box CHUNG của nhiều frame (mép ngoài cùng mỗi phía). Rỗng → toàn 0. */
export function groupBounds(frames: Frame[]): GroupBounds {
  if (!frames.length) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const f of frames) {
    x0 = Math.min(x0, f.x);
    y0 = Math.min(y0, f.y);
    x1 = Math.max(x1, f.x + f.w);
    y1 = Math.max(y1, f.y + f.h);
  }
  return { x0, y0, x1, y1 };
}

/**
 * Căn từng frame theo `mode`, mốc = bounding box CHUNG của chính các frame truyền vào
 * (KHÔNG phải biên sân khấu). <2 frame → không có gì để canh theo nhau, trả bản sao nguyên vẹn.
 */
export function alignFrames(frames: Frame[], mode: AlignMode): Frame[] {
  if (frames.length < 2) return frames.map((f) => ({ ...f }));
  const b = groupBounds(frames);
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  return frames.map((f) => {
    switch (mode) {
      case 'left':
        return { ...f, x: b.x0 };
      case 'right':
        return { ...f, x: b.x1 - f.w };
      case 'hcenter':
        return { ...f, x: cx - f.w / 2 };
      case 'top':
        return { ...f, y: b.y0 };
      case 'bottom':
        return { ...f, y: b.y1 - f.h };
      case 'vcenter':
        return { ...f, y: cy - f.h / 2 };
      default:
        return { ...f };
    }
  });
}

/**
 * Phân bố đều khoảng cách GIỮA CÁC MÉP theo trục (ngang: dùng x/w · dọc: dùng y/h).
 * Cần ≥3 frame (2 phần tử thì không có "khoảng giữa" nào để chia đều) — <3 trả bản sao nguyên vẹn.
 * Giữ nguyên 2 mốc biên (frame có mép đầu nhỏ nhất/lớn nhất theo trục); các frame CÒN LẠI
 * được xếp cách đều nhau theo thứ tự vị trí không gian (không phải thứ tự mảng truyền vào),
 * nhưng kết quả trả về vẫn đúng THỨ TỰ MẢNG GỐC.
 */
export function distributeFrames(frames: Frame[], axis: DistributeAxis): Frame[] {
  if (frames.length < 3) return frames.map((f) => ({ ...f }));
  const posKey: 'x' | 'y' = axis === 'horizontal' ? 'x' : 'y';
  const sizeKey: 'w' | 'h' = axis === 'horizontal' ? 'w' : 'h';

  // sắp theo mép đầu (x hoặc y) để biết thứ tự không gian.
  const order = frames.map((f, i) => ({ f, i })).sort((a, b) => a.f[posKey] - b.f[posKey]);

  const first = order[0].f;
  const last = order[order.length - 1].f;
  const totalSpan = last[posKey] + last[sizeKey] - first[posKey];
  const sumSizes = order.reduce((s, o) => s + o.f[sizeKey], 0);
  const gap = (totalSpan - sumSizes) / (order.length - 1);

  const results: Frame[] = new Array(frames.length);
  let cursor = first[posKey];
  for (const o of order) {
    results[o.i] = { ...o.f, [posKey]: cursor } as Frame;
    cursor += o.f[sizeKey] + gap;
  }
  return results;
}
