'use client';

/**
 * lib/nodes/cua-so-cong-cu-ui.ts — trạng thái **cửa sổ công cụ** (nấc + vị trí), tách khỏi phần
 * tính thuần ở `cua-so-cong-cu.ts` để phần kia test được bằng `sucrase-node`.
 *
 * ⭐ VÌ SAO STATE Ở ĐÂY MÀ KHÔNG NHÉT VÀO `InteriorNodeData`: nấc mở/thu và vị trí cửa sổ là
 * **cách nhìn**, không phải nội dung tài liệu. Nhét vào node data thì nó theo `.idf` đi vào bản
 * lưu, bản chia sẻ, bản xuất — mở lại trên máy khác là cửa sổ bung ra chỗ lạ. Đây cũng là lý do
 * KHÔNG phải đổi schema ⇒ không chạm biên (luật ③ của phiếu).
 *
 * ⭐ VÌ SAO LÀ MỘT BẢNG THEO KHOÁ, không phải một biến đơn: đúng câu Hoà chốt 15/08 *"cho phép
 * mở NHIỀU cửa sổ để nối với nhau"*. `useToolModeUi` (bản cũ) chỉ giữ ĐÚNG MỘT `selectedCardId`
 * — đó chính là chỗ khoá cứng "1 window/lượt" mà docstring `ToolWindow.tsx` tự thú. Bảng theo
 * khoá gỡ trần đó ở cấp dữ liệu, không phải bằng mẹo hiển thị.
 *
 * Khoá do `khoaCuaSoNode()` / `khoaCuaSoThe()` sinh — hai không gian tên tách bạch, cửa sổ neo
 * vào node không đụng cửa sổ nổi mở từ thẻ việc.
 */

import { create } from 'zustand';
import { ghimTrongVung, type CapCuaSo, type ViTriCuaSo } from './cua-so-cong-cu';

interface TrangThaiCuaSo {
  cap: CapCuaSo;
  viTri?: ViTriCuaSo;
  /** Cỡ người dùng đã kéo (nấc `vua`, cửa sổ nổi). Trên canvas thì `NodeResizer` lo. */
  co?: { w: number; h: number };
}

interface CuaSoCongCuUiState {
  bang: Record<string, TrangThaiCuaSo>;
  /** Thứ tự chồng — cửa sổ vừa chạm vào đứng trên cùng (nhiều cửa sổ thì phải có trên/dưới). */
  thuTu: string[];
  datCap: (khoa: string, cap: CapCuaSo) => void;
  datViTri: (khoa: string, viTri: ViTriCuaSo, cua: { w: number; h: number }, vung: { w: number; h: number }) => void;
  datCo: (khoa: string, co: { w: number; h: number }) => void;
  dayLenTren: (khoa: string) => void;
  dong: (khoa: string) => void;
  /** Danh sách khoá đang mở (nấc khác `thu`) — dùng để chứng minh "nhiều cửa sổ cùng lúc". */
  dangMo: () => string[];
}

export const useCuaSoCongCuUi = create<CuaSoCongCuUiState>((set, get) => ({
  bang: {},
  thuTu: [],

  datCap: (khoa, cap) =>
    set((s) => ({
      bang: { ...s.bang, [khoa]: { ...(s.bang[khoa] ?? { cap: 'thu' }), cap } },
      // Mở ra thì tự lên trên cùng — không bắt người dùng bấm hai lần để thấy thứ mình vừa mở.
      thuTu: cap === 'thu' ? s.thuTu.filter((k) => k !== khoa) : [...s.thuTu.filter((k) => k !== khoa), khoa],
    })),

  datViTri: (khoa, viTri, cua, vung) =>
    set((s) => ({
      bang: {
        ...s.bang,
        [khoa]: { ...(s.bang[khoa] ?? { cap: 'vua' }), viTri: ghimTrongVung(viTri, cua, vung) },
      },
    })),

  datCo: (khoa, co) =>
    set((s) => ({ bang: { ...s.bang, [khoa]: { ...(s.bang[khoa] ?? { cap: 'vua' }), co } } })),

  dayLenTren: (khoa) =>
    set((s) => (s.thuTu[s.thuTu.length - 1] === khoa ? s : { thuTu: [...s.thuTu.filter((k) => k !== khoa), khoa] })),

  dong: (khoa) =>
    set((s) => {
      const bang = { ...s.bang };
      delete bang[khoa];
      return { bang, thuTu: s.thuTu.filter((k) => k !== khoa) };
    }),

  dangMo: () =>
    Object.entries(get().bang)
      .filter(([, v]) => v.cap !== 'thu')
      .map(([k]) => k),
}));

/** Đọc nấc của một cửa sổ; chưa có mục nào thì mặc định `thu` (gọn và tươm tất ở lớp mặc định). */
export function useCapCuaSo(khoa: string): CapCuaSo {
  return useCuaSoCongCuUi((s) => s.bang[khoa]?.cap ?? 'thu');
}
