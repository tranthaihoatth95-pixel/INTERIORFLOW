/**
 * lib/cad/hatch.ts — HATCH THẬT (Nấc 4): dò biên vùng kín từ pick-point (boundary trace trên
 * mặt phẳng phân hoạch bởi các entity giao nhau) + sinh pattern ANSI31/ANSI32/ANSI37/SOLID/DOTS.
 * Hình học THUẦN — test được độc lập, không đụng store/React.
 *
 * THUẬT TOÁN dò biên (giống ý tưởng BHATCH của AutoCAD, đơn giản hoá cho phạm vi app):
 *  1) Lấy mọi đoạn thẳng "có thể là biên" từ entity hiển thị (line/dim/polyline/rect/hatch lấy
 *     thẳng; circle/arc xấp xỉ đa giác — đủ mượt cho mục đích dò biên, KHÔNG cần chính xác từng
 *     độ cong).
 *  2) Cắt (split) mọi đoạn tại MỌI giao điểm với đoạn khác — kể cả giao kiểu CHẠM ĐẦU MÚT
 *     (đầu đoạn này đậu giữa đoạn kia, chính là đỉnh chữ T) và chồng lấn THẲNG HÀNG một phần —
 *     rồi hút đỉnh về lưới 0.01mm + loại đoạn trùng lặp (mỗi wallSegment phát cả hatch lẫn
 *     polyline cùng toạ độ → mọi cạnh tường bị nhân đôi nếu không lọc) → tập đoạn "nguyên tử"
 *     tạo thành 1 mặt phẳng phân hoạch (planar arrangement) sạch.
 *  3) Dựng DCEL toàn cục: mỗi đoạn nguyên tử → 2 nửa-cạnh (half-edge) ngược chiều; tại mỗi đỉnh
 *     sắp các nửa-cạnh đi ra theo góc; con trỏ next của nửa-cạnh (u→v) = nửa-cạnh đứng NGAY
 *     TRƯỚC twin (v→u) theo chiều ngược kim đồng hồ quanh v. Đi theo next liệt kê MỌI mặt của
 *     phân hoạch đúng 1 lần (thuật toán textbook — khác bản cũ chỉ "rẽ góc nhỏ nhất" cục bộ
 *     từng bước từ 1 cạnh xuất phát đoán mò, vốn lạc lối tại đỉnh chữ T bậc ≥4, xem git log).
 *     Mặt HỮU HẠN có diện tích đại số dương (đi ngược kim đồng hồ); mặt vô hạn âm → loại.
 *  4) Trong các mặt hữu hạn chứa pick-point (point-in-polygon), lấy mặt diện tích NHỎ NHẤT
 *     (ưu tiên vùng trong cùng khi có phòng lồng phòng).
 *
 * Nhờ liệt kê mặt TOÀN CỤC (không phụ thuộc cạnh xuất phát), phòng có vách khác đâm vào tường
 * bao tạo chữ T — trường hợp phổ biến của mặt bằng nhiều phòng, từng làm bản cũ trả null —
 * giờ dò đúng đa giác phòng (test [7]/[8] trong hatch.test.ts khoá hành vi này). Các "khe hở"
 * nhỏ nơi 2 quad tường không vát góc chồng lấn nhau vẫn là mặt thật của phân hoạch, nhưng chỉ
 * được trả về khi pick-point nằm TRONG khe đó (đúng nghĩa hình học).
 */

import type { Doc, Entity, Pt } from './model';
import { dist } from './model';
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

const EPS = 1e-6;

/**
 * Cắt mọi đoạn tại giao điểm với đoạn khác → đoạn "nguyên tử" (mặt phẳng phân hoạch).
 * Cắt cả 3 kiểu giao:
 *  - giao CHÉO thường (t, u đều nằm trong lòng 2 đoạn);
 *  - giao CHẠM ĐẦU MÚT — đầu đoạn kia đậu giữa lòng đoạn này (đỉnh chữ T): vẫn phải cắt đoạn
 *    này, nếu không đỉnh T nằm "chìm" giữa cạnh và DCEL không biết tới nó;
 *  - chồng lấn THẲNG HÀNG một phần: chiếu đầu mút đoạn kia lên đoạn này để cắt (phần trùng
 *    nhau sau đó bị loại bởi bước dedupe trong buildAtomicSegments).
 */
