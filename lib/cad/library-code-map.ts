/**
 * lib/cad/library-code-map.ts — BẢNG GHIM mã món trên kệ → hình THẬT trong kho.
 *
 * 🔴 VÌ SAO CÓ FILE NÀY (đo 20/08, kệ `cad-kyhieu` 12 món):
 * Kệ khai một danh sách (`lib/library/shelves.ts` `BUILTIN_ITEMS`), kho hình khai một danh sách
 * khác (`lib/cad/furniture.ts` `BLOCKS` + `public/cad-library/manifest.json`), và sợi dây duy
 * nhất nối hai bên là **khớp TÊN HIỂN THỊ** (`library-item-resolve.ts` `matchByName`). Tên hiển
 * thị là thứ đổi theo gu người viết, nên hai danh sách trôi khỏi nhau lúc nào không ai biết:
 *   · kệ ghi "Cửa 1 cánh 800" — kho ghi `doorRoom` "Cửa mở 800 (cửa phòng)"  ⇒ 0 khớp
 *   · kệ ghi "Giường 1m6"     — kho ghi `bedD` "Giường đôi" (w = 1600, ĐÚNG món) ⇒ 0 khớp
 *   · kệ ghi "Cây trong nhà"  — kho ghi "Cây (nhìn từ trên)"                  ⇒ 0 khớp
 * Cả ba đều **có hình thật trong kho**; người dùng kéo xuống bản vẽ thì Δ entity = 0, mà lời báo
 * lại nói đã nhận. Mã món (`DOOR-S-800`…) trước nay KHÔNG có bảng nối nào — nó chỉ dùng để tra
 * `ProductSpec.sku`, không tra được hình.
 *
 * CHỮA GỐC: ghim theo **MÃ + ID KHO** — hai thứ ổn định — thay vì theo tên hiển thị:
 *   · đổi tên hiển thị ở kệ  ⇒ dây KHÔNG đứt (map đọc mã)
 *   · đổi tên block trong kho ⇒ dây KHÔNG đứt (map đọc id)
 * Khớp-tên (`matchByName`) GIỮ NGUYÊN làm đường lùi cho mọi món chưa ghim — bảng này chỉ ĐỨNG
 * TRƯỚC nó, không thay nó (NO-REBUILD §B25: CONNECT/EXTEND, không dựng lại).
 *
 * Module cố ý KHÔNG import gì (kể cả `BLOCKS`) để cả tầng kệ lẫn tầng resolver cùng đọc được
 * một nguồn mà không kéo theo hình học nặng và không tạo vòng import.
 * Máy canh chống tái phát: `lib/cad/library-code-map.test.ts` — đọc CẢ HAI danh sách, món nào
 * kệ khai mà không resolve được VÀ không khai `missing` là **test đỏ**.
 */

export interface KeItemTarget {
  /** id trong `BLOCKS` (`lib/cad/furniture.ts`) — kho GIỮ DANH TÍNH, ưu tiên số 1. */
  blockId?: string;
  /** id trong `public/cad-library/manifest.json` — chỉ dùng khi `BLOCKS` không có món tương ứng. */
  manifestId?: string;
  /** true = hình trong kho GẦN ĐÚNG chứ không phải đúng món (vd kệ ghi "Bồn cầu treo", kho chỉ
   *  có "Bồn cầu" chung). Tầng UI phải nói rõ, không im lặng. Bỏ trống = đúng món. */
  approximate?: boolean;
  /** Kho THẬT SỰ chưa có món này ⇒ kệ hiện MỜ kèm đúng lý do, cấm kéo. Nói thẳng còn hơn để
   *  người dùng kéo một thứ không bao giờ xuống được (§9 "cấm nút giả"). */
  missing?: { vi: string; en: string };
}

/**
 * Bảng ghim cho kệ `cad-kyhieu`. Mỗi dòng đã đối chiếu tay với kho thật 20/08 — cột ghi chú nói
 * VÌ SAO chọn món đó, để lần sau đổi không phải đo lại từ đầu.
 */
export const KE_ITEM_TARGET: Record<string, KeItemTarget> = {
  // ── khớp ĐÚNG món, kích thước trùng khít ────────────────────────────────────────────────
  /** kho: `doorRoom` "Cửa mở 800 (cửa phòng)" — w 800, `hosted:'door'`. Trước ghim: 0 khớp. */
  'DOOR-S-800': { blockId: 'doorRoom' },
  /** kho: `doubleDoor` "Cửa 2 cánh" — w 1600, trùng đúng con số trên mã. */
  'DOOR-D-1600': { blockId: 'doubleDoor' },
  /** kho: `sofa3` "Sofa 3 chỗ" — trùng tên, ghim để tên đổi cũng không đứt. */
  'SOFA-3S': { blockId: 'sofa3' },
  /** kho: `dining6` "Bàn ăn 6". */
  'TBL-D6': { blockId: 'dining6' },
  /** kho: `bedD` "Giường đôi" — w = 1600 = đúng 1m6 của mã. Trước ghim: 0 khớp (tên kho không
   *  mang con số nên cả 3 luật khớp-tên đều trượt). */
  'BED-160': { blockId: 'bedD' },

  // ── kho có món GẦN ĐÚNG (khai thật, không nhận vơ là đúng món) ───────────────────────────
  /** kho: `slidingWindow` "Cửa sổ trượt" — đúng loại, nhưng bề rộng dựng sẵn 1200 ≠ 1800 của mã. */
  'WIN-SL-1800': { blockId: 'slidingWindow', approximate: true },
  /** kho: `toilet` "Bồn cầu" — kho chưa có biến thể TREO TƯỜNG. */
  'WC-WH': { blockId: 'toilet', approximate: true },
  /** kho: `lavabo` "Lavabo" — kho chưa phân biệt kiểu đặt bàn đá. */
  'LAV-CT': { blockId: 'lavabo', approximate: true },
  /** kho: `wardrobe` "Tủ áo" — w 1800, kệ ghi 2m4. */
  'WRD-240': { blockId: 'wardrobe', approximate: true },
  /** `BLOCKS` chỉ có `kitchenI` (bếp chữ I) ⇒ phải mượn kho ② .dxf. Mất danh tính, tầng UI đã
   *  khai sẵn điều đó qua `keepsIdentity:false`. */
  'KIT-L': { manifestId: 'kitchen-cabinet-l', approximate: true },
  /** kho ②: `plant-tree-top` "Cây (nhìn từ trên)" — `BLOCKS` không có cây. */
  'PLANT-M': { manifestId: 'plant-tree-top', approximate: true },

  // ── KHO CHƯA CÓ THẬT — nói thẳng, không vờ có ────────────────────────────────────────────
  /** Dò cả 46 `BLOCKS` lẫn 54 block .dxf: KHÔNG có hình người/thước tỉ lệ nào. Trước bản vá,
   *  món này kéo xuống im lặng không ra gì. */
  'SCALE-H': {
    missing: {
      vi: 'Kho chưa có hình người tỉ lệ — chưa kéo xuống bản vẽ được.',
      en: 'No human scale figure in the store yet — this cannot be placed.',
    },
  },
};

/** Lý do THẬT khi món chưa có hình trong kho; `undefined` = có hình, dùng bình thường.
 *  Tra O(1) theo mã nên gọi được ở mọi nấc thẻ, không phải dò khớp tên như `resolveLibraryItem`. */
export function unavailableReason(code: string): { vi: string; en: string } | undefined {
  return KE_ITEM_TARGET[code]?.missing;
}
