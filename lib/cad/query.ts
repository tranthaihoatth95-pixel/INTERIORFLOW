/**
 * lib/cad/query.ts — SNAP + HIT-TEST. Cho toạ độ world (mm) + dung sai theo pixel.
 *
 * Nấc 2 (bắt điểm & dẫn hướng): bổ sung quadrant/node/nearest/perpendicular/tangent bên cạnh
 * endpoint/midpoint/center/intersection/grid đã có. Quadrant tách RIÊNG khỏi endpoint (trước
 * đây 4 điểm góc phần tư của circle/arc bị gộp nhầm vào "endpoint" — không đúng thuật ngữ
 * AutoCAD, sửa lại ở đây). Perpendicular/tangent cần điểm gốc `from` (điểm vừa chốt trước đó
 * trong lệnh đang vẽ — ví dụ điểm đầu của LINE) nên mới có nghĩa; không có `from` thì bỏ qua.
 */

import type { Doc, Entity, Pt } from './model';
import { dist, mid, nearestOnSeg, segIntersect, zoneBoundaryPoints, ellipseBoundaryPoints } from './model';
import type { SnapSettings } from './store';

export type SnapType =
  | 'endpoint'
  | 'midpoint'
  | 'center'
  | 'intersection'
  | 'grid'
  | 'quadrant'
  | 'node'
  | 'nearest'
  | 'perpendicular'
  | 'tangent'
  | 'none';

export interface SnapResult {
  pt: Pt;
  type: SnapType;
}

/** Điểm neo dùng cho hit-test khung chọn (idsInRect) — GIỮ quadrant trong đây (circle/arc cần
 * ít nhất các điểm biên để test trong/ngoài khung window/crossing), khác với osnap 'endpoint'
 * bên dưới (đã tách quadrant ra thành osnap riêng cho đúng thuật ngữ). */
function entEndpoints(e: Entity): Pt[] {
  switch (e.type) {
    case 'line':
    case 'dim':
      return [e.a, e.b];
    case 'polyline':
      return e.points;
    case 'rect':
      return [
        { x: e.x, y: e.y },
        { x: e.x + e.w, y: e.y },
        { x: e.x + e.w, y: e.y + e.h },
        { x: e.x, y: e.y + e.h },
      ];
    case 'circle':
    case 'arc':
      return [{ x: e.c.x + e.r, y: e.c.y }, { x: e.c.x - e.r, y: e.c.y }, { x: e.c.x, y: e.c.y + e.r }, { x: e.c.x, y: e.c.y - e.r }];
    case 'text':
      return [e.at];
    case 'block':
      return [e.at];
    case 'hatch':
      return e.points;
    case 'ellipse':
      // 4 "quadrant" theo trục local (đã xoay) — đủ cho test khung chọn window/crossing.
      return ellipseBoundaryPoints(e.c, e.rx, e.ry, e.rot ?? 0, 8);
    case 'arrow':
      return e.path;
    case 'zone':
      return zoneBoundaryPoints(e, 16);
  }
}

/** osnap ENDPOINT thật (không gồm circle/arc — dùng QUADRANT riêng cho 2 loại đó). */
function trueEndpoints(e: Entity): Pt[] {
  return e.type === 'circle' || e.type === 'arc' ? [] : entEndpoints(e);
}

function norm2pi(a: number): number {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}
function angleInSweep(ang: number, a1: number, a2: number): boolean {
  const sweep = norm2pi(a2 - a1) || Math.PI * 2;
  return norm2pi(ang - a1) <= sweep + 1e-9;
}

/** osnap QUADRANT — 4 điểm 0°/90°/180°/270° của circle; với arc chỉ tính điểm nằm trong sweep. */
function quadrantPoints(e: Entity): Pt[] {
  if (e.type !== 'circle' && e.type !== 'arc') return [];
  const pts = [
    { ang: 0, p: { x: e.c.x + e.r, y: e.c.y } },
    { ang: Math.PI / 2, p: { x: e.c.x, y: e.c.y + e.r } },
    { ang: Math.PI, p: { x: e.c.x - e.r, y: e.c.y } },
    { ang: (Math.PI * 3) / 2, p: { x: e.c.x, y: e.c.y - e.r } },
  ];
  if (e.type === 'circle') return pts.map((q) => q.p);
  return pts.filter((q) => angleInSweep(q.ang, e.a1, e.a2)).map((q) => q.p);
}

