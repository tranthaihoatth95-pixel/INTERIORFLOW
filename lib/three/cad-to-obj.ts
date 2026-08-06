/**
 * lib/three/cad-to-obj.ts — TẦNG LÕI node "Bản vẽ → 3D (FBX)": Doc bản vẽ chặng 1
 * → khối 3D đúng kích thước thật → OBJ + MTL (text, tất định, không DOM).
 *
 * Thay các bước dựng khối thủ công của quy trình 3ds Max/VRay truyền thống:
 *  - Tường: hatch poché (lệnh WALL sinh quad SOLID trên layer Tường) → extrude cao H.
 *  - Sàn: slab theo bbox tường; PHÒNG dò qua findHatchBoundary (import-only từ
 *    lib/cad/hatch — KHÔNG sửa file đó) tại tâm mỗi block nội thất → sàn từng phòng.
 *  - Nội thất: block → proxy box đúng footprint (BLOCK_MAP) + cao theo loại đồ.
 *  - Vật liệu: MTL cơ bản theo theme (clay / gỗ ấm / palette gu từ thư viện).
 *
 * Đơn vị: Doc là mm; OBJ xuất MÉT, trục Y-up chuẩn OBJ (x, cao, -y) — Blender import
 * mặc định (forward -Z, up Y) ra đúng hệ Z-up: (x, y, cao). Camera đặt riêng qua
 * placeCamera (lib/three/camera.ts) — OBJ không chở camera được.
 *
 * Thuần TS (không DOM) — test: node_modules/.bin/sucrase-node lib/three/cad-to-obj.test.ts
 */
import type { Doc, Entity, HatchEntity, BlockEntity, Pt, BuildOp } from '../cad/model';
import { entityBox, blockToWorld, type Box } from '../cad/model';
import { BLOCK_MAP } from '../cad/furniture';
import { buildHatchFaceIndex, pickHatchFace, collectBoundarySegments, polygonArea, pointInPolygon } from '../cad/hatch';
import { effectiveBlockSize } from '../cad/shape-interactions';
import { isHostableBlock, inferWallHost, OPENING_ELEVATION, estimateWallThicknessMm, DEFAULT_WALL_THICKNESS_MM } from '../cad/hosting';
// 05/08 (S2 BUILD#1) — `lib/cad/levels.ts` đã trả đủ đáy/đỉnh/nguồn-từng-số từ trước nhưng render
// KHÔNG gọi (grep 05/08: 0 nơi). Nối vào đây là đúng chỗ DUY NHẤT đọc cao độ để đùn khối.
import { computeHeights } from '../cad/levels';
import { hexToRgb } from '../gu/color-psychology';

/** Diện tích CÓ DẤU (shoelace) — polygonArea của hatch.ts trả trị tuyệt đối nên tự tính. */
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
 * NC-12 §4.2/§4.3 — tam-giác-hoá 1 lăng trụ đứng (mm, CAD Y-lên) → mảng vị trí phẳng (m, Y-up),
 * CÙNG quy ước toạ độ với `ObjBuilder.vert()`/`prism()` bên dưới ((x, cao, -y)) và CÙNG thứ tự
 * tam-giác-hoá (đáy quạt lộn ngược, đỉnh quạt, cạnh bên 2 tam giác/mặt — khớp `fanTriangles()`).
 * KHÔNG dùng `ObjBuilder` (không cần ghi dòng OBJ/giữ state) — dùng cho hình học "modifier"
 * (cutter của phép boolean, `opCutters` trong `SceneGroup`) chỉ cần feed thẳng vào CSG ở tầng
 * ba.js (`lib/three/build-ops.ts`), không xuất OBJ text.
 */
export function boxPositionsMm(poly: Pt[], z0: number, z1: number): number[] {
  if (poly.length < 3) return [];
  const pts = signedArea(poly) < 0 ? [...poly].reverse() : poly;
  const toM = (p: Pt, z: number): [number, number, number] => [p.x / 1000, z / 1000, -p.y / 1000];
  const bot = pts.map((p) => toM(p, z0));
  const top = pts.map((p) => toM(p, z1));
  const out: number[] = [];
  const pushTri = (a: number[], b: number[], c: number[]) => out.push(...a, ...b, ...c);
  const fan = (ring: number[][]) => {
    for (let i = 1; i < ring.length - 1; i++) pushTri(ring[0], ring[i], ring[i + 1]);
  };
  fan([...bot].reverse()); // đáy úp xuống — cùng chiều `prism()`
  fan(top); // đỉnh ngửa lên
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    pushTri(bot[i], bot[j], top[j]);
    pushTri(bot[i], top[j], top[i]);
  }
  return out;
}

/** Đa giác co vào trong `d` mm theo pháp tuyến trung bình mỗi đỉnh — CÙNG công thức nhánh 'hatch'
 * của `offsetEntity()` (`lib/cad/geometry.ts`), CHÉP CỤC BỘ (không import file đó) để tránh kéo
 * `lib/cad/store.ts` (`geometry.ts` import `newId` từ đó) vào module "thuần TS, không DOM" này —
 * ranh giới đã ghi rõ ở đầu file. `poly` phải kín (walls luôn vậy). Trả null nếu đa giác suy biến
 * hoặc `d` lớn hơn đa giác chịu được (chiều tự lật) — nơi gọi (`prismBeveled`) rơi về lăng trụ
 * thường, không sập/không bevel giả. */
export function insetPolygonMm(poly: Pt[], d: number): Pt[] | null {
  if (poly.length < 3 || d <= 0) return null;
  const pts = signedArea(poly) < 0 ? [...poly].reverse() : poly;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const out = pts.map((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];
    let nx = -(next.y - prev.y);
    let ny = next.x - prev.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    // pháp tuyến phải hướng VÀO TÂM — pts đã chuẩn hoá CCW nên "vào trong" là 1 phía cố định,
    // nhưng vẫn kiểm theo tâm cho chắc (đa giác lõm, tâm hình học có thể lệch phía).
    if ((cx - p.x) * nx + (cy - p.y) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x: p.x + nx * d, y: p.y + ny * d };
  });
  return signedArea(out) > 0 ? out : null; // lật chiều ⇒ d quá lớn so với đa giác, huỷ
}

export type SceneTheme = 'clay' | 'warm' | 'gu';

