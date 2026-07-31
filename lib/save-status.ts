/**
 * lib/save-status.ts — trạng thái "đang lưu…/đã lưu" DÙNG CHUNG cho StatusBar (VIỆC A, 28/07).
 *
 * Bám vào autosaver CÓ SẴN (`createSheetsAutosaver`, lib/sheets-persist.ts) qua callback
 * `onSavingChange` — KHÔNG dựng cơ chế theo dõi mới. CAD (`CadSheets.tsx`) và Present
 * (`PresentSheets.tsx`) cùng ghi vào đây; Render (flow graph) chưa có autosave debounce
 * tương đương nên chặng đó StatusBar không hiện mục này (không bịa trạng thái).
 *
 * 2.1.8.n (31/07) — `lastSavedAt` thêm cho chỉ báo "Đã lưu lúc HH:MM" (kiến trúc sư quen AutoCAD
 * không tin autosave nếu không đọc được bằng mắt). Set trong `onSaved` (autosaver báo ghi THẬT
 * sự thành công, `bytes > 0`) — KHÔNG set trong `onSavingChange(false)` vì nhánh đó cũng chạy khi
 * `getRecord()` trả `null` (chưa có gì để lưu), sẽ ghi giờ sai cho 1 lần "lưu" không hề xảy ra.
 */

import { create } from 'zustand';

export type SaveState = 'idle' | 'saving' | 'saved';

interface SaveStatusState {
  status: SaveState;
  lastSavedAt: number | null;
  setStatus: (s: SaveState) => void;
  setLastSavedAt: (t: number) => void;
}

export const useSaveStatus = create<SaveStatusState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  setStatus: (status) => set({ status }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
}));
