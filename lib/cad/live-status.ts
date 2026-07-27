/**
 * lib/cad/live-status.ts — chỉ báo "sống" riêng chặng CAD, DÙNG CHUNG cho StatusBar (VIỆC A, 28/07).
 *
 * Hai mục:
 *  · `cursorWorld` — toạ độ con trỏ (mm). Nguồn thật vẫn là `ix.current.cursorWorld` trong
 *    `CadCanvas.tsx` (vẽ trực tiếp lên `<canvas>`, xem `drawCrosshair`) — KHÔNG thay thế cách vẽ
 *    đó (đủ nhanh, không cần React re-render mỗi pixel di chuột). Store này chỉ nhận bản ĐÃ
 *    THROTTLE (~100ms) để StatusBar (DOM, không phải canvas) hiện lại đúng con số mà không kéo
 *    theo re-render mỗi lần `pointermove`.
 *  · `lastViolationCount` — số vi phạm quy chuẩn của LẦN CHẠY GẦN NHẤT (`checkStandards`,
 *    `StandardsPanel` trong `CadEditor.tsx`). KHÔNG tự chạy nền liên tục (chuẩn `StandardsPanel`
 *    ghi rõ "chỉ đọc & đề xuất", chạy tay) — `null` = CHƯA chạy lần nào phiên này (StatusBar phải
 *    phân biệt "chưa kiểm" với "kiểm rồi, 0 lỗi", không được hiện "0" giả.
 */

import { create } from 'zustand';

interface CadLiveStatusState {
  cursorWorld: { x: number; y: number } | null;
  setCursorWorld: (p: { x: number; y: number } | null) => void;
  lastViolationCount: number | null;
  setLastViolationCount: (n: number | null) => void;
}

export const useCadLiveStatus = create<CadLiveStatusState>((set) => ({
  cursorWorld: null,
  setCursorWorld: (cursorWorld) => set({ cursorWorld }),
  lastViolationCount: null,
  setLastViolationCount: (lastViolationCount) => set({ lastViolationCount }),
}));
