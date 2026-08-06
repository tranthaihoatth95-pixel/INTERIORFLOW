/**
 * lib/materials/warehouse/dto.ts — Kho vật liệu IF v1 (`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`
 * VIỆC 3/4). Đặt trong `lib/materials/warehouse/` (subfolder), KHÔNG rải file phẳng chung với
 * `lib/materials/schema.ts` (matId PBR) — 2 khái niệm khác nhau, `lib/cad/materials.ts` đã chốt
 * luật 2.1.9.i 30/07: "MaterialDef=thị giác, ProductSpec=thương mại, cố ý không trộn". Domain
 * này (VIỆC 3/4) là THƯƠNG MẠI — giá/hãng/kho/nhập Excel — nằm cạnh chứ không trộn với PBR.
 */

/** Khớp shape trả về của `specToDto()` (lib/server/specs.ts) — chỉ khai lại phần UI cần. */
export interface MaterialSpecDto {
  id: string;
  kind: string;
  name: string;
  nameEn: string | null;
  brand: string | null;
  sku: string | null;
  vendor: string | null;
  w: number | null;
  d: number | null;
  hUp: number | null;
  colorHex: string | null;
  imageAssetId: string | null;
  priceNote: string | null;
  currency: string | null;
  note: string | null;
  larkRecordId: string | null;
  createdAt: string;
  unit: string | null;
  priceVnd: number | null;
  scope: string;
  ownerId: string | null;
  supplierId: string | null;
  verified: boolean;
}

/** "Nguồn" (cột phiếu VIỆC 3) — suy từ dữ liệu có sẵn, KHÔNG thêm cột DB mới (VIỆC 1 chỉ khai
 * đúng 4 cột). `larkRecordId` có giá trị ⇒ bản ghi đến từ ATLAS/Larkbase (sync 1 chiều, sửa tay
 * ở đây vẫn được nhưng gốc là Lark); ngược lại là do studio tự nhập (tay hoặc nhập Excel — 2 lối
 * vào NHƯNG cùng kết quả "studio tự quản", không có field nào phân biệt sâu hơn ở schema hiện
 * tại nên không giả vờ phân biệt được). */
export function materialSourceLabel(m: Pick<MaterialSpecDto, 'larkRecordId'>): { vi: string; en: string } {
  return m.larkRecordId
    ? { vi: 'ATLAS · Lark', en: 'ATLAS · Lark' }
    : { vi: 'Studio tự nhập', en: 'Studio-entered' };
}

/** "Kích thước" gộp 1 chuỗi hiển thị w×d×hUp (mm) — bỏ chiều nào thiếu, '—' nếu thiếu cả 3. */
export function dimensionLabel(m: Pick<MaterialSpecDto, 'w' | 'd' | 'hUp'>): string {
  const parts = [m.w, m.d, m.hUp].filter((n): n is number => typeof n === 'number' && n > 0);
  if (parts.length === 0) return '—';
  return `${m.w ?? '?'}×${m.d ?? '?'}×${m.hUp ?? '?'} mm`;
}

export function imageUrlOf(m: Pick<MaterialSpecDto, 'imageAssetId'>): string | null {
  return m.imageAssetId ? `/api/library/${m.imageAssetId}/file` : null;
}

/** Payload gửi lên POST/PATCH /api/specs từ form tay HOẶC 1 dòng Excel đã ghép cột.
 * 06/08 (G-M3-05): thêm `materials`/`finishes`/`colorHex` — 3 cột đã có sẵn trong
 * `prisma/schema.prisma` model `ProductSpec` và `specNormalize()` đã biết ép kiểu chúng
 * (`arr()`/`str()`), chỉ là DTO của cửa nhập chưa khai nên không gửi lên bao giờ. */
export interface MaterialWritePayload {
  name: string;
  sku?: string;
  brand?: string;
  vendor?: string;
  w?: number;
  d?: number;
  hUp?: number;
  unit?: string;
  priceVnd?: number;
  currency?: string;
  note?: string;
  imageAssetId?: string;
  supplierId?: string;
  materials?: string[];
  finishes?: string[];
  colorHex?: string;
}

/**
 * Loại bản ghi chọn được trên cửa nhập (G-M3-07). Danh sách LẤY TỪ `SPEC_KINDS`
 * (`lib/server/specs.ts` — nguồn sự thật, cùng thứ API kiểm ở POST /api/specs), KHÔNG chép tay
 * lại: chép tay là chỗ đẻ ra ca "UI cho chọn nhưng server trả 400".
 * `lib/server/specs.ts` không import gì cả (file 0-dependency, có ghi trong docblock của nó) nên
 * kéo vào phía client an toàn, không lôi theo prisma/next.
 */
export const IMPORT_KIND_LABEL: Record<string, { vi: string; en: string }> = {
  material: { vi: 'Vật liệu', en: 'Material' },
  furniture: { vi: 'Nội thất rời', en: 'Furniture' },
  lighting: { vi: 'Đèn', en: 'Lighting' },
  millwork: { vi: 'Đồ gỗ đóng', en: 'Millwork' },
  fixture: { vi: 'Thiết bị gắn cố định', en: 'Fixture' },
};
