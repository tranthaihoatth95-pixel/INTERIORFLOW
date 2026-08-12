/**
 * lib/three/build-ops.ts — NC-12 §4.3 "ống kính 3D chạy `ops` ra sao": lấy hình học GỐC (đã đùn
 * theo `heightMm`, `positions` của `SceneGroup` — `cad-to-obj.ts`) rồi chạy lần lượt các bậc
 * `BuildOp` boolean cần CSG (`extrude`/`arrayLinear` không cần logic riêng ở đây, xem docstring
 * `Base.ops` trong `lib/cad/model.ts`).
 *
 * CACHE ĐẶT ĐÚNG CHỖ NC-12 §4.3 yêu cầu: `Map` bên TRONG module này (runtime, KHÔNG ghi vào
 * `Doc`/`.idf` — kho thứ hai bị cấm bởi K1), khoá theo `entityId`, giá trị vô hiệu khi băm
 * (hình học gốc + ops) đổi. Cache RỖNG khi khởi động lại — mở file lại tính lại, đúng ý.
 *
 * Import `three`/`three-bvh-csg` (qua `csg.ts`) TĨNH — cùng ràng buộc an toàn với
 * `obj-scene-to-geometry.ts` (chỉ gọi từ nhánh `next/dynamic(ssr:false)`).
 */
import * as THREE from 'three';
import type { BuildOp, Pt } from '../cad/model';
import { cadToThreeM, type SceneGroup } from './cad-to-obj';
import { booleanOp } from './csg';

/** Dựng `BufferGeometry` thô từ mảng vị trí tam-giác-hoá phẳng (`SceneGroup.positions`) — không
 * CSG, không cache. Nơi DUY NHẤT tạo `BufferGeometry` từ dữ liệu `cad-to-obj.ts`, dùng chung cho
 * cả đường KHÔNG có `ops` (đa số) lẫn làm nguyên liệu đầu vào cho `resolveGroupGeometry` dưới. */
