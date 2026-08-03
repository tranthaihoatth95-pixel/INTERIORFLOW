/**
 * lib/present-editor/boq-overrides-persist.ts — B5: đọc/ghi `BoqOverrideMap` (`boq-overrides.ts`)
 * xuống IDB. Dùng CHUNG kho `interiorflow-sheets` đã có (`lib/sheets-persist.ts`), KHÔNG bịa kho
 * mới (luật B5). Tách khỏi `boq-overrides.ts` để module đó giữ THUẦN, test được bằng sucrase-node
 * (sucrase-node không resolve alias `@/`, xem comment đầu `boq-overrides.ts`).
 */
import { loadSheets, saveSheets, type PersistedSheet, type SheetsRecord } from '@/lib/sheets-persist';
import { overrideKey, type BoqOverride, type BoqOverrideMap } from './boq-overrides';

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
  for (const it of items) map[overrideKey(it.matId, it.field)] = it;
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
