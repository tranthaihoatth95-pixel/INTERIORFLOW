/**
 * lib/cad/dxf.ts — PARSER + EXPORTER DXF ASCII TỰ VIẾT (không dependency).
 *
 * Mục tiêu: mở SẠCH ở AutoCAD/BricsCAD/LibreCAD (không rơi vào lỗi "thiếu HEADER/TABLES" khiến
 * phần mềm từ chối hoặc phải "recover"), phủ dần các entity DXF chuẩn khi app lên tới Nấc
 * tương ứng (xem docs/CAD-LT.md):
 *   - DIMENSION thật (Nấc 3): entity DIMENSION + block ẩn danh *Dn chứa hình vẽ (BLOCKS +
 *     BLOCK_RECORD trong TABLES).
 *   - HATCH thật (Nấc 4): entity HATCH khi có `pattern` (ANSI31/32/37/SOLID/DOTS — tên pattern
 *     chuẩn acad.pat/ansi.pat); hatch KHÔNG có `pattern` (poché tường cũ từ WALL) vẫn xuất
 *     đường bao LWPOLYLINE như trước — không phá hành vi cũ.
 *   - Lineweight/linetype (hệ nét ISO 128): mỗi LAYER trong TABLES mang theo group 370
 *     (lineweight, enum DXF chuẩn — hundredth mm) + group 6 (tên LTYPE, tra trong bảng LTYPE
 *     mới cũng ở TABLES). Entity KHÔNG override riêng ⇒ dùng "ByLayer" mặc định của DXF (không
 *     ghi 370/6 ở entity) — đúng quy ước AutoCAD, đơn giản & mạnh hơn ghi lặp ở từng entity.
 *   - Block furniture vẫn PHẲNG HOÁ (line/circle/arc/lwpolyline ở world) — không cần
 *     BLOCK_RECORD riêng cho chúng.
 *
 * Đọc: LINE, LWPOLYLINE (+closed), POLYLINE/VERTEX (biến thể cũ), CIRCLE, ARC, TEXT, MTEXT,
 * DIMENSION (đọc lại đúng encoding app tự ghi), HATCH (đọc boundary path + pattern/scale/góc),
 * **INSERT + BLOCKS (làm phẳng, 05/08)** + tên layer + màu ACI cơ bản → Doc (đơn vị mm giữ
 * nguyên như file). Entity lạ → BỎ QUA, **có ghi vào `DxfLoadReport.skipped`** (không im lặng).
 *
 * DXF là chuỗi cặp (groupCode, value) mỗi cặp 2 dòng. Ta duyệt tuyến tính, gom ENTITIES.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 🔴 VÌ SAO PHẢI ĐỌC INSERT (đo trên 6 file DXF THẬT của Nam Long, 05/08 — không phải suy đoán)
 *
 * Bản vẽ AutoCAD thật gói gần như TOÀN BỘ hình vào block. Số đo thật (đếm record theo code 0):
 *
 *   file              ENTITIES  parser cũ đọc được   BLOCKS: định nghĩa / INSERT lồng / hình bên trong
 *   03_TANG5B  5,6MB       139        135 (97%)          494 / 535 / ~7.100
 *   04_TANG8   6,6MB       100         92 (92%)          415 / 448 / ~7.200
 *   05_TANG9   9,3MB       173        167 (96%)          488 / 601 / ~19.600
 *   06_TANG10 27,7MB        97         92 (95%)          910 /1560 / ~34.000
 *   07_TANG11 13,2MB        95         90 (95%)          489 / 538 / ~33.000
 *   08_TANG12  5,5MB        24         19 (79%)          234 / 166 / ~5.400
 *
 * ⚠️ Con số "97% đọc được" là ẢO GIÁC NGUY HIỂM: mẫu số chỉ là 97–173 entity ở ENTITIES, mà
 * phần lớn là DIMENSION (71–91 cái) + vài LINE. **Toàn bộ mặt bằng nằm trong 2–6 cái INSERT**
 * trỏ vào BLOCKS chứa hàng chục nghìn hình. Bỏ INSERT = **mở file ra gần như TRỐNG TRƠN**, chứ
 * không phải "mất cửa và thiết bị" như phiếu mô tả. Đây là đính chính có vật chứng (§0/N7).
 *
 * ⚠️ POLYLINE/VERTEX: docstring cũ (dòng ngay trên) ghi là ĐỌC ĐƯỢC — **SAI**. `buildEntity`
 * trả `null` cho 'POLYLINE' từ đầu. Riêng 07_TANG11 có 2.700 POLYLINE + 19.583 VERTEX nằm trong
 * BLOCKS ⇒ chỉ mở INSERT mà không gom VERTEX thì vẫn mất một mảng lớn. Nay gom thật (xem
 * `collapsePolylines`).
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */

import type { Doc, DimEntity, ElementType, Entity, HatchPattern, Layer, LineType, Pt } from './model';
import { docBox, ellipseBoundaryPoints, zoneBoundaryPoints, zoneCentroid, ZONE_GROUP_META } from './model';
import { BLOCK_MAP, type Prim } from './furniture';

// Bảng màu ACI cơ bản (index → hex). Đủ 1..9 + vài mã hay gặp; ngoài bảng → xám.
const ACI: Record<number, string> = {
  1: '#ff0000', 2: '#ffff00', 3: '#00ff00', 4: '#00ffff', 5: '#0000ff',
  6: '#ff00ff', 7: '#e8e4dc', 8: '#808080', 9: '#c0c0c0',
  30: '#ff7f00', 40: '#c08a5a', 250: '#333333', 251: '#4d4d4d', 252: '#666666',
};
/** Xuất để lib/cad/dwg.ts (mapping DWG → Doc) tái dùng — cùng bảng màu ACI, tránh viết lại. */
export function aciToHex(i: number): string {
  return ACI[i] ?? '#c8c4bc';
}

