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
import type { Doc, Entity, HatchEntity, BlockEntity, Pt } from '../cad/model';
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

export interface ObjScene {
  obj: string;
  mtl: string;
  stats: SceneStats;
  warnings: string[];
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

/** builder OBJ — gom vertex/face, đơn vị mét, trục OBJ Y-up: (x, cao, -y). */
class ObjBuilder {
  private lines: string[] = [];
  private v = 0;
  verts = 0;
  faces = 0;

  constructor(mtlFile: string) {
    this.lines.push('# InteriorFlow — OBJ sinh tất định từ bản vẽ CAD (mm → m)');
    this.lines.push(`mtllib ${mtlFile}`);
  }

  object(name: string, mat: string) {
    this.lines.push(`o ${name}`);
    this.lines.push(`usemtl ${mat}`);
  }

  /** thêm vertex thế giới CAD (mm) → OBJ (m, Y-up). Trả index 1-based. */
  private vert(xMm: number, yMm: number, zMm: number): number {
    const f = (n: number) => (n / 1000).toFixed(4);
    this.lines.push(`v ${f(xMm)} ${f(zMm)} ${f(-yMm)}`);
    this.v += 1;
    this.verts += 1;
    return this.v;
  }

  private face(idx: number[]) {
    this.lines.push(`f ${idx.join(' ')}`);
    this.faces += 1;
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
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      this.face([bot[i], bot[j], top[j], top[i]]);
    }
  }

  /** hộp theo 4 điểm đáy (đã biến hình) — tiện cho proxy nội thất. */
  box4(base: [Pt, Pt, Pt, Pt], z0: number, z1: number) {
    this.prism(base, z0, z1);
  }

  toString(): string {
    return this.lines.join('\n') + '\n';
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

/**
 * Doc bản vẽ (chặng 1) → scene OBJ+MTL. Tất định 100%: cùng Doc + options cho cùng file.
 */
export function docToObjScene(doc: Doc, opts: SceneOptions = {}): ObjScene {
  const H = Math.max(2000, Math.min(6000, opts.wallHeightMm ?? 2700));
  const theme = opts.theme ?? 'warm';
  const mats = themeMats(theme, opts.palette ?? []);
  const warnings: string[] = [];

  const wallLayers = wallLayerIds(doc);
  const wallHatches = doc.entities.filter(
    (e): e is HatchEntity =>
      e.type === 'hatch' &&
      (wallLayers.has(e.layer) || e.solid === true || e.pattern === 'SOLID' || !e.pattern) &&
      e.points.length >= 3,
  );
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
  builder.object('Floor', mats.floor.name);
  builder.prism(floorPoly, -100, 0);

  // ---- Phòng: dò biên qua findHatchBoundary tại tâm mỗi block nội thất (import-only) ----
  // Sàn phòng nổi 2mm trên slab → vật liệu phòng đọc được trong Max/Blender.
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
    builder.object(`Room_${i + 1}`, mats.room.name);
    builder.prism(poly, 0, 2);
  });

  // ---- Tường: extrude poché ----
  wallHatches.forEach((h, i) => {
    builder.object(`Wall_${i + 1}`, mats.wall.name);
    builder.prism(h.points, 0, H);
  });

  // ---- Trần (tuỳ chọn) ----
  if (opts.ceiling) {
    builder.object('Ceiling', mats.ceil.name);
    builder.prism(floorPoly, H, H + 100);
  }

  // ---- Nội thất: proxy box đúng footprint ----
  furnitureBlocks.forEach((b, i) => {
    const base = blockFootprint(b);
    if (!base) return;
    const def = BLOCK_MAP[b.block];
    builder.object(`Furn_${i + 1}_${def.id}`, mats.furn.name);
    builder.box4(base, 0, furnitureHeightMm(def.id));
  });

  // ---- Cửa sổ: tấm kính proxy (bệ 800 → 2200) ----
  windows.forEach((b, i) => {
    const base = blockFootprint(b);
    if (!base) return;
    builder.object(`Window_${i + 1}`, mats.wall.name);
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
  };
}
