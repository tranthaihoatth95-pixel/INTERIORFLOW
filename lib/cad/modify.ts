/**
 * lib/cad/modify.ts — BỘ CHỈNH SỬA HÌNH HỌC (Nấc 1 của mục tiêu "tương đương AutoCAD LT").
 *
 * TRIM/EXTEND/FILLET/CHAMFER/ARRAY/SCALE/STRETCH/BREAK/JOIN/EXPLODE/LENGTHEN — hình học THUẦN
 * (không đụng store/React), test được độc lập. Quy ước ID để nơi gọi (CadCanvas) biết cách áp
 * kết quả vào store nhất quán:
 *
 *   - Phép trả về NHIỀU mảnh từ 1 đối tượng (trim/break/array-copy/explode) → mảnh mới có id MỚI
 *     (newId). Nơi gọi: removeIds([bản gốc]) rồi addEntities(mảnh mới).
 *   - Phép sửa 1-đối-tượng-1-kết-quả (extend/lengthen) → GIỮ NGUYÊN id gốc. Nơi gọi:
 *     updateEntities([kết quả]).
 *   - Fillet/Chamfer: 2 đường vào giữ NGUYÊN id (đã bị cắt/kéo dài đến điểm tiếp tuyến) — dùng
 *     updateEntities; cung/đoạn nối là entity MỚI — dùng addEntity.
 *   - Scale/Stretch (áp lên tập chọn tại chỗ) → giữ NGUYÊN id — dùng updateEntities.
 *   - Join → xoá 2 đối tượng gốc, entity gộp là MỚI.
 *
 * Toạ độ mm, hệ Y-up (khớp model.ts). Góc arc: radian, CCW, a1→a2.
 */

import type { Entity, LineEntity, ArcEntity, CircleEntity, PolylineEntity, Pt } from './model';
import { dist } from './model';
import { newId } from './store';
import { entSegments } from './query';
import { translateEntity, rotateEntity, rotatePt, withNewId } from './geometry';
import { BLOCK_MAP, type Prim } from './furniture';

/* ───────────────────────── tiện ích góc/vector ───────────────────────── */

