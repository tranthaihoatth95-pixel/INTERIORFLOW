/**
 * lib/cad/shape-interactions.ts — LOGIC THUẦN cho Sprint 3 / Agent C (B2 — tương tác shape).
 *
 * Không đụng store/React/DOM → test dễ (node_modules/.bin/sucrase-node), an toàn SSR.
 * CadCanvas/ShapePalette gọi các hàm ở đây rồi tự quyết định cập nhật store.
 *
 * Bao gồm:
 *  - B2.2 auto-snap to wall  (extractWallSegments, autoSnapToWall)
 *  - B2.3 resize by handle   (resizeBlockCorner — dùng chung bởi lib/cad/grips.ts)
 *  - B2.5 variant switch     (effectiveBlockSize/effectiveBlockPrims đọc đúng variant đang chọn)
 *  - B2.6 collision warning  (blockWorldCorners, polygonsOverlap, detectCollisions)
 *  - B2.7 clearance zone     (clearanceWorldPolygon)
 */

import type { Doc, Pt, BlockEntity } from './model';
import { nearestOnSeg, blockToWorld } from './model';
import { BLOCK_MAP } from './furniture';
import type { BlockDef, Prim } from './furniture';
import type { SnapAnchor, ClearanceZone } from './shared-types';

/* ───────────────────────── B2.5 — variant hiện tại ───────────────────────── */

/** Kích thước THẬT đang áp dụng cho 1 BlockEntity: variant đang chọn (nếu có) hoặc w/h gốc. */
export function effectiveBlockSize(
  entity: { block: string; variant?: string },
  blockMap: Record<string, BlockDef> = BLOCK_MAP,
): { w: number; h: number } {
  const def = blockMap[entity.block];
  if (!def) return { w: 100, h: 100 };
  if (entity.variant && def.variants) {
    const v = def.variants.find((vv) => vv.id === entity.variant);
    if (v) return { w: v.w, h: v.h };
  }
  return { w: def.w, h: def.h };
}

/** Prims THẬT đang áp dụng cho 1 BlockEntity: variant đang chọn (nếu có) hoặc prims gốc. */
export function effectiveBlockPrims(
  entity: { block: string; variant?: string },
  blockMap: Record<string, BlockDef> = BLOCK_MAP,
): Prim[] {
  const def = blockMap[entity.block];
  if (!def) return [];
  if (entity.variant && def.variants) {
    const v = def.variants.find((vv) => vv.id === entity.variant);
    if (v) return v.prims;
  }
  return def.prims;
}

/* ───────────────────────── B2.2 — auto-snap to wall ───────────────────────── */

export interface WallSegment {
  a: Pt;
  b: Pt;
}

/** Id layer tường mặc định (lib/cad/model.ts DEFAULT_LAYERS) — dùng để lọc polyline tường
 * (do lệnh WALL sinh ra, xem lib/cad/commands.ts wallChain). Entity LINE được coi là tường
 * bất kể layer nào (người dùng có thể vẽ tường tay bằng lệnh LINE). */
const WALL_LAYER_ID = 'l-wall';

/** Trích các đoạn thẳng "tường" từ Doc — nguồn cho auto-snap (B2.2). */
export function extractWallSegments(doc: Doc): WallSegment[] {
  const segs: WallSegment[] = [];
  for (const e of doc.entities) {
    if (e.type === 'line') {
      segs.push({ a: e.a, b: e.b });
    } else if (e.type === 'polyline' && e.layer === WALL_LAYER_ID) {
      for (let i = 0; i < e.points.length - 1; i++) segs.push({ a: e.points[i], b: e.points[i + 1] });
      if (e.closed && e.points.length > 2) {
        segs.push({ a: e.points[e.points.length - 1], b: e.points[0] });
      }
    }
  }
  return segs;
}

export interface AutoSnapOptions {
  blockMap?: Record<string, BlockDef>;
  /** khoảng cách tối đa (mm) để coi là "gần tường" — mặc định 300mm */
  thresholdMm?: number;
}

/**
 * B2.2 — nếu BlockEntity có anchor 'wall-back'/'wall-side' gần 1 đoạn tường (trong `thresholdMm`),
 * xoay + dịch entity để anchor đó áp sát tường (anchor.normal hướng VÀO tường sau khi snap).
 * Không có anchor phù hợp hoặc không có tường gần → trả lại nguyên `entity` (không đổi tham chiếu
 * nếu không snap được, để caller dễ so sánh `result === entity`).
 */
