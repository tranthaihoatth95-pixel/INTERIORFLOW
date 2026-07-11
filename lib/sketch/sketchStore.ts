'use client';

import { create } from 'zustand';

/**
 * Store RIÊNG cho Sketch Studio — tách khỏi lib/store.ts (store dùng chung) để giữ seam
 * an toàn, không có nguy cơ xung đột merge với các phiên khác đang sửa store chính.
 * Chỉ giữ node nào đang mở modal; nội dung vẽ (data URL) được ghi thẳng vào param của
 * node qua `useFlowStore.getState().updateParam(nodeId, 'sketch', dataUrl)` khi bấm Lưu
 * — action đó đã tồn tại sẵn trong store chính, KHÔNG cần thêm field/action mới ở đó.
 */
interface SketchStoreState {
  /** id node util.sketchpad đang mở Sketch Studio; null = đóng */
  openNodeId: string | null;
  open: (nodeId: string) => void;
  close: () => void;
}

export const useSketchStore = create<SketchStoreState>((set) => ({
  openNodeId: null,
  open: (nodeId) => set({ openNodeId: nodeId }),
  close: () => set({ openNodeId: null }),
}));
