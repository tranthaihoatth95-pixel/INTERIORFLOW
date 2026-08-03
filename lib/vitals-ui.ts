/**
 * lib/vitals-ui.ts — trạng thái mở/đóng Vitals DÙNG CHUNG (VIỆC A, 28/07).
 *
 * Trước đây `panelOpen` là `useState` riêng trong `StageSwitcher.tsx` — chỉ cử chỉ kéo +
 * phím tắt ⌘J trong CHÍNH component đó gọi được. Nay `StatusBar.tsx` (ô gõ nhanh ở đáy) cũng
 * mở ĐÚNG panel đó → nâng lên store dùng chung, KHÔNG viết luồng mở thứ hai.
 *
 * 05/08 (Hoà chốt sau khi thấy "HAI Vitals cùng lúc trên màn") — **BỎ hẳn khái niệm `anchor`.**
 * Trước đó `anchor` chọn 1 trong 2 NƠI MOUNT panel ('gesture' = StageSwitcher đỉnh màn ·
 * 'statusbar' = StatusBar đáy màn). Hai nơi mount = hai nguồn cho MỘT panel: gate `anchor` giữ
 * cho chỉ một cái MỞ (đo trên browser xác nhận đúng vậy), nhưng cả hai vẫn tồn tại trong cây và
 * người dùng thấy HAI lối vào Vitals trên cùng màn hình — đúng thứ Hoà báo.
 * Nay panel mount ĐÚNG MỘT nơi: `StageSwitcher.tsx` (ổ ① header, đúng `SPEC-HA-TANG-UI-IF`
 * Trụ 1 + mock Claude Design "viên thuốc trên header").
 *
 * `StatusBar.tsx` GIỮ ô gõ nhanh kiểu Siri (hover nở → gõ → Enter) — cơ chế riêng có giá trị
 * thật (gõ thẳng, không phải mở panel rồi mới gõ), nó chỉ KHÔNG mount panel nữa mà gọi `open()`
 * để panel duy nhất ở header nhận câu hỏi. Xem `SO-KIEM-TONG.md` §1 luật "cấm mount cùng một
 * panel ở 2 ổ khác nhau".
 */

import { create } from 'zustand';

interface VitalsUiState {
  panelOpen: boolean;
  /** Gõ sẵn ở ô gọn StatusBar rồi bấm/Enter → panel (header) mở kèm câu hỏi này. */
  initialInput: string;
  /** true = gửi luôn câu hỏi trên ngay khi panel mở (không cần gõ lại/bấm Gửi lần 2). */
  autoSend: boolean;
  open: (initialInput?: string, autoSend?: boolean) => void;
  close: () => void;
  toggle: () => void;
  /** Panel đã tiêu thụ initialInput/autoSend — tránh gửi lại nếu re-render. */
  consumeInitial: () => void;
}

export const useVitalsUi = create<VitalsUiState>((set, get) => ({
  panelOpen: false,
  initialInput: '',
  autoSend: false,
  open: (initialInput = '', autoSend = false) => set({ panelOpen: true, initialInput, autoSend }),
  close: () => set({ panelOpen: false }),
  toggle: () => {
    if (get().panelOpen) set({ panelOpen: false });
    else set({ panelOpen: true, initialInput: '', autoSend: false });
  },
  consumeInitial: () => set({ initialInput: '', autoSend: false }),
}));
