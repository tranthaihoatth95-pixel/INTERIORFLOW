/**
 * lib/cad/dwg-worker.ts — Web Worker CÔ LẬP RIÊNG cho việc đọc file .dwg.
 *
 * ⚠️ GIẤY PHÉP GPL — ĐỌC TRƯỚC KHI SỬA FILE NÀY:
 * Đây là file DUY NHẤT trong InteriorFlow được phép `import` package `@mlightcad/libredwg-web`
 * (dựa trên GNU LibreDWG, mang giấy phép GPL-3.0/GPL-2.0). InteriorFlow là sản phẩm thương mại
 * (xem package.json) — để KHÔNG trộn code GPL vào bundle chính (Next.js app code), toàn bộ việc
 * gọi thư viện này bị giới hạn trong 1 Web Worker riêng, giao tiếp với code chính CHỈ qua
 * postMessage (không export/import trực tiếp module này vào bất kỳ file .ts/.tsx nào khác —
 * xem lib/cad/dwg.ts, nơi NHẬN kết quả đã parse qua postMessage, KHÔNG import package này).
 *
 * Đây là BIỆN PHÁP GIẢM THIỂU RỦI RO theo khuyến nghị cộng đồng (tác giả thư viện đề xuất chạy
 * trong worker để dễ kiểm soát ranh giới GPL) — KHÔNG PHẢI bảo đảm tuân thủ pháp lý tuyệt đối.
 * CẦN review pháp lý chính thức (luật sư/quản lý dự án) trước khi dùng tính năng này để phân
 * phối cho khách hàng thật. Chi tiết đầy đủ + rủi ro: xem docs/LICENSE-NOTES.md.
 *
 * Việc worker làm: nhận ArrayBuffer (nội dung file .dwg) → parse bằng WASM (libredwg-web) →
 * RÚT GỌN kết quả thành cấu trúc JSON thô tối thiểu (DwgRawEntity/DwgRawLayer — định nghĩa Ở
 * ĐÂY, KHÔNG import type từ package GPL để giữ ranh giới rõ ràng, xem lib/cad/dwg.ts có định
 * nghĩa cấu trúc TƯƠNG ỨNG riêng, không phụ thuộc lẫn nhau ngoài hình dạng JSON) → trả về qua
 * postMessage. KHÔNG map sang Doc/Entity của app ở đây — việc đó thuộc lib/cad/dwg.ts.
 *
 * Phạm vi entity map (Nấc 2 — block-flatten, xem docs/DEMO-DWG-IMPORT.md):
 * LINE, CIRCLE, ARC, TEXT, MTEXT, LWPOLYLINE, HATCH (chỉ boundary dạng polyline/toàn cạnh
 * thẳng — bỏ qua boundary có cung/spline để tránh suy đoán hình học sai), INSERT/MINSERT
 * (block reference — worker CHỈ trích dữ liệu thô: tên block + insertion/scale/rotation +
 * bảng BLOCK_RECORD kèm entity con; việc GIẢI NÉN (flatten) về world space nằm ở
 * lib/cad/dwg.ts — ngoài ranh giới GPL), ATTRIB đi kèm INSERT (→ TEXT, toạ độ đã là world),
 * DIMENSION (trích block ẩn danh *D chứa hình vẽ sẵn + measurement/text để fallback).
 * CHƯA hỗ trợ: WIPEOUT, POINT, SPLINE, ELLIPSE — bỏ qua an toàn (đếm skippedEntityCount).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorkerSelf = any;
const ctx: WorkerSelf = self;

export interface DwgRawPoint {
  x: number;
  y: number;
}

export type DwgRawEntity =
  | { type: 'LINE'; layer: string; colorIndex?: number; lineweight?: number; a: DwgRawPoint; b: DwgRawPoint }
  | { type: 'CIRCLE'; layer: string; colorIndex?: number; lineweight?: number; c: DwgRawPoint; r: number }
  | { type: 'ARC'; layer: string; colorIndex?: number; lineweight?: number; c: DwgRawPoint; r: number; a1: number; a2: number }
  | { type: 'TEXT'; layer: string; colorIndex?: number; at: DwgRawPoint; text: string; h: number }
  | { type: 'LWPOLYLINE'; layer: string; colorIndex?: number; lineweight?: number; points: DwgRawPoint[]; closed: boolean }
  | { type: 'HATCH'; layer: string; colorIndex?: number; points: DwgRawPoint[]; pattern: string; solid: boolean; patternAngle?: number; patternScale?: number }
  | {
      /** Block reference (kể cả MINSERT khi cols/rows > 1). Worker KHÔNG flatten — chỉ chuyển dữ
       * liệu thô, dwg.ts resolve qua DwgRawDoc.blocks. */
      type: 'INSERT'; layer: string; colorIndex?: number; name: string; at: DwgRawPoint;
      sx: number; sy: number; rot: number;
      cols: number; rows: number; colSpacing: number; rowSpacing: number;
    }
  | {
      /** Dimension: ưu tiên render qua block ẩn danh (blockName, tra DwgRawDoc.blocks); thiếu
       * block thì dwg.ts fallback text đo + đường gióng từ p1/p2/defPoint. kind = dimensionType&7. */
      type: 'DIMENSION'; layer: string; colorIndex?: number; blockName?: string;
      textPoint: DwgRawPoint; text?: string; measurement?: number; kind: number;
      p1?: DwgRawPoint; p2?: DwgRawPoint; defPoint?: DwgRawPoint;
    };

