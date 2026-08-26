/**
 * lib/materials/pbr-store.ts — KHO PBR THEO matId, tầng STUDIO (localStorage), VIỆC 5 PHẦN B 07/08.
 *
 * VÌ SAO localStorage chứ không cột DB: `ProductSpec` là bảng THƯƠNG MẠI — nhồi PBR vào là phá
 * luật 2.1.9.i (30/07, đã chốt); còn thêm bảng/cột mới thì dẫm đúng quả mìn migrate đang treo
 * (2 cột `room`/`confidence` chưa `db push`, xem cảnh báo đỏ trong `prisma/schema.prisma` — thêm
 * cột nữa lúc này là chồng mìn). Mẫu "studio = localStorage" đi theo `lib/colors/store.ts`
 * (05/08) đã chạy thật. Khi Hoà chạy migrate xong, dời kho này lên server là việc RIÊNG — hình
 * dạng dữ liệu (Record<matId, MaterialPbr>) giữ nguyên, chỉ đổi chỗ đặt.
 *
 * KHOÁ = matId. ⚠️ SUPERSEDED 19/08 — Hoà chốt hòa giải Decision Conflict: matId nay là
 * IF-owned immutable UUID, KHÔNG còn = ProductSpec.sku. sku giữ vai business/external key
 * (mutable qua ATLAS sync). Xem: `lib/materials/matid-identity.ts` (namespace mới tách UUID vs
 * sku, KHÔNG lẫn) + frontier `material-matid-uuid` + docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.
 * HÀM CŨ trong file này GIỮ NGUYÊN hành vi (KS4 legacy compat window) — callsite migrate dần khi
 * Hoà chạy Prisma migration ProductSpec.matId. KHÔNG đổi normalizeMatId cũ (upper+trim) lúc này
 * vì dữ liệu localStorage user hiện tại đang giả định semantic đó.
 *
 * LỊCH SỬ (07/08, nay lỗi thời): "matId của IF CHÍNH LÀ ProductSpec.sku (cột 'Mã vật liệu' ATLAS)
 * — TÁI DÙNG mã ATLAS sẵn có, không đẻ hệ mã thứ hai (phiếu P13 VIỆC 1)". Giữ ghi để phiên sau
 * biết vì sao code cũ hoạt động như hiện tại.
 */
import type { MaterialPbr } from './schema';
import { normalizeMatIdCanonical } from './matid-identity';

const LS_KEY = 'if.materials.pbr.v1';

/** Chuẩn hoá matId trước khi làm khoá — cùng phép so `sku` nơi khác: trim + UPPER (mã ATLAS viết
 * hoa, người gõ tay hay lẫn thường). */
export function normalizeMatId(matId: string): string {
  return matId.trim().toUpperCase();
}

export function loadPbrMap(): Record<string, MaterialPbr> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, MaterialPbr>) : {};
  } catch {
    return {}; // JSON hỏng — coi như kho rỗng, KHÔNG throw giữa render
  }
}

export function getPbr(matId: string): MaterialPbr | null {
  return loadPbrMap()[normalizeMatId(matId)] ?? null;
}

export function savePbr(matId: string, pbr: MaterialPbr): void {
  if (typeof window === 'undefined') return;
  const map = loadPbrMap();
  map[normalizeMatId(matId)] = pbr;
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}

/** Xoá bản chỉnh của 1 matId (KS4 — lùi về "chưa có PBR", suy đoán lại từ danh mục nếu cần). */
export function removePbr(matId: string): void {
  if (typeof window === 'undefined') return;
  const map = loadPbrMap();
  delete map[normalizeMatId(matId)];
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}

/**
 * ⚡ [marker: vatLieuBaMat] MIGRATION HELPER `if.materials.pbr.v1` — copy PBR đã đặt dưới khoá
 * SKU cũ (`normalizeMatId`, upper+trim) sang khoá UUID canonical mới (`normalizeMatIdCanonical`,
 * lowercase), cho MỌI `ProductSpec` đã có ĐỦ cả `sku` lẫn `matId` (đã backfill). Không đây thì
 * người dùng đã bỏ công đặt độ nhám/kim loại/ảnh vân cho một mã, xong app đổi khoá đọc sang UUID
 * (bước 2B cắm resolver) là mất trắng công đó ở mắt người dùng — trong khi dữ liệu vẫn còn
 * nguyên dưới khoá cũ. Đây là "đoạn dây cuối" nối khoá cũ → khoá mới, KHÔNG phải nguồn dữ liệu
 * mới.
 *
 * HÀNH VI (đọc kỹ trước khi gọi):
 *  · `legacyKey = normalizeMatId(sku)` — CÙNG thuật toán pbr-store cũ đang dùng (không đổi).
 *  · `canonicalKey = normalizeMatIdCanonical(matId)` — LOWERCASE, KHÔNG upper (khác legacyKey).
 *  · Có PBR ở `legacyKey` MÀ CHƯA có ở `canonicalKey` ⇒ COPY giá trị sang `canonicalKey`.
 *  · Đã có PBR ở `canonicalKey` ⇒ CANONICAL THẮNG, không ghi đè (idempotent tự nhiên — chạy lại
 *    nhiều lần không đổi kết quả, không cần version marker riêng).
 *  · `legacyKey` KHÔNG BAO GIỜ bị xoá trong cửa sổ migration này — callsite cũ còn đọc/ghi qua
 *    `getPbr`/`savePbr` (khoá SKU) cho tới khi TỰ chúng migrate sang gọi bằng UUID.
 *
 * THUẦN — nhận `Record<matId, MaterialPbr>` vào, trả bản mới ra (KHÔNG tự đọc/ghi localStorage).
 * Callsite (phiếu sau — cắm vào `loadPbrMap()`/`savePbr()` thật, quyết định KHI NÀO chạy) tự
 * quyết lifecycle: `migratePbrLegacyToCanonical(loadPbrMap(), specs)` rồi tự ghi lại nếu muốn.
 * File này KHÔNG tự chạy global migration — chưa xác định callsite đúng (chờ bước 2B).
 */
