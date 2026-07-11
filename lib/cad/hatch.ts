/**
 * lib/cad/hatch.ts — HATCH THẬT (Nấc 4): dò biên vùng kín từ pick-point (boundary trace trên
 * mặt phẳng phân hoạch bởi các entity giao nhau) + sinh pattern ANSI31/ANSI32/ANSI37/SOLID/DOTS.
 * Hình học THUẦN — test được độc lập, không đụng store/React.
 *
 * THUẬT TOÁN dò biên (giống ý tưởng BHATCH của AutoCAD, đơn giản hoá cho phạm vi app):
 *  1) Lấy mọi đoạn thẳng "có thể là biên" từ entity hiển thị (line/dim/polyline/rect/hatch lấy
 *     thẳng; circle/arc xấp xỉ đa giác — đủ mượt cho mục đích dò biên, KHÔNG cần chính xác từng
 *     độ cong).
 *  2) Cắt (split) mọi đoạn tại MỌI giao điểm với đoạn khác → tập đoạn "nguyên tử" không giao
 *     nhau (trừ tại đầu mút chung) — đây chính là 1 mặt phẳng phân hoạch (planar arrangement).
 *  3) Từ đoạn nguyên tử GẦN pick-point nhất, đi bộ theo quy tắc "luôn rẽ theo 1 chiều xoay cố
 *     định tại mỗi đỉnh" (half-edge face traversal — thuật toán kinh điển để lần ra 1 mặt của
 *     mặt phẳng phân hoạch) cho tới khi khép lại đúng đỉnh xuất phát. Thử cả 2 đầu đoạn × 2
 *     chiều xoay (cw/ccw) = 4 khả năng, giữ lại vòng nào KHÉP + chứa pick-point (point-in-polygon)
 *     + diện tích nhỏ nhất (ưu tiên vùng trong cùng khi có phòng lồng phòng).
 *
 * GIỚI HẠN ĐÃ PHÁT HIỆN (qua debug thủ công khi xây lib/cad/standards/checker.ts — xem comment
 * đầu file đó): với phòng có tường bao bị 1 VÁCH KHÁC ĐÂM VÀO tạo góc chữ T (rất phổ biến trong
 * mặt bằng nhiều phòng), các quad tường độc lập không vát góc (wallChain/wallSegment trong
 * commands.ts) chồng lấn nhau tại góc/chữ T tạo khe hở hình học nhỏ khiến traceFace đôi khi bắt
 * nhầm vào khe hở đó thay vì đường bao phòng thật, dò biên trả về null (thất bại AN TOÀN, không
 * trả sai) thay vì đúng đa giác mong đợi. Phòng ĐƠN (chỉ tường bao khép kín, không vách khác
 * đâm vào) vẫn dò đúng bình thường (đã test). Cần thuật toán face-finding chắc hơn cho trường
 * hợp T-junction — để dành bản nâng cấp sau.
 */

import type { Doc, Entity, Pt } from './model';
import { dist, nearestOnSeg } from './model';
import { entSegments } from './query';
import { infiniteLineIntersect } from './modify';

function norm2pi(a: number): number {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/** Điểm p có nằm trong đa giác `poly` không (even-odd rule, chuẩn ray-casting). */
export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Diện tích tuyệt đối (shoelace) — dùng để chọn vòng NHỎ NHẤT khi nhiều vòng đều hợp lệ. */
export function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** Lấy mọi đoạn thẳng biên khả dĩ từ entity hiển thị trong `doc` (circle/arc xấp xỉ đa giác). */
export function collectBoundarySegments(doc: Doc, arcSteps = 24): [Pt, Pt][] {
  const segs: [Pt, Pt][] = [];
  for (const e of doc.entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && !lay.visible) continue;
    if (e.type === 'circle') {
      const pts: Pt[] = [];
      for (let i = 0; i < arcSteps; i++) {
        const a = (i / arcSteps) * Math.PI * 2;
        pts.push({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a) });
      }
      for (let i = 0; i < pts.length; i++) segs.push([pts[i], pts[(i + 1) % pts.length]]);
    } else if (e.type === 'arc') {
      const sweep = norm2pi(e.a2 - e.a1) || Math.PI * 2;
      const steps = Math.max(4, Math.round(arcSteps * (sweep / (Math.PI * 2))));
      const pts: Pt[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = e.a1 + (sweep * i) / steps;
        pts.push({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a) });
      }
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
    } else if (e.type !== 'text' && e.type !== 'block') {
      segs.push(...entSegments(e));
    }
  }
  return segs;
}

