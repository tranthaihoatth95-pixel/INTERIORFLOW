/**
 * lib/cad/geometry.ts — PHÉP BIẾN HÌNH entity (translate / rotate / mirror) + offset.
 * Tách khỏi component để thuần & test được. Toạ độ mm, Y-up.
 */

import type { Entity, Pt } from './model';
import { newId } from './store';

/**
 * Sprint 5 — Việc 2 (Circle 3-điểm) + Việc 3 (Arc tâm+góc): 2 hàm hình học THUẦN, tách riêng
 * để test độc lập (không đụng store/canvas). `circumcircle` là tâm+bán kính đường tròn đi qua
 * 3 điểm bất kỳ (công thức đường tròn ngoại tiếp chuẩn) — CadCanvas.tsx tái dùng cho cả
 * Arc 3-điểm (arcFrom3) VÀ Circle 3-điểm (circle3p) để không trùng logic.
 */
export function circumcircle(p1: Pt, p2: Pt, p3: Pt): { c: Pt; r: number } | null {
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-6) return null; // 3 điểm thẳng hàng — không xác định được đường tròn
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const c = { x: ux, y: uy };
  const r = Math.hypot(ax - ux, ay - uy);
  return { c, r };
}

/**
 * Arc "tâm + góc" (Việc 3): click tâm `c` → click điểm `s` (xác định bán kính + góc bắt đầu)
 * → click điểm `e` (chỉ xác định góc kết thúc, bán kính giữ nguyên theo `s` — đúng thói quen
 * AutoCAD lệnh ARC "Center, Start, End"). Trả null nếu `s` trùng tâm (bán kính suy biến).
 */
export function arcFromCenterStartEnd(c: Pt, s: Pt, e: Pt): { c: Pt; r: number; a1: number; a2: number } | null {
  const r = Math.hypot(s.x - c.x, s.y - c.y);
  if (r < 1e-6) return null;
  const a1 = Math.atan2(s.y - c.y, s.x - c.x);
  const a2 = Math.atan2(e.y - c.y, e.x - c.x);
  return { c, r, a1, a2 };
}

export function translatePt(p: Pt, dx: number, dy: number): Pt {
  return { x: p.x + dx, y: p.y + dy };
}
export function rotatePt(p: Pt, c: Pt, ang: number): Pt {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}
/** phản chiếu p qua đường thẳng đi qua `o` với góc `phi`. */
export function mirrorPt(p: Pt, o: Pt, phi: number): Pt {
  const cos = Math.cos(-phi);
  const sin = Math.sin(-phi);
  // dời về gốc, xoay -phi, lật y, xoay phi, dời lại
  let dx = p.x - o.x;
  let dy = p.y - o.y;
  const rx = dx * cos - dy * sin;
  let ry = dx * sin + dy * cos;
  ry = -ry;
  const cos2 = Math.cos(phi);
  const sin2 = Math.sin(phi);
  dx = rx * cos2 - ry * sin2;
  dy = rx * sin2 + ry * cos2;
  return { x: o.x + dx, y: o.y + dy };
}

export function translateEntity(e: Entity, dx: number, dy: number): Entity {
  const t = (p: Pt) => translatePt(p, dx, dy);
  switch (e.type) {
    case 'line':
      return { ...e, a: t(e.a), b: t(e.b) };
    case 'dim':
      return { ...e, a: t(e.a), b: t(e.b), ...(e.c ? { c: t(e.c) } : {}) };
    case 'polyline':
      return { ...e, points: e.points.map(t) };
    case 'rect':
      return { ...e, x: e.x + dx, y: e.y + dy };
    case 'circle':
    case 'arc':
      return { ...e, c: t(e.c) };
    case 'text':
      return { ...e, at: t(e.at) };
    case 'block':
      return { ...e, at: t(e.at) };
    case 'hatch':
      return { ...e, points: e.points.map(t) };
  }
}

function rectToPolyPts(e: { x: number; y: number; w: number; h: number }): Pt[] {
  return [
    { x: e.x, y: e.y },
    { x: e.x + e.w, y: e.y },
    { x: e.x + e.w, y: e.y + e.h },
    { x: e.x, y: e.y + e.h },
  ];
}

export function rotateEntity(e: Entity, c: Pt, ang: number): Entity {
  const r = (p: Pt) => rotatePt(p, c, ang);
  switch (e.type) {
    case 'line':
      return { ...e, a: r(e.a), b: r(e.b) };
    case 'dim':
      return { ...e, a: r(e.a), b: r(e.b), ...(e.c ? { c: r(e.c) } : {}) };
    case 'polyline':
      return { ...e, points: e.points.map(r) };
    case 'rect':
      return { id: e.id, type: 'polyline', layer: e.layer, color: e.color, closed: true, points: rectToPolyPts(e).map(r) };
    case 'circle':
      return { ...e, c: r(e.c) };
    case 'arc':
      return { ...e, c: r(e.c), a1: e.a1 + ang, a2: e.a2 + ang };
    case 'text':
      return { ...e, at: r(e.at) };
    case 'block':
      return { ...e, at: r(e.at), rot: e.rot + ang };
    case 'hatch':
      return { ...e, points: e.points.map(r) };
  }
}

