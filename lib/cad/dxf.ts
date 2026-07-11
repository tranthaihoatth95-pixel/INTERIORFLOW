/**
 * lib/cad/dxf.ts — PARSER + EXPORTER DXF ASCII TỰ VIẾT (không dependency).
 *
 * PHẠM VI (chặng 1 = sơ phác DD — Design Development, KHÔNG phải hồ sơ CD): mục tiêu DUY
 * NHẤT của phần export là "mở SẠCH" ở AutoCAD/BricsCAD/LibreCAD để handoff sang app CAD
 * chuyên nghiệp khác (dự án EFC riêng) — không cố phủ hết mọi entity DXF (không BLOCK/INSERT
 * thật, không DIMENSION/HATCH gốc). Đổi lại: cấu trúc file ĐÚNG chuẩn tối thiểu — HEADER
 * ($ACADVER/$INSUNITS/$EXTMIN/$EXTMAX) + bảng LAYER trong TABLES + ENTITIES — để không rơi
 * vào lỗi kinh điển "thiếu HEADER/TABLES" khiến 1 số phần mềm từ chối hoặc phải "recover".
 *
 * Đọc: LINE, LWPOLYLINE (+closed), POLYLINE/VERTEX (biến thể cũ), CIRCLE, ARC, TEXT, MTEXT
 * + tên layer + màu ACI cơ bản → Doc (đơn vị mm giữ nguyên như file). Entity lạ → BỎ QUA,
 * không ném lỗi.
 * Ghi: HEADER + TABLES(LAYER) + ENTITIES. Block furniture → PHẲNG HOÁ thành LINE/CIRCLE/ARC/
 * LWPOLYLINE ở toạ độ world (không cần BLOCKS/BLOCK_RECORD). Hatch (poché tường) → xuất
 * đường bao LWPOLYLINE (không tô — an toàn cấu trúc, ưu tiên "mở sạch" hơn fill đẹp). Dim →
 * xuất như 1 LINE đơn giản (đã có từ trước) + TEXT ghi số đo, không dùng entity DIMENSION
 * thật (tránh rủi ro cấu trúc — DIMENSION cần khối ẩn danh phức tạp, không cần cho DD).
 *
 * DXF là chuỗi cặp (groupCode, value) mỗi cặp 2 dòng. Ta duyệt tuyến tính, gom ENTITIES.
 */

import type { Doc, Entity, Layer, Pt } from './model';
import { docBox } from './model';
import { BLOCK_MAP, type Prim } from './furniture';

// Bảng màu ACI cơ bản (index → hex). Đủ 1..9 + vài mã hay gặp; ngoài bảng → xám.
const ACI: Record<number, string> = {
  1: '#ff0000', 2: '#ffff00', 3: '#00ff00', 4: '#00ffff', 5: '#0000ff',
  6: '#ff00ff', 7: '#e8e4dc', 8: '#808080', 9: '#c0c0c0',
  30: '#ff7f00', 40: '#c08a5a', 250: '#333333', 251: '#4d4d4d', 252: '#666666',
};
function aciToHex(i: number): string {
  return ACI[i] ?? '#c8c4bc';
}

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

/**
 * Parse text DXF → Doc. Không bao giờ throw: gặp lỗi cục bộ thì bỏ entity đó.
 *
 * LƯU Ý (bug đã sửa): KHÔNG seed sẵn 4 layer mặc định của app (emptyDoc()) — nếu không, mọi
 * file import (kể cả tự export rồi mở lại) sẽ luôn dư ra các layer rỗng trùng tên vì tên layer
 * trong file đã bị bỏ dấu khi export (xem sanitizeName) nên không khớp lại tên có dấu gốc.
 * Doc trả về chỉ chứa ĐÚNG layer thật sự xuất hiện trong file (fallback '0' nếu file rỗng).
 */
