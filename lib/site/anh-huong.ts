/**
 * lib/site/anh-huong.ts — ĐỔI SỰ THẬT THÌ CÁI GÌ CŨ ĐI (§32). THUẦN, không đụng đĩa.
 *
 * 🔴 LUẬT CỐT LÕI: đổi vị trí/hướng **KHÔNG được lặng lẽ ghi đè** kết quả phía sau, và cũng
 * **KHÔNG được xoá sạch mọi thứ**. Chỉ những miền THẬT SỰ phụ thuộc mới thành CŨ.
 * Ví dụ Hoà nêu: đổi hướng mặt đứng làm hỏng phân tích nắng, nhưng **KHÔNG** làm hỏng bằng chứng
 * nghề thủ công của vùng. Quét sạch tất cả cho "an toàn" là phá công sức nghiên cứu của người dùng.
 */

import type { HoSoDiaDiem } from './types';

/** Miền tri thức — dùng làm tiền tố khoá trong `HoSoDiaDiem.suThat`, vd `nang.gocChieuChieu`. */
export type Mien = 'nang' | 'khi-hau' | 'gio' | 'dia-ly' | 'vat-lieu' | 'thu-cong' | 'kien-truc' | 'van-hoa' | 'do-thi';

export type ThayDoi = 'toa-do' | 'huong-mat-dung' | 'bac-that' | 'do-chinh-xac';

/**
 * Bảng phụ thuộc. Khai MỘT LẦN ở đây để không nơi nào tự đoán.
 * · Đổi TOẠ ĐỘ  → đổi cả hành tinh: nắng, khí hậu, gió, địa lý, và mọi bằng chứng ĐỊA PHƯƠNG.
 * · Đổi HƯỚNG   → chỉ đổi thứ phụ thuộc phương vị (nắng). Khí hậu/vật liệu/thủ công KHÔNG đụng.
 * · Đổi ĐỘ CHÍNH XÁC → không làm sai số liệu, nhưng làm sai CÁCH ĐỌC chúng (số cấp thành phố
 *   không được đọc như số tại công trường) ⇒ đánh dấu để người xem lại, không xoá.
 */
export const PHU_THUOC: Record<ThayDoi, Mien[]> = {
  'toa-do': ['nang', 'khi-hau', 'gio', 'dia-ly', 'vat-lieu', 'thu-cong', 'kien-truc', 'van-hoa', 'do-thi'],
  'huong-mat-dung': ['nang'],
  'bac-that': ['nang'],
  'do-chinh-xac': ['khi-hau', 'gio', 'dia-ly'],
};

export function mienBiAnhHuong(thayDoi: ThayDoi[]): Mien[] {
  const ra = new Set<Mien>();
  for (const t of thayDoi) for (const m of PHU_THUOC[t]) ra.add(m);
  return [...ra];
}

/** So hai hồ sơ, ra danh sách thay đổi có nghĩa. Sai số toạ độ dưới ~1m coi như không đổi. */
export function soHoSo(cu: HoSoDiaDiem, moi: HoSoDiaDiem): ThayDoi[] {
  const ra: ThayDoi[] = [];
  const khac = (a?: number, b?: number, eps = 1e-5) =>
    (typeof a === 'number') !== (typeof b === 'number') ||
    (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) > eps);
  if (khac(cu.viTri.viDo, moi.viTri.viDo) || khac(cu.viTri.kinhDo, moi.viTri.kinhDo)) ra.push('toa-do');
  if (khac(cu.huong.matDungChinhDeg, moi.huong.matDungChinhDeg, 0.01)) ra.push('huong-mat-dung');
  if (khac(cu.huong.bacThatDeg, moi.huong.bacThatDeg, 0.01)) ra.push('bac-that');
  if (cu.viTri.doChinhXac !== moi.viTri.doChinhXac) ra.push('do-chinh-xac');
  return ra;
}

/** Khoá sự thật nào thành CŨ. Trả về KHOÁ, nơi gọi tự quyết đánh dấu hay tính lại — hàm này
 *  KHÔNG tự xoá gì (§32: giữ bằng chứng cũ + lịch sử quyết định). */
export function suThatCu(hoSo: HoSoDiaDiem, thayDoi: ThayDoi[]): string[] {
  const mien = new Set(mienBiAnhHuong(thayDoi));
  return Object.keys(hoSo.suThat).filter((k) => mien.has(k.split('.')[0] as Mien));
}

/**
 * ⭐ CÁI GÌ THÀNH CŨ — bản ĐẦY ĐỦ: sự thật đã lưu **và** kết luận đã suy ra.
 *
 * 🔴 VÌ SAO KHÔNG CHỈ ĐẾM `suThat`: kết luận (`KetLuanSuyRa`) mới là thứ KTS đọc, và nó treo vào
 * miền qua `tuSuThat`. Đổi hướng mà chỉ soi kho sự thật thì hồ sơ chưa cache số nào sẽ ra "không
 * có gì cũ" — trong khi kết luận *"mặt đứng Tây hứng nắng chiều"* vừa mới sai. Đó là bỏ sót đúng
 * thứ người dùng nhìn thấy.
 *
 * ⚖️ NGƯỢC LẠI, KHÔNG đánh dấu theo MIỀN TRỐNG: chưa suy ra gì thì **không có gì để cũ** ⇒ dự án
 * mới tinh đổi hướng KHÔNG bị Vitals nhắc vô cớ. Có làm mới có nợ.
 */
export function caiGiCu(hoSo: HoSoDiaDiem, thayDoi: ThayDoi[]): string[] {
  const mien = new Set(mienBiAnhHuong(thayDoi));
  const tuSuThat = Object.keys(hoSo.suThat).filter((k) => mien.has(k.split('.')[0] as Mien));
  const tuKetLuan = hoSo.ketLuan
    .filter((k) => k.tuSuThat.some((f) => mien.has(f.split('.')[0] as Mien)))
    .map((k) => `${k.tuSuThat[0]?.split('.')[0] ?? 'nang'}.ketluan:${k.id}`);
  return [...new Set([...tuSuThat, ...tuKetLuan])];
}