/** osnap NODE — điểm "chèn" của các entity không phải hình học thuần (text/block). Model hiện
 * chưa có entity POINT riêng nên NODE tạm dùng làm bí danh cho các điểm chèn này. */
function nodePoints(e: Entity): Pt[] {
  if (e.type === 'text' || e.type === 'block') return [e.at];
  return [];
}

/** Điểm gần nhất trên entity (dùng cho osnap NEAREST) — null nếu entity không có hình học biên rõ. */
function nearestPointOnEntity(e: Entity, world: Pt): { pt: Pt; d: number } | null {
  if (e.type === 'circle' || e.type === 'arc') {
    const ang = Math.atan2(world.y - e.c.y, world.x - e.c.x);
    if (e.type === 'arc' && !angleInSweep(ang, e.a1, e.a2)) return null;
    const pt = { x: e.c.x + e.r * Math.cos(ang), y: e.c.y + e.r * Math.sin(ang) };
    return { pt, d: dist(world, pt) };
  }
  let best: { pt: Pt; d: number } | null = null;
  for (const [a, b] of entSegments(e)) {
    const r = nearestOnSeg(world, a, b);
    if (!best || r.d < best.d) best = r;
  }
  return best;
}

/** Chân đường vuông góc hạ từ `from` xuống entity (dùng cho osnap PERPENDICULAR). */
function perpendicularPoint(e: Entity, from: Pt): Pt | null {
  if (e.type === 'circle' || e.type === 'arc') {
    const d = dist(from, e.c);
    if (d < 1e-6) return null;
    const ang = Math.atan2(from.y - e.c.y, from.x - e.c.x);
    // 2 điểm khả dĩ (gần/xa phía from) — chọn điểm nằm trong sweep (nếu arc) và gần from hơn.
    const cands = [ang, ang + Math.PI].map((a) => ({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a) }));
    const valid = cands.filter((p) => e.type === 'circle' || angleInSweep(Math.atan2(p.y - e.c.y, p.x - e.c.x), e.a1, e.a2));
    if (!valid.length) return null;
    return valid.reduce((a, b) => (dist(from, a) < dist(from, b) ? a : b));
  }
  let best: { pt: Pt; d: number } | null = null;
  for (const [a, b] of entSegments(e)) {
    const r = nearestOnSeg(from, a, b);
    if (!best || r.d < best.d) best = r;
  }
  return best?.pt ?? null;
}

/** 1-2 điểm tiếp tuyến từ `from` tới circle/arc (dùng cho osnap TANGENT). [] nếu from nằm trong
 * đường tròn (không có tiếp tuyến thật) hoặc entity không phải circle/arc. */
function tangentPoints(e: Entity, from: Pt): Pt[] {
  if (e.type !== 'circle' && e.type !== 'arc') return [];
  const d = dist(from, e.c);
  if (d <= e.r + 1e-6) return [];
  const baseAng = Math.atan2(from.y - e.c.y, from.x - e.c.x);
  const offset = Math.acos(Math.min(1, e.r / d));
  const cands = [baseAng + offset, baseAng - offset].map((a) => ({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a), ang: a }));
  return cands.filter((p) => e.type === 'circle' || angleInSweep(norm2pi(p.ang), e.a1, e.a2)).map((p) => ({ x: p.x, y: p.y }));
}

/** Phân rã 1 entity thành các đoạn thẳng (line/dim/polyline/rect/hatch). circle/arc/text/block
 * không phân rã được kiểu này (rỗng) — dùng riêng cho các phép biến đổi hình học (modify.ts). */
export function entSegments(e: Entity): [Pt, Pt][] {
  switch (e.type) {
    case 'line':
    case 'dim':
      return [[e.a, e.b]];
    case 'polyline': {
      const segs: [Pt, Pt][] = [];
      for (let i = 0; i < e.points.length - 1; i++) segs.push([e.points[i], e.points[i + 1]]);
      if (e.closed && e.points.length > 2) segs.push([e.points[e.points.length - 1], e.points[0]]);
      return segs;
    }
    case 'rect': {
      const p = [
        { x: e.x, y: e.y },
        { x: e.x + e.w, y: e.y },
        { x: e.x + e.w, y: e.y + e.h },
        { x: e.x, y: e.y + e.h },
      ];
      return [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]], [p[3], p[0]]];
    }
    case 'hatch': {
      const p = e.points;
      const segs: [Pt, Pt][] = [];
      for (let i = 0; i < p.length; i++) segs.push([p[i], p[(i + 1) % p.length]]);
      return segs;
    }
    case 'arrow': {
      const segs: [Pt, Pt][] = [];
      for (let i = 0; i < e.path.length - 1; i++) segs.push([e.path[i], e.path[i + 1]]);
      return segs;
    }
    case 'zone': {
      const p = zoneBoundaryPoints(e);
      const segs: [Pt, Pt][] = [];
      for (let i = 0; i < p.length; i++) segs.push([p[i], p[(i + 1) % p.length]]);
      return segs;
    }
    default:
      return [];
  }
}