function splitAtIntersections(segs: [Pt, Pt][]): [Pt, Pt][] {
  const params: number[][] = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i++) {
    const [a, b] = segs[i];
    for (let k = i + 1; k < segs.length; k++) {
      const [c, d] = segs[k];
      const r = infiniteLineIntersect(a, b, c, d);
      if (r) {
        if (r.t > EPS && r.t < 1 - EPS && r.u >= -EPS && r.u <= 1 + EPS) params[i].push(r.t);
        if (r.u > EPS && r.u < 1 - EPS && r.t >= -EPS && r.t <= 1 + EPS) params[k].push(r.u);
      } else {
        // song song — chỉ quan tâm khi THẲNG HÀNG (điểm c nằm trên đường ab)
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const ab2 = abx * abx + aby * aby;
        if (ab2 < EPS) continue;
        const perp = Math.abs(abx * (c.y - a.y) - aby * (c.x - a.x)) / Math.sqrt(ab2);
        if (perp > 1e-4) continue;
        const tOf = (p: Pt) => (abx * (p.x - a.x) + aby * (p.y - a.y)) / ab2;
        for (const t of [tOf(c), tOf(d)]) if (t > EPS && t < 1 - EPS) params[i].push(t);
        const cdx = d.x - c.x;
        const cdy = d.y - c.y;
        const cd2 = cdx * cdx + cdy * cdy;
        if (cd2 < EPS) continue;
        const uOf = (p: Pt) => (cdx * (p.x - c.x) + cdy * (p.y - c.y)) / cd2;
        for (const u of [uOf(a), uOf(b)]) if (u > EPS && u < 1 - EPS) params[k].push(u);
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

/** Hút toạ độ về đúng lưới 0.01mm của keyOf — để góc cạnh tính từ toạ độ khớp tuyệt đối với đỉnh đã gộp. */
function snap(p: Pt): Pt {
  return { x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
}

/** splitAtIntersections + hút lưới + loại đoạn suy biến/TRÙNG LẶP (hatch và polyline của cùng 1
 * wallSegment phát ra 2 bộ cạnh y hệt nhau — giữ cả 2 thì mỗi cạnh tường thành cạnh đôi, DCEL
 * ghép twin sai). */
function buildAtomicSegments(segs: [Pt, Pt][]): [Pt, Pt][] {
  const out: [Pt, Pt][] = [];
  const seen = new Set<string>();
  for (const [a0, b0] of splitAtIntersections(segs)) {
    const a = snap(a0);
    const b = snap(b0);
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === kb) continue;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([a, b]);
  }
  return out;
}

/** Diện tích ĐẠI SỐ (shoelace có dấu): >0 = đi ngược kim đồng hồ (mặt hữu hạn của DCEL bên dưới). */
function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/**
 * Liệt kê MỌI mặt hữu hạn của mặt phẳng phân hoạch (DCEL kinh điển):
 * mỗi đoạn nguyên tử → 2 nửa-cạnh ngược chiều; tại mỗi đỉnh sắp nửa-cạnh đi ra theo góc tăng
 * dần (ngược kim đồng hồ); next của (u→v) = nửa-cạnh đứng ngay TRƯỚC twin (v→u) trong vòng sắp
 * đó. Mỗi nửa-cạnh thuộc đúng 1 mặt; mặt hữu hạn khép theo chiều ngược kim đồng hồ (diện tích
 * đại số dương), mặt vô hạn âm — chỉ trả mặt hữu hạn.
 */
function enumerateFaces(atomic: [Pt, Pt][]): Pt[][] {
  interface HalfEdge { from: Pt; fromKey: string; toKey: string; ang: number; twin: number; next: number }
  const hes: HalfEdge[] = [];
  for (const [a, b] of atomic) {
    const i = hes.length;
    hes.push({ from: a, fromKey: keyOf(a), toKey: keyOf(b), ang: Math.atan2(b.y - a.y, b.x - a.x), twin: i + 1, next: -1 });
    hes.push({ from: b, fromKey: keyOf(b), toKey: keyOf(a), ang: Math.atan2(a.y - b.y, a.x - b.x), twin: i, next: -1 });
  }
  const outgoing = new Map<string, number[]>();
  hes.forEach((h, i) => {
    if (!outgoing.has(h.fromKey)) outgoing.set(h.fromKey, []);
    outgoing.get(h.fromKey)!.push(i);
  });
  const posInRing = new Array<number>(hes.length);
  for (const ring of outgoing.values()) {
    ring.sort((x, y) => hes[x].ang - hes[y].ang);
    ring.forEach((he, pos) => { posInRing[he] = pos; });
  }
  for (let i = 0; i < hes.length; i++) {
    const ring = outgoing.get(hes[i].toKey)!;
    hes[i].next = ring[(posInRing[hes[i].twin] - 1 + ring.length) % ring.length];
  }
  const faces: Pt[][] = [];
  const visited = new Array<boolean>(hes.length).fill(false);
  for (let i = 0; i < hes.length; i++) {
    if (visited[i]) continue;
    const poly: Pt[] = [];
    let cur = i;
    let guard = hes.length + 1;
    while (!visited[cur] && guard-- > 0) {
      visited[cur] = true;
      poly.push(hes[cur].from);
      cur = hes[cur].next;
    }
    if (cur !== i || poly.length < 3) continue; // vòng không khép về nửa-cạnh xuất phát — bỏ
    if (signedArea(poly) > EPS) faces.push(poly);
  }
  return faces;
}

/** Dò biên vùng kín chứa `pick` từ tập đoạn thẳng biên khả dĩ `segs`. null nếu không tìm ra.
 * Trong mọi mặt hữu hạn chứa pick, trả mặt diện tích NHỎ NHẤT (vùng trong cùng). */
export function traceHatchBoundary(segs: [Pt, Pt][], pick: Pt): Pt[] | null {
  const atomic = buildAtomicSegments(segs);
  if (!atomic.length) return null;
  let best: Pt[] | null = null;
  let bestArea = Infinity;
  for (const face of enumerateFaces(atomic)) {
    if (!pointInPolygon(pick, face)) continue;
    const area = polygonArea(face);
    if (area < bestArea) {
      bestArea = area;
      best = face;
    }
  }
  return best;
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
