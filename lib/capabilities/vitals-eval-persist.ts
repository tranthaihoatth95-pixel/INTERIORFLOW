/**
 * lib/capabilities/vitals-eval-persist.ts — LƯU local-first cho lõi đánh giá Vitals.
 *
 * KHÔNG bịa kho mới: bản ghi đánh giá đi vào IndexedDB `interiorflow-sheets` qua
 * `lib/sheets-persist.ts` (cùng khuôn `boq-overrides-persist.ts` / `studio-persist.ts`), khoá
 * `userId::/vitals-eval::projectId`. Trạng thái mô hình học (JSON `PerceptronState`) đi vào
 * localStorage qua chính `PairwisePerceptron.saveToLocalStorage` (đã có, không viết lại).
 *
 * Tách khỏi `vitals-eval-core.ts` để lõi giữ THUẦN (sucrase-node không resolve `@/`). Mọi hàm ở
 * đây KHÔNG BAO GIỜ NÉM — IDB hỏng/không có thì đánh giá vẫn chạy trong RAM (local-first không
 * có nghĩa là "hỏng đĩa thì hỏng app").
 */
import { loadSheets, saveSheets, type PersistedSheet, type SheetsRecord } from '@/lib/sheets-persist';
import { PairwisePerceptron } from '@/lib/gu/pairwise-perceptron';
import { EVAL_MODEL_STORAGE_KEY, isEvalRecord, mergeRecordIntoList, type EvalRecord } from './vitals-eval-core';

export const EVAL_ROUTE = '/vitals-eval';
const SHEET_ID = 'records';

interface EvalSheet extends PersistedSheet {
  records: unknown[];
}

export async function loadEvalRecords(userId: string, projectId: string): Promise<EvalRecord[]> {
  if (!userId || !projectId) return [];
  try {
    const rec = await loadSheets<EvalSheet>(userId, EVAL_ROUTE, projectId);
    const sheet = rec?.sheets.find((s) => s.id === SHEET_ID);
    const list = Array.isArray(sheet?.records) ? sheet!.records : [];
    // bản ghi hỏng bị bỏ TỪNG DÒNG, không giết cả danh sách
    return list.filter(isEvalRecord);
  } catch (err) {
    console.warn('[vitals-eval] không đọc được bản ghi từ IDB — chạy tiếp trong RAM', err);
    return [];
  }
}

/** Gộp bản ghi mới vào danh sách đã lưu (trần MAX_RECORDS_PER_PROJECT) rồi ghi. Trả true nếu ghi được. */
export async function saveEvalRecord(userId: string, projectId: string, record: EvalRecord): Promise<boolean> {
  if (!userId || !projectId) return false;
  try {
    const current = await loadEvalRecords(userId, projectId);
    const next = mergeRecordIntoList(current, record);
    const payload: SheetsRecord<EvalSheet> = {
      v: 1,
      activeId: SHEET_ID,
      sheets: [{ id: SHEET_ID, name: EVAL_ROUTE, records: next }],
      ts: Date.now(),
    };
    return (await saveSheets(userId, EVAL_ROUTE, payload, projectId)) > 0;
  } catch (err) {
    console.warn('[vitals-eval] không ghi được bản ghi xuống IDB — kết quả vẫn hiện trong phiên', err);
    return false;
  }
}

/** Mô hình học — nạp từ localStorage (thiếu/hỏng ⇒ mô hình mới, degrade về heuristic). */
export function loadEvalModel(): PairwisePerceptron {
  if (typeof window === 'undefined') return new PairwisePerceptron();
  return PairwisePerceptron.loadFromLocalStorage(EVAL_MODEL_STORAGE_KEY);
}

export function saveEvalModel(model: PairwisePerceptron): boolean {
  if (typeof window === 'undefined') return false;
  return model.saveToLocalStorage(EVAL_MODEL_STORAGE_KEY);
}