/** Enum lineweight hợp lệ trong DXF (group 370, đơn vị: 1/100 mm). Map mm bất kỳ → giá trị gần nhất. */
const DXF_LW_ENUM = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
function lineweightToDxfEnum(mm: number): number {
  const v = Math.round(mm * 100);
  let best = DXF_LW_ENUM[0];
  let bestD = Infinity;
  for (const e of DXF_LW_ENUM) {
    const d = Math.abs(e - v);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

/** Tên LTYPE chuẩn AutoCAD (acad.lin) tương ứng với LineType nội bộ. */
function linetypeToDxfName(lt: LineType | undefined): string {
  switch (lt) {
    case 'hidden': return 'HIDDEN';
    case 'center': return 'CENTER';
    case 'dashed': return 'DASHED';
    case 'phantom': return 'PHANTOM';
    default: return 'CONTINUOUS';
  }
}

/** Định nghĩa dash pattern (mm) cho bảng LTYPE — khớp LINE_DASH_MM ở render.ts (nhất quán màn
 * hình ↔ file). Dương = nét, âm = khoảng hở; [] = liền (CONTINUOUS không cần group 49). */
const LTYPE_DASH_MM: Record<string, number[]> = {
  HIDDEN: [3, -2],
  CENTER: [12, -3, 2, -3],
  DASHED: [6, -3],
  PHANTOM: [12, -3, 2, -3, 2, -3],
};

/** hex '#rrggbb' → mã ACI gần nhất trong bảng trên (khoảng cách RGB). Mặc định 7 (trắng/đen). */
function hexToAci(hex?: string): number {
  if (!hex) return 7;
  const h = hex.replace('#', '');
  if (h.length !== 6) return 7;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  let best = 7;
  let bestD = Infinity;
  for (const [idxStr, hx] of Object.entries(ACI)) {
    const hh = hx.replace('#', '');
    const rr = parseInt(hh.slice(0, 2), 16);
    const gg = parseInt(hh.slice(2, 4), 16);
    const bb = parseInt(hh.slice(4, 6), 16);
    const d = (r - rr) ** 2 + (g - gg) ** 2 + (b - bb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = parseInt(idxStr, 10);
    }
  }
  return best;
}

interface Pair {
  code: number;
  value: string;
}

function tokenize(text: string): Pair[] {
  // Chuẩn hoá xuống dòng, tách theo cặp (code \n value).
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (Number.isNaN(code)) {
      // lệch pha (comment/dòng lạ) → nhích 1 để đồng bộ lại
      i -= 1;
      continue;
    }
    pairs.push({ code, value: lines[i + 1] ?? '' });
  }
  return pairs;
}

let uid = 0;
function eid(): string {
  uid += 1;
  return `dxf-${Date.now().toString(36)}-${uid}`;
}

/** Xuất để lib/cad/dwg.ts tái dùng (DWG cũng đặt tên LTYPE theo cùng quy ước AutoCAD). */
export function dxfNameToLineType(name?: string): LineType | undefined {
  switch (name) {
    case 'HIDDEN': return 'hidden';
    case 'CENTER': return 'center';
    case 'DASHED': return 'dashed';
    case 'PHANTOM': return 'phantom';
    case 'CONTINUOUS': return 'continuous';
    default: return undefined;
  }
}

/** Đọc bảng TABLES/LAYER (nếu có) → màu/lineweight/linetype THẬT của từng layer theo tên. */
function parseLayerDefs(pairs: Pair[]): Map<string, { color?: string; lineweight?: number; lineType?: LineType }> {
  const defs = new Map<string, { color?: string; lineweight?: number; lineType?: LineType }>();
  let tablesStart = -1;
  for (let k = 0; k + 1 < pairs.length; k++) {
    if (pairs[k].code === 2 && pairs[k].value.trim().toUpperCase() === 'TABLES') { tablesStart = k + 1; break; }
  }
  if (tablesStart === -1) return defs;
  let tablesEnd = pairs.length;
  for (let k = tablesStart; k < pairs.length; k++) {
    if (pairs[k].code === 0 && pairs[k].value.trim().toUpperCase() === 'ENDSEC') { tablesEnd = k; break; }
  }
  for (let k = tablesStart; k < tablesEnd; k++) {
    if (pairs[k].code === 0 && pairs[k].value.trim().toUpperCase() === 'LAYER') {
      let j = k + 1;
      const g: Record<number, string[]> = {};
      while (j < tablesEnd && pairs[j].code !== 0) { (g[pairs[j].code] ||= []).push(pairs[j].value); j++; }
      const name = g[2]?.[0]?.trim();
      if (name) {
        const colorIdx = g[62] ? parseInt(g[62][0], 10) : undefined;
        const lwEnum = g[370] ? parseInt(g[370][0], 10) : undefined;
        defs.set(name, {
          color: colorIdx !== undefined ? aciToHex(colorIdx) : undefined,
          lineweight: lwEnum !== undefined && lwEnum > 0 ? lwEnum / 100 : undefined,
          lineType: dxfNameToLineType(g[6]?.[0]?.trim().toUpperCase()),
        });
      }
      k = j - 1;
    }
  }
  return defs;
}

/* ═══════════════════ BLOCKS + INSERT (VIỆC 1, 05/08) ═══════════════════ */

/** Một record thô trong file: tên entity (code 0) + bảng group code → các giá trị. */
interface DxfRecord {
  kind: string;
  g: Record<number, string[]>;
}

/** Định nghĩa 1 block trong section BLOCKS. `base` là group 10/20 của BLOCK — mọi hình bên trong
 * được đo TỪ điểm này, nên lúc chèn phải trừ đi trước khi scale/xoay (đúng cách AutoCAD làm). */
interface DxfBlockDef {
  name: string;
  base: Pt;
  records: DxfRecord[];
}

/**
 * Ma trận affine 2D [a b c d e f]: x' = a·x + c·y + e · y' = b·x + d·y + f.
 *
 * ⚠️ DÙNG MA TRẬN, KHÔNG dùng bộ ba (scale, rot, translate) như `block-library.ts:113`
 * `transformPt` — với block LỒNG block, "co giãn không đều rồi xoay rồi lại co giãn không đều"
 * KHÔNG biểu diễn được bằng bộ ba đó (toán học, không phải sở thích). Thứ tự nhân vẫn giữ đúng
 * quy ước cũ (scale → rotate → translate) để hành vi khớp block vẽ tay.
 */
type Mat = [number, number, number, number, number, number];

const MAT_ID: Mat = [1, 0, 0, 1, 0, 0];

/** m2 ∘ m1 — áp m1 TRƯỚC rồi m2 (m1 là phép của block con, m2 của block cha). */
function matMul(m2: Mat, m1: Mat): Mat {
  return [
    m2[0] * m1[0] + m2[2] * m1[1],
    m2[1] * m1[0] + m2[3] * m1[1],
    m2[0] * m1[2] + m2[2] * m1[3],
    m2[1] * m1[2] + m2[3] * m1[3],
    m2[0] * m1[4] + m2[2] * m1[5] + m2[4],
    m2[1] * m1[4] + m2[3] * m1[5] + m2[5],
  ];
}

function matApply(m: Mat, p: Pt): Pt {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}

/** Định thức — ÂM nghĩa là phép biến đổi có LẬT GƯƠNG (tỉ lệ âm ở group 41/42). Cung tròn bị lật
 * thì chiều quét đảo, phải hoán vị góc đầu/cuối (xem `transformEntity`). */
function matDet(m: Mat): number {
  return m[0] * m[3] - m[1] * m[2];
}

/** Hệ số co giãn "trung bình" = căn |định thức| — dùng cho bán kính và chiều cao chữ. Với co giãn
 * ĐỀU thì đây là con số đúng tuyệt đối; co giãn KHÔNG đều thì đường tròn đáng lẽ thành elip, ta
 * xấp xỉ + ĐẾM vào cảnh báo (K3 — không im lặng bịa hình). */
function matScaleMag(m: Mat): number {
  return Math.sqrt(Math.abs(matDet(m))) || 1;
}

/** Gom các cặp trong [from,to) thành record theo mốc code 0. */
function scanRecords(pairs: Pair[], from: number, to: number): DxfRecord[] {
  const out: DxfRecord[] = [];
  let i = from;
  while (i < to) {
    if (pairs[i].code !== 0) { i++; continue; }
    const kind = pairs[i].value.trim().toUpperCase();
    let j = i + 1;
    const g: Record<number, string[]> = {};
    while (j < to && pairs[j].code !== 0) {
      (g[pairs[j].code] ||= []).push(pairs[j].value);
      j++;
    }
    out.push({ kind, g });
    i = j;
  }
  return out;
}

/**
 * POLYLINE cũ (heavyweight): đỉnh nằm ở các record VERTEX ĐỨNG SAU, kết thúc bằng SEQEND. Parser
 * tuyến tính cắt theo code 0 nên chúng rời nhau ⇒ gom lại thành MỘT record 'LWPOLYLINE' tổng hợp
 * (10/20 = danh sách đỉnh, 70 = cờ đóng) để đường dựng entity phía sau chỉ cần biết một loại.
 *
 * Bỏ qua VERTEX là đỉnh điều khiển spline/mặt lưới (cờ 70 bit 16 "mesh vertex" hoặc bit 1 "extra
 * vertex created by curve fit") — lấy chúng vào sẽ ra đường gãy sai hình.
 */
function collapsePolylines(recs: DxfRecord[]): DxfRecord[] {
  const out: DxfRecord[] = [];
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.kind !== 'POLYLINE') { out.push(r); continue; }
    const xs: string[] = [];
    const ys: string[] = [];
    let j = i + 1;
    for (; j < recs.length && recs[j].kind === 'VERTEX'; j++) {
      const flags = parseInt(recs[j].g[70]?.[0] ?? '0', 10) || 0;
      if (flags & 16) continue;           // đỉnh lưới 3D — không phải đường
      if ((flags & 1) && !(flags & 8)) continue; // đỉnh do curve-fit sinh thêm
      const x = recs[j].g[10]?.[0];
      const y = recs[j].g[20]?.[0];
      if (x !== undefined && y !== undefined) { xs.push(x); ys.push(y); }
    }
    if (j < recs.length && recs[j].kind === 'SEQEND') j++;
    if (xs.length >= 2) {
      out.push({ kind: 'LWPOLYLINE', g: { ...r.g, 10: xs, 20: ys } });
    }
    i = j - 1;
  }
  return out;
}

function findSection(pairs: Pair[], name: string): [number, number] {
  for (let k = 0; k + 1 < pairs.length; k++) {
    if (pairs[k].code === 2 && pairs[k].value.trim().toUpperCase() === name) {
      for (let j = k + 1; j < pairs.length; j++) {
        if (pairs[j].code === 0 && pairs[j].value.trim().toUpperCase() === 'ENDSEC') return [k + 1, j];
      }
      return [k + 1, pairs.length];
    }
  }
  return [-1, -1];
}

/** Section BLOCKS → bảng tra tên block (CHỮ HOA, DXF không phân biệt hoa/thường ở tên block). */
function parseBlockTable(pairs: Pair[]): Map<string, DxfBlockDef> {
  const table = new Map<string, DxfBlockDef>();
  const [a, b] = findSection(pairs, 'BLOCKS');
  if (a < 0) return table;
  const recs = collapsePolylines(scanRecords(pairs, a, b));
  let cur: DxfBlockDef | null = null;
  for (const r of recs) {
    if (r.kind === 'BLOCK') {
      const name = (r.g[2]?.[0] ?? '').trim();
      cur = {
        name,
        base: { x: parseFloat(r.g[10]?.[0] ?? '0') || 0, y: parseFloat(r.g[20]?.[0] ?? '0') || 0 },
        records: [],
      };
      if (name) table.set(name.toUpperCase(), cur);
      continue;
    }
    if (r.kind === 'ENDBLK') { cur = null; continue; }
    if (cur) cur.records.push(r);
  }
  return table;
}

/** Trần đệ quy block-trong-block. 8 theo phiếu — thực tế AutoCAD hiếm khi quá 3-4 cấp. */
const MAX_BLOCK_DEPTH = 8;

/** Thông số đọc từ 1 record INSERT. */
interface InsertSpec {
  name: string;
  at: Pt;
  sx: number;
  sy: number;
  rotRad: number;
  cols: number;
  rows: number;
  colSpacing: number;
  rowSpacing: number;
}

