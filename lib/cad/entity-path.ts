/**
 * lib/cad/entity-path.ts — V1 phần C (`docs/SPEC-VIDEO-MAT-BANG.md` §1.3): chuyển `Entity` hình
 * học (line/polyline/rect/circle/arc/ellipse) thành chuỗi `d` cho SVG `<path>`, dùng để vẽ-nét
 * (`stroke-dashoffset`) hoặc tô (`clip-path`) trong `DrawOnPreview`.
 *
 * Hàm THUẦN — không import React/DOM, test được bằng sucrase-node.
 *
 * Phát hiện khi đọc `commands.ts:53` `wallSegment()`: một đoạn tường thật trong code là CẶP
 * entity — `hatch` (tô đặc, 4 điểm) + `polyline` (viền, khép vòng), KHÔNG phải 1 entity dày. Vì
 * vậy `entityToStrokeD` (vẽ nét) và `entityToFillD` (tô) TÁCH RIÊNG — đúng luật §1.3 "hatch/zone
 * không vẽ nét, dùng clip-path": component gọi đúng hàm theo `entity.type`, không theo batch.
 */

import type { Entity, Pt } from './model';
import { entityLength } from './geometry';

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function ptsToD(points: Pt[], closed: boolean): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const d = [`M ${fmt(first.x)} ${fmt(first.y)}`, ...rest.map((p) => `L ${fmt(p.x)} ${fmt(p.y)}`)];
  if (closed) d.push('Z');
  return d.join(' ');
}

/** Cung tròn a1→a2 (radian, ngược kim đồng hồ, hệ Y-up — khớp `ArcEntity`) ra path 2 điểm + arc-flag. */
function arcToD(c: Pt, r: number, a1: number, a2: number): string {
  const sx = c.x + r * Math.cos(a1);
  const sy = c.y + r * Math.sin(a1);
  const ex = c.x + r * Math.cos(a2);
  const ey = c.y + r * Math.sin(a2);
  let sweep = a2 - a1;
  while (sweep < 0) sweep += Math.PI * 2;
  while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
  const largeArc = sweep > Math.PI ? 1 : 0;
  // SVG y-down: cung "ngược kim đồng hồ" trong hệ Y-up của entity ⇒ sweep-flag=0 trong hệ SVG.
  return `M ${fmt(sx)} ${fmt(sy)} A ${fmt(r)} ${fmt(r)} 0 ${largeArc} 0 ${fmt(ex)} ${fmt(ey)}`;
}

/**
 * Path để VẼ NÉT (`stroke-dasharray`/`stroke-dashoffset`) — chỉ cho entity có viền tuyến tính:
 * line/polyline/rect/circle/arc/ellipse. `null` cho entity không có khái niệm "nét" (text/dim
 * dùng kỹ thuật khác — xem §1.1; hatch/zone dùng `entityToFillD`; block không phải hình học thô).
 */
export function entityToStrokeD(entity: Entity): string | null {
  switch (entity.type) {
    case 'line':
      return ptsToD([entity.a, entity.b], false);
    case 'polyline':
      return ptsToD(entity.points, entity.closed);
    case 'rect': {
      const { x, y, w, h } = entity;
      return ptsToD([{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], true);
    }
    case 'circle':
      return arcToD(entity.c, entity.r, 0, Math.PI * 2 - 1e-6);
    case 'arc':
      return arcToD(entity.c, entity.r, entity.a1, entity.a2);
    case 'ellipse': {
      // xấp xỉ ellipse bằng path arc tròn rồi scale theo rx/ry qua transform ở component (SVG
      // <path> arc thuần không biểu diễn ellipse xoay gọn — để component đặt transform).
      return arcToD({ x: 0, y: 0 }, 1, 0, Math.PI * 2 - 1e-6);
    }
    default:
      return null;
  }
}

/**
 * Path để TÔ (`clip-path` quét) — chỉ `hatch`/`zone` (polygon). `null` nếu không có vùng khép kín
 * (VD zone dạng ellipse dùng field riêng, component tự dựng `<ellipse>`).
 */
export function entityToFillD(entity: Entity): string | null {
  if (entity.type === 'hatch') return ptsToD(entity.points, true);
  if (entity.type === 'zone' && entity.polygon) return ptsToD(entity.polygon, true);
  return null;
}

/**
 * Batching hiệu năng (§ điều kiện ra khỏi phần C): gộp nhiều entity CÙNG kỹ thuật vẽ-nét thành
 * MỘT chuỗi `d` duy nhất (nhiều subpath `M..L..`) → trình duyệt animate 1 `<path>` thay vì N,
 * giảm số node DOM/animation. Chỉ gộp entity mà `entityToStrokeD` trả về không-null.
 */
export function batchStrokeD(entities: Entity[]): string {
  return entities
    .map((e) => entityToStrokeD(e))
    .filter((d): d is string => d !== null && d.length > 0)
    .join(' ');
}

/**
 * Chiều dài nét (mm) để đặt `stroke-dasharray`/`stroke-dashoffset` — TÁI DÙNG `entityLength()`
 * (`geometry.ts:330`, đã có cho line/polyline/circle/arc), chỉ bù thêm 2 loại nó không tính
 * (rect/ellipse, trả 0 theo docstring của nó) vì `entityToStrokeD` ở trên có vẽ 2 loại này.
 */
export function strokeLength(entity: Entity): number {
  if (entity.type === 'rect') return 2 * (Math.abs(entity.w) + Math.abs(entity.h));
  if (entity.type === 'ellipse') {
    // Ramanujan xấp xỉ chu vi ellipse — đủ dùng cho dasharray (không cần chính xác tuyệt đối).
    const { rx, ry } = entity;
    const h = ((rx - ry) ** 2) / ((rx + ry) ** 2 || 1);
    return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }
  return entityLength(entity);
}

/** Tổng chiều dài của một lô entity đã gộp (dùng khi batching bật — dasharray của path ghép). */
export function batchStrokeLength(entities: Entity[]): number {
  return entities.reduce((sum, e) => sum + (entityToStrokeD(e) !== null ? strokeLength(e) : 0), 0);
}