export function geometryOf(positions: number[] | Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const arr = positions instanceof Float32Array ? positions : new Float32Array(positions);
  geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** NC-12 §4.2 tầng ④ "arrayLinear" — nhân bản `geom` thành `op.n` bản, mỗi bản dịch thêm
 * `i × (dx,dy,dz)` (mm, hệ CAD X-Y mặt bằng + Z cao độ) so bản trước. Dùng ĐÚNG phép đổi trục
 * `cadToThreeM` của `cad-to-obj.ts` (tuyến tính — áp được cho VECTOR dịch chuyển, không chỉ điểm
 * tuyệt đối, nên tái dùng thẳng thay vì tự viết công thức trục thứ hai). CHỈ NỐI hình học (concat
 * vị trí tam giác) — không CSG union: viewer preview không cần khối liền (SPEC-3D-CORE §6 "xám
 * trơn không PBR, đủ xem"), union N bản qua CSG tốn nhiều hơn hẳn mà không đổi gì nhìn thấy được.
 * EXPORTED (Đợt 4, 12/08) — `lib/three/build-recipe.ts` `evalRecipe` tái dùng làm bước `arrayLinear`
 * đơn lẻ trong ngăn xếp tuần tự (không viết lại toán, đúng luật "1 cỗ máy nhiều mặt tiền"). */
export function repeatGeometry(geom: THREE.BufferGeometry, op: Extract<BuildOp, { op: 'arrayLinear' }>): THREE.BufferGeometry {
  const n = Math.max(1, Math.round(op.n));
  if (n <= 1) return geom;
  const flat = geom.index ? geom.toNonIndexed() : geom;
  const base = flat.attributes.position.array as ArrayLike<number>;
  const [stepX, stepY, stepZ] = cadToThreeM(op.dx, op.dy, op.dz);
  const out = new Float32Array(base.length * n);
  for (let i = 0; i < n; i++) {
    const ox = stepX * i;
    const oy = stepY * i;
    const oz = stepZ * i;
    const off = i * base.length;
    for (let v = 0; v < base.length; v += 3) {
      out[off + v] = base[v] + ox;
      out[off + v + 1] = base[v + 1] + oy;
      out[off + v + 2] = base[v + 2] + oz;
    }
  }
  return geometryOf(out);
}

/** Băm rẻ tiền để phát hiện ĐỔI (không phải hash mật mã) — lấy mẫu mỗi 37 phần tử thay vì duyệt
 * hết mảng (tường lớn có thể vài chục nghìn số), đủ để cache không trả nhầm khi hình học/ops đổi
 * trong mọi ca thực tế của app này (sửa 1 tham số luôn đổi `length` hoặc giá trị số các mẫu). */
function fingerprint(arr: number[]): string {
  if (!arr.length) return '0';
  let acc = arr.length;
  for (let i = 0; i < arr.length; i += 37) acc = (acc * 31 + Math.round(arr[i] * 1000)) | 0;
  return `${arr.length}:${acc}`;
}

function hashGroup(g: SceneGroup): string {
  const opsPart = JSON.stringify(g.ops ?? []);
  const basePart = fingerprint(g.positions);
  const cuttersPart = g.opCutters
    ? Object.keys(g.opCutters)
        .sort()
        .map((k) => `${k}:${fingerprint(g.opCutters![k])}`)
        .join('|')
    : '';
  return `${opsPart}#${basePart}#${cuttersPart}`;
}

const meshCache = new Map<string, { hash: string; geom: THREE.BufferGeometry }>();

/** MỞ KHO 08/08 — bậc "THAY-HÌNH-GỐC" (xem docstring union `BuildOp`, `lib/cad/model.ts`): thay vì
 * modify hình học ĐÃ có (như boolean/array/mirror), 5 bậc này TỰ DỰNG base geometry từ tham số
 * NƯỚNG sẵn trong chính op (đa giác/tiết diện/đường dẫn), bỏ qua `g.positions` gốc. Tối đa 1 bậc
 * loại này/entity có tác dụng — nếu Doc lỡ có ≥2 (không nên xảy ra, `commands.ts` luôn xoá hết các
 * bậc cùng nhóm trước khi thêm bậc mới), lấy bậc ĐẦU TIÊN gặp trong mảng, các bậc sau bị bỏ qua
 * lặng lẽ (N4 — không sập, không đoán). */
type ShapeReplacingOp = Extract<BuildOp, { op: 'taper' } | { op: 'bevelEx' } | { op: 'sweep' } | { op: 'revolve' } | { op: 'loft' }>;

function isShapeReplacingOp(op: BuildOp): op is ShapeReplacingOp {
  return op.op === 'taper' || op.op === 'bevelEx' || op.op === 'sweep' || op.op === 'revolve' || op.op === 'loft';
}

/** Dựng base geometry từ 1 bậc "thay-hình-gốc" — cao độ (z0/z1) đọc SỐNG từ `g.baseMm`/`g.heightMm`
 * (không nướng, xem docstring union `BuildOp`); mặc định 2700mm khi group không mang `heightMm`
 * (group KHÔNG qua nhánh này khi thiếu `ops` nên hằng số này chỉ là lưới đỡ phòng thủ, không phải
 * đường chạy thật — mọi group có `ops` từ `cad-to-obj.ts` hôm nay đều có `heightMm` kèm theo). */
function buildShapeGeometry(op: ShapeReplacingOp, g: SceneGroup): THREE.BufferGeometry {
  switch (op.op) {
    case 'taper': {
      const z0 = g.baseMm ?? 0;
      const z1 = z0 + (g.heightMm ?? 2700);
      return prismTapered(op.polyMm, z0, z1, op.topInsetMm);
    }
    case 'bevelEx': {
      const z0 = g.baseMm ?? 0;
      const z1 = z0 + (g.heightMm ?? 2700);
      return prismBeveledEx(op.polyMm, z0, z1, { radiusMm: op.radiusMm, segments: op.segments, edges: op.edges });
    }
    case 'sweep':
      return sweepProfile(op.profileMm, op.pathMm, { closed: op.closed });
    case 'revolve':
      return revolveProfile(op.profileMm, { centerXMm: op.centerXMm, centerYMm: op.centerYMm, segments: op.segments, sweepDeg: op.sweepDeg });
    case 'loft':
      return loftSections(op.sections);
    default: {
      const _exhaustive: never = op;
      void _exhaustive;
      return geometryOf(g.positions);
    }
  }
}

/**
 * Hình học CUỐI của 1 `SceneGroup`, ÁP TOÀN BỘ `ops` nếu có, theo ĐÚNG thứ tự "modifier stack"
 * NC-12 §4.2 (đọc từ trên xuống ý NGHĨA, không phải thứ tự khai trong mảng):
 *   1. bậc THAY-HÌNH-GỐC (taper/bevelEx/sweep/revolve/loft, MỞ KHO 08/08) — thế chỗ base geometry.
 *   2. boolean (khoét/hợp/giao) — trên base đã có ở bước 1 (hoặc `g.positions` nếu không có bậc 1).
 *   3. mirror (MỞ KHO 08/08) — đối xứng SAU khi đã khoét, TRƯỚC khi nhân bản (một cặp đối xứng là
 *      1 đơn vị để nhân bản tiếp, đúng trực giác modifier stack Blender/Max).
 *   4. arrayLinear (2 bậc = lưới, xem `applyArrayOps`) rồi arrayRadial (MỞ KHO 08/08) — nhân bản
 *      SAU CÙNG, không phải khoét/gương từng bản riêng.
 * Group không có `ops` (đa số — tường chưa sửa/chưa mảng, sàn, nội thất…) đi thẳng qua
 * `geometryOf`, KHÔNG cache (đã rẻ sẵn). Group có `ops`: cache theo `entityId` (rơi về `name` nếu
 * thiếu — group có `ops` luôn có `entityId` trong `cad-to-obj.ts` hôm nay, đây là lưới đỡ), vô
 * hiệu khi `hashGroup()` đổi.
 *
 * `op.op === 'extrude'` KHÔNG xử lý ở đây — bevel ĐƠN GIẢN (1 đoạn, chỉ cạnh trên) cần ĐA GIÁC gốc
 * SỐNG của entity (đã mất khi xuống tới triangle soup `g.positions`), áp thẳng ở `cad-to-obj.ts`
 * (`ObjBuilder.prismBeveled`, nơi còn `h.points`) TRƯỚC khi hình học tới được `SceneGroup` này. `h`
 * không dùng (mm cao khai báo lúc đặt bevel — xem `setEntityBevel`, `lib/cad/commands.ts`). Bậc
 * `bevelEx` (MỞ KHO 08/08, đa giác NƯỚNG trong chính op) là bản NÂNG CAO xử lý Ở ĐÂY — 2 cơ chế
 * cùng tồn tại, đặt `bevelEx` sẽ THAY hẳn base geometry (bước 1) nên nếu wall còn giữ
 * `extrude.bevel` cũ, kết quả nhìn thấy là của `bevelEx` (base đã bị thế chỗ trước khi tới bước 2+).
 */
export function resolveGroupGeometry(g: SceneGroup): THREE.BufferGeometry {
  const ops = g.ops ?? [];
  const booleans = ops.filter((op) => op.op === 'boolean');
  const arrayLinearOps = ops.filter((op): op is Extract<BuildOp, { op: 'arrayLinear' }> => op.op === 'arrayLinear');
  const arrayRadialOps = ops.filter((op): op is Extract<BuildOp, { op: 'arrayRadial' }> => op.op === 'arrayRadial');
  const mirrorOps = ops.filter((op): op is Extract<BuildOp, { op: 'mirror' }> => op.op === 'mirror');
  const shapeOp = ops.find(isShapeReplacingOp);
  if (!booleans.length && !arrayLinearOps.length && !arrayRadialOps.length && !mirrorOps.length && !shapeOp) {
    return geometryOf(g.positions);
  }

  const key = g.entityId ?? g.name;
  const hash = hashGroup(g);
  const cached = meshCache.get(key);
  if (cached && cached.hash === hash) return cached.geom;

  let geom = shapeOp ? buildShapeGeometry(shapeOp, g) : geometryOf(g.positions);
  for (const op of booleans) {
    if (op.op !== 'boolean') continue;
    const cutterPositions = g.opCutters?.[op.withRef];
    if (!cutterPositions || !cutterPositions.length) continue; // withRef không tra được — giữ hình học trước đó, không sập
    const cutterGeom = geometryOf(cutterPositions);
    geom = booleanOp(geom, cutterGeom, op.kind);
  }
  for (const op of mirrorOps) {
    geom = mirrorGeometry(geom, { axis: op.axis, atMm: op.atMm, withOriginal: op.withOriginal });
  }
  geom = applyArrayOps(geom, arrayLinearOps);
  for (const op of arrayRadialOps) {
    geom = arrayRadial(geom, { n: op.n, centerXMm: op.centerXMm, centerYMm: op.centerYMm, sweepDeg: op.sweepDeg });
  }
  meshCache.set(key, { hash, geom });
  return geom;
}

/** p14 MỞ KHO: `ops[]` nay được chứa NHIỀU bậc `arrayLinear` — 2 bậc = LƯỚI (hàng × cột), đúng
 * toán học `repeat(repeat(g,a),b)` = lưới 2 chiều. KHÔNG cần kiểu `BuildOp` mới trong
 * `lib/cad/model.ts` (ngoài vùng phiếu p14) — lưới persist bằng đúng bậc đã có, `.idf` cũ 1 bậc
 * đọc y nguyên. Ca chuẩn UI (2 bậc, mỗi bậc chạy đúng 1 trục CAD) đi qua `arrayGrid` (1 lần
 * replicate n×m ma trận — đường sống thật đầu tiên của hàm đó); tổ hợp khác (bậc chéo trục, ≥3
 * bậc) rơi về ghép `repeatGeometry` tuần tự — cùng kết quả hình học, có test đối chiếu bbox. */
function applyArrayOps(geom: THREE.BufferGeometry, arrayOps: Extract<BuildOp, { op: 'arrayLinear' }>[]): THREE.BufferGeometry {
  if (!arrayOps.length) return geom;
  if (arrayOps.length === 1) return repeatGeometry(geom, arrayOps[0]);
  const axisOf = (op: Extract<BuildOp, { op: 'arrayLinear' }>): 'x' | 'y' | 'z' | null => {
    const ax = op.dx !== 0;
    const ay = op.dy !== 0;
    const az = op.dz !== 0;
    if (ax && !ay && !az) return 'x';
    if (!ax && ay && !az) return 'y';
    if (!ax && !ay && az) return 'z';
    return null;
  };
  if (arrayOps.length === 2) {
    const a0 = axisOf(arrayOps[0]);
    const a1 = axisOf(arrayOps[1]);
    if (a0 && a1 && a0 !== a1) {
      const opts: ArrayGridOpts = { nx: 1, ny: 1, nz: 1, dxMm: 0, dyMm: 0, dzMm: 0 };
      for (const [axis, op] of [[a0, arrayOps[0]], [a1, arrayOps[1]]] as const) {
        if (axis === 'x') {
          opts.nx = op.n;
          opts.dxMm = op.dx;
        } else if (axis === 'y') {
          opts.ny = op.n;
          opts.dyMm = op.dy;
        } else {
          opts.nz = op.n;
          opts.dzMm = op.dz;
        }
      }
      return arrayGrid(geom, opts);
    }
  }
  let out = geom;
  for (const op of arrayOps) out = repeatGeometry(out, op);
  return out;
}

/* ═══════════════════════ BỘ LỆNH DỰNG HÌNH MỞ RỘNG (G-M17-02, 07/08) ═══════════════════════
 *
 * Các hàm dưới đây là TẦNG ENGINE thuần hình học — chưa nối vào `ops[]` của `Doc` (kiểu `BuildOp`
 * sống ở `lib/cad/model.ts`, NGOÀI vùng sở hữu phiên này; nối persist + UI là việc phiên
 * S6-chuan/S2 sau, đúng §9 "thiết kế trước — tính năng fill sau"). Vì chỉ là hàm thuần không ghi
 * `Doc`, chúng tự thoả KS4 (lùi được): tham số đổi ⇒ gọi lại ⇒ hình mới, không có state phải undo.
 *
 * QUY ƯỚC CHUNG (khớp `geometryOf`/`repeatGeometry` phía trên):
 * · MỌI tham số hình học nhận SỐ THẬT mm trong hệ CAD (X-Y mặt bằng, Z cao độ).
 * · MỌI hàm trả `BufferGeometry` trong hệ three.js MÉT Y-up (qua `cadToThreeM`) — trộn thẳng
 *   được với hình học từ `SceneGroup.positions`.
 * · Không thư viện ngoài — chỉ `three` (MIT, dep sẵn có; `LatheGeometry` dùng cho revolve).
 */

function signedAreaMm(poly: Pt[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/** Gom tam giác (mm CAD) → BufferGeometry (m, Y-up). Bộ đệm dùng chung cho mọi generator dưới. */
class TriSink {
  private out: number[] = [];
  tri(a: readonly number[], b: readonly number[], c: readonly number[]) {
    for (const p of [a, b, c]) {
      const [x, y, z] = cadToThreeM(p[0], p[1], p[2]);
      this.out.push(x, y, z);
    }
  }
  /** quạt tam giác từ điểm đầu — cho đa giác lồi/star-shaped, cùng giới hạn `fanTriangles` cad-to-obj */
  fan(pts: readonly (readonly number[])[], flip = false) {
    for (let i = 1; i < pts.length - 1; i++) {
      if (flip) this.tri(pts[0], pts[i + 1], pts[i]);
      else this.tri(pts[0], pts[i], pts[i + 1]);
    }
  }
  /** dải quad nối 2 vòng CÙNG số điểm (ring dưới → ring trên) */
  band(lo: readonly (readonly number[])[], hi: readonly (readonly number[])[]) {
    for (let i = 0; i < lo.length; i++) {
      const j = (i + 1) % lo.length;
      this.tri(lo[i], lo[j], hi[j]);
      this.tri(lo[i], hi[j], hi[i]);
    }
  }
  geometry(): THREE.BufferGeometry {
    return geometryOf(this.out);
  }
}

/**
 * Offset THẬT vào trong `d` mm: mỗi CẠNH lùi đúng d theo pháp tuyến, đỉnh mới = giao 2 cạnh đã
 * lùi (miter). KHÁC `insetPolygonMm` (cad-to-obj) — hàm đó dịch mỗi ĐỈNH d mm theo phân giác
 * (góc vuông chỉ lùi mặt d/√2 ≈ 0,707d, ngữ nghĩa kế thừa `offsetEntity` hatch). Lệnh mới ở đây
 * cam kết SỐ THẬT mm (TB1 §0f: "vát 5mm" = mặt lùi đúng 5mm) nên phải có offset chuẩn — viết cục
 * bộ, KHÔNG sửa `insetPolygonMm` (prismBeveled cũ đang dựa vào ngữ nghĩa cũ, đổi là đổi hình
 * người dùng đã lưu). Trả null nếu offset làm đa giác lật chiều/suy biến (d quá lớn).
 */
export function offsetPolygonInwardMm(poly: Pt[], d: number): Pt[] | null {
  if (poly.length < 3 || d <= 0) return null;
  const pts = signedAreaMm(poly) < 0 ? [...poly].reverse() : poly; // chuẩn hoá CCW — trong ở bên TRÁI cạnh
  const n = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const d1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const d2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const l1 = Math.hypot(d1.x, d1.y) || 1;
    const l2 = Math.hypot(d2.x, d2.y) || 1;
    const u1 = { x: d1.x / l1, y: d1.y / l1 };
    const u2 = { x: d2.x / l2, y: d2.y / l2 };
    // pháp tuyến TRÁI (vào trong với CCW)
    const n1 = { x: -u1.y, y: u1.x };
    const n2 = { x: -u2.y, y: u2.x };
    const cross = u1.x * u2.y - u1.y * u2.x;
    if (Math.abs(cross) < 1e-12) {
      // thẳng hàng — lùi thẳng theo pháp tuyến chung
      out.push({ x: p1.x + n1.x * d, y: p1.y + n1.y * d });
      continue;
    }
    // giao 2 đường: (p1 + n1·d) + t·u1  ∩  (p1 + n2·d) + s·u2
    const ax = p1.x + n1.x * d;
    const ay = p1.y + n1.y * d;
    const bx = p1.x + n2.x * d;
    const by = p1.y + n2.y * d;
    const t = ((bx - ax) * u2.y - (by - ay) * u2.x) / cross;
    out.push({ x: ax + u1.x * t, y: ay + u1.y * t });
  }
  if (signedAreaMm(out) <= 0) return null;
  // Bẫy co-quá-đà ĐỐI XỨNG: đa giác lộn qua tâm nhưng chiều duyệt VẪN CCW (signedArea không bắt
  // được — đã dính test 60mm co 999). Chỉ báo đúng: cạnh sau offset phải CÙNG CHIỀU cạnh gốc.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const gx = pts[j].x - pts[i].x;
    const gy = pts[j].y - pts[i].y;
    const ox = out[j].x - out[i].x;
    const oy = out[j].y - out[i].y;
    if (gx * ox + gy * oy <= 0) return null;
  }
  return out;
}

/* ───────────────────────── VIỆC 1 — BEVEL + CHAMFER ───────────────────────── */

export type BevelEdges = 'all' | 'vertical' | 'top';

export interface BevelPrismOpts {
  /** bán kính bo/vát, mm */
  radiusMm: number;
  /** số đoạn chia cung — 1 = CHAMFER (vát phẳng), ≥2 = BEVEL bo tròn */
  segments: number;
  /** cạnh nào: 'top' = vành cạnh trên · 'vertical' = 4 góc đứng · 'all' = cả hai */
  edges: BevelEdges;
}

/** Bo tròn GÓC 2D của đa giác (fillet): mỗi đỉnh thay bằng cung `segments` điểm, lùi vào theo 2
 * cạnh kề một đoạn `t = r·tan(θ/2)` (θ = góc rẽ tại đỉnh). Cạnh kề ngắn hơn 2t ⇒ giữ đỉnh sắc
 * (không tự co r — méo còn tệ hơn sắc). Trả đa giác mới, KHÔNG sửa `poly`. */
export function filletPolygonMm(poly: Pt[], radiusMm: number, segments: number): Pt[] {
  if (radiusMm <= 0 || segments < 1 || poly.length < 3) return [...poly];
  const n = poly.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = poly[(i - 1 + n) % n];
    const cur = poly[i];
    const next = poly[(i + 1) % n];
    const v1 = { x: cur.x - prev.x, y: cur.y - prev.y };
    const v2 = { x: next.x - cur.x, y: next.y - cur.y };
    const l1 = Math.hypot(v1.x, v1.y);
    const l2 = Math.hypot(v2.x, v2.y);
    if (l1 < 1e-9 || l2 < 1e-9) { out.push(cur); continue; }
    const u1 = { x: v1.x / l1, y: v1.y / l1 };
    const u2 = { x: v2.x / l2, y: v2.y / l2 };
    const cross = u1.x * u2.y - u1.y * u2.x;
    const dot = u1.x * u2.x + u1.y * u2.y;
    const turn = Math.atan2(Math.abs(cross), dot); // góc rẽ ∈ (0, π)
    if (turn < 1e-6) { out.push(cur); continue; } // thẳng hàng — không có góc để bo
    const t = radiusMm * Math.tan(turn / 2);
    // mỗi cạnh bị 2 đầu gặm — chia đôi quỹ đạo để 2 fillet kề nhau không chồm lên nhau
    if (t > l1 / 2 || t > l2 / 2) { out.push(cur); continue; }
    const p1 = { x: cur.x - u1.x * t, y: cur.y - u1.y * t }; // điểm tiếp tuyến trên cạnh vào
    const p2 = { x: cur.x + u2.x * t, y: cur.y + u2.y * t }; // điểm tiếp tuyến trên cạnh ra
    // tâm cung nằm trên PHÂN GIÁC của góc, cách đỉnh √(t²+r²) — không phụ thuộc chiều rẽ lồi/lõm
    const bis = { x: u2.x - u1.x, y: u2.y - u1.y };
    const bl = Math.hypot(bis.x, bis.y);
    const dist = Math.hypot(p1.x - cur.x, p1.y - cur.y);
    const centerDist = Math.hypot(dist, radiusMm); // |cur→center| = √(t²+r²)
    const center = { x: cur.x + (bis.x / bl) * centerDist, y: cur.y + (bis.y / bl) * centerDist };
    const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    let a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
    // đi cung NGẮN từ a1→a2
    while (a2 - a1 > Math.PI) a2 -= 2 * Math.PI;
    while (a2 - a1 < -Math.PI) a2 += 2 * Math.PI;
    for (let k = 0; k <= segments; k++) {
      const a = a1 + ((a2 - a1) * k) / segments;
      out.push({ x: center.x + Math.cos(a) * radiusMm, y: center.y + Math.sin(a) * radiusMm });
    }
  }
  return out;
}

/**
 * Lăng trụ đứng có BO/VÁT cạnh theo lựa chọn (`edges`) — bản tổng quát nhiều đoạn chia của
 * `ObjBuilder.prismBeveled` (cad-to-obj.ts, chỉ vát trên 1 đoạn):
 * · 'vertical': fillet đa giác 2D (`filletPolygonMm`) rồi đùn thẳng — 4 góc đứng tròn.
 * · 'top': vành trên bo theo cung phần tư — đoạn k co vào `r·(1−cos α)` ở cao `z1−r+r·sin α`
 *   (α = k/segments·π/2); segments=1 ⇒ đúng mặt vát 45° (chamfer).
 * · 'all': fillet 2D trước, rồi bo vành trên trên đa giác đã fillet. Cạnh ĐÁY giữ sắc — khối
 *   nội thất đặt trên sàn, cạnh chạm sàn không nhìn thấy (ghi rõ, không phải bỏ sót).
 * Đa giác co bị lật chiều (r vượt nửa bề rộng) ⇒ đoạn đó rơi về đa giác gốc — KHÔNG sập.
 */
export function prismBeveledEx(polyMm: Pt[], z0Mm: number, z1Mm: number, opts: BevelPrismOpts): THREE.BufferGeometry {
  const r = Math.max(0, Math.min(opts.radiusMm, z1Mm - z0Mm - 1));
  const segs = Math.max(1, Math.round(opts.segments));
  let base = polyMm;
  if (r > 0 && (opts.edges === 'vertical' || opts.edges === 'all')) {
    base = filletPolygonMm(polyMm, r, Math.max(2, segs));
  }
  const pts = signedAreaMm(base) < 0 ? [...base].reverse() : base;
  const sink = new TriSink();
  const ring = (poly: Pt[], z: number) => poly.map((p) => [p.x, p.y, z] as const);

  const roundTop = r > 0 && (opts.edges === 'top' || opts.edges === 'all');
  if (!roundTop) {
    const bot = ring(pts, z0Mm);
    const top = ring(pts, z1Mm);
    sink.fan(bot, true);
    sink.fan(top);
    sink.band(bot, top);
    return sink.geometry();
  }

  // thân đứng z0 → z1−r, rồi segs vành cung phần tư, nắp = đa giác co r
  const zShoulder = z1Mm - r;
  const rings: (readonly (readonly number[])[])[] = [ring(pts, z0Mm), ring(pts, zShoulder)];
  let lastPoly = pts;
  for (let k = 1; k <= segs; k++) {
    const a = (k / segs) * (Math.PI / 2);
    const inset = r * (1 - Math.cos(a));
    const z = zShoulder + r * Math.sin(a);
    const shrunk = inset > 0 ? offsetPolygonInwardMm(pts, inset) : pts;
    const polyK = shrunk ?? lastPoly; // co bị lật ⇒ giữ vòng trước, không sập
    if (polyK.length === lastPoly.length || shrunk) {
      rings.push(ring(polyK, z));
      lastPoly = polyK;
    } else {
      rings.push(ring(lastPoly, z));
    }
  }
  sink.fan(rings[0], true); // đáy úp xuống
  for (let i = 0; i < rings.length - 1; i++) {
    // 2 vòng khác số điểm (inset đổi cấu trúc) — nối kiểu quạt qua vòng nhỏ hơn không an toàn;
    // ca thực tế insetPolygonMm giữ nguyên số đỉnh, band 1:1 là đủ. Khác số ⇒ nối theo vòng ngắn.
    const lo = rings[i];
    const hi = rings[i + 1];
    if (lo.length === hi.length) sink.band(lo, hi);
    else {
      const m = Math.min(lo.length, hi.length);
      sink.band(lo.slice(0, m), hi.slice(0, m));
    }
  }
  sink.fan(rings[rings.length - 1]); // nắp trên
  return sink.geometry();
}

/** CHAMFER = bevel phẳng 1 đoạn — mặt tiền tiện tay, cùng cỗ máy `prismBeveledEx`. */
export function prismChamfered(polyMm: Pt[], z0Mm: number, z1Mm: number, chamferMm: number, edges: BevelEdges = 'top'): THREE.BufferGeometry {
  return prismBeveledEx(polyMm, z0Mm, z1Mm, { radiusMm: chamferMm, segments: 1, edges });
}

/* ───────────────────────── VIỆC 2 — ARRAY (lưới/tròn) + MIRROR ───────────────────────── */

/** nhân bản hình học đã dựng qua danh sách ma trận — nền chung cho array/mirror (thuần biến đổi,
 * không thuật toán hình học mới). Ma trận có det<0 (mirror) tự đảo winding để tam giác không lộn mặt. */
function replicate(geom: THREE.BufferGeometry, mats: THREE.Matrix4[]): THREE.BufferGeometry {
  const flat = geom.index ? geom.toNonIndexed() : geom;
  const base = flat.attributes.position.array as ArrayLike<number>;
  const out = new Float32Array(base.length * mats.length);
  const v = new THREE.Vector3();
  mats.forEach((m, mi) => {
    const flip = m.determinant() < 0;
    const off = mi * base.length;
    for (let t = 0; t < base.length; t += 9) {
      for (let c = 0; c < 3; c++) {
        // flip: đảo thứ tự đỉnh trong tam giác (0,1,2)→(0,2,1)
        const src = t + (flip ? [0, 2, 1][c] : c) * 3;
        v.set(base[src] as number, base[src + 1] as number, base[src + 2] as number).applyMatrix4(m);
        const dst = off + t + c * 3;
        out[dst] = v.x;
        out[dst + 1] = v.y;
        out[dst + 2] = v.z;
      }
    }
  });
  return geometryOf(out);
}

export interface ArrayGridOpts {
  nx: number; ny: number; nz: number;
  dxMm: number; dyMm: number; dzMm: number;
}

/** Mảng LƯỚI: nx×ny×nz bản, bước (dxMm,dyMm,dzMm) hệ CAD — bàn làm việc theo lưới, đèn trần theo ô. */
export function arrayGrid(geom: THREE.BufferGeometry, opts: ArrayGridOpts): THREE.BufferGeometry {
  const nx = Math.max(1, Math.round(opts.nx));
  const ny = Math.max(1, Math.round(opts.ny));
  const nz = Math.max(1, Math.round(opts.nz));
  if (nx * ny * nz <= 1) return geom;
  // bước từng trục CAD đổi trục ĐỘC LẬP (mỗi trục CAD là 1 vector riêng trong hệ three)
  const [xx, xy, xz] = cadToThreeM(opts.dxMm, 0, 0);
  const [yx, yy, yz] = cadToThreeM(0, opts.dyMm, 0);
  const [zx, zy, zz] = cadToThreeM(0, 0, opts.dzMm);
  const mats: THREE.Matrix4[] = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++)
        mats.push(new THREE.Matrix4().makeTranslation(
          i * xx + j * yx + k * zx,
          i * xy + j * yy + k * zy,
          i * xz + j * yz + k * zz,
        ));
  return replicate(geom, mats);
}

