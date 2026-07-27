/**
 * lib/save-status.ts — trạng thái "đang lưu…/đã lưu" DÙNG CHUNG cho StatusBar (VIỆC A, 28/07).
 *
 * Bám vào autosaver CÓ SẴN (`createSheetsAutosaver`, lib/sheets-persist.ts) qua callback
 * `onSavingChange` — KHÔNG dựng cơ chế theo dõi mới. CAD (`CadSheets.tsx`) và Present
 * (`PresentSheets.tsx`) cùng ghi vào đây; Render (flow graph) chưa có autosave debounce
 * tương đương nên chặng đó StatusBar không hiện mục này (không bịa trạng thái).
 */

import { create } from 'zustand';

export type SaveState = 'idle' | 'saving' | 'saved';

interface SaveStatusState {
  status: SaveState;
  setStatus: (s: SaveState) => void;
}

export const useSaveStatus = create<SaveStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));