export interface SceneOptions {
  /** cao tường (mm) — mặc định 2700, user chỉnh được trên node */
  wallHeightMm?: number;
  /** có dựng trần không (mặc định không — nhìn vào trong dễ hơn) */
  ceiling?: boolean;
  theme?: SceneTheme;
  /** palette gu (hex) khi theme 'gu' — lấy từ thư viện Reference */
  palette?: string[];
}

export interface SceneStats {
  walls: number;
  furniture: number;
  rooms: number;
  verts: number;
  faces: number;
  /** bbox mặt bằng (mm) — node dùng đặt camera */
  bboxMm: { minX: number; minY: number; maxX: number; maxY: number };
  /** kích thước thật (m) để hiện trên node */
  sizeM: { w: number; d: number; h: number };
}

/**
 * Một "lớp" hình học cùng 1 màu phẳng (Wall_i/Room_i/Furn_i/Window_i/Floor/Ceiling) — tam giác hoá
 * SẴN, mét, trục Y-up (khớp hệ toạ độ OBJ export: x, cao, -y). `positions` là mảng phẳng KHÔNG
 * index [x0,y0,z0, x1,y1,z1, ...] — đơn giản nhất cho BufferGeometry non-indexed ở tầng viewer
 * (components/three), không cần thêm bước build index buffer cho khối phẳng-màu low-poly này.
 */
export interface SceneGroup {
  name: string;
  colorHex: string;
  positions: number[];
  /** id của `Entity` gốc (Doc chặng 1) sinh ra group này — SPEC-TANG-DU-LIEU-CAU-KIEN §0.4/§8
   * Đ1: "mọi SceneGroup phải có entityId". Đặt cho MỌI group ứng với đúng 1 entity thật
   * (Wall_i ← hatch tường, 3D-5 push-pull; Furn_i/Window_i ← BlockEntity). Vẫn để trống ở
   * `Floor`/`Room_i` — CẢ HAI đều là hình học TÍNH TOÁN (bbox toàn tường / dò biên runtime),
   * KHÔNG ứng với 1 entity riêng nào trong Doc hôm nay (Floor chưa có slab entity; Room_i theo
   * §0.5 "không id bền, đổi theo số đồ trong phòng" — chờ §6 `RoomEntity`, P5, chưa code). */
  entityId?: string;
  /** 3D-5 — cao độ (mm) ĐÃ DÙNG để đùn group tường này (đọc từ `entity.heightMm` hoặc mặc định
   * scene) — viewer 3D dùng số này làm mốc scale khi kéo-đẩy, KHÔNG tính lại từ hình học. */
  heightMm?: number;
  /** 05/08 (S2 BUILD#1) — CAO ĐỘ ĐÁY (mm) group này đứng, giải từ `computeHeights()`
   * (`lib/cad/levels.ts`): `baseConstraint` → `Level.elevationMm` → `entity.elevationMm` → 0.
   * **undefined = đứng ở cốt 0** (giữ nguyên hành vi cũ cho mọi doc chưa khai tầng — không ghi
   * `baseMm: 0` để không làm phình group của bản vẽ 1 tầng).
   *
   * K4 — nơi TIÊU THỤ có thật trong cùng phiên, không phải field treo:
   *  · `lib/three/obj-scene-to-geometry.ts` `MassingWall.baseMm` (đọc ở `buildMassingWalls`)
   *  · `components/three/Scene3DViewer.tsx` push-pull — scale.y phải neo quanh ĐÁY THẬT, không
   *    quanh gốc 0, nếu không tường tầng 2 kéo cao sẽ trượt khỏi sàn tầng đó. */
  baseMm?: number;
  /** SPEC-TANG-DU-LIEU-CAU-KIEN §2.3/L4 — group này được XẾP LOẠI bằng SUY ĐOÁN (tên layer),
   * không phải `elementType` khai báo. Cờ RUNTIME (không lưu vào `.idf`) để UI hiện badge
   * "suy đoán" (P3, chưa làm) — undefined = khai báo (chắc chắn) hoặc không áp dụng. */
  inferred?: true;
  /** SPEC-DUNG-3D-THONG-NHAT §5.1/D1 — tầng chứa entity gốc (`Base.storey`, VD 'GF'/'L1'), đọc
   * NGUYÊN VĂN, không suy đoán theo cao độ (H7/D1: "không có DCEL đáng tin để suy luận"). Chỉ đặt
   * cho group SINH TỪ MỘT ENTITY THẬT (tường/nội thất/cửa sổ — cùng điều kiện với `entityId` ở
   * trên, dù `entityId` hiện chỉ gán cho tường); Sàn/Phòng/Trần là hình học TỔNG HỢP (bbox/dò biên
   * nhiều entity gộp lại) nên không có MỘT storey nguồn để gán — để trống, KHÔNG suy đoán từ storey
   * của entity gần nhất. undefined = chưa xếp tầng (`.idf` cũ, hoặc entity chưa gán storey) — nơi
   * tiêu thụ (cây "Hiện") phải gom nhóm "Chưa xếp tầng", không được im lặng bỏ qua (§5.2 mục 2). */
  storey?: string;
  /** FK mềm `ProductSpec.id` (`Base.specId` — BOQ ENGINE) đọc NGUYÊN VĂN từ entity gốc, cùng điều
   * kiện với `storey` ở trên (chỉ group sinh từ MỘT entity thật). Panel phải (SPEC-DUNG-3D-THONG-
   * NHAT §6) tra `ProductSpec` qua id này để vẽ quả cầu vật liệu — undefined = CHƯA gán, hiện
   * đúng trạng thái "chưa gán vật liệu", không suy đoán/không hiện quả cầu giả. */
  specId?: string;
  /** NC-12 §4.2 — `Base.ops` của entity gốc, đọc NGUYÊN VĂN (chỉ tường/`HatchEntity` truyền vào
   * hôm nay, cùng điều kiện với `entityId`/`heightMm`). Tầng ba.js (`lib/three/build-ops.ts`) đọc
   * field này để biết có cần chạy CSG hay không — file NÀY (`cad-to-obj.ts`) KHÔNG import `three`,
   * chỉ truyền dữ liệu qua, đúng ranh giới "thuần TS" đã ghi ở đầu file. */
  ops?: BuildOp[];
  /** NC-12 §4.2/§4.3 — hình học (mm→m, Y-up, đã tam-giác-hoá — CÙNG khuôn `positions`) của MỖI
   * entity được tham chiếu bởi 1 bậc `{op:'boolean', withRef}` trong `ops` phía trên, khoá theo
   * đúng `withRef` đó. Dựng SẴN Ở ĐÂY (không phải bên `build-ops.ts`) để tầng ba.js không cần đọc
   * lại `Doc`/entity gốc — chỉ cần `geometryOf()` thẳng mảng số này rồi gọi CSG. Cutter (vd
   * `RectEntity` khoét hốc) không tự đứng thành 1 `SceneGroup` riêng (không gọi `builder.object()`
   * cho nó) — nó KHÔNG render độc lập, chỉ là dữ liệu modifier, đúng cách Blender ẩn object cutter
   * của boolean modifier. */
  opCutters?: Record<string, number[]>;
}

