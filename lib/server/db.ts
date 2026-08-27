import { PrismaClient } from '@prisma/client';

/**
 * lib/server/db.ts — MỘT PrismaClient cho cả tiến trình.
 *
 * ── VÌ SAO CÓ ĐOẠN CẤU HÌNH DƯỚI ĐÂY (P0 `L2-01`, đo 27/08) ────────────────────────────────────
 * Lane `IF-UXUI-RUNTIME-001` đang audit thì **dev server kẹt cứng sau ~6 phút dùng bình thường**:
 * tệp tĩnh vẫn 200, còn **mọi route app và API treo vô hạn — không lỗi, không timeout**. `sample`
 * tiến trình cho thấy 9 luồng `tokio-runtime-worker` của query engine đứng chết cùng một stack.
 *
 * Lane kết luận đó là biểu hiện **nặng nhất** của trục trạng thái sập: *"TẢI HỎNG thoái hoá thành
 * ĐANG TẢI vĩnh viễn"*. Đúng — và gốc không nằm ở UI. Đo ba PRAGMA của chính tệp DB:
 *
 *     journal_mode = delete   ← KHÔNG phải WAL
 *     busy_timeout = 0        ← chờ VÔ HẠN khi bị khoá
 *     synchronous  = 2 (FULL)
 *
 * Ghép ba thứ đó với `getSession()` (`lib/server/auth.ts:155`) — nó **GHI `lastSeenAt` ở gần như
 * mọi request** — ra đúng cái đã xảy ra:
 *   · `journal_mode=delete` ⇒ mỗi lần ghi khoá **độc quyền toàn bộ tệp**; người đọc bị chặn.
 *   · nhiều kết nối trong pool ⇒ chúng chặn lẫn nhau trên cùng một khoá tệp.
 *   · `busy_timeout=0` ⇒ kết nối bị chặn **chờ mãi mãi** thay vì báo lỗi.
 * ⇒ App **không thể nào** đạt tới trạng thái "tải hỏng", vì request không bao giờ hỏng — nó treo.
 * Vá ở tầng UI là vẽ một trạng thái không bao giờ tới được.
 *
 * ── CÁCH VÁ, VÀ VÌ SAO CHỌN CÁCH NÀY ──────────────────────────────────────────────────────────
 * `connection_limit=1` cho SQLite: **một** kết nối thì không có gì để tự khoá lẫn nhau. Đây là
 * khuyến nghị chuẩn của Prisma cho SQLite, không phải mẹo. Với IF thì càng đúng — sản phẩm
 * local-first, một người dùng một tiến trình, không phải máy chủ nhiều nghìn phiên.
 *
 * `socket_timeout=10`: hết 10 giây thì **NÉM LỖI**, không treo. Một lỗi nói được còn hơn một con
 * quay quay mãi — và nó là điều kiện tiên quyết để tầng UI có "tải hỏng" thật mà vẽ.
 *
 * Vá tại đây, KHÔNG sửa `.env`: `.env` là cấu hình của người dùng; ràng buộc kỹ thuật của SQLite
 * là việc của mã. Sửa `.env` thì bản Electron (dựng `DATABASE_URL` trong `electron/main.js:126`)
 * và mọi worktree sẽ **không** được vá.
 *
 * ⚠️ `journal_mode=WAL` là thuộc tính **bền của chính tệp DB**, không đặt được qua chuỗi kết nối.
 * Xem `scripts/bat-wal.mjs`.
 */
function urlCoRangBuoc(): string | undefined {
  const goc = process.env.DATABASE_URL;
  if (!goc || !goc.startsWith('file:')) return goc; // không phải SQLite ⇒ không áp ràng buộc này
  const [duong, truyVan] = goc.split('?');
  const p = new URLSearchParams(truyVan ?? '');
  // Không đè giá trị người vận hành đã khai — họ có thể đang gỡ lỗi một ca cụ thể.
  if (!p.has('connection_limit')) p.set('connection_limit', '1');
  if (!p.has('socket_timeout')) p.set('socket_timeout', '10');
  return `${duong}?${p.toString()}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = urlCoRangBuoc();
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
