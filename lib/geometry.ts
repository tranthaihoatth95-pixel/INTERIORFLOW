/**
 * lib/geometry.ts — hình học design system (thang bo góc DUYỆT 12/08).
 *
 * Thang: --r-1 6 · --r-2 10 · --r-3 14 · --r-4 20 · --r-full 999 (app/globals.css).
 * Nguồn: docs/AUDIT-HINH-HOC-2026-08-12.md §3 (Hoà gật 12/08).
 */

/** Bốn nấc thang bo góc + capsule — dùng cho inline style khi không tiện var(--r-*). */
export const RADIUS = { r1: 6, r2: 10, r3: 14, r4: 20, full: 999 } as const;

/**
 * Bo góc đồng tâm: hình trong = hệ quả hình ngoài (luật §2d "trong = ngoài − đệm").
 * rInner = max(4, rOuter − pad). CHỈ áp khi con ôm sát mép (pad ≤ 8) — con nằm sâu
 * trong vùng nội dung thì lấy radius theo cỡ của chính nó từ thang RADIUS.
 * CSS tương đương: `border-radius: max(4px, calc(var(--r-out) - var(--pad)))`.
 */
export const concentricRadius = (rOuter: number, pad: number): number =>
  Math.max(4, rOuter - pad);