export interface ObjScene {
  obj: string;
  mtl: string;
  stats: SceneStats;
  warnings: string[];
  /** SPEC-3D-CORE §3 — nguyên liệu cho adapter ObjScene→BufferGeometry (viết tay, KHÔNG parse
   * lại `obj` text — xem `lib/three/obj-scene-to-geometry.ts`). */
  groups: SceneGroup[];
}

/** Phần CẦN cho tầng trình chiếu 3D (B) — bbox/size để đặt camera, groups để dựng hình. Không
 * kéo theo `obj`/`mtl` text (chỉ dùng cho xuất file, không cần ở viewer). */
export type Scene3DData = Pick<ObjScene, 'groups'> & { bboxMm: SceneStats['bboxMm']; sizeM: SceneStats['sizeM'] };

export function toScene3DData(scene: ObjScene): Scene3DData {
  return { groups: scene.groups, bboxMm: scene.stats.bboxMm, sizeM: scene.stats.sizeM };
}

/** Hoán trục CAD (Y-lên) → three.js (Y-up) — CÙNG ĐƠN VỊ vào/ra, không quy đổi mm→m (dùng cho
 * toạ độ ĐÃ SẴN mét, vd `placeCamera()` — camera.ts). `cadToThreeM` bên dưới thêm bước mm→m cho
 * toạ độ CAD gốc (bbox, vertex, campath). 1 công thức trục duy nhất, không viết lại mỗi nơi
 * (SPEC-3D-CORE §1 luật tầng). */
export function cadAxesToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y];
}

/** CAD (mm, hệ Y-lên phẳng) → three.js (mét, Y-up) — CÙNG quy ước `vert()` dùng để xuất OBJ ở
 * file này: (x, cao, -y). Dùng cho mọi toạ độ THẾ GIỚI CAD gốc (bbox framing, campath, vertex). */
export function cadToThreeM(xMm: number, yMm: number, zMm: number): [number, number, number] {
  const [x, y, z] = cadAxesToThree(xMm, yMm, zMm);
  return [x / 1000, y / 1000, z / 1000];
}

/* ───────────────────── vật liệu ───────────────────── */

interface Mat {
  name: string;
  hex: string;
}

function themeMats(theme: SceneTheme, palette: string[]): Record<'wall' | 'floor' | 'ceil' | 'furn' | 'room', Mat> {
  if (theme === 'clay') {
    return {
      wall: { name: 'wall', hex: '#d8d5cf' },
      floor: { name: 'floor', hex: '#c7c3bb' },
      ceil: { name: 'ceiling', hex: '#e6e3dd' },
      furn: { name: 'furniture', hex: '#bfbab1' },
      room: { name: 'room_floor', hex: '#cdc9c0' },
    };
  }
  if (theme === 'gu' && palette.length) {
    const p = (i: number, fb: string) => (palette[i] && hexToRgb(palette[i]) ? palette[i] : fb);
    return {
      wall: { name: 'wall', hex: '#e8e4dc' },
      floor: { name: 'floor', hex: p(0, '#b08d63') },
      ceil: { name: 'ceiling', hex: '#f0ede6' },
      furn: { name: 'furniture', hex: p(1, '#8a6f52') },
      room: { name: 'room_floor', hex: p(2, p(0, '#c9b394')) },
    };
  }
  // 'warm' — đá ấm + gỗ (gu mặc định của studio)
  return {
    wall: { name: 'wall', hex: '#e8e4dc' },
    floor: { name: 'floor', hex: '#b08d63' },
    ceil: { name: 'ceiling', hex: '#f0ede6' },
    furn: { name: 'furniture', hex: '#8a6f52' },
    room: { name: 'room_floor', hex: '#c9b394' },
  };
}

function mtlOf(mats: Mat[]): string {
  const lines: string[] = ['# InteriorFlow — MTL sinh tất định từ bản vẽ CAD'];
  for (const m of mats) {
    const rgb = hexToRgb(m.hex) ?? { r: 200, g: 200, b: 200 };
    const f = (v: number) => (v / 255).toFixed(4);
    lines.push(`newmtl ${m.name}`);
    lines.push(`Kd ${f(rgb.r)} ${f(rgb.g)} ${f(rgb.b)}`);
    lines.push('Ka 0.0000 0.0000 0.0000');
    lines.push('Ks 0.0500 0.0500 0.0500');
    lines.push('Ns 10.0');
    lines.push('d 1.0');
    lines.push('illum 2');
  }
  return lines.join('\n') + '\n';
}

/* ───────────────────── dựng hình ───────────────────── */

/** Cao proxy (mm) theo block id — đúng "tầm" đồ thật, đủ cho khối nghiên cứu. */
export function furnitureHeightMm(blockId: string): number {
  const id = blockId.toLowerCase();
  if (id.startsWith('sofa') || id === 'armchair') return 800;
  if (id.startsWith('bed')) return 500;
  if (id.startsWith('dining') || id === 'desk') return 750;
  if (id === 'wardrobe') return 2100;
  if (id.startsWith('kitchen')) return 900;
  if (id === 'toilet') return 750;
  if (id === 'lavabo') return 850;
  if (id === 'bathtub') return 550;
  return 750;
}

/** builder OBJ — gom vertex/face, đơn vị mét, trục OBJ Y-up: (x, cao, -y). Đồng thời gom SONG
 * SONG hình học đã tam-giác-hoá theo từng `object()` vào `groups` (SceneGroup) — 1 nguồn dựng cả
 * OBJ text (xuất file) lẫn BufferGeometry (viewer 3D), tránh 2 lần logic dựng hình lệch nhau. */
