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
import { dist, entityBox, mid, nearestOnSeg, segIntersect, zoneBoundaryPoints, ellipseBoundaryPoints } from './model';
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
    case 'room':
      return e.boundary;
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
    case 'room': {
      const p = e.boundary;
      const segs: [Pt, Pt][] = [];
      for (let i = 0; i < p.length; i++) segs.push([p[i], p[(i + 1) % p.length]]);
      return segs;
    }
    default:
      return [];
  }
}

/* ════════════════ CHỈ MỤC KHÔNG GIAN cho findSnap (vá lag 01/09) ════════════════
 *
 * 🔴 BỆNH ĐO ĐƯỢC (điều tra `DIEU-TRA-CAD-LAG-MO-SAI` 01/09): findSnap chạy trên MỖI pointermove
 * (`CadCanvas.tsx updateCursor`), và bản cũ quét TRỌN doc mỗi lượt:
 *   · lọc visible bằng `doc.layers.find` LỒNG TRONG filter ⇒ O(12.600 entity × 25 lớp)
 *     ≈ 315.000 phép so mỗi lần rê chuột;
 *   · nấc endpoint dựng mảng MỌI endpoint; nấc midpoint duyệt lại MỌI segment; nấc intersection
 *     dựng mảng MỌI segment rồi O(near²).
 *
 * CÁCH VÁ — chỉ mục lưới (grid buckets) ô 2,5 m thế giới, dựng ĐÚNG MỘT LẦN cho mỗi
 * `doc.entities` (WeakMap theo CHÍNH MẢNG entities + chốt độ dài — y khuôn `LAYER_INDEX_CACHE`
 * bên `render.ts`, luật 6: không đẻ khuôn cache thứ hai, vì cùng hai đường làm mảng đổi:
 * store thay mảng mới mỗi mutation; đường NHẬP file `push` vào mảng cũ thì chốt `n` bắt).
 * Mỗi lượt findSnap chỉ tra các Ô QUANH CON TRỎ (bán kính = dung sai của nấc đang xét).
 *
 * NGỮ NGHĨA GIỮ NGUYÊN — ba điều bảo đảm, mỗi điều có chốt trong `query-snap-index.test.ts`:
 *   ① Ứng viên trong bán kính r luôn nằm trong các ô giao với hộp (world ± r) — đoạn/entity
 *      trải nhiều ô được ghi vào MỌI ô nó chạm (quá 64 ô thì vào danh sách "quá khổ" luôn xét);
 *      tập ứng viên là SIÊU TẬP của tập bản cũ chấp nhận, phần dư bị chính phép so d ≤ tol loại.
 *   ② Thứ tự thắng-thua giữ theo doc-order: mỗi mục mang `ord` (chỉ số entity), hoà khoảng cách
 *      thì `ord` nhỏ thắng — đúng hành vi "ai đứng trước trong doc thắng" của vòng quét cũ.
 *   ③ Ẩn/hiện lớp KHÔNG nằm trong chỉ mục: mỗi mục mang `layer` id, lượt tra mới đối chiếu bảng
 *      lớp (dựng O(số lớp) mỗi lượt, giữ THAM CHIẾU Layer) ⇒ `lay.visible` sửa tại chỗ vẫn đúng
 *      ngay, không cần dựng lại chỉ mục.
 *
 * ⚠️ Giả định chỉ mục dựa vào: entity là BẤT BIẾN sau khi vào mảng (store thay entity mới mỗi
 * mutation — undo/redo giữ snapshot nên bắt buộc như vậy). Sửa toạ độ TẠI CHỖ một entity mà
 * không thay mảng là bug ở tầng store, không phải ca chỉ mục này phải đỡ.
 */

/** Cạnh ô lưới (mm thế giới) — 2,5 m: mặt bằng nội thất 30×30 m ra ~150 ô, mỗi ô vài chục mục. */
const O_LUOI_MM = 2500;
/** Đoạn/entity phủ quá số ô này (đường 12 km, khung bao cả bản vẽ) → danh sách "quá khổ" luôn
 * xét, để một mục kỳ dị không nhân bản ra hàng nghìn ô. */
const TRAN_O_MOT_MUC = 64;