/** Cắt mọi đoạn tại giao điểm với đoạn khác → đoạn "nguyên tử" (mặt phẳng phân hoạch). */
function splitAtIntersections(segs: [Pt, Pt][]): [Pt, Pt][] {
  const params: number[][] = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i++) {
    for (let k = i + 1; k < segs.length; k++) {
      const [a, b] = segs[i];
      const [c, d] = segs[k];
      const r = infiniteLineIntersect(a, b, c, d);
      if (r && r.t > 1e-6 && r.t < 1 - 1e-6 && r.u > 1e-6 && r.u < 1 - 1e-6) {
        params[i].push(r.t);
        params[k].push(r.u);
      }
    }
  }
  const out: [Pt, Pt][] = [];
  for (let i = 0; i < segs.length; i++) {
    const [a, b] = segs[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const ts = Array.from(new Set(params[i].map((t) => Math.round(t * 1e6) / 1e6))).sort((x, y) => x - y);
    for (let k = 0; k + 1 < ts.length; k++) {
      const p0 = { x: a.x + dx * ts[k], y: a.y + dy * ts[k] };
      const p1 = { x: a.x + dx * ts[k + 1], y: a.y + dy * ts[k + 1] };
      if (dist(p0, p1) > 1e-6) out.push([p0, p1]);
    }
  }
  return out;
}

function keyOf(p: Pt): string {
  return `${Math.round(p.x * 100)}:${Math.round(p.y * 100)}`; // gộp đỉnh trùng trong sai số 0.01mm
}

interface Neighbor {
  pt: Pt;
  key: string;
}

function buildGraph(atomic: [Pt, Pt][]): Map<string, Neighbor[]> {
  const adj = new Map<string, Neighbor[]>();
  const add = (from: Pt, to: Pt) => {
    const kf = keyOf(from);
    const kt = keyOf(to);
    if (!adj.has(kf)) adj.set(kf, []);
    adj.get(kf)!.push({ pt: to, key: kt });
  };
  for (const [a, b] of atomic) {
    add(a, b);
    add(b, a);
  }
  return adj;
}

/** Đi bộ half-edge từ (startPt→firstPt) theo 1 chiều xoay cố định tới khi khép lại startKey. */
function traceFace(adj: Map<string, Neighbor[]>, startKey: string, startPt: Pt, firstKey: string, firstPt: Pt, mode: 'cw' | 'ccw', maxSteps = 4000): Pt[] | null {
  const poly: Pt[] = [startPt];
  let prevPt = startPt;
  let curKey = firstKey;
  let curPt = firstPt;
  for (let step = 0; step < maxSteps; step++) {
    poly.push(curPt);
    if (curKey === startKey) return poly;
    const neighbors = adj.get(curKey) ?? [];
    const backAngle = Math.atan2(prevPt.y - curPt.y, prevPt.x - curPt.x);
    let best: Neighbor | null = null;
    let bestDelta = Infinity;
    for (const n of neighbors) {
      const isBack = Math.abs(n.pt.x - prevPt.x) < 1e-6 && Math.abs(n.pt.y - prevPt.y) < 1e-6;
      if (isBack && neighbors.length > 1) continue; // tránh quay lại ngay trừ khi cụt (bậc 1)
      const ang = Math.atan2(n.pt.y - curPt.y, n.pt.x - curPt.x);
      let delta = norm2pi(ang - backAngle);
      if (mode === 'ccw') delta = norm2pi(-delta);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = n;
      }
    }
    if (!best) return null;
    prevPt = curPt;
    curPt = best.pt;
    curKey = best.key;
  }
  return null; // quá nhiều bước — không khép được, coi như thất bại
}

/** Dò biên vùng kín chứa `pick` từ tập đoạn thẳng biên khả dĩ `segs`. null nếu không tìm ra. */
export function traceHatchBoundary(segs: [Pt, Pt][], pick: Pt): Pt[] | null {
  const atomic = splitAtIntersections(segs);
  if (!atomic.length) return null;
  const adj = buildGraph(atomic);

  let nearest: { a: Pt; b: Pt; d: number } | null = null;
  for (const [a, b] of atomic) {
    const r = nearestOnSeg(pick, a, b);
    if (!nearest || r.d < nearest.d) nearest = { a, b, d: r.d };
  }
  if (!nearest) return null;

  const candidates: Pt[][] = [];
  const starts: [Pt, Pt][] = [[nearest.a, nearest.b], [nearest.b, nearest.a]];
  for (const [start, first] of starts) {
    for (const mode of ['cw', 'ccw'] as const) {
      const poly = traceFace(adj, keyOf(start), start, keyOf(first), first, mode);
      if (poly && poly.length >= 3 && pointInPolygon(pick, poly)) candidates.push(poly);
    }
  }
  if (!candidates.length) return null;
  candidates.sort((x, y) => polygonArea(x) - polygonArea(y));
  return candidates[0];
}

