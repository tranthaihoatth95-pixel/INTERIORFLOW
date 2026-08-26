/**
 * lib/ui/vat-lieu.ts — LÕI THUẦN của luật VẬT LIỆU BỀ MẶT (Hoà chốt 20/08).
 * Chạy test: `node_modules/.bin/sucrase-node lib/ui/vat-lieu.test.ts`
 *
 * ⭐ VÌ SAO LÀ MỘT TỆP LÕI CHỨ KHÔNG PHẢI MỘT ĐOẠN DOCSTRING: luật "kính phải đáng" là loại
 * luật CHẾT NGAY nếu chỉ viết bằng chữ — lane sau đọc lướt, thấy `.be-mat-noi--kinh` đẹp hơn
 * `--dac`, bôi kính lên một biểu mẫu, và không máy nào kêu. Đặt bảng ánh xạ VAI TRÒ → VẬT LIỆU
 * ở đây thì `vatLieuTheoVaiTro('bieu-mau') === 'dac'` thành một khẳng định máy canh được.
 *
 * 🔴 LUẬT (nguyên văn rút gọn):
 *   ① ĐẶC        — biểu mẫu · cài đặt · thiết lập trang · spec · dữ liệu kỹ thuật ·
 *                  vùng nhiều núm · chỗ đọc lâu.  ĐÂY LÀ MẶC ĐỊNH.
 *   ② GẦN ĐẶC    — bảng làm việc thường trực · inspector · Object Passport ·
 *                  bề mặt xem chi tiết / soát duyệt.
 *   ③ KÍNH MỎNG  — CHỈ: Vitals Peek · viên giọng nói · hành động nhanh theo ngữ cảnh ·
 *                  công cụ nổi nhỏ · lớp phủ tạm thoáng qua.
 *
 * ⛔ Kính làm giảm ĐỌC-ĐƯỢC / THỨ BẬC / ĐỘ TIN CẬY NGHỀ ⇒ BỎ KÍNH.
 * ⛔ CẤM: mờ dày · phủ tím · acrylic dày · KÍNH CHỒNG KÍNH.
 * Hai khuôn hợp lệ: (A) kính mỏng toàn phần cho bề mặt nhỏ/thoáng qua ·
 *                   (B) VỎ KÍNH + RUỘT GẦN ĐẶC khi cần chiều sâu mà nội dung phải sắc nét.
 */

/** Ba mức vật liệu. Không có mức thứ tư — thêm mức là mở cửa cho "kính nhưng hơi đặc hơn tí". */
export const VAT_LIEU = ['dac', 'ganDac', 'kinh'] as const;
export type VatLieu = (typeof VAT_LIEU)[number];

/**
 * VAI TRÒ của bề mặt — *nó dùng để làm gì*, không phải *nó to bằng nào*.
 * Danh sách này cố ý HỮU HẠN: buộc nơi dùng phải nói bề mặt của mình thuộc loại việc nào,
 * thay vì tự chọn một con số alpha nghe hay.
 */
export const VAI_TRO_BE_MAT = [
  // → ĐẶC
  'bieu-mau',
  'cai-dat',
  'thiet-lap-trang',
  'spec',
  'du-lieu-ky-thuat',
  'vung-nhieu-num',
  'doc-lau',
  // → GẦN ĐẶC
  'bang-thuong-truc',
  'inspector',
  'object-passport',
  'xem-chi-tiet',
  'soat-duyet',
  // → KÍNH MỎNG
  'vitals-peek',
  'vien-giong-noi',
  'hanh-dong-nhanh',
  'cong-cu-noi-nho',
  'lop-phu-tam',
] as const;
export type VaiTroBeMat = (typeof VAI_TRO_BE_MAT)[number];

const BANG: Record<VaiTroBeMat, VatLieu> = {
  'bieu-mau': 'dac',
  'cai-dat': 'dac',
  'thiet-lap-trang': 'dac',
  spec: 'dac',
  'du-lieu-ky-thuat': 'dac',
  'vung-nhieu-num': 'dac',
  'doc-lau': 'dac',

  'bang-thuong-truc': 'ganDac',
  inspector: 'ganDac',
  'object-passport': 'ganDac',
  'xem-chi-tiet': 'ganDac',
  'soat-duyet': 'ganDac',

  'vitals-peek': 'kinh',
  'vien-giong-noi': 'kinh',
  'hanh-dong-nhanh': 'kinh',
  'cong-cu-noi-nho': 'kinh',
  'lop-phu-tam': 'kinh',
};

/** Vai trò không khai ⇒ **ĐẶC**, không phải kính. Mặc định an toàn là mặc định đọc được. */
export function vatLieuTheoVaiTro(vaiTro?: VaiTroBeMat | null): VatLieu {
  if (!vaiTro) return 'dac';
  return BANG[vaiTro] ?? 'dac';
}

/** Lớp CSS tương ứng (khai ở app/globals.css, khối "BỀ MẶT NỔI"). */
export const LOP_VAT_LIEU: Record<VatLieu, string> = {
  dac: 'be-mat-noi--dac',
  ganDac: 'be-mat-noi--gan-dac',
  kinh: 'be-mat-noi--kinh',
};

/**
 * Vai trò nào ĐƯỢC PHÉP đeo kính. Dùng để chặn ở bước dựng: bề mặt khai vai trò ĐẶC mà nơi
 * gọi ép `vatLieu="kinh"` là đang phá luật — hàm này cho phép máy nói ra điều đó.
 */
export function duocDeoKinh(vaiTro: VaiTroBeMat): boolean {
  return BANG[vaiTro] === 'kinh';
}
