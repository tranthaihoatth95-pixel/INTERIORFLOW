/**
 * lib/cad/dxf.ts — PARSER + EXPORTER DXF ASCII TỰ VIẾT (không dependency).
 *
 * Đọc: LINE, LWPOLYLINE (+closed), POLYLINE/VERTEX (biến thể cũ), CIRCLE, ARC, TEXT, MTEXT
 * + tên layer + màu ACI cơ bản → Doc (đơn vị mm giữ nguyên như file). Entity lạ → BỎ QUA,
 * không ném lỗi. Ghi: LINE / LWPOLYLINE / CIRCLE tối thiểu, mở được ở AutoCAD/LibreCAD.
 *
 * DXF là chuỗi cặp (groupCode, value) mỗi cặp 2 dòng. Ta duyệt tuyến tính, gom ENTITIES.
 */

import type { Doc, Entity, Layer, Pt } from './model';
import { emptyDoc } from './model';

// Bảng màu ACI cơ bản (index → hex). Đủ 1..9 + vài mã hay gặp; ngoài bảng → xám.
const ACI: Record<number, string> = {
  1: '#ff0000', 2: '#ffff00', 3: '#00ff00', 4: '#00ffff', 5: '#0000ff',
  6: '#ff00ff', 7: '#e8e4dc', 8: '#808080', 9: '#c0c0c0',
  30: '#ff7f00', 40: '#c08a5a', 250: '#333333', 251: '#4d4d4d', 252: '#666666',
};
function aciToHex(i: number): string {
  return ACI[i] ?? '#c8c4bc';
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

/** Parse text DXF → Doc. Không bao giờ throw: gặp lỗi cục bộ thì bỏ entity đó. */
export function parseDxf(text: string): Doc {
  const doc = emptyDoc();
  const layerSet = new Map<string, Layer>();
  doc.layers.forEach((l) => layerSet.set(l.name, l));

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
      // nên VERTEX bị tách riêng. Bỏ qua an toàn (hiếm gặp ở export hiện đại).
      return null;
    default:
      return null; // entity lạ → bỏ qua
  }
}

/* ───────────────────────── EXPORT ───────────────────────── */

function pair(code: number, value: string | number): string {
  return `${code}\n${value}`;
}

/** Ghi Doc → DXF ASCII tối thiểu (LINE / LWPOLYLINE / CIRCLE / ARC / TEXT; rect→polyline). */
export function exportDxf(doc: Doc): string {
  const out: string[] = [];
  out.push(pair(0, 'SECTION'), pair(2, 'ENTITIES'));

  const layerName = (id: string) => doc.layers.find((l) => l.id === id)?.name ?? '0';

  const writeLine = (a: Pt, b: Pt, lay: string) => {
    out.push(pair(0, 'LINE'), pair(8, lay), pair(10, a.x), pair(20, a.y), pair(30, 0), pair(11, b.x), pair(21, b.y), pair(31, 0));
  };
  const writePoly = (pts: Pt[], closed: boolean, lay: string) => {
    out.push(pair(0, 'LWPOLYLINE'), pair(8, lay), pair(90, pts.length), pair(70, closed ? 1 : 0));
    pts.forEach((p) => out.push(pair(10, p.x), pair(20, p.y)));
  };

  for (const e of doc.entities) {
    const lay = layerName(e.layer);
    switch (e.type) {
      case 'line':
      case 'dim':
        writeLine(e.a, e.b, lay);
        break;
      case 'polyline':
        writePoly(e.points, e.closed, lay);
        break;
      case 'rect':
        writePoly(
          [{ x: e.x, y: e.y }, { x: e.x + e.w, y: e.y }, { x: e.x + e.w, y: e.y + e.h }, { x: e.x, y: e.y + e.h }],
          true,
          lay,
        );
        break;
      case 'circle':
        out.push(pair(0, 'CIRCLE'), pair(8, lay), pair(10, e.c.x), pair(20, e.c.y), pair(30, 0), pair(40, e.r));
        break;
      case 'arc':
        out.push(
          pair(0, 'ARC'), pair(8, lay), pair(10, e.c.x), pair(20, e.c.y), pair(30, 0), pair(40, e.r),
          pair(50, (e.a1 * 180) / Math.PI), pair(51, (e.a2 * 180) / Math.PI),
        );
        break;
      case 'text':
        out.push(pair(0, 'TEXT'), pair(8, lay), pair(10, e.at.x), pair(20, e.at.y), pair(30, 0), pair(40, e.h), pair(1, e.text));
        break;
      case 'block':
        // block furniture không xuất DXF (giữ đơn giản) — ghi 1 điểm marker để không mất vị trí.
        out.push(pair(0, 'POINT'), pair(8, lay), pair(10, e.at.x), pair(20, e.at.y), pair(30, 0));
        break;
    }
  }

  out.push(pair(0, 'ENDSEC'), pair(0, 'EOF'));
  return out.join('\n');
}
