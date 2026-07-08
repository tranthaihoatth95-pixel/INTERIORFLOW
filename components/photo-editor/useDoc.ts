'use client';

/**
 * components/photo-editor/useDoc.ts — State cục bộ của trình chỉnh ảnh raster.
 *
 * Cùng khuôn với present-editor/useEditor.ts: toàn bộ tài liệu + lớp chọn + undo/redo
 * nằm trong 1 useReducer. KHÔNG dùng lib/store (thuộc quyền agent khác). Model phẳng,
 * serialize được. Hydration-safe: không đọc window/localStorage ở render body.
 */

import { useCallback, useMemo, useReducer } from 'react';
import { type PhotoDoc, type Layer, cloneDoc } from '@/lib/photo-editor/model';

interface State {
  doc: PhotoDoc;
  selectedId: string | null;
  past: PhotoDoc[];
  future: PhotoDoc[];
}

type Action =
  | { type: 'commit'; doc: PhotoDoc }
  | { type: 'live'; doc: PhotoDoc }
  | { type: 'select'; id: string | null }
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 40;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'commit':
      return {
        ...state,
        doc: action.doc,
        past: [...state.past, state.doc].slice(-MAX_HISTORY),
        future: [],
      };
    case 'live':
      return { ...state, doc: action.doc };
    case 'select':
      return { ...state, selectedId: action.id };
    case 'undo': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        doc: prev,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future].slice(0, MAX_HISTORY),
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        ...state,
        doc: next,
        past: [...state.past, state.doc].slice(-MAX_HISTORY),
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

export function useDoc(initial: PhotoDoc) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    doc: initial,
    selectedId: initial.layers.length ? initial.layers[initial.layers.length - 1].id : null,
    past: [],
    future: [],
  }));

  const selected: Layer | null =
    state.doc.layers.find((l) => l.id === state.selectedId) ?? null;

  /** Cập nhật tài liệu qua hàm mutate trên bản clone. `live` = không tạo bước undo. */
  const update = useCallback(
    (mutate: (d: PhotoDoc) => void, live = false) => {
      const next = cloneDoc(state.doc);
      mutate(next);
      dispatch({ type: live ? 'live' : 'commit', doc: next });
    },
    [state.doc],
  );

  /** Cập nhật lớp đang chọn. */
  const updateSelected = useCallback(
    (mutate: (l: Layer) => void, live = false) => {
      if (!state.selectedId) return;
      update((d) => {
        const l = d.layers.find((x) => x.id === state.selectedId);
        if (l) mutate(l);
      }, live);
    },
    [update, state.selectedId],
  );

  const actions = useMemo(
    () => ({
      select: (id: string | null) => dispatch({ type: 'select', id }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
    }),
    [],
  );

  return {
    doc: state.doc,
    selectedId: state.selectedId,
    selected,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    update,
    updateSelected,
    ...actions,
  };
}

export type DocApi = ReturnType<typeof useDoc>;
