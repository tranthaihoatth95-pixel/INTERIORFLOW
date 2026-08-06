/**
 * components/cad/plan-present-store.ts — TRẠNG THÁI ỐNG KÍNH TRÌNH BÀY (VIỆC 1, phiên S4).
 *
 * ⛔ **VÌ SAO KHÔNG NẰM TRONG `Doc` VÀ KHÔNG NẰM TRONG `lib/cad/store.ts`:**
 *  · Đây là **cách NHÌN**, không phải **dữ liệu bản vẽ**. Nhét vào `Doc` là vi phạm K4 (field mới
 *    chỉ thêm khi có nơi tiêu thụ — PDF/DXF/`.idf` đều không cần biết người dùng đang bật ống
 *    kính nào) và làm bẩn `.idf` bằng trạng thái giao diện.
 *  · Nằm riêng nên **không đụng `lib/cad/store.ts`** — file đó ngoài vùng phiên này.
 *  · Không snapshot vào Undo/Redo: bật/tắt chế độ xem KHÔNG phải một nấc hoàn tác (cùng lý do
 *    `setPrintSettings` cố ý không snapshot — `lib/cad/store.ts:357` docstring).
 *
 * Store bé, chỉ giữ cờ hiển thị. Bảng màu **KHÔNG** để ở đây: nó là tham số của API
 * (`lib/cad/plan-present.ts` `PresentOptions.palette`) để studio truyền đè, đúng luật trung tính.
 */

import { create } from 'zustand';
import type { PresentOptions } from '@/lib/cad/plan-present';

export interface PlanPresentState {
  /** công tắc chính — false = mặt bằng kỹ thuật như cũ, KHÔNG đổi gì. */
  on: boolean;
  /** `'flat'` = công thức B1 · `'islands'` = biến thể B2 · `'none'` = không nền. */
  ground: NonNullable<PresentOptions['ground']>;
  showRugs: boolean;
  showPlants: boolean;
  showPeople: boolean;
  toggle: () => void;
  set: (patch: Partial<Omit<PlanPresentState, 'toggle' | 'set'>>) => void;
}

export const usePlanPresent = create<PlanPresentState>((set) => ({
  on: false,
  ground: 'flat',
  showRugs: true,
  showPlants: true,
  showPeople: true,
  toggle: () => set((s) => ({ on: !s.on })),
  set: (patch) => set(patch),
}));

/** Cắt state → `PresentOptions` cho `presentProjectionMemo()`. Thuần, không React. */
export function presentOptionsFrom(s: PlanPresentState): PresentOptions {
  return {
    ground: s.ground,
    showRugs: s.showRugs,
    showPlants: s.showPlants,
    showPeople: s.showPeople,
  };
}