/** Tìm điểm snap tốt nhất trong bán kính `tolMm` (mm). `from` = điểm gốc của lệnh đang thực
 * hiện (nếu có) — cần cho perpendicular/tangent (không có 2 loại này nếu thiếu `from`).
 *
 * T1 (Sprint ĐỔ NỀN 2) — priority THẬT theo từng NẤC (tier), chuẩn AutoCAD OSNAP:
 *   endpoint > intersection > center > midpoint > perpendicular/tangent > quadrant > node > nearest > grid.
 * Trước đây endpoint/quadrant/node/center/midpoint/perpendicular/tangent bị gộp chung 1 vòng
 * "ai gần con trỏ hơn thắng" (chỉ lệch nhau chút weight tie-break) và intersection lại bị đẩy
 * xuống RẤT THẤP (chỉ tính khi cả nhóm trên không ra kết quả) — sai thứ tự chuẩn. Giờ MỖI nấc
 * là 1 lượt quét riêng, trả về NGAY khi nấc đó có ứng viên trong dung sai (nấc cao hơn luôn
 * thắng nấc thấp hơn dù xa con trỏ hơn một chút) — nấc thấp chỉ được xét khi nấc cao hơn rỗng. */
export function findSnap(doc: Doc, world: Pt, tolMm: number, gridStep: number, snap: SnapSettings, from?: Pt): SnapResult {
  if (!snap.enabled) return { pt: world, type: 'none' };

  const visible = doc.entities.filter((e) => {
    const lay = doc.layers.find((l) => l.id === e.layer);
    return !lay || lay.visible;
  });

  /** Điểm gần nhất trong `pts` còn trong dung sai — null nếu rỗng. */
  const nearestOf = (pts: Pt[]): Pt | null => {
    let best: { pt: Pt; d: number } | null = null;
    for (const p of pts) {
      const d = dist(world, p);
      if (d <= tolMm && (!best || d < best.d)) best = { pt: p, d };
    }
    return best?.pt ?? null;
  };

  // Nấc 1 — endpoint
  if (snap.endpoint) {
    const pts: Pt[] = [];
    for (const e of visible) pts.push(...trueEndpoints(e));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'endpoint' };
  }

  // Nấc 2 — intersection (chỉ xét cặp segment gần con trỏ để nhẹ)
  if (snap.intersection) {
    const segs: [Pt, Pt][] = [];
    for (const e of visible) segs.push(...entSegments(e));
    const near = segs.filter(([a, b]) => nearestOnSeg(world, a, b).d < tolMm * 4);
    const xs: Pt[] = [];
    for (let i = 0; i < near.length; i++)
      for (let k = i + 1; k < near.length; k++) {
        const x = segIntersect(near[i][0], near[i][1], near[k][0], near[k][1]);
        if (x) xs.push(x);
      }
    const p = nearestOf(xs);
    if (p) return { pt: p, type: 'intersection' };
  }

  // Nấc 3 — center
  if (snap.center) {
    const pts: Pt[] = [];
    for (const e of visible) if (e.type === 'circle' || e.type === 'arc') pts.push(e.c);
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'center' };
  }

  // Nấc 4 — midpoint
  if (snap.midpoint) {
    const pts: Pt[] = [];
    for (const e of visible) for (const [a, b] of entSegments(e)) pts.push(mid(a, b));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'midpoint' };
  }

  // Nấc 5 — perpendicular/tangent (cùng nấc, nearest trong nhóm 2 loại thắng — cả 2 đều cần `from`)
  if (from && (snap.perpendicular || snap.tangent)) {
    let best: { pt: Pt; type: SnapType; d: number } | null = null;
    if (snap.perpendicular) {
      for (const e of visible) {
        const p = perpendicularPoint(e, from);
        if (!p) continue;
        const d = dist(world, p);
        if (d <= tolMm && (!best || d < best.d)) best = { pt: p, type: 'perpendicular', d };
      }
    }
    if (snap.tangent) {
      for (const e of visible)
        for (const p of tangentPoints(e, from)) {
          const d = dist(world, p);
          if (d <= tolMm && (!best || d < best.d)) best = { pt: p, type: 'tangent', d };
        }
    }
    if (best) return { pt: best.pt, type: best.type };
  }

  // Nấc 6 — quadrant
  if (snap.quadrant) {
    const pts: Pt[] = [];
    for (const e of visible) pts.push(...quadrantPoints(e));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'quadrant' };
  }

  // Nấc 7 — node
  if (snap.node) {
    const pts: Pt[] = [];
    for (const e of visible) pts.push(...nodePoints(e));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'node' };
  }

  // Nấc 8 — nearest (điểm gần nhất trên biên bất kỳ entity)
  if (snap.nearest) {
    let bn: { pt: Pt; d: number } | null = null;
    for (const e of visible) {
      const r = nearestPointOnEntity(e, world);
      if (r && (!bn || r.d < bn.d)) bn = r;
    }
    if (bn && bn.d <= tolMm) return { pt: bn.pt, type: 'nearest' };
  }

  // Nấc 9 — grid (thấp nhất)
  if (snap.grid) {
    const gp = { x: Math.round(world.x / gridStep) * gridStep, y: Math.round(world.y / gridStep) * gridStep };
    if (dist(world, gp) <= tolMm) return { pt: gp, type: 'grid' };
  }

  return { pt: world, type: 'none' };
}

