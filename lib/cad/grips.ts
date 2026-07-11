/**
 * lib/cad/grips.ts — GRIPS (Nấc 2): điểm nắm hiển thị khi chọn 1 entity, kéo để sửa trực tiếp.
 * Hình học THUẦN (không đụng store/React) — CadCanvas chịu trách nhiệm vẽ + bắt sự kiện kéo.
 *
 * Giới hạn đã biết (ghi rõ để không hiểu nhầm là bug):
 *  - ARC: kéo grip đầu mút chỉ đổi GÓC (a1/a2), giữ nguyên bán kính — như kim đồng hồ quay
 *    quanh tâm. AutoCAD thật cho phép đổi cả bán kính khi kéo đầu mút (dựng lại cung qua 3
 *    điểm) — phức tạp hơn, để dành nếu cần sâu hơn.
 *  - RECT: kéo 1 góc giữ trục thẳng (góc đối diện đứng yên, w/h đổi dấu tự nhiên nếu kéo qua
 *    phía bên kia) — không xoay thành hình bình hành.
 */

import type { Entity, Pt, RectEntity } from './model';
import { dist } from './model';

export type GripKind = 'endpoint' | 'midpoint' | 'vertex' | 'center' | 'radius' | 'insertion';

export interface Grip {
  entityId: string;
  kind: GripKind;
  /** chỉ số đỉnh/đầu mút (0/1 cho line.a/b hoặc arc.a1/a2; index đỉnh cho polyline/hatch/rect);
   * -1 nếu không cần (midpoint/center/insertion — chỉ có 1 điểm loại đó trên entity). */
  index: number;
  pt: Pt;
}

function rectCorners(e: RectEntity): Pt[] {
  return [
    { x: e.x, y: e.y },
    { x: e.x + e.w, y: e.y },
    { x: e.x + e.w, y: e.y + e.h },
    { x: e.x, y: e.y + e.h },
  ];
}

/** Danh sách grip của 1 entity (rỗng nếu loại không hỗ trợ — hiện tại tất cả loại đều có ít nhất 1). */
export function gripsOf(e: Entity): Grip[] {
  switch (e.type) {
    case 'line':
    case 'dim':
      return [
        { entityId: e.id, kind: 'endpoint', index: 0, pt: e.a },
        { entityId: e.id, kind: 'endpoint', index: 1, pt: e.b },
        { entityId: e.id, kind: 'midpoint', index: -1, pt: { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 } },
      ];
    case 'polyline':
      return e.points.map((p, i) => ({ entityId: e.id, kind: 'vertex' as const, index: i, pt: p }));
    case 'rect':
      return rectCorners(e).map((p, i) => ({ entityId: e.id, kind: 'vertex' as const, index: i, pt: p }));
    case 'circle':
      return [
        { entityId: e.id, kind: 'center', index: -1, pt: e.c },
        { entityId: e.id, kind: 'radius', index: 0, pt: { x: e.c.x + e.r, y: e.c.y } },
      ];
    case 'arc':
      return [
        { entityId: e.id, kind: 'center', index: -1, pt: e.c },
        { entityId: e.id, kind: 'endpoint', index: 0, pt: { x: e.c.x + e.r * Math.cos(e.a1), y: e.c.y + e.r * Math.sin(e.a1) } },
        { entityId: e.id, kind: 'endpoint', index: 1, pt: { x: e.c.x + e.r * Math.cos(e.a2), y: e.c.y + e.r * Math.sin(e.a2) } },
      ];
    case 'text':
    case 'block':
      return [{ entityId: e.id, kind: 'insertion', index: 0, pt: e.at }];
    case 'hatch':
      return e.points.map((p, i) => ({ entityId: e.id, kind: 'vertex' as const, index: i, pt: p }));
  }
}

/** Grip gần `world` nhất trong dung sai `tolMm`, null nếu không có. */
export function hitTestGrip(grips: Grip[], world: Pt, tolMm: number): Grip | null {
  let best: Grip | null = null;
  let bestD = tolMm;
  for (const g of grips) {
    const d = dist(world, g.pt);
    if (d < bestD) { bestD = d; best = g; }
  }
  return best;
}

/** Áp việc kéo 1 grip tới `newPt` → entity mới (giữ nguyên id). */
export function applyGripMove(e: Entity, grip: Grip, newPt: Pt): Entity {
  switch (e.type) {
    case 'line':
    case 'dim': {
      if (grip.kind === 'midpoint') {
        const dx = newPt.x - grip.pt.x;
        const dy = newPt.y - grip.pt.y;
        return { ...e, a: { x: e.a.x + dx, y: e.a.y + dy }, b: { x: e.b.x + dx, y: e.b.y + dy } };
      }
      return grip.index === 0 ? { ...e, a: newPt } : { ...e, b: newPt };
    }
    case 'polyline': {
      const points = e.points.slice();
      points[grip.index] = newPt;
      return { ...e, points };
    }
    case 'rect': {
      const corners = rectCorners(e);
      const opp = corners[(grip.index + 2) % 4];
      return { ...e, x: opp.x, y: opp.y, w: newPt.x - opp.x, h: newPt.y - opp.y };
    }
    case 'circle':
      if (grip.kind === 'center') return { ...e, c: newPt };
      return { ...e, r: Math.max(1, dist(newPt, e.c)) };
    case 'arc': {
      if (grip.kind === 'center') return { ...e, c: newPt };
      const ang = Math.atan2(newPt.y - e.c.y, newPt.x - e.c.x);
      return grip.index === 0 ? { ...e, a1: ang } : { ...e, a2: ang };
    }
    case 'text':
    case 'block':
      return { ...e, at: newPt };
    case 'hatch': {
      const points = e.points.slice();
      points[grip.index] = newPt;
      return { ...e, points };
    }
    default:
      return e;
  }
}