function readInsert(g: Record<number, string[]>): InsertSpec | null {
  const name = (g[2]?.[0] ?? '').trim();
  if (!name) return null;
  const f = (code: number, def: number) => {
    const v = g[code]?.[0];
    const n = v === undefined ? def : parseFloat(v);
    return Number.isFinite(n) ? n : def;
  };
  const i = (code: number, def: number) => {
    const v = g[code]?.[0];
    const n = v === undefined ? def : parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : def;
  };
  // Tỉ lệ 0 là dữ liệu hỏng (AutoCAD không cho) — coi như 1, đừng làm sập hình về 1 điểm.
  const sx = f(41, 1) || 1;
  const sy = f(42, 1) || sx;
  return {
    name,
    at: { x: f(10, 0), y: f(20, 0) },
    sx,
    sy,
    rotRad: (f(50, 0) * Math.PI) / 180,
    cols: i(70, 1),
    rows: i(71, 1),
    colSpacing: f(44, 0),
    rowSpacing: f(45, 0),
  };
}

/** Ma trận của MỘT bản sao (c,r) trong mảng array của INSERT, đã trừ base point của block. */
function insertMatrix(spec: InsertSpec, base: Pt, col: number, row: number): Mat {
  const cos = Math.cos(spec.rotRad);
  const sin = Math.sin(spec.rotRad);
  // Bước lặp array đo theo TRỤC ĐÃ XOAY của block (đúng AutoCAD: hàng/cột nghiêng theo block).
  const ox = col * spec.colSpacing;
  const oy = row * spec.rowSpacing;
  const tx = spec.at.x + ox * cos - oy * sin;
  const ty = spec.at.y + ox * sin + oy * cos;
  // scale → rotate → translate (giữ đúng quy ước `blockLocalToWorld` của render.ts).
  const scale: Mat = [spec.sx, 0, 0, spec.sy, -base.x * spec.sx, -base.y * spec.sy];
  const rot: Mat = [cos, sin, -sin, cos, 0, 0];
  const trans: Mat = [1, 0, 0, 1, tx, ty];
  return matMul(trans, matMul(rot, scale));
}

/** Áp ma trận lên 1 Entity đã dựng (toạ độ local của block) → Entity mới ở toạ độ world. */
function transformEntity(e: Entity, m: Mat, warn: { nonUniform: number }): Entity | null {
  const k = matScaleMag(m);
  const det = matDet(m);
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  if (Math.abs(sx - sy) > 1e-6 * Math.max(sx, sy)) warn.nonUniform += 1;

  switch (e.type) {
    case 'line':
      return { ...e, a: matApply(m, e.a), b: matApply(m, e.b) };
    case 'polyline':
      return { ...e, points: e.points.map((p) => matApply(m, p)) };
    case 'hatch':
      return { ...e, points: e.points.map((p) => matApply(m, p)) };
    case 'circle':
      return { ...e, c: matApply(m, e.c), r: e.r * k };
    case 'arc': {
      // Biến đổi ĐIỂM ĐẦU/CUỐI rồi đọc lại góc — cách duy nhất đúng cho cả xoay lẫn lật gương
      // (lật làm đảo chiều quét, nên phải hoán vị góc đầu↔cuối khi định thức âm).
      const c = matApply(m, e.c);
      const p1 = matApply(m, { x: e.c.x + e.r * Math.cos(e.a1), y: e.c.y + e.r * Math.sin(e.a1) });
      const p2 = matApply(m, { x: e.c.x + e.r * Math.cos(e.a2), y: e.c.y + e.r * Math.sin(e.a2) });
      const g1 = Math.atan2(p1.y - c.y, p1.x - c.x);
      const g2 = Math.atan2(p2.y - c.y, p2.x - c.x);
      return { ...e, c, r: e.r * k, a1: det < 0 ? g2 : g1, a2: det < 0 ? g1 : g2 };
    }
    case 'text':
      return { ...e, at: matApply(m, e.at), h: e.h * k };
    default:
      // 'dim'/'block'/… trong block: hiếm và không có ngữ nghĩa rõ sau khi làm phẳng — bỏ, đã đếm
      // ở `skipped` phía ngoài.
      return null;
  }
}

/** Bộ đếm dùng chung cho cả lần nạp — mọi con số trong `DxfLoadReport` đi ra từ đây. */
interface LoadCounters {
  entitiesRead: Record<string, number>;
  blocksExpanded: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
  nonUniform: { nonUniform: number };
  missingBlocks: Set<string>;
  tooDeep: Set<string>;
}

/**
 * BÁO CÁO NẠP (VIỆC 2) — trả kèm Doc để nơi gọi hiện được "đã nạp gì / mất gì". Không có nó thì
 * file mở ra thiếu một nửa mà người dùng không biết, đúng cái phiếu gọi là "im lặng nguy hiểm".
 */
export interface DxfLoadReport {
  /** số Entity nạp được, tách theo `Entity['type']` (line/polyline/circle/arc/text/hatch/dim). */
  entitiesRead: Record<string, number>;
  /** số INSERT đã làm phẳng, tách theo TÊN BLOCK. */
  blocksExpanded: Record<string, number>;
  /** loại record DXF bị bỏ + số lượng (tên entity DXF viết hoa: VIEWPORT, SOLID, SPLINE…). */
  skipped: Record<string, number>;
  /** tên layer → số entity thuộc layer đó (sau khi làm phẳng). */
  layers: Record<string, number>;
  /** khung bao toàn bộ entity, đơn vị mm. undefined = không có entity nào. */
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
  /** block không tra được định nghĩa · lồng quá sâu · toạ độ bất thường · co giãn không đều. */
  warnings: string[];
  /** tổng số entity nạp được (tiện cho thanh trạng thái, khỏi cộng tay `entitiesRead`). */
  totalEntities: number;
}

/**
 * Làm phẳng 1 INSERT thành các Entity world. Trả về mảng rỗng khi block không tra được (đã ghi
 * cảnh báo) — **KHÔNG đoán hình thay** (luật K3 của phiếu).
 */
function expandInsert(
  spec: InsertSpec,
  table: Map<string, DxfBlockDef>,
  parent: Mat,
  depth: number,
  stack: string[],
  ctx: { ensureLayer: (name: string, colorIdx?: number) => string; insertLayerName: string },
  counters: LoadCounters,
): Entity[] {
  const key = spec.name.toUpperCase();
  const def = table.get(key);
  if (!def) {
    counters.missingBlocks.add(spec.name);
    return [];
  }
  if (depth > MAX_BLOCK_DEPTH || stack.includes(key)) {
    counters.tooDeep.add(spec.name);
    return [];
  }

  const out: Entity[] = [];
  const nextStack = [...stack, key];
  // Trần an toàn cho array điên rồ (file hỏng khai 70=99999) — 4096 bản sao là đã quá thừa cho
  // mọi bản vẽ thật, mà vẫn đủ chặn treo trình duyệt.
  const total = spec.cols * spec.rows;
  if (total > 4096) {
    counters.warnings.push(`INSERT "${spec.name}" khai mảng ${spec.cols}×${spec.rows} bản sao — bỏ qua (quá 4096).`);
    return [];
  }

  for (let c = 0; c < spec.cols; c++) {
    for (let r = 0; r < spec.rows; r++) {
      const m = matMul(parent, insertMatrix(spec, def.base, c, r));
      for (const rec of def.records) {
        if (rec.kind === 'INSERT') {
          const child = readInsert(rec.g);
          if (!child) continue;
          const childLayerRaw = (rec.g[8]?.[0] ?? '0').trim();
          out.push(
            ...expandInsert(child, table, m, depth + 1, nextStack, {
              ...ctx,
              // Layer '0' bên trong block THỪA KẾ layer của INSERT cha (quy tắc DXF thật).
              insertLayerName: childLayerRaw === '0' ? ctx.insertLayerName : childLayerRaw,
            }, counters),
          );
          continue;
        }
        const built = buildRecordEntity(rec, ctx, counters);
        if (!built) {
          if (rec.kind === 'DIMENSION') {
            const spec = dimensionFallbackSpec(rec, table);
            if (spec) {
              counters.skipped.DIMENSION = Math.max(0, (counters.skipped.DIMENSION ?? 1) - 1);
              out.push(...expandInsert(spec, table, m, depth + 1, nextStack, ctx, counters));
            }
          }
          continue;
        }
        const t = transformEntity(built, m, counters.nonUniform);
        if (t) out.push({ ...t, srcBlock: def.name });
        else counters.skipped[rec.kind] = (counters.skipped[rec.kind] ?? 0) + 1;
      }
      counters.blocksExpanded[spec.name] = (counters.blocksExpanded[spec.name] ?? 0) + 1;
    }
  }
  return out;
}

/**
 * DIMENSION mà `buildEntity` không giải mã được (tức là do phần mềm KHÁC ghi, không phải encoding
 * của `exportDxf` này) — vẫn còn một đường cứu: mọi DIMENSION đều tham chiếu một **block ẩn danh
 * `*D…`** (group 2) chứa sẵn hình vẽ đã dựng của chính nó (đường gióng, mũi tên, chữ số). Vẽ lại
 * từ block đó là đúng cách phần mềm CAD hiển thị, và cứu được 79–100 DIMENSION/file trong bộ Nam
 * Long — phần lớn số đo lưới trục nằm ở đây.
 *
 * Toạ độ trong block ẩn danh đã là WORLD (base 0,0) ⇒ chèn ở gốc, tỉ lệ 1, không xoay.
 */