export function mirrorEntity(e: Entity, o: Pt, phi: number): Entity {
  const m = (p: Pt) => mirrorPt(p, o, phi);
  switch (e.type) {
    case 'line':
      return { ...e, a: m(e.a), b: m(e.b) };
    case 'dim':
      return { ...e, a: m(e.a), b: m(e.b), ...(e.c ? { c: m(e.c) } : {}) };
    case 'polyline':
      return { ...e, points: e.points.map(m) };
    case 'rect':
      return { id: e.id, type: 'polyline', layer: e.layer, color: e.color, closed: true, points: rectToPolyPts(e).map(m) };
    case 'circle':
      return { ...e, c: m(e.c) };
    case 'arc': {
      // phản chiếu đảo chiều: đổi & phản góc quanh phi
      const ma = (a: number) => 2 * phi - a;
      return { ...e, c: m(e.c), a1: ma(e.a2), a2: ma(e.a1) };
    }
    case 'text':
      return { ...e, at: m(e.at) };
    case 'block':
      return { ...e, at: m(e.at), rot: 2 * phi - e.rot, sx: -e.sx };
    case 'hatch':
      return { ...e, points: e.points.map(m) };
  }
}

/** copy có đổi id (cho Copy/Mirror-copy). */
export function withNewId(e: Entity): Entity {
  return { ...e, id: newId('e') };
}

/**
 * Sprint 4 — Copy-paste bàn phím (Ctrl+C / Ctrl+V kiểu Office/Canva), KHÁC với tool "Copy"
 * kiểu AutoCAD (geometry.ts không đổi, tool đó vẫn dùng withNewId trực tiếp + base point).
 * Đây là hàm THUẦN: nhận danh sách entity đã "chép" (clipboard nội bộ, không phải Clipboard API
 * của OS), trả về bản sao id mới dịch nhẹ (dx/dy mm, mặc định +20/+20 để thấy được là đã dán,
 * không đè hệt lên bản gốc).
 */
export function pasteEntities(entities: Entity[], dx = 20, dy = 20): Entity[] {
  return entities.map((e) => withNewId(translateEntity(e, dx, dy)));
}

/** Offset 1 entity một khoảng `d` về phía điểm `side`. Trả null nếu không hỗ trợ. */
export function offsetEntity(e: Entity, d: number, side: Pt): Entity | null {
  switch (e.type) {
    case 'line': {
      const nx = -(e.b.y - e.a.y);
      const ny = e.b.x - e.a.x;
      const len = Math.hypot(nx, ny) || 1;
      let ux = (nx / len) * d;
      let uy = (ny / len) * d;
      // chọn phía: nếu side nằm phía ngược, đảo dấu
      const mid = { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 };
      if ((side.x - mid.x) * ux + (side.y - mid.y) * uy < 0) {
        ux = -ux;
        uy = -uy;
      }
      return { ...e, id: newId('e'), a: { x: e.a.x + ux, y: e.a.y + uy }, b: { x: e.b.x + ux, y: e.b.y + uy } };
    }
    case 'circle': {
      const inside = Math.hypot(side.x - e.c.x, side.y - e.c.y) < e.r;
      const r = inside ? Math.max(1, e.r - d) : e.r + d;
      return { ...e, id: newId('e'), r };
    }
    case 'rect': {
      const inside = side.x > Math.min(e.x, e.x + e.w) && side.x < Math.max(e.x, e.x + e.w) &&
        side.y > Math.min(e.y, e.y + e.h) && side.y < Math.max(e.y, e.y + e.h);
      const s = inside ? -d : d;
      const sw = Math.sign(e.w) || 1;
      const sh = Math.sign(e.h) || 1;
      return { ...e, id: newId('e'), x: e.x - sw * s, y: e.y - sh * s, w: e.w + 2 * sw * s, h: e.h + 2 * sh * s };
    }
    case 'polyline':
    case 'hatch': {
      // xấp xỉ: dời mỗi đỉnh theo pháp tuyến trung bình các cạnh kề, phía gần `side`.
      // hatch (poché tường do WALL/ROOM sinh ra) luôn là đa giác kín (quad), khác polyline
      // chỉ có 'closed' khi người dùng bấm C — coi hatch như closed=true.
      const closed = e.type === 'hatch' ? true : e.closed;
      const pts = e.points;
      const out: Pt[] = pts.map((p, i) => {
        const prev = pts[i - 1] ?? (closed ? pts[pts.length - 1] : p);
        const next = pts[i + 1] ?? (closed ? pts[0] : p);
        let nx = -(next.y - prev.y);
        let ny = next.x - prev.x;
        const len = Math.hypot(nx, ny) || 1;
        nx /= len;
        ny /= len;
        if ((side.x - p.x) * nx + (side.y - p.y) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        return { x: p.x + nx * d, y: p.y + ny * d };
      });
      return { ...e, id: newId('e'), points: out };
    }
    default:
      return null;
  }
}
