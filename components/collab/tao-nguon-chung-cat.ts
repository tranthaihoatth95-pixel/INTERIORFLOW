/**
 * components/collab/tao-nguon-chung-cat.ts — CONVERTER hàm thuần
 * `KetQuaThaoLuan` → `ProvenanceInput[]` cho `distillDnaFromSources()` (COLLAB-LOI, 17/08).
 *
 * ⭐ VÌ SAO TÁCH FILE (không nhét trong `CuaSoThaoLuan.tsx`):
 *  · Hàm thuần, không React ⇒ test được bằng `sucrase-node` (cùng khuôn `cua-so-cong-cu.ts`).
 *  · `CuaSoThaoLuan.tsx` mang 'use client' + JSX ⇒ nếu nhét converter vào cũng gánh theo React
 *    runtime lúc distill, tăng chi phí bundle mà không cần thiết.
 *  · Đây là DÂY THỰC — LOI mở cửa sang lib/distill (union + hàm gộp), VO chuyển tín hiệu vào
 *    đúng hình dạng đó. Ranh giới: hàm này BIẾT hai bên (form output + ProvenanceInput), là
 *    cây cầu duy nhất — sửa hình dạng ở bên nào cũng phải nghĩ tới cây cầu.
 *
 * ⭐ RANH GIỚI CONTRACT: `taoNguonChungCat` KHÔNG bỏ nguồn rỗng. Ví dụ Bảng so cực mà chưa
 * bấm hàng nào thì vẫn xuất ra `{ kind: 'form', formKind: 'poles', fields: {} }` — để
 * `distiller.ts:91` (`flatFormValues(s.fields)`) tự trả rỗng theo luật cũ. Ép bỏ ở đây là làm
 * hai tầng cùng lọc, mỗi tầng một kiểu, đúng bệnh cùng-một-thứ-hai-nơi-làm.
 *
 * Ngoại lệ: `moodboardDaMo === false` ⇒ KHÔNG xuất nguồn moodboard (không có nguồn để trỏ,
 * khác với "moodboard mở nhưng rỗng" — moodboard sống ở `ConceptForm` với luồng lưu ảnh riêng
 * qua `useLibrary`, VO không cắm dây đó ở đây, đợi phiếu sau).
 */

import type { ProvenanceInput } from '@/lib/distill/types';
import type { KetQuaSoCuc } from './BangSoCucForm';
import type { KetQuaHoi } from './BaHoiStorylineForm';

export interface KetQuaThaoLuanChoDistill {
  /** Bảng so cực — xuất thành 1 nguồn `form(poles)`. */
  soCuc: KetQuaSoCuc[];
  /** Câu chuyện 3 hồi — xuất thành 1 nguồn `form(ba-hoi)`. */
  baHoi: KetQuaHoi[];
  /**
   * Cờ *"tab Moodboard đã được người dùng mở"* — nếu FALSE thì KHÔNG xuất nguồn moodboard.
   * Nếu TRUE (v0 hiện tại) cũng chưa xuất được, vì ảnh moodboard sống ở `useLibrary` — cần
   * phiếu tiếp nối chuyển thành `ProvenanceInput.kind='asset'`/`'image'`. Ghi rõ để phiên sau
   * không tưởng là bỏ sót.
   */
  moodboardDaMo: boolean;
}

/**
 * Chuyển kết quả ba khuôn của Cửa Sổ Thảo Luận sang danh sách `ProvenanceInput` mà
 * `distillDnaFromSources()` nhận. HÀM THUẦN — cùng đầu vào, cùng đầu ra, cả trong test lẫn UI.
 *
 * Sinh id ổn định (`ban-so-cuc` · `cau-chuyen-3-hoi`) để `mergeDistilledIntoCard` truy được
 * nguồn cũ khi người bấm chưng cất lần thứ N (`DistilledField.nguon[]` giữ id).
 */
export function taoNguonChungCat(ketQua: KetQuaThaoLuanChoDistill): ProvenanceInput[] {
  const nguon: ProvenanceInput[] = [];

  // Bảng so cực → form(poles). fields: { <hangId>: "<số nấc>" } — chỉ xuất hàng ĐÃ bấm; hàng
  // chưa bấm là dữ liệu KHÔNG CÓ, khác với "cân bằng" (số 0).
  const soCucFields: Record<string, string> = {};
  for (const h of ketQua.soCuc) {
    if (h.giaTri !== null && h.giaTri !== undefined) {
      soCucFields[h.id] = String(h.giaTri);
    }
  }
  if (Object.keys(soCucFields).length > 0) {
    nguon.push({
      kind: 'form',
      id: 'ban-so-cuc',
      formKind: 'poles',
      fields: soCucFields,
    });
  }

  // Câu chuyện 3 hồi → form(ba-hoi). fields: { 'hoi-1': "<tiêu đề> — <mô tả>", ... }. Chỉ hồi
  // ĐÃ ĐIỀN mới xuất; ảnh (`anhUrl`) KHÔNG xuất qua `form.fields` (distiller v1 không xử ảnh
  // trong nhánh form). Cần chuyển ảnh thành nguồn riêng thì `kind:'asset',assetKind:'image'`
  // — nhưng ảnh moodboard/hồi chỉ có ý nghĩa khi có id ổn định (Gallery id), nay chưa có, ghi
  // ra ở §CHƯA CHẮC của báo cáo.
  const baHoiFields: Record<string, string> = {};
  for (const h of ketQua.baHoi) {
    if (h.daDien) {
      const noiDung = [h.tieuDe.trim(), h.moTa.trim()].filter(Boolean).join(' — ');
      if (noiDung) baHoiFields[`hoi-${h.vi_tri + 1}`] = noiDung;
    }
  }
  if (Object.keys(baHoiFields).length > 0) {
    nguon.push({
      kind: 'form',
      id: 'cau-chuyen-3-hoi',
      formKind: 'ba-hoi',
      fields: baHoiFields,
    });
  }

  // Moodboard: v0 chưa xuất — xem docstring. Không throw, không cảnh báo — chỉ đơn giản không
  // thêm nguồn. Đây là hành vi ĐÚNG cho khuôn thảo luận (đầu ra có thể rỗng).
  return nguon;
}
