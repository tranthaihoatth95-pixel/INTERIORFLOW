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
import { entityBox, type Box } from '../cad/model';
import { BLOCK_MAP } from '../cad/furniture';
import { findHatchBoundary, polygonArea, pointInPolygon } from '../cad/hatch';
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
  private cur: { name: string; colorHex: string; tris: number[]; entityId?: string; heightMm?: number; inferred?: true; storey?: string; specId?: string; ops?: BuildOp[]; opCutters?: Record<string, number[]> } | null = null;

  constructor(mtlFile: string) {
    this.lines.push('# InteriorFlow — OBJ sinh tất định từ bản vẽ CAD (mm → m)');
    this.lines.push(`mtllib ${mtlFile}`);
  }

  /** `entityId`/`heightMm` (3D-5 push-pull) — chỉ tường truyền vào, group khác bỏ trống.
   * `inferred` (§2.3/L4) — group xếp loại bằng suy đoán tên layer, không phải `elementType`.
   * `storey` (SPEC-DUNG-3D-THONG-NHAT §5.1/D1) — tầng của entity gốc, group hình học tổng hợp
   * (Sàn/Phòng/Trần) không truyền. `ops`/`opCutters` (NC-12 §4.2/§4.3) — ngăn xếp dựng hình +
   * hình học cutter đã tam-giác-hoá sẵn (`boxPositionsMm`), tầng ba.js đọc để chạy CSG. */
  object(name: string, mat: Mat, meta?: { entityId?: string; heightMm?: number; inferred?: true; storey?: string; specId?: string; ops?: BuildOp[]; opCutters?: Record<string, number[]> }) {
    this.lines.push(`o ${name}`);
    this.lines.push(`usemtl ${mat.name}`);
    this.flushGroup();
    this.cur = { name, colorHex: mat.hex, tris: [], entityId: meta?.entityId, heightMm: meta?.heightMm, inferred: meta?.inferred, storey: meta?.storey, specId: meta?.specId, ops: meta?.ops, opCutters: meta?.opCutters };
  }

  private flushGroup() {
    if (this.cur && this.cur.tris.length) {
      this.groupList.push({
        name: this.cur.name,
        colorHex: this.cur.colorHex,
        positions: this.cur.tris,
        entityId: this.cur.entityId,
        heightMm: this.cur.heightMm,
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
 * type hình học riêng cho "cutter"). Hôm nay hỗ trợ `RectEntity` (footprint chữ nhật + `Base.
 * heightMm` RIÊNG = chiều cao khối cắt — undefined thì tràn hết cao tường `wallH`, tức "hốc từ
 * sàn tới trần"). Trả `null` nếu không tra được/không phải rect — nơi gọi (`buildOpCutters`) tự bỏ
 * qua bậc đó thay vì sập (N4: thiếu dữ liệu thì giữ nguyên, không gán bừa/suy đoán). CHƯA hỗ trợ
 * cao độ đáy riêng (`elevationMm`) — cutter luôn cắt từ z=0, ghi rõ để phiên sau không tưởng đã
 * làm (N5); đủ cho ca "khoét hốc từ sàn" của nghiệm thu VIỆC 3, chưa đủ cho gờ chỉ lưng chừng
 * tường (cần thêm field, để dành khi có UI thật đòi hỏi — K4). */
function cutterPositionsMm(ref: string, doc: Doc, wallH: number): number[] | null {
  const e = doc.entities.find((x) => x.id === ref);
  if (!e || e.type !== 'rect') return null;
  const poly: Pt[] = [
    { x: e.x, y: e.y },
    { x: e.x + e.w, y: e.y },
    { x: e.x + e.w, y: e.y + e.h },
    { x: e.x, y: e.y + e.h },
  ];
  const cutH = e.heightMm ?? wallH; // KHÔNG dùng clampWallHeight() — đó là ngưỡng cho TƯỜNG (2-6m), cutter có thể chỉ vài trăm mm.
  return boxPositionsMm(poly, 0, cutH);
}

/** NC-12 §4.3 — gom hình học cutter cho MỌI bậc `boolean` trong `ops` của 1 entity, khoá theo
 * đúng `withRef` (khớp field `SceneGroup.opCutters`). `undefined` nếu `ops` không có bậc boolean
 * nào hoặc không cutter nào tra được — `object()` nhận `undefined` cũng như không truyền gì. */
function buildOpCutters(ops: BuildOp[] | undefined, doc: Doc, wallH: number): Record<string, number[]> | undefined {
  const boolOps = ops?.filter((op) => op.op === 'boolean');
  if (!boolOps?.length) return undefined;
  const out: Record<string, number[]> = {};
  for (const op of boolOps) {
    if (op.op !== 'boolean') continue;
    const positions = cutterPositionsMm(op.withRef, doc, wallH);
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
  const windows = blocks.filter((b) => b.block === 'window');

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
  for (const b of furnitureBlocks) {
    try {
      const poly = findHatchBoundary(traceDoc, b.at);
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
    const wallH = clampWallHeight(h.heightMm ?? H);
    const inferred = h.elementType === undefined ? true : undefined;
    const opCutters = buildOpCutters(h.ops, doc, wallH);
    builder.object(`Wall_${i + 1}`, mats.wall, {
      entityId: h.id,
      heightMm: wallH,
      storey: h.storey,
      specId: h.specId,
      ops: h.ops,
      opCutters,
      ...(inferred ? { inferred } : {}),
    });
    builder.prism(h.points, 0, wallH);
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
    builder.object(`Furn_${i + 1}_${def.id}`, mats.furn, { storey: b.storey, specId: b.specId });
    builder.box4(base, 0, furnitureHeightMm(def.id));
  });

  // ---- Cửa sổ: tấm kính proxy (bệ 800 → 2200) ----
  windows.forEach((b, i) => {
    const base = blockFootprint(b);
    if (!base) return;
    builder.object(`Window_${i + 1}`, mats.wall, { storey: b.storey });
    builder.box4(base, 800, Math.min(2200, H - 200));
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
