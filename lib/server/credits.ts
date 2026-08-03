// Import TƯƠNG ĐỐI (không dùng alias '@/') — file này cần chạy được thẳng qua
// `node_modules/.bin/sucrase-node` (test `credits.test.ts` dùng Prisma thật trên dev.db), alias
// '@/' chỉ resolve qua bundler Next.js (cùng quy ước đã ghi ở `lib/commands/registry.ts`).
import { prisma } from './db';

/**
 * Ledger credits phía server — dùng cho các route TỰ gọi provider tốn tiền
 * (vd /api/render/premium) thay vì tin creditCost phía client (bypass được).
 * Cùng cơ chế nguyên tử updateMany-gte như /api/credits.
 */

/** Trừ nguyên tử. Trả false nếu không đủ số dư (KHÔNG trừ gì). */
export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
  jobRef?: string,
): Promise<boolean> {
  const amt = Math.abs(Math.round(amount));
  if (!amt) return true;
  const updated = await prisma.user.updateMany({
    where: { id: userId, credits: { gte: amt } },
    data: { credits: { decrement: amt } },
  });
  if (updated.count === 0) return false;
  await prisma.creditTransaction.create({
    data: { userId, amount: -amt, reason, jobRef },
  });
  return true;
}

/** Hoàn credits (job lỗi/mock — không tốn tiền provider thật). Dùng khi CHÍNH request đang xử lý
 * là request đã trừ tiền (spend + refund cùng 1 lượt gọi server, vd `render/premium`,
 * `/api/jobs`) — không cần đối chiếu `jobRef` vì không có đường nào để gọi refund này mà không
 * đi qua `spendCredits` ngay trước đó trong CÙNG request. Với refund gọi RIÊNG, độc lập, do
 * client tự khởi (route `/api/credits` action `refund`) → dùng `refundCreditsForJobRef` bên dưới,
 * PHẢI đối chiếu `jobRef`. */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  jobRef?: string,
): Promise<void> {
  const amt = Math.abs(Math.round(amount));
  if (!amt) return;
  await prisma.user.update({ where: { id: userId }, data: { credits: { increment: amt } } });
  await prisma.creditTransaction.create({
    data: { userId, amount: amt, reason, jobRef },
  });
}

export type RefundForJobRefResult = { ok: true; refundedAmount: number } | { ok: false; error: string };

/**
 * Hoàn credits qua route công khai `/api/credits` (action `refund`, gọi RIÊNG lẻ bởi client sau
 * khi 1 job đã chạy lỗi — không có gì ràng buộc request refund này PHẢI xuất phát từ đúng lượt đã
 * trừ tiền, nên BẮT BUỘC đối chiếu `jobRef` với sổ cái, KHÔNG tin số tiền client khai.
 *
 * Vá `docs/AUDIT-BACKEND-2026-08-03.md` §5.1/R1 ("tự nạp credit vô hạn" — refund cũ cộng thẳng
 * `amount` client gửi, không đối chiếu jobRef nào). 3 điều kiện, ĐỦ CẢ 3 mới hoàn:
 *  1. Có đúng 1 `CreditTransaction` TRỪ (amount<0) cùng `userId`+`jobRef` — không có thì từ chối.
 *  2. jobRef đó CHƯA từng được hoàn (không có dòng amount>0 nào cùng jobRef) — có rồi thì từ chối
 *     (mỗi jobRef chỉ hoàn đúng 1 lần).
 *  3. Số hoàn = `min(amount client xin, |amount đã trừ|)` — không bao giờ hoàn nhiều hơn đã trừ.
 *
 * Bọc trong `$transaction` — SQLite khoá ghi cả file trong lúc transaction chạy nên 2 lời gọi
 * refund CÙNG jobRef bắn song song vẫn tuần tự hoá đúng: lượt sau thấy dòng "đã hoàn" của lượt
 * trước và bị chặn ở điều kiện 2 (chống refund lặp lại cùng jobRef qua race).
 */
export async function refundCreditsForJobRef(
  userId: string,
  jobRef: string,
  requestedAmount: number,
  reason: string,
): Promise<RefundForJobRefResult> {
  const ref = jobRef.trim();
  if (!ref) return { ok: false, error: 'refund cần jobRef khớp đúng giao dịch trừ tương ứng.' };
  const requested = Math.abs(Math.round(requestedAmount));
  if (!requested) return { ok: false, error: 'amount không hợp lệ.' };

  return prisma.$transaction(async (tx) => {
    const spendTx = await tx.creditTransaction.findFirst({
      where: { userId, jobRef: ref, amount: { lt: 0 } },
    });
    if (!spendTx) return { ok: false, error: 'Không tìm thấy giao dịch trừ nào khớp jobRef này.' };
    const alreadyRefunded = await tx.creditTransaction.findFirst({
      where: { userId, jobRef: ref, amount: { gt: 0 } },
    });
    if (alreadyRefunded) return { ok: false, error: 'jobRef này đã được hoàn rồi — không hoàn lại lần 2.' };

    const refundAmt = Math.min(requested, Math.abs(spendTx.amount));
    await tx.user.update({ where: { id: userId }, data: { credits: { increment: refundAmt } } });
    await tx.creditTransaction.create({
      data: { userId, amount: refundAmt, reason, jobRef: ref },
    });
    return { ok: true, refundedAmount: refundAmt };
  });
}
