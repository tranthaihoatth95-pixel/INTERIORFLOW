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

/* ───────────────────────── P1 (STATUS.md 2.1.6.d) — timeout/tiến độ/lỗi nhập DWG ─────────────────────────
 * Đặt Ở ĐÂY (không phải dwg.ts) vì CÙNG LÝ DO tách file ở đầu file này: THUẦN, không `import.meta`,
 * test được dưới sucrase-node (`lib/cad/dwg.test.ts`). dwg.ts (Worker orchestration) import + dùng
 * lại nguyên các hàm/hằng số này — không viết logic thứ hai.
 */

/** 60s mặc định (đề xuất của chủ dự án) — lớn hơn HẲN case chậm nhất đo được thật (39s, file
 * .dwg thật 21MB phức tạp — xem docstring `openDwgFile` ở dwg.ts để biết cách đo), đủ dư cho biến
 * động tải máy mà vẫn đủ ngắn để không cảm giác "treo vĩnh viễn". */
export const DEFAULT_DWG_IMPORT_TIMEOUT_MS = 60_000;

/**
 * `flattening` THÊM 05/08 (PHU, bug 2.1.6.d) — giai đoạn thứ TƯ, trước đây không tồn tại trong
 * bảng này dù nó VẪN CHẠY: đó là `dwgRawDocToDoc()` bung INSERT/MINSERT/DIMENSION, chạy trên
 * MAIN THREAD sau khi worker đã trả kết quả. Vì không có tên giai đoạn, nó cũng không có dòng
 * trạng thái nào — người dùng thấy app đứng im ở chữ "convertEx" trong khi thật ra đang ở bước
 * khác hẳn. Xem vết vá đầy đủ ở docstring `runDwgImport` mục "LỖ #3".
 */
export type DwgStage = 'spawning' | 'reading' | 'converting' | 'flattening';

export const DWG_STAGE_LABEL: Record<DwgStage, string> = {
  spawning: 'đang khởi tạo worker đọc DWG',
  reading: 'đang đọc nhị phân DWG (dwg_read_data)',
  converting: 'đang chuyển sang danh sách đối tượng (convertEx) — bước hay chậm nhất',
  flattening: 'đang bung block/xref ra hình thật',
};

/** Bảng mã phiên bản DWG (byte 0-5 file, "ACxxyy") → tên quen thuộc — CHỈ liệt các mã phổ biến
 * chắc chắn (thống nhất giữa mọi tool DWG công khai: ODA/LibreDWG), mã lạ thì hiện nguyên chữ ký
 * thô, KHÔNG đoán bừa tên phiên bản. TRÙNG với bảng riêng trong `dwg-worker.ts` (bản sao có chủ
 * đích — worker không được import file này lẫn ngược lại, xem luật cô lập GPL ở đầu file đó). */
const DWG_VERSION_NAMES: Record<string, string> = {
  AC1032: 'AutoCAD 2018–2024',
  AC1027: 'AutoCAD 2013–2017',
  AC1024: 'AutoCAD 2010–2012',
  AC1021: 'AutoCAD 2007–2009',
  AC1018: 'AutoCAD 2004–2006',
  AC1015: 'AutoCAD 2000–2002',
  AC1014: 'AutoCAD R14',
  AC1012: 'AutoCAD R13',
};

/** Đọc 6 byte đầu (chữ ký DWG) — dùng làm giàu thông báo lỗi/timeout (yêu cầu §5 "phiên bản DWG
 * nào?"). THUẦN — chỉ cần ArrayBuffer, không phụ thuộc Worker/File. */