interface DiemIdx { x: number; y: number; layer: string; ord: number }
interface DoanIdx { a: Pt; b: Pt; layer: string; ord: number }
interface ThucTheIdx { e: Entity; ord: number }

type LoaiDiem = 'end' | 'quad' | 'node' | 'center' | 'midp';

interface OIdx {
  end?: DiemIdx[];
  quad?: DiemIdx[];
  node?: DiemIdx[];
  center?: DiemIdx[];
  midp?: DiemIdx[];
  segs?: DoanIdx[];
  ents?: ThucTheIdx[];
}

export interface SnapIndex {
  cell: number;
  cells: Map<string, OIdx>;
  segsQuaKho: DoanIdx[];
  entsQuaKho: ThucTheIdx[];
  /** số entity lúc dựng — chốt bắt ca `push` vào mảng cũ (đường nhập DXF/DWG). */
  n: number;
}

/** Đếm số lần DỰNG chỉ mục — cho test khoá "pan/rê chuột không được làm nó nhúc nhích". */
export const SNAP_INDEX_DEM = { dung: 0 };

const SNAP_INDEX_CACHE = new WeakMap<Entity[], SnapIndex>();

function buildSnapIndex(entities: Entity[]): SnapIndex {
  const cell = O_LUOI_MM;
  const cells = new Map<string, OIdx>();
  const idx: SnapIndex = { cell, cells, segsQuaKho: [], entsQuaKho: [], n: entities.length };

  const oTai = (cx: number, cy: number): OIdx => {
    const k = `${cx},${cy}`;
    let o = cells.get(k);
    if (!o) {
      o = {};
      cells.set(k, o);
    }
    return o;
  };
  const themDiem = (loai: LoaiDiem, p: Pt, layer: string, ord: number) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const o = oTai(Math.floor(p.x / cell), Math.floor(p.y / cell));
    (o[loai] ??= []).push({ x: p.x, y: p.y, layer, ord });
  };
  /** Ghi 1 mục vào MỌI ô mà hộp bao của nó chạm — false nếu hộp vô hạn/quá khổ (caller tự đưa
   * vào danh sách luôn-xét). */
  const ghiTheoBox = (minX: number, minY: number, maxX: number, maxY: number, ghi: (o: OIdx) => void): boolean => {
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return false;
    const cx0 = Math.floor(minX / cell);
    const cx1 = Math.floor(maxX / cell);
    const cy0 = Math.floor(minY / cell);
    const cy1 = Math.floor(maxY / cell);
    if ((cx1 - cx0 + 1) * (cy1 - cy0 + 1) > TRAN_O_MOT_MUC) return false;
    for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) ghi(oTai(cx, cy));
    return true;
  };

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    for (const p of trueEndpoints(e)) themDiem('end', p, e.layer, i);
    for (const p of quadrantPoints(e)) themDiem('quad', p, e.layer, i);
    for (const p of nodePoints(e)) themDiem('node', p, e.layer, i);
    if (e.type === 'circle' || e.type === 'arc') themDiem('center', e.c, e.layer, i);

    const segs = entSegments(e);
    for (const [a, b] of segs) {
      themDiem('midp', mid(a, b), e.layer, i);
      const rec: DoanIdx = { a, b, layer: e.layer, ord: i };
      const ok = ghiTheoBox(
        Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y),
        (o) => { (o.segs ??= []).push(rec); },
      );
      if (!ok) idx.segsQuaKho.push(rec);
    }

    // entity theo bao hình — cho perpendicular/tangent/nearest (chỉ các loại có biên hình học:
    // có segment, hoặc circle/arc; text/block không có biên nên 3 nấc đó vốn bỏ qua chúng).
    if (segs.length || e.type === 'circle' || e.type === 'arc') {
      const b = entityBox(e);
      const rec: ThucTheIdx = { e, ord: i };
      const ok = Number.isFinite(b.minX) && ghiTheoBox(b.minX, b.minY, b.maxX, b.maxY, (o) => { (o.ents ??= []).push(rec); });
      if (!ok) idx.entsQuaKho.push(rec);
    }
  }
  return idx;
}

/** Chỉ mục snap cho doc hiện tại — dựng 1 lần mỗi khi mảng `doc.entities` đổi (hoặc bị push).
 * Xuất cho test; mã ngoài module này không cần gọi trực tiếp (findSnap tự lo). */