export interface ArrayRadialOpts {
  n: number;
  /** tâm quay, mm CAD mặt bằng */
  centerXMm: number;
  centerYMm: number;
  /** góc quét tổng, độ — mặc định 360 (vòng kín, bản cuối không đè bản đầu) */
  sweepDeg?: number;
}

/** Mảng VÒNG TRÒN quanh trục đứng qua (centerX,centerY) — ghế hội trường vòng cung, đèn quanh bàn tròn. */
export function arrayRadial(geom: THREE.BufferGeometry, opts: ArrayRadialOpts): THREE.BufferGeometry {
  const n = Math.max(1, Math.round(opts.n));
  if (n <= 1) return geom;
  const sweep = ((opts.sweepDeg ?? 360) * Math.PI) / 180;
  const full = Math.abs((opts.sweepDeg ?? 360) - 360) < 1e-9;
  const step = full ? sweep / n : sweep / (n - 1); // vòng kín: chia n để bản cuối không trùng bản đầu
  const [cx, cy, cz] = cadToThreeM(opts.centerXMm, opts.centerYMm, 0);
  const mats: THREE.Matrix4[] = [];
  for (let i = 0; i < n; i++) {
    // trục đứng CAD Z = trục Y của three (cadAxesToThree đổi (x,y,z)→(x,z,−y))
    const m = new THREE.Matrix4()
      .makeTranslation(cx, cy, cz)
      .multiply(new THREE.Matrix4().makeRotationY(step * i)) // makeRotationY(+θ) = quay CCW mặt bằng CAD (đã kiểm phép thế z=−y)
      .multiply(new THREE.Matrix4().makeTranslation(-cx, -cy, -cz));
    mats.push(m);
  }
  return replicate(geom, mats);
}

