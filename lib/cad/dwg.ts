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

import { runDwgImport } from './dwg-map';
import type { DwgWorkerLike, DwgStage, DwgImportResult, DwgImportOptions } from './dwg-map';
// `useCadStore` CHỈ dùng để cập nhật status bar mặc định (xem docstring `openDwgFile` — lý do
// làm ở đây thay vì CadEditor.tsx) — cùng khuôn import tĩnh đã có sẵn ở `cad3d-autosave-core.ts`/
// `commands.ts`/`geometry.ts` (store.ts KHÔNG import ngược lại dwg.ts — không có vòng lặp).
import { useCadStore } from './store';

export { dwgRawDocToDoc, describeDwgHeader, dwgTimeoutMessage, dwgCancelledMessage, dwgProgressMessage, DEFAULT_DWG_IMPORT_TIMEOUT_MS } from './dwg-map';
/* 05/08 (PHU) — mở cửa cho `CadEditor.tsx` đọc kết quả bung block mà KHÔNG phải import thẳng
 * `dwg-map.ts` (file này là cửa công khai của tầng DWG, xem docstring đầu file). `flattenDwgRawDoc`
 * export cho CLI/test gọi trực tiếp; `DEFAULT_FLATTEN_BUDGET_MS` để nơi gọi hiển thị/chỉnh trần. */
export { flattenDwgRawDoc, DEFAULT_FLATTEN_BUDGET_MS, MAX_FLATTEN_ENTITIES } from './dwg-map';
export type { DwgFlattenReport, DwgFlattenLimits } from './dwg-map';
export type { DwgRawDoc, DwgStage } from './dwg-map';

/**
 * P1-VERIFY (04/08, SO-KIEM-TONG §11c) — huỷ MỘT worker đang chặn giữa `convertEx` bằng
 * `worker.terminate()` treo cứng tab thật (>6') trên file 9.7MB, tái hiện 3 lần độc lập. Hoà
 * chốt đánh đổi: khi người dùng bấm Huỷ, BỎ ROI worker thay vì giết nó — không còn lắng nghe kết
 * quả của nó nữa, để trình duyệt tự dọn khi worker tự xong hoặc khi tab đóng. Giữ tối đa 2 worker
 * mồ côi cùng lúc; cái thứ 3 trở đi mới `terminate()` con CŨ NHẤT (chấp nhận rủi ro treo nhỏ đó,
 * đổi lấy chặn rò RAM vô hạn nếu người dùng bấm Huỷ liên tục).
 */
const ORPHANED_DWG_WORKERS: DwgWorkerLike[] = [];

function orphanDwgWorker(worker: DwgWorkerLike, fileName: string, stage: DwgStage, elapsedMs: number) {
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

/** Giữ nguyên tên cũ cho nơi gọi (`CadEditor.tsx`) — bản thân kiểu nay sống ở `dwg-map.ts` cùng
 * vòng đời `runDwgImport`, không khai hai lần. */
export type OpenDwgResult = DwgImportResult;
export type OpenDwgOptions = DwgImportOptions;

/**
 * Mở file .dwg qua Worker cô lập (dwg-worker.ts) → Doc. Không bao giờ throw ra "lỗi lạ" — mọi
 * lỗi (sai định dạng/hỏng/phiên bản DWG chưa hỗ trợ/worker crash/quá giờ/bị huỷ) đều reject với
 * message tiếng Việt dễ hiểu để UI hiển thị trực tiếp cho user (xem onImportDwgFile ở CadEditor.tsx).
 *
 * P1: mặc định LUÔN có timeout cứng (không cần `opts` — caller cũ `openDwgFile(f)` vẫn gọi y
 * nguyên, tự động được bảo vệ) + LUÔN cập nhật `useCadStore.status` mỗi giây trong lúc chờ.
 *
 * 05/08 (PHU q8): thân hàm chuyển hẳn sang `runDwgImport` (`dwg-map.ts`) để **test được** — file
 * này có `import.meta` nên sucrase-node không require nổi, trước đó vòng đời timeout/huỷ 0 test.
 * Ở đây chỉ còn 3 thứ THẬT SỰ thuộc trình duyệt: đẻ Worker · ghi status bar · hồ worker mồ côi.
 */
export function openDwgFile(file: File, opts: OpenDwgOptions = {}): Promise<OpenDwgResult> {
  const setStatus = (text: string) => {
    try {
      useCadStore.getState().setStatus(text);
    } catch {
      /* store chưa sẵn sàng (SSR/test) — bỏ qua */
    }
  };
  return runDwgImport(file, opts, {
    spawn: () => new Worker(new URL('./dwg-worker.ts', import.meta.url)) as unknown as DwgWorkerLike,
    orphan: (worker, stage, elapsedMs) => orphanDwgWorker(worker, file.name, stage, elapsedMs),
    // `openDwgFile` chỉ chạy trong trình duyệt thật (CLI/test gọi thẳng dwg-map.ts) nhưng vẫn
    // phòng thủ — lỗi status bar KHÔNG được chặn việc nhập file.
    onStatus: setStatus,
  }).then((res) => {
    // 05/08 (PHU) — bản vẽ bị CẮT NGẮN thì phải nói ra. Trước đây trần bung block cắt hoàn toàn
    // im lặng: người dùng nhận bản vẽ thiếu hình và tưởng file gốc của mình hỏng.
    // Đưa câu này ra ĐÂY (không phải `CadEditor.tsx`) vì `components/*` là vùng của phiên CHINH —
    // status bar là đường duy nhất `lib/` tự nói được với người dùng, và nó đã có sẵn ở trên.
    // ⚠️ Đây chỉ là mức TỐI THIỂU: câu cảnh báo trôi mất khi có status kế tiếp. Muốn hiện dai
    // (banner/toast có nút "Hiểu rồi") thì phải đọc `res.flatten.message` ở `CadEditor.tsx` —
    // việc của CHINH, đã ghi trong báo cáo phiên.
    if (res.flatten.message) setStatus(res.flatten.message);
    return res;
  });
}
