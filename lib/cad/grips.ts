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

import type { Entity, Pt, RectEntity, BlockEntity } from './model';
import { dist } from './model';
import { effectiveBlockSize, resizeBlockCorner } from './shape-interactions';

// 'scale' — MỚI (Sprint 3, B2.3): 4 góc resize của BlockEntity (kéo để đổi sx/sy tỉ lệ).
export type GripKind = 'endpoint' | 'midpoint' | 'vertex' | 'center' | 'radius' | 'insertion' | 'scale';

/** 4 góc LOCAL của 1 BlockEntity theo w/h hiệu dụng (variant hiện tại) — dùng cho grip resize
 * (B2.3). Thứ tự khớp `resizeBlockCorner` trong lib/cad/shape-interactions.ts. */
function blockCornersWorld(e: BlockEntity): Pt[] {
  const { w, h } = effectiveBlockSize(e);
  const hw = w / 2;
  const hh = h / 2;
  const local: Pt[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  const cos = Math.cos(e.rot);
  const sin = Math.sin(e.rot);
  return local.map((p) => {
    const x = p.x * e.sx;
    const y = p.y * e.sy;
    return { x: e.at.x + x * cos - y * sin, y: e.at.y + x * sin + y * cos };
  });
}

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
      return [{ entityId: e.id, kind: 'insertion', index: 0, pt: e.at }];
    case 'block': {
      // insertion (di chuyển) + 4 góc 'scale' (B2.3 — kéo góc để đổi sx/sy tỉ lệ, xem
      // resizeBlockCorner trong lib/cad/shape-interactions.ts, dùng CHUNG bởi applyGripMove).
      const corners = blockCornersWorld(e);
      return [
        { entityId: e.id, kind: 'insertion', index: 0, pt: e.at },
        ...corners.map((pt, i): Grip => ({ entityId: e.id, kind: 'scale', index: i, pt })),
      ];
    }
    case 'hatch':
      return e.points.map((p, i) => ({ entityId: e.id, kind: 'vertex' as const, index: i, pt: p }));
    case 'ellipse': {
      // tâm (di chuyển) + 2 grip bán trục (đổi rx/ry) theo hướng trục đã xoay.
      const rot = e.rot ?? 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      return [
        { entityId: e.id, kind: 'center', index: -1, pt: e.c },
        { entityId: e.id, kind: 'radius', index: 0, pt: { x: e.c.x + e.rx * cos, y: e.c.y + e.rx * sin } },
        { entityId: e.id, kind: 'radius', index: 1, pt: { x: e.c.x - e.ry * sin, y: e.c.y + e.ry * cos } },
      ];
    }
    case 'arrow':
      return e.path.map((p, i) => ({ entityId: e.id, kind: 'vertex' as const, index: i, pt: p }));
    case 'zone': {
      if (e.polygon) return e.polygon.map((p, i) => ({ entityId: e.id, kind: 'vertex' as const, index: i, pt: p }));
      if (e.ellipse) {
        const el = e.ellipse;
        const rot = el.rot ?? 0;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        return [
          { entityId: e.id, kind: 'center', index: -1, pt: el.c },
          { entityId: e.id, kind: 'radius', index: 0, pt: { x: el.c.x + el.rx * cos, y: el.c.y + el.rx * sin } },
          { entityId: e.id, kind: 'radius', index: 1, pt: { x: el.c.x - el.ry * sin, y: el.c.y + el.ry * cos } },
        ];
      }
      return [];
    }
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
      return { ...e, at: newPt };
    case 'block':
      // B2.3 — grip 'scale' (góc) đổi sx/sy tỉ lệ; grip 'insertion' (mặc định) di chuyển như cũ.
      if (grip.kind === 'scale' && (grip.index === 0 || grip.index === 1 || grip.index === 2 || grip.index === 3)) {
        return resizeBlockCorner(e, grip.index, newPt);
      }
      return { ...e, at: newPt };
    case 'hatch': {
      const points = e.points.slice();
      points[grip.index] = newPt;
      return { ...e, points };
    }
    case 'ellipse': {
      if (grip.kind === 'center') return { ...e, c: newPt };
      // grip bán trục: index 0 = rx (chiếu lên trục local X), 1 = ry.
      const rot = e.rot ?? 0;
      const dx = newPt.x - e.c.x;
      const dy = newPt.y - e.c.y;
      if (grip.index === 0) return { ...e, rx: Math.max(1, Math.abs(dx * Math.cos(rot) + dy * Math.sin(rot))) };
      return { ...e, ry: Math.max(1, Math.abs(-dx * Math.sin(rot) + dy * Math.cos(rot))) };
    }
    case 'arrow': {
      const path = e.path.slice();
      path[grip.index] = newPt;
      return { ...e, path };
    }
    case 'zone': {
      if (e.polygon && grip.kind === 'vertex') {
        const polygon = e.polygon.slice();
        polygon[grip.index] = newPt;
        return { ...e, polygon };
      }
      if (e.ellipse) {
        const el = e.ellipse;
        if (grip.kind === 'center') return { ...e, ellipse: { ...el, c: newPt } };
        const rot = el.rot ?? 0;
        const dx = newPt.x - el.c.x;
        const dy = newPt.y - el.c.y;
        if (grip.index === 0) return { ...e, ellipse: { ...el, rx: Math.max(1, Math.abs(dx * Math.cos(rot) + dy * Math.sin(rot))) } };
        return { ...e, ellipse: { ...el, ry: Math.max(1, Math.abs(-dx * Math.sin(rot) + dy * Math.cos(rot))) } };
      }
      return e;
    }
    default:
      return e;
  }
}
