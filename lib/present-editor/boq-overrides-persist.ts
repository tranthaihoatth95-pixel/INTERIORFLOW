/**
 * lib/present-editor/boq-overrides-persist.ts — B5: đọc/ghi `BoqOverrideMap` (`boq-overrides.ts`)
 * xuống IDB. Dùng CHUNG kho `interiorflow-sheets` đã có (`lib/sheets-persist.ts`), KHÔNG bịa kho
 * mới (luật B5). Tách khỏi `boq-overrides.ts` để module đó giữ THUẦN, test được bằng sucrase-node
 * (sucrase-node không resolve alias `@/`, xem comment đầu `boq-overrides.ts`).
 */
import { loadSheets, saveSheets, type PersistedSheet, type SheetsRecord } from '@/lib/sheets-persist';
import { normalizePersistedOverride, overrideKey, type BoqOverride, type BoqOverrideMap } from './boq-overrides';

const OVERRIDES_ROUTE = '/boq-overrides';
const OVERRIDES_SHEET_ID = 'overrides';

interface OverridesSheet extends PersistedSheet {
  items: BoqOverride[];
}

export async function loadBoqOverrides(userId: string, projectId: string): Promise<BoqOverrideMap> {
  if (!userId || !projectId) return {};
  const record = await loadSheets<OverridesSheet>(userId, OVERRIDES_ROUTE, projectId);
  const sheet = record?.sheets.find((s) => s.id === OVERRIDES_SHEET_ID);
  const items = sheet?.items ?? [];
  const map: BoqOverrideMap = {};
  // W0.2 (19/08) — migration-on-read: bản ghi CŨ ({matId}) lẫn MỚI ({specId, matId}) đều được
  // chuẩn hoá về hình dạng đủ 2 field (xem `normalizePersistedOverride`). Định dạng KHOÁ không
  // đổi ⇒ override lưu trước 19/08 áp đúng row như cũ, không có bản ghi nào mồ côi; bản ghi hỏng
  // bị bỏ qua từng-dòng thay vì giết cả map. Idempotent: load lại lần nữa cho cùng kết quả.
  for (const it of items) {
    const ov = normalizePersistedOverride(it);
    if (ov) map[overrideKey(ov.matId, ov.field)] = ov;
  }
  return map;
}

export async function saveBoqOverrides(
  userId: string,
  projectId: string,
  overrides: BoqOverrideMap,
): Promise<void> {
  if (!userId || !projectId) return;
  const record: SheetsRecord<OverridesSheet> = {
    v: 1,
    activeId: OVERRIDES_SHEET_ID,
    sheets: [{ id: OVERRIDES_SHEET_ID, name: 'BOQ overrides', items: Object.values(overrides) }],
    ts: Date.now(),
  };
  await saveSheets(userId, OVERRIDES_ROUTE, record, projectId);
}
