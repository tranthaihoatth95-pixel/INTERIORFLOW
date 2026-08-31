/**
 * components/cad/giay-muc-store.ts — CÔNG TẮC "KHẢO SÁT" của ngôn ngữ GIẤY MỰC.
 *
 * Đặc tả: `docs/control/IF-GIAY-MUC.md` luật 4 — hai chế độ nhìn một bản vẽ nhập:
 *   · **TRÌNH BÀY** *(mặc định)* — map toàn bộ về thang mực đơn sắc, màu ACI biến mất;
 *   · **KHẢO SÁT** *(toggle)* — wireframe 1px **màu layer gốc**, tắt fill.
 *
 * ⚠️ **VÌ SAO KHẢO SÁT LÀ VAN AN TOÀN BẮT BUỘC, không phải một nút cho vui:** bảng map
 * `layer → bậc mực` là HEURISTIC (`lib/cad/render.ts` `bacMucCua`). Heuristic thì có lúc sai. Khi
 * nó sai, chế độ TRÌNH BÀY vẫn cho ra một bản vẽ TRÔNG RẤT ỔN — đơn sắc, sạch, có thứ bậc — và
 * người dùng **không còn cách nào biết** máy đã bóp méo nét của mình. Đó đúng là "PASS giả" ở
 * dạng thị giác. KHẢO SÁT là đường về với dữ liệu thật, nên nó phải luôn ở cạnh tay người dùng.
 *
 * Cùng khuôn `tuong-suy-ra-store.ts` / `plan-present-store.ts` — **cách NHÌN, không phải dữ liệu
 * bản vẽ**: không vào `Doc`, không vào `lib/cad/store.ts`, không vào Undo/Redo. Bật/tắt một chế độ
 * xem không phải một nấc hoàn tác.
 */

import { create } from 'zustand';

export interface GiayMucState {
  /** `true` = đang ở chế độ KHẢO SÁT. Mặc định TẮT — luật 4: TRÌNH BÀY là mặc định. */
  khaoSat: boolean;
  toggle: () => void;
}

export const useGiayMuc = create<GiayMucState>((set) => ({
  khaoSat: false,
  toggle: () => set((s) => ({ khaoSat: !s.khaoSat })),
}));
