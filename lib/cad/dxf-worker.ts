/**
 * lib/cad/dxf-worker.ts — Web Worker đọc DXF, để luồng chính KHÔNG đứng hình (G-M1-01).
 *
 * Cùng khuôn `lib/cad/dwg-worker.ts` (đường DWG đã làm 04/08): worker chỉ làm ĐÚNG một việc nặng
 * rồi trả kết quả; toàn bộ vòng đời (tiến độ · huỷ · quá giờ) nằm ở `dxf-import.ts` — thuần, test
 * được. Khác với DWG một điểm: ở đây KHÔNG có dependency GPL nào, worker chỉ để tách luồng.
 *
 * Báo đúng 3 mốc CÓ THẬT trong mã, không bịa phần trăm (xem docstring `dxf-import.ts`).
 */

import { parseDxfEx } from './dxf';

// `self` trong Worker không có kiểu DOM chuẩn ở tsconfig của app (lib dom) — khai tối thiểu, đúng
// cách `dwg-worker.ts` đang làm, thay vì kéo cả `webworker` lib vào toàn dự án.
type WorkerScope = {
  addEventListener(t: 'message', fn: (ev: { data: { text?: string } }) => void): void;
  postMessage(msg: unknown): void;
};
const ctx = self as unknown as WorkerScope;

ctx.addEventListener('message', (ev) => {
  const text = ev?.data?.text;
  if (typeof text !== 'string') {
    ctx.postMessage({ kind: 'error', message: 'Không nhận được nội dung tệp.' });
    return;
  }
  try {
    ctx.postMessage({ kind: 'stage', stage: 'parsing' });
    const { doc, report } = parseDxfEx(text);
    ctx.postMessage({ kind: 'done', doc, report });
  } catch (err) {
    ctx.postMessage({
      kind: 'error',
      message: `Không đọc được bản vẽ: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});