function norm2pi(a: number): number {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/** true nếu góc `ang` nằm trong cung quét CCW từ a1 → a2. */
export function angleInSweep(ang: number, a1: number, a2: number): boolean {
  const sweep = norm2pi(a2 - a1) || Math.PI * 2;
  const d = norm2pi(ang - a1);
  return d <= sweep + 1e-9;
}

function normalize(v: Pt): Pt {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
}

function pushUnique(arr: number[], v: number, eps = 1e-7) {
  if (!arr.some((x) => Math.abs(x - v) < eps)) arr.push(v);
}

/* ───────────────────────── giao hình học cơ bản ───────────────────────── */

/** Giao 2 đường thẳng VÔ HẠN qua (a1,a2) và (b1,b2). t/u = tham số trên mỗi đường (không kẹp). */
export function infiniteLineIntersect(a1: Pt, a2: Pt, b1: Pt, b2: Pt): { pt: Pt; t: number; u: number } | null {
  const r = { x: a2.x - a1.x, y: a2.y - a1.y };
  const s = { x: b2.x - b1.x, y: b2.y - b1.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((b1.x - a1.x) * s.y - (b1.y - a1.y) * s.x) / denom;
  const u = ((b1.x - a1.x) * r.y - (b1.y - a1.y) * r.x) / denom;
  return { pt: { x: a1.x + t * r.x, y: a1.y + t * r.y }, t, u };
}

/** Giao đường thẳng (a→b, tham số t không kẹp) với đường tròn tâm c bán kính r. 0/1/2 nghiệm. */
export function lineCircleIntersect(a: Pt, b: Pt, c: Pt, r: number): { t: number; pt: Pt }[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - c.x;
  const fy = a.y - c.y;
  const A = dx * dx + dy * dy;
  if (A < 1e-12) return [];
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return [];
  const sq = Math.sqrt(Math.max(0, disc));
  const mk = (t: number) => ({ t, pt: { x: a.x + t * dx, y: a.y + t * dy } });
  if (disc < 1e-9) return [mk(-B / (2 * A))];
  return [mk((-B - sq) / (2 * A)), mk((-B + sq) / (2 * A))];
}

/** Giao 2 đường tròn. 0/1/2 điểm. */
export function circleCircleIntersect(c1: Pt, r1: number, c2: Pt, r2: number): Pt[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9 || d > r1 + r2 + 1e-6 || d < Math.abs(r1 - r2) - 1e-6) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const xm = c1.x + (a * dx) / d;
  const ym = c1.y + (a * dy) / d;
  if (h < 1e-9) return [{ x: xm, y: ym }];
  const rx = -dy * (h / d);
  const ry = dx * (h / d);
  return [{ x: xm + rx, y: ym + ry }, { x: xm - rx, y: ym - ry }];
}

/** Tham số t (trên đường a→b, KHÔNG kẹp [0,1]) tại các giao điểm với `cutter` (kẹp theo biên
 * riêng của cutter: đoạn/polyline/rect chỉ tính nếu giao nằm trong đoạn đó; circle/arc theo vòng
 * tròn/cung của nó). Dùng chung cho TRIM (kẹp t∈(0,1) ở nơi gọi) và EXTEND (không kẹp). */
function lineCutParams(a: Pt, b: Pt, cutter: Entity): number[] {
  const out: number[] = [];
  if (cutter.type === 'circle') {
    for (const s of lineCircleIntersect(a, b, cutter.c, cutter.r)) out.push(s.t);
  } else if (cutter.type === 'arc') {
    for (const s of lineCircleIntersect(a, b, cutter.c, cutter.r)) {
      const ang = Math.atan2(s.pt.y - cutter.c.y, s.pt.x - cutter.c.x);
      if (angleInSweep(ang, cutter.a1, cutter.a2)) out.push(s.t);
    }
  } else {
    for (const [p, q] of entSegments(cutter)) {
      const r = infiniteLineIntersect(a, b, p, q);
      if (r && r.u >= -1e-6 && r.u <= 1 + 1e-6) out.push(r.t);
    }
  }
  return out;
}

/** Góc (radian tuyệt đối) tại các giao điểm của `cutter` với đường tròn tâm c bán kính r. */
function curveCutAngles(c: Pt, r: number, cutter: Entity): number[] {
  const angFor = (pt: Pt) => Math.atan2(pt.y - c.y, pt.x - c.x);
  if (cutter.type === 'circle') return circleCircleIntersect(c, r, cutter.c, cutter.r).map(angFor);
  if (cutter.type === 'arc') {
    return circleCircleIntersect(c, r, cutter.c, cutter.r)
      .filter((pt) => angleInSweep(angFor(pt), cutter.a1, cutter.a2))
      .map(angFor);
  }
  const out: number[] = [];
  for (const [p, q] of entSegments(cutter)) {
    for (const s of lineCircleIntersect(p, q, c, r)) {
      if (s.t >= -1e-6 && s.t <= 1 + 1e-6) out.push(angFor(s.pt));
    }
  }
  return out;
}

/* ───────────────────────── TRIM (TR) ───────────────────────── */

/** Cắt đoạn LINE tại các giao điểm với `cutters`, giữ lại phần KHÔNG chứa `pick`. null nếu
 * không có giao điểm nào trong đoạn (không có gì để cắt). */
export function trimLine(line: LineEntity, cutters: Entity[], pick: Pt): LineEntity[] | null {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const len2 = dx * dx + dy * dy || 1;
  const ts: number[] = [];
  for (const c of cutters) {
    if (c.id === line.id) continue;
    for (const t of lineCutParams(line.a, line.b, c)) if (t > 1e-6 && t < 1 - 1e-6) pushUnique(ts, t);
  }
  if (!ts.length) return null;
  ts.sort((x, y) => x - y);
  const pickT = ((pick.x - line.a.x) * dx + (pick.y - line.a.y) * dy) / len2;
  let low = 0;
  let high = 1;
  for (const t of ts) if (t <= pickT) low = t;
  for (const t of ts) if (t > pickT) { high = t; break; }
  const pt = (t: number): Pt => ({ x: line.a.x + t * dx, y: line.a.y + t * dy });
  const out: LineEntity[] = [];
  if (low > 1e-9) out.push({ ...line, id: newId('e'), a: line.a, b: pt(low) });
  if (high < 1 - 1e-9) out.push({ ...line, id: newId('e'), a: pt(high), b: line.b });
  return out.length ? out : null;
}

/** Cắt ARC — tương tự trimLine nhưng tham số hoá theo góc quét (0..sweep). */
export function trimArc(arc: ArcEntity, cutters: Entity[], pick: Pt): ArcEntity[] | null {
  const sweepTotal = norm2pi(arc.a2 - arc.a1) || Math.PI * 2;
  const sws: number[] = [];
  for (const c of cutters) {
    if (c.id === arc.id) continue;
    for (const ang of curveCutAngles(arc.c, arc.r, c)) {
      if (!angleInSweep(ang, arc.a1, arc.a2)) continue;
      const sw = norm2pi(ang - arc.a1);
      if (sw > 1e-6 && sw < sweepTotal - 1e-6) pushUnique(sws, sw);
    }
  }
  if (!sws.length) return null;
  sws.sort((x, y) => x - y);
  const pickSw = norm2pi(Math.atan2(pick.y - arc.c.y, pick.x - arc.c.x) - arc.a1);
  let low = 0;
  let high = sweepTotal;
  for (const sw of sws) if (sw <= pickSw) low = sw;
  for (const sw of sws) if (sw > pickSw) { high = sw; break; }
  const out: ArcEntity[] = [];
  if (low > 1e-9) out.push({ ...arc, id: newId('e'), a1: arc.a1, a2: arc.a1 + low });
  if (high < sweepTotal - 1e-9) out.push({ ...arc, id: newId('e'), a1: arc.a1 + high, a2: arc.a2 });
  return out.length ? out : null;
}

/** Cắt CIRCLE — vòng tròn không có mốc đầu/cuối cố định nên cần ≥2 giao điểm; kết quả là 1 ARC
 * (phần còn lại, phía không chứa pick). null nếu <2 giao điểm. */
export function trimCircle(circle: CircleEntity, cutters: Entity[], pick: Pt): ArcEntity | null {
  const angs: number[] = [];
  for (const c of cutters) {
    if (c.id === circle.id) continue;
    for (const ang of curveCutAngles(circle.c, circle.r, c)) pushUnique(angs, norm2pi(ang));
  }
  if (angs.length < 2) return null;
  angs.sort((x, y) => x - y);
  const pickAng = norm2pi(Math.atan2(pick.y - circle.c.y, pick.x - circle.c.x));
  let lowIdx = -1;
  for (let i = 0; i < angs.length; i++) if (angs[i] <= pickAng) lowIdx = i;
  const low = lowIdx === -1 ? angs[angs.length - 1] - Math.PI * 2 : angs[lowIdx];
  const highIdx = (lowIdx + 1) % angs.length;
  const high = lowIdx === -1 ? angs[0] : highIdx === 0 ? angs[0] + Math.PI * 2 : angs[highIdx];
  // phần bị xoá = (low,high) chứa pick; phần còn lại = cung từ high vòng đến low+2π
  return { id: newId('e'), type: 'arc', layer: circle.layer, color: circle.color, c: circle.c, r: circle.r, a1: high, a2: low + Math.PI * 2 };
}

/** TRIM tổng quát — điều phối theo loại entity. Trả về entity MỚI thay thế (removeIds bản gốc). */
export function trimEntity(target: Entity, cutters: Entity[], pick: Pt): Entity[] | null {
  if (target.type === 'line') return trimLine(target, cutters, pick);
  if (target.type === 'arc') return trimArc(target, cutters, pick);
  if (target.type === 'circle') {
    const r = trimCircle(target, cutters, pick);
    return r ? [r] : null;
  }
  return null; // polyline/rect/block/text/dim/hatch: chưa hỗ trợ trim trực tiếp (xem docs/CAD-LT.md)
}

/* ───────────────────────── EXTEND (EX) ───────────────────────── */

/** Kéo dài đầu LINE gần `pick` tới biên gần nhất trong `boundaries`. Giữ NGUYÊN id. */
export function extendLine(line: LineEntity, boundaries: Entity[], pick: Pt): LineEntity | null {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const len2 = dx * dx + dy * dy || 1;
  const pickT = ((pick.x - line.a.x) * dx + (pick.y - line.a.y) * dy) / len2;
  const extendB = pickT > 0.5;
  let best: number | null = null;
  for (const c of boundaries) {
    if (c.id === line.id) continue;
    for (const t of lineCutParams(line.a, line.b, c)) {
      if (extendB && t > 1 + 1e-6) { if (best === null || t < best) best = t; }
      if (!extendB && t < -1e-6) { if (best === null || t > best) best = t; }
    }
  }
  if (best === null) return null;
  const pt: Pt = { x: line.a.x + best * dx, y: line.a.y + best * dy };
  return extendB ? { ...line, b: pt } : { ...line, a: pt };
}

/** Kéo dài đầu ARC (a1 hoặc a2, đầu gần `pick`) tới biên gần nhất theo góc quét. */
export function extendArc(arc: ArcEntity, boundaries: Entity[], pick: Pt): ArcEntity | null {
  const ptA = { x: arc.c.x + arc.r * Math.cos(arc.a1), y: arc.c.y + arc.r * Math.sin(arc.a1) };
  const ptB = { x: arc.c.x + arc.r * Math.cos(arc.a2), y: arc.c.y + arc.r * Math.sin(arc.a2) };
  const extendEndB = dist(pick, ptB) <= dist(pick, ptA);
  const sweepTotal = norm2pi(arc.a2 - arc.a1) || Math.PI * 2;
  let best: number | null = null; // độ mở rộng thêm (dương)
  for (const c of boundaries) {
    if (c.id === arc.id) continue;
    for (const ang of curveCutAngles(arc.c, arc.r, c)) {
      if (extendEndB) {
        const extra = norm2pi(ang - arc.a2);
        // chỉ hợp lệ nếu điểm nằm NGOÀI cung hiện tại (không phải bị trim ở giữa)
        if (extra > 1e-6 && norm2pi(ang - arc.a1) > sweepTotal - 1e-6) {
          if (best === null || extra < best) best = extra;
        }
      } else {
        const extra = norm2pi(arc.a1 - ang);
        if (extra > 1e-6 && norm2pi(ang - arc.a1) > sweepTotal - 1e-6) {
          if (best === null || extra < best) best = extra;
        }
      }
    }
  }
  if (best === null) return null;
  return extendEndB ? { ...arc, a2: arc.a2 + best } : { ...arc, a1: arc.a1 - best };
}

/** EXTEND tổng quát. */
export function extendEntity(target: Entity, boundaries: Entity[], pick: Pt): Entity | null {
  if (target.type === 'line') return extendLine(target, boundaries, pick);
  if (target.type === 'arc') return extendArc(target, boundaries, pick);
  return null;
}

/* ───────────────────────── FILLET (F) & CHAMFER (CHA) ───────────────────────── */

export interface FilletResult {
  line1: LineEntity;
  line2: LineEntity;
  arc: ArcEntity | null;
}

/**
 * Bo góc 2 đường thẳng bán kính `radius` (0 = chỉ cắt/kéo dài cho vuông góc, không cung).
 * `pick1`/`pick2` = điểm click gần đó trên mỗi đường — xác định đầu nào GIỮ NGUYÊN (đầu gần
 * pick), đầu còn lại bị thay bằng điểm tiếp tuyến. null nếu 2 đường song song.
 */
export function filletTwoLines(l1: LineEntity, l2: LineEntity, radius: number, pick1: Pt, pick2: Pt): FilletResult | null {
  const P = infiniteLineIntersect(l1.a, l1.b, l2.a, l2.b);
  if (!P) return null;
  const keep1 = dist(l1.a, pick1) <= dist(l1.b, pick1) ? l1.a : l1.b;
  const keep2 = dist(l2.a, pick2) <= dist(l2.b, pick2) ? l2.a : l2.b;
  const dir1 = normalize({ x: keep1.x - P.pt.x, y: keep1.y - P.pt.y });
  const dir2 = normalize({ x: keep2.x - P.pt.x, y: keep2.y - P.pt.y });

  if (radius <= 1e-6) {
    return { line1: { ...l1, a: keep1, b: P.pt }, line2: { ...l2, a: keep2, b: P.pt }, arc: null };
  }

  const dot = Math.max(-1, Math.min(1, dir1.x * dir2.x + dir1.y * dir2.y));
  const theta = Math.acos(dot);
  if (theta < 1e-4 || theta > Math.PI - 1e-4) return null; // gần song song/thẳng hàng

  const L = radius / Math.tan(theta / 2);
  const T1 = { x: P.pt.x + dir1.x * L, y: P.pt.y + dir1.y * L };
  const T2 = { x: P.pt.x + dir2.x * L, y: P.pt.y + dir2.y * L };
  const bis = normalize({ x: dir1.x + dir2.x, y: dir1.y + dir2.y });
  const distC = radius / Math.sin(theta / 2);
  const center = { x: P.pt.x + bis.x * distC, y: P.pt.y + bis.y * distC };

  const angT1 = Math.atan2(T1.y - center.y, T1.x - center.x);
  const angT2 = Math.atan2(T2.y - center.y, T2.x - center.x);
  const target = Math.PI - theta; // góc chắn cung = π − góc giữa 2 hướng giữ
  const fwd = norm2pi(angT2 - angT1);
  const bwd = norm2pi(angT1 - angT2);
  const arc: ArcEntity =
    Math.abs(fwd - target) <= Math.abs(bwd - target)
      ? { id: newId('e'), type: 'arc', layer: l1.layer, color: l1.color, c: center, r: radius, a1: angT1, a2: angT2 }
      : { id: newId('e'), type: 'arc', layer: l1.layer, color: l1.color, c: center, r: radius, a1: angT2, a2: angT1 };

  return { line1: { ...l1, a: keep1, b: T1 }, line2: { ...l2, a: keep2, b: T2 }, arc };
}

export interface ChamferResult {
  line1: LineEntity;
  line2: LineEntity;
  connector: LineEntity;
}

/** Vát góc 2 đường thẳng, khoảng cách d1/d2 tính từ giao điểm dọc mỗi đường (khác nhau → vát lệch). */
export function chamferTwoLines(l1: LineEntity, l2: LineEntity, d1: number, d2: number, pick1: Pt, pick2: Pt): ChamferResult | null {
  const P = infiniteLineIntersect(l1.a, l1.b, l2.a, l2.b);
  if (!P) return null;
  const keep1 = dist(l1.a, pick1) <= dist(l1.b, pick1) ? l1.a : l1.b;
  const keep2 = dist(l2.a, pick2) <= dist(l2.b, pick2) ? l2.a : l2.b;
  const dir1 = normalize({ x: keep1.x - P.pt.x, y: keep1.y - P.pt.y });
  const dir2 = normalize({ x: keep2.x - P.pt.x, y: keep2.y - P.pt.y });
  const T1 = { x: P.pt.x + dir1.x * d1, y: P.pt.y + dir1.y * d1 };
  const T2 = { x: P.pt.x + dir2.x * d2, y: P.pt.y + dir2.y * d2 };
  return {
    line1: { ...l1, a: keep1, b: T1 },
    line2: { ...l2, a: keep2, b: T2 },
    connector: { id: newId('e'), type: 'line', layer: l1.layer, color: l1.color, a: T1, b: T2 },
  };
}

/* ───────────────────────── ARRAY (AR) ───────────────────────── */

/** Mảng chữ nhật rows×cols, bước dx/dy (mm). KHÔNG bao gồm bản gốc (r=0,c=0 bị bỏ qua). */
export function arrayRect(entities: Entity[], rows: number, cols: number, dx: number, dy: number): Entity[] {
  const out: Entity[] = [];
  for (let r = 0; r < Math.max(1, rows); r++) {
    for (let c = 0; c < Math.max(1, cols); c++) {
      if (r === 0 && c === 0) continue;
      for (const e of entities) out.push(translateEntity(withNewId(e), c * dx, r * dy));
    }
  }
  return out;
}

function rotatePositionOnly(e: Entity, c: Pt, ang: number): Entity {
  // Với block/text: chỉ xoay VỊ TRÍ quanh tâm mảng, giữ nguyên hướng bản thân (rotateItems=false).
  // line/polyline/rect/circle/arc/hatch/dim là hình học thuần → xoay toàn phần vẫn cho cùng
  // kết quả hình học nên dùng luôn rotateEntity.
  if (e.type === 'block') return { ...e, at: rotatePt(e.at, c, ang) };
  if (e.type === 'text') return { ...e, at: rotatePt(e.at, c, ang) };
  return rotateEntity(e, c, ang);
}

/**
 * Mảng tròn quanh `center`, `count` bản (kể cả gốc — hàm chỉ trả về count-1 bản SAO chép mới),
 * `totalAngleDeg` tổng góc quét (360 = đầy vòng, chia đều count phần; khác 360 → chia count-1
 * khoảng). `rotateItems` = true: mỗi bản tự xoay theo (chuẩn ARRAYPOLAR); false: chỉ đổi vị trí.
 */
export function arrayPolar(entities: Entity[], center: Pt, count: number, totalAngleDeg: number, rotateItems = true): Entity[] {
  const out: Entity[] = [];
  if (count < 2) return out;
  const full = Math.abs(Math.abs(totalAngleDeg) - 360) < 1e-6;
  const stepDeg = totalAngleDeg / (full ? count : count - 1);
  for (let i = 1; i < count; i++) {
    const ang = (stepDeg * i * Math.PI) / 180;
    for (const e of entities) {
      const cloned = withNewId(e);
      out.push(rotateItems ? rotateEntity(cloned, center, ang) : rotatePositionOnly(cloned, center, ang));
    }
  }
  return out;
}

/* ───────────────────────── SCALE (SC) ───────────────────────── */

export function scalePt(p: Pt, base: Pt, f: number): Pt {
  return { x: base.x + (p.x - base.x) * f, y: base.y + (p.y - base.y) * f };
}

/** Scale 1 entity quanh điểm `base` (khác store.ts scaleAll — luôn quanh gốc toạ độ). Giữ id. */
export function scaleEntityAbout(e: Entity, base: Pt, f: number): Entity {
  const s = (p: Pt) => scalePt(p, base, f);
  switch (e.type) {
    case 'line':
    case 'dim':
      return { ...e, a: s(e.a), b: s(e.b) };
    case 'polyline':
      return { ...e, points: e.points.map(s) };
    case 'rect':
      return { ...e, x: base.x + (e.x - base.x) * f, y: base.y + (e.y - base.y) * f, w: e.w * f, h: e.h * f };
    case 'circle':
      return { ...e, c: s(e.c), r: e.r * f };
    case 'arc':
      return { ...e, c: s(e.c), r: e.r * f };
    case 'text':
      return { ...e, at: s(e.at), h: e.h * f };
    case 'block':
      return { ...e, at: s(e.at), sx: e.sx * f, sy: e.sy * f };
    case 'hatch':
      return { ...e, points: e.points.map(s) };
  }
}

export function scaleEntitiesAbout(entities: Entity[], base: Pt, f: number): Entity[] {
  return entities.map((e) => scaleEntityAbout(e, base, f));
}

/** Tính hệ số scale kiểu "Reference": base→refPt là chiều dài THAM CHIẾU, base→newPt là chiều
 * dài MỚI mong muốn. Dùng cho lệnh SC với tuỳ chọn Reference (R) của AutoCAD. */
export function scaleFactorFromReference(base: Pt, refPt: Pt, newPt: Pt): number {
  const d0 = dist(base, refPt) || 1;
  return dist(base, newPt) / d0;
}

/* ───────────────────────── STRETCH (S) ───────────────────────── */

export interface StretchWindow {
  min: Pt;
  max: Pt;
}

function inWindow(p: Pt, w: StretchWindow): boolean {
  const lo = { x: Math.min(w.min.x, w.max.x), y: Math.min(w.min.y, w.max.y) };
  const hi = { x: Math.max(w.min.x, w.max.x), y: Math.max(w.min.y, w.max.y) };
  return p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y;
}

/**
 * Stretch 1 entity: CHỈ dời các điểm neo nằm trong khung `w` (crossing window) đi (dx,dy); điểm
 * ngoài khung đứng yên. Line có 1 đầu trong khung → kéo dãn; cả 2 đầu trong khung → cả line dời
 * (như move). Circle/arc/text/block chỉ có 1 điểm neo (tâm/gốc) nên dời cả khối nếu neo đó nằm
 * trong khung — đúng hành vi STRETCH gốc của AutoCAD với các đối tượng không có "vertex" phụ.
 * Rect → quy về polyline (góc lệch khi chỉ 1 góc bị kéo, không còn là hình chữ nhật trục thẳng).
 */
export function stretchEntity(e: Entity, w: StretchWindow, dx: number, dy: number): Entity {
  const mv = (p: Pt): Pt => (inWindow(p, w) ? { x: p.x + dx, y: p.y + dy } : p);
  switch (e.type) {
    case 'line':
    case 'dim':
      return { ...e, a: mv(e.a), b: mv(e.b) };
    case 'polyline':
      return { ...e, points: e.points.map(mv) };
    case 'rect': {
      const pts = entSegments(e).map(([p]) => p); // 4 góc theo thứ tự
      return { id: e.id, type: 'polyline', layer: e.layer, color: e.color, closed: true, points: pts.map(mv) };
    }
    case 'circle':
      return { ...e, c: mv(e.c) };
    case 'arc':
      return { ...e, c: mv(e.c) };
    case 'text':
      return { ...e, at: mv(e.at) };
    case 'block':
      return { ...e, at: mv(e.at) };
    case 'hatch':
      return { ...e, points: e.points.map(mv) };
  }
}

export function stretchEntities(entities: Entity[], w: StretchWindow, dx: number, dy: number): Entity[] {
  return entities.map((e) => stretchEntity(e, w, dx, dy));
}

/* ───────────────────────── BREAK (BR) ───────────────────────── */

/** Bẻ LINE tại 1 điểm (p2 mặc định = p1, bẻ không khoảng hở) hoặc 2 điểm (xoá đoạn giữa).
 * Trả về mảng (0/1/2 phần tử) entity MỚI thay bản gốc. */
export function breakLineAt(e: LineEntity, p1: Pt, p2: Pt = p1): LineEntity[] {
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len2 = dx * dx + dy * dy || 1;
  const tOf = (p: Pt) => Math.max(0, Math.min(1, ((p.x - e.a.x) * dx + (p.y - e.a.y) * dy) / len2));
  let t1 = tOf(p1);
  let t2 = tOf(p2);
  if (t1 > t2) [t1, t2] = [t2, t1];
  const pt = (t: number): Pt => ({ x: e.a.x + t * dx, y: e.a.y + t * dy });
  const out: LineEntity[] = [];
  if (t1 > 1e-9) out.push({ ...e, id: newId('e'), a: e.a, b: pt(t1) });
  if (t2 < 1 - 1e-9) out.push({ ...e, id: newId('e'), a: pt(t2), b: e.b });
  return out;
}

/** Bẻ ARC tại 1 hoặc 2 điểm — tương tự breakLineAt nhưng theo góc quét. */
export function breakArcAt(e: ArcEntity, p1: Pt, p2: Pt = p1): ArcEntity[] {
  const total = norm2pi(e.a2 - e.a1) || Math.PI * 2;
  const swOf = (p: Pt) => Math.max(0, Math.min(total, norm2pi(Math.atan2(p.y - e.c.y, p.x - e.c.x) - e.a1)));
  let sw1 = swOf(p1);
  let sw2 = swOf(p2);
  if (sw1 > sw2) [sw1, sw2] = [sw2, sw1];
  const out: ArcEntity[] = [];
  if (sw1 > 1e-9) out.push({ ...e, id: newId('e'), a1: e.a1, a2: e.a1 + sw1 });
  if (sw2 < total - 1e-9) out.push({ ...e, id: newId('e'), a1: e.a1 + sw2, a2: e.a2 });
  return out;
}

/** BREAK tổng quát. */
export function breakEntity(target: Entity, p1: Pt, p2: Pt = p1): Entity[] | null {
  if (target.type === 'line') return breakLineAt(target, p1, p2);
  if (target.type === 'arc') return breakArcAt(target, p1, p2);
  return null;
}

/* ───────────────────────── JOIN (J) ───────────────────────── */

function collinear(a1: Pt, a2: Pt, b1: Pt, b2: Pt, eps = 1e-2): boolean {
  const cross = (p: Pt, q: Pt, r: Pt) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const len = dist(a1, a2) || 1;
  return Math.abs(cross(a1, a2, b1)) / len < eps && Math.abs(cross(a1, a2, b2)) / len < eps;
}

function joinLines(l1: LineEntity, l2: LineEntity): LineEntity | null {
  if (!collinear(l1.a, l1.b, l2.a, l2.b)) return null;
  const pts = [l1.a, l1.b, l2.a, l2.b];
  let best: [Pt, Pt] = [pts[0], pts[1]];
  let bestD = dist(pts[0], pts[1]);
  for (let i = 0; i < 4; i++) {
    for (let k = i + 1; k < 4; k++) {
      const d = dist(pts[i], pts[k]);
      if (d > bestD) { bestD = d; best = [pts[i], pts[k]]; }
    }
  }
  return { id: newId('e'), type: 'line', layer: l1.layer, color: l1.color, a: best[0], b: best[1] };
}

function joinArcs(a: ArcEntity, b: ArcEntity): ArcEntity | null {
  if (dist(a.c, b.c) > 1e-1 || Math.abs(a.r - b.r) > 1e-1) return null; // không cùng đường tròn
  const eps = 1e-2;
  const sa = norm2pi(a.a2 - a.a1) || Math.PI * 2;
  const sb = norm2pi(b.a2 - b.a1) || Math.PI * 2;
  if (Math.abs(norm2pi(b.a1 - a.a2)) < eps) return { ...a, id: newId('e'), a2: a.a1 + sa + sb };
  if (Math.abs(norm2pi(a.a1 - b.a2)) < eps) return { ...a, id: newId('e'), a1: b.a1, a2: b.a1 + sb + sa };
  return null; // 2 cung không tiếp giáp đầu-cuối
}

function ptsOf(e: Entity): Pt[] | null {
  if (e.type === 'line') return [e.a, e.b];
  if (e.type === 'polyline' && !e.closed) return e.points;
  return null;
}

function mkPoly(ref: Entity, points: Pt[]): PolylineEntity {
  return { id: newId('e'), type: 'polyline', layer: ref.layer, color: ref.color, closed: false, points };
}

function joinIntoPolyline(a: Entity, b: Entity): PolylineEntity | null {
  const pa = ptsOf(a);
  const pb = ptsOf(b);
  if (!pa || !pb) return null;
  const eps = 1e-1;
  const eq = (p: Pt, q: Pt) => dist(p, q) < eps;
  if (eq(pa[pa.length - 1], pb[0])) return mkPoly(a, [...pa, ...pb.slice(1)]);
  if (eq(pa[pa.length - 1], pb[pb.length - 1])) return mkPoly(a, [...pa, ...pb.slice(0, -1).reverse()]);
  if (eq(pa[0], pb[pb.length - 1])) return mkPoly(a, [...pb, ...pa.slice(1)]);
  if (eq(pa[0], pb[0])) return mkPoly(a, [...pa.slice().reverse(), ...pb.slice(1)]);
  return null;
}

/** JOIN 2 entity (line+line thẳng hàng → 1 line; arc+arc cùng tâm/bán kính tiếp giáp → 1 arc;
 * line/polyline hở có đầu chung → 1 polyline). null nếu không nối được. */
export function joinEntities(a: Entity, b: Entity): Entity | null {
  if (a.type === 'line' && b.type === 'line') {
    return joinLines(a, b) ?? joinIntoPolyline(a, b);
  }
  if (a.type === 'arc' && b.type === 'arc') return joinArcs(a, b);
  return joinIntoPolyline(a, b);
}

/* ───────────────────────── EXPLODE (X) ───────────────────────── */

function blockLocalToWorld(lp: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = lp.x * sx;
  const y = lp.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

/** EXPLODE — polyline/rect → LINE rời từng cạnh; block → primitive thật (line/poly/circle/arc)
 * ở toạ độ world. Entity không phân rã được (line/circle/arc/text/dim/hatch đơn) → trả nguyên bản. */
export function explodeEntity(e: Entity): Entity[] {
  switch (e.type) {
    case 'polyline':
    case 'rect':
      return entSegments(e).map(([p, q]) => ({ id: newId('e'), type: 'line', layer: e.layer, color: e.color, a: p, b: q }));
    case 'block': {
      const def = BLOCK_MAP[e.block];
      if (!def) return [];
      const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
      const out: Entity[] = [];
      for (const prim of def.prims as Prim[]) {
        if (prim.k === 'line') out.push({ id: newId('e'), type: 'line', layer: e.layer, color: e.color, a: tf(prim.a), b: tf(prim.b) });
        else if (prim.k === 'poly') out.push({ id: newId('e'), type: 'polyline', layer: e.layer, color: e.color, points: prim.pts.map(tf), closed: !!prim.closed });
        else if (prim.k === 'circle') out.push({ id: newId('e'), type: 'circle', layer: e.layer, color: e.color, c: tf(prim.c), r: prim.r * ((Math.abs(e.sx) + Math.abs(e.sy)) / 2) });
        else if (prim.k === 'arc') out.push({ id: newId('e'), type: 'arc', layer: e.layer, color: e.color, c: tf(prim.c), r: prim.r * ((Math.abs(e.sx) + Math.abs(e.sy)) / 2), a1: prim.a1 + e.rot, a2: prim.a2 + e.rot });
      }
      return out;
    }
    default:
      return [e];
  }
}

/* ───────────────────────── LENGTHEN (LEN) ───────────────────────── */

export function lineLength(e: LineEntity): number {
  return dist(e.a, e.b);
}
export function arcLength(e: ArcEntity): number {
  return (norm2pi(e.a2 - e.a1) || Math.PI * 2) * e.r;
}
export function arcSweep(e: ArcEntity): number {
  return norm2pi(e.a2 - e.a1) || Math.PI * 2;
}

/** Kéo dài/thu ngắn LINE thêm `delta` mm (âm = rút ngắn) ở đầu GẦN `endNear` nhất. Giữ id. */
export function lengthenLine(e: LineEntity, delta: number, endNear: Pt): LineEntity {
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  if (dist(endNear, e.a) <= dist(endNear, e.b)) {
    return { ...e, a: { x: e.a.x - ux * delta, y: e.a.y - uy * delta } };
  }
  return { ...e, b: { x: e.b.x + ux * delta, y: e.b.y + uy * delta } };
}

/** Kéo dài/thu ngắn ARC thêm `deltaAngleRad` (âm = rút ngắn) ở đầu GẦN `endNear` nhất. Giữ id. */
export function lengthenArc(e: ArcEntity, deltaAngleRad: number, endNear: Pt): ArcEntity {
  const ptA = { x: e.c.x + e.r * Math.cos(e.a1), y: e.c.y + e.r * Math.sin(e.a1) };
  const ptB = { x: e.c.x + e.r * Math.cos(e.a2), y: e.c.y + e.r * Math.sin(e.a2) };
  if (dist(endNear, ptA) <= dist(endNear, ptB)) return { ...e, a1: e.a1 - deltaAngleRad };
  return { ...e, a2: e.a2 + deltaAngleRad };
}
