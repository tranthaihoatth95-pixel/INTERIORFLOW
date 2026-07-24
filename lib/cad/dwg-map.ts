/**
 * lib/cad/dwg-map.ts — map DwgRawDoc (JSON thô từ dwg-worker.ts) → Doc + BLOCK-FLATTEN
 * (INSERT/MINSERT/DIMENSION). Code CHÍNH, KHÔNG GPL — không import `@mlightcad/libredwg-web`.
 *
 * TÁCH RIÊNG khỏi lib/cad/dwg.ts vì dwg.ts chứa `import.meta` (khởi tạo Worker) — không chạy
 * được dưới sucrase-node (CJS); file này thuần logic để unit test (lib/cad/dwg-flatten.test.ts)
 * VÀ để **~/Downloads/dwg2dxf** (CLI cá nhân, require qua sucrase) dùng offline. Đổi hình dạng
 * DwgRawDoc ở đây thì phải đổi cả dwg-worker.ts + dwg2dxf/cli.js (không type-check chéo được).
 */

import type { Doc, Entity, HatchPattern, Layer } from './model';
import { aciToHex, dxfNameToLineType } from './dxf';

/* ─── hợp đồng JSON với dwg-worker.ts VÀ dwg2dxf/cli.js (LẶP LẠI có chủ đích — xem đầu file) ── */

interface DwgRawPoint {
  x: number;
  y: number;
}

type DwgRawEntity =
  | { type: 'LINE'; layer: string; colorIndex?: number; lineweight?: number; a: DwgRawPoint; b: DwgRawPoint }
  | { type: 'CIRCLE'; layer: string; colorIndex?: number; lineweight?: number; c: DwgRawPoint; r: number }
  | { type: 'ARC'; layer: string; colorIndex?: number; lineweight?: number; c: DwgRawPoint; r: number; a1: number; a2: number }
  | { type: 'TEXT'; layer: string; colorIndex?: number; at: DwgRawPoint; text: string; h: number }
  | { type: 'LWPOLYLINE'; layer: string; colorIndex?: number; lineweight?: number; points: DwgRawPoint[]; closed: boolean }
  | { type: 'HATCH'; layer: string; colorIndex?: number; points: DwgRawPoint[]; pattern: string; solid: boolean; patternAngle?: number; patternScale?: number }
  | {
      type: 'INSERT'; layer: string; colorIndex?: number; name: string; at: DwgRawPoint;
      sx: number; sy: number; rot: number;
      cols: number; rows: number; colSpacing: number; rowSpacing: number;
    }
  | {
      type: 'DIMENSION'; layer: string; colorIndex?: number; blockName?: string;
      textPoint: DwgRawPoint; text?: string; measurement?: number; kind: number;
      p1?: DwgRawPoint; p2?: DwgRawPoint; defPoint?: DwgRawPoint;
    };

interface DwgRawBlock {
  basePoint: DwgRawPoint;
  entities: DwgRawEntity[];
}

interface DwgRawLayer {
  name: string;
  colorIndex: number;
  lineweight?: number;
  lineType?: string;
  off: boolean;
  frozen: boolean;
  locked: boolean;
}

export interface DwgRawDoc {
  entities: DwgRawEntity[];
  layers: DwgRawLayer[];
  /** Optional — caller cũ (dwg2dxf/cli.js) chưa gửi: INSERT khi đó fallback bỏ qua an toàn. */
  blocks?: Record<string, DwgRawBlock>;
  skippedEntityCount: number;
  totalEntityCount: number;
}

export type DwgWorkerResponse = { ok: true; doc: DwgRawDoc } | { ok: false; error: string };

/* ───────────────────────── mapping DwgRawDoc → Doc (giống pattern buildEntity/ensureLayer của
   dxf.ts, khác biệt DUY NHẤT đáng chú ý: góc ARC của libredwg-web đã là RADIAN sẵn — không nhân
   π/180 như khi đọc DXF ASCII, xem ghi chú trong dwg-worker.ts) ───────────────────────────── */

let uid = 0;
function eid(): string {
  uid += 1;
  return `dwg-${Date.now().toString(36)}-${uid}`;
}

