'use client';

/**
 * lib/stage-mode.ts — H1 (`docs/TICKET-UI-HATANG-2026-08-02.md`, `docs/SPEC-MODE-PER-STAGE.md`
 * §1): MỘT cơ chế `useStageMode()` dùng chung cho mode mỗi chặng — bật/tắt mode = đổi CẢ shell,
 * không phải thêm nút. API đồng nhất `{ mode, setMode }` cho cả 3 chặng, NHƯNG nguồn dữ liệu
 * bên dưới khác nhau tuỳ chặng để tránh 2-nguồn (luật một nguồn):
 *
 *  - `'cad'`  — PROXY thẳng vào `useCadStore.cadMode` (đã tồn tại từ Sprint 9, giờ thêm giá trị
 *    `'revit'` — xem `lib/cad/store.ts`). KHÔNG tạo state song song — mọi gate hiện có
 *    (`shouldShowProTools`, `PRO_ONLY_TOOLS`…) tự động ăn theo, không cần sửa thêm chỗ nào khác.
 *  - `'render'` — state MỚI (chặng Render trước đây không có khái niệm mode), persist
 *    localStorage cùng khuôn `lib/render-studio/tool-mode-ui.ts` (SSR-safe, đọc sau mount).
 *  - `'present'` — KHÔNG wire trong đợt này (H4 hoãn, tránh giẫm chân code phụ đang sửa
 *    present-editor) — type khai sẵn cho tương lai, gọi `useStageMode('present')` sẽ throw rõ
 *    ràng thay vì âm thầm trả state rác.
 */

import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { useCadStore, type CadMode } from './cad/store';

export type RenderStageMode = 'render' | 'model3d';

const RENDER_MODE_KEY = 'interiorflow.stagemode.render';

function readStoredRenderMode(): RenderStageMode {
  if (typeof window === 'undefined') return 'render';
  try {
    const v = localStorage.getItem(RENDER_MODE_KEY);
    return v === 'model3d' ? 'model3d' : 'render';
  } catch {
    return 'render';
  }
}

interface RenderModeState {
  mode: RenderStageMode;
  setMode: (m: RenderStageMode) => void;
}

const useRenderModeStore = create<RenderModeState>((set) => ({
  mode: 'render', // SSR mặc định — client tự hydrate qua useHydratedRenderMode() bên dưới
  setMode: (mode) => {
    try {
      localStorage.setItem(RENDER_MODE_KEY, mode);
    } catch {
      /* private mode — bỏ qua, chỉ mất persist, không mất tính năng */
    }
    set({ mode });
  },
}));

/** Đọc localStorage SAU mount (né lệch hydration SSR — cùng pattern `tool-mode-ui.ts`). Gọi 1
 * lần ở component gốc mount `<ModeShell stage="render">` (HomeScreen.tsx). */
export function useHydrateRenderMode(): void {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done) return;
    setDone(true);
    useRenderModeStore.setState({ mode: readStoredRenderMode() });
  }, [done]);
}

export function useStageMode(stage: 'cad'): { mode: CadMode; setMode: (m: CadMode) => void };
export function useStageMode(stage: 'render'): { mode: RenderStageMode; setMode: (m: RenderStageMode) => void };
export function useStageMode(stage: 'cad' | 'render') {
  // Rules of Hooks — cả 2 store PHẢI gọi vô điều kiện dù chỉ dùng 1 nhánh; cả 2 đều rẻ (2 field).
  const cadMode = useCadStore((s) => s.cadMode);
  const setCadMode = useCadStore((s) => s.setCadMode);
  const renderMode = useRenderModeStore((s) => s.mode);
  const setRenderMode = useRenderModeStore((s) => s.setMode);
  if (stage === 'cad') return { mode: cadMode, setMode: setCadMode };
  return { mode: renderMode, setMode: setRenderMode };
}