function dimensionFallbackSpec(rec: DxfRecord, table: Map<string, DxfBlockDef>): InsertSpec | null {
  const name = (rec.g[2]?.[0] ?? '').trim();
  if (!name || !table.has(name.toUpperCase())) return null;
  return { name, at: { x: 0, y: 0 }, sx: 1, sy: 1, rotRad: 0, cols: 1, rows: 1, colSpacing: 0, rowSpacing: 0 };
}

/** Dựng Entity từ 1 record (dùng chung cho ENTITIES và cho hình bên trong block). */
function buildRecordEntity(
  rec: DxfRecord,
  ctx: { ensureLayer: (name: string, colorIdx?: number) => string; insertLayerName?: string },
  counters: LoadCounters,
): Entity | null {
  const g = rec.g;
  const num = (code: number, idx = 0, def = 0): number => {
    const v = g[code]?.[idx];
    const f = v === undefined ? def : parseFloat(v);
    return Number.isFinite(f) ? f : def;
  };
  const rawLayer = (g[8]?.[0] ?? '0').trim() || '0';
  // Layer '0' trong block = "theo layer của INSERT" (ByBlock). Ngoài block thì '0' là layer thật.
  const layerName = rawLayer === '0' && ctx.insertLayerName ? ctx.insertLayerName : rawLayer;
  const colorIdx = g[62] ? parseInt(g[62][0], 10) : undefined;
  const layerId = ctx.ensureLayer(layerName, colorIdx);
  // 62 = 0 nghĩa là ByBlock → để undefined cho renderer lấy màu layer, đừng tô đen.
  const color = colorIdx !== undefined && colorIdx > 0 ? aciToHex(colorIdx) : undefined;
  try {
    const ent = buildEntity(rec.kind, g, num, layerId, color);
    if (!ent) {
      counters.skipped[rec.kind] = (counters.skipped[rec.kind] ?? 0) + 1;
      return null;
    }
    applyIfXdata(ent, g[1000]);
    return ent;
  } catch {
    counters.skipped[rec.kind] = (counters.skipped[rec.kind] ?? 0) + 1;
    return null;
  }
}

/**
 * Parse text DXF → Doc. Không bao giờ throw: gặp lỗi cục bộ thì bỏ entity đó.
 *
 * LƯU Ý (bug đã sửa): KHÔNG seed sẵn 4 layer mặc định của app (emptyDoc()) — nếu không, mọi
 * file import (kể cả tự export rồi mở lại) sẽ luôn dư ra các layer rỗng trùng tên vì tên layer
 * trong file đã bị bỏ dấu khi export (xem sanitizeName) nên không khớp lại tên có dấu gốc.
 * Doc trả về chỉ chứa ĐÚNG layer thật sự xuất hiện trong file (fallback '0' nếu file rỗng).
 */
export function parseDxf(text: string): Doc {
  return parseDxfEx(text).doc;
}

/**
 * Bản đầy đủ: trả Doc **kèm báo cáo nạp** (VIỆC 2). `parseDxf()` chỉ là lớp mỏng gọi hàm này để
 * ~15 chỗ gọi cũ (`CadEditor.tsx:321`, `block-library.ts:88`, 3 file test…) không phải sửa.
 */
export function parseDxfEx(text: string): { doc: Doc; report: DxfLoadReport } {
  const doc: Doc = { entities: [], layers: [] };
  const layerSet = new Map<string, Layer>();
  const counters: LoadCounters = {
    entitiesRead: {},
    blocksExpanded: {},
    skipped: {},
    warnings: [],
    nonUniform: { nonUniform: 0 },
    missingBlocks: new Set(),
    tooDeep: new Set(),
  };

  const pairs = tokenize(text);

  // TABLES/LAYER — đọc trước để lấy màu/lineweight/linetype THẬT của layer (nếu file do chính
  // app này ghi — xem exportDxf). File khác không có bảng này vẫn parse được bình thường
  // (layerDefs rỗng → ensureLayer rơi về hành vi cũ, suy màu từ entity).
  const layerDefs = parseLayerDefs(pairs);

  const ensureLayer = (name: string, colorIdx?: number): string => {
    const nm = name || '0';
    let lay = layerSet.get(nm);
    if (!lay) {
      const def = layerDefs.get(nm);
      lay = {
        id: `l-${nm}-${uid}`,
        name: nm,
        color: def?.color ?? aciToHex(colorIdx ?? 7),
        visible: true,
        locked: false,
        lineweight: def?.lineweight,
        lineType: def?.lineType,
      };
      layerSet.set(nm, lay);
      doc.layers.push(lay);
    }
    return lay.id;
  };

  // BLOCKS đọc TRƯỚC ENTITIES — INSERT trong ENTITIES cần bảng tra đã sẵn sàng.
  const blockTable = parseBlockTable(pairs);

  const [entA, entB] = findSection(pairs, 'ENTITIES');
  const records = entA < 0 ? [] : collapsePolylines(scanRecords(pairs, entA, entB));

  for (const rec of records) {
    if (rec.kind === 'ENDSEC') break;
    if (rec.kind === 'INSERT') {
      const spec = readInsert(rec.g);
      if (!spec) { counters.skipped.INSERT = (counters.skipped.INSERT ?? 0) + 1; continue; }
      const insertLayerName = (rec.g[8]?.[0] ?? '0').trim() || '0';
      const flat = expandInsert(spec, blockTable, MAT_ID, 0, [], { ensureLayer, insertLayerName }, counters);
      for (const e of flat) doc.entities.push(e);
      continue;
    }
    const ent = buildRecordEntity(rec, { ensureLayer }, counters);
    if (ent) { doc.entities.push(ent); continue; }
    if (rec.kind === 'DIMENSION') {
      const spec = dimensionFallbackSpec(rec, blockTable);
      if (spec) {
        counters.skipped.DIMENSION = Math.max(0, (counters.skipped.DIMENSION ?? 1) - 1);
        const insertLayerName = (rec.g[8]?.[0] ?? '0').trim() || '0';
        for (const e of expandInsert(spec, blockTable, MAT_ID, 0, [], { ensureLayer, insertLayerName }, counters)) doc.entities.push(e);
      }
    }
  }

  for (const e of doc.entities) counters.entitiesRead[e.type] = (counters.entitiesRead[e.type] ?? 0) + 1;

  // fallback: file rỗng/không có ENTITIES hợp lệ → vẫn trả về ít nhất 1 layer để currentLayer
  // (CadEditor.importDoc lấy d.layers[0]) không bị undefined.
  if (doc.layers.length === 0) doc.layers.push({ id: `l-0-${uid}`, name: '0', color: '#c8c4bc', visible: true, locked: false });

  return { doc, report: buildLoadReport(doc, counters) };
}

/**
 * Ngưỡng "hình nằm xa vùng vẽ chính". 1 km — một sàn văn phòng thật rộng nhất cũng chỉ vài trăm
 * mét, nên vượt 1 km gần như chắc chắn là bản sao cũ/rác parked xa trong model space.
 *
 * 🔴 CÓ THẬT, KHÔNG PHẢI PHÒNG XA: `04_TANG8-TTT.dxf` chèn block "SDG" **ba lần** ở
 * (−12.197.655, −3.125.665) · (−12.197.655, 3.103.980) · (−2.754.482, 12.565.778) mm — tức cách
 * gốc 12 km. Đã đối chiếu file thô: đúng là nội dung file, KHÔNG phải lỗi biến đổi của parser.
 * Không cảnh báo thì khung bao ra 12.311 × 15.492 m và mọi phép tính diện tích sau đó vô nghĩa.
 */
const ABSURD_COORD_MM = 1e6;

function buildLoadReport(doc: Doc, c: LoadCounters): DxfLoadReport {
  const layers: Record<string, number> = {};
  const nameOf = new Map(doc.layers.map((l) => [l.id, l.name]));
  for (const e of doc.entities) {
    const nm = nameOf.get(e.layer) ?? e.layer;
    layers[nm] = (layers[nm] ?? 0) + 1;
  }

  const warnings = [...c.warnings];
  if (c.missingBlocks.size) {
    warnings.push(`Không tìm thấy định nghĩa cho ${c.missingBlocks.size} block: ${[...c.missingBlocks].slice(0, 8).join(', ')}${c.missingBlocks.size > 8 ? '…' : ''} — bỏ trống, KHÔNG đoán hình.`);
  }
  if (c.tooDeep.size) {
    warnings.push(`${c.tooDeep.size} block lồng quá ${MAX_BLOCK_DEPTH} cấp hoặc tự tham chiếu vòng: ${[...c.tooDeep].slice(0, 8).join(', ')} — dừng ở đó.`);
  }
  if (c.nonUniform.nonUniform) {
    warnings.push(`${c.nonUniform.nonUniform} hình bị co giãn KHÔNG ĐỀU khi chèn block — đường tròn/cung lấy bán kính trung bình nhân, có thể lệch so bản gốc.`);
  }

  const bbox = docBoxOfEntities(doc);
  if (bbox && (Math.abs(bbox.minX) > ABSURD_COORD_MM || Math.abs(bbox.minY) > ABSURD_COORD_MM
    || Math.abs(bbox.maxX) > ABSURD_COORD_MM || Math.abs(bbox.maxY) > ABSURD_COORD_MM)) {
    warnings.push('Có hình nằm cách gốc toạ độ hơn 1 km — thường là bản sao cũ để xa trong model space. Khung bao và diện tích tính từ khung bao sẽ sai; dùng `planFootprint()` (`dxf-plan.ts`) để lấy đúng cụm vẽ chính.');
  }

  return {
    entitiesRead: c.entitiesRead,
    blocksExpanded: c.blocksExpanded,
    skipped: c.skipped,
    layers,
    ...(bbox ? { bbox } : {}),
    warnings,
    totalEntities: doc.entities.length,
  };
}

