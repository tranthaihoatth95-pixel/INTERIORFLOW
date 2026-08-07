/**
 * lib/server/specs.ts — helper dùng chung cho app/api/specs/* (Hệ Legend X1).
 * Tách khỏi route.ts vì Next chỉ cho route file export HTTP method — helper chung để đây.
 */

export const SPEC_KINDS = ['furniture', 'material', 'lighting', 'millwork', 'fixture'] as const;

/**
 * ⛔ CỜ CHẶN — `ProductSpec.room` / `ProductSpec.confidence` (06/08, G-M3-08).
 *
 * Hai cột ĐÃ khai trong `prisma/schema.prisma` nhưng **chưa migrate**: sandbox không khoá được
 * file SQLite và có phiên khác đang chạy dev server trên cùng `dev.db`, nên `prisma migrate` phải
 * do chủ dự án chạy tay trên máy thật (lệnh soạn sẵn trong báo cáo phiên 06/08). Prisma client
 * vì thế CHƯA biết hai cột đó.
 *
 * Hệ quả bắt buộc, đừng bỏ qua: mọi `prisma.productSpec.create/update/findMany({ where: { room }})`
 * có nhắc tới `room`/`confidence` sẽ (a) vỡ `tsc` vì client chưa generate, và (b) làm hỏng MỌI
 * truy vấn ProductSpec của các phiên khác đang chạy. Vì vậy `specNormalize`/`specPatch`/`specToDto`
 * dưới đây **cố ý KHÔNG đụng tới hai trường này** — không phải quên.
 *
 * Trong lúc chờ: cửa nhập bảng giữ `room`/`confidence` trong `FfeTable` (`lib/ffe/item.ts` —
 * dữ liệu chạy trong app + file dự án), xem `lib/materials/warehouse/apply-import.ts`.
 *
 * KHI NÀO BẬT: sau khi chủ dự án chạy migrate xong + `prisma generate`, đổi cờ này thành `true`
 * rồi thêm `room: str(b.room)` / `confidence: str(b.confidence)` vào `specNormalize` + `specPatch`,
 * và 2 dòng tương ứng vào `specToDto`. Chưa migrate mà bật cờ = vỡ ngay ở lần ghi đầu tiên.
 *
 * ✅ ĐÃ MỞ KHOÁ 06/08 — chủ dự án chạy `prisma db push` + `prisma generate` trên máy thật.
 * Kiểm bằng dữ liệu, không bằng lời khai:
 *   `PRAGMA table_info(ProductSpec)` → **34 cột, có `room` và `confidence`**.
 * Cờ đổi sang `true`; ba đường (`specNormalize` · `specPatch` · `specToDto`) đã nối hai trường.
 */
export const SPEC_ROOM_COLUMN_READY = true;

