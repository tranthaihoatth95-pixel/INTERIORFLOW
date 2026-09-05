/**
 * lib/home/the-tieu-diem.ts — ĐƯỜNG "mở lại chỗ cũ" của thẻ tiêu điểm Home (J05).
 *
 * ⭐ VÌ SAO LÀ HÀM THUẦN CHỨ KHÔNG PHẢI MỘT `if` TRONG JSX:
 *   Thẻ tiêu điểm bấm được bằng LỚP PHỦ (`<a>` + `::after` inset:0). Lớp phủ đó phủ luôn mọi
 *   thứ trong thân thẻ ⇒ **thân nào có nút riêng thì lớp phủ là SAI** — nó cướp cú bấm của
 *   nút, và nếu ai đó "sửa cho tiện" bằng cách bọc cả thẻ trong `<button>` thì thành
 *   NÚT-TRONG-NÚT (HTML không hợp lệ, bàn phím loạn thứ tự).
 *
 *   Hiện tại ràng buộc "ca có `href` thì thân là `tom-tat`, ca `bat-dau` thì không `href`" chỉ
 *   là QUY ƯỚC DỮ LIỆU ở `XuongHome.tsx` — TypeScript KHÔNG chặn ai đó gán `href` cho thân
 *   `bat-dau`. Nên ràng buộc phải do MÁY giữ: hàm này + test của nó. Thêm một `ThanVat` mới
 *   có nút mà quên khai vào `THAN_CO_NUT` ⇒ test đỏ, không phải chờ ai nhớ.
 *
 * Nối: `docs/delivery/JOURNEY-MATRIX.md` J05 · chốt 04/09 D-DR2 (Home một tiêu điểm).
 */

import type { HienVat, ThanVat } from './xuong-demo';

/**
 * Những kiểu THÂN tự nó đã chứa phần tử bấm được (nút, ô nhập…).
 * Thân nằm trong danh sách này ⇒ CẤM lớp phủ toàn thẻ.
 */
export const THAN_CO_NUT: readonly ThanVat['kieu'][] = ['bat-dau'];

export function thanCoNut(kieu: ThanVat['kieu']): boolean {
  return (THAN_CO_NUT as readonly string[]).includes(kieu);
}

/**
 * Đường "mở lại chỗ cũ" — `null` nghĩa là thẻ KHÔNG bấm được cả thân.
 *
 * `null` khi:
 *   · không có `href`, hoặc `href` rỗng/toàn khoảng trắng — `<a href="">` trỏ về chính trang
 *     hiện tại, đúng loại "nút giả bấm không ra gì" mà §9 cấm;
 *   · `href` là `/` — **chính là trang Home đang đứng**. `resumeHref()` trả `/` cho ca
 *     `stage === 'render'` mà KHÔNG có `routeId` (`components/home/widgets/resume-card.ts:101`).
 *     Ở màn khác thì `/` là đường về Home hợp lệ; ở ĐÂY nó là "bấm để đứng yên tại chỗ";
 *   · thân có nút riêng — chống nút-trong-nút (xem trên).
 */
export function duongMoLai(v: HienVat): string | null {
  const h = v.href?.trim();
  if (!h || h === '/') return null;
  if (thanCoNut(v.than.kieu)) return null;
  return h;
}
