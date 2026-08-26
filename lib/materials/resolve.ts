/**
 * lib/materials/resolve.ts — HÀM ĐỌC HỢP NHẤT ba mảnh của MỘT vật liệu (P13 VIỆC 2, nền cho
 * PHẦN B VIỆC 5/6): trước 07/08 ba mảnh không sợi dây nào nối (G-M17-01 — grep "ProductSpec"
 * lib/materials = 2 dòng comment, 0 code).
 *
 * ⚡ [marker: vatLieuBaMat] IDENTITY BƯỚC 2A (19/08) — thi hành luật hòa giải: matId nay là
 * IF-owned immutable UUID, KHÔNG còn = ProductSpec.sku. Hai đường lookup TÁCH RIÊNG, không lẫn:
 *   · input LÀ UUID (`isMatIdUuid`)   → đường CHÍNH, tra qua `ProductSpec.matId` canonical.
 *   · input KHÔNG PHẢI UUID           → đường LEGACY COMPAT, tra như sku cũ (chốt 07/08, giữ
 *     nguyên hành vi cho callsite chưa migrate — `MaterialsScreen.tsx`, `ngan-tho.ts` hiện gọi
 *     `getMaterial(m.sku, …)`, vẫn phải chạy đúng như trước).
 * Namespace mới ở `lib/materials/matid-identity.ts` (isMatIdUuid + normalizeMatIdCanonical +
 * normalizeSkuBusinessKey). KHÔNG dùng `pbr-store.normalizeMatId` (upper-case) cho UUID — UUID
 * canonical là LOWERCASE (RFC 4122), upper-case hai chữ khác nhau lại ra "khớp" giả.
 *
 * `matchSpec()` (`lib/library/spec-panel.ts`, 2D CAD item.code ↔ ProductSpec.sku) là MỘT HÀM
 * KHÁC, ngoài phạm vi file này — nó tra business key cho legend/schedule, không phải identity
 * vật liệu. Xem đính chính 19/08 tại `lib/cad/library-item-resolve.ts:128`.
 *
 * LỊCH SỬ (07/08, nay lỗi thời): "Khoá nối = matId = ProductSpec.sku (mã ATLAS 'Mã vật liệu' —
 * tái dùng, không đẻ hệ mã thứ hai)". Xem frontier `material-matid-uuid` + ADR-Q0.
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
import { isMatIdUuid, normalizeMatIdCanonical, normalizeSkuBusinessKey } from './matid-identity';

/** Mặt THƯƠNG MẠI tối thiểu mà resolve cần — shape con của `MaterialSpecDto`/`ProductSpec`
 * (structural typing: DTO thật gán thẳng được, test dựng object gọn được). */
export interface CommercialFacet {
  sku: string | null;
  /** IF-owned immutable UUID (19/08) — `undefined` khi caller đưa spec object cũ chưa khai
   * field này (test/legacy); `null` khi ProductSpec THẬT nhưng chưa backfill. Cả hai coi như
   * "chưa có matId" — đường CHÍNH ở dưới chỉ khớp khi field này là chuỗi UUID hợp lệ. */
  matId?: string | null;
  name: string;
  vendor?: string | null;
  brand?: string | null;
  unit?: string | null;
  priceVnd?: number | string | null;
  wastagePercent?: number | string | null;
  packagingSpec?: string | null;
}

export interface MaterialFacets {
  /** input đã chuẩn hoá ĐÚNG NAMESPACE của nó — UUID canonical (lowercase) nếu input là UUID,
   * ngược lại là sku chuẩn hoá (trim+upper, giữ nguyên thuật toán legacy). KHÔNG BAO GIỜ là một
   * UUID giả dựng từ sku — hai namespace tách biệt, xem `resolvedVia`. */
  matId: string;
  /** 'uuid' = input là UUID canonical, tra qua field mới `ProductSpec.matId` (đường CHÍNH, hậu
   *  Slice 1A). 'legacy-sku' = input không phải UUID, tra như business key `sku` cũ (đường LEGACY
   *  COMPAT WINDOW — sống cho tới khi mọi callsite migrate sang truyền UUID thật). */
  resolvedVia: 'uuid' | 'legacy-sku';
  /** ① render PBR — null = chưa ai đặt/suy cho mã này */
  pbr: MaterialPbr | null;
  /** ② giá/đơn vị/NCC — null = DB không có bản ghi khớp mã này (theo đúng đường resolvedVia) */
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

/**
 * Đọc ba mảnh của MỘT vật liệu theo `input` — nhận CẢ HAI dạng, tự phân đường bằng `isMatIdUuid`:
 *   · UUID thật        → đường CHÍNH (`resolvedVia: 'uuid'`), tra `CommercialFacet.matId` /
 *     `MaterialDef.matId` sau khi cùng chuẩn hoá canonical (lowercase, KHÔNG upper).
 *   · Bất kỳ chuỗi nào khác (sku cũ, mã preset cũ…) → đường LEGACY (`resolvedVia: 'legacy-sku'`),
 *     tra `sku`/`MaterialDef.matId` sau khi chuẩn hoá theo thuật toán sku cũ (trim+upper) — Y HỆT
 *     hành vi trước 19/08, không phá callsite chưa migrate.
 * KHÔNG BAO GIỜ tự coi input là UUID khi nó không đúng định dạng UUID (cấm "giả sku thành UUID").
 */
export function getMaterial(input: string, sources: MaterialSources = {}): MaterialFacets {
  const pbrMap = sources.pbrMap ?? {};
  const specs = sources.specs ?? [];
  const defs = sources.defs ?? MATERIALS;

  if (isMatIdUuid(input)) {
    const canonical = normalizeMatIdCanonical(input);
    const pbr = pbrMap[canonical] ?? null;
    const commercial =
      specs.find((s) => typeof s.matId === 'string' && normalizeMatIdCanonical(s.matId) === canonical) ?? null;
    const flat =
      defs.find((d) => d.matId != null && isMatIdUuid(d.matId) && normalizeMatIdCanonical(d.matId) === canonical) ??
      null;
    return { matId: canonical, resolvedVia: 'uuid', pbr, commercial, flat };
  }

  // Đường LEGACY COMPAT — giữ nguyên thuật toán trước 19/08 (trim+upper, tra theo sku).
  const key = normalizeSkuBusinessKey(input);
  const pbr = pbrMap[key] ?? pbrMap[input] ?? null;
  const commercial = specs.find((s) => s.sku != null && normalizeSkuBusinessKey(s.sku) === key) ?? null;
  const flat = defs.find((d) => d.matId != null && normalizeSkuBusinessKey(d.matId) === key) ?? null;
  return { matId: key, resolvedVia: 'legacy-sku', pbr, commercial, flat };
}