/** Khung bao — dùng `docBox()` sẵn có của `model.ts`, KHÔNG viết lại phép tính bbox lần thứ hai. */
function docBoxOfEntities(doc: Doc): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
  if (!doc.entities.length) return undefined;
  const b = docBox(doc);
  if (!b || !Number.isFinite(b.minX) || !Number.isFinite(b.maxX)) return undefined;
  return { minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY };
}

/**
 * Làm sạch chuỗi MTEXT/TEXT về chữ người đọc.
 *
 * 🔴 BẮT ĐƯỢC KHI NẠP FILE THẬT: bản cũ chỉ xoá mã `\\fArial|b1|…;` nên khung tên ra
 * `"{474 m2}"` — DÍNH NGUYÊN CẶP NGOẶC NHÓM. Mọi phép so chữ sau đó (đối chiếu diện tích, tìm
 * tên phòng) đều trượt. MTEXT dùng `{}` để mở/đóng vùng định dạng, `\\P` xuống dòng, `%%d`/`%%c`/
 * `%%p` là ° Ø ±.
 *
 * `raw2` = group 3 (phần đầu của MTEXT dài >250 ký tự, DXF cắt thành nhiều mảnh) — nối TRƯỚC
 * group 1, đúng thứ tự spec, nếu không thì chữ dài bị đảo đoạn.
 */
export function cleanDxfText(raw1: string, raw2 = ''): string {
  return (raw2 + raw1)
    .replace(/\\P/g, ' ')            // xuống dòng → khoảng trắng (một dòng cho dễ so)
    .replace(/\\[A-Za-z][^;\\]*;?/g, '') // \\fArial|b1|i0;  \\H0.75x;  \\C2;  \\pxqc;
    .replace(/[{}]/g, '')             // ← cặp ngoặc nhóm định dạng
    .replace(/%%[dD]/g, '°')
    .replace(/%%[cC]/g, 'Ø')
    .replace(/%%[pP]/g, '±')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildEntity(
  kind: string,
  g: Record<number, string[]>,
  num: (c: number, idx?: number, def?: number) => number,
  layer: string,
  color?: string,
): Entity | null {
  switch (kind) {
    case 'LINE':
      return { id: eid(), type: 'line', layer, color, a: { x: num(10), y: num(20) }, b: { x: num(11), y: num(21) } };
    case 'CIRCLE':
      return { id: eid(), type: 'circle', layer, color, c: { x: num(10), y: num(20) }, r: num(40) };
    case 'ARC': {
      const a1 = (num(50) * Math.PI) / 180;
      const a2 = (num(51) * Math.PI) / 180;
      return { id: eid(), type: 'arc', layer, color, c: { x: num(10), y: num(20) }, r: num(40), a1, a2 };
    }
    case 'TEXT':
    case 'MTEXT':
    case 'ATTRIB': {
      // ATTRIB = giá trị thuộc tính của block (khung tên, mã phòng, số trục…) — trước bị bỏ hẳn,
      // mà đúng chỗ đó mới có chữ người dùng cần. Cùng cấu trúc TEXT (1 = nội dung, 10/20, 40).
      const txt = cleanDxfText(g[1]?.join('') ?? '', g[3]?.join('') ?? '');
      if (!txt) return null;
      return { id: eid(), type: 'text', layer, color, at: { x: num(10), y: num(20) }, text: txt, h: num(40) || 250 };
    }
    case 'ELLIPSE': {
      // 10/20 = tâm · 11/21 = VECTOR tới đầu trục lớn (tương đối tâm) · 40 = tỉ lệ trục nhỏ/lớn.
      const c = { x: num(10), y: num(20) };
      const mx = num(11);
      const my = num(21);
      const rx = Math.hypot(mx, my);
      if (!(rx > 0)) return null;
      return { id: eid(), type: 'ellipse', layer, color, c, rx, ry: rx * (num(40, 0, 1) || 1), rot: Math.atan2(my, mx) };
    }
    case 'DIMENSION': {
      // Đọc lại đúng encoding do exportDxf ghi (xem case 'dim' ở exportDxf) — KHÔNG cần parse
      // block ẩn danh (chỉ để hiển thị đúng ở phần mềm CAD khác; app này tự vẽ lại từ a/b/off/c).
      const typeRaw = num(70) & 7;
      const has13 = g[13] !== undefined;
      const has15 = g[15] !== undefined;
      const a13 = has13 ? { x: num(13), y: num(23) } : undefined;
      const b14 = g[14] !== undefined ? { x: num(14), y: num(24) } : undefined;
      const c15 = has15 ? { x: num(15), y: num(25) } : undefined;
      const dimPt = { x: num(10), y: num(20) };
      if (typeRaw === 1 && a13 && b14) {
        const dx = b14.x - a13.x;
        const dy = b14.y - a13.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const off = (dimPt.x - a13.x) * nx + (dimPt.y - a13.y) * ny;
        return { id: eid(), type: 'dim', kind: 'aligned', layer, color, a: a13, b: b14, off };
      }
      if ((typeRaw === 3 || typeRaw === 4) && c15) {
        return { id: eid(), type: 'dim', kind: typeRaw === 3 ? 'diameter' : 'radius', layer, color, a: c15, b: dimPt, off: 0 };
      }
      if (typeRaw === 2 && a13 && b14 && c15) {
        const off = Math.hypot(dimPt.x - c15.x, dimPt.y - c15.y);
        return { id: eid(), type: 'dim', kind: 'angular', layer, color, a: a13, b: b14, c: c15, off };
      }
      return null; // DIMENSION lạ (không phải do app này ghi) → bỏ qua an toàn
    }
    case 'HATCH': {
      // group 10/20 xuất hiện 2 lần với ý nghĩa khác nhau: giá trị ĐẦU = điểm cao độ (elevation,
      // luôn 0,0 — xem exportDxf), các giá trị SAU = đỉnh biên → bỏ giá trị đầu (slice(1)).
      const xs = (g[10] ?? []).slice(1).map((v) => parseFloat(v));
      const ys = (g[20] ?? []).slice(1).map((v) => parseFloat(v));
      const pts: Pt[] = [];
      for (let k = 0; k < Math.min(xs.length, ys.length); k++) pts.push({ x: xs[k], y: ys[k] });
      if (pts.length < 3) return null;
      const validPatterns: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];
      const nameRaw = (g[2]?.[0] ?? 'SOLID').toUpperCase();
      const pattern = validPatterns.find((p) => p === nameRaw) ?? 'ANSI31';
      return {
        id: eid(), type: 'hatch', layer, color, points: pts,
        solid: pattern === 'SOLID', pattern,
        patternScale: num(41, 0, 1) || 1,
        patternAngle: num(52, 0, 0),
      };
    }
    case 'LWPOLYLINE': {
      const xs = g[10] ?? [];
      const ys = g[20] ?? [];
      const pts: Pt[] = [];
      for (let k = 0; k < Math.min(xs.length, ys.length); k++) {
        pts.push({ x: parseFloat(xs[k]), y: parseFloat(ys[k]) });
      }
      if (pts.length < 2) return null;
      const closed = (num(70) & 1) === 1;
      return { id: eid(), type: 'polyline', layer, color, points: pts, closed };
    }
    case 'POLYLINE':
      // Biến thể cũ: đỉnh nằm ở entity VERTEX kế tiếp — parser tuyến tính này gom theo code 0
      // nên VERTEX bị tách riêng. Bỏ qua an toàn (hiếm gặp ở export hiện đại — ta không export
      // ở dạng này, xem đầu file).
      return null;
    default:
      return null; // entity lạ (INSERT/HATCH/DIMENSION/SOLID thật…) → bỏ qua, không crash
  }
}

/* ───────────────────────── XDATA IF2-nền (B1 24/07) ───────────────────────── */

/** Tập ElementType hợp lệ để validate khi đọc lại từ XDATA (file có thể bị sửa tay). */
const VALID_ELEMENT_TYPES = new Set(['wall', 'slab', 'column', 'beam', 'door', 'window', 'furniture', 'space']);

/**
 * Đọc các chuỗi group 1000 (XDATA) → gán storey/elementType/campath vào entity vừa parse. Chỉ
 * nhận đúng 3 khoá app tự ghi (IF_STOREY=/IF_ELEMTYPE=/IF_CAMPATH=) — chuỗi 1000 khác (app
 * ngoài) bỏ qua. 'null' = "đã kiểm, không phải phần tử BIM" (phân biệt undefined — xem model.ts).
 */
function applyIfXdata(ent: Entity, xd?: string[]): void {
  if (!xd?.length) return;
  for (const raw of xd) {
    const s = raw.trim();
    if (s.startsWith('IF_STOREY=')) {
      const v = s.slice('IF_STOREY='.length).trim();
      if (v) ent.storey = v;
    } else if (s.startsWith('IF_ELEMTYPE=')) {
      const v = s.slice('IF_ELEMTYPE='.length).trim();
      if (v === 'null') ent.elementType = null;
      else if (VALID_ELEMENT_TYPES.has(v)) ent.elementType = v as ElementType;
    } else if (s.startsWith('IF_CAMPATH=')) {
      const v = s.slice('IF_CAMPATH='.length).trim();
      if (v === '1') ent.campath = true;
    }
  }
}