/**
 * Lineweight thô của libredwg-web dùng chung 1 field number cho cả "giá trị mm×100 thật" LẪN 3
 * sentinel nội bộ (BYLAYER/BYBLOCK/DEFAULT — theo mã nguồn GNU LibreDWG, KHÔNG có tài liệu
 * chính thức xác nhận qua TypeScript types của package). Best-effort, chỉ ảnh hưởng ĐỘ DÀY NÉT
 * (thẩm mỹ) — KHÔNG ảnh hưởng toạ độ/hình học: gặp sentinel hoặc giá trị ngoài khoảng hợp lệ
 * DXF (0..211) → bỏ qua (rơi về mặc định layer/app), tránh suy đoán khi không chắc.
 */
const DWG_LINEWEIGHT_SENTINELS = new Set([29, 30, 31]); // BYLAYER, BYBLOCK, DEFAULT (suy luận)
function rawLineweightToMm(raw: number | undefined): number | undefined {
  if (raw === undefined || DWG_LINEWEIGHT_SENTINELS.has(raw)) return undefined;
  if (raw < 0 || raw > 211) return undefined;
  return raw / 100;
}

/** colorIndex 256 = BYLAYER, 0 = BYBLOCK (best-effort, không có ngữ cảnh block ở đây) — cả 2
 * đều để undefined để Entity thừa hưởng màu Layer (đúng cơ chế `layerColor()` ở render.ts). */
function rawColorToHex(idx: number | undefined): string | undefined {
  if (idx === undefined || idx === 256 || idx === 0) return undefined;
  return aciToHex(idx);
}

/** dọn mã định dạng MTEXT (\P, \A1;, …) — CÙNG regex dxf.ts đang dùng cho TEXT/MTEXT của DXF,
 * tái dùng nguyên xi để hành vi nhất quán giữa import DXF và DWG (kể cả giới hạn đã biết). */
function cleanMtext(s: string): string {
  return s.replace(/\\[A-Za-z0-9.|]+;?/g, '').trim();
}

function buildEntity(raw: DwgRawEntity, layerId: string): Entity | null {
  const color = rawColorToHex(raw.colorIndex);
  switch (raw.type) {
    case 'LINE':
      return { id: eid(), type: 'line', layer: layerId, color, lineweight: rawLineweightToMm(raw.lineweight), a: raw.a, b: raw.b };
    case 'CIRCLE':
      return { id: eid(), type: 'circle', layer: layerId, color, lineweight: rawLineweightToMm(raw.lineweight), c: raw.c, r: raw.r };
    case 'ARC':
      return { id: eid(), type: 'arc', layer: layerId, color, lineweight: rawLineweightToMm(raw.lineweight), c: raw.c, r: raw.r, a1: raw.a1, a2: raw.a2 };
    case 'TEXT': {
      const txt = cleanMtext(raw.text);
      if (!txt) return null;
      return { id: eid(), type: 'text', layer: layerId, color, at: raw.at, text: txt, h: raw.h || 250 };
    }
    case 'LWPOLYLINE':
      if (raw.points.length < 2) return null;
      return { id: eid(), type: 'polyline', layer: layerId, color, lineweight: rawLineweightToMm(raw.lineweight), points: raw.points, closed: raw.closed };
    case 'HATCH': {
      if (raw.points.length < 3) return null;
      const validPatterns: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];
      const nameRaw = (raw.pattern || 'SOLID').toUpperCase();
      const pattern = validPatterns.find((p) => p === nameRaw) ?? (raw.solid ? 'SOLID' : 'ANSI31');
      return {
        id: eid(), type: 'hatch', layer: layerId, color, points: raw.points,
        solid: raw.solid, pattern,
        patternScale: raw.patternScale || 1,
        patternAngle: raw.patternAngle || 0,
      };
    }
    default:
      return null;
  }
}

/* ───────────────────────────── block-flatten: INSERT/MINSERT/DIMENSION ─────────────────────────
 * Ma trận affine 2D theo quy ước canvas [a,b,c,d,e,f]: x' = a·x + c·y + e; y' = b·x + d·y + f.
 * INSERT giải nén: M = T(insertionPoint) ∘ R(rotation) ∘ [T(offset MINSERT)] ∘ S(sx,sy) ∘ T(−basePoint)
 * (offset hàng/cột MINSERT xoay theo rotation nhưng KHÔNG scale — theo hành vi AutoCAD/ezdxf).
 * Nested INSERT đệ quy, giới hạn MAX_INSERT_DEPTH chống vòng lặp block tự tham chiếu. */

type Mat = [number, number, number, number, number, number];

