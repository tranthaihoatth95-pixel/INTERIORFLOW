/**
 * lib/ui/hien-dan.ts — HIỆN DẦN THEO NGHĨA + NÉN DẦN KHI ĐÃ XONG.
 * Nơi DUY NHẤT khai thứ tự hiện và ba trạng thái mục. Cấm nơi dùng tự chế thứ tự riêng.
 *
 * ⭐ VÌ SAO CÓ THỨ TỰ, không phải bày hết cùng lúc: bề mặt nổi mang thông tin có SỨC NẶNG
 * KHÁC NHAU. Bày đồng loạt là bắt mắt tự đi tìm cái quan trọng. Thứ tự dưới đây đi theo
 * câu hỏi người dùng hỏi trong đầu, đúng trình tự:
 *   ① cái này của ai/từ đâu → ② nó ra cái gì → ③ có chắc không → ④ tôi phải quyết gì
 *   → ⑤ còn chi tiết gì → ⑥ muốn đào sâu thì có gì
 * Ba bậc đầu là thứ luôn phải thấy; ⑤⑥ là thứ hiện sau, và được phép KHÔNG hiện ở nấc gọn.
 */

/** Sáu bậc nghĩa, xếp đúng thứ tự hiện. */
export const BAC_HIEN = [
  'danhTinh', // ① danh tính / nguồn — cái này là gì, của ai, từ đâu
  'ketQua', // ② hình ảnh / kết quả chính
  'doChac', // ③ độ chắc / mức sự thật (measured · inferred · verified)
  'quyetDinh', // ④ quyết định then chốt — nút người phải bấm
  'chiTiet', // ⑤ chi tiết phụ
  'thongTinSau', // ⑥ thông tin sâu
] as const;

export type BacHien = (typeof BAC_HIEN)[number];

/** Bậc thứ mấy (0-based). -1 nếu không phải bậc hợp lệ. */
export const thuTuBac = (bac: BacHien): number => BAC_HIEN.indexOf(bac);

/** Giãn cách giữa hai bậc liền nhau (ms). Đủ để mắt bắt được nhịp, chưa tới mức phải chờ. */
export const GIAN_BAC_MS = 45;

/**
 * Độ trễ của một bậc. Nhân với `GIAN_BAC_MS` — bậc ⑥ trễ 225ms, vẫn dưới nửa giây.
 * Giảm-chuyển-động ⇒ MỌI bậc trễ 0 (hiện đủ ngay, không ai bị giấu thông tin).
 */
export const treTheoBac = (bac: BacHien, giam = false): number =>
  giam ? 0 : Math.max(0, thuTuBac(bac)) * GIAN_BAC_MS;

/**
 * Bậc nào được hiện ở nấc nào của bề mặt. Đây là bảng hợp đồng — nơi dùng chỉ khai bậc cho
 * từng mẩu nội dung, KHÔNG tự quyết ẩn/hiện.
 * ⚠️ Ba bậc đầu có mặt ở MỌI nấc: nấc gọn phải "gọn và tươm tất", tự đứng được một mình,
 * không phải bản cắt xén chờ mở ra mới thành hình.
 */
const BAC_THEO_NAC: Record<'vien' | 'bang' | 'bangSau', readonly BacHien[]> = {
  vien: ['danhTinh', 'ketQua', 'doChac'],
  bang: ['danhTinh', 'ketQua', 'doChac', 'quyetDinh', 'chiTiet'],
  bangSau: BAC_HIEN,
};

export const hienONac = (bac: BacHien, nac: 'vien' | 'bang' | 'bangSau'): boolean =>
  BAC_THEO_NAC[nac].includes(bac);

/* ------------------------------------------------------------------ *
 * NÉN DẦN KHI ĐÃ XONG                                                 *
 * ------------------------------------------------------------------ */

/**
 * Ba trạng thái của một mục trong chuỗi cổng duyệt. Cổng người đã duyệt xong thì CO LẠI
 * thành một dòng tóm tắt, nhường chỗ cho cổng đang tới.
 * ⚠️ `daXong` KHÔNG phải "ẩn đi": nó vẫn đọc được, vẫn mở lại được — chỉ thôi chiếm chỗ.
 * Ẩn hẳn là cắt mất bằng chứng người dùng đã duyệt cái gì.
 */
export const TRANG_THAI_MUC = ['dangToi', 'dangLam', 'daXong'] as const;
export type TrangThaiMuc = (typeof TRANG_THAI_MUC)[number];

/**
 * Mục đang làm chiếm hết chỗ; đã xong co về một dòng; đang tới đứng chờ, hơi lùi.
 * Trả về TỈ TRỌNG (không phải px) — nơi dùng đặt vào `flex`/`grid`, để nó co giãn theo khung
 * chứ không gãy ở màn hẹp.
 */
export const tiTrongMuc = (t: TrangThaiMuc): number =>
  t === 'dangLam' ? 1 : t === 'dangToi' ? 0.18 : 0.1;

/** Mục đã xong chỉ được nói bằng MỘT DÒNG tóm tắt — đây là ràng buộc, không phải gợi ý. */
export const chiMotDong = (t: TrangThaiMuc): boolean => t === 'daXong';
