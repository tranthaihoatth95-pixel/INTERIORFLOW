'use client';

/**
 * components/present-editor/useEditor.ts — State cục bộ của trình dàn trang.
 *
 * KHÔNG dùng lib/store.ts (thuộc quyền agent khác). Toàn bộ state deck + selection +
 * undo/redo nằm trong hook này (useReducer). Model phẳng serialize được.
 *
 * Selection ĐA PHẦN TỬ (như Canva): giữ mảng `selectedIds`. `selectedId` (số ít) =
 * phần tử "chính" (cuối mảng) để inspector 1-phần-tử + code cũ vẫn chạy. Shift-click
 * thêm/bớt, rê chọn (marquee) đặt cả mảng, kéo nhóm dời tất cả.
 *
 * Hydration-safe: KHÔNG đọc window/localStorage trong render body.
 */

import { useCallback, useMemo, useReducer } from 'react';
import {
  type EditorDeck,
  type EditorSlide,
  type SlideElement,
  cloneDeck,
} from '@/lib/present-editor/model';

interface State {
  deck: EditorDeck;
  currentSlide: number;
  /** danh sách id đang chọn (thứ tự chọn; cuối = phần tử chính). */
  selectedIds: string[];
  past: EditorDeck[];
  future: EditorDeck[];
}

type Action =
  | { type: 'commit'; deck: EditorDeck } // ghi có undo
  | { type: 'live'; deck: EditorDeck } // ghi KHÔNG snapshot (khi đang kéo)
  | { type: 'selectSlide'; index: number }
  | { type: 'select'; id: string | null } // đặt lại selection = 1 (hoặc rỗng)
  | { type: 'selectMany'; ids: string[] } // đặt lại cả mảng (marquee)
  | { type: 'toggleSelect'; id: string } // shift-click: thêm/bớt
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 60;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'commit':
      return {
        ...state,
        deck: action.deck,
        past: [...state.past, state.deck].slice(-MAX_HISTORY),
        future: [],
      };
    case 'live':
      return { ...state, deck: action.deck };
    case 'selectSlide':
      return {
        ...state,
        currentSlide: Math.max(0, Math.min(action.index, state.deck.slides.length - 1)),
        selectedIds: [],
      };
    case 'select':
      return { ...state, selectedIds: action.id ? [action.id] : [] };
    case 'selectMany':
      return { ...state, selectedIds: [...action.ids] };
    case 'toggleSelect': {
      const has = state.selectedIds.includes(action.id);
      return {
        ...state,
        selectedIds: has
          ? state.selectedIds.filter((x) => x !== action.id)
          : [...state.selectedIds, action.id],
      };
    }
    case 'undo': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        deck: prev,
        past: state.past.slice(0, -1),
        future: [state.deck, ...state.future].slice(0, MAX_HISTORY),
        currentSlide: Math.min(state.currentSlide, prev.slides.length - 1),
        selectedIds: [],
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        ...state,
        deck: next,
        past: [...state.past, state.deck].slice(-MAX_HISTORY),
        future: state.future.slice(1),
        currentSlide: Math.min(state.currentSlide, next.slides.length - 1),
        selectedIds: [],
      };
    }
    default:
      return state;
  }
}

export function useEditor(initial: EditorDeck) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: initial,
    currentSlide: 0,
    selectedIds: [],
    past: [],
    future: [],
  }));

  const slide = state.deck.slides[state.currentSlide];
  // phần tử "chính" = id cuối mảng (phần tử vừa chọn/click gần nhất).
  const selectedId = state.selectedIds.length
    ? state.selectedIds[state.selectedIds.length - 1]
    : null;
  const selected: SlideElement | null =
    (slide?.elements.find((e) => e.id === selectedId) as SlideElement | undefined) ?? null;

  /** Cập nhật deck bằng một hàm mutate trên bản clone. `live` = không tạo bước undo. */
  const update = useCallback(
    (mutate: (d: EditorDeck) => void, live = false) => {
      const next = cloneDeck(state.deck);
      mutate(next);
      dispatch({ type: live ? 'live' : 'commit', deck: next });
    },
    [state.deck],
  );

  /** Cập nhật slide hiện tại. */
  const updateSlide = useCallback(
    (mutate: (s: EditorSlide) => void, live = false) => {
      update((d) => {
        const s = d.slides[state.currentSlide];
        if (s) mutate(s);
      }, live);
    },
    [update, state.currentSlide],
  );

  /** Cập nhật element đang chọn (phần tử chính). */
  const updateSelected = useCallback(
    (mutate: (el: SlideElement) => void, live = false) => {
      if (!selectedId) return;
      updateSlide((s) => {
        const el = s.elements.find((e) => e.id === selectedId);
        if (el) mutate(el);
      }, live);
    },
    [updateSlide, selectedId],
  );

  /**
   * Cập nhật 1 element BẤT KỲ của slide hiện tại theo id — KHÔNG cần đang chọn (khác
   * `updateSelected`). Dùng cho Animation Pane theo object (MotionPanel liệt kê mọi phần tử,
   * chỉnh reveal/order/delay của từng dòng dù element đó không phải đang được chọn trên canvas).
   */
  const updateElementById = useCallback(
    (id: string, mutate: (el: SlideElement) => void, live = false) => {
      updateSlide((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el) mutate(el);
      }, live);
    },
    [updateSlide],
  );

  const actions = useMemo(
    () => ({
      selectSlide: (index: number) => dispatch({ type: 'selectSlide', index }),
      select: (id: string | null) => dispatch({ type: 'select', id }),
      selectMany: (ids: string[]) => dispatch({ type: 'selectMany', ids }),
      toggleSelect: (id: string) => dispatch({ type: 'toggleSelect', id }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
    }),
    [],
  );

  return {
    deck: state.deck,
    currentSlide: state.currentSlide,
    slide,
    selectedId,
    selectedIds: state.selectedIds,
    selected,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    update,
    updateSlide,
    updateSelected,
    updateElementById,
    ...actions,
  };
}

export type EditorApi = ReturnType<typeof useEditor>;
