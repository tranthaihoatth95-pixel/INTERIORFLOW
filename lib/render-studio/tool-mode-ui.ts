/**
 * lib/render-studio/tool-mode-ui.ts — trạng thái 3 tầng cách nhìn chặng Render (VIỆC B, 28/07,
 * docs/SPEC-RENDER-STUDIO.md §1B).
 *
 *   'home'   — lưới 6 thẻ việc (MẶC ĐỊNH lần đầu vào chặng).
 *   'form'   — giao diện 2 cột (ẢNH GỐC + KẾT QUẢ) cho 1 thẻ đã chọn.
 *   'canvas' — node graph CŨ, nguyên vẹn (vào bằng nút "Mở canvas", hoặc bấm đúp 1 node = subgraph,
 *              xử lý tại chỗ trong React Flow có sẵn — không cần state riêng ở đây).
 *
 * "NHỚ lựa chọn của người dùng" (B1) — persist `view`/`selectedCardId` vào localStorage, đọc lại
 * lần sau. Đi xuống (home→form→canvas) tự nguyện; đi lên luôn có nút quay về (component tự vẽ nút,
 * store chỉ giữ state + hàm chuyển).
 */

import { create } from 'zustand';
import { useEffect, useState } from 'react';

export type ToolModeView = 'home' | 'form' | 'canvas';

const VIEW_KEY = 'interiorflow.render.toolmode.view';
const CARD_KEY = 'interiorflow.render.toolmode.selectedCard';

function readStoredView(): ToolModeView {
  if (typeof window === 'undefined') return 'home';
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === 'home' || v === 'form' || v === 'canvas') return v;
  } catch {}
  return 'home';
}

function readStoredCard(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CARD_KEY);
  } catch {
    return null;
  }
}

function persist(view: ToolModeView, cardId: string | null) {
  try {
    localStorage.setItem(VIEW_KEY, view);
    if (cardId) localStorage.setItem(CARD_KEY, cardId);
    else localStorage.removeItem(CARD_KEY);
  } catch {}
}

interface ToolModeUiState {
  view: ToolModeView;
  selectedCardId: string | null;
  /** true sau khi đọc xong localStorage phía client — chặn hydration mismatch (SSR luôn 'home'). */
  hydrated: boolean;
  hydrate: () => void;
  selectCard: (id: string) => void;
  openCanvas: () => void;
  backToHome: () => void;
  backToForm: () => void;
}

export const useToolModeUi = create<ToolModeUiState>((set) => ({
  view: 'home',
  selectedCardId: null,
  hydrated: false,
  hydrate: () =>
    set((s) => {
      if (s.hydrated) return s;
      const view = readStoredView();
      const selectedCardId = view === 'form' ? readStoredCard() : null;
      // thiếu selectedCardId mà view lại 'form' (dữ liệu hỏng/xoá tay) → rơi về 'home' an toàn.
      const safeView = view === 'form' && !selectedCardId ? 'home' : view;
      return { view: safeView, selectedCardId, hydrated: true };
    }),
  selectCard: (id) => {
    persist('form', id);
    set({ view: 'form', selectedCardId: id });
  },
  openCanvas: () => {
    persist('canvas', null);
    set({ view: 'canvas' });
  },
  backToHome: () => {
    persist('home', null);
    set({ view: 'home', selectedCardId: null });
  },
  backToForm: () =>
    set((s) => {
      if (!s.selectedCardId) return s;
      persist('form', s.selectedCardId);
      return { view: 'form' };
    }),
}));

/** Màn ≤7 inch — ÉP Tool Mode, ẩn hẳn lối vào canvas (§1B "Ngưỡng thiết bị"). Không có API đọc
 * kích thước MÀN HÌNH VẬT LÝ thật từ trình duyệt (giới hạn nền tảng chung, không riêng cách làm
 * này) — dùng ngưỡng bề rộng CSS px làm xấp xỉ, cùng khuôn `useIsCoverScreen` (HomeScreen.tsx). */
const SMALL_SCREEN_MAX_WIDTH = 700;

export function useIsSmallScreenForCanvas(): boolean {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const check = () => setSmall(window.innerWidth < SMALL_SCREEN_MAX_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return small;
}
