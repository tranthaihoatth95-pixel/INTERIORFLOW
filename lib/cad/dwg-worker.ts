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
 * Phạm vi entity map (Nấc 1 — an toàn, đã verify với file .dwg thật, xem báo cáo Sprint):
 * LINE, CIRCLE, ARC, TEXT, MTEXT, LWPOLYLINE, HATCH (chỉ boundary dạng polyline/toàn cạnh
 * thẳng — bỏ qua boundary có cung/spline để tránh suy đoán hình học sai). CHƯA hỗ trợ: INSERT
 * (block — cần dựng lại từ BLOCK_RECORD, để dành đợt sau), DIMENSION, ATTRIB/ATTDEF, WIPEOUT,
 * POINT — các entity lạ/chưa hỗ trợ được BỎ QUA an toàn (đếm vào unknownEntityCount), không
 * đoán mò cấu trúc chưa verify.
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
  | { type: 'HATCH'; layer: string; colorIndex?: number; points: DwgRawPoint[]; pattern: string; solid: boolean; patternAngle?: number; patternScale?: number };

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
    default:
      return null; // INSERT/DIMENSION/ATTRIB/WIPEOUT/POINT/… — chưa hỗ trợ, bỏ qua an toàn
  }
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
    const entities: DwgRawEntity[] = [];
    let skipped = stats.unknownEntityCount ?? 0;
    for (const e of database.entities) {
      const mapped = mapEntity(e);
      if (mapped) entities.push(mapped);
      else skipped += 1;
    }
    return {
      ok: true,
      doc: { entities, layers, skippedEntityCount: skipped, totalEntityCount: database.entities.length },
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
