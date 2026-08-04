/**
 * lib/cad/dwg.ts — CẦU NỐI DWG → Doc (code CHÍNH, KHÔNG GPL).
 *
 * File này KHÔNG import package `@mlightcad/libredwg-web` (GPL-3.0) — việc đó CHỈ xảy ra bên
 * trong lib/cad/dwg-worker.ts (Web Worker riêng, xem đầu file đó). Ở đây chỉ khởi tạo Worker,
 * nhận JSON thô (DwgRawDoc) qua postMessage rồi giao cho `dwgRawDocToDoc()` — logic map +
 * block-flatten nằm ở lib/cad/dwg-map.ts (tách riêng để unit test được dưới sucrase-node,
 * file này chứa `import.meta` nên không require trực tiếp được).
 *
 * ⚠️ LICENSE: InteriorFlow là SẢN PHẨM ĐỘC LẬP, dùng cho MỌI studio (không phải tool nội bộ của
 * riêng công ty nào). Vì vậy dependency GPL cô lập trong Worker CẦN được rà lại trước khi phân
 * phối/bán — ĐỌC docs/LICENSE-NOTES.md trước mỗi lần đóng gói phát hành.
 *
 * `dwgRawDocToDoc()` (dwg-map.ts, re-export ở đây) CÒN được dùng bởi **~/Downloads/dwg2dxf** —
 * CLI cá nhân chạy local: từ nay require `lib/cad/dwg-map.ts` thay vì file này.
 *
 * ═══════════════ P1 — bug đỏ STATUS.md 2.1.6.d "nhập DWG treo vĩnh viễn" ═══════════════
 * TÁI HIỆN bằng 34 file .dwg THẬT (dự án thật của studio, `~/Documents/Zalo Received Files` —
 * KHÔNG phải file .dwg tự chế) + kiểm chứng lại bằng grep: `dwg.ts`/`dwg-worker.ts` KHÔNG hề có
 * timeout/AbortController nào trước phiên này. Đo được: 4/34 file thật (11–21MB, dự án phức tạp)
 * vượt quá 25s không phản hồi trong máy đo, đo lại kỹ hơn (không giới hạn) cho thấy chúng KHÔNG
 * phải vòng lặp vô hạn tuyệt đối — vẫn xong, nhưng tốn tới **39 GIÂY** (file 21MB) và THỜI GIAN
 * KHÔNG ỔN ĐỊNH giữa các lần chạy (cùng 1 file: có lần <10s, có lần >25s, tuỳ tải máy). Đã đo
 * chính xác: `dwg_read_data` LUÔN nhanh (dưới vài giây, kể cả file 21MB) — nút cổ chai là
 * `convertEx` (chuyển cấu trúc DWG nội bộ → JSON entities/layers/blocks), xem `dwg-worker.ts`.
 *
 * Với người dùng thật: KHÔNG có tiến độ, KHÔNG có timeout, KHÔNG huỷ được → 30-40+ giây đứng im
 * (Worker chạy nền nên UI chính không đơ, nhưng CadEditor không hề báo gì trong lúc đó — xem
 * `onImportDwgFile` cũ) = CHÍNH XÁC cảm giác "treo vĩnh viễn" người dùng mô tả, dù kỹ thuật không
 * phải vòng lặp C vô hạn tuyệt đối trong mọi trường hợp (không loại trừ khả năng CÓ file thật
 * khác gây vòng lặp thật sự — `convertEx` là code C biên dịch WASM, ngoài tầm sửa của ticket này;
 * cách phòng thủ đúng bất kể nguyên nhân là timeout cứng từ NGOÀI, xem `openDwgFile` dưới).
 *
 * KHÔNG SỬA NHẦM: `findHatchBoundary` trong STATUS.md cũ là ở `lib/three/cad-to-obj.ts` (dò biên
 * phòng cho khối 3D) — hoàn toàn KHÔNG liên quan tới đường nhập DWG này, không đụng tới.
 *
 * Vì sao KHÔNG CÓ progress % thật/KHÔNG hủy được giữa lời gọi WASM đang chạy: đã đọc
 * `node_modules/@mlightcad/libredwg-web/lib/libredwg.d.ts` — `dwg_read_data`/`convertEx` là 2 lời
 * gọi ĐỒNG BỘ (trả `number`/object trực tiếp, không callback/Promise/progress hook nào). Cả 2 câu
 * đó CHẶN HẲN worker thread — worker không thể tự gửi heartbeat hay tự huỷ giữa chừng MỘT trong 2
 * lời gọi đó. Vì vậy: (a) "tiến độ" ở đây là 2 mốc GIAI ĐOẠN THẬT (reading/converting, xem
 * `dwg-worker.ts` `DwgWorkerMessage`) + nhịp elapsed-time từ MAIN THREAD (không đứng chờ worker
 * mới biết đang chạy), (b) timeout/huỷ CHỈ có thể làm từ NGOÀI qua `worker.terminate()` — cách
 * DUY NHẤT dừng được 1 lời gọi WASM đồng bộ đang chặn 1 luồng.
 */