export interface MirrorOpts {
  /** trục vuông góc mặt gương, hệ CAD: 'x' = gương phẳng x=atMm · 'y' = y=atMm · 'z' = cao độ z=atMm */
  axis: 'x' | 'y' | 'z';
  atMm: number;
  /** true (mặc định): trả gốc + bản đối xứng (tủ đôi) · false: chỉ bản đối xứng */
  withOriginal?: boolean;
}

/** Đối xứng gương qua mặt phẳng vuông góc trục CAD tại `atMm` — mặt bằng đối xứng, tủ đôi. */
export function mirrorGeometry(geom: THREE.BufferGeometry, opts: MirrorOpts): THREE.BufferGeometry {
  const at = opts.atMm / 1000;
  // đổi trục CAD → three: X→X · Y→−Z · Z→Y (theo cadAxesToThree)
  const mk = (): THREE.Matrix4 => {
    const m = new THREE.Matrix4();
    if (opts.axis === 'x') m.set(-1, 0, 0, 2 * at, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    else if (opts.axis === 'y') m.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 2 * -at, 0, 0, 0, 1);
    else m.set(1, 0, 0, 0, 0, -1, 0, 2 * at, 0, 0, 1, 0, 0, 0, 0, 1);
    return m;
  };
  const mats = opts.withOriginal === false ? [mk()] : [new THREE.Matrix4(), mk()];
  return replicate(geom, mats);
}

