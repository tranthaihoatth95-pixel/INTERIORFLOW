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
  /**
   * 21/08 — `entityId` của khối đang chọn, khi biết (tường có entityId; group khác chưa có).
   * VÌ SAO cần: `selectedName` là tên GROUP hiển thị, các lệnh chung (`lib/commands/registry.ts`)
   * không có `scene` trong tay để tra ngược tên→entity. Đây vẫn là state CHỌN (đúng vai của
   * store này), KHÔNG phải kho sự thật thứ hai — hình học vẫn ở `useCadStore`.
   */
  selectedEntityId: string | null;
  toggleHidden: (name: string) => void;
  select: (name: string | null) => void;
  /** Chọn TRỰC TIẾP (không toggle) — cho đường bấm-vào-khối trên khung nhìn 3D (21/08): bấm lại cùng
   *  khối phải GIỮ chọn, khác hành vi bấm-lại-bỏ-chọn của hàng cây Navigator. */
  pick: (name: string | null, entityId?: string | null) => void;
}

export const useTree3DUi = create<Tree3DUiState>((set) => ({
  hiddenNames: new Set(),
  selectedName: null,
  selectedEntityId: null,
  toggleHidden: (name) =>
    set((s) => {
      const next = new Set(s.hiddenNames);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { hiddenNames: next };
    }),
  // Chọn từ CÂY: giữ NGUYÊN ngữ nghĩa toggle theo TÊN như trước, chỉ thêm việc xoá cờ entityId —
  // cây không biết entityId, để sót entityId của lượt chọn trước thì lệnh xoá sẽ nhắm nhầm khối cũ
  // (đúng loại lỗi §9 cấm).
  select: (name) =>
    set((s) =>
      s.selectedName === name
        ? { selectedName: null, selectedEntityId: null }
        : { selectedName: name, selectedEntityId: null },
    ),
  pick: (name, entityId = null) => set({ selectedName: name, selectedEntityId: name ? entityId : null }),
}));
