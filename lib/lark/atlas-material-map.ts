/**
 * lib/lark/atlas-material-map.ts — 2.1.9.r (30/07): ánh xạ 1 record ATLAS Material Library
 * (Lark Bitable) → dữ liệu upsert `ProductSpec{kind:'material'}` (mở rộng 30/07 cho BOQ — xem
 * `prisma/schema.prisma`, KHÔNG bảng `AtlasMaterial` riêng, đã chốt với Hoà: Luật Đồng Bộ #6).
 *
 * ⚠️ TÊN CỘT (`ATLAS_FIELD_NAMES`) CHƯA XÁC MINH — khác hẳn `lib/integrations/providers/lark.ts`
 * (task/HR: đã verify field_name thật qua MCP `list_tables`, xem docs/INTEGRATIONS.md). ATLAS
 * Material Library CHƯA từng nối route đọc thật (blocked — thiếu `LARK_ATLAS_MATERIAL_TABLE_ID`
 * + 3 khoá Lark trong `.env.local`). Tên cột dưới đây là PLACEHOLDER theo đúng thuật ngữ Hoà dùng
 * khi mô tả yêu cầu (`docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §2③ + tin nhắn 30/07 khuya) —
 * PHẢI đối chiếu lại bằng `list_tables`/`list_fields` thật trước khi chạy sync thật lần đầu.
 * `raw` (JSON toàn bộ field gốc) LUÔN được lưu — sai tên cột thì sửa map này rồi re-sync lại
 * được ngay, không mất dữ liệu gốc (đúng mẫu `LarkTaskRef`/`LarkPersonRef`).
 */
import { textOf, numberOf, type LarkRecord } from '../integrations/providers/lark';

export const ATLAS_FIELD_NAMES = {
  name: 'Tên vật liệu',
  category: 'Danh mục',
  unit: 'Đơn vị',
  priceVnd: 'Giá tham khảo',
  wastagePercent: 'Hao hụt %',
  packagingSpec: 'Quy cách',
  altSku: 'Mã thay thế',
  vendor: 'Nhà cung cấp',
  sku: 'Mã vật liệu',
  styleTags: 'Style tag',
} as const;

export interface AtlasMaterialUpsertData {
  kind: 'material';
  name: string;
  vendor: string | null;
  sku: string | null;
  unit: string | null;
  priceVnd: number | null;
  wastagePercent: number | null;
  packagingSpec: string | null;
  altSku: string | null;
  styleTags: string;
  larkRecordId: string;
  raw: string;
  syncedAt: Date;
}

/** JSON string[] — cùng mẫu `materials`/`finishes` sẵn có trên `ProductSpec`. Chuỗi rỗng/trắng bỏ qua. */
function styleTagsJson(raw: string): string {
  const tags = raw
    .split(/[,·|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(tags);
}

/**
 * Thuần — không đụng FS/network/Prisma, test được trực tiếp bằng fixture giả lập (xem
 * `atlas-material-map.test.ts`). `record.fields` thiếu/rỗng ở field nào → field ProductSpec
 * tương ứng ra `null`/rỗng, KHÔNG đoán/bịa giá trị mặc định (đúng luật "chưa có giá thì hiện rõ,
 * không bỏ qua, không đoán" Hoà nhắc khi mở rộng schema).
 */
export function mapAtlasRecordToProductSpec(record: LarkRecord, syncedAt: Date): AtlasMaterialUpsertData {
  const f = record.fields;
  return {
    kind: 'material',
    name: textOf(f[ATLAS_FIELD_NAMES.name]),
    vendor: textOf(f[ATLAS_FIELD_NAMES.vendor]) || null,
    sku: textOf(f[ATLAS_FIELD_NAMES.sku]) || null,
    unit: textOf(f[ATLAS_FIELD_NAMES.unit]) || null,
    priceVnd: numberOf(f[ATLAS_FIELD_NAMES.priceVnd]),
    wastagePercent: numberOf(f[ATLAS_FIELD_NAMES.wastagePercent]),
    packagingSpec: textOf(f[ATLAS_FIELD_NAMES.packagingSpec]) || null,
    altSku: textOf(f[ATLAS_FIELD_NAMES.altSku]) || null,
    styleTags: styleTagsJson(textOf(f[ATLAS_FIELD_NAMES.styleTags])),
    larkRecordId: record.record_id,
    raw: JSON.stringify(f),
    syncedAt,
  };
}