/* ───────────────────────── VIỆC 3 — SWEEP · REVOLVE · LOFT ───────────────────────── */

export interface SweepPathPt { x: number; y: number; z?: number }

/**
 * SWEEP — quét TIẾT DIỆN 2D dọc ĐƯỜNG DẪN (phào chỉ, tay vịn, nẹp chân tường).
 * `profileMm`: đa giác tiết diện trong mặt phẳng vuông góc đường dẫn — u = ngang (dương về phía
 * TRÁI hướng đi, hệ mặt bằng CAD), v = cao độ. `pathMm`: polyline mặt bằng CAD (z tuỳ chọn).
 * Khúc rẽ nối bằng MITER (phân giác) — profile tại đỉnh rẽ nằm trên mặt phân giác, giãn 1/cos(θ/2)
 * để 2 đoạn ăn khớp không hở, đúng cách phào chỉ cắt góc 45° ngoài đời. 2 đầu bịt nắp.
 */
export function sweepProfile(profileMm: Pt[], pathMm: SweepPathPt[], opts?: { closed?: boolean }): THREE.BufferGeometry {
  const sink = new TriSink();
  if (profileMm.length < 3 || pathMm.length < 2) return sink.geometry();
  const closed = opts?.closed === true;
  const n = pathMm.length;
  const dirOf = (i: number) => {
    const a = pathMm[i];
    const b = pathMm[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  };
  // vòng tiết diện tại mỗi đỉnh đường dẫn (toạ độ mm CAD 3D)
  const rings: (readonly number[])[][] = [];
  for (let i = 0; i < n; i++) {
    let d: { x: number; y: number };
    let scale = 1;
    const isEnd = !closed && (i === 0 || i === n - 1);
    if (isEnd) {
      d = i === 0 ? dirOf(0) : dirOf(n - 2);
    } else {
      const dIn = dirOf((i - 1 + n) % n);
      const dOut = dirOf(i);
      const mx = dIn.x + dOut.x;
      const my = dIn.y + dOut.y;
      const ml = Math.hypot(mx, my);
      if (ml < 1e-9) { d = dOut; } // quay đầu 180° — không miter được, dùng hướng ra
      else {
        d = { x: mx / ml, y: my / ml };
        const cosHalf = (d.x * dOut.x + d.y * dOut.y);
        scale = cosHalf > 1e-6 ? 1 / cosHalf : 1; // giãn miter
      }
    }
    // pháp tuyến trái của hướng đi (trong mặt bằng)
    const nx = -d.y;
    const ny = d.x;
    const p = pathMm[i];
    const pz = p.z ?? 0;
    rings.push(profileMm.map((q) => [p.x + nx * q.x * scale, p.y + ny * q.x * scale, pz + q.y] as const));
  }
  const segCount = closed ? n : n - 1;
  for (let i = 0; i < segCount; i++) sink.band(rings[i], rings[(i + 1) % n]);
  if (!closed) {
    sink.fan(rings[0], true);
    sink.fan(rings[n - 1]);
  }
  return sink.geometry();
}

export interface RevolveOpts {
  /** tâm trục đứng, mm CAD mặt bằng */
  centerXMm: number;
  centerYMm: number;
  /** số đoạn quanh vòng — 24 đủ mượt cho preview */
  segments?: number;
  /** góc quét, độ (mặc định 360) */
  sweepDeg?: number;
}

/**
 * REVOLVE (lathe) — xoay TIẾT DIỆN quanh trục đứng (chân bàn tiện, lọ, cột tròn).
 * `profileMm`: polyline tiết diện — x = BÁN KÍNH tính từ trục (mm, ≥0), y = CAO ĐỘ (mm).
 * Dùng thẳng `THREE.LatheGeometry` (three sẵn có, xoay quanh trục Y three = trục Z CAD) rồi tịnh
 * tiến về (centerX, centerY) — không tự viết toán xoay thứ hai.
 */
export function revolveProfile(profileMm: Pt[], opts: RevolveOpts): THREE.BufferGeometry {
  if (profileMm.length < 2) return new TriSink().geometry();
  const pts = profileMm.map((p) => new THREE.Vector2(Math.max(0, p.x) / 1000, p.y / 1000));
  const segments = Math.max(3, Math.round(opts.segments ?? 24));
  const sweep = ((opts.sweepDeg ?? 360) * Math.PI) / 180;
  const lathe = new THREE.LatheGeometry(pts, segments, 0, sweep).toNonIndexed();
  const [cx, cy, cz] = cadToThreeM(opts.centerXMm, opts.centerYMm, 0);
  lathe.applyMatrix4(new THREE.Matrix4().makeTranslation(cx, cy, cz));
  const out = geometryOf(lathe.attributes.position.array as Float32Array);
  lathe.dispose();
  return out;
}

export interface LoftSection {
  polyMm: Pt[];
  zMm: number;
}

/**
 * LOFT — nối chuỗi TIẾT DIỆN mặt bằng ở các cao độ khác nhau (hình cong phức tạp, chụp đèn,
 * đảo bếp vát). Yêu cầu MỌI tiết diện CÙNG SỐ ĐỈNH (nối 1:1 — resample tự động dễ xoắn thầm
 * lặng, thà báo thẳng); khác số đỉnh ⇒ trả hình RỖNG (0 vertex) để caller kiểm được, không sập.
 * Đáy/nắp bịt kín, các tiết diện tự chuẩn hoá cùng chiều CCW để dải nối không xoắn.
 */
export function loftSections(sections: LoftSection[]): THREE.BufferGeometry {
  const sink = new TriSink();
  if (sections.length < 2) return sink.geometry();
  const count = sections[0].polyMm.length;
  if (count < 3 || sections.some((s) => s.polyMm.length !== count)) return sink.geometry();
  const rings = sections.map((s) => {
    const pts = signedAreaMm(s.polyMm) < 0 ? [...s.polyMm].reverse() : s.polyMm;
    return pts.map((p) => [p.x, p.y, s.zMm] as const);
  });
  sink.fan(rings[0], true);
  for (let i = 0; i < rings.length - 1; i++) sink.band(rings[i], rings[i + 1]);
  sink.fan(rings[rings.length - 1]);
  return sink.geometry();
}

/* ───────────────────────── VIỆC 4 — TAPER ───────────────────────── */

/**
 * TAPER — lăng trụ THU NHỎ DẦN theo trục đứng (chân bàn côn): đáy = `polyMm`, đỉnh = đa giác co
 * vào `topInsetMm` (mm THẬT — mặt nghiêng lùi đúng số mm khai, `offsetPolygonInwardMm` ở trên,
 * không tỉ lệ). Co vượt nửa bề rộng (đa giác lật chiều) ⇒ rơi về lăng trụ thẳng, KHÔNG sập.
 */
export function prismTapered(polyMm: Pt[], z0Mm: number, z1Mm: number, topInsetMm: number): THREE.BufferGeometry {
  const sink = new TriSink();
  if (polyMm.length < 3) return sink.geometry();
  const pts = signedAreaMm(polyMm) < 0 ? [...polyMm].reverse() : polyMm;
  const topPoly = topInsetMm > 0 ? offsetPolygonInwardMm(pts, topInsetMm) : null;
  const top = topPoly && topPoly.length === pts.length ? topPoly : pts;
  const lo = pts.map((p) => [p.x, p.y, z0Mm] as const);
  const hi = top.map((p) => [p.x, p.y, z1Mm] as const);
  sink.fan(lo, true);
  sink.band(lo, hi);
  sink.fan(hi);
  return sink.geometry();
}