import type { Doc } from './model';
import {
  dwgRawDocToDoc,
  describeDwgHeader,
  dwgTimeoutMessage,
  dwgCancelledMessage,
  dwgProgressMessage,
  DEFAULT_DWG_IMPORT_TIMEOUT_MS,
} from './dwg-map';
import type { DwgWorkerResponse, DwgStage } from './dwg-map';
// `useCadStore` CHỈ dùng để cập nhật status bar mặc định (xem docstring `openDwgFile` — lý do
// làm ở đây thay vì CadEditor.tsx) — cùng khuôn import tĩnh đã có sẵn ở `cad3d-autosave-core.ts`/
// `commands.ts`/`geometry.ts` (store.ts KHÔNG import ngược lại dwg.ts — không có vòng lặp).
import { useCadStore } from './store';

export { dwgRawDocToDoc, describeDwgHeader, dwgTimeoutMessage, dwgCancelledMessage, dwgProgressMessage, DEFAULT_DWG_IMPORT_TIMEOUT_MS } from './dwg-map';
export type { DwgRawDoc, DwgStage } from './dwg-map';

/**
 * P1-VERIFY (04/08, SO-KIEM-TONG §11c) — huỷ MỘT worker đang chặn giữa `convertEx` bằng
 * `worker.terminate()` treo cứng tab thật (>6') trên file 9.7MB, tái hiện 3 lần độc lập. Hoà
 * chốt đánh đổi: khi người dùng bấm Huỷ, BỎ ROI worker thay vì giết nó — không còn lắng nghe kết
 * quả của nó nữa, để trình duyệt tự dọn khi worker tự xong hoặc khi tab đóng. Giữ tối đa 2 worker
 * mồ côi cùng lúc; cái thứ 3 trở đi mới `terminate()` con CŨ NHẤT (chấp nhận rủi ro treo nhỏ đó,
 * đổi lấy chặn rò RAM vô hạn nếu người dùng bấm Huỷ liên tục).
 */
const ORPHANED_DWG_WORKERS: Worker[] = [];

function orphanDwgWorker(worker: Worker, fileName: string, stage: DwgStage, elapsedMs: number) {
  worker.onmessage = null;
  worker.onerror = null;
  ORPHANED_DWG_WORKERS.push(worker);
  console.warn(
    `[dwg] Worker đọc "${fileName}" bị huỷ giữa giai đoạn "${stage}" (${Math.round(elapsedMs / 1000)}s) — ` +
      `bỏ rơi thay vì terminate() để tránh treo tab (SO-KIEM-TONG §11c). Đang có ${ORPHANED_DWG_WORKERS.length} worker mồ côi.`
  );
  while (ORPHANED_DWG_WORKERS.length > 2) {
    ORPHANED_DWG_WORKERS.shift()?.terminate();
  }
}

/** Bản sao CỐ Ý của `DwgWorkerMessage` (`dwg-worker.ts`) — KHÔNG import trực tiếp file đó (luật
 * cô lập GPL đã ghi ở đầu `dwg-worker.ts`: không ai được import module ấy). Cùng khuôn với
 * `DwgWorkerResponse`/`DwgRawDoc` đã trùng lặp có chủ đích giữa `dwg-map.ts` và `dwg-worker.ts`
 * từ trước — 2 bên giữ đồng bộ bằng tay, không type-check chéo được (đã ghi rõ ở `dwg-map.ts`). */
type DwgWorkerMessage =
  | { kind: 'progress'; stage: 'reading' | 'converting' }
  | ({ kind: 'result' } & DwgWorkerResponse);

export interface OpenDwgResult {
  doc: Doc;
  /** số entity KHÔNG map được (WIPEOUT/POINT/SPLINE… chưa hỗ trợ, hoặc HATCH boundary có cung) —
   * hiện cho user biết bản vẽ vào app KHÔNG đầy đủ 100% so với file gốc. */
  skippedEntityCount: number;
  totalEntityCount: number;
}

export interface OpenDwgOptions {
  /** ms trước khi HUỶ worker + reject nếu chưa có phản hồi — mặc định `DEFAULT_DWG_IMPORT_TIMEOUT_MS`
   * (60s), chỉnh được cho file cực lớn hoặc máy chậm. */
  timeoutMs?: number;
  /** Huỷ giữa chừng theo yêu cầu người dùng (khác timeout tự động, cùng cơ chế bên trong:
   * `worker.terminate()` — cách DUY NHẤT dừng lời gọi WASM đồng bộ đang chặn worker thread). Nơi
   * gọi tự tạo `AbortController`, gọi `.abort()` khi có nút "Huỷ" — panel/nút đó CHƯA làm ở ticket
   * này (ngoài vùng file cho phép, `lib/cad/dwg*.ts` · `lib/cad/dxf*.ts`), nhưng cơ chế đã sẵn. */
  signal?: AbortSignal;
  /** Báo tiến độ CÓ THẬT — giai đoạn (`reading`/`converting`, đúng lúc worker CHUYỂN giai đoạn)
   * + elapsed-time đo từ main thread (không phải % giả, xem giải thích ở đầu file: thư viện
   * không có hook progress nào). Gọi mỗi ~1s TỪ LÚC BẮT ĐẦU, không chờ worker phản hồi mới gọi —
   * để "đang chạy" hiện được kể cả khi worker đang kẹt trong 1 lời gọi WASM không phản hồi. */
  onProgress?: (info: { stage: DwgStage; elapsedMs: number }) => void;
}

