/**
 * lib/cad/geometry.ts — PHÉP BIẾN HÌNH entity (translate / rotate / mirror) + offset.
 * Tách khỏi component để thuần & test được. Toạ độ mm, Y-up.
 */

import type { Entity, Pt } from './model';
import { newId } from './store';

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
    case 'dim':
      return { ...e, a: t(e.a), b: t(e.b) };
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
    case 'dim':
      return { ...e, a: r(e.a), b: r(e.b) };
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
  }
}

export function mirrorEntity(e: Entity, o: Pt, phi: number): Entity {
  const m = (p: Pt) => mirrorPt(p, o, phi);
  switch (e.type) {
    case 'line':
    case 'dim':
      return { ...e, a: m(e.a), b: m(e.b) };
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
  }
}

/** copy có đổi id (cho Copy/Mirror-copy). */
export function withNewId(e: Entity): Entity {
  return { ...e, id: newId('e') };
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
    case 'polyline': {
      // xấp xỉ: dời mỗi đỉnh theo pháp tuyến trung bình các cạnh kề, phía gần `side`.
      const pts = e.points;
      const out: Pt[] = pts.map((p, i) => {
        const prev = pts[i - 1] ?? (e.closed ? pts[pts.length - 1] : p);
        const next = pts[i + 1] ?? (e.closed ? pts[0] : p);
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
