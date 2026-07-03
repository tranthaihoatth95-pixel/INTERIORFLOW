import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/**
 * POST { action: 'spend'|'refund', amount, reason, jobRef? }
 * spend: kiểm tra số dư, trừ, ghi transaction — trả credits mới. 402 nếu thiếu.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { action, amount, reason, jobRef } = await req.json().catch(() => ({}));
  const amt = Math.abs(Number(amount) || 0);
  if (!amt || (action !== 'spend' && action !== 'refund')) {
    return NextResponse.json({ error: 'Body không hợp lệ.' }, { status: 400 });
  }

  if (action === 'spend') {
    // trừ nguyên tử — chỉ khi đủ số dư
    const updated = await prisma.user.updateMany({
      where: { id: user.id, credits: { gte: amt } },
      data: { credits: { decrement: amt } },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: 'Hết credits — liên hệ admin nạp thêm.', credits: user.credits }, { status: 402 });
    }
    await prisma.creditTransaction.create({
      data: { userId: user.id, amount: -amt, reason: String(reason ?? 'spend'), jobRef },
    });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: amt } } });
    await prisma.creditTransaction.create({
      data: { userId: user.id, amount: amt, reason: String(reason ?? 'refund'), jobRef },
    });
  }
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({ credits: fresh?.credits ?? 0 });
}

/** GET: số dư + 30 giao dịch gần nhất. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return NextResponse.json({ credits: user.credits, transactions });
}
