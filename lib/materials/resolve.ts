/**
 * lib/materials/resolve.ts — HÀM ĐỌC HỢP NHẤT ba mảnh của MỘT vật liệu (P13 VIỆC 2, nền cho
 * PHẦN B VIỆC 5/6): trước 07/08 ba mảnh không sợi dây nào nối (G-M17-01 — grep "ProductSpec"
 * lib/materials = 2 dòng comment, 0 code). Khoá nối = **matId = `ProductSpec.sku`** (mã ATLAS
 * "Mã vật liệu" — tái dùng, không đẻ hệ mã thứ hai; xem docstring `pbr-store.ts`).
 *
 *   ① THỊ GIÁC   `MaterialPbr`   — kho PBR theo matId (`pbr-store.ts`, studio/localStorage)
 *   ② THƯƠNG MẠI `ProductSpec`   — DB, đọc qua `/api/specs` (caller fetch rồi đưa vào đây)
 *   ③ 2D         `MaterialDef`   — preset hatch `lib/cad/materials.ts`, nối qua field `matId` mới
 *
 * Mảnh nào thiếu ⇒ trả `null` CHO MẢNH ĐÓ — không throw, không bịa mặc định (phiếu ghi rõ).
 * Ba mảnh giữ nguyên vai trò (luật 2.1.9.i), đây chỉ là DÂY — hàm THUẦN, mọi nguồn dữ liệu tiêm
 * qua tham số (test không cần DB/localStorage; caller UI tự đưa specs đã fetch + pbrMap đã load).
 */
import type { MaterialPbr } from './schema';
import type { MaterialDef } from '../cad/materials';
import { MATERIALS } from '../cad/materials';
import { normalizeMatId } from './pbr-store';

/** Mặt THƯƠNG MẠI tối thiểu mà resolve cần — shape con của `MaterialSpecDto`/`ProductSpec`
 * (structural typing: DTO thật gán thẳng được, test dựng object gọn được). */
export interface CommercialFacet {
  sku: string | null;
  name: string;
  vendor?: string | null;
  brand?: string | null;
  unit?: string | null;
  priceVnd?: number | string | null;
  wastagePercent?: number | string | null;
  packagingSpec?: string | null;
}

export interface MaterialFacets {
  matId: string;
  /** ① render PBR — null = chưa ai đặt/suy cho mã này */
  pbr: MaterialPbr | null;
  /** ② giá/đơn vị/NCC — null = DB không có `sku` khớp mã này */
  commercial: CommercialFacet | null;
  /** ③ preset hatch 2D — null = chưa preset nào khai `matId` này */
  flat: MaterialDef | null;
}

export interface MaterialSources {
  /** kho PBR đã load (vd `loadPbrMap()`) — khoá đã hoặc chưa chuẩn hoá đều nhận */
  pbrMap?: Record<string, MaterialPbr>;
  /** danh sách spec đã fetch (vd `GET /api/specs` → `j.specs`) */
  specs?: readonly CommercialFacet[];
  /** preset 2D — mặc định `MATERIALS` của app */
  defs?: readonly MaterialDef[];
}

export function getMaterial(matId: string, sources: MaterialSources = {}): MaterialFacets {
  const key = normalizeMatId(matId);
  const pbrMap = sources.pbrMap ?? {};
  const pbr = pbrMap[key] ?? pbrMap[matId] ?? null;
  const specs = sources.specs ?? [];
  const commercial = specs.find((s) => s.sku != null && normalizeMatId(s.sku) === key) ?? null;
  const defs = sources.defs ?? MATERIALS;
  const flat = defs.find((d) => d.matId != null && normalizeMatId(d.matId) === key) ?? null;
  return { matId: key, pbr, commercial, flat };
}