class ObjBuilder {
  private lines: string[] = [];
  private v = 0;
  verts = 0;
  faces = 0;
  private posByIndex: number[][] = []; // posByIndex[i] = vị trí (m, Y-up) của vertex OBJ #(i+1)
  private groupList: SceneGroup[] = [];
  private cur: { name: string; colorHex: string; tris: number[]; entityId?: string; heightMm?: number; baseMm?: number; inferred?: true; storey?: string; specId?: string; ops?: BuildOp[]; opCutters?: Record<string, number[]> } | null = null;

  constructor(mtlFile: string) {
    this.lines.push('# InteriorFlow — OBJ sinh tất định từ bản vẽ CAD (mm → m)');
    this.lines.push(`mtllib ${mtlFile}`);
  }

  /** `entityId`/`heightMm` (3D-5 push-pull) — chỉ tường truyền vào, group khác bỏ trống.
   * `inferred` (§2.3/L4) — group xếp loại bằng suy đoán tên layer, không phải `elementType`.
   * `storey` (SPEC-DUNG-3D-THONG-NHAT §5.1/D1) — tầng của entity gốc, group hình học tổng hợp
   * (Sàn/Phòng/Trần) không truyền. `ops`/`opCutters` (NC-12 §4.2/§4.3) — ngăn xếp dựng hình +
   * hình học cutter đã tam-giác-hoá sẵn (`boxPositionsMm`), tầng ba.js đọc để chạy CSG. */
  object(name: string, mat: Mat, meta?: { entityId?: string; heightMm?: number; baseMm?: number; inferred?: true; storey?: string; specId?: string; ops?: BuildOp[]; opCutters?: Record<string, number[]> }) {
    this.lines.push(`o ${name}`);
    this.lines.push(`usemtl ${mat.name}`);
    this.flushGroup();
    this.cur = { name, colorHex: mat.hex, tris: [], entityId: meta?.entityId, heightMm: meta?.heightMm, baseMm: meta?.baseMm, inferred: meta?.inferred, storey: meta?.storey, specId: meta?.specId, ops: meta?.ops, opCutters: meta?.opCutters };
  }

  private flushGroup() {
    if (this.cur && this.cur.tris.length) {
      this.groupList.push({
        name: this.cur.name,
        colorHex: this.cur.colorHex,
        positions: this.cur.tris,
        entityId: this.cur.entityId,
        heightMm: this.cur.heightMm,
        baseMm: this.cur.baseMm,
        inferred: this.cur.inferred,
        storey: this.cur.storey,
        specId: this.cur.specId,
        ops: this.cur.ops,
        opCutters: this.cur.opCutters,
      });
    }
    this.cur = null;
  }

  /** thêm vertex thế giới CAD (mm) → OBJ (m, Y-up). Trả index 1-based. */
  private vert(xMm: number, yMm: number, zMm: number): number {
    const x = xMm / 1000;
    const y = zMm / 1000;
    const z = -yMm / 1000;
    const f = (n: number) => n.toFixed(4);
    this.lines.push(`v ${f(x)} ${f(y)} ${f(z)}`);
    this.v += 1;
    this.verts += 1;
    this.posByIndex.push([x, y, z]);
    return this.v;
  }

  private face(idx: number[]) {
    this.lines.push(`f ${idx.join(' ')}`);
    this.faces += 1;
  }

  /** tam-giác quạt (fan) từ idx[0] — đúng cho đa giác lồi/star-shaped (tường/phòng/sàn thường
   * vậy); đa giác lõm phức tạp có thể ra tam giác sai — chấp nhận được, viewer chỉ cần "đúng hình
   * học đủ xem", không phải render production (§6 SPEC-3D-CORE). Không quan tâm chiều winding —
   * material viewer dùng `side: DoubleSide` (không đèn/bóng đổ nên winding không ảnh hưởng gì). */
  private fanTriangles(idx: number[]) {
    if (!this.cur) return;
    for (let i = 1; i < idx.length - 1; i++) {
      for (const k of [idx[0], idx[i], idx[i + 1]]) {
        const p = this.posByIndex[k - 1];
        this.cur.tris.push(p[0], p[1], p[2]);
      }
    }
  }

  /**
   * Lăng trụ đứng từ đa giác mặt bằng (mm) — đáy z0, đỉnh z1. Mặt đáy/đỉnh là n-gon
   * (Blender/Max tự tam-giác-hoá khi import); mặt bên là quad.
   */
  prism(poly: Pt[], z0: number, z1: number) {
    if (poly.length < 3) return;
    // chuẩn hoá chiều dương (CCW) để mặt đỉnh ngửa lên
    const pts = signedArea(poly) < 0 ? [...poly].reverse() : poly;
    const bot = pts.map((p) => this.vert(p.x, p.y, z0));
    const top = pts.map((p) => this.vert(p.x, p.y, z1));
    this.face([...bot].reverse()); // đáy úp xuống
    this.face(top); // đỉnh ngửa lên
    this.fanTriangles([...bot].reverse());
    this.fanTriangles(top);
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      this.face([bot[i], bot[j], top[j], top[i]]);
      this.fanTriangles([bot[i], bot[j], top[j], top[i]]);
    }
  }

  /** hộp theo 4 điểm đáy (đã biến hình) — tiện cho proxy nội thất. */
  box4(base: [Pt, Pt, Pt, Pt], z0: number, z1: number) {
    this.prism(base, z0, z1);
  }

  /** NC-12 §4.2 tầng ③ "extrude" — lăng trụ VÁT CẠNH TRÊN (bevel, mm): thân đứng z0→(z1-bevel)
   * bằng `poly` gốc (giống `prism()`), dải vát (z1-bevel)→z1 nối `poly` gốc (dưới dải) với đa
   * giác đã co vào `bevel` mm (trên dải, `insetPolygonMm`), nắp trên dùng đa giác đã co — đúng ý
   * "Bevel" từng ghi treo ở `Object3DInspector`/`Command3DPanel` (PLACEHOLDER_COPY.sua cũ).
   * bevel<=0 HOẶC đa giác co bị lật chiều (bevel vượt quá nửa bề rộng poly) ⇒ rơi về `prism()`
   * thường — KHÔNG sập, KHÔNG vẽ bevel giả. */
  prismBeveled(poly: Pt[], z0: number, z1: number, bevelMm: number) {
    const bevel = Math.min(bevelMm, Math.max(0, z1 - z0 - 1));
    const inset = bevel > 0 ? insetPolygonMm(poly, bevel) : null;
    if (!inset) {
      this.prism(poly, z0, z1);
      return;
    }
    const pts = signedArea(poly) < 0 ? [...poly].reverse() : poly;
    const midZ = z1 - bevel;
    const bot = pts.map((p) => this.vert(p.x, p.y, z0));
    const mid = pts.map((p) => this.vert(p.x, p.y, midZ));
    const top = inset.map((p) => this.vert(p.x, p.y, z1));
    this.face([...bot].reverse()); // đáy úp xuống
    this.fanTriangles([...bot].reverse());
    this.face(top); // đỉnh (đã co) ngửa lên
    this.fanTriangles(top);
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      // thân đứng z0→midZ
      this.face([bot[i], bot[j], mid[j], mid[i]]);
      this.fanTriangles([bot[i], bot[j], mid[j], mid[i]]);
      // dải vát midZ→z1 (ngoài → trong)
      this.face([mid[i], mid[j], top[j], top[i]]);
      this.fanTriangles([mid[i], mid[j], top[j], top[i]]);
    }
  }

  toString(): string {
    return this.lines.join('\n') + '\n';
  }

  groups(): SceneGroup[] {
    this.flushGroup();
    return this.groupList;
  }
}

