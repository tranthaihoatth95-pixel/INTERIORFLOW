import { PrismaClient } from '@prisma/client';

/**
 * lib/server/db.ts — MỘT PrismaClient cho cả tiến trình.
 *
 * ── VÌ SAO CÓ ĐOẠN CẤU HÌNH DƯỚI ĐÂY (P0 `L2-01`, đo 27/08) ────────────────────────────────────
 * Lane `IF-UXUI-RUNTIME-001` đang audit thì **dev server kẹt cứng sau ~6 phút dùng bình thường**:
 * tệp tĩnh vẫn 200, còn **mọi route app và API treo vô hạn — không lỗi, không timeout**. `sample`
 * tiến trình cho thấy 9 luồng `tokio-runtime-worker` của query engine đứng chết cùng một stack.
 *
 * Lane gọi đó là biểu hiện nặng nhất của trục trạng thái sập: *"TẢI HỎNG thoái hoá thành ĐANG
 * TẢI vĩnh viễn"*. Đo được ba PRAGMA của chính tệp DB:
 *
 *     journal_mode = delete   ← KHÔNG phải WAL
 *     busy_timeout = 0
 *     synchronous  = 2 (FULL)
 *
 * 🔴 **ĐÍNH CHÍNH — bản đầu của chú thích này SAI, và Hoà bắt được.**
 * Tôi viết *"`busy_timeout = 0` ⇒ kết nối bị chặn **chờ mãi mãi***". **Ngược lại.** Đo thật
 * (hai tiến trình, một giữ `BEGIN IMMEDIATE`):
 *     busy_timeout=0   → sau 0.00s: `database is locked`   ← BÁO LỖI NGAY, không chờ
 *     busy_timeout=5s  → sau 5.04s: ghi được
 * Tức `busy_timeout=0` là **không chờ**. Nó **không thể** là cơ chế gây treo — nó là cơ chế gây
 * *lỗi sớm*. Tôi đã dựng một câu chuyện nhân quả nghe hợp lý rồi **không kiểm nó**.
 *
 * ⇒ **Nguyên nhân cú kẹt: CHƯA XÁC ĐỊNH.** `journal_mode=delete` vẫn là một điều kiện bất lợi
 * có thật (ghi khoá độc quyền toàn tệp, người đọc bị chặn), và `getSession()` GHI `lastSeenAt` ở
 * gần như mọi request (`lib/server/auth.ts:155`) vẫn là nguồn ghi liên tục có thật. Nhưng "bất
 * lợi" **không bằng** "đã gây ra cú kẹt đó". Chín luồng tokio đứng chết cùng stack là dữ kiện
 * chưa được giải thích.
 *
 * ── ĐÂY LÀ ỨNG VIÊN, KHÔNG PHẢI THUỐC CHỮA ────────────────────────────────────────────────────
 * Thay đổi dưới đây là **candidate, reversible**, giữ lại vì nó không gây hồi quy (proof
 * `scripts/proof/db-khong-ket.mjs`) và vì WAL đúng cho một ứng dụng local-first vừa đọc vừa ghi.
 * **Không được gọi nó là root cause.** Verdict:
 *   `PARTIAL — cấu hình WAL/connection mới không gây regression trong tải ngắn;`
 *   `nguyên nhân L2-01 chưa tái hiện, chưa xác định.`
 * `connection_limit=1` cho SQLite: **một** kết nối thì không có gì để tự khoá lẫn nhau. Đây là
 * khuyến nghị chuẩn của Prisma cho SQLite, không phải mẹo. Với IF thì càng đúng — sản phẩm
 * local-first, một người dùng một tiến trình, không phải máy chủ nhiều nghìn phiên.
 *
 * `socket_timeout=10`: hết 10 giây thì **NÉM LỖI**, không treo. Một lỗi nói được còn hơn một con
 * quay quay mãi — và nó là điều kiện tiên quyết để tầng UI có "tải hỏng" thật mà vẽ. (Cái này
 * đứng độc lập với câu chuyện nguyên nhân ở trên: dù cú kẹt do gì, một trần thời gian vẫn đúng.)
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
