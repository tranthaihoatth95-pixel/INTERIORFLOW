/**
 * lib/cad/dwg.ts — CẦU NỐI DWG → Doc (code CHÍNH, KHÔNG GPL).
 *
 * File này KHÔNG import package `@mlightcad/libredwg-web` (GPL-3.0) — việc đó CHỈ xảy ra bên
 * trong lib/cad/dwg-worker.ts (Web Worker riêng, xem đầu file đó). Ở đây chỉ khởi tạo Worker,
 * nhận JSON thô (DwgRawDoc) qua postMessage rồi giao cho `dwgRawDocToDoc()` — logic map +
 * block-flatten nằm ở lib/cad/dwg-map.ts (tách riêng để unit test được dưới sucrase-node,
 * file này chứa `import.meta` nên không require trực tiếp được).
 *
 * ⚠️ InteriorFlow là TOOL NỘI BỘ của TTT Architects (auth khoá @ttt.vn, register công khai 403,
 * KHÔNG bán/phân phối ra ngoài công ty) — xem docs/LICENSE-NOTES.md để hiểu vì sao dependency GPL
 * cô lập trong Worker được coi là chấp nhận được cho use-case này (khác hẳn 1 sản phẩm SaaS bán
 * ra thị trường). Nếu SAU NÀY định phân phối/bán InteriorFlow ra ngoài công ty, ĐỌC LẠI
 * LICENSE-NOTES.md trước.
 *
 * `dwgRawDocToDoc()` (dwg-map.ts, re-export ở đây) CÒN được dùng bởi **~/Downloads/dwg2dxf** —
 * CLI cá nhân chạy local: từ nay require `lib/cad/dwg-map.ts` thay vì file này.
 */

import type { Doc } from './model';
import { dwgRawDocToDoc } from './dwg-map';
import type { DwgWorkerResponse } from './dwg-map';

export { dwgRawDocToDoc } from './dwg-map';
export type { DwgRawDoc } from './dwg-map';

export interface OpenDwgResult {
  doc: Doc;
  /** số entity KHÔNG map được (WIPEOUT/POINT/SPLINE… chưa hỗ trợ, hoặc HATCH boundary có cung) —
   * hiện cho user biết bản vẽ vào app KHÔNG đầy đủ 100% so với file gốc. */
  skippedEntityCount: number;
  totalEntityCount: number;
}

/**
 * Mở file .dwg qua Worker cô lập (dwg-worker.ts) → Doc. Không bao giờ throw ra "lỗi lạ" — mọi
 * lỗi (sai định dạng/hỏng/phiên bản DWG chưa hỗ trợ/worker crash) đều reject với message tiếng
 * Việt dễ hiểu để UI hiển thị trực tiếp cho user (xem onImportDwgFile ở CadEditor.tsx).
 */
export function openDwgFile(file: File): Promise<OpenDwgResult> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./dwg-worker.ts', import.meta.url));
    } catch (err) {
      reject(new Error(`Không khởi tạo được worker đọc DWG: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }

    const cleanup = () => {
      worker.terminate();
    };

    worker.onerror = (ev) => {
      cleanup();
      reject(new Error(`Worker đọc DWG lỗi: ${ev.message || 'không rõ nguyên nhân'}`));
    };

    worker.onmessage = (ev: MessageEvent<DwgWorkerResponse>) => {
      cleanup();
      const msg = ev.data;
      if (!msg.ok) {
        reject(new Error(msg.error));
        return;
      }
      resolve({
        doc: dwgRawDocToDoc(msg.doc),
        skippedEntityCount: msg.doc.skippedEntityCount,
        totalEntityCount: msg.doc.totalEntityCount,
      });
    };

    file
      .arrayBuffer()
      .then((buffer) => worker.postMessage({ buffer }, [buffer]))
      .catch((err) => {
        cleanup();
        reject(new Error(`Không đọc được nội dung file: ${err instanceof Error ? err.message : String(err)}`));
      });
  });
}
