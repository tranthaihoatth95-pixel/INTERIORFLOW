/**
 * lib/cad/dxf-import.ts — VÒNG ĐỜI nhập DXF qua Worker: tiến độ · huỷ · quá giờ.
 * THUẦN (không `import.meta`, không DOM) ⇒ test được bằng `sucrase-node` với worker giả.
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/dxf-import.test.ts`
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * VÌ SAO CÓ (G-M1-01, đo trên 6 hồ sơ thật):
 * Đường DWG đã có đủ worker + tiến độ + huỷ từ 04/08. Đường DXF thì **chưa có gì**: `parseDxfEx()`
 * chạy thẳng trên luồng chính. Máy rảnh thì nó nhanh (0,2–1,5 s cho tệp 5–27 MB) nên nhìn qua
 * tưởng không sao — nhưng máy bận (đo thật: load average 47–58) thì CÙNG tệp đó mất **12–68 giây**,
 * và suốt quãng đó giao diện đứng hình, không có nút nào bấm được, không có cách nào thoát.
 * Đó mới là thứ người dùng gặp, không phải con số lúc máy rảnh.
 *
 * ⚠️ TIẾN ĐỘ Ở ĐÂY LÀ **GIAI ĐOẠN + THỜI GIAN TRÔI**, KHÔNG PHẢI PHẦN TRĂM.
 * `parseDxfEx` là một vòng quét tuyến tính duy nhất; muốn có % thật thì phải cắm móc đếm vào giữa
 * nó — đổi một hàm thuần đang được 6 bộ test khoá. Bịa một thanh % chạy đều là **nói dối người
 * dùng** (K3). Worker báo đúng 3 mốc CÓ THẬT (`reading` · `parsing` · `done`), main thread đếm
 * giây. Muốn % thật thì làm ở việc khác, và phải sửa `parseDxfEx`.
 *
 * ⚠️ HUỶ = **BỎ RƠI WORKER**, không `terminate()`. Đây là hướng Hoà đã chốt cho đường DWG
 * (`STATUS.md`, sự cố 04/08): đo được `terminate()` KHÔNG cắt nổi vòng lặp WASM nặng, mà lại làm
 * tab treo. Ở đây rủi ro nhẹ hơn nhiều (JS thuần, không WASM) nhưng vẫn dùng CÙNG một luật cho
 * cả hai đường — hai luật khác nhau cho cùng một việc là mầm lỗi.
 */

import type { Doc } from './model';
import type { DxfLoadReport } from './dxf';

/** Giai đoạn CÓ THẬT — mỗi mốc ứng với một chỗ trong mã, không phải mốc trang trí. */
export type DxfStage = 'reading' | 'parsing' | 'done';

export const DXF_STAGE_LABEL: Readonly<Record<DxfStage, string>> = {
  reading: 'Đang đọc tệp',
  parsing: 'Đang dựng hình',
  done: 'Xong',
};

/** Trần cứng — quá giờ thì thà báo lỗi rõ còn hơn để người dùng ngồi nhìn mãi. */
export const DEFAULT_DXF_IMPORT_TIMEOUT_MS = 60_000;
/** Nhịp cập nhật "đã N giây" lên thanh trạng thái. */
export const DXF_HEARTBEAT_MS = 1_000;

export interface DxfImportOptions {
  signal?: { aborted: boolean; addEventListener(t: 'abort', f: () => void): void };
  timeoutMs?: number;
  onProgress?: (p: { stage: DxfStage; elapsedMs: number }) => void;
}

/** Khuôn tối thiểu của Worker mà vòng đời này cần — để test bơm worker giả vào. */
export interface DxfWorkerLike {
  postMessage(msg: unknown): void;
  addEventListener(type: 'message' | 'error', fn: (ev: unknown) => void): void;
  terminate?(): void;
}

export interface DxfImportDeps {
  spawn: () => DxfWorkerLike;
  /** Bỏ rơi worker (KHÔNG terminate) — nơi gọi tự quản cái hồ worker mồ côi. */
  orphan: (worker: DxfWorkerLike, stage: DxfStage, elapsedMs: number) => void;
  onStatus?: (text: string) => void;
  /** đồng hồ + hẹn giờ tiêm được để test chạy nhanh và tất định. */
  now?: () => number;
  setInterval?: (fn: () => void, ms: number) => unknown;
  clearInterval?: (h: unknown) => void;
}