export function parseDxf(text: string): Doc {
  const doc: Doc = { entities: [], layers: [] };
  const layerSet = new Map<string, Layer>();

  const pairs = tokenize(text);

  let i = 0;
  const n = pairs.length;

  // tìm ENTITIES
  let start = 0;
  for (let k = 0; k + 1 < n; k++) {
    if (pairs[k].code === 2 && pairs[k].value.trim().toUpperCase() === 'ENTITIES') {
      start = k + 1;
      break;
    }
  }
  i = start;

  const ensureLayer = (name: string, colorIdx?: number): string => {
    const nm = name || '0';
    let lay = layerSet.get(nm);
    if (!lay) {
      lay = { id: `l-${nm}-${uid}`, name: nm, color: aciToHex(colorIdx ?? 7), visible: true, locked: false };
      layerSet.set(nm, lay);
      doc.layers.push(lay);
    }
    return lay.id;
  };

  while (i < n) {
    const p = pairs[i];
    if (p.code === 0) {
      const kind = p.value.trim().toUpperCase();
      if (kind === 'ENDSEC') break;
      // gom các cặp của entity này đến code 0 kế tiếp
      let j = i + 1;
      const g: Record<number, string[]> = {};
      while (j < n && pairs[j].code !== 0) {
        (g[pairs[j].code] ||= []).push(pairs[j].value);
        j++;
      }
      const num = (code: number, idx = 0, def = 0): number => {
        const v = g[code]?.[idx];
        const f = v === undefined ? def : parseFloat(v);
        return Number.isFinite(f) ? f : def;
      };
      const str = (code: number, idx = 0, def = ''): string => g[code]?.[idx] ?? def;
      const layerName = str(8, 0, '0');
      const colorIdx = g[62] ? parseInt(g[62][0], 10) : undefined;
      const layerId = ensureLayer(layerName, colorIdx);
      const color = colorIdx !== undefined ? aciToHex(colorIdx) : undefined;

      try {
        const ent = buildEntity(kind, g, num, layerId, color);
        if (ent) doc.entities.push(ent);
      } catch {
        /* entity hỏng → bỏ qua, không crash */
      }
      i = j;
    } else {
      i++;
    }
  }

  // fallback: file rỗng/không có ENTITIES hợp lệ → vẫn trả về ít nhất 1 layer để currentLayer
  // (CadEditor.importDoc lấy d.layers[0]) không bị undefined.
  if (doc.layers.length === 0) doc.layers.push({ id: `l-0-${uid}`, name: '0', color: '#c8c4bc', visible: true, locked: false });

  return doc;
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
    case 'MTEXT': {
      const txt = (g[1]?.join('') ?? '').replace(/\\[A-Za-z0-9.|]+;?/g, '').trim();
      return { id: eid(), type: 'text', layer, color, at: { x: num(10), y: num(20) }, text: txt, h: num(40) || 250 };
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

/** Ghi Doc → DXF ASCII (HEADER + TABLES/LAYER + ENTITIES). Mở sạch ở AutoCAD/BricsCAD/LibreCAD. */
export function exportDxf(doc: Doc): string {
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

  // TABLES — chỉ bảng LAYER (đủ để mọi entity tham chiếu layer có khai báo, tránh "orphan layer").
  out.push(pair(0, 'SECTION'), pair(2, 'TABLES'));
  out.push(pair(0, 'TABLE'), pair(2, 'LAYER'), pair(70, doc.layers.length + 1));
  out.push(pair(0, 'LAYER'), pair(2, '0'), pair(70, 0), pair(62, 7), pair(6, 'CONTINUOUS'));
  for (const l of doc.layers) {
    out.push(pair(0, 'LAYER'), pair(2, sanitizeName(l.name)), pair(70, l.locked ? 4 : 0), pair(62, hexToAci(l.color)), pair(6, 'CONTINUOUS'));
  }
  out.push(pair(0, 'ENDTAB'));
  out.push(pair(0, 'ENDSEC'));

  // ENTITIES
  out.push(pair(0, 'SECTION'), pair(2, 'ENTITIES'));

  const layerName = (id: string) => sanitizeName(doc.layers.find((l) => l.id === id)?.name ?? '0');

  const writeLine = (a: Pt, b: Pt, lay: string, aci?: number) => {
    out.push(pair(0, 'LINE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, a.x), pair(20, a.y), pair(30, 0), pair(11, b.x), pair(21, b.y), pair(31, 0));
  };
  const writePoly = (pts: Pt[], closed: boolean, lay: string, aci?: number) => {
    out.push(pair(0, 'LWPOLYLINE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(90, pts.length), pair(70, closed ? 1 : 0));
    pts.forEach((p) => out.push(pair(10, p.x), pair(20, p.y)));
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
    switch (e.type) {
      case 'line':
        writeLine(e.a, e.b, lay, aci);
        break;
      case 'dim': {
        // Xuất như line đơn giản + text số đo (không dùng entity DIMENSION thật — xem đầu file).
        const dx = e.b.x - e.a.x;
        const dy = e.b.y - e.a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const oa = { x: e.a.x + nx * e.off, y: e.a.y + ny * e.off };
        const ob = { x: e.b.x + nx * e.off, y: e.b.y + ny * e.off };
        writeLine(e.a, oa, lay, aci);
        writeLine(e.b, ob, lay, aci);
        writeLine(oa, ob, lay, aci);
        const mx = (oa.x + ob.x) / 2;
        const my = (oa.y + ob.y) / 2;
        out.push(pair(0, 'TEXT'), pair(8, lay), pair(10, mx), pair(20, my + 20), pair(30, 0), pair(40, 120), pair(1, `${Math.round(len)}`));
        break;
      }
      case 'polyline':
        writePoly(e.points, e.closed, lay, aci);
        break;
      case 'rect':
        writePoly(
          [{ x: e.x, y: e.y }, { x: e.x + e.w, y: e.y }, { x: e.x + e.w, y: e.y + e.h }, { x: e.x, y: e.y + e.h }],
          true,
          lay,
          aci,
        );
        break;
      case 'circle':
        out.push(pair(0, 'CIRCLE'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, e.c.x), pair(20, e.c.y), pair(30, 0), pair(40, e.r));
        break;
      case 'arc':
        out.push(
          pair(0, 'ARC'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, e.c.x), pair(20, e.c.y), pair(30, 0), pair(40, e.r),
          pair(50, (e.a1 * 180) / Math.PI), pair(51, (e.a2 * 180) / Math.PI),
        );
        break;
      case 'text':
        out.push(pair(0, 'TEXT'), pair(8, lay), ...(aci !== undefined ? [pair(62, aci)] : []), pair(10, e.at.x), pair(20, e.at.y), pair(30, 0), pair(40, e.h), pair(1, e.text));
        break;
      case 'hatch':
        // Poché tường → xuất đường bao LWPOLYLINE khép kín (không tô — ưu tiên an toàn cấu
        // trúc file hơn fill; app CAD nhận handoff có thể tự hatch lại theo đường bao này).
        if (e.points.length >= 2) writePoly(e.points, true, lay, aci);
        break;
      case 'block': {
        const def = BLOCK_MAP[e.block];
        if (!def) break;
        const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
        for (const prim of def.prims) writePrim(prim, tf, lay, aci);
        break;
      }
    }
  }

  out.push(pair(0, 'ENDSEC'), pair(0, 'EOF'));
  return out.join('\n');
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
