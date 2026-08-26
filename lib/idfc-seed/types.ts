/**
 * lib/idfc-seed/types.ts — GIA PHẢ của một món trong kho mầm Thư viện.
 *
 * Vì sao tách riêng khỏi `ParsedIdfc`: `.idfc` là ĐỊNH DẠNG TRAO TAY (một tệp = một mẫu, mở
 * được ở máy khác). Gia phả "món này đến từ tệp nào TRONG REPO NÀY" là chuyện của kho mầm, không
 * phải của định dạng — nhét vào `IdfcMeta` là thêm trường cho mọi người dùng để phục vụ đúng một
 * ca. Vì vậy gia phả sống ở bảng phụ, khoá theo `meta.code`.
 *
 * ⛔ KHÔNG có nấc tin cậy thứ tư. Đúng ba nấc `measured | inferred | verified` (luật đã chốt):
 *   · `measured`  — đọc thẳng từ tệp/hằng số có trong repo (prims parse từ .dxf, hatch từ
 *                   `MaterialDef`, bao ngoài đo từ chính prims).
 *   · `inferred`  — máy suy (PBR suy từ tên danh mục; cao cửa lấy từ dải chuẩn ngành).
 *   · `verified`  — người đã kiểm bằng mắt. **Kho mầm không tự nhận nấc này** — không món nào
 *                   trong `seed.generated.ts` mang `verified`, và test `seed.test.ts` canh điều đó.
 */

export type DoTinCay = 'measured' | 'inferred' | 'verified';

export interface SeedProvenance {
  /** Đường dẫn tệp/nguồn THẬT trong repo — truy được, không phải chữ trang trí. */
  nguon: string;
  /** Ảnh xem trước có thật trên đĩa (đường dẫn public). Thiếu ảnh thì bỏ trống, không bịa. */
  anhXemTruoc?: string;
  giayPhep: string;
  moTaNguon: string;
  /** Nấc tin cậy THEO TỪNG MẶT — một món có thể hình học đo được mà PBR thì suy. */
  doTinCay: Partial<Record<'geom2d' | 'kichThuoc' | 'cao' | 'hatch2d' | 'pbr', DoTinCay>>;
}

/** Các MẶT mà một danh tính có thể lộ ra. Một `.idfc` = MỘT danh tính, N mặt — không phải N bản sao. */
export type MatBieuDien = '2d' | '3d' | 'vat-lieu' | 'anh' | 'thuong-mai';

export const MAT_LABEL: Record<MatBieuDien, [string, string]> = {
  '2d': ['Mặt 2D', '2D face'],
  '3d': ['Mặt 3D', '3D face'],
  'vat-lieu': ['Vật liệu', 'Material'],
  anh: ['Ảnh xem trước', 'Preview'],
  'thuong-mai': ['Thương mại', 'Commercial'],
};
