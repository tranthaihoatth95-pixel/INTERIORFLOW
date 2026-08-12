/**
 * lib/distill/types.ts — kiểu THUẦN của MÁY CHƯNG CẤT chung (`DistillEngine`).
 *
 * Nguồn: phiếu `docs/phieu-giao/dna-card.md` ④.1 + `docs/00-CHOT.md` mục [12/08 group-by]
 * — 3 việc dna-card · auto-define · company-dna-pack CHUNG một engine: "trích dữ liệu có
 * nguồn → cấu trúc → cờ measured/inferred/verified → người duyệt". File này viết phần
 * KHÔNG biết gì về "Thẻ DNA" — chỉ biết "nguồn có xuất xứ" và "trường đã chưng cất".
 *
 * Cờ 3 nấc dùng ĐÚNG tên đã có trong code (`lib/ffe/item.ts` FfeConfidence,
 * `lib/materials/warehouse/dto.ts` verified) — không đẻ tên thứ 4.
 */

/** measured = đo/đọc trực tiếp từ dữ liệu cứng · inferred = máy suy từ nguồn, CHỜ người duyệt ·
 * verified = người đã xác nhận/sửa tay. */
export type TrangThaiNguon = 'measured' | 'inferred' | 'verified';

/**
 * Một nguồn có xuất xứ đưa vào máy chưng cất. `id` PHẢI là định danh truy ngược được
 * (assetId của LibraryAsset, đường dẫn tệp, mã tài liệu…) — không bao giờ chuỗi rỗng.
 * Union mở — auto-define/company-dna-pack có thể thêm `kind` khác sau, KHÔNG sửa file này
 * (thêm nhánh union tại nơi dùng qua generic, xem `engine.ts`).
 */
export type ProvenanceInput =
  | { kind: 'image'; id: string; palette?: string[]; caption?: string; tags?: string[] }
  | { kind: 'text'; id: string; text: string; label?: string };

/**
 * Một trường đã chưng cất. `values` là MẢNG (không phải 1 giá trị) — nguồn mâu thuẫn nhau
 * (2 ảnh gợi ý 2 phong cách khác nhau) thì GIỮ CẢ HAI, không tự chọn 1 bên (không đoán bừa).
 * `nguon` là id của các `ProvenanceInput` đã đóng góp — rỗng nghĩa là trường TRỐNG (chưa có
 * nguồn nào nói tới), không phải "giá trị mặc định".
 */
export interface DistilledField<T = string> {
  values: T[];
  trangThai: TrangThaiNguon;
  nguon: string[];
}

/** Trường trống — chưa có nguồn nào đóng góp. KHÔNG suy đoán để lấp chỗ trống (khuôn scaffolder X2). */
export function emptyField<T = string>(): DistilledField<T> {
  return { values: [], trangThai: 'inferred', nguon: [] };
}

/** Trường do người gõ/sửa tay trực tiếp — luôn `verified`, nguồn mặc định `'manual'`. */
export function verifiedField<T = string>(values: T[], nguon: string[] = ['manual']): DistilledField<T> {
  return { values, trangThai: 'verified', nguon };
}

/** Trường trống có coi là "chưa có gì" (để UI quyết định hiện empty-state hay không). */
export function isFieldEmpty<T>(f: DistilledField<T>): boolean {
  return f.values.length === 0;
}
