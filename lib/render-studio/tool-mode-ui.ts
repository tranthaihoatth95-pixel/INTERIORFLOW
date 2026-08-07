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
import { BP } from '@/lib/breakpoints';
import type { ToolModeNodeRefs } from './tool-mode-graph';

export type ToolModeView = 'home' | 'form' | 'canvas';

const VIEW_KEY = 'interiorflow.render.toolmode.view';
const CARD_KEY = 'interiorflow.render.toolmode.selectedCard';

function readStoredView(): ToolModeView {
  if (typeof window === 'undefined') return 'home';
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === 'home' || v === 'form' || v === 'canvas') return v;
  } catch {/* localStorage bị chặn (chế độ riêng tư) — dùng mặc định, không chặn việc */}
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
  } catch {/* localStorage bị chặn (chế độ riêng tư) — dùng mặc định, không chặn việc */}
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
  // LỖ RÒ 1 (2.2.77, 29/07, docs/CHOT-SO-MA-2026-07-29.md §D) — ảnh đã thả + node graph của
  // ToolModeForm ĐẶT Ở ĐÂY (store sống ngoài React tree), KHÔNG phải `useState`/`useRef` cục bộ
  // trong component. Lý do bắt buộc: `RenderToolModeOverlay` unmount hẳn `ToolModeForm` mỗi lần
  // `view` rời khỏi `'form'` (về `'home'` để chọn thẻ khác, ví dụ) — state cục bộ (kể cả `useRef`)
  // KHÔNG sống sót qua unmount. Chỉ có state ở NGOÀI component (store này) mới giữ được ảnh khi
  // user quay lại Tool Mode Home rồi chọn thẻ khác.
  sessionImageDataUrl: string | null;
  setSessionImageDataUrl: (v: string | null) => void;
  sessionNodeRefs: ToolModeNodeRefs | null;
  setSessionNodeRefs: (r: ToolModeNodeRefs | null) => void;
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
  sessionImageDataUrl: null,
  setSessionImageDataUrl: (v) => set({ sessionImageDataUrl: v }),
  sessionNodeRefs: null,
  setSessionNodeRefs: (r) => set({ sessionNodeRefs: r }),
}));

/** Màn ≤7 inch — ÉP Tool Mode, ẩn hẳn lối vào canvas (§1B "Ngưỡng thiết bị"). Không có API đọc
 * kích thước MÀN HÌNH VẬT LÝ thật từ trình duyệt (giới hạn nền tảng chung, không riêng cách làm
 * này) — dùng ngưỡng bề rộng CSS px làm xấp xỉ, cùng khuôn `useIsCoverScreen` (HomeScreen.tsx).
 * 7.1.20 (30/07) — trước là số lẻ tự viết (700, không khớp mốc Tailwind nào) → kéo về đúng
 * `BP.md` (768, lib/breakpoints.ts) — "≤7 inch" nằm gọn trong dải tablet 8-11" trở xuống. */
const SMALL_SCREEN_MAX_WIDTH = BP.md;

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
