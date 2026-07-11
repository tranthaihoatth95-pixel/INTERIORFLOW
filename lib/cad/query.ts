/**
 * lib/cad/query.ts — SNAP + HIT-TEST. Cho toạ độ world (mm) + dung sai theo pixel.
 */

import type { Doc, Entity, Pt } from './model';
import { dist, mid, nearestOnSeg, segIntersect } from './model';
import type { SnapSettings } from './store';

export type SnapType = 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'grid' | 'none';

export interface SnapResult {
  pt: Pt;
  type: SnapType;
}

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
  }
}

function entSegments(e: Entity): [Pt, Pt][] {
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
    default:
      return [];
  }
}

/** Tìm điểm snap tốt nhất trong bán kính `tolMm` (mm). */
export function findSnap(doc: Doc, world: Pt, tolMm: number, gridStep: number, snap: SnapSettings): SnapResult {
  if (!snap.enabled) return { pt: world, type: 'none' };
  let best: SnapResult | null = null;
  const consider = (pt: Pt, type: SnapType, weight = 0) => {
    const d = dist(world, pt) + weight;
    if (d <= tolMm && (!best || d < dist(world, best.pt))) best = { pt, type };
  };

  const visible = doc.entities.filter((e) => {
    const lay = doc.layers.find((l) => l.id === e.layer);
    return !lay || lay.visible;
  });

  // ưu tiên: endpoint > center > midpoint > intersection > grid
  if (snap.endpoint) for (const e of visible) for (const p of entEndpoints(e)) consider(p, 'endpoint');
  if (snap.center) for (const e of visible) if (e.type === 'circle' || e.type === 'arc') consider(e.c, 'center');
  if (snap.midpoint) for (const e of visible) for (const [a, b] of entSegments(e)) consider(mid(a, b), 'midpoint', 0.5);

  if (snap.intersection && !best) {
    const segs: [Pt, Pt][] = [];
    for (const e of visible) segs.push(...entSegments(e));
    // chỉ xét cặp segment gần con trỏ để nhẹ
    const near = segs.filter(([a, b]) => nearestOnSeg(world, a, b).d < tolMm * 4);
    for (let i = 0; i < near.length; i++)
      for (let k = i + 1; k < near.length; k++) {
        const x = segIntersect(near[i][0], near[i][1], near[k][0], near[k][1]);
        if (x) consider(x, 'intersection', 0.6);
      }
  }

  if (best) return best;

  if (snap.grid) {
    const gp = { x: Math.round(world.x / gridStep) * gridStep, y: Math.round(world.y / gridStep) * gridStep };
    if (dist(world, gp) <= tolMm) return { pt: gp, type: 'grid' };
  }

  return { pt: world, type: 'none' };
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
