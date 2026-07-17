/**
 * lib/cad/dwg.ts — CẦU NỐI DWG → Doc (code CHÍNH, KHÔNG GPL).
 *
 * File này KHÔNG import bất kỳ package GPL nào. Việc parse .dwg (dùng `@mlightcad/libredwg-web`,
 * GPL-3.0) chạy trong `dwg-parse-service` — repo/package.json/giấy phép RIÊNG BIỆT HOÀN TOÀN
 * khỏi InteriorFlow (xem docs/LICENSE-NOTES.md). openDwgFile() ở đây chỉ gọi
 * `POST /api/cad/dwg-import` (route Next.js server-side của CHÍNH InteriorFlow — không GPL) —
 * route đó mới là nơi forward request sang dwg-parse-service qua HTTP như 1 dịch vụ ngoài
 * (arms-length network call, không link code GPL vào bundle thương mại).
 *
 * Nhận JSON thô (hình dạng DwgRawDoc — định nghĩa cục bộ bên dưới, đồng bộ TAY với
 * dwg-parse-service/server.js, không import lẫn nhau ngoài "hợp đồng" JSON) rồi map sang
 * `Doc`/`Entity` của app — TÁI DÙNG cách làm & helper đã có ở lib/cad/dxf.ts (ensureLayer theo
 * tên, bảng màu ACI `aciToHex`, tra tên LTYPE `dxfNameToLineType`) thay vì viết lại từ đầu.
 */

import type { Doc, Entity, HatchPattern, Layer, Pt } from './model';
import { aciToHex, dxfNameToLineType } from './dxf';

/* ─────────────── hợp đồng JSON với dwg-parse-service (LẶP LẠI có chủ đích — xem đầu file) ─── */

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
  | { type: 'HATCH'; layer: string; colorIndex?: number; points: DwgRawPoint[]; pattern: string; solid: boolean; patternAngle?: number; patternScale?: number };

interface DwgRawLayer {
  name: string;
  colorIndex: number;
  lineweight?: number;
  lineType?: string;
  off: boolean;
  frozen: boolean;
  locked: boolean;
}

interface DwgRawDoc {
  entities: DwgRawEntity[];
  layers: DwgRawLayer[];
  skippedEntityCount: number;
  totalEntityCount: number;
}

type DwgServiceResponse = { ok: true; doc: DwgRawDoc } | { ok: false; error: string };

/* ───────────────────────── mapping DwgRawDoc → Doc (giống pattern buildEntity/ensureLayer của
   dxf.ts, khác biệt DUY NHẤT đáng chú ý: góc ARC của libredwg-web đã là RADIAN sẵn — không nhân
   π/180 như khi đọc DXF ASCII, xem ghi chú trong dwg-parse-service/server.js) ──────────────── */

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

/** Doc trả về CHỈ chứa layer thật sự xuất hiện trong entities (giống nguyên tắc parseDxf ở
 * dxf.ts — tránh dư layer rỗng khi import). */
export function dwgRawDocToDoc(raw: DwgRawDoc): Doc {
  const doc: Doc = { entities: [], layers: [] };
  const layerById = new Map<string, Layer>();
  const layerDefByName = new Map<string, DwgRawLayer>();
  for (const l of raw.layers) layerDefByName.set(l.name, l);

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

  for (const re of raw.entities) {
    const layerId = ensureLayer(re.layer);
    try {
      const ent = buildEntity(re, layerId);
      if (ent) doc.entities.push(ent);
    } catch {
      /* entity hỏng cục bộ → bỏ qua, không phá cả file (giống parseDxf) */
    }
  }

  if (doc.layers.length === 0) doc.layers.push({ id: `l-0-${eid()}`, name: '0', color: '#c8c4bc', visible: true, locked: false });
  return doc;
}

export interface OpenDwgResult {
  doc: Doc;
  /** số entity KHÔNG map được (INSERT/DIMENSION/… chưa hỗ trợ, hoặc HATCH boundary có cung) —
   * hiện cho user biết bản vẽ vào app KHÔNG đầy đủ 100% so với file gốc. */
  skippedEntityCount: number;
  totalEntityCount: number;
}

/**
 * Mở file .dwg qua route server /api/cad/dwg-import (forward sang dwg-parse-service, xem đầu
 * file) → Doc. Không bao giờ throw ra "lỗi lạ" — mọi lỗi (sai định dạng/hỏng/phiên bản DWG chưa
 * hỗ trợ/service chưa cấu hình/service không chạy) đều reject với message tiếng Việt dễ hiểu để
 * UI hiển thị trực tiếp cho user (xem onImportDwgFile ở CadEditor.tsx).
 */
export async function openDwgFile(file: File): Promise<OpenDwgResult> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    throw new Error(`Không đọc được nội dung file: ${err instanceof Error ? err.message : String(err)}`);
  }

  let res: Response;
  try {
    res = await fetch('/api/cad/dwg-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    });
  } catch (err) {
    throw new Error(`Không gọi được máy chủ đọc DWG: ${err instanceof Error ? err.message : String(err)}`);
  }

  const data = (await res.json().catch(() => null)) as (DwgServiceResponse & { code?: string }) | null;
  if (!data) throw new Error(`Máy chủ đọc DWG trả về không hợp lệ (HTTP ${res.status}).`);
  if (!data.ok) throw new Error(data.error);

  return {
    doc: dwgRawDocToDoc(data.doc),
    skippedEntityCount: data.doc.skippedEntityCount,
    totalEntityCount: data.doc.totalEntityCount,
  };
}