const MAT_ID: Mat = [1, 0, 0, 1, 0, 0];
/** Giới hạn đệ quy INSERT lồng nhau (file kiến trúc thật hiếm khi quá 3-4 tầng). */
const MAX_INSERT_DEPTH = 8;
/** Van an toàn: file xref bệnh lý (MINSERT lớn × block khổng lồ) không được nổ ra hàng triệu
 * entity làm treo tab — vượt ngưỡng thì dừng flatten, hình đã có vẫn giữ. */
const MAX_FLATTEN_ENTITIES = 200_000;

function matMul(m1: Mat, m2: Mat): Mat {
  // m1 ∘ m2 — áp m2 trước rồi m1.
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function matApply(m: Mat, p: DwgRawPoint): DwgRawPoint {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}

/** M = T(at) ∘ R(rot) ∘ T(offset) ∘ S(sx,sy) ∘ T(−base). offset = bước hàng/cột MINSERT (đã
 * nằm SAU R, TRƯỚC S → xoay theo block, không scale). */
function insertMatrix(at: DwgRawPoint, rot: number, off: DwgRawPoint, sx: number, sy: number, base: DwgRawPoint): Mat {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  let m: Mat = [cos, sin, -sin, cos, at.x, at.y]; // T(at) ∘ R(rot)
  m = matMul(m, [1, 0, 0, 1, off.x, off.y]);
  m = matMul(m, [sx, 0, 0, sy, 0, 0]);
  m = matMul(m, [1, 0, 0, 1, -base.x, -base.y]);
  return m;
}

/** Trích scale hiệu dụng từ ma trận: sx/sy theo độ dài trục ảnh, det<0 = có lật gương. */
function matScales(m: Mat): { sx: number; sy: number; det: number; uniform: boolean } {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  const det = m[0] * m[3] - m[1] * m[2];
  const uniform = Math.abs(sx - sy) <= 1e-6 * Math.max(sx, sy, 1e-12);
  return { sx, sy, det, uniform };
}

/** Tessellate cung tròn (a1→a2 CCW, radian) thành chuỗi điểm — dùng khi ma trận có scale lệch
 * trục/lật gương khiến cung tròn không còn là cung tròn (thành elip) trong world space. */
function tessellateArc(c: DwgRawPoint, r: number, a1: number, a2: number): DwgRawPoint[] {
  let sweep = a2 - a1;
  while (sweep <= 0) sweep += Math.PI * 2;
  while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
  const n = Math.max(8, Math.ceil(sweep / (Math.PI / 16)));
  const pts: DwgRawPoint[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = a1 + (sweep * i) / n;
    pts.push({ x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t) });
  }
  return pts;
}

/**
 * Biến hình 1 entity thô "lá" (không phải INSERT/DIMENSION) theo ma trận m về world space.
 * CIRCLE/ARC dưới scale lệch trục → xấp xỉ polyline (elip chưa có trong model); ARC dưới lật
 * gương (det<0) → đảo chiều quét bằng cách map góc qua điểm biến hình. Trả clone MỚI — không
 * đụng raw gốc.
 */
function transformLeaf(re: DwgRawEntity, m: Mat): DwgRawEntity | null {
  const { sx, sy, det, uniform } = matScales(m);
  switch (re.type) {
    case 'LINE':
      return { ...re, a: matApply(m, re.a), b: matApply(m, re.b) };
    case 'CIRCLE': {
      if (uniform) return { ...re, c: matApply(m, re.c), r: re.r * sx };
      const pts = tessellateArc(re.c, re.r, 0, Math.PI * 2).map((p) => matApply(m, p));
      pts.pop(); // điểm cuối trùng điểm đầu — closed polyline tự khép
      return { type: 'LWPOLYLINE', layer: re.layer, colorIndex: re.colorIndex, lineweight: re.lineweight, points: pts, closed: true };
    }
    case 'ARC': {
      if (uniform && det > 0) {
        const rot = Math.atan2(m[1], m[0]);
        return { ...re, c: matApply(m, re.c), r: re.r * sx, a1: re.a1 + rot, a2: re.a2 + rot };
      }
      if (uniform && det < 0) {
        // Lật gương: cung CCW a1→a2 thành CCW ảnh(a2)→ảnh(a1). Map góc qua điểm trên cung.
        const c2 = matApply(m, re.c);
        const pA = matApply(m, { x: re.c.x + re.r * Math.cos(re.a2), y: re.c.y + re.r * Math.sin(re.a2) });
        const pB = matApply(m, { x: re.c.x + re.r * Math.cos(re.a1), y: re.c.y + re.r * Math.sin(re.a1) });
        return { ...re, c: c2, r: re.r * sx, a1: Math.atan2(pA.y - c2.y, pA.x - c2.x), a2: Math.atan2(pB.y - c2.y, pB.x - c2.x) };
      }
      const pts = tessellateArc(re.c, re.r, re.a1, re.a2).map((p) => matApply(m, p));
      return { type: 'LWPOLYLINE', layer: re.layer, colorIndex: re.colorIndex, lineweight: re.lineweight, points: pts, closed: false };
    }
    case 'TEXT': {
      // Model TextEntity chưa có rotation — chỉ transform điểm chèn + scale chiều cao (√|det|
      // giữ diện tích chữ hợp lý khi scale lệch trục nhẹ).
      const hScale = Math.sqrt(Math.abs(det)) || 1;
      return { ...re, at: matApply(m, re.at), h: re.h * hScale };
    }
    case 'LWPOLYLINE':
      return { ...re, points: re.points.map((p) => matApply(m, p)) };
    case 'HATCH': {
      const hScale = Math.sqrt(Math.abs(det)) || 1;
      return {
        ...re,
        points: re.points.map((p) => matApply(m, p)),
        patternScale: (re.patternScale || 1) * hScale,
      };
    }
    default:
      return null;
  }
}