/** Tiện ích 1-bước: dò biên trực tiếp từ Doc + pick-point (dùng cho lệnh H trong CadCanvas). */
export function findHatchBoundary(doc: Doc, pick: Pt, arcSteps = 24): Pt[] | null {
  return traceHatchBoundary(collectBoundarySegments(doc, arcSteps), pick);
}

/* ───────────────────────── Sinh pattern (Nấc 4) ───────────────────────── */

/** Cắt 1 đường vô hạn (qua `base`, hướng `dir`) theo polygon → các đoạn NẰM TRONG polygon
 * (even-odd rule dựa trên thứ tự giao điểm dọc đường — thuật toán scanline chuẩn cho hatch). */
function clipLineAgainstPolygon(base: Pt, dir: Pt, poly: Pt[]): [Pt, Pt][] {
  const ts: number[] = [];
  const b2 = { x: base.x + dir.x, y: base.y + dir.y };
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % poly.length];
    const r = infiniteLineIntersect(base, b2, a, c);
    if (r && r.u >= 0 && r.u < 1) ts.push(r.t);
  }
  ts.sort((x, y) => x - y);
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i + 1 < ts.length; i += 2) {
    const p0 = { x: base.x + dir.x * ts[i], y: base.y + dir.y * ts[i] };
    const p1 = { x: base.x + dir.x * ts[i + 1], y: base.y + dir.y * ts[i + 1] };
    if (dist(p0, p1) > 1e-6) segs.push([p0, p1]);
  }
  return segs;
}

/** 1 họ đường song song góc `angleDeg`, bước `spacing`, phủ hết polygon rồi cắt theo polygon. */
function oneFamily(poly: Pt[], spacing: number, angleDeg: number): [Pt, Pt][] {
  const ang = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const normal = { x: -dir.y, y: dir.x };
  let minP = Infinity;
  let maxP = -Infinity;
  for (const p of poly) {
    const proj = p.x * normal.x + p.y * normal.y;
    minP = Math.min(minP, proj);
    maxP = Math.max(maxP, proj);
  }
  const out: [Pt, Pt][] = [];
  const start = Math.floor(minP / spacing) * spacing;
  for (let off = start; off <= maxP + 1e-6; off += spacing) {
    const base = { x: normal.x * off, y: normal.y * off };
    out.push(...clipLineAgainstPolygon(base, dir, poly));
  }
  return out;
}

/** Lưới điểm chấm (DOTS) trong polygon, bước `spacing`. */
export function hatchDots(poly: Pt[], scale: number): Pt[] {
  const spacing = Math.max(10, 150 * Math.max(0.05, scale));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const out: Pt[] = [];
  for (let y = minY; y <= maxY; y += spacing) {
    for (let x = minX; x <= maxX; x += spacing) {
      const p = { x, y };
      if (pointInPolygon(p, poly)) out.push(p);
    }
  }
  return out;
}

/**
 * Sinh đoạn thẳng pattern cho ANSI31/ANSI32/ANSI37 (xấp xỉ đơn giản hoá — KHÔNG phải bảng pattern
 * gốc AutoCAD từng-milimet, nhưng đúng tinh thần: ANSI31 = 1 họ chéo 45°, ANSI32 = 1 họ thưa hơn,
 * ANSI37 = 2 họ vuông góc (crosshatch)). scale=1 ⇒ bước cơ sở 60mm; angle tính thêm vào 45° gốc.
 */
export function hatchLines(poly: Pt[], pattern: 'ANSI31' | 'ANSI32' | 'ANSI37', scale: number, angleDeg: number): [Pt, Pt][] {
  const s = Math.max(0.05, scale);
  if (pattern === 'ANSI31') return oneFamily(poly, 60 * s, 45 + angleDeg);
  if (pattern === 'ANSI32') return oneFamily(poly, 120 * s, 45 + angleDeg);
  return [...oneFamily(poly, 90 * s, 45 + angleDeg), ...oneFamily(poly, 90 * s, 135 + angleDeg)];
}