export function describeDwgHeader(buffer: ArrayBuffer): string {
  if (buffer.byteLength < 6) return 'file quá ngắn để đọc được chữ ký DWG';
  const head = new TextDecoder('ascii').decode(new Uint8Array(buffer, 0, 6));
  if (!/^AC\d{4}$/.test(head)) {
    return `chữ ký đầu file không phải DWG hợp lệ ("${head.replace(/[^\x20-\x7e]/g, '?')}")`;
  }
  const name = DWG_VERSION_NAMES[head];
  return name ? `${head} · ${name}` : `${head} (phiên bản chưa rõ tên)`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function dwgTimeoutMessage(file: { name: string; size: number }, timeoutMs: number, stage: DwgStage, headerInfo: string): string {
  return (
    `Nhập "${file.name}" (${formatBytes(file.size)}, ${headerInfo}) quá ${Math.round(timeoutMs / 1000)}s chưa xong ` +
    `(${DWG_STAGE_LABEL[stage]}) — đã huỷ. Thư viện đọc DWG chạy 1 lệnh đồng bộ, không có cách huỷ giữa chừng nên ` +
    `chỉ có thể chờ đủ thời gian rồi buộc dừng worker. File có thể quá lớn/phức tạp, hoặc chứa dữ liệu khiến thư ` +
    `viện đọc bị kẹt ở bước "${stage === 'converting' ? 'chuyển đổi entity' : 'đọc nhị phân'}" — thử lại với file ` +
    `nhỏ hơn hoặc tăng thời gian chờ, hoặc xuất lại bản vẽ từ CAD gốc.`
  );
}

export function dwgCancelledMessage(file: { name: string }): string {
  return `Đã huỷ nhập "${file.name}" theo yêu cầu.`;
}

/** Dùng cho cả progress callback lẫn heartbeat status bar mặc định (xem `openDwgFile` ở dwg.ts). */
export function dwgProgressMessage(file: { name: string }, stage: DwgStage, elapsedMs: number): string {
  return `Đang đọc ${file.name}… (${DWG_STAGE_LABEL[stage]}, ${Math.round(elapsedMs / 1000)}s)`;
}

/* ═══════════ VÒNG ĐỜI 1 LƯỢT NHẬP DWG (tách khỏi dwg.ts 05/08, việc PHU q8) ═══════════
 * VÌ SAO CHUYỂN XUỐNG ĐÂY: toàn bộ phần khó của bug 2.1.6.d (timeout · huỷ · tiến độ · thứ tự
 * settle) nằm trong thân `openDwgFile`, mà `dwg.ts` chứa `import.meta.url` nên **không require
 * được dưới sucrase-node** ⇒ trước phiên này KHÔNG một dòng nào của vòng đời đó có test
 * (`dwg.test.ts` chỉ test được 4 hàm format chuỗi, tự ghi rõ lý do ở docstring của nó).
 * Nay logic thuần nằm ở `runDwgImport` (file này, 0 `import.meta`, 0 DOM cứng) — `dwg.ts` chỉ còn
 * là bộ nối: đẻ Worker thật + ghi status bar + giữ hồ worker mồ côi.
 */

/** Hình dạng TỐI THIỂU của Worker mà vòng đời cần — khai theo cấu trúc, KHÔNG buộc `lib.dom`,
 * để test node dựng worker giả được. Worker thật của trình duyệt khớp sẵn hình dạng này. */
export interface DwgWorkerLike {
  postMessage(message: unknown, transfer?: unknown[]): void;
  terminate(): void;
  onmessage: ((ev: { data: DwgWorkerMessage }) => void) | null;
  onerror: ((ev: { message?: string }) => void) | null;
}

/** Bản sao CỐ Ý của `DwgWorkerMessage` bên `dwg-worker.ts` (luật cô lập GPL: không bên nào được
 * import bên kia — xem đầu `dwg-worker.ts`). Giữ đồng bộ bằng tay như `DwgRawDoc` đã làm. */
export type DwgWorkerMessage =
  | { kind: 'progress'; stage: 'reading' | 'converting' }
  | ({ kind: 'result' } & DwgWorkerResponse);

/** Phần của `File` mà vòng đời dùng tới — test truyền object thường, không cần File thật. */
export interface DwgImportFile {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface DwgImportResult {
  doc: Doc;
  /** số entity KHÔNG map được (WIPEOUT/POINT/SPLINE… chưa hỗ trợ, hoặc HATCH boundary có cung) —
   * hiện cho user biết bản vẽ vào app KHÔNG đầy đủ 100% so với file gốc. */
  skippedEntityCount: number;
  totalEntityCount: number;
  /** Tường trình bước bung block/xref — `flatten.message` khác rỗng ⇒ bản vẽ vào KHÔNG đủ hình,
   * PHẢI hiện câu đó cho người dùng (đừng nuốt: cắt ngắn im lặng = user tưởng file mình hỏng). */
  flatten: DwgFlattenReport;
}

export interface DwgImportOptions {
  /** ms trước khi HUỶ worker + reject nếu chưa có phản hồi — mặc định `DEFAULT_DWG_IMPORT_TIMEOUT_MS`. */
  timeoutMs?: number;
  /** ms trần cho RIÊNG bước bung block/xref — mặc định `DEFAULT_FLATTEN_BUDGET_MS`. Tách khỏi
   * `timeoutMs` vì hai bước khác bản chất: bước worker cắt được bằng `setTimeout`, bước này
   * đồng bộ nên phải tự cắt trong vòng lặp. */
  flattenBudgetMs?: number;
  /** Huỷ giữa chừng theo yêu cầu người dùng (nút "Huỷ" ở CadEditor). */
  signal?: AbortSignal;
  /** Tiến độ CÓ THẬT: giai đoạn worker báo + elapsed đo từ main thread, nhịp ~1s. */
  onProgress?: (info: { stage: DwgStage; elapsedMs: number }) => void;
}

export interface DwgImportHost {
  /** Đẻ worker đọc DWG (thật: `new Worker(new URL('./dwg-worker.ts', import.meta.url))`). */
  spawn: () => DwgWorkerLike;
  /** Người dùng bấm Huỷ ⇒ BỎ RƠI worker thay vì `terminate()` (Hoà chốt, SO-KIEM-TONG §11c —
   * terminate() giữa `convertEx` treo cứng tab, tái hiện 3 lần trên file 9.7MB). CHỈ gọi khi
   * worker ĐÃ NHẬN việc; worker chưa nhận buffer thì đang rảnh, `terminate()` an toàn hơn (không
   * để lại worker mồ côi vô ích) — xem `startedWork` dưới. */
  orphan: (worker: DwgWorkerLike, stage: DwgStage, elapsedMs: number) => void;
  /** Ghi status bar mặc định mỗi nhịp heartbeat. Không có ⇒ bỏ qua. */
  onStatus?: (text: string) => void;
}

/**
 * Chạy 1 lượt nhập DWG. Không bao giờ throw "lỗi lạ" — mọi ngả (sai định dạng · hỏng · worker
 * chết · quá giờ · bị huỷ) đều reject kèm câu tiếng Việt dựng sẵn để UI hiện thẳng.
 *
 * 🔴 SỬA 05/08 (PHU q8) — hai lỗ thứ tự settle mà bản trong `dwg.ts` mắc phải:
 *  1. **Gửi việc cho worker SAU KHI đã settle.** `file.arrayBuffer()` là bất đồng bộ; nếu người
 *     dùng bấm Huỷ (hoặc timeout nổ) trong lúc đọc buffer thì nhánh `.then` VẪN chạy tiếp và
 *     `postMessage` cho worker vừa bị bỏ rơi ⇒ worker mồ côi bắt đầu `convertEx` **sau khi đã
 *     huỷ**, ăn nguyên 1 lõi CPU mà không ai còn nghe kết quả (đúng rủi ro SO-KIEM-TONG §11d nêu:
 *     "worker mồ côi có thể ăn nguyên 1 lõi vĩnh viễn"). Nay chặn bằng cờ `settled`.
 *  2. **Bỏ rơi worker còn RẢNH.** `signal.aborted` ngay lúc vào hàm ⇒ worker chưa hề nhận buffer,
 *     nhưng bản cũ vẫn đẩy nó vào hồ mồ côi (chiếm 1 trong 2 chỗ của hồ, và không bao giờ tự
 *     chết vì nó chẳng có việc gì để xong). Nay chỉ bỏ rơi khi worker ĐÃ nhận việc.
 *
 * 🔴 **LỖ #3 — VÙNG KHÔNG AI CANH** (tìm ra 05/08, PHU; đây là chỗ "treo im lặng" thật sự).
 * Bản cũ chạy `finish(() => resolve({ doc: dwgRawDocToDoc(msg.doc), … }))`. `finish()` **gỡ sạch
 * bộ canh gác TRƯỚC khi hàm bung block chạy**: `clearInterval(heartbeat)` · `clearTimeout(
 * hardTimeout)` · gỡ listener `abort`. Nghĩa là toàn bộ thời gian của `dwgRawDocToDoc` —
 * chạy ĐỒNG BỘ trên main thread — không timeout nào cắt được, không dòng trạng thái nào nhúc
 * nhích, nút Huỷ bấm không ăn. Đúng nghĩa "app đứng im, không biết vì sao".
 *
 * Điều này cũng ĐÍNH CHÍNH kết luận cũ ở `SO-KIEM-TONG` §11d ("`terminate()` không cắt được vòng
 * WASM này"): tới bước đó **worker đã trả kết quả xong và đang rảnh**, nên `terminate()` tất
 * nhiên không đổi gì — CPU lúc ấy nằm ở MAIN THREAD, không ở worker. Vật chứng phiên này:
 * chạy libredwg-web ngoài trình duyệt trên **cả 34 file .dwg thật** của studio → **34/34 parse
 * xong**, không file nào treo; riêng `01_BeachClub_TangHam.dwg` 9,3 MB (chính file đã làm treo
 * tab 18 phút, xem §11d) parse hết **6 giây** (đọc 724 ms + convertEx 4.278 ms). Không có vòng
 * lặp WASM vô hạn nào ở file đó.
 *
 * Vá: (a) đặt `stage = 'flattening'` + báo trạng thái **TRƯỚC** khi bung, để dòng chữ cuối cùng
 * người dùng thấy đúng bước đang chạy chứ không đứng ở "convertEx"; (b) bung bằng
 * `flattenDwgRawDoc` — trần thời gian nằm NGAY TRONG vòng lặp (`DEFAULT_FLATTEN_BUDGET_MS`), vì
 * `setTimeout` không thể cắt một vòng lặp đồng bộ; (c) chỉ `finish()` SAU khi bung xong, để
 * timeout/heartbeat/abort còn hiệu lực suốt bước cuối này.
 */
export function runDwgImport(file: DwgImportFile, opts: DwgImportOptions, host: DwgImportHost): Promise<DwgImportResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_DWG_IMPORT_TIMEOUT_MS;

  return new Promise<DwgImportResult>((resolve, reject) => {
    let worker: DwgWorkerLike;
    try {
      worker = host.spawn();
    } catch (err) {
      reject(new Error(`Không khởi tạo được worker đọc DWG: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }

    let settled = false;
    /** Worker đã được giao buffer chưa — quyết định "bỏ rơi" hay "terminate" (lỗ #2 ở trên). */
    let startedWork = false;
    let stage: DwgStage = 'spawning';
    let headerInfo = '(chưa đọc được header)';
    const startedAt = Date.now();
    let onAbort: (() => void) | undefined;

    const heartbeat = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      opts.onProgress?.({ stage, elapsedMs });
      try {
        host.onStatus?.(dwgProgressMessage(file, stage, elapsedMs));
      } catch {
        /* store chưa sẵn sàng (SSR/test) — bỏ qua, KHÔNG chặn việc nhập file */
      }
    }, 1000);

    /** `orphan: true` = bỏ rơi worker thay vì `terminate()` (chỉ khi worker ĐÃ nhận việc —
     * `startedWork`; còn rảnh thì terminate an toàn hơn). Áp cho CẢ đường Huỷ của người dùng
     * LẪN nhánh timeout tự động — §11d chốt hướng (a) ngày 08/08 (Hoà uỷ quyền kỹ thuật):
     * `terminate()` giữa `convertEx` treo cứng tab, tái hiện 3 lần trên file 9.7MB (§11c),
     * nên không còn nhánh nào được terminate một worker đang cày WASM. Nhánh LỖI worker báo
     * về (`msg.ok=false`, `onerror`) vẫn terminate — lúc đó worker đã dừng việc, không kẹt. */
    const finish = (settle: () => void, orphan = false) => {
      if (settled) return;
      settled = true;
      clearInterval(heartbeat);
      clearTimeout(hardTimeout);
      if (opts.signal && onAbort) opts.signal.removeEventListener('abort', onAbort);
      if (orphan && startedWork) {
        host.orphan(worker, stage, Date.now() - startedAt);
      } else {
        worker.terminate();
      }
      settle();
    };

    const hardTimeout = setTimeout(() => {
      finish(() => reject(new Error(dwgTimeoutMessage(file, timeoutMs, stage, headerInfo))), true);
    }, timeoutMs);

    if (opts.signal) {
      if (opts.signal.aborted) {
        finish(() => reject(new Error(dwgCancelledMessage(file))), true);
        return;
      }
      onAbort = () => finish(() => reject(new Error(dwgCancelledMessage(file))), true);
      opts.signal.addEventListener('abort', onAbort);
    }

    worker.onerror = (ev) => {
      finish(() => reject(new Error(`Worker đọc DWG lỗi: ${ev.message || 'không rõ nguyên nhân'}`)));
    };

    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.kind === 'progress') {
        stage = msg.stage; // chỉ cập nhật mốc — CHƯA settle, còn chờ 'result'
        return;
      }
      if (!msg.ok) {
        finish(() => reject(new Error(msg.error)));
        return;
      }
      // LỖ #3 — bung block CÒN TRONG vùng canh gác: `finish()` (gỡ timeout/heartbeat/abort) dời
      // xuống SAU bước này. Đổi stage + báo NGAY để dòng chữ cuối cùng người dùng thấy là bước
      // đang thật sự chạy, không phải "convertEx" đã xong từ lâu.
      stage = 'flattening';
      opts.onProgress?.({ stage, elapsedMs: Date.now() - startedAt });
      host.onStatus?.(dwgProgressMessage(file, stage, Date.now() - startedAt));
      let flat: { doc: Doc; report: DwgFlattenReport };
      try {
        flat = flattenDwgRawDoc(msg.doc, { budgetMs: opts.flattenBudgetMs });
      } catch (err) {
        finish(() => reject(new Error(`Lỗi khi bung block/xref của ${file.name}: ${err instanceof Error ? err.message : String(err)}`)));
        return;
      }
      finish(() => {
        resolve({
          doc: flat.doc,
          skippedEntityCount: msg.doc.skippedEntityCount,
          totalEntityCount: msg.doc.totalEntityCount,
          flatten: flat.report,
        });
      });
    };

    file
      .arrayBuffer()
      .then((buffer) => {
        // LỖ #1 (xem docstring): đã huỷ/quá giờ trong lúc đọc buffer ⇒ TUYỆT ĐỐI không giao việc
        // nữa, nếu không worker (vừa bị bỏ rơi) sẽ nạp WASM rồi chạy convertEx cho một lượt nhập
        // mà không còn ai nghe.
        if (settled) return;
        headerInfo = describeDwgHeader(buffer);
        startedWork = true;
        worker.postMessage({ buffer }, [buffer]);
      })
      .catch((err) => {
        finish(() => reject(new Error(`Không đọc được nội dung file: ${err instanceof Error ? err.message : String(err)}`)));
      });
  });
}

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
export const MAX_FLATTEN_ENTITIES = 200_000;

/**
 * Trần THỜI GIAN cho riêng bước bung block (05/08, PHU — bug 2.1.6.d).
 *
 * Vì sao trần SỐ LƯỢNG ở trên là chưa đủ: nó chỉ chặn được ca "nổ ra nhiều entity". Ca ngược lại
 * — cây INSERT rất sâu/rộng nhưng mỗi nhánh sinh ÍT entity — vẫn tiêu thời gian mà không bao giờ
 * chạm trần đếm. Đây là bước ĐỒNG BỘ trên main thread: `setTimeout` không cắt được nó (đã đo,
 * xem `runDwgImport` "LỖ #3"), nên trần phải nằm NGAY TRONG vòng lặp, không nằm ngoài.
 *
 * 15 s chọn theo số đo thật của phiên này (bench `dwgRawDocToDoc`, máy Hoà):
 *   - file thật lớn nhất trong 34 file .dwg của studio (dạng 24.000 entity · 1.546 block): **111 ms**
 *   - ca bung tới ĐÚNG trần đếm 200.000 entity: **2,82 s** lúc máy rảnh
 *   - CÙNG ca đó khi máy bận (`npm test` chạy song song 8 luồng): **> 6 s**
 * Con số đầu tiên thử là 6 s và nó CẮT NHẦM ca 200.000 entity lúc máy bận (`dwg-flatten.test.ts`
 * [11] đỏ thật một lần) — giữ lại ghi chép này để đừng ai hạ xuống nữa. 15 s ≈ 5× ca xấu nhất
 * lúc rảnh, vẫn còn dư khi máy bận ⇒ file LÀNH không bao giờ chạm; file bệnh lý bị cắt trong
 * mươi giây thay vì treo hàng chục phút. Trần này KHÔNG thay trần đếm — cái nào tới trước thì
 * cắt, và `report.truncated` nói rõ là cái nào.
 */
export const DEFAULT_FLATTEN_BUDGET_MS = 15_000;
/** Xem đồng hồ mỗi bấy nhiêu entity — đủ dày để cắt kịp, đủ thưa để không tốn gì đáng kể. */
const FLATTEN_CLOCK_EVERY = 512;

/** Giới hạn tiêm được cho `flattenDwgRawDoc` — mặc định dùng 2 hằng ở trên. `now` để test tất định. */
export interface DwgFlattenLimits {
  maxEntities?: number;
  budgetMs?: number;
  now?: () => number;
}

/** Bản tường trình bước bung block — `message` là câu HIỆN THẲNG cho người dùng (rỗng = trọn vẹn). */
export interface DwgFlattenReport {
  /** `none` = bung hết · `count` = chạm trần số lượng · `time` = chạm trần thời gian. */
  truncated: 'none' | 'count' | 'time';
  entityCount: number;
  elapsedMs: number;
  message: string;
}

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
export function dwgRawDocToDoc(raw: DwgRawDoc, limits?: DwgFlattenLimits): Doc {
  return flattenDwgRawDoc(raw, limits).doc;
}

/**
 * Bản ĐẦY ĐỦ của `dwgRawDocToDoc` — trả THÊM bản tường trình cắt ngắn.
 *
 * Tách ra (05/08, PHU) vì `dwgRawDocToDoc` còn được dùng NGOÀI repo (`~/Downloads/dwg2dxf`, xem
 * `dwg.ts:14`) nên chữ ký cũ phải giữ nguyên 1 tham số. Trong app thì luôn gọi bản này: cắt ngắn
 * mà KHÔNG nói ra là lỗi cùng họ với treo im lặng — người dùng nhận bản vẽ thiếu hình và tưởng
 * file mình hỏng. Trước phiên này trần `MAX_FLATTEN_ENTITIES` cắt HOÀN TOÀN im lặng (`return`
 * trần, không cờ, không đếm) — grep `MAX_FLATTEN_ENTITIES` trong bản cũ = 2 chỗ `return`, 0 chỗ báo.
 */
export function flattenDwgRawDoc(raw: DwgRawDoc, limits?: DwgFlattenLimits): { doc: Doc; report: DwgFlattenReport } {
  const doc: Doc = { entities: [], layers: [] };
  const layerById = new Map<string, Layer>();
  const layerDefByName = new Map<string, DwgRawLayer>();
  for (const l of raw.layers) layerDefByName.set(l.name, l);
  const blocks = raw.blocks ?? {};

  const maxEntities = limits?.maxEntities ?? MAX_FLATTEN_ENTITIES;
  const budgetMs = limits?.budgetMs ?? DEFAULT_FLATTEN_BUDGET_MS;
  const now = limits?.now ?? Date.now;
  const startedAt = now();
  let truncated: DwgFlattenReport['truncated'] = 'none';
  let sinceClock = 0;
  /** Hết giờ chưa? Chỉ thật sự xem đồng hồ mỗi `FLATTEN_CLOCK_EVERY` lần hỏi. Một khi đã hết giờ
   * thì GIỮ NGUYÊN kết luận (không hỏi lại) — nếu không, mọi nhánh đệ quy còn lại vẫn phải chạy
   * tới lần bội số kế tiếp mới dừng. */
  const outOfTime = (): boolean => {
    if (truncated === 'time') return true;
    if (++sinceClock < FLATTEN_CLOCK_EVERY) return false;
    sinceClock = 0;
    if (now() - startedAt < budgetMs) return false;
    truncated = 'time';
    return true;
  };
  const outOfRoom = (): boolean => {
    if (doc.entities.length >= maxEntities) {
      if (truncated === 'none') truncated = 'count';
      return true;
    }
    return outOfTime();
  };

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
    if (outOfRoom()) return;
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
    if (outOfRoom()) return;
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
  return { doc, report: flattenReport(truncated, doc.entities.length, now() - startedAt, maxEntities, budgetMs) };
}

/** Câu tường trình — viết theo `SPEC-NGON-NGU-CHI-DAN`: nói ĐIỀU ĐÃ XẢY RA + việc làm tiếp,
 * không lộ tên hằng/hàm nội bộ ra giao diện. Rỗng khi bung trọn vẹn. */
function flattenReport(
  truncated: DwgFlattenReport['truncated'],
  entityCount: number,
  elapsedMs: number,
  maxEntities: number,
  budgetMs: number,
): DwgFlattenReport {
  let message = '';
  if (truncated === 'count') {
    message =
      `Bản vẽ vượt ${maxEntities.toLocaleString('vi-VN')} đối tượng — đã dừng ở mức đó để app không đứng máy. ` +
      `Hình đã vào vẫn dùng được nhưng CHƯA ĐỦ: tách bớt xref/block trong CAD gốc rồi nhập lại.`;
  } else if (truncated === 'time') {
    message =
      `Bước bung block/xref chạy quá ${Math.round(budgetMs / 1000)} giây nên đã dừng lại — nhận được ` +
      `${entityCount.toLocaleString('vi-VN')} đối tượng. Bản vẽ CHƯA ĐỦ hình: file này lồng block rất sâu, ` +
      `hãy xuất phẳng (flatten/bind xref) từ CAD gốc rồi nhập lại.`;
  }
  return { truncated, entityCount, elapsedMs, message };
}