export interface PbrMigrationSpec {
  /** business key cũ — nguồn của `legacyKey`. `null`/rỗng ⇒ bỏ qua dòng này. */
  sku: string | null;
  /** IF-owned immutable UUID — nguồn của `canonicalKey`. `null`/`undefined` ⇒ bỏ qua dòng này
   * (chưa backfill, chưa có gì để migrate TỚI). */
  matId?: string | null;
}

export interface PbrMigrationReport {
  /** số khoá đã COPY từ legacy sang canonical ở lượt chạy này. */
  migrated: number;
  /** số dòng có canonical PBR SẴN RỒI — không đụng, canonical thắng. */
  alreadyCanonical: number;
  /** số dòng KHÔNG có PBR nào ở legacyKey — không có gì để copy (không phải lỗi). */
  skippedNoLegacy: number;
}

export function migratePbrLegacyToCanonical(
  pbrMap: Readonly<Record<string, MaterialPbr>>,
  specs: readonly PbrMigrationSpec[],
): { map: Record<string, MaterialPbr>; report: PbrMigrationReport } {
  const out: Record<string, MaterialPbr> = { ...pbrMap };
  let migrated = 0;
  let alreadyCanonical = 0;
  let skippedNoLegacy = 0;

  for (const s of specs) {
    if (!s.sku || !s.matId) continue; // cần ĐỦ cả hai khoá mới có gì để nối
    const legacyKey = normalizeMatId(s.sku);
    const legacyPbr = out[legacyKey];
    if (!legacyPbr) {
      skippedNoLegacy += 1;
      continue;
    }
    const canonicalKey = normalizeMatIdCanonical(s.matId);
    if (canonicalKey in out) {
      alreadyCanonical += 1;
      continue;
    }
    out[canonicalKey] = legacyPbr;
    migrated += 1;
  }

  return { map: out, report: { migrated, alreadyCanonical, skippedNoLegacy } };
}

/** IO của kho PBR — tách để `ensurePbrCanonicalKeys` test được bằng sucrase-node (tiêm fake
 * load/save, không đụng `window`). Mặc định = localStorage thật. */
export interface PbrStoreIo {
  load(): Record<string, MaterialPbr>;
  save(map: Record<string, MaterialPbr>): void;
}

function writePbrMap(map: Record<string, MaterialPbr>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}

/**
 * ⭐ W0.2 (19/08) — CALLSITE WRAPPER của `migratePbrLegacyToCanonical`: load kho thật → migrate
 * thuần → CHỈ ghi lại khi có gì đổi (`migrated > 0`).
 *
 * NƠI GỌI: ngay sau khi client fetch xong danh sách specs — hiện cắm ở
 * `components/materials/MaterialsScreen.tsx` (`load()`, màn chủ của kho vật liệu). Nơi khác load
 * specs + PBR (vd `app/files/_components/NganPhanTho.tsx`) KHÔNG cần gọi lại — kho localStorage
 * là MỘT, chạy ở một cửa là đủ; gọi thêm cũng vô hại (idempotent).
 *
 * VÌ SAO KHÔNG VERSION-MARKER (quyết định có lý do, khác gợi ý phiếu): marker tĩnh kiểu
 * "đã chạy v1" sẽ CHẶN NHẦM các lượt sau — backfill `ProductSpec.matId` chạy TỪNG ĐỢT (Hoà
 * `--apply` xong một phần, ATLAS sync thêm dòng mới sau), mỗi đợt cần migrate thêm khoá mới.
 * Guard đúng ở đây là idempotency tự nhiên của hàm thuần (canonical thắng, chạy lại `migrated: 0`)
 * + "chỉ ghi khi migrated > 0" (không có write vô ích). Chi phí mỗi lượt = O(specs) tra map —
 * rẻ hơn một lần render bảng.
 *
 * Trả `null` khi SSR (không có localStorage và không tiêm io) — không có gì để làm.
 */
export function ensurePbrCanonicalKeys(
  specs: readonly PbrMigrationSpec[],
  io?: PbrStoreIo,
): PbrMigrationReport | null {
  if (!io && typeof window === 'undefined') return null;
  const store: PbrStoreIo = io ?? { load: loadPbrMap, save: writePbrMap };
  const { map, report } = migratePbrLegacyToCanonical(store.load(), specs);
  if (report.migrated > 0) store.save(map);
  return report;
}
