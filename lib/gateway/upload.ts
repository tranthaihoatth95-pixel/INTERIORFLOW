/**
 * lib/gateway/upload.ts — MỘT CỬA NHẬN cho mọi bề mặt upload (R6 19/08, IF-INTEGRATED-EXECUTION-MAP §3 UF-3).
 *
 * Trước R6, hai bề mặt upload đi hai đường KHÔNG gặp nhau:
 *   · `/files` (FileManagerShell) — ghi đĩa thật, tự đoán loại theo đuôi;
 *   · `/library/ingest` (lib/refingest) — chưng manifest IDB, tự chế bộ phân loại riêng (`classify`).
 * Cả hai nay gọi `planUpload()` — Format Router là NGUỒN DUY NHẤT trả lời "file này là gì,
 * IF làm được gì với nó". KHÔNG taxonomy mới: chỉ tái dùng `GatewayFormat` (detect.ts) +
 * bảng năng lực (capabilities.ts) + `GatewayStage` (route.ts).
 *
 * LUẬT NỀN giữ nguyên: bản GỐC bất biến — planUpload chỉ PHÂN LOẠI, không quyết định vứt file.
 * Bề mặt nào cũng vẫn nhận và giữ bản gốc theo đường sẵn có của nó; `note` chỉ để NÓI THẬT
 * với người dùng khi chưa chặng nào mở được định dạng đó.
 */

import { detectFormat, type DetectInput, type GatewayFormat } from './detect';
import { capabilityFor } from './capabilities';
import type { GatewayStage } from './route';

const ALL_STAGES: readonly GatewayStage[] = ['cad', 'render', 'present'];

export interface UploadPlan {
  format: GatewayFormat;
  /** các chặng NHẬP được định dạng này (đọc thẳng bảng năng lực — không suy từ đuôi). */
  importableStages: GatewayStage[];
  /** ghi chú thật khi KHÔNG chặng nào nhập được (lấy từ note của bảng năng lực). */
  note?: string;
}

/** Phân loại 1 file upload qua Format Router. Có `bytes` (≥4KB đầu file) thì magic byte thắng đuôi. */
export function planUpload(input: DetectInput): UploadPlan {
  const format = detectFormat(input);
  const importableStages = ALL_STAGES.filter((s) => capabilityFor(format, s).import !== 'unavailable');
  if (importableStages.length > 0) return { format, importableStages };
  return { format, importableStages, note: capabilityFor(format, 'cad').note };
}