export function specSafeArr(s: string): string[] {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Kiểu cấu trúc tối thiểu cho Decimal Prisma (priceVnd/wastagePercent) — KHÔNG import
 * `@prisma/client` vào file này (giữ đúng phong cách duck-typing sẵn có, file này vốn 0 import) —
 * `Prisma.Decimal` có `.toString()` nên `Number(...)` convert đúng, tránh sai số nhị phân của
 * việc tự parse chuỗi. */
type DecimalLike = { toString(): string } | number | string;

/** Serialize 1 row Prisma cho client — materials/finishes JSON string → mảng an toàn.
 * 02/08 BOQ ENGINE — vá gap: 6 field 2.1.9.r (unit/priceVnd/wastagePercent/packagingSpec/
 * altSku/styleTags) đã có trong Prisma schema từ 30/07 nhưng DTO này CHƯA trả — nghĩa là
 * GET /api/specs?kind=material không có giá dù DB đã có (Atlas sync ghi đúng, chỉ đường ĐỌC
 * thiếu). BOQ engine (lib/boq/) cần priceVnd/wastagePercent thật từ API này nên vá tại đây,
 * KHÔNG đụng specNormalize/specPatch (ghi ProductSpec đi qua Lark sync — atlas-materials/sync —
 * không qua POST/PATCH tay, xem lib/lark/atlas-material-map.ts). */
export function specToDto(s: {
  id: string; kind: string; name: string; nameEn: string | null; brand: string | null;
  sku: string | null; vendor: string | null; w: number | null; d: number | null; hUp: number | null;
  materials: string; finishes: string; colorHex: string | null; imageAssetId: string | null;
  drawingBlock: string | null; priceNote: string | null; currency: string | null; note: string | null;
  larkRecordId: string | null; createdAt: Date; syncedAt: Date | null;
  unit?: string | null; priceVnd?: DecimalLike | null; wastagePercent?: DecimalLike | null;
  packagingSpec?: string | null; altSku?: string | null; styleTags?: string | null;
  scope?: string; ownerId?: string | null; supplierId?: string | null; verified?: boolean;
  room?: string | null; confidence?: string | null;
}) {
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    nameEn: s.nameEn,
    brand: s.brand,
    sku: s.sku,
    vendor: s.vendor,
    w: s.w,
    d: s.d,
    hUp: s.hUp,
    materials: specSafeArr(s.materials),
    finishes: specSafeArr(s.finishes),
    colorHex: s.colorHex,
    imageAssetId: s.imageAssetId,
    drawingBlock: s.drawingBlock,
    priceNote: s.priceNote,
    currency: s.currency,
    note: s.note,
    larkRecordId: s.larkRecordId,
    createdAt: s.createdAt,
    syncedAt: s.syncedAt,
    // ── 2.1.9.r (vá 02/08) ──
    unit: s.unit ?? null,
    priceVnd: s.priceVnd == null ? null : Number(s.priceVnd),
    wastagePercent: s.wastagePercent == null ? null : Number(s.wastagePercent),
    packagingSpec: s.packagingSpec ?? null,
    altSku: s.altSku ?? null,
    styleTags: specSafeArr(s.styleTags ?? ''),
    // ── Kho vật liệu IF v1 VIỆC 1 (04/08, `docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`) — vá tại đây
    // theo ĐÚNG lý do đã ghi ở khối trên: cột đã có trong Prisma schema từ trước, DTO chưa trả.
    // VIỆC 1 CHỈ khai cột (chưa code chức năng global) — VIỆC 3 (màn quản lý) là nơi tiêu thụ
    // ĐẦU TIÊN, nên vá đường ĐỌC ở đây trước khi màn quản lý cần tới.
    scope: s.scope ?? 'studio',
    ownerId: s.ownerId ?? null,
    supplierId: s.supplierId ?? null,
    verified: s.verified ?? false,
    // G-M3-08 (mở khoá 06/08) — đường ĐỌC cho phòng/khu vực + độ tin cậy. Nơi tiêu thụ: bảng
    // FF&E theo phòng và thống kê "phòng này gồm những món nào" (đúng K4 — có nơi tiêu thụ mới thêm).
    room: s.room ?? null,
    confidence: s.confidence ?? null,
  };
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);
const arr = (v: unknown) =>
  JSON.stringify(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
/** Decimal (priceVnd) — Prisma Decimal field nhận number/string trực tiếp, KHÔNG cần import
 * `Prisma.Decimal` (đúng phong cách duck-typing sẵn có của file này). Chuỗi có dấu phẩy thập
 * phân kiểu VN ("1250000,50") được đổi sang dấu chấm trước khi ép số. */
const dec = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** Ép field body POST về đúng kiểu cột — bỏ qua field lạ (không mass-assign).
 * `ownerId` KHÔNG đọc từ body (client không được tự khai chủ sở hữu) — luôn là user đang đăng
 * nhập, đúng ngữ nghĩa VIỆC 1 (`ownerId = null` ⇒ kho chung, CHƯA code ở đợt này). `scope` cũng
 * ép cứng `'studio'` — tầng `'global'` chưa có UI/luật duyệt, không cho client tự đặt. */
export function specNormalize(b: Record<string, unknown>, kind: string, name: string, ownerId: string) {
  return {
    kind,
    name,
    nameEn: str(b.nameEn),
    brand: str(b.brand),
    sku: str(b.sku),
    vendor: str(b.vendor),
    w: int(b.w),
    d: int(b.d),
    hUp: int(b.hUp),
    materials: arr(b.materials),
    finishes: arr(b.finishes),
    colorHex: str(b.colorHex),
    imageAssetId: str(b.imageAssetId),
    drawingBlock: str(b.drawingBlock),
    priceNote: str(b.priceNote),
    currency: str(b.currency),
    note: str(b.note),
    unit: str(b.unit),
    priceVnd: dec(b.priceVnd),
    supplierId: str(b.supplierId),
    // G-M3-08 (mở khoá 06/08) — phòng/khu vực + độ tin cậy. Chuỗi tự do, KHÔNG ép enum:
    // nhãn phòng lấy theo bản vẽ của từng hồ sơ, ép enum là rớt dữ liệu người dùng.
    room: str(b.room),
    confidence: str(b.confidence),
    scope: 'studio',
    ownerId,
  };
}

/** Patch PATCH — CHỈ field có mặt trong body mới được sửa (partial update). `scope`/`ownerId`
 * KHÔNG sửa được qua đây (chuyển chủ sở hữu không phải tính năng đợt này). */
export function specPatch(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  // `room` + `confidence` thêm 06/08 (G-M3-08 mở khoá) — cùng nhóm chuỗi, không cần nhánh riêng.
  const strKeys = ['nameEn', 'brand', 'sku', 'vendor', 'colorHex', 'imageAssetId', 'drawingBlock', 'priceNote', 'currency', 'note', 'unit', 'supplierId', 'room', 'confidence'];
  for (const k of strKeys) if (k in b) out[k] = str(b[k]);
  for (const k of ['w', 'd', 'hUp']) if (k in b) out[k] = int(b[k]);
  if ('priceVnd' in b) out.priceVnd = dec(b.priceVnd);
  for (const k of ['materials', 'finishes']) if (k in b) out[k] = arr(b[k]);
  if (typeof b.name === 'string' && b.name.trim()) out.name = b.name.trim();
  if (typeof b.kind === 'string' && (SPEC_KINDS as readonly string[]).includes(b.kind)) out.kind = b.kind;
  return out;
}
