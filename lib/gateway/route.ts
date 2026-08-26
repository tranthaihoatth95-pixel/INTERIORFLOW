/**
 * lib/gateway/route.ts — bảng ánh xạ định dạng → đích (NT2, VIỆC ②, PLAN-LIBRARY-GATEWAY.md §2).
 *
 * Thuần dữ liệu/logic — CHƯA tích hợp vào IOMenu/UI (PLAN §2(c): đợi NT1 xong, vì ảnh reference
 * cần biết "library panel mới" tồn tại để route đúng chỗ thay vì route thẳng vào canvas).
 */

import type { GatewayFormat } from './detect';
import { capabilityFor } from './capabilities';

export type GatewayStage = 'cad' | 'render' | 'present';

export type RouteAction =
  | { kind: 'cad-open-project' } // .idf — mở làm bản vẽ CAD hiện hành
  | { kind: 'cad-import-drawing' } // .dxf / .dwg — nhập nét vẽ vào bản vẽ đang mở
  | { kind: 'cad-restore-project' } // .ifpack — phục hồi toàn bộ dự án (đã có, lib/cad/ifpack.ts)
  | { kind: 'place-image'; stage: GatewayStage } // ảnh — đích tuỳ chặng đang gọi
  | { kind: 'present-import-deck' } // .pptx / .pdf — nhập làm slide
  | { kind: 'present-open-project' } // .idfp — thay toàn bộ project Trình bày
  | { kind: 'library-bulk-ingest' } // .xlsx / .csv — nạp hàng loạt vào thư viện (NT1)
  | { kind: 'render-import-model' } // .glb — lưu nguồn vào Doc, derive mesh cho viewport 3D
  | { kind: 'unsupported'; format: GatewayFormat; reason?: string };

/** định dạng KHÔNG phụ thuộc chặng gọi — tra thẳng bảng. */
const STATIC_ROUTE: Partial<Record<GatewayFormat, RouteAction>> = {
  idf: { kind: 'cad-open-project' },
  dxf: { kind: 'cad-import-drawing' },
  dwg: { kind: 'cad-import-drawing' },
  ifpack: { kind: 'cad-restore-project' },
  pptx: { kind: 'present-import-deck' },
  idfp: { kind: 'present-open-project' },
  xlsx: { kind: 'library-bulk-ingest' },
  csv: { kind: 'library-bulk-ingest' },
  glb: { kind: 'render-import-model' },
  gltf: { kind: 'render-import-model' },
  obj: { kind: 'render-import-model' },
};

/** Ánh xạ định dạng → đích. `stage` = chặng đang gọi Gateway (chỉ ảnh hưởng khi định dạng là ảnh). */
export function routeFormat(format: GatewayFormat, stage: GatewayStage): RouteAction {
  const capability = capabilityFor(format, stage);
  if (capability.import === 'unavailable') {
    return { kind: 'unsupported', format, reason: capability.note };
  }
  if (format === 'image') return { kind: 'place-image', stage };
  // R6 19/08 — PDF phụ thuộc chặng như ảnh: ở Trình bày nhập thành slide (Smart Convert bậc 1);
  // các chặng khác giữ hành vi cũ (rơi xuống unsupported — capability 'reference' chưa có đường
  // nhập riêng). Khoá này TRẢ NỢ "ĐẶC CÁCH GATEWAY" ở present Toolbar (comment cũ ở đó tự khai).
  if (format === 'pdf' && stage === 'present') return { kind: 'present-import-deck' };
  return STATIC_ROUTE[format] ?? { kind: 'unsupported', format };
}
