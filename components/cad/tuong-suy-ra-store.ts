/**
 * components/cad/tuong-suy-ra-store.ts — CÔNG TẮC "TƯỜNG NHẬN DIỆN" (IF-301).
 *
 * Cùng khuôn `plan-present-store.ts` — **cách NHÌN, không phải dữ liệu bản vẽ**. Không vào `Doc`,
 * không vào `lib/cad/store.ts`, không vào Undo/Redo: bật/tắt chế độ xem không phải một nấc hoàn tác.
 *
 * ⛔ **VÌ SAO KHÔNG DÙNG `Layer.visible`** (ràng buộc cứng của phiếu, và nó có lý do hình học):
 * tường suy ra **giữ nguyên layer của nét gốc** — trung tính, không nhét tên layer của studio nào
 * vào bản vẽ khách (`tuong-hinh-hoc.ts` `tuongThanhEntities`). Trên tệp đo thật, 25/81 bức nằm ở
 * layer `A-Draw`. Ẩn layer đó để giấu tường suy ra sẽ **ẩn luôn nét DXF gốc của khách** — người
 * dùng bấm một công tắc "xem thử" rồi mất bản vẽ trước mắt. Lọc phải theo NGUỒN GỐC của entity,
 * không theo layer.
 *
 * ⇒ Dấu nguồn gốc dùng cờ CÓ SẴN trong model: `Entity.inferred` (*"true = `elementType` do MÁY
 * SUY, không phải người khai"*, `model.ts` A5·G-M1-09). Tường đọc ngược từ hình học đúng nghĩa đó.
 * Không đẻ field thứ hai cho cùng một khái niệm (luật 6 · K4).
 */

import { create } from 'zustand';
import type { Doc, Entity } from '@/lib/cad/model';

export interface TuongSuyRaState {
  /** `true` = hiện tường máy nhận diện. Mặc định HIỆN — nạp xong mà không thấy gì là báo-chết giả. */
  hien: boolean;
  toggle: () => void;
}

export const useTuongSuyRa = create<TuongSuyRaState>((set) => ({
  hien: true,
  toggle: () => set((s) => ({ hien: !s.hien })),
}));

/** Entity này có phải tường do MÁY đọc ngược từ hình học không (khác tường người vẽ tay). */
export const laTuongSuyRa = (e: Entity): boolean => e.inferred === true && e.elementType === 'wall';

/**
 * Ống kính: trả Doc PHÙ DU để VẼ, **không bao giờ vào store**.
 * Bật ⇒ trả đúng `doc` cũ (cùng tham chiếu — không tốn một lần sao chép nào ở đường nóng).
 */
export function locTuongSuyRa(doc: Doc, hien: boolean): Doc {
  if (hien) return doc;
  const con = doc.entities.filter((e) => !laTuongSuyRa(e));
  if (con.length === doc.entities.length) return doc;
  return { ...doc, entities: con };
}