/**
 * Mở file .dwg qua Worker cô lập (dwg-worker.ts) → Doc. Không bao giờ throw ra "lỗi lạ" — mọi
 * lỗi (sai định dạng/hỏng/phiên bản DWG chưa hỗ trợ/worker crash/quá giờ/bị huỷ) đều reject với
 * message tiếng Việt dễ hiểu để UI hiển thị trực tiếp cho user (xem onImportDwgFile ở CadEditor.tsx).
 *
 * P1: mặc định LUÔN có timeout cứng (không cần `opts` — caller cũ `openDwgFile(f)` vẫn gọi y
 * nguyên, tự động được bảo vệ) + LUÔN cập nhật `useCadStore.status` mỗi giây trong lúc chờ (đúng
 * yêu cầu §3 "người dùng phải thấy nó đang chạy") — làm NGAY TẠI ĐÂY thay vì bắt CadEditor.tsx tự
 * nối `onProgress`, vì ticket này giới hạn vùng file `lib/cad/dwg*.ts`/`dxf*.ts`, không được sửa
 * component UI. `opts.onProgress`/`opts.signal` vẫn có sẵn cho UI thật (nút "Huỷ", thanh tiến độ
 * riêng) nối vào sau — việc đó cần sửa `CadEditor.tsx`, ngoài phạm vi ticket.
 */
export function openDwgFile(file: File, opts: OpenDwgOptions = {}): Promise<OpenDwgResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_DWG_IMPORT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./dwg-worker.ts', import.meta.url));
    } catch (err) {
      reject(new Error(`Không khởi tạo được worker đọc DWG: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }

    let settled = false;
    let stage: DwgStage = 'spawning';
    let headerInfo = '(chưa đọc được header)';
    const startedAt = Date.now();
    let onAbort: (() => void) | undefined;

    const heartbeat = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      opts.onProgress?.({ stage, elapsedMs });
      // Mặc định LUÔN báo lên status bar CAD — xem docstring hàm vì sao làm ở đây thay vì
      // CadEditor.tsx. `openDwgFile` chỉ được gọi từ trình duyệt thật (CLI/test gọi thẳng
      // dwg-map.ts, không qua đây) nhưng vẫn phòng thủ — lỗi ở đây KHÔNG được chặn việc nhập file.
      try {
        useCadStore.getState().setStatus(dwgProgressMessage(file, stage, elapsedMs));
      } catch {
        /* store chưa sẵn sàng (SSR/test) — bỏ qua, không chặn import */
      }
    }, 1000);

    // `orphan: true` CHỈ dùng cho đường Huỷ do người dùng bấm — xem `orphanDwgWorker` ở trên vì
    // sao KHÔNG terminate() ở đây (khác timeout/lỗi worker, vẫn terminate() bình thường).
    const finish = (settle: () => void, orphan = false) => {
      if (settled) return;
      settled = true;
      clearInterval(heartbeat);
      clearTimeout(hardTimeout);
      if (opts.signal && onAbort) opts.signal.removeEventListener('abort', onAbort);
      if (orphan) {
        orphanDwgWorker(worker, file.name, stage, Date.now() - startedAt);
      } else {
        worker.terminate();
      }
      settle();
    };

    const hardTimeout = setTimeout(() => {
      finish(() => reject(new Error(dwgTimeoutMessage(file, timeoutMs, stage, headerInfo))));
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

    worker.onmessage = (ev: MessageEvent<DwgWorkerMessage>) => {
      const msg = ev.data;
      if (msg.kind === 'progress') {
        stage = msg.stage; // chỉ cập nhật mốc — CHƯA settle, còn chờ 'result'
        return;
      }
      finish(() => {
        if (!msg.ok) {
          reject(new Error(msg.error));
          return;
        }
        resolve({
          doc: dwgRawDocToDoc(msg.doc),
          skippedEntityCount: msg.doc.skippedEntityCount,
          totalEntityCount: msg.doc.totalEntityCount,
        });
      });
    };

    file
      .arrayBuffer()
      .then((buffer) => {
        headerInfo = describeDwgHeader(buffer);
        worker.postMessage({ buffer }, [buffer]);
      })
      .catch((err) => {
        finish(() => reject(new Error(`Không đọc được nội dung file: ${err instanceof Error ? err.message : String(err)}`)));
      });
  });
}
