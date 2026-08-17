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
 * (assetId của LibraryAsset, đường dẫn tệp, mã tài liệu, sticky note id, form artifact id…)
 * — không bao giờ chuỗi rỗng.
 *
 * FIVE KIND, mở dần theo phiếu — mỗi kind PHỤC VỤ một họ nguồn đã có cơ sở hạ tầng trong repo:
 *  - `image`  → LibraryAsset ảnh (palette/caption/tags có sẵn) — nguồn gốc, giữ nguyên hình dạng.
 *              Đây là chỗ `lib/idfc-import/from-photo.ts` sẽ nối vào; luật cũ ĐÃ ĐÚNG, không nới.
 *  - `text`   → nguồn văn bản thuần (trích đoạn tài liệu, chuỗi mô tả tự do có id).
 *  - `sticky` → NoteNode trên `FlowCanvas` (xem `components/nodes/NoteNode.tsx`). Có toạ độ để
 *              caller kiểm gộp theo cụm không gian nếu muốn — máy chưng cất không dùng x/y trực tiếp.
 *  - `form`   → kết quả điền form khung tư duy (Moodboard/Bảng-so-cực/3-hồi — xem NC-COLLAB-CHANG-3D).
 *              `formKind` là DIỄN GIẢI của caller (`'poles' | 'ba-hoi' | 'moodboard'`), extractor
 *              phân nhánh theo giá trị này. `fields` là bản ghi mở — chưa ép schema, để mỗi khuôn form
 *              có thể tự khai trường điền không phải sửa file này.
 *  - `asset`  → item từ Gallery/Master Library (tham chiếu, KHÔNG chứa dữ liệu ảnh/vật liệu).
 *              `assetKind` cho biết caller đang trỏ tới loại nào (`image` → nuôi anhNguon,
 *              `material` → nuôi vatLieuMatId, `other` → không extractor mặc định nào nhận).
 *
 * Union vẫn MỞ theo tinh thần đẳng cấu §9 — thêm kind mới ở đây khi có nơi tiêu thụ THẬT
 * (SPEC-SEMANTIC-MODEL §3 kỷ luật *ngữ nghĩa chỉ thêm khi có nơi tiêu thụ*), KHÔNG khai vống.
 */
export type FormKind = 'moodboard' | 'poles' | 'ba-hoi';

/** `assetKind` cho biết caller đang trỏ tới loại nào của asset — thêm nhánh sau bằng cách nới
 * literal type này (không phá contract vì extractor mặc định tự bỏ qua nhánh không quen). */
export type AssetKind = 'image' | 'material' | 'other';

export type ProvenanceInput =
  | { kind: 'image'; id: string; palette?: string[]; caption?: string; tags?: string[] }
  | { kind: 'text'; id: string; text: string; label?: string }
  | { kind: 'sticky'; id: string; text: string; author?: string; x?: number; y?: number }
  | {
      kind: 'form';
      id: string;
      formKind: FormKind;
      /** bản ghi mở — khoá là id trường form, giá trị là chuỗi đã điền (hoặc mảng chuỗi cho
       * ô nhiều lựa chọn). Không ép schema ở đây để mỗi khuôn form tự khai bên caller. */
      fields: Record<string, string | string[]>;
    }
  | {
      kind: 'asset';
      id: string;
      /** `image` → nuôi anhNguon · `material` → nuôi vatLieuMatId · `other` → không extractor mặc định. */
      assetKind?: AssetKind;
      /** nhãn hiển thị (ưu tiên hơn id khi rút vào lớp `anhNguon`). */
      label?: string;
      /** nguồn gốc thư viện (`'gallery'`, `'master-library'`, …) — chỉ để nhật ký/truy vết,
       * không ảnh hưởng logic extractor. */
      source?: string;
    };

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
