'use client';

/**
 * lib/render-studio/tree3d-ui.ts — MỘT THƯ VIỆN (VIỆC `PHIEU-CODE-IF-DOT6`, 05/08): cây đối tượng
 * (Navigator, ổ ②) và panel thuộc tính (Inspector, ổ ④) là hai ổ SIBLING trong `AppShell` — không
 * chung cây React cha gần (khác hẳn khi cả hai còn nằm chung trong `Command3DPanel`), nên trạng
 * thái "đang ẩn"/"đang chọn để xem" phải sống ở store chia sẻ, không phải `useState` cục bộ.
 *
 * Đây CHỈ là state TƯƠNG TÁC XEM (ẩn/hiện, chọn để xem thuộc tính) — hình học/storey/specId vẫn
 * đọc từ `useCadStore` qua `docToObjScene()` (luật một nguồn, K1 `SO-KIEM-TONG.md` §6d).
 */
import { create } from 'zustand';

interface Tree3DUiState {
  hiddenNames: Set<string>;
  selectedName: string | null;
  toggleHidden: (name: string) => void;
  select: (name: string | null) => void;
}

export const useTree3DUi = create<Tree3DUiState>((set) => ({
  hiddenNames: new Set(),
  selectedName: null,
  toggleHidden: (name) =>
    set((s) => {
      const next = new Set(s.hiddenNames);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { hiddenNames: next };
    }),
  select: (name) => set((s) => ({ selectedName: s.selectedName === name ? null : name })),
}));
