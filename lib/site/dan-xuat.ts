/**
 * lib/site/dan-xuat.ts — NỐI MÁY SUY VÀO HỒ SƠ (22/08, Lane B).
 *
 * 🔴 VÌ SAO CÓ TỆP NÀY — đo được hai chỗ ĐỨT, cả hai đều làm chuỗi Site chết câm:
 *
 *   ① `lib/site/suy-luan.ts` có TRỌN máy suy (`gopSuThat` · `suyLuan` · `taoKetLuan`) nhưng
 *      `grep` ngoài `lib/site/` = **0 nơi gọi**. Route PATCH chỉ ghi toạ độ/hướng, KHÔNG hề sinh
 *      sự thật dẫn xuất ⇒ `hoSo.suThat` rỗng vĩnh viễn ⇒ `caiGiCu()` không có gì để đánh dấu ⇒
 *      `daCu` luôn rỗng ⇒ **Vitals không bao giờ có tín hiệu để báo**. Máy đủ, dây thiếu.
 *
 *   ② `tinhLai()` (vitals-site.ts) CHỈ XOÁ DẤU CŨ, không tính lại gì. Tức nút "Tính lại" là nút
 *      TẮT CẢNH BÁO. Đó đúng thứ hiến pháp IF cấm: trạng thái nói "đã tươi" trong khi không có
 *      phép tính nào chạy — cùng họ với "bịa phần trăm" ở thanh tiến trình.
 *
 * ⚖️ RANH GIỚI VỚI §32 ("KHÔNG tự tính lại, KHÔNG tự xoá — người quyết"):
 *   · Suy LẦN ĐẦU cho miền CHƯA CÓ sự thật nào = **không đè lên quyết định nào cả**, vì chưa có
 *     gì để đè. Đây là dựng nền, không phải tính lại.
 *   · Suy LẠI khi đã có sự thật cũ = CHỈ chạy khi người bấm "Tính lại". Máy không tự động.
 *   Hai đường tách bạch bằng hai hàm dưới đây, không phải bằng một cờ.
 */
import { gopSuThat, suyLuan } from './suy-luan';
import type { HoSoDiaDiem } from './types';

/** Miền của một khoá sự thật: `nang.gocToiMatDung` → `nang`. */
function mienCua(khoa: string): string {
  return khoa.split('.')[0];
}

/**
 * SUY LẦN ĐẦU — chỉ điền vào chỗ TRỐNG, tuyệt đối không đè sự thật/kết luận đã có.
 * Dùng ở PATCH: khai toạ độ xong là hồ sơ có nền dẫn xuất ngay, nhưng lần PATCH sau (đổi hướng)
 * KHÔNG âm thầm tính lại — nó chỉ đánh dấu cũ, đúng §32.
 */
export function suyLanDau(hoSo: HoSoDiaDiem, ngay: Date): HoSoDiaDiem {
  const daCoSuThat = Object.keys(hoSo.suThat).length > 0;
  if (daCoSuThat) return hoSo; // đã có nền ⇒ không đụng, chờ người bấm Tính lại

  const su = gopSuThat(hoSo, ngay);
  if (Object.keys(su).length === 0) return hoSo; // chưa khai toạ độ ⇒ không suy được, im
  return { ...hoSo, suThat: su, ketLuan: suyLuan(su) };
}

/**
 * TÍNH LẠI THẬT — người bấm mới chạy. Suy lại sự thật + kết luận CHO ĐÚNG MIỀN được yêu cầu,
 * rồi mới gỡ dấu cũ của miền đó.
 *
 * ⛔ Thứ tự quan trọng: TÍNH TRƯỚC — GỠ DẤU SAU. Gỡ trước rồi tính là nếu phép tính hỏng thì dấu
 * đã mất mà sự thật vẫn cũ — người dùng mất luôn cảnh báo mà không biết.
 * ⛔ Miền KHÔNG được yêu cầu thì giữ nguyên dấu cũ — bấm tính lại "nắng" không được lặng lẽ dọn
 * cảnh báo của "khí hậu".
 * ⛔ ĐỀ XUẤT và quyết định của người GIỮ NGUYÊN (§32: không xoá lịch sử).
 */
export function tinhLaiThat(hoSo: HoSoDiaDiem, mien: readonly string[], ngay: Date): HoSoDiaDiem {
  const can = new Set(mien);
  if (can.size === 0) return hoSo;

  const suMoi = gopSuThat(hoSo, ngay);
  // Chỉ nhận khoá thuộc miền được yêu cầu; khoá miền khác giữ nguyên bản cũ.
  const suThat = { ...hoSo.suThat };
  for (const [k, v] of Object.entries(suMoi)) if (can.has(mienCua(k))) suThat[k] = v;

  // Kết luận suy lại TRÊN TOÀN BỘ sự thật sau khi đã cập nhật — kết luận vốn bắc cầu nhiều miền,
  // lọc theo miền ở đây sẽ đẻ ra kết luận nửa cũ nửa mới.
  const ketLuan = suyLuan(suThat);

  const daCu = (hoSo.daCu ?? []).filter((k) => !can.has(mienCua(k)));
  return { ...hoSo, suThat, ketLuan, daCu };
}
