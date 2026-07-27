/**
 * lib/vitals-ui.ts — trạng thái mở/đóng Vitals DÙNG CHUNG (VIỆC A, 28/07).
 *
 * Trước đây `panelOpen` là `useState` riêng trong `StageSwitcher.tsx` — chỉ cử chỉ kéo +
 * phím tắt ⌘J trong CHÍNH component đó gọi được. Nay `StatusBar.tsx` (điểm gọi chính thức
 * mới, giữa status bar) cũng mở/đóng ĐÚNG panel đó → nâng lên store dùng chung, KHÔNG viết
 * luồng mở thứ hai.
 *
 * `anchor` quyết định NƠI panel `VitalsGesturePanel` mọc ra (2 nơi mount khác nhau, animation
 * khác hướng, KHÔNG mount cả hai cùng lúc — tránh 2 popover chồng nhau):
 *   - 'gesture'   → `StageSwitcher.tsx` (đỉnh màn, xổ XUỐNG) — cử chỉ kéo tay/chạm, GIỮ NGUYÊN.
 *   - 'statusbar' → `StatusBar.tsx` (đáy màn, xổ LÊN, kiểu Siri/Spotlight) — hover/bấm ở vùng
 *     Vitals của status bar, hoặc ⌘J/Ctrl+J (điểm gọi chính thức mới → mặc định neo status bar).
 */

import { create } from 'zustand';

export type VitalsAnchor = 'gesture' | 'statusbar';

interface VitalsUiState {
  panelOpen: boolean;
  anchor: VitalsAnchor;
  /** Gõ sẵn trong ô gọn ở StatusBar rồi bấm/Enter → panel đầy đủ mở kèm câu hỏi này. */
  initialInput: string;
  /** true = gửi luôn câu hỏi trên ngay khi panel mở (không cần gõ lại/bấm Gửi lần 2). */
  autoSend: boolean;
  open: (anchor: VitalsAnchor, initialInput?: string, autoSend?: boolean) => void;
  close: () => void;
  /** Đóng nếu đang mở CÙNG anchor; mở (đổi sang anchor này) nếu đang đóng hoặc mở ở anchor khác. */
  toggle: (anchor: VitalsAnchor) => void;
  /** Panel đã tiêu thụ initialInput/autoSend — tránh gửi lại nếu re-render. */
  consumeInitial: () => void;
}

export const useVitalsUi = create<VitalsUiState>((set, get) => ({
  panelOpen: false,
  anchor: 'statusbar',
  initialInput: '',
  autoSend: false,
  open: (anchor, initialInput = '', autoSend = false) => set({ panelOpen: true, anchor, initialInput, autoSend }),
  close: () => set({ panelOpen: false }),
  toggle: (anchor) => {
    const s = get();
    if (s.panelOpen && s.anchor === anchor) set({ panelOpen: false });
    else set({ panelOpen: true, anchor, initialInput: '', autoSend: false });
  },
  consumeInitial: () => set({ initialInput: '', autoSend: false }),
}));