export function snapIndexFor(doc: Doc): SnapIndex {
  const ents = doc.entities;
  const hit = SNAP_INDEX_CACHE.get(ents);
  if (hit && hit.n === ents.length) return hit;
  const moi = buildSnapIndex(ents);
  SNAP_INDEX_CACHE.set(ents, moi);
  SNAP_INDEX_DEM.dung += 1;
  return moi;
}

/** Các ô giao với hộp (minX..maxX, minY..maxY). Hộp phủ quá nhiều ô so với số ô CÓ THẬT thì trả
 * thẳng mọi ô (đỡ dựng hàng vạn khoá chuỗi khi tolMm khổng lồ lúc zoom rất xa) — tập ứng viên
 * chỉ được phép RỘNG hơn, không hẹp hơn, nên nhánh này an toàn về ngữ nghĩa. */
function cacO(idx: SnapIndex, minX: number, minY: number, maxX: number, maxY: number): OIdx[] {
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return [...idx.cells.values()];
  }
  const cx0 = Math.floor(minX / idx.cell);
  const cx1 = Math.floor(maxX / idx.cell);
  const cy0 = Math.floor(minY / idx.cell);
  const cy1 = Math.floor(maxY / idx.cell);
  const soO = (cx1 - cx0 + 1) * (cy1 - cy0 + 1);
  if (!Number.isFinite(soO) || soO > idx.cells.size + 16) return [...idx.cells.values()];
  const out: OIdx[] = [];
  for (let cx = cx0; cx <= cx1; cx++)
    for (let cy = cy0; cy <= cy1; cy++) {
      const o = idx.cells.get(`${cx},${cy}`);
      if (o) out.push(o);
    }
  return out;
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
 * thắng nấc thấp hơn dù xa con trỏ hơn một chút) — nấc thấp chỉ được xét khi nấc cao hơn rỗng.
 *
 * VÁ LAG 01/09 — cùng thứ tự nấc, cùng luật thắng-thua, nhưng mỗi nấc chỉ tra CHỈ MỤC KHÔNG
 * GIAN quanh con trỏ thay vì quét trọn doc (xem docstring khối CHỈ MỤC ở trên). */
