/**
 * lib/present-editor/project-doc.ts — B0 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`): CẦU DỮ LIỆU cho
 * chặng Trình bày đọc Doc SỐNG của dự án, KHÔNG qua ảnh/snapshot (đúng luật "ba chặng ba ống
 * kính, một nguồn" — `docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` T1). CẤM: `dataUrl`, `snapshot`, copy
 * Doc vào state riêng của Present, `syncDocToBoq`.
 *
 * Nguồn theo thứ tự ưu tiên:
 *  1. `useCadStore.getState().doc` — CHỈ tin khi `useFlowStore.getState().currentProjectId`
 *     khớp đúng `projectId` VÀ `doc.entities.length > 0`. Vì sao cần cả 2 điều kiện: sau
 *     hard-reload, `currentProjectId` có thể đã được `useProjectScopeSync` gán lại đúng từ URL,
 *     nhưng `useCadStore.doc` vẫn là `emptyDoc()` mặc định (CHƯA ai gọi `loadSheets` cho CAD trên
 *     route Present — `components/cad/CadSheets.tsx:325` là nơi DUY NHẤT làm việc đó) — thiếu
 *     điều kiện 2 sẽ trả nhầm "rỗng" thay vì rơi xuống IDB ở bước 2.
 *  2. IndexedDB qua `loadSheets(userId, '/cad-editor', projectId)` — ca THẬT phổ biến nhất: vào
 *     thẳng `/projects/[id]/present` mà chưa từng mở chặng Vẽ trong phiên (hard-reload hoặc
 *     điều hướng thẳng bằng URL).
 *  3. Không có gì (dự án mới/chưa vẽ gì) → `source:'none'` — UI tự hiện empty-state, KHÔNG coi
 *     là lỗi ở tầng này.
 *
 * GIỚI HẠN ĐÃ BIẾT (ghi rõ, không giấu — §0 LUẬT TRUNG THỰC): nếu trong CÙNG một phiên SPA user
 * mở dự án A ở chặng Vẽ (store nạp doc A, entities>0), rồi điều hướng thẳng sang Present của dự
 * án B mà CHƯA từng mở chặng Vẽ của B — `currentProjectId` đổi đúng thành B nhưng `useCadStore`
 * là Zustand store TOÀN CỤC không tự dọn theo route, nên bước 1 sẽ SAI (còn giữ entities của A,
 * length>0 nên qua được điều kiện gate) và trả nhầm doc của A. Ca này hiếm (đổi dự án ngay trong
 * present mà không mở CAD trước) và KHÔNG có cách phát hiện đáng tin từ phía present-editor mà
 * không sửa `lib/cad/store.ts` (ngoài vùng sở hữu của phiên này, xem `docs/SO-KIEM-TONG.md` §2) —
 * chấp nhận theo đúng phạm vi Pha 1 "Desktop đóng gói, KHÔNG đồng bộ đa nguồn" của
 * `docs/IF-CORE-SCHEMA.md`. Ghi vào `docs/TECH-DEBT.md` nếu có ca thật user report.
 */
import { useCadStore } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import { loadSheets, type PersistedSheet } from '@/lib/sheets-persist';
import { emptyDoc, type Doc } from '@/lib/cad/model';

export type ProjectDocSource = 'store' | 'idb' | 'none';

export interface ProjectDocResult {
  doc: Doc;
  source: ProjectDocSource;
  sheetId?: string;
  sheetName?: string;
}

interface CadPersistedSheet extends PersistedSheet {
  doc: Doc;
}

/** Route CAD dùng làm khoá persist — khớp đúng hằng `ROUTE` trong `CadSheets.tsx:53`, KHÔNG tự
 * đổi 1 nơi mà quên nơi kia (2 nguồn cùng phải trỏ 1 chuỗi). */
const CAD_ROUTE = '/cad-editor';

export async function getProjectDoc(userId: string, projectId: string): Promise<ProjectDocResult> {
  if (!projectId) return { doc: emptyDoc(), source: 'none' };

  if (useFlowStore.getState().currentProjectId === projectId) {
    const doc = useCadStore.getState().doc;
    if (doc && doc.entities.length > 0) {
      return { doc, source: 'store' };
    }
  }

  if (userId) {
    const record = await loadSheets<CadPersistedSheet>(userId, CAD_ROUTE, projectId);
    if (record && record.sheets.length > 0) {
      const active = record.sheets.find((s) => s.id === record.activeId) ?? record.sheets[0];
      if (active?.doc) {
        return { doc: active.doc, source: 'idb', sheetId: active.id, sheetName: active.name };
      }
    }
  }

  return { doc: emptyDoc(), source: 'none' };
}
