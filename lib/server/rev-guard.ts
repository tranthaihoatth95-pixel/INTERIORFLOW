import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * lib/server/rev-guard.ts — W5 (19/08), TRÍCH XUẤT từ `app/api/flows/[id]/route.ts` (H11, cùng
 * ngày). H11 tự khai rằng cơ chế này là generic (chỉ dùng `id`+`rev` trên bất kỳ model nào có hai
 * cột đó) nhưng gói cứng vào 4 hàm local hard-code `prisma.flow` — B25 (LOOK INSIDE → EXTEND, cấm
 * NEW khi đã có primitive) buộc trích ra đây trước khi dùng cho ProjectMember/LibraryAsset, KHÔNG
 * viết lại từ đầu. `app/api/flows/[id]/route.ts` đã sửa để IMPORT từ file này — không còn bản cục
 * bộ nào, không có "đường thứ hai" cho cùng cơ chế.
 *
 * Cách dùng: mỗi model gọi `updateWithRevCheck(id, expectedRev, (where) => prisma.<model>.update({
 * where, data }))`. `where` nhận `{ id }` (không kiểm rev — client cũ/không gửi) hoặc `{ id, rev }`
 * ("extended whereUnique", Prisma ≥4.5, @prisma/client 6.19 xác nhận ở package.json) — 0 hàng khớp
 * ⇒ Prisma tự ném P2025, ở đây bắt riêng và đổi thành `RevConflictError` để route trả 409, KHÔNG
 * để lọt thành 500. Model nào KHÔNG khai `rev` trong Prisma schema thì `where:{id,rev}` sẽ là lỗi
 * biên dịch TypeScript ở call-site — đó là chủ ý (generic qua tham số hàm, không qua khai kiểu
 * union nặng nề), không phải khoảng hở.
 */
export class RevConflictError extends Error {}

export function revWhere(
  id: string,
  expectedRev: number | undefined,
): { id: string } | { id: string; rev: number } {
  return expectedRev === undefined ? { id } : { id, rev: expectedRev };
}

/**
 * `updateFn` là closure gọi `prisma.<model>.update({ where, data })` — nhận `where` đã tính sẵn
 * bởi `revWhere`. Không hard-code delegate Prisma nào ở đây; mỗi route tự truyền model của mình.
 */
export async function updateWithRevCheck<T>(
  id: string,
  expectedRev: number | undefined,
  updateFn: (where: { id: string } | { id: string; rev: number }) => Promise<T>,
): Promise<T> {
  try {
    return await updateFn(revWhere(id, expectedRev));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new RevConflictError();
    }
    throw e;
  }
}

export const REV_CONFLICT_RESPONSE = () =>
  NextResponse.json(
    { error: 'Ai đó vừa sửa trước bạn — tải lại rồi thử lại.', code: 'REV_CONFLICT' },
    { status: 409 },
  );