export interface DwgRawBlock {
  basePoint: DwgRawPoint;
  entities: DwgRawEntity[];
}

export interface DwgRawLayer {
  name: string;
  colorIndex: number;
  /** Enum thô của libredwg (KHÔNG phải mm trực tiếp cho mọi giá trị — xem lib/cad/dwg.ts). */
  lineweight?: number;
  lineType?: string;
  off: boolean;
  frozen: boolean;
  locked: boolean;
}

export interface DwgRawDoc {
  entities: DwgRawEntity[];
  layers: DwgRawLayer[];
  /** Bảng block: tên → { basePoint, entities } — dwg.ts dùng để flatten INSERT/DIMENSION.
   * OPTIONAL để giữ tương thích JSON với caller cũ (dwg2dxf/cli.js) chưa gửi field này. */
  blocks?: Record<string, DwgRawBlock>;
  /** Số entity KHÔNG map được (lạ/chưa hỗ trợ) — dùng để báo trạng thái cho user, không throw. */
  skippedEntityCount: number;
  totalEntityCount: number;
}

export type DwgWorkerResponse =
  | { ok: true; doc: DwgRawDoc }
  | { ok: false; error: string };

/** true nếu tất cả boundary edge của HATCH là đoạn thẳng (Line, type 1) — an toàn để nối thành
 * đa giác điểm; có cung/spline thì bỏ qua path đó (tránh suy đoán hình cung sai). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenHatchPath(path: any): DwgRawPoint[] | null {
  if (Array.isArray(path?.vertices) && path.vertices.length >= 3) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return path.vertices.map((v: any) => ({ x: v.x, y: v.y }));
  }
  if (Array.isArray(path?.edges) && path.edges.length >= 3) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allLines = path.edges.every((e: any) => e.type === 1 && e.start);
    if (allLines) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return path.edges.map((e: any) => ({ x: e.start.x, y: e.start.y }));
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntity(e: any): DwgRawEntity | null {
  switch (e.type) {
    case 'LINE':
      return { type: 'LINE', layer: e.layer, colorIndex: e.colorIndex, lineweight: e.lineweight, a: { x: e.startPoint.x, y: e.startPoint.y }, b: { x: e.endPoint.x, y: e.endPoint.y } };
    case 'CIRCLE':
      return { type: 'CIRCLE', layer: e.layer, colorIndex: e.colorIndex, lineweight: e.lineweight, c: { x: e.center.x, y: e.center.y }, r: e.radius };
    case 'ARC':
      // Lưu ý: startAngle/endAngle của libredwg-web đã là RADIAN (khác DXF ASCII group 50/51 —
      // độ — mà dxf.ts phải tự đổi). KHÔNG nhân π/180 ở đây (đã verify bằng file .dwg thật).
      return { type: 'ARC', layer: e.layer, colorIndex: e.colorIndex, lineweight: e.lineweight, c: { x: e.center.x, y: e.center.y }, r: e.radius, a1: e.startAngle, a2: e.endAngle };
    case 'TEXT':
      return { type: 'TEXT', layer: e.layer, colorIndex: e.colorIndex, at: { x: e.startPoint.x, y: e.startPoint.y }, text: e.text ?? '', h: e.textHeight || 250 };
    case 'MTEXT':
      return { type: 'TEXT', layer: e.layer, colorIndex: e.colorIndex, at: { x: e.insertionPoint.x, y: e.insertionPoint.y }, text: e.text ?? '', h: e.textHeight || 250 };
    case 'LWPOLYLINE': {
      const points = (e.vertices ?? []).map((v: DwgRawPoint) => ({ x: v.x, y: v.y }));
      if (points.length < 2) return null;
      return { type: 'LWPOLYLINE', layer: e.layer, colorIndex: e.colorIndex, lineweight: e.lineweight, points, closed: (e.flag & 1) === 1 };
    }
    case 'HATCH': {
      // Chỉ lấy boundary path ĐẦU TIÊN đọc được an toàn (đa số hatch kiến trúc chỉ có 1 path
      // ngoài) — path có cung/spline hoặc không đọc được thì bỏ qua cả entity, không đoán hình.
      const paths = e.boundaryPaths ?? [];
      let points: DwgRawPoint[] | null = null;
      for (const p of paths) {
        points = flattenHatchPath(p);
        if (points) break;
      }
      if (!points) return null;
      return {
        type: 'HATCH', layer: e.layer, colorIndex: e.colorIndex, points,
        pattern: e.patternName ?? 'SOLID',
        solid: e.solidFill === 1,
        patternAngle: e.patternAngle, patternScale: e.patternScale,
      };
    }
    case 'INSERT':
    case 'MINSERT':
      if (!e.name || !e.insertionPoint) return null;
      return {
        type: 'INSERT', layer: e.layer, colorIndex: e.colorIndex, name: e.name,
        at: { x: e.insertionPoint.x, y: e.insertionPoint.y },
        // xScale/yScale mặc định 1 (0 hoặc thiếu = dữ liệu hỏng → coi như 1, tránh hình co về 0)
        sx: typeof e.xScale === 'number' && e.xScale !== 0 ? e.xScale : 1,
        sy: typeof e.yScale === 'number' && e.yScale !== 0 ? e.yScale : 1,
        rot: typeof e.rotation === 'number' ? e.rotation : 0, // radian (giống ARC — libredwg-web)
        cols: Math.max(1, Math.trunc(e.columnCount || 1)),
        rows: Math.max(1, Math.trunc(e.rowCount || 1)),
        colSpacing: e.columnSpacing || 0,
        rowSpacing: e.rowSpacing || 0,
      };
    case 'DIMENSION': {
      const tp = e.textPoint ?? e.definitionPoint;
      if (!tp) return null;
      return {
        type: 'DIMENSION', layer: e.layer, colorIndex: e.colorIndex,
        blockName: typeof e.name === 'string' && e.name ? e.name : undefined,
        textPoint: { x: tp.x, y: tp.y },
        text: typeof e.text === 'string' ? e.text : undefined,
        measurement: typeof e.measurement === 'number' ? e.measurement : undefined,
        kind: (e.dimensionType ?? 0) & 7,
        p1: e.subDefinitionPoint1 ? { x: e.subDefinitionPoint1.x, y: e.subDefinitionPoint1.y } : undefined,
        p2: e.subDefinitionPoint2 ? { x: e.subDefinitionPoint2.x, y: e.subDefinitionPoint2.y } : undefined,
        defPoint: e.definitionPoint ? { x: e.definitionPoint.x, y: e.definitionPoint.y } : undefined,
      };
    }
    default:
      return null; // WIPEOUT/POINT/SPLINE/ELLIPSE/… — chưa hỗ trợ, bỏ qua an toàn
  }
}

/** ATTRIB đi kèm INSERT → TEXT (toạ độ ATTRIB đã là world space, KHÔNG cần transform theo block).
 * Bỏ attribute ẩn (flags bit 1 = invisible). libredwg-web gói text vào field `text: DwgTextBase`;
 * phòng cả trường hợp field nằm phẳng trên entity (khác version). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAttrib(a: any): DwgRawEntity | null {
  if (!a || (typeof a.flags === 'number' && (a.flags & 1) === 1)) return null;
  const tb = a.text && typeof a.text === 'object' ? a.text : a;
  const at = tb.startPoint ?? tb.insertionPoint;
  const txt = typeof tb.text === 'string' ? tb.text : '';
  if (!at || !txt) return null;
  return { type: 'TEXT', layer: a.layer, colorIndex: a.colorIndex, at: { x: at.x, y: at.y }, text: txt, h: tb.textHeight || 250 };
}

/** mapEntity + ATTRIB con của INSERT (1 entity nguồn có thể sinh >1 entity thô). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntityMulti(e: any): DwgRawEntity[] {
  const out: DwgRawEntity[] = [];
  const mapped = mapEntity(e);
  if (mapped) out.push(mapped);
  if ((e.type === 'INSERT' || e.type === 'MINSERT') && Array.isArray(e.attribs)) {
    for (const a of e.attribs) {
      const t = mapAttrib(a);
      if (t) out.push(t);
    }
  }
  return out;
}

/** Mọi phiên bản DWG bắt đầu bằng chữ ký "AC" + 4 chữ số (vd AC1015=2000, AC1032=2018…) — kiểm
 * TRƯỚC khi đưa vào WASM parser. Lý do thêm bước này: bản thân libredwg-web (WASM) khá "khoan
 * dung" — thử với 1 file .txt giả .dwg thực tế cho thấy `dwg_read_data` vẫn trả về con trỏ hợp
 * lệ (không undefined) nhưng dữ liệu rỗng, khiến app tưởng "mở thành công 0 đối tượng" thay vì
 * báo lỗi rõ ràng. Chặn sớm ở đây để lỗi hiện ra đúng như yêu cầu (không crash, KHÔNG mập mờ). */
