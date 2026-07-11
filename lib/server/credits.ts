import { prisma } from '@/lib/server/db';

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

/** Hoàn credits (job lỗi/mock — không tốn tiền provider thật). */
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