/** Nối mảng điểm thành các đoạn khép kín (loop) — helper cho hit-test ellipse. */
function segsOfLoop(p: Pt[]): [Pt, Pt][] {
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i < p.length; i++) segs.push([p[i], p[(i + 1) % p.length]]);
  return segs;
}

/** Đối tượng dưới con trỏ (id) trong dung sai px→mm. null nếu không có. */
export function hitTest(doc: Doc, world: Pt, tolMm: number): string | null {
  let bestId: string | null = null;
  let bestD = tolMm;
  const consider = (id: string, d: number) => {
    if (d < bestD) {
      bestD = d;
      bestId = id;
    }
  };
  for (const e of doc.entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && (!lay.visible || lay.locked)) continue;
    switch (e.type) {
      case 'line':
      case 'dim':
        consider(e.id, nearestOnSeg(world, e.a, e.b).d);
        break;
      case 'polyline':
      case 'rect':
        for (const [a, b] of entSegments(e)) consider(e.id, nearestOnSeg(world, a, b).d);
        break;
      case 'circle':
        consider(e.id, Math.abs(dist(world, e.c) - e.r));
        break;
      case 'arc':
        consider(e.id, Math.abs(dist(world, e.c) - e.r));
        break;
      case 'text':
        consider(e.id, dist(world, e.at));
        break;
      case 'block':
        if (dist(world, e.at) < 1000) consider(e.id, dist(world, e.at) * 0.5);
        break;
      case 'hatch':
        for (const [a, b] of entSegments(e)) consider(e.id, nearestOnSeg(world, a, b).d);
        break;
      case 'ellipse':
        // xấp xỉ theo polygon 32 điểm (đủ mịn cho hit-test, không cần nghiệm giải tích).
        for (const [a, b] of segsOfLoop(ellipseBoundaryPoints(e.c, e.rx, e.ry, e.rot ?? 0, 32)))
          consider(e.id, nearestOnSeg(world, a, b).d);
        break;
      case 'arrow':
      case 'zone':
        for (const [a, b] of entSegments(e)) consider(e.id, nearestOnSeg(world, a, b).d);
        break;
    }
  }
  return bestId;
}

/** Các id nằm trong khung chọn (world rect). `window`=true: phải nằm gọn trong khung. */
export function idsInRect(doc: Doc, min: Pt, max: Pt, windowMode: boolean): string[] {
  const lo = { x: Math.min(min.x, max.x), y: Math.min(min.y, max.y) };
  const hi = { x: Math.max(min.x, max.x), y: Math.max(min.y, max.y) };
  const out: string[] = [];
  for (const e of doc.entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && (!lay.visible || lay.locked)) continue;
    const pts = entEndpoints(e);
    const inside = pts.every((p) => p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y);
    const anyIn = pts.some((p) => p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y);
    if (windowMode ? inside : anyIn) out.push(e.id);
  }
  return out;
}