export interface DxfImportResult { doc: Doc; report: DxfLoadReport }

/** Câu trạng thái trong lúc chờ — nói GIAI ĐOẠN + GIÂY, và nói luôn là huỷ được. */
export function dxfProgressLine(fileName: string, stage: DxfStage, elapsedMs: number): string {
  return `${DXF_STAGE_LABEL[stage]} ${fileName} — ${Math.round(elapsedMs / 1000)} giây. Bấm Huỷ để dừng.`;
}

/** Câu lỗi quá giờ — có tên tệp, có giai đoạn đang kẹt, để người dùng biết mà báo lại. */
export function dxfTimeoutMessage(fileName: string, stage: DxfStage, timeoutMs: number): string {
  return `Quá ${Math.round(timeoutMs / 1000)} giây chưa mở xong ${fileName} (${DXF_STAGE_LABEL[stage].toLowerCase()}). Đã dừng để máy còn dùng được.`;
}

export const DXF_CANCELLED_MESSAGE = 'Đã huỷ mở tệp.';

/**
 * Chạy một lượt nhập DXF. KHÔNG bao giờ throw kiểu lạ — mọi đường hỏng đều reject với câu tiếng
 * Việt hiển thị thẳng được.
 */
export function runDxfImport(
  text: string,
  fileName: string,
  opts: DxfImportOptions,
  deps: DxfImportDeps,
): Promise<DxfImportResult> {
  const now = deps.now ?? (() => Date.now());
  const setInt = deps.setInterval ?? ((fn: () => void, ms: number) => setInterval(fn, ms));
  const clrInt = deps.clearInterval ?? ((h: unknown) => clearInterval(h as ReturnType<typeof setInterval>));
  const t0 = now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_DXF_IMPORT_TIMEOUT_MS;

  return new Promise<DxfImportResult>((resolve, reject) => {
    let stage: DxfStage = 'reading';
    let settled = false;
    let heartbeat: unknown = null;
    let worker: DxfWorkerLike;

    const elapsed = () => now() - t0;
    const tick = () => {
      opts.onProgress?.({ stage, elapsedMs: elapsed() });
      deps.onStatus?.(dxfProgressLine(fileName, stage, elapsed()));
      if (elapsed() >= timeoutMs) finish(() => reject(new Error(dxfTimeoutMessage(fileName, stage, timeoutMs))), true);
    };
    /** `orphan` = có bỏ rơi worker hay không (huỷ/quá giờ), khác với kết thúc bình thường. */
    const finish = (settle: () => void, orphan: boolean) => {
      if (settled) return;
      settled = true;
      if (heartbeat !== null) clrInt(heartbeat);
      if (orphan && worker) deps.orphan(worker, stage, elapsed());
      settle();
    };

    if (opts.signal?.aborted) {
      reject(new Error(DXF_CANCELLED_MESSAGE));
      return;
    }

    try {
      worker = deps.spawn();
    } catch (err) {
      reject(new Error(`Không mở được bộ đọc bản vẽ: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }

    worker.addEventListener('message', (ev: unknown) => {
      const data = (ev as { data?: unknown })?.data as
        | { kind: 'stage'; stage: DxfStage }
        | { kind: 'done'; doc: Doc; report: DxfLoadReport }
        | { kind: 'error'; message: string }
        | undefined;
      if (!data) return;
      if (data.kind === 'stage') { stage = data.stage; tick(); return; }
      if (data.kind === 'error') { finish(() => reject(new Error(data.message)), false); return; }
      if (data.kind === 'done') {
        stage = 'done';
        finish(() => resolve({ doc: data.doc, report: data.report }), false);
      }
    });
    worker.addEventListener('error', (ev: unknown) => {
      const msg = (ev as { message?: string })?.message ?? 'lỗi không rõ';
      finish(() => reject(new Error(`Bộ đọc bản vẽ gặp lỗi: ${msg}`)), false);
    });

    opts.signal?.addEventListener('abort', () => {
      finish(() => reject(new Error(DXF_CANCELLED_MESSAGE)), true);
    });

    heartbeat = setInt(tick, DXF_HEARTBEAT_MS);
    worker.postMessage({ text });
  });
}