function hasDwgMagic(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 6) return false;
  const head = new TextDecoder('ascii').decode(new Uint8Array(buffer, 0, 6));
  return /^AC\d{4}$/.test(head);
}

async function parseDwg(buffer: ArrayBuffer): Promise<DwgWorkerResponse> {
  if (!hasDwgMagic(buffer)) {
    return { ok: false, error: 'File không có chữ ký DWG hợp lệ (thiếu header "AC10xx") — chắc chắn không phải file .dwg, hoặc file đã hỏng.' };
  }
  // Import động NGAY TRONG hàm — package GPL chỉ được tải khi thực sự cần parse (worker script
  // vẫn phải bundle nó, nhưng import động giúp rõ ràng đây là điểm-vào-duy-nhất về mặt runtime).
  const { LibreDwg, Dwg_File_Type } = await import('@mlightcad/libredwg-web');
  // wasm binary phục vụ tĩnh từ /wasm/libredwg-web.wasm (đã copy vào public/wasm — xem
  // docs/LICENSE-NOTES.md mục "Build"). Chỉ định filepath rõ ràng để tránh phụ thuộc vào cách
  // Emscripten tự suy ra vị trí script khi bundler (webpack/Turbopack) đổi tên/di chuyển file.
  const libredwg = await LibreDwg.create('/wasm');

  let dataPtr: number | undefined;
  try {
    dataPtr = libredwg.dwg_read_data(buffer, Dwg_File_Type.DWG);
  } catch (err) {
    return { ok: false, error: `libredwg-web ném lỗi khi đọc file: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (dataPtr === undefined) {
    return { ok: false, error: 'Không đọc được file .dwg — sai định dạng, file hỏng, hoặc phiên bản DWG chưa được libredwg-web hỗ trợ.' };
  }

  try {
    const { database, stats } = libredwg.convertEx(dataPtr);
    const layers: DwgRawLayer[] = (database.tables?.LAYER?.entries ?? []).map((l) => ({
      name: l.name,
      colorIndex: l.colorIndex,
      lineweight: l.lineweight,
      lineType: l.lineType,
      off: !!l.off,
      frozen: !!l.frozen,
      locked: !!l.locked,
    }));
    // Bảng block: BLOCK_RECORD → { basePoint, entities } cho dwg.ts flatten INSERT/DIMENSION.
    // Bỏ *Model_Space/*Paper_Space (entity model space đã nằm ở database.entities — đưa vào
    // blocks sẽ nhân đôi hình nếu file có INSERT tự tham chiếu bất thường).
    const blocks: Record<string, DwgRawBlock> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const br of (database.tables?.BLOCK_RECORD?.entries ?? []) as any[]) {
      if (!br?.name || /^\*(Model_Space|Paper_Space)/i.test(br.name)) continue;
      const bp = br.basePoint ?? { x: 0, y: 0 };
      const kids: DwgRawEntity[] = [];
      for (const e of br.entities ?? []) kids.push(...mapEntityMulti(e));
      if (kids.length > 0) blocks[br.name] = { basePoint: { x: bp.x || 0, y: bp.y || 0 }, entities: kids };
    }

    const entities: DwgRawEntity[] = [];
    let skipped = stats.unknownEntityCount ?? 0;
    for (const e of database.entities) {
      const mapped = mapEntityMulti(e);
      if (mapped.length > 0) entities.push(...mapped);
      else skipped += 1;
    }
    return {
      ok: true,
      doc: { entities, layers, blocks, skippedEntityCount: skipped, totalEntityCount: database.entities.length },
    };
  } catch (err) {
    return { ok: false, error: `Lỗi khi chuyển đổi dữ liệu DWG đã đọc: ${err instanceof Error ? err.message : String(err)}` };
  } finally {
    try {
      libredwg.dwg_free(dataPtr);
    } catch {
      /* free lỗi không ảnh hưởng kết quả đã trả — bỏ qua */
    }
  }
}

ctx.onmessage = async (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
  try {
    const result = await parseDwg(e.data.buffer);
    ctx.postMessage(result);
  } catch (err) {
    const resp: DwgWorkerResponse = { ok: false, error: `Lỗi worker DWG: ${err instanceof Error ? err.message : String(err)}` };
    ctx.postMessage(resp);
  }
};
