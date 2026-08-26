/**
 * lib/site/vitals-site.ts — DÂY: SỰ THẬT ĐỊA ĐIỂM ĐỔI → VITALS (§6 · §D). THUẦN, không đụng đĩa.
 *
 * ⛔ **KHÔNG có tín hiệu demo, không suy sự chú ý từ state giao diện.** Đầu vào DUY NHẤT là
 * `HoSoDiaDiem.daCu` — trạng thái miền đã ghi xuống hồ sơ. Không có dấu cũ ⇒ **im tuyệt đối**.
 * Đó là lý do hàm trả `null` chứ không trả một tín hiệu "mọi thứ ổn": Vitals nói *cái gì cần chú
 * ý BÂY GIỜ*, nó không phải bảng báo cáo tình hình.
 *
 * ⚖️ RANH GIỚI VỚI ACTIVITY (§E): Activity là BIÊN NIÊN — *"hướng đã đổi"*, *"nắng cần tính lại"*,
 * *"nắng đã cập nhật"*, giữ cả ba dòng theo thời gian. Vitals chỉ giữ **dòng còn cần xử lý**, và
 * biến mất khi xử xong. Trộn hai thứ là biến khẩu độ thành sổ nhật ký.
 */

import type { HoSoDiaDiem } from './types';
import type { Mien } from './anh-huong';

/** Nhãn người đọc cho từng miền. Hằng số — cấm chữ tự do/AI sinh lọt vào Vitals. */
const TEN_MIEN: Record<string, string> = {
  nang: 'Phân tích nắng',
  'khi-hau': 'Dữ liệu khí hậu',
  gio: 'Phân tích gió',
  'dia-ly': 'Bối cảnh địa lý',
  'vat-lieu': 'Bằng chứng vật liệu',
  'thu-cong': 'Bằng chứng thủ công',
  'kien-truc': 'Bằng chứng kiến trúc',
  'van-hoa': 'Bằng chứng văn hoá',
  'do-thi': 'Bối cảnh đô thị',
};

export interface TinHieuDiaDiem {
  /** Số mục cần tính lại — SỐ THẬT, đếm từ `daCu`. */
  so: number;
  /** Câu mức Peek. Luôn mang số, không có câu chung chung. */
  nhan: string;
  /** Dòng phụ: những miền nào bị ảnh hưởng, viết bằng tiếng người. */
  chiTiet: string;
  /** Trả lời "tại sao tôi thấy dấu này". */
  viSao: string;
  /** Miền bị ảnh hưởng — nơi gọi dùng để đi tới ĐÚNG chỗ, không phải trang chung. */
  mien: string[];
}

export function mienDangCu(hoSo: HoSoDiaDiem): string[] {
  const ds = hoSo.daCu ?? [];
  return [...new Set(ds.map((k) => k.split('.')[0]))];
}

/**
 * Tín hiệu Vitals của Ngữ Cảnh Dự Án. `null` = KHÔNG có gì đáng nói.
 * ⚠️ Không có `daCu` thì im — kể cả khi hồ sơ trống trơn. Hồ sơ chưa khai KHÔNG phải một cảnh báo.
 */
export function tinHieuDiaDiem(hoSo: HoSoDiaDiem): TinHieuDiaDiem | null {
  const so = (hoSo.daCu ?? []).length;
  if (so <= 0) return null;
  const mien = mienDangCu(hoSo);
  const ten = mien.map((m) => TEN_MIEN[m] ?? m);
  return {
    so,
    nhan: `${so} phân tích cần cập nhật`,
    chiTiet: ten.join(' · '),
    viSao: 'Sự thật địa điểm của dự án đã đổi, nên các phân tích suy ra từ nó không còn khớp.',
    mien,
  };
}

/**
 * TÍNH LẠI — gỡ dấu cũ CHỈ ở những miền được nêu. THUẦN: trả hồ sơ mới, không tự ghi đĩa.
 * ⚠️ Gỡ CÓ CHỌN LỌC, không "xong hết cho gọn": người dùng bảo tính lại nắng thì bằng chứng
 * văn hoá đang cũ vì lý do khác vẫn phải còn cũ.
 */
export function tinhLai(hoSo: HoSoDiaDiem, mien: Mien[] | string[]): HoSoDiaDiem {
  const bo = new Set(mien);
  const conLai = (hoSo.daCu ?? []).filter((k) => !bo.has(k.split('.')[0]));
  return { ...hoSo, daCu: conLai };
}