export function autoSnapToWall(entity: BlockEntity, doc: Doc, opts: AutoSnapOptions = {}): BlockEntity {
  const blockMap = opts.blockMap ?? BLOCK_MAP;
  const threshold = opts.thresholdMm ?? 300;
  const def = blockMap[entity.block];
  if (!def?.anchors?.length) return entity;

  const walls = extractWallSegments(doc);
  if (!walls.length) return entity;

  const candidates = def.anchors.filter((a) => a.kind === 'wall-back' || a.kind === 'wall-side');
  if (!candidates.length) return entity;

  let best: { anchor: SnapAnchor; wall: WallSegment; wallPt: Pt; d: number } | null = null;
  for (const anchor of candidates) {
    const worldAnchor = blockToWorld(anchor.pt, entity);
    for (const w of walls) {
      const { pt, d } = nearestOnSeg(worldAnchor, w.a, w.b);
      if (d <= threshold && (!best || d < best.d)) best = { anchor, wall: w, wallPt: pt, d };
    }
  }
  if (!best) return entity;

  const { anchor, wall, wallPt } = best;
  const wdx = wall.b.x - wall.a.x;
  const wdy = wall.b.y - wall.a.y;
  const wallLen = Math.hypot(wdx, wdy) || 1;
  const n1 = { x: -wdy / wallLen, y: wdx / wallLen };
  // chọn pháp tuyến CÙNG PHÍA với vị trí hiện tại của block (không đảo block sang phòng bên kia).
  const side = wdx * (entity.at.y - wall.a.y) - wdy * (entity.at.x - wall.a.x);
  const outward = side >= 0 ? n1 : { x: -n1.x, y: -n1.y };
  // anchor.normal (LOCAL) phải trỏ VÀO tường sau khi xoay ⇒ ngược hướng `outward` (outward = ra
  // phía phòng).
  const targetAngle = Math.atan2(-outward.y, -outward.x);
  const anchorAngle = Math.atan2(anchor.normal.y, anchor.normal.x);
  const rot = targetAngle - anchorAngle;

  const lx = anchor.pt.x * entity.sx;
  const ly = anchor.pt.y * entity.sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const rotatedX = lx * cos - ly * sin;
  const rotatedY = lx * sin + ly * cos;
  const at: Pt = { x: wallPt.x - rotatedX, y: wallPt.y - rotatedY };

  return { ...entity, at, rot };
}

/* ───────────────────────── B2.3 — resize by handle ───────────────────────── */

/** Thứ tự góc local giống lib/cad/grips.ts rectCorners: 0=dưới-trái,1=dưới-phải,2=trên-phải,3=trên-trái. */
const CORNER_SIGNS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

export interface ResizeOptions {
  blockMap?: Record<string, BlockDef>;
  minScale?: number;
  maxScale?: number;
}

/**
 * B2.3 — kéo góc `cornerIndex` (0-3, xem CORNER_SIGNS) của BlockEntity tới `newWorldPt` →
 * BlockEntity mới với sx/sy đổi tỉ lệ tương ứng (scale quanh TÂM `at`, giữ nguyên rot/at).
 * Giữ nguyên dấu sx/sy gốc (không tự lật gương khi kéo qua tâm).
 */
export function resizeBlockCorner(
  entity: BlockEntity,
  cornerIndex: 0 | 1 | 2 | 3,
  newWorldPt: Pt,
  opts: ResizeOptions = {},
): BlockEntity {
  const blockMap = opts.blockMap ?? BLOCK_MAP;
  const minScale = opts.minScale ?? 0.05;
  const maxScale = opts.maxScale ?? 50;
  const { w, h } = effectiveBlockSize(entity, blockMap);
  const hw = w / 2;
  const hh = h / 2;
  const [sxSign, sySign] = CORNER_SIGNS[cornerIndex];

  const dx = newWorldPt.x - entity.at.x;
  const dy = newWorldPt.y - entity.at.y;
  const cos = Math.cos(-entity.rot);
  const sin = Math.sin(-entity.rot);
  const lx = dx * cos - dy * sin; // world → local (chỉ bỏ rotation, chưa bỏ scale)
  const ly = dx * sin + dy * cos;

  const cornerLocalX = hw * sxSign;
  const cornerLocalY = hh * sySign;
  const clampAbs = (v: number) => {
    const mag = Math.max(minScale, Math.min(maxScale, Math.abs(v)));
    return v < 0 ? -mag : mag;
  };
  const newSx = cornerLocalX !== 0 ? clampAbs(lx / cornerLocalX) : entity.sx;
  const newSy = cornerLocalY !== 0 ? clampAbs(ly / cornerLocalY) : entity.sy;

  return { ...entity, sx: newSx, sy: newSy };
}

