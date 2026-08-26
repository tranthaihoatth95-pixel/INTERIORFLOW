'use client';

/**
 * lib/render-studio/controlled-edit-ui.ts — "cách nhìn" của Controlled Edit: node nào đang mở
 * bảng Cân trắng. Tách khỏi lineage thuần (`controlled-edit.ts`) đúng lý do đã trả giá ở
 * `cua-so-cong-cu-ui.ts` — trạng thái MỞ/ĐÓNG không phải nội dung tài liệu, không vào `.idf`.
 *
 * Vì sao KHÔNG dùng state cục bộ trong nút bấm: nút bấm sống ở PANEL VỆ TINH
 * (`CuaSoCongCu.tsx`), còn nơi vẽ ảnh + before/after + accept/reject sống ở `ThanCuaSoNode.tsx`
 * — hai component là ANH EM (cùng con của `CuaSoCongCu`), không có React state cha-con để chia
 * sẻ trực tiếp mà không xuyên qua nhiều lớp prop. Một kho theo `nodeId` giải đúng bài này, cùng
 * khuôn `useCuaSoCongCuUi`.
 */

import { create } from 'zustand';

interface ControlledEditUiState {
  /** nodeId đang mở bảng Controlled Edit, hoặc null = không có gì mở. Một cửa sổ ảnh = một bảng. */
  openNodeId: string | null;
  toggle: (nodeId: string) => void;
  close: () => void;
}

export const useControlledEditUi = create<ControlledEditUiState>((set) => ({
  openNodeId: null,
  toggle: (nodeId) => set((s) => ({ openNodeId: s.openNodeId === nodeId ? null : nodeId })),
  close: () => set({ openNodeId: null }),
}));
