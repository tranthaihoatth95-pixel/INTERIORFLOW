'use client';

import { create } from 'zustand';

/**
 * Store RIÊNG cho Smart Select (giống lib/sketch/sketchStore.ts) — không đụng
 * lib/store.ts dùng chung, tránh xung đột merge với các phiên khác.
 * Kết quả mask được ghi thẳng vào param của node bằng
 * `useFlowStore.getState().updateParam(nodeId, 'mask', dataUrl)`.
 */
interface SmartSelectState {
  /** id node ai.smartselect đang mở modal; null = đóng */
  openNodeId: string | null;
  open: (nodeId: string) => void;
  close: () => void;
}

export const useSmartSelectStore = create<SmartSelectState>((set) => ({
  openNodeId: null,
  open: (nodeId) => set({ openNodeId: nodeId }),
  close: () => set({ openNodeId: null }),
}));