/* ───────────────────────── B2.6 — collision warning ───────────────────────── */

/** 4 góc world (rotated rect) của 1 BlockEntity — dùng cho collision (B2.6) + hit-test thô. */
export function blockWorldCorners(entity: BlockEntity, blockMap: Record<string, BlockDef> = BLOCK_MAP): Pt[] {
  const { w, h } = effectiveBlockSize(entity, blockMap);
  const hw = w / 2;
  const hh = h / 2;
  const local: Pt[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return local.map((p) => blockToWorld(p, entity));
}

function polygonAxes(poly: Pt[]): Pt[] {
  const axes: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const ex = p2.x - p1.x;
    const ey = p2.y - p1.y;
    const len = Math.hypot(ex, ey) || 1;
    axes.push({ x: -ey / len, y: ex / len });
  }
  return axes;
}

function projectPoly(poly: Pt[], axis: Pt): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    const d = p.x * axis.x + p.y * axis.y;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

/** SAT — true nếu 2 đa giác lồi (ở đây: 2 hcn có thể xoay) chồng lấn nhau. */
export function polygonsOverlap(a: Pt[], b: Pt[]): boolean {
  const axes = [...polygonAxes(a), ...polygonAxes(b)];
  for (const axis of axes) {
    const pa = projectPoly(a, axis);
    const pb = projectPoly(b, axis);
    if (pa.max < pb.min || pb.max < pa.min) return false;
  }
  return true;
}

/**
 * B2.6 — tập id các BlockEntity đang chồng lấn (bounding box THEO rotation thật, không chỉ AABB).
 * Kết quả THUẦN runtime — caller (CadCanvas) tự quyết định vẽ viền đỏ, KHÔNG lưu vào .idf.
 */
export function detectCollisions(entities: BlockEntity[], blockMap: Record<string, BlockDef> = BLOCK_MAP): Set<string> {
  const polys = entities
    .filter((e) => blockMap[e.block])
    .map((e) => ({ id: e.id, poly: blockWorldCorners(e, blockMap) }));
  const collided = new Set<string>();
  for (let i = 0; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      if (polygonsOverlap(polys[i].poly, polys[j].poly)) {
        collided.add(polys[i].id);
        collided.add(polys[j].id);
      }
    }
  }
  return collided;
}

/* ───────────────────────── B2.7 — clearance zone ───────────────────────── */

/**
 * B2.7 — 4 góc world của 1 ClearanceZone, xoay theo BlockEntity.rot (KHÔNG scale theo sx/sy —
 * đúng schema: hcn LOCAL cố định, chỉ "xoay theo block khi block xoay").
 */
export function clearanceWorldPolygon(entity: BlockEntity, zone: ClearanceZone): Pt[] {
  const corners: Pt[] = [
    { x: zone.x, y: zone.y },
    { x: zone.x + zone.w, y: zone.y },
    { x: zone.x + zone.w, y: zone.y + zone.h },
    { x: zone.x, y: zone.y + zone.h },
  ];
  const cos = Math.cos(entity.rot);
  const sin = Math.sin(entity.rot);
  return corners.map((p) => ({
    x: entity.at.x + p.x * cos - p.y * sin,
    y: entity.at.y + p.x * sin + p.y * cos,
  }));
}

/** Tất cả clearance polygon (world) của 1 BlockEntity theo BlockDef của nó — [] nếu không có. */
export function clearanceWorldPolygons(entity: BlockEntity, blockMap: Record<string, BlockDef> = BLOCK_MAP): Pt[][] {
  const def = blockMap[entity.block];
  if (!def?.clearance?.length) return [];
  return def.clearance.map((z) => clearanceWorldPolygon(entity, z));
}
