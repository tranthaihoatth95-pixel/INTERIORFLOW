/**
 * lib/integrations/external-ref.ts — HAI HÀM CẦU của bảng `ExternalRef` (L-EXT1, §0v).
 *
 * Việc của file này: dịch giữa **thực thể lõi IDF** (`entityType` + `entityId`, id do IF sinh) và
 * **id bản ghi bên hệ ngoài** (`system` + `externalId`). Nhờ đó code mới KHÔNG cần biết tên nhà
 * cung cấp nào — thêm/đổi hệ ngoài chỉ là đổi chuỗi `system`, không đụng schema, không migrate.
 *
 * ⛔ KHÔNG đụng 8 cột cũ mang tên nhà cung cấp trong bảng lõi, KHÔNG migrate dữ liệu cũ sang đây
 *    (§0v chốt: "chỉ ngừng đẻ mới"). Đây là đường SONG SONG, hôm nay chưa nơi nào gọi.
 * ⛔ KHÔNG đụng `lib/integrations/providers/*.ts` — tầng adapter đã đúng pattern (§0v tầng ③).
 *
 * ── 🔴 HAI CỬA CHẶN, và vì sao phải có CẢ HAI ──────────────────────────────────────────────
 * Bảng `ExternalRef` mới có trong `prisma/schema.prisma`, CHƯA có trong `dev.db`, và Prisma client
 * cũng CHƯA generate lại (đo 06/08: `grep -c externalRef node_modules/.prisma/client/index.d.ts`
 * = **0**).
 *
 * ① `EXTERNAL_REF_TABLE_READY` — cờ người đọc thấy ngay, cùng lối `SPEC_ROOM_COLUMN_READY`
 *    (`lib/server/specs.ts`). Chặn bằng cách **ném lỗi nói rõ phải chạy lệnh gì**, KHÔNG trả `null`
 *    im lặng: trả null là nói dối "không tìm thấy" trong khi sự thật là chưa có bảng.
 * ② Truy cập bảng qua `externalRefTable()` thay vì `prisma.externalRef` — vì client chưa generate
 *    thì `prisma.externalRef` **vỡ tsc ngay hôm nay**. Cố ý KHÔNG chạy `prisma generate` để chữa:
 *    lệnh đó ghi vào `node_modules/.prisma` DÙNG CHUNG với các phiên khác đang chạy dev server.
 *
 * Khác ca `ProductSpec.room/confidence` ở một điểm quan trọng — đó là THÊM CỘT vào bảng đang dùng
 * nên Prisma tự SELECT cột đó và giết mọi truy vấn của bảng ấy; còn đây là THÊM BẢNG MỚI, không
 * truy vấn hiện có nào bị ảnh hưởng, chỉ lời gọi `externalRef.*` mới hỏng.
 *
 * KHI NÀO MỞ: sau khi chủ dự án chạy `db push` + `generate` (lệnh đủ ở `docs/M-APPLY-C-OUT.md` §10)
 * → đổi cờ ① thành `true`. Kiểm bằng DỮ LIỆU, không bằng lời khai: `sqlite3 dev.db ".tables"` phải
 * thấy `ExternalRef`. Lúc đó có thể thay `externalRefTable()` bằng `prisma.externalRef` thẳng.
 */

import { prisma } from '@/lib/server/db';
import {
  normalizeExternalKey,
  isValidExternalKey,
  isValidCoreKey,
  type ExternalRefKey,
  type CoreEntityKey,
  type ExternalEntityType,
} from './external-ref-core';

export type { ExternalRefKey, CoreEntityKey, ExternalEntityType };
export { normalizeExternalKey, isValidExternalKey, isValidCoreKey };

/** Xem cửa chặn ① ở đầu file. `false` cho tới khi bảng có thật trong `dev.db`. */
export const EXTERNAL_REF_TABLE_READY = false;

/** Hình dạng TỐI THIỂU của delegate — khai tay vì client chưa generate (cửa chặn ②). */
interface ExternalRefRow {
  system: string;
  externalId: string;
  entityType: string;
  entityId: string;
}
interface ExternalRefDelegate {
  findFirst(args: unknown): Promise<Pick<ExternalRefRow, 'externalId'> | null>;
  findUnique(args: unknown): Promise<Pick<ExternalRefRow, 'entityType' | 'entityId'> | null>;
  upsert(args: unknown): Promise<unknown>;
}

function externalRefTable(what: string): ExternalRefDelegate {
  if (!EXTERNAL_REF_TABLE_READY) {
    throw new Error(
      `[ExternalRef] Chưa dùng được ${what}: bảng ExternalRef mới có trong schema, CHƯA có trong dev.db. ` +
        'Chủ dự án chạy TRÊN MÁY THẬT, khi không còn dev server nào mở: ' +
        'sqlite3 dev.db ".backup \'dev.db.bak-truoc-externalref\'" && npx prisma db push && npx prisma generate ' +
        '— rồi đổi EXTERNAL_REF_TABLE_READY thành true (lib/integrations/external-ref.ts).',
    );
  }
  const delegate = (prisma as unknown as { externalRef?: ExternalRefDelegate }).externalRef;
  if (!delegate) {
    throw new Error(
      `[ExternalRef] Cờ đã bật nhưng Prisma client chưa biết bảng ExternalRef — thiếu bước "npx prisma generate". (${what})`,
    );
  }
  return delegate;
}

/**
 * CẦU XUÔI — thực thể lõi IDF → id bên hệ ngoài.
 * `null` = có tra nhưng chưa nối bao giờ (khác hẳn "chưa migrate", ca đó ném lỗi).
 */
export async function findExternalId(core: CoreEntityKey, system: string): Promise<string | null> {
  const table = externalRefTable('findExternalId');
  if (!isValidCoreKey(core)) return null;
  const row = await table.findFirst({
    where: { system: system.trim().toLowerCase(), entityType: core.entityType, entityId: core.entityId.trim() },
    select: { externalId: true },
  });
  return row?.externalId ?? null;
}

/** CẦU NGƯỢC — id bên hệ ngoài → thực thể lõi IDF. */
export async function findCoreEntity(key: ExternalRefKey): Promise<CoreEntityKey | null> {
  const table = externalRefTable('findCoreEntity');
  if (!isValidExternalKey(key)) return null;
  const n = normalizeExternalKey(key);
  const row = await table.findUnique({
    where: { system_externalId: { system: n.system, externalId: n.externalId } },
    select: { entityType: true, entityId: true },
  });
  return row ? { entityType: row.entityType as ExternalEntityType, entityId: row.entityId } : null;
}

/**
 * Ghi/cập nhật mối nối — idempotent theo `@@unique([system, externalId])`, đúng vai trò mà cột
 * `*RecordId @unique` mang tên nhà cung cấp đang gánh trong bảng lõi: sync lại nhiều lần không đẻ
 * bản ghi trùng.
 */
export async function linkExternalRef(key: ExternalRefKey, core: CoreEntityKey): Promise<void> {
  const table = externalRefTable('linkExternalRef');
  if (!isValidExternalKey(key)) throw new Error('[ExternalRef] system/externalId rỗng — không ghi.');
  if (!isValidCoreKey(core)) throw new Error('[ExternalRef] entityId rỗng — không ghi.');
  const n = normalizeExternalKey(key);
  await table.upsert({
    where: { system_externalId: { system: n.system, externalId: n.externalId } },
    create: { ...n, entityType: core.entityType, entityId: core.entityId.trim() },
    update: { entityType: core.entityType, entityId: core.entityId.trim() },
  });
}
