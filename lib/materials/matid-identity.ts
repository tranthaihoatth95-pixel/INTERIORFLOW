/**
 * lib/materials/matid-identity.ts — TÁCH NAMESPACE `matId` (UUID canonical) khỏi `sku` (business key).
 *
 * NGUỒN: Hoà chốt hòa giải Decision Conflict 19/08 — SUPERSEDES luật cũ 07/08 "matId = ProductSpec.sku".
 * Luật mới nguyên văn:
 *  · `matId` = IF-owned immutable UUID. Identity của MATERIAL, không phải business code.
 *  · `sku` = business/external key (mutable OK). ATLAS được phép sync đổi sku mà KHÔNG đổi matId.
 *  · KHÔNG được normalize UUID theo semantic của SKU rồi coi chúng là cùng namespace.
 *  · Tách rõ normalize/lookup cho UUID và business key.
 * Xem: docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md · frontier entry `material-matid-uuid`.
 *
 * VÌ SAO KHÔNG SỬA `lib/materials/pbr-store.ts:normalizeMatId` cũ (KS4 — LEGACY COMPAT WINDOW):
 *  · 4 call sites hiện tại đang giả định input là sku upper-normalized (chốt 07/08).
 *  · Đổi hành vi normalizeMatId cũ = phá contract với dữ liệu localStorage user đã có.
 *  · File này khai HÀM MỚI song song. Callsite chuyển đường từng bước, resolve.ts/pbr-store.ts
 *    sẽ cập nhật ở phiếu sau (SAU khi Hoà chạy Prisma migration ProductSpec.matId).
 *
 * THUẦN — không DOM/FS/network. Test độc lập bằng sucrase-node (matid-identity.test.ts).
 */

/**
 * Regex nhận diện UUID v4/v5 (bao cả v1-v8 vì Hoà chốt "IF-owned immutable UUID" không ràng version).
 * crypto.randomUUID() sinh v4 lowercase; nhận cả upper phòng khi copy-paste tay.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Detect input CÓ PHẢI UUID hợp lệ không.
 * True ⇒ đường canonical UUID (lowercase, không trim upper).
 * False ⇒ đường legacy business key (có thể là sku/code chốt 07/08 hoặc chuỗi khác).
 *
 * KHÔNG throw. Input rỗng/whitespace ⇒ false (không phải UUID).
 */
export function isMatIdUuid(input: string): boolean {
  if (typeof input !== 'string') return false;
  const trimmed = input.trim();
  return UUID_REGEX.test(trimmed);
}

/**
 * Normalize matId khi biết CHẮC là UUID canonical (theo luật mới 19/08).
 * Chỉ trim + lowercase — KHÔNG upperCase (khác `pbr-store.normalizeMatId` cũ).
 *
 * Lý do: UUID chuẩn RFC 4122 lowercase; upperCase làm hai hàm khác nhau ra cùng key
 * (UUID case-insensitive khi so sánh nhưng canonical form là lowercase).
 * Trim để chấp nhận input copy-paste có whitespace hai đầu.
 *
 * Gọi hàm này KHI input đã qua `isMatIdUuid()` = true.
 */
export function normalizeMatIdCanonical(matId: string): string {
  return matId.trim().toLowerCase();
}

/**
 * Normalize business key sku theo luật cũ 07/08 (upperCase + trim).
 * GIỮ NGUYÊN semantic của `pbr-store.normalizeMatId` cũ — tách riêng để callsite gọi ĐÚNG hàm
 * cho ĐÚNG loại input, không lẫn UUID vào đường sku.
 *
 * Dùng cho matchSpec, resolve legacy `.idfc` có matId=sku, tra bảng mapping sku→UUID.
 */
export function normalizeSkuBusinessKey(sku: string): string {
  return sku.trim().toUpperCase();
}

/**
 * Bảng mapping sku (legacy) → matId (UUID canonical).
 * Dùng cho LEGACY COMPAT WINDOW: khi input là sku (chốt 07/08) cần resolve về canonical UUID.
 *
 * Nguồn dữ liệu:
 *  · ProductSpec.matId (sau backfill Prisma migration) — 1 sku ↔ 1 matId qua ProductSpec row.
 *  · localStorage `if.materials.pbr-migration.v1` (chưa tồn tại, tạo lần backfill đầu tiên) —
 *    cache user's PBR đã đặt cho sku legacy trước khi backfill chạy.
 *
 * Contract: caller tự nạp map từ nguồn. Hàm này chỉ TRA, không tự đọc DB/localStorage.
 */
export type SkuToMatIdMapping = ReadonlyMap<string, string>;

/**
 * Resolve input matId về canonical UUID lowercase.
 *
 * Đường đi:
 *  1. Nếu input đã là UUID hợp lệ → normalize canonical (lowercase) và trả về.
 *  2. Nếu input là sku (không UUID) → tra `mapping[normalizeSkuBusinessKey(input)]` → nếu có
 *     mapping thì trả canonical UUID; nếu không có → trả `null` (không fabricate).
 *
 * KHÔNG throw. `null` là kết quả HỢP LỆ — caller biết "không map được, không lookup được" và
 * xử lý phù hợp (báo LỖ, không bịa).
 *
 * VÌ SAO trả `null` thay vì trả input raw:
 *  · Nếu caller là `getPbr()` — trả raw sku vào pbrMap sẽ tìm bằng normalize sai (upper vs lower).
 *  · Trả `null` ép caller quyết định: dùng đường legacy `pbr-store.normalizeMatId` (giả định input
 *    là sku) hoặc báo LỖ user.
 */
export function resolveInputMatId(input: string, mapping: SkuToMatIdMapping): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;
  if (isMatIdUuid(input)) return normalizeMatIdCanonical(input);
  const skuKey = normalizeSkuBusinessKey(input);
  return mapping.get(skuKey) ?? null;
}

/**
 * Sinh matId mới (UUID v4) — dùng cho ATLAS upsert lần đầu hoặc UI tạo material tay.
 * Wrapper mỏng quanh crypto.randomUUID() để (a) dễ mock trong test, (b) 1 chỗ duy nhất
 * kiểm sự tồn tại của crypto.randomUUID trên runtime hiện tại.
 *
 * ⚠️ crypto.randomUUID() có ở Node ≥ 14.17 và mọi browser hiện đại. Nếu Electron target
 * dùng Node cũ hơn thì cần polyfill — nhưng repo hiện dùng Node 20+ (package.json engines
 * chưa khai nhưng scripts đo bằng Node 20+), OK.
 */
export function generateMatId(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('crypto.randomUUID không có trên runtime này — cần polyfill');
  }
  return globalThis.crypto.randomUUID();
}