export function findSnap(doc: Doc, world: Pt, tolMm: number, gridStep: number, snap: SnapSettings, from?: Pt): SnapResult {
  if (!snap.enabled) return { pt: world, type: 'none' };

  const idx = snapIndexFor(doc);
  // Bảng lớp dựng MỖI LƯỢT — O(số lớp) ~ vài chục phép, thay cho 315k phép của bản cũ. Map giữ
  // THAM CHIẾU Layer nên `lay.visible` sửa tại chỗ vẫn đọc đúng giá trị mới nhất.
  const lop = new Map(doc.layers.map((l) => [l.id, l] as const));
  const hien = (layerId: string): boolean => {
    const lay = lop.get(layerId);
    return !lay || lay.visible;
  };

  /** Điểm gần nhất trong dung sai của một loại điểm — hoà khoảng cách thì doc-order thắng. */
  const chonGanNhat = (loai: LoaiDiem, r: number): Pt | null => {
    let best: { pt: Pt; d: number; ord: number } | null = null;
    for (const o of cacO(idx, world.x - r, world.y - r, world.x + r, world.y + r)) {
      const ds = o[loai];
      if (!ds) continue;
      for (const p of ds) {
        if (!hien(p.layer)) continue;
        const d = dist(world, p);
        if (d <= tolMm && (!best || d < best.d || (d === best.d && p.ord < best.ord))) {
          best = { pt: { x: p.x, y: p.y }, d, ord: p.ord };
        }
      }
    }
    return best?.pt ?? null;
  };

  /** Mọi đoạn thẳng (của entity đang hiện) có hộp bao chạm hộp world ± r — khử trùng lặp vì
   * đoạn dài nằm ở nhiều ô, rồi xếp theo doc-order cho thứ tự ổn định như bản quét cũ. */
  const gomDoan = (r: number): DoanIdx[] => {
    const seen = new Set<DoanIdx>();
    for (const o of cacO(idx, world.x - r, world.y - r, world.x + r, world.y + r)) {
      if (!o.segs) continue;
      for (const s of o.segs) if (hien(s.layer)) seen.add(s);
    }
    for (const s of idx.segsQuaKho) if (hien(s.layer)) seen.add(s);
    return [...seen].sort((a, b) => a.ord - b.ord);
  };

  /** Mọi entity có biên hình học quanh con trỏ (cho perpendicular/tangent/nearest). */
  const gomThucThe = (r: number): Entity[] => {
    const seen = new Set<ThucTheIdx>();
    for (const o of cacO(idx, world.x - r, world.y - r, world.x + r, world.y + r)) {
      if (!o.ents) continue;
      for (const t of o.ents) if (hien(t.e.layer)) seen.add(t);
    }
    for (const t of idx.entsQuaKho) if (hien(t.e.layer)) seen.add(t);
    return [...seen].sort((a, b) => a.ord - b.ord).map((t) => t.e);
  };

  // Nấc 1 — endpoint
  if (snap.endpoint) {
    const p = chonGanNhat('end', tolMm);
    if (p) return { pt: p, type: 'endpoint' };
  }

  // Nấc 2 — intersection (giữ luật cũ: chỉ xét cặp segment gần con trỏ trong tol×4 để nhẹ)
  if (snap.intersection) {
    const near = gomDoan(tolMm * 4).filter((s) => nearestOnSeg(world, s.a, s.b).d < tolMm * 4);
    const xs: Pt[] = [];
    for (let i = 0; i < near.length; i++)
      for (let k = i + 1; k < near.length; k++) {
        const x = segIntersect(near[i].a, near[i].b, near[k].a, near[k].b);
        if (x) xs.push(x);
      }
    let best: { pt: Pt; d: number } | null = null;
    for (const p of xs) {
      const d = dist(world, p);
      if (d <= tolMm && (!best || d < best.d)) best = { pt: p, d };
    }
    if (best) return { pt: best.pt, type: 'intersection' };
  }

  // Nấc 3 — center
  if (snap.center) {
    const p = chonGanNhat('center', tolMm);
    if (p) return { pt: p, type: 'center' };
  }

  // Nấc 4 — midpoint
  if (snap.midpoint) {
    const p = chonGanNhat('midp', tolMm);
    if (p) return { pt: p, type: 'midpoint' };
  }

  // Nấc 5 — perpendicular/tangent (cùng nấc, nearest trong nhóm 2 loại thắng — cả 2 đều cần `from`).
  // Chân vuông góc/điểm tiếp tuyến hợp lệ đều nằm TRÊN entity và trong tol của con trỏ ⇒ entity
  // ứng viên bắt buộc có bao hình chạm hộp world ± tol — đúng tập `gomThucThe` trả về.
  if (from && (snap.perpendicular || snap.tangent)) {
    const cands = gomThucThe(tolMm);
    let best: { pt: Pt; type: SnapType; d: number } | null = null;
    if (snap.perpendicular) {
      for (const e of cands) {
        const p = perpendicularPoint(e, from);
        if (!p) continue;
        const d = dist(world, p);
        if (d <= tolMm && (!best || d < best.d)) best = { pt: p, type: 'perpendicular', d };
      }
    }
    if (snap.tangent) {
      for (const e of cands)
        for (const p of tangentPoints(e, from)) {
          const d = dist(world, p);
          if (d <= tolMm && (!best || d < best.d)) best = { pt: p, type: 'tangent', d };
        }
    }
    if (best) return { pt: best.pt, type: best.type };
  }

  // Nấc 6 — quadrant
  if (snap.quadrant) {
    const p = chonGanNhat('quad', tolMm);
    if (p) return { pt: p, type: 'quadrant' };
  }

  // Nấc 7 — node
  if (snap.node) {
    const p = chonGanNhat('node', tolMm);
    if (p) return { pt: p, type: 'node' };
  }

  // Nấc 8 — nearest (điểm gần nhất trên biên bất kỳ entity). Entity ngoài tập ứng viên không
  // thể có điểm biên trong tol (bao hình không chạm hộp world ± tol) ⇒ kết quả y bản quét cũ.
  if (snap.nearest) {
    let bn: { pt: Pt; d: number } | null = null;
    for (const e of gomThucThe(tolMm)) {
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
      case 'room':
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
