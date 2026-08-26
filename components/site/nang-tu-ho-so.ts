/**
 * components/site/nang-tu-ho-so.ts — ĐỔI HỒ SƠ ĐỊA ĐIỂM + NGÀY GIỜ THÀNH HAI GÓC CỦA MẶT TRỜI.
 * THUẦN: không React, không store, không đĩa ⇒ test được bằng `sucrase-node`.
 *
 * ⛔ KHÔNG có công thức thiên văn nào ở đây. Toàn bộ số đến từ `lib/site/solar.ts#trangThaiNang`,
 * mà nó lại gọi `lib/three/lighting.ts#sunFromDateTime` (NOAA, có test đối chiếu bảng). Ba tầng,
 * MỘT thuật toán — hai công thức lệch nhau là loại lỗi âm thầm nhất trong nghề chiếu sáng.
 *
 * 🔴 VÌ SAO HÀM NÀY TRẢ **PATCH HAI KHOÁ** chứ không trả cả `SunLight`:
 *   §25 — kéo thanh giờ KHÔNG ĐƯỢC reset mô hình, không đổi danh tính vật thể, và cũng không
 *   được lặng lẽ trả `intensity`/`colorK` mà người dùng vừa chỉnh về mặc định. Ràng buộc đó
 *   được KHOÁ BẰNG TEST (`nang-tu-ho-so.test.ts`), không phải bằng lời dặn trong docstring:
 *   test khẳng định patch chỉ chứa đúng `azimuthDeg` và `altitudeDeg`.
 */

// ⚠️ IMPORT TƯƠNG ĐỐI, ĐỪNG "DỌN" THÀNH `@/` — bộ chạy test của repo (`sucrase-node`) KHÔNG phân
// giải alias, mà đây là *value import* nên nó sinh `require()` thật lúc chạy. Cùng lý do đã ghi
// trong `lib/site/solar.ts`. (Dòng `import type` bên dưới thì alias vẫn được: sucrase xoá hẳn.)
import { trangThaiNang } from '../../lib/site/solar';
import type { HoSoDiaDiem } from '@/lib/site/types';

export interface GocNang {
  azimuthDeg: number;
  altitudeDeg: number;
}

/**
 * @param ngayIso 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')` được ECMAScript quy định đọc theo UTC —
 *        đúng thứ `sunFromDateTime` cần (đừng đổi sang `new Date(y, m, d)` giờ máy).
 * @param hour giờ đồng hồ ĐỊA PHƯƠNG, lẻ được (16.5 = 16h30).
 * @returns `null` khi chưa đủ dữ kiện (thiếu toạ độ hoặc thiếu ngày). Thiếu thì IM, không đoán
 *          một vị trí mặc định rồi vẽ nắng sai — bịa số ở đây là bịa số trên bản vẽ nghề.
 */
export function gocNangTuHoSo(hoSo: HoSoDiaDiem, ngayIso: string, hour: number): GocNang | null {
  if (!ngayIso) return null;
  const ngay = new Date(ngayIso);
  if (Number.isNaN(ngay.getTime())) return null;
  const v = trangThaiNang(hoSo, ngay, hour);
  if (!v) return null;
  return { azimuthDeg: v.phuongViDeg, altitudeDeg: v.caoDoDeg };
}