function wallLayerIds(doc: Doc): Set<string> {
  const ids = new Set<string>();
  for (const l of doc.layers) {
    if (l.id === 'l-wall' || /tường|wall/i.test(l.name)) ids.add(l.id);
  }
  return ids;
}

/** 4 góc footprint block sau translate→rotate→scale (theo BlockEntity, mm thế giới). */
export function blockFootprint(b: BlockEntity): [Pt, Pt, Pt, Pt] | null {
  const def = BLOCK_MAP[b.block];
  if (!def) return null;
  const hw = def.w / 2;
  const hh = def.h / 2;
  const local: Pt[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  const cos = Math.cos(b.rot);
  const sin = Math.sin(b.rot);
  const out = local.map((p) => {
    const sxp = p.x * b.sx;
    const syp = p.y * b.sy;
    return { x: b.at.x + sxp * cos - syp * sin, y: b.at.y + sxp * sin + syp * cos };
  });
  return out as [Pt, Pt, Pt, Pt];
}

/** NC-12 §4.2 — cutter của bậc `{op:'boolean', withRef}`: entity KHÁC trong CÙNG `Doc` (K1, không
 * type hình học riêng cho "cutter"). Hỗ trợ 2 dạng: `RectEntity` (footprint chữ nhật, cutter tay
 * "Khoét hốc") và `PolylineEntity` đóng kín (footprint ĐÃ XOAY, cutter cửa/cửa sổ hosted —
 * `lib/cad/hosting.ts` `buildOpeningCutter`, luôn xoay theo đúng góc block chứ không chỉ trục
 * thẳng như rect). Trả `null` nếu không tra được/không phải 1 trong 2 dạng trên — nơi gọi
 * (`buildOpCutters`) tự bỏ qua bậc đó thay vì sập (N4: thiếu dữ liệu thì giữ nguyên, không gán
 * bừa/suy đoán).
 *
 * Cao độ: z0 = `e.elevationMm ?? 0` (VIỆC "cửa/cửa sổ hosted" — trước đây luôn cắt từ sàn, SAI cho
 * cửa sổ có bệ cao; docstring cũ ở đây đã ghi trước "để dành khi có UI thật đòi hỏi", nay tới lúc
 * dùng), z1 = z0 + (`e.heightMm` ?? phần tường còn lại phía trên z0). KHÔNG dùng `clampWallHeight()`
 * — đó là ngưỡng cho TƯỜNG (2-6m), cutter có thể chỉ vài trăm mm. */
function cutterPositionsMm(ref: string, doc: Doc, wallH: number, wallBaseMm = 0): number[] | null {
  const e = doc.entities.find((x) => x.id === ref);
  if (!e) return null;
  let poly: Pt[];
  if (e.type === 'rect') {
    poly = [
      { x: e.x, y: e.y },
      { x: e.x + e.w, y: e.y },
      { x: e.x + e.w, y: e.y + e.h },
      { x: e.x, y: e.y + e.h },
    ];
  } else if (e.type === 'polyline' && e.closed && e.points.length >= 3) {
    poly = e.points;
  } else {
    return null;
  }
  // `elevationMm` của cutter là bệ đo TỪ CHÂN TƯỜNG (hosting.ts:121 ghi `elevationMm = sillMm`),
  // KHÔNG phải từ ±0.000 công trình — cảnh báo này đã ghi sẵn ở `levels.ts:49`. Nên phải CỘNG
  // đáy thật của tường chủ vào, nếu không tường tầng 2 lên cao mà lỗ cửa vẫn nằm ở tầng trệt.
  const local0 = e.elevationMm ?? 0;
  const localH = e.heightMm ?? Math.max(0, wallH - local0);
  const z0 = wallBaseMm + local0;
  return boxPositionsMm(poly, z0, z0 + localH);
}

/** NC-12 §4.3 — gom hình học cutter cho MỌI bậc `boolean` trong `ops` của 1 entity, khoá theo
 * đúng `withRef` (khớp field `SceneGroup.opCutters`). `undefined` nếu `ops` không có bậc boolean
 * nào hoặc không cutter nào tra được — `object()` nhận `undefined` cũng như không truyền gì. */
function buildOpCutters(ops: BuildOp[] | undefined, doc: Doc, wallH: number, wallBaseMm = 0): Record<string, number[]> | undefined {
  const boolOps = ops?.filter((op) => op.op === 'boolean');
  if (!boolOps?.length) return undefined;
  const out: Record<string, number[]> = {};
  for (const op of boolOps) {
    if (op.op !== 'boolean') continue;
    const positions = cutterPositionsMm(op.withRef, doc, wallH, wallBaseMm);
    if (positions) out[op.withRef] = positions;
  }
  return Object.keys(out).length ? out : undefined;
}

function docBbox(entities: Entity[]): Box | null {
  let box: Box | null = null;
  for (const e of entities) {
    const b = entityBox(e);
    if (!Number.isFinite(b.minX)) continue;
    if (!box) box = { ...b };
    else {
      box.minX = Math.min(box.minX, b.minX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxX = Math.max(box.maxX, b.maxX);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
  }
  return box;
}

/** Cùng 1 khung kẹp [2000,6000]mm cho cao tường — dùng chung giữa mặc định scene và cao riêng
 * từng tường (`entity.heightMm`, 3D-5 push-pull) để 2 đường không lệch trần. Export để viewer
 * (`Scene3DViewer.tsx`, thao tác kéo-đẩy) kẹp SỐ GHI NGƯỢC vào Doc đúng cùng biên, không lặp lại
 * hằng số. */
export function clampWallHeight(mm: number): number {
  return Math.max(2000, Math.min(6000, mm));
}

/**
 * Doc bản vẽ (chặng 1) → scene OBJ+MTL. Tất định 100%: cùng Doc + options cho cùng file.
 */
export function docToObjScene(doc: Doc, opts: SceneOptions = {}): ObjScene {
  const H = clampWallHeight(opts.wallHeightMm ?? 2700);
  const theme = opts.theme ?? 'warm';
  const mats = themeMats(theme, opts.palette ?? []);
  const warnings: string[] = [];

  // SPEC-TANG-DU-LIEU-CAU-KIEN §2.3 — thang ưu tiên "khai báo thắng suy đoán" (luật L3), thay
  // nhánh `||` cũ (e.solid===true / e.pattern==='SOLID' / !e.pattern) — gốc khuyết §0.3: một mảng
  // HATCH tô SOLID bất kỳ (vd preset sơn "Sơn trắng", KHÔNG nằm trên layer tường) từng bị coi là
  // tường và đùn khối 2.7m giữa phòng. Nay: có `elementType` thì NGHE NÓ, hết — chỉ khi
  // `elementType` CHƯA GÁN (undefined) mới lùi về suy đoán tạm qua tên layer (giữ cho `.idf` cũ),
  // và suy đoán đó phải gắn cờ `inferred` (L4) ở nơi tạo group bên dưới.
  const wallLayers = wallLayerIds(doc);
  const wallHatches = doc.entities.filter((e): e is HatchEntity => {
    if (e.type !== 'hatch' || e.points.length < 3) return false;
    if (e.elementType !== undefined) return e.elementType === 'wall'; // khai báo (kể cả null) thắng, DỪNG
    return wallLayers.has(e.layer); // undefined → suy đoán tạm theo tên layer
  });
  const blocks = doc.entities.filter((e): e is BlockEntity => e.type === 'block');
  const furnitureBlocks = blocks.filter((b) => {
    const def = BLOCK_MAP[b.block];
    return def && def.group !== 'Kiến trúc';
  });
  // VIỆC "cửa/cửa sổ hosted" (SO-KIEM-TONG §7) — TẤT CẢ block cửa/cửa sổ (trước đây chỉ mỗi
  // block === 'window' đúng nghĩa đen được vẽ; 8 biến thể còn lại — cửa mọi loại, cửa sổ trượt/cố
  // định — hoàn toàn VÔ HÌNH trong 3D, đúng lỗi Hoà chỉ ra).
  const hostedBlocks = blocks.filter((b) => isHostableBlock(b.block));

  const structural = wallHatches.length
    ? (wallHatches as Entity[])
    : doc.entities.filter((e) => e.type !== 'block' && e.type !== 'text' && e.type !== 'dim');
  const bbox = docBbox(structural.length ? structural : doc.entities);
  if (!bbox) {
    throw new Error('Bản vẽ trống — vẽ tường/nội thất ở chặng CAD trước.');
  }
  if (!wallHatches.length) warnings.push('Không tìm thấy poché tường (hatch) — chỉ dựng sàn + nội thất.');

  const builder = new ObjBuilder('scene.mtl');

  // ---- Sàn: slab bbox (dày 100mm, mặt trên z=0) ----
  const pad = 50; // nở 50mm cho kín mép tường
  const floorPoly: Pt[] = [
    { x: bbox.minX - pad, y: bbox.minY - pad },
    { x: bbox.maxX + pad, y: bbox.minY - pad },
    { x: bbox.maxX + pad, y: bbox.maxY + pad },
    { x: bbox.minX - pad, y: bbox.maxY + pad },
  ];
  // Floor KHÔNG gán entityId — bbox nở 50mm của TOÀN BỘ tường, không phải hình học của 1 entity
  // riêng lẻ nào trong Doc (không như Wall_i/Furn_i/Window_i đều bắt nguồn từ đúng 1 entity).
  // Đ1 (SPEC-TANG-DU-LIEU-CAU-KIEN §8) chỉ đòi "mọi group PHẢI có entityId" khi group đó THỰC SỰ
  // ứng với entity — Floor chưa có entity nguồn (chờ §6 RoomEntity/slab entity, P5, chưa code).
  builder.object('Floor', mats.floor);
  builder.prism(floorPoly, -100, 0);

  // ---- Phòng: dò biên qua findHatchBoundary tại tâm mỗi block nội thất (import-only) ----
  // Sàn phòng nổi 2mm trên slab → vật liệu phòng đọc được trong Max/Blender.
  // Room_i CŨNG chưa gán entityId — đúng như §0.5 đã ghi rõ: polygon này TÍNH LẠI mỗi lần dựng
  // (không id bền, đổi theo số đồ trong phòng), không phải entity thật trong Doc. Gán entityId
  // giả (vd theo furniture kích hoạt) sẽ SAI — nó neo vào phòng chứ không phải cái đồ đó. Chờ
  // §6 `RoomEntity` (P5, chưa code) mới có id thật để gán ở đây.
  const roomPolys: Pt[][] = [];
  const traceDoc: Doc = {
    layers: doc.layers,
    entities: doc.entities.filter((e) => e.type !== 'block' && e.type !== 'text' && e.type !== 'dim' && e.type !== 'hatch'),
  };
  // 05/08 (PHU) — DỰNG CHỈ MỤC MỘT LẦN, hỏi N lần. Bản cũ gọi `findHatchBoundary(traceDoc, b.at)`
  // trong vòng lặp ⇒ mỗi món đồ dựng LẠI toàn bộ phân hoạch mặt phẳng của cùng một bản vẽ. Đo
  // được: 289 phòng × 578 món = 12,2 s; 1.156 phòng × 2.312 món ≈ 173 s — đúng "treo >2 phút" ghi
  // ở `docs/TECH-DEBT.md`. Bảng số đo đầy đủ + số sau khi vá ở docstring `HatchFaceIndex`.
  const faceIndex = buildHatchFaceIndex(collectBoundarySegments(traceDoc));
  for (const b of furnitureBlocks) {
    try {
      const poly = pickHatchFace(faceIndex, b.at);
      if (!poly || poly.length < 3) continue;
      const area = polygonArea(poly); // hatch.ts: trị tuyệt đối
      if (area < 1_000_000) continue; // < 1m² — nhiễu
      const dup = roomPolys.some(
        (r) => Math.abs(polygonArea(r) - area) / area < 0.01 && pointInPolygon(b.at, r),
      );
      if (!dup) roomPolys.push(poly);
    } catch {
      // dò biên là nice-to-have — lỗi thì bỏ qua phòng đó
    }
  }
  roomPolys.forEach((poly, i) => {
    builder.object(`Room_${i + 1}`, mats.room);
    builder.prism(poly, 0, 2);
  });

  // ---- Tường: extrude poché — mỗi tường đọc cao độ RIÊNG (`h.heightMm`, ghi ngược từ push-pull
  // 3D-5) nếu có, không thì dùng cao mặc định scene H. Đây là NGUỒN DUY NHẤT cho cao độ tường —
  // Doc quyết, 3D chỉ đọc lại (luật một nguồn, `CHOT-HUONG-3D-2026-08-01.md`). ----
  wallHatches.forEach((h, i) => {
    // 05/08 (S2 BUILD#1) — TRƯỚC: `clampWallHeight(h.heightMm ?? H)` + `prism(..., 0, wallH)`, tức
    // mọi tường đứng ở cốt 0 bất kể khai tầng gì ⇒ nhà nhiều tầng chồng lên nhau. NAY hỏi
    // `computeHeights()` — nguồn DUY NHẤT đã giải xong `baseConstraint`/`Level`/`elevationMm`.
    // Tương thích ngược tuyệt đối: doc chưa khai tầng ⇒ baseMm=0 và heightMm=`h.heightMm`, ra
    // đúng hai con số cũ (test [10] `cad-to-obj.test.ts` khoá đúng điều này).
    const hh = computeHeights(h, doc);
    const baseMm = hh.baseMm;
    let wallH: number;
    if (hh.degenerate) {
      // N4/§9 — KHÔNG dựng khối lộn ngược, cũng KHÔNG nuốt: dùng cao mặc định + nói thật.
      warnings.push(
        `Tường "${h.id}": tầng đỉnh thấp hơn hoặc bằng tầng đáy (cao ${hh.heightMm}mm) — đã dựng tạm cao mặc định ${clampWallHeight(H)}mm. Sửa lại ràng buộc cao độ.`,
      );
      wallH = clampWallHeight(H);
    } else {
      wallH = clampWallHeight(hh.heightMm ?? H);
    }
    if (hh.danglingLevelIds?.length) {
      warnings.push(
        `Tường "${h.id}" trỏ vào tầng đã xoá (${hh.danglingLevelIds.join(', ')}) — đã dựng ở cốt ${Math.round(baseMm)}mm theo bậc lùi. Gán lại tầng cho cấu kiện này.`,
      );
    }
    const inferred = h.elementType === undefined ? true : undefined;
    const opCutters = buildOpCutters(h.ops, doc, wallH, baseMm);
    builder.object(`Wall_${i + 1}`, mats.wall, {
      entityId: h.id,
      heightMm: wallH,
      ...(baseMm !== 0 ? { baseMm } : {}),
      storey: h.storey,
      specId: h.specId,
      ops: h.ops,
      opCutters,
      ...(inferred ? { inferred } : {}),
    });
    // NC-12 §4.2 tầng ③ "extrude" — bevel THẬT (khác `arrayLinear`, tính ở tầng ba.js
    // `build-ops.ts`): bevel cần ĐA GIÁC gốc của tường, đã mất khi xuống tới triangle soup của
    // `SceneGroup.positions` — phải áp Ở ĐÂY, nơi còn `h.points`.
    const bevelOp = h.ops?.find((op): op is Extract<BuildOp, { op: 'extrude' }> => op.op === 'extrude' && (op.bevel ?? 0) > 0);
    if (bevelOp) builder.prismBeveled(h.points, baseMm, baseMm + wallH, bevelOp.bevel!);
    else builder.prism(h.points, baseMm, baseMm + wallH);
  });

  // ---- Trần (tuỳ chọn) ----
  if (opts.ceiling) {
    builder.object('Ceiling', mats.ceil);
    builder.prism(floorPoly, H, H + 100);
  }

  // ---- Nội thất: proxy box đúng footprint ----
  // Đ1 (§8) — gán entityId = đúng BlockEntity nguồn: vá khuyết §0.4, mở khoá chọn 1 cái ghế
  // trong 3D → nối lại Doc (Inspector sửa specId, "chọn hết cùng loại" theo b.block ở Doc).
  furnitureBlocks.forEach((b, i) => {
    const base = blockFootprint(b);
    if (!base) return;
    const def = BLOCK_MAP[b.block];
    // ⚠️ KHÔNG truyền entityId ở đây (dù có b.id thật): `Scene3DViewer.tsx:201` loại MỌI group có
    // entityId khỏi đường dựng hình TĨNH khi mode='massing' (coi đó là tường đang chỉnh), rồi
    // `buildMassingWalls()` lại yêu cầu `heightMm` mới đưa vào đường TƯƠNG TÁC — group nội thất
    // không có heightMm ⇒ rơi vào khe hở giữa hai đường, BIẾN MẤT khỏi cảnh hoàn toàn. Đã thử và
    // phát hiện lỗi này khi viết code (chưa từng lên browser) — chừa lại làm bằng chứng cho vòng
    // sau: muốn nội thất chọn được trong 3D phải mở rộng CẢ HAI hàm trên cho đúng, không phải chỉ
    // thêm entityId ở đây.
    // 05/08 (S2 BUILD#1) — CHỈ dời ĐÁY theo tầng, chiều cao vẫn lấy `furnitureHeightMm(def.id)`
    // như cũ: `computeHeights().topMm` của 1 BlockEntity nội thất hầu như luôn undefined (đồ đạc
    // không khai `heightMm`), lấy nó sẽ là bịa. Đáy sai thì cái ghế nằm dưới sàn tầng 2 — nhìn
    // thấy ngay; nên chỉ vá đúng cái sai, không nhân tiện đổi luôn chiều cao.
    const fBase = computeHeights(b, doc).baseMm;
    builder.object(`Furn_${i + 1}_${def.id}`, mats.furn, { storey: b.storey, specId: b.specId, ...(fBase !== 0 ? { baseMm: fBase } : {}) });
    builder.box4(base, fBase, fBase + furnitureHeightMm(def.id));
  });

  // ---- Cửa/cửa sổ HOSTED (SO-KIEM-TONG §7) — lỗ đã khoét THẬT vào tường qua `ops[]` boolean ở
  // vòng lặp tường trên (`buildOpCutters` đọc đúng cutter `lib/cad/hosting.ts` sinh, KHÔNG viết
  // đường dựng thứ hai — K1). Ở đây chỉ dựng phần NHÌN THẤY lắp VÀO lỗ đó: cửa sổ = tấm kính mỏng
  // (không còn khối đứng chồng lên tường như trước), cửa = khung + cánh đơn giản. Toạ độ LOCAL
  // (x = dọc bề rộng, y = xuyên bề dày tường) map sang world bằng ĐÚNG `blockToWorld` mà
  // `blockFootprint`/cutter dùng — không tự chế phép biến hình khác.
  const wallsById = new Map(wallHatches.map((w) => [w.id, w] as const));
  let windowIdx = 0;
  let doorIdx = 0;
  const quad = (b: BlockEntity, xMin: number, xMax: number, yMin: number, yMax: number): [Pt, Pt, Pt, Pt] => {
    const local: Pt[] = [
      { x: xMin, y: yMin },
      { x: xMax, y: yMin },
      { x: xMax, y: yMax },
      { x: xMin, y: yMax },
    ];
    return local.map((p) => blockToWorld(p, { at: b.at, rot: b.rot, sx: 1, sy: 1 })) as [Pt, Pt, Pt, Pt];
  };
  hostedBlocks.forEach((b) => {
    const kind = isHostableBlock(b.block);
    if (!kind) return;
    const hostWallId = inferWallHost(b.at, doc, wallsById);
    const hostWall = hostWallId ? wallsById.get(hostWallId) : undefined;
    const { sillMm: sillLocal, headMm: headLocal } = OPENING_ELEVATION[kind];
    // 05/08 (S2 BUILD#1) — bệ/lanh-tô của cửa đo TỪ CHÂN TƯỜNG CHỦ (cùng quy ước cutter, xem
    // `cutterPositionsMm`). Lấy đáy của ĐÚNG TƯỜNG CHỦ chứ không phải của bản thân khối cửa: lỗ
    // đã khoét vào tường theo hệ của tường, cánh cửa phải lắp đúng vào lỗ đó. Không có tường chủ
    // (cửa đứng rời) ⇒ về 0 như cũ.
    const hostBaseMm = hostWall ? computeHeights(hostWall, doc).baseMm : 0;
    const sillMm = hostBaseMm + sillLocal;
    const headMm = hostBaseMm + headLocal;
    const width = effectiveBlockSize(b).w;
    const thickness = hostWall ? estimateWallThicknessMm(hostWall.points) : DEFAULT_WALL_THICKNESS_MM;
    const hw = width / 2;
    const ht = thickness / 2;

    if (kind === 'window') {
      windowIdx += 1;
      // tấm kính mỏng LẮP VÀO lỗ — dày tối đa 30mm hoặc hết bề dày tường (tường rất mỏng), không
      // còn "đè tường" như khối proxy cũ (§ VIỆC 2).
      const paneT = Math.min(30, thickness) / 2;
      builder.object(`Window_${windowIdx}`, mats.wall, { entityId: b.id, storey: b.storey, specId: b.specId, ...(hostBaseMm !== 0 ? { baseMm: hostBaseMm } : {}) });
      builder.box4(quad(b, -hw, hw, -paneT, paneT), sillMm, headMm);
      return;
    }

    // Cửa (§ VIỆC 3) — khung (2 nẹp đứng + 1 nẹp ngang trên) + cánh đơn giản, khối xám phẳng,
    // KHÔNG PBR (`docs/SPEC-3D-CORE.md` §6 — đẹp là việc D5, IF chỉ cần đúng hình học tối thiểu).
    doorIdx += 1;
    const frameT = Math.min(60, Math.max(20, hw)); // nẹp 60mm, tự co với cửa rất hẹp (hiếm)
    const meta = { entityId: b.id, storey: b.storey, specId: b.specId, ...(hostBaseMm !== 0 ? { baseMm: hostBaseMm } : {}) };
    builder.object(`Door_${doorIdx}_khung`, mats.wall, meta);
    builder.box4(quad(b, -hw, -hw + frameT, -ht, ht), sillMm, headMm); // nẹp trái
    builder.box4(quad(b, hw - frameT, hw, -ht, ht), sillMm, headMm); // nẹp phải
    builder.box4(quad(b, -hw + frameT, hw - frameT, -ht, ht), headMm - frameT, headMm); // nẹp trên (lanh tô)
    const panelGap = 5;
    const panelHalfW = Math.max(20, hw - frameT - panelGap);
    const panelT = Math.min(40, thickness) / 2;
    builder.object(`Door_${doorIdx}_canh`, mats.furn, meta);
    builder.box4(quad(b, -panelHalfW, panelHalfW, -panelT, panelT), sillMm, headMm - frameT); // cánh cửa
  });

  const stats: SceneStats = {
    walls: wallHatches.length,
    furniture: furnitureBlocks.length,
    rooms: roomPolys.length,
    verts: builder.verts,
    faces: builder.faces,
    bboxMm: { minX: bbox.minX, minY: bbox.minY, maxX: bbox.maxX, maxY: bbox.maxY },
    sizeM: {
      w: Math.round((bbox.maxX - bbox.minX) / 10) / 100,
      d: Math.round((bbox.maxY - bbox.minY) / 10) / 100,
      h: H / 1000,
    },
  };

  return {
    obj: builder.toString(),
    mtl: mtlOf([mats.wall, mats.floor, mats.ceil, mats.furn, mats.room]),
    stats,
    warnings,
    groups: builder.groups(),
  };
}