/* ───────────────────────── EXPORT ───────────────────────── */

function pair(code: number, value: string | number): string {
  return `${code}\n${value}`;
}

/** local mm của block → world mm (áp translate/rotate/scale của instance). Trùng công thức render.ts. */
function blockLocalToWorld(lp: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = lp.x * sx;
  const y = lp.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

/**
 * Nấc 3 — DIMENSION entity THẬT (không còn line+text rời). DXF yêu cầu DIMENSION tham chiếu 1
 * block ẩn danh chứa hình vẽ thật (đường gióng/đường kích thước/cung đo/text) — đây là cách
 * AutoCAD tự làm; nếu chỉ ghi entity DIMENSION với các điểm định nghĩa mà KHÔNG có block, nhiều
 * phần mềm (kể cả không phải AutoCAD) sẽ không vẽ được gì. Hàm này sinh phần hình vẽ đó.
 */
function dimBlockGeometry(e: DimEntity, lay: string, aci: number | undefined): string[] {
  const out: string[] = [];
  const wLine = (a: Pt, b: Pt) =>
    out.push(pair(0, 'LINE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, a.x), pair(20, a.y), pair(30, 0), pair(11, b.x), pair(21, b.y), pair(31, 0));
  const wText = (at: Pt, h: number, s: string) =>
    out.push(pair(0, 'TEXT'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, at.x), pair(20, at.y), pair(30, 0), pair(40, h), pair(1, s));
  const wArc = (c: Pt, r: number, a1: number, a2: number) =>
    out.push(pair(0, 'ARC'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, c.x), pair(20, c.y), pair(30, 0), pair(40, r), pair(50, (a1 * 180) / Math.PI), pair(51, (a2 * 180) / Math.PI));

  const kind = e.kind ?? 'aligned';
  if (kind === 'aligned') {
    const dx = e.b.x - e.a.x;
    const dy = e.b.y - e.a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const oa = { x: e.a.x + nx * e.off, y: e.a.y + ny * e.off };
    const ob = { x: e.b.x + nx * e.off, y: e.b.y + ny * e.off };
    wLine(e.a, oa);
    wLine(e.b, ob);
    wLine(oa, ob);
    wText({ x: (oa.x + ob.x) / 2, y: (oa.y + ob.y) / 2 + 20 }, 120, `${Math.round(len)}`);
  } else if (kind === 'radius' || kind === 'diameter') {
    const r = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
    const from = kind === 'diameter' ? { x: e.a.x * 2 - e.b.x, y: e.a.y * 2 - e.b.y } : e.a;
    wLine(from, e.b);
    const label = kind === 'diameter' ? `%%c${Math.round(r * 2)}` : `R${Math.round(r)}`;
    wText({ x: (from.x + e.b.x) / 2, y: (from.y + e.b.y) / 2 + 20 }, 120, label);
  } else if (kind === 'angular' && e.c) {
    const c = e.c;
    const ang1 = Math.atan2(e.a.y - c.y, e.a.x - c.x);
    const ang2 = Math.atan2(e.b.y - c.y, e.b.x - c.x);
    const r = Math.abs(e.off) || 500;
    const p1 = { x: c.x + r * Math.cos(ang1), y: c.y + r * Math.sin(ang1) };
    const p2 = { x: c.x + r * Math.cos(ang2), y: c.y + r * Math.sin(ang2) };
    wLine(c, p1);
    wLine(c, p2);
    wArc(c, r, ang1, ang2);
    const sweep = (((ang2 - ang1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const mid = ang1 + sweep / 2;
    const deg = Math.round((sweep * 180) / Math.PI);
    wText({ x: c.x + r * Math.cos(mid), y: c.y + r * Math.sin(mid) + 20 }, 120, `${deg}%%d`);
  }
  return out;
}

/**
 * Báo cáo GHI file — đối xứng với `DxfLoadReport` của đường đọc (`parseDxfEx`).
 *
 * Vì sao cần (05/08, PHU): section BLOCKS mà `exportDxf` ghi ra CHỈ có boilerplate
 * `*Model_Space`/`*Paper_Space` + block ẩn danh `*Dn` cho DIMENSION — không có đường nào ghi lại
 * INSERT của người dùng. Mở một file có block rồi xuất lại ⇒ **hình còn nguyên nhưng cấu trúc
 * block biến mất**, và trước phiên này app KHÔNG nói một câu nào. Đúng kiểu lỗi im lặng làm mất
 * dữ liệu. Đo trên file thật của studio: 1 sàn = 10.035 entity, **10.015 entity đến từ block,
 * 105 tên block khác nhau** — tức gần như TOÀN BỘ bản vẽ là block.
 */
export interface DxfExportReport {
  /** tên block gốc → số entity đã làm phẳng ra từ block đó (đọc `Entity.srcBlock`, model.ts:312). */
  flattenedBlocks: Record<string, number>;
  /** số tên block khác nhau — bằng `Object.keys(flattenedBlocks).length`, để nơi gọi khỏi đếm lại. */
  flattenedBlockCount: number;
  /** câu hiện THẲNG cho người dùng. Rỗng = bản xuất không mất gì. */
  warnings: string[];
}

/**
 * Ghi Doc → DXF ASCII (HEADER + TABLES/LAYER/BLOCK_RECORD + BLOCKS + ENTITIES). Mở sạch ở
 * AutoCAD/BricsCAD/LibreCAD.
 *
 * ⚠️ **LÀM PHẲNG BLOCK** — xem `DxfExportReport`. Muốn biết bản xuất có mất cấu trúc block không
 * thì gọi `exportDxfEx()`; hàm này giữ chữ ký `(doc) => string` cho ~mọi nơi gọi cũ.
 */
export function exportDxf(doc: Doc): string {
  return exportDxfEx(doc).dxf;
}

/**
 * Bản đầy đủ: trả chuỗi DXF **kèm báo cáo ghi** — cùng khuôn `parseDxf`/`parseDxfEx` ở trên
 * (`dxf.ts:597`), không phát minh cách thứ hai.
 *
 * K4 — KHÔNG thêm field mới nào: dấu vết block nguồn đã có sẵn ở `Entity.srcBlock`
 * (`lib/cad/model.ts:312`, ghi tại `expandInsert` `dxf.ts:532`, đã có test `dxf-insert.test.ts:45,87`).
 * Ở đây chỉ ĐỌC lại nó.
 */
export function exportDxfEx(doc: Doc): { dxf: string; report: DxfExportReport } {
  const out: string[] = [];
  const box = docBox(doc) ?? { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };

  // HEADER — $ACADVER AC1015 (AutoCAD 2000): đủ mới để có LWPOLYLINE, đủ cũ để tương thích rộng.
  out.push(
    pair(0, 'SECTION'), pair(2, 'HEADER'),
    pair(9, '$ACADVER'), pair(1, 'AC1015'),
    pair(9, '$INSUNITS'), pair(70, 4), // 4 = milimét
    pair(9, '$EXTMIN'), pair(10, box.minX), pair(20, box.minY), pair(30, 0),
    pair(9, '$EXTMAX'), pair(10, box.maxX), pair(20, box.maxY), pair(30, 0),
    pair(0, 'ENDSEC'),
  );

  const layerName = (id: string) => sanitizeName(doc.layers.find((l) => l.id === id)?.name ?? '0');
  const dimEntities = doc.entities.filter((e): e is DimEntity => e.type === 'dim');
  const dimBlockName = new Map<string, string>();
  dimEntities.forEach((e, i) => dimBlockName.set(e.id, `*D${i + 1}`));

  // TABLES — LAYER + BLOCK_RECORD (chỉ khi có dimension cần block ẩn danh — furniture vẫn
  // phẳng hoá, KHÔNG cần BLOCK_RECORD, xem đầu file).
  out.push(pair(0, 'SECTION'), pair(2, 'TABLES'));
  // LTYPE — 5 nét chuẩn (tên khớp acad.lin nên phần mềm khác nhận đúng ngay cả khi bỏ qua
  // pattern group 49 của ta). Luôn ghi đủ 5, không phụ thuộc layer nào đang dùng gì.
  out.push(pair(0, 'TABLE'), pair(2, 'LTYPE'), pair(70, 5));
  out.push(pair(0, 'LTYPE'), pair(2, 'CONTINUOUS'), pair(70, 0), pair(3, 'Solid line'), pair(72, 65), pair(73, 0), pair(40, 0));
  for (const [name, dashes] of Object.entries(LTYPE_DASH_MM)) {
    const total = dashes.reduce((s, d) => s + Math.abs(d), 0);
    out.push(pair(0, 'LTYPE'), pair(2, name), pair(70, 0), pair(3, ''), pair(72, 65), pair(73, dashes.length), pair(40, total));
    for (const d of dashes) out.push(pair(49, d));
  }
  out.push(pair(0, 'ENDTAB'));
  // LAYER — mỗi layer mang lineweight (370) + linetype (6) THẬT; entity không override riêng
  // sẽ dùng "ByLayer" mặc định của DXF (không ghi 370/6 ở entity — xem writeLine/writePoly…).
  out.push(pair(0, 'TABLE'), pair(2, 'LAYER'), pair(70, doc.layers.length + 1));
  out.push(pair(0, 'LAYER'), pair(2, '0'), pair(70, 0), pair(62, 7), pair(6, 'CONTINUOUS'), pair(370, 25));
  for (const l of doc.layers) {
    out.push(
      pair(0, 'LAYER'), pair(2, sanitizeName(l.name)), pair(70, l.locked ? 4 : 0), pair(62, hexToAci(l.color)),
      pair(6, linetypeToDxfName(l.lineType)), pair(370, lineweightToDxfEnum(l.lineweight ?? 0.25)),
    );
  }
  out.push(pair(0, 'ENDTAB'));
  // APPID — đăng ký app name cho XDATA IF2-nền (AutoCAD yêu cầu APPID tồn tại khi entity mang
  // group 1001). Luôn ghi (2 entry chuẩn ACAD + INTERIORFLOW) — vô hại với file không có XDATA.
  out.push(pair(0, 'TABLE'), pair(2, 'APPID'), pair(70, 2));
  out.push(pair(0, 'APPID'), pair(2, 'ACAD'), pair(70, 0));
  out.push(pair(0, 'APPID'), pair(2, 'INTERIORFLOW'), pair(70, 0));
  out.push(pair(0, 'ENDTAB'));
  if (dimEntities.length) {
    out.push(pair(0, 'TABLE'), pair(2, 'BLOCK_RECORD'), pair(70, dimEntities.length + 2));
    out.push(pair(0, 'BLOCK_RECORD'), pair(2, '*Model_Space'));
    out.push(pair(0, 'BLOCK_RECORD'), pair(2, '*Paper_Space'));
    for (const name of dimBlockName.values()) out.push(pair(0, 'BLOCK_RECORD'), pair(2, name));
    out.push(pair(0, 'ENDTAB'));
  }
  out.push(pair(0, 'ENDSEC'));

  // BLOCKS — *Model_Space/*Paper_Space (boilerplate bắt buộc của AC1015+) + 1 block ẩn danh
  // cho mỗi DIMENSION (chứa hình vẽ thật: đường gióng/kích thước/cung đo/text).
  out.push(pair(0, 'SECTION'), pair(2, 'BLOCKS'));
  out.push(pair(0, 'BLOCK'), pair(8, '0'), pair(2, '*Model_Space'), pair(70, 0), pair(10, 0), pair(20, 0), pair(30, 0), pair(3, '*Model_Space'), pair(1, ''));
  out.push(pair(0, 'ENDBLK'), pair(8, '0'));
  out.push(pair(0, 'BLOCK'), pair(8, '0'), pair(2, '*Paper_Space'), pair(70, 0), pair(10, 0), pair(20, 0), pair(30, 0), pair(3, '*Paper_Space'), pair(1, ''));
  out.push(pair(0, 'ENDBLK'), pair(8, '0'));
  for (const e of dimEntities) {
    const bname = dimBlockName.get(e.id)!;
    const lay = layerName(e.layer);
    const aci = e.color ? hexToAci(e.color) : undefined;
    out.push(pair(0, 'BLOCK'), pair(8, lay), pair(2, bname), pair(70, 1), pair(10, 0), pair(20, 0), pair(30, 0), pair(3, bname), pair(1, ''));
    out.push(...dimBlockGeometry(e, lay, aci));
    out.push(pair(0, 'ENDBLK'), pair(8, lay));
  }
  out.push(pair(0, 'ENDSEC'));

  // ENTITIES
  out.push(pair(0, 'SECTION'), pair(2, 'ENTITIES'));

  const writeLine = (a: Pt, b: Pt, lay: string, aci?: number, ovr: string[] = [], xd: string[] = []) => {
    out.push(pair(0, 'LINE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), ...ovr, pair(10, a.x), pair(20, a.y), pair(30, 0), pair(11, b.x), pair(21, b.y), pair(31, 0), ...xd);
  };
  const writePoly = (pts: Pt[], closed: boolean, lay: string, aci?: number, ovr: string[] = [], xd: string[] = []) => {
    out.push(pair(0, 'LWPOLYLINE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), ...ovr, pair(90, pts.length), pair(70, closed ? 1 : 0));
    pts.forEach((p) => out.push(pair(10, p.x), pair(20, p.y)));
    out.push(...xd);
  };
  // B1 (24/07, IF2-nền) — XDATA storey/elementType (đặt CUỐI record entity, chuẩn DXF). Chỉ ghi
  // khi entity CÓ dữ liệu — file không dùng IF2 giữ nguyên từng byte như cũ (backward-safe).
  const xdataPairs = (e: Entity): string[] => {
    const has = e.storey !== undefined || e.elementType !== undefined || e.campath !== undefined;
    if (!has) return [];
    const xd: string[] = [pair(1001, 'INTERIORFLOW')];
    if (e.storey !== undefined) xd.push(pair(1000, `IF_STOREY=${e.storey}`));
    if (e.elementType !== undefined) xd.push(pair(1000, `IF_ELEMTYPE=${e.elementType === null ? 'null' : e.elementType}`));
    if (e.campath !== undefined) xd.push(pair(1000, 'IF_CAMPATH=1'));
    return xd;
  };
  // Override lineweight/linetype RIÊNG của entity (hiếm — mặc định không có, dùng ByLayer).
  const overridePairs = (e: Entity): string[] => {
    const out2: string[] = [];
    if (e.lineweight !== undefined) out2.push(pair(370, lineweightToDxfEnum(e.lineweight)));
    if (e.lineType !== undefined) out2.push(pair(6, linetypeToDxfName(e.lineType)));
    return out2;
  };
  const writePrim = (prim: Prim, tf: (p: Pt) => Pt, lay: string, aci?: number) => {
    if (prim.k === 'line') writeLine(tf(prim.a), tf(prim.b), lay, aci);
    else if (prim.k === 'poly') writePoly(prim.pts.map(tf), !!prim.closed, lay, aci);
    else if (prim.k === 'circle') {
      const c = tf(prim.c);
      out.push(pair(0, 'CIRCLE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, c.x), pair(20, c.y), pair(30, 0), pair(40, prim.r));
    } else if (prim.k === 'arc') {
      const c = tf(prim.c);
      out.push(
        pair(0, 'ARC'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, c.x), pair(20, c.y), pair(30, 0), pair(40, prim.r),
        pair(50, (prim.a1 * 180) / Math.PI), pair(51, (prim.a2 * 180) / Math.PI),
      );
    }
  };

  for (const e of doc.entities) {
    const lay = layerName(e.layer);
    const aci = e.color ? hexToAci(e.color) : undefined;
    const ovr = overridePairs(e);
    const xd = xdataPairs(e);
    switch (e.type) {
      case 'line':
        writeLine(e.a, e.b, lay, aci, ovr, xd);
        break;
      case 'dim': {
        // Entity DIMENSION thật (Nấc 3) — tham chiếu block ẩn danh đã ghi ở BLOCKS phía trên.
        const kind = e.kind ?? 'aligned';
        const bname = dimBlockName.get(e.id) ?? '*D0';
        const typeCode = kind === 'aligned' ? 1 : kind === 'angular' ? 2 : kind === 'diameter' ? 3 : 4; // radius=4
        let dimLinePt: Pt;
        let textAt: Pt;
        if (kind === 'aligned') {
          const dx = e.b.x - e.a.x;
          const dy = e.b.y - e.a.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          dimLinePt = { x: e.a.x + nx * e.off, y: e.a.y + ny * e.off };
          textAt = { x: (e.a.x + e.b.x) / 2 + nx * e.off, y: (e.a.y + e.b.y) / 2 + ny * e.off };
        } else if (kind === 'radius' || kind === 'diameter') {
          dimLinePt = e.b;
          textAt = { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 };
        } else {
          const c = e.c ?? e.a;
          const ang1 = Math.atan2(e.a.y - c.y, e.a.x - c.x);
          const ang2 = Math.atan2(e.b.y - c.y, e.b.x - c.x);
          const r = Math.abs(e.off) || 500;
          const sweep = (((ang2 - ang1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const mid = ang1 + sweep / 2;
          dimLinePt = { x: c.x + r * Math.cos(mid), y: c.y + r * Math.sin(mid) };
          textAt = dimLinePt;
        }
        out.push(
          pair(0, 'DIMENSION'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []),
          pair(2, bname),
          pair(10, dimLinePt.x), pair(20, dimLinePt.y), pair(30, 0),
          pair(11, textAt.x), pair(21, textAt.y), pair(31, 0),
          pair(70, typeCode + 32),
          pair(3, 'Standard'),
        );
        if (kind === 'aligned') {
          out.push(pair(13, e.a.x), pair(23, e.a.y), pair(33, 0), pair(14, e.b.x), pair(24, e.b.y), pair(34, 0));
          out.push(pair(1, `${Math.round(Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y))}`));
        } else if (kind === 'radius' || kind === 'diameter') {
          const r = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
          out.push(pair(15, e.a.x), pair(25, e.a.y), pair(35, 0));
          out.push(pair(40, kind === 'diameter' ? r * 2 : r));
          out.push(pair(1, kind === 'diameter' ? `%%c${Math.round(r * 2)}` : `R${Math.round(r)}`));
        } else if (kind === 'angular' && e.c) {
          out.push(pair(13, e.a.x), pair(23, e.a.y), pair(33, 0));
          out.push(pair(14, e.b.x), pair(24, e.b.y), pair(34, 0));
          out.push(pair(15, e.c.x), pair(25, e.c.y), pair(35, 0));
          const ang1 = Math.atan2(e.a.y - e.c.y, e.a.x - e.c.x);
          const ang2 = Math.atan2(e.b.y - e.c.y, e.b.x - e.c.x);
          const sweep = (((ang2 - ang1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          out.push(pair(1, `${Math.round((sweep * 180) / Math.PI)}%%d`));
        }
        break;
      }
      case 'polyline':
        writePoly(e.points, e.closed, lay, aci, ovr, xd);
        break;
      case 'rect':
        writePoly(
          [{ x: e.x, y: e.y }, { x: e.x + e.w, y: e.y }, { x: e.x + e.w, y: e.y + e.h }, { x: e.x, y: e.y + e.h }],
          true,
          lay,
          aci,
          ovr,
          xd,
        );
        break;
      case 'circle':
        out.push(pair(0, 'CIRCLE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), ...ovr, pair(10, e.c.x), pair(20, e.c.y), pair(30, 0), pair(40, e.r), ...xd);
        break;
      case 'arc':
        out.push(
          pair(0, 'ARC'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), ...ovr, pair(10, e.c.x), pair(20, e.c.y), pair(30, 0), pair(40, e.r),
          pair(50, (e.a1 * 180) / Math.PI), pair(51, (e.a2 * 180) / Math.PI), ...xd,
        );
        break;
      case 'text':
        out.push(pair(0, 'TEXT'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, e.at.x), pair(20, e.at.y), pair(30, 0), pair(40, e.h), pair(1, e.text), ...xd);
        break;
      case 'hatch': {
        if (e.points.length < 2) break;
        if (!e.pattern) {
          // Poché tường CŨ (WALL, không có `pattern`) → giữ nguyên hành vi cũ: đường bao
          // LWPOLYLINE khép kín (không tô — ưu tiên an toàn cấu trúc file).
          writePoly(e.points, true, lay, aci, ovr);
          break;
        }
        // Nấc 4 — entity HATCH THẬT (tên pattern ANSI31/ANSI32/ANSI37/SOLID/DOTS đều là tên
        // pattern chuẩn có sẵn trong thư viện acad.pat/ANSI.pat của AutoCAD).
        const isSolid = e.pattern === 'SOLID';
        out.push(
          pair(0, 'HATCH'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []),
          pair(10, 0), pair(20, 0), pair(30, 0),
          pair(210, 0), pair(220, 0), pair(230, 1),
          pair(2, e.pattern),
          pair(70, isSolid ? 1 : 0),
          pair(71, 0),
          pair(91, 1),
          pair(92, 7), pair(72, 0), pair(73, 1), pair(93, e.points.length),
        );
        for (const p of e.points) out.push(pair(10, p.x), pair(20, p.y));
        out.push(pair(97, 0));
        out.push(pair(75, 0), pair(76, 1));
        if (!isSolid) out.push(pair(52, e.patternAngle ?? 0), pair(41, e.patternScale ?? 1));
        out.push(pair(77, 0), pair(78, 0), pair(98, 0));
        break;
      }
      case 'block': {
        const def = BLOCK_MAP[e.block];
        if (!def) break;
        const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
        for (const prim of def.prims) writePrim(prim, tf, lay, aci);
        break;
      }
      // Zone tool (N2) — DXF tương đương: ellipse → LWPOLYLINE 32 điểm (an toàn mọi bản DXF,
      // không cần entity ELLIPSE thật); arrow → LWPOLYLINE + 2 LINE đầu mũi tên; zone → HATCH
      // SOLID (tái dùng cấu trúc HATCH ở case trên) + TEXT nhãn tại centroid.
      case 'ellipse':
        writePoly(ellipseBoundaryPoints(e.c, e.rx, e.ry, e.rot ?? 0, 32), true, lay, aci, ovr);
        break;
      case 'arrow': {
        if (e.path.length < 2) break;
        writePoly(e.path, false, lay, aci, ovr.length ? ovr : [pair(6, linetypeToDxfName(e.lineType ?? 'dashed'))]);
        const head = (from: Pt, tip: Pt) => {
          const size = e.headSize ?? 250;
          const dx = tip.x - from.x;
          const dy = tip.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const back = { x: tip.x - ux * size, y: tip.y - uy * size };
          writeLine({ x: back.x - uy * size * 0.4, y: back.y + ux * size * 0.4 }, tip, lay, aci);
          writeLine({ x: back.x + uy * size * 0.4, y: back.y - ux * size * 0.4 }, tip, lay, aci);
        };
        if (e.headEnd !== false) head(e.path[e.path.length - 2], e.path[e.path.length - 1]);
        if (e.headStart) head(e.path[1], e.path[0]);
        break;
      }
      case 'zone': {
        const pts = zoneBoundaryPoints(e, 32);
        if (pts.length < 3) break;
        const zoneAci = hexToAci(e.color ?? ZONE_GROUP_META[e.group]?.color ?? '#9a9488');
        out.push(
          pair(0, 'HATCH'), pair(8, lay), pair(62, zoneAci),
          pair(10, 0), pair(20, 0), pair(30, 0),
          pair(210, 0), pair(220, 0), pair(230, 1),
          pair(2, 'SOLID'),
          pair(70, 1),
          pair(71, 0),
          pair(91, 1),
          pair(92, 7), pair(72, 0), pair(73, 1), pair(93, pts.length),
        );
        for (const p of pts) out.push(pair(10, p.x), pair(20, p.y));
        out.push(pair(97, 0));
        out.push(pair(75, 0), pair(76, 1));
        out.push(pair(77, 0), pair(78, 0), pair(98, 0));
        const at = e.labelPos ?? zoneCentroid(e);
        if (e.label) {
          out.push(pair(0, 'TEXT'), pair(8, lay), pair(62, zoneAci), pair(10, at.x), pair(20, at.y), pair(30, 0), pair(40, 250), pair(1, e.label.toUpperCase()), pair(72, 1), pair(11, at.x), pair(21, at.y), pair(31, 0));
        }
        break;
      }
    }
  }

  out.push(pair(0, 'ENDSEC'), pair(0, 'EOF'));
  return { dxf: out.join('\n'), report: buildExportReport(doc) };
}

/**
 * Đếm entity đến từ block + dựng câu cảnh báo. Tách hàm riêng để test được mà không phải sinh cả
 * chuỗi DXF, và để `exportDxfEx` giữ được một `return` duy nhất.
 *
 * Câu chữ theo `SPEC-NGON-NGU-CHI-DAN`: nói ĐIỀU ĐÃ XẢY RA + hệ quả cụ thể khi mở lại, KHÔNG lộ
 * tên hàm/field nội bộ. Kèm tối đa 3 TÊN BLOCK để người dùng đối chiếu được với file gốc của họ —
 * đây là dữ liệu chạy-thời-gian của chính họ, không phải thứ nằm trong repo (§0h).
 */
function buildExportReport(doc: Doc): DxfExportReport {
  const flattenedBlocks: Record<string, number> = {};
  for (const e of doc.entities) {
    if (e.srcBlock === undefined) continue;
    flattenedBlocks[e.srcBlock] = (flattenedBlocks[e.srcBlock] ?? 0) + 1;
  }
  const names = Object.keys(flattenedBlocks).sort();
  const warnings: string[] = [];
  if (names.length > 0) {
    const sample = names.slice(0, 3).join(', ');
    const them = names.length > 3 ? `, … và ${names.length - 3} block nữa` : '';
    warnings.push(
      `Bản vẽ gốc có ${names.length} block; bản xuất này đã làm phẳng — mở lại ở AutoCAD sẽ không còn ` +
        `cấu trúc block. Hình vẽ giữ nguyên, nhưng không sửa hàng loạt qua block được nữa (${sample}${them}).`,
    );
  }
  return { flattenedBlocks, flattenedBlockCount: names.length, warnings };
}

const VN_MAP: Record<string, string> = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a', ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  đ: 'd',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e', ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o', ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u', ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
};

/** Bỏ dấu tiếng Việt → ASCII, GIỮ NGUYÊN hoa/thường (map cả 2 case, không ép toLowerCase). */
function deburr(s: string): string {
  return s
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      const mapped = VN_MAP[lower];
      if (!mapped) return ch;
      return ch === lower ? mapped : mapped.toUpperCase();
    })
    .join('');
}

/**
 * Tên layer/bảng DXF (SYMBOL NAME) — bỏ dấu tiếng Việt + chỉ giữ ký tự an toàn (chữ/số/_/-).
 * LÝ DO: layer/table name nằm trong TABLES là "tên khoá" (symbol name); một số phần mềm CAD
 * đời cũ chỉ chấp nhận bộ ký tự ANSI hẹp cho tên này (khác với NỘI DUNG chữ TEXT — group code 1
 * — vốn chỉ là dữ liệu chuỗi nên vẫn xuất tiếng Việt có dấu bình thường, xem writeLine/case
 * 'text'). Ưu tiên "mở sạch" hơn giữ dấu ở tên layer.
 */
function sanitizeName(name: string): string {
  const ascii = deburr((name || '0').trim()).replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '');
  return ascii || '0';
}
