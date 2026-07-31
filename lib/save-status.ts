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
 *
 * B4 (31/07, mã `4.1.d`) — `diskStatus`/`diskMessage` thêm cho trạng thái ghi ĐĨA (`.idf`/`.idfp`
 * trong thư mục dự án, `lib/disk-sync.ts`), TÁCH KHỎI `status` ở trên (IndexedDB) — đúng bài học
 * sự cố 31/07: "đã lưu" (cache) và "đã ghi đĩa" là HAI việc, HAI trạng thái, không được gộp.
 * `'off'` = chưa bật lưu trữ dự án (không chọn thư mục gốc) — KHÔNG hiện gì ở StatusBar, đúng
 * thiết kế opt-in. `'error'` KHÔNG tự tắt — phải ở lại đến khi tự phục hồi (ghi lại thành công)
 * hoặc người dùng bấm "Kiểm tra kết nối thư mục" (Settings, đã có từ B3).
 */

import { create } from 'zustand';

export type SaveState = 'idle' | 'saving' | 'saved';
export type DiskSyncState = 'off' | 'synced' | 'syncing' | 'error';

interface SaveStatusState {
  status: SaveState;
  lastSavedAt: number | null;
  diskStatus: DiskSyncState;
  diskMessage: string | null;
  setStatus: (s: SaveState) => void;
  setLastSavedAt: (t: number) => void;
  setDiskStatus: (s: DiskSyncState, message?: string | null) => void;
}

export const useSaveStatus = create<SaveStatusState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  diskStatus: 'off',
  diskMessage: null,
  setStatus: (status) => set({ status }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setDiskStatus: (diskStatus, message) => set({ diskStatus, diskMessage: message ?? null }),
}));
