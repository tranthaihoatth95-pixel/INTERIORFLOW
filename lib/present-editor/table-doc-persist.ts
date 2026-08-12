/**
 * lib/present-editor/table-doc-persist.ts — đọc/ghi trạng thái 1 `TableDocEngine` (dòng đã re-sync
 * + override tay) xuống IDB. Dùng CHUNG kho `interiorflow-sheets` đã có (`lib/sheets-persist.ts`),
 * KHÔNG bịa kho mới — cùng luật `boq-overrides-persist.ts` đã áp cho BOQ (B5).
 *
 * Lưu 2 lớp TÁCH BẠCH, đúng kiến trúc engine (xem `table-doc-engine.ts`):
 *  - `rows`   — TRẠNG THÁI DÒNG đã re-sync (kể cả cờ `orphaned`) — đây là thứ CẦN nhớ giữa các lần
 *    mở lại app, vì `orphaned` chỉ tính được bằng cách SO SÁNH với lần gieo trước, không suy lại
 *    được từ Doc hiện tại một mình.
 *  - `overrides` — override tay, y hệt cách BOQ lưu (`TableOverrideMap`).
 *
 * `docKey` = `${projectId}::${docType}` — 1 dự án có thể có nhiều docType bảng (schedule/
 * spec-sheet/approval-form sau này) sống độc lập nhau, không phải viết route riêng cho mỗi loại.
 */
import { loadSheets, saveSheets, type PersistedSheet, type SheetsRecord } from '@/lib/sheets-persist';
import type { TableOverrideMap, TableCellOverride, TableRow } from './table-doc-engine';

const TABLE_DOC_ROUTE = '/table-doc';
const SHEET_ID = 'state';

interface TableDocPersistedSheet extends PersistedSheet {
  rows: TableRow[];
  overrideItems: TableCellOverride[];
}

export interface TableDocPersistedState {
  rows: TableRow[];
  overrides: TableOverrideMap;
}

function docKey(projectId: string, docType: string): string {
  return `${projectId}::${docType}`;
}

export async function loadTableDocState(userId: string, projectId: string, docType: string): Promise<TableDocPersistedState> {
  if (!userId || !projectId) return { rows: [], overrides: {} };
  const record = await loadSheets<TableDocPersistedSheet>(userId, TABLE_DOC_ROUTE, docKey(projectId, docType));
  const sheet = record?.sheets.find((s) => s.id === SHEET_ID);
  const rows = sheet?.rows ?? [];
  const overrides: TableOverrideMap = {};
  for (const ov of sheet?.overrideItems ?? []) overrides[`${ov.rowId}::${ov.colKey}`] = ov;
  return { rows, overrides };
}

export async function saveTableDocState(
  userId: string,
  projectId: string,
  docType: string,
  state: TableDocPersistedState,
): Promise<void> {
  if (!userId || !projectId) return;
  const record: SheetsRecord<TableDocPersistedSheet> = {
    v: 1,
    activeId: SHEET_ID,
    sheets: [{ id: SHEET_ID, name: docType, rows: state.rows, overrideItems: Object.values(state.overrides) }],
    ts: Date.now(),
  };
  await saveSheets(userId, TABLE_DOC_ROUTE, record, docKey(projectId, docType));
}
