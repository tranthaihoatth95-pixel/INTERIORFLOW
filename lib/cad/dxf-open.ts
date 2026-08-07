/**
 * lib/cad/dxf-open.ts — cửa TRÌNH DUYỆT cho việc nhập DXF: đẻ Worker, ghi thanh trạng thái, giữ
 * hồ worker mồ côi. Mọi logic vòng đời nằm ở `dxf-import.ts` (thuần, test được) — file này cố ý
 * mỏng vì nó chứa `import.meta.url` nên `sucrase-node` không require nổi (đúng lý do
 * `dwg.ts`/`dwg-map.ts` phải tách đôi từ 05/08).
 */

import { useCadStore } from './store';
import { runDxfImport, type DxfImportOptions, type DxfImportResult, type DxfStage, type DxfWorkerLike } from './dxf-import';

/**
 * Worker bị BỎ RƠI (người dùng bấm Huỷ / quá giờ). Giữ tham chiếu để trình duyệt đừng thu dọn
 * giữa chừng, và để đếm được — trần 2 cái, đúng con số đường DWG đang dùng.
 */
const ORPHANED: DxfWorkerLike[] = [];
const MAX_ORPHANS = 2;

function orphanWorker(worker: DxfWorkerLike, fileName: string, stage: DxfStage, elapsedMs: number) {
  ORPHANED.push(worker);
  while (ORPHANED.length > MAX_ORPHANS) {
    const old = ORPHANED.shift();
    // Chỉ tới lúc này mới cắt: cái cũ nhất đã bị bỏ rơi lâu, giữ thêm chỉ tổ ăn bộ nhớ.
    try { old?.terminate?.(); } catch { /* cắt được thì tốt, không thì thôi */ }
  }
  // eslint-disable-next-line no-console -- dấu vết để soi khi nghi worker mồ côi ăn CPU
  console.warn(`[dxf] Bỏ rơi worker đọc "${fileName}" ở giai đoạn "${stage}" sau ${Math.round(elapsedMs / 1000)}s.`);
}

/**
 * Mở một tệp .dxf. KHÔNG bao giờ throw kiểu lạ — mọi lỗi reject với câu tiếng Việt hiển thị thẳng.
 * `opts.signal` = `AbortController.signal` để nút Huỷ dừng được thật.
 */
export async function openDxfFile(file: File, opts: DxfImportOptions = {}): Promise<DxfImportResult> {
  const setStatus = (text: string) => {
    try { useCadStore.getState().setStatus(text); } catch { /* store chưa sẵn sàng (SSR/test) */ }
  };
  // Đọc tệp cũng nằm trong quãng "đứng hình" nếu làm sai — `file.text()` là async, không chặn.
  const text = await file.text();
  return runDxfImport(text, file.name, opts, {
    spawn: () => new Worker(new URL('./dxf-worker.ts', import.meta.url)) as unknown as DxfWorkerLike,
    orphan: (worker, stage, elapsedMs) => orphanWorker(worker, file.name, stage, elapsedMs),
    onStatus: setStatus,
  });
}