/** Text đo fallback khi DIMENSION không có block ẩn danh: ưu tiên text user gõ; '<>'/rỗng/null →
 * measurement làm tròn (bản vẽ mm). ' ' (1 space) = user chủ động giấu text → null. */
function dimFallbackText(re: Extract<DwgRawEntity, { type: 'DIMENSION' }>): string | null {
  const t = (re.text ?? '').trim();
  if (re.text === ' ') return null;
  if (t && t !== '<>') return cleanMtext(t) || null;
  if (typeof re.measurement === 'number' && Number.isFinite(re.measurement)) {
    const v = re.measurement;
    return Math.abs(v) >= 1 ? String(Math.round(v)) : v.toFixed(2);
  }
  return null;
}

/** Doc trả về CHỈ chứa layer thật sự xuất hiện trong entities (giống nguyên tắc parseDxf ở
 * dxf.ts — tránh dư layer rỗng khi import). INSERT/MINSERT/DIMENSION được flatten về world
 * space tại đây (xem khối chú thích ma trận phía trên). */
export function dwgRawDocToDoc(raw: DwgRawDoc): Doc {
  const doc: Doc = { entities: [], layers: [] };
  const layerById = new Map<string, Layer>();
  const layerDefByName = new Map<string, DwgRawLayer>();
  for (const l of raw.layers) layerDefByName.set(l.name, l);
  const blocks = raw.blocks ?? {};

  const ensureLayer = (name: string): string => {
    const nm = name || '0';
    let lay = layerById.get(nm);
    if (!lay) {
      const def = layerDefByName.get(nm);
      lay = {
        id: `l-${nm}-${eid()}`,
        name: nm,
        // Layer (khác Entity) không có ngữ cảnh BYLAYER — colorIndex của chính layer luôn là ACI
        // thật; Math.abs vì 1 số file DWG mã hoá layer-off bằng colorIndex ÂM (ta đã có field
        // `off` riêng nên không cần suy luận trạng thái ẩn/hiện từ dấu âm này).
        color: def ? aciToHex(Math.abs(def.colorIndex)) : '#c8c4bc',
        visible: def ? !(def.off || def.frozen) : true,
        locked: def?.locked ?? false,
        lineweight: rawLineweightToMm(def?.lineweight),
        lineType: dxfNameToLineType(def?.lineType?.toUpperCase()),
      };
      layerById.set(nm, lay);
      doc.layers.push(lay);
    }
    return lay.id;
  };

  /** Ngữ cảnh kế thừa trong block: layer "0" của entity con → layer của INSERT (quy ước
   * AutoCAD); colorIndex 0 (BYBLOCK) → màu của INSERT. */
  interface InheritCtx {
    layer?: string;
    colorIndex?: number;
  }

  const pushLeaf = (re: DwgRawEntity, ctx: InheritCtx) => {
    if (doc.entities.length >= MAX_FLATTEN_ENTITIES) return;
    const effLayer = re.layer === '0' && ctx.layer ? ctx.layer : re.layer;
    const effColor = 'colorIndex' in re && re.colorIndex === 0 && ctx.colorIndex !== undefined ? ctx.colorIndex : re.colorIndex;
    const layerId = ensureLayer(effLayer);
    try {
      const ent = buildEntity({ ...re, colorIndex: effColor } as DwgRawEntity, layerId);
      if (ent) doc.entities.push(ent);
    } catch {
      /* entity hỏng cục bộ → bỏ qua, không phá cả file (giống parseDxf) */
    }
  };

  const emit = (re: DwgRawEntity, m: Mat | null, depth: number, ctx: InheritCtx): void => {
    if (doc.entities.length >= MAX_FLATTEN_ENTITIES) return;
    if (re.type === 'INSERT') {
      if (depth >= MAX_INSERT_DEPTH) return; // chống block tự tham chiếu vòng lặp
      const blk = blocks[re.name];
      if (!blk || blk.entities.length === 0) return; // block thiếu/rỗng — bỏ qua an toàn
      const childCtx: InheritCtx = {
        layer: re.layer === '0' && ctx.layer ? ctx.layer : re.layer,
        colorIndex: re.colorIndex === 0 ? ctx.colorIndex : re.colorIndex,
      };
      for (let row = 0; row < re.rows; row += 1) {
        for (let col = 0; col < re.cols; col += 1) {
          const off = { x: col * re.colSpacing, y: row * re.rowSpacing };
          const local = insertMatrix(re.at, re.rot, off, re.sx, re.sy, blk.basePoint);
          const world = m ? matMul(m, local) : local;
          for (const child of blk.entities) emit(child, world, depth + 1, childCtx);
        }
      }
      return;
    }
    if (re.type === 'DIMENSION') {
      // Ưu tiên block ẩn danh (*D…) — hình dimension AutoCAD đã render sẵn (đường gióng, mũi
      // tên, text) trong block, toạ độ block = WCS nên insert tại (0,0) không xoay/scale.
      const blk = re.blockName ? blocks[re.blockName] : undefined;
      if (blk && blk.entities.length > 0 && depth < MAX_INSERT_DEPTH) {
        const local = insertMatrix({ x: 0, y: 0 }, 0, { x: 0, y: 0 }, 1, 1, blk.basePoint);
        const world = m ? matMul(m, local) : local;
        const childCtx: InheritCtx = { layer: re.layer, colorIndex: re.colorIndex };
        for (const child of blk.entities) emit(child, world, depth + 1, childCtx);
        return;
      }
      // Fallback tối thiểu: text đo tại textPoint + đường gióng cơ bản (nếu đủ điểm, kind
      // rotated/aligned). Không đoán mũi tên/hình phức tạp.
      const txt = dimFallbackText(re);
      const mm = m ?? MAT_ID;
      if (txt) {
        pushLeaf({ type: 'TEXT', layer: re.layer, colorIndex: re.colorIndex, at: matApply(mm, re.textPoint), text: txt, h: 250 }, ctx);
      }
      if ((re.kind === 0 || re.kind === 1) && re.p1 && re.p2 && re.defPoint) {
        const n = { x: re.defPoint.x - re.p2.x, y: re.defPoint.y - re.p2.y };
        const nLen = Math.hypot(n.x, n.y);
        if (nLen > 1e-9) {
          const nu = { x: n.x / nLen, y: n.y / nLen };
          const d1 = (re.defPoint.x - re.p1.x) * nu.x + (re.defPoint.y - re.p1.y) * nu.y;
          const q1 = { x: re.p1.x + nu.x * d1, y: re.p1.y + nu.y * d1 };
          const mk = (a: DwgRawPoint, b: DwgRawPoint) =>
            pushLeaf({ type: 'LINE', layer: re.layer, colorIndex: re.colorIndex, a: matApply(mm, a), b: matApply(mm, b) }, ctx);
          mk(re.p1, q1); // đường gióng 1
          mk(re.p2, re.defPoint); // đường gióng 2
          mk(q1, re.defPoint); // đường kích thước
        }
      }
      return;
    }
    // Entity "lá" — transform (nếu đang trong block) rồi build.
    const leaf = m ? transformLeaf(re, m) : re;
    if (leaf) pushLeaf(leaf, ctx);
  };

  for (const re of raw.entities) emit(re, null, 0, {});

  if (doc.layers.length === 0) doc.layers.push({ id: `l-0-${eid()}`, name: '0', color: '#c8c4bc', visible: true, locked: false });
  return doc;
}
