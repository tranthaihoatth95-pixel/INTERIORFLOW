import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { refundCreditsForJobRef } from '@/lib/server/credits';

/**
 * POST { action: 'spend'|'refund', amount, reason, jobRef? }
 * spend: kiểm tra số dư, trừ, ghi transaction — trả credits mới. 402 nếu thiếu.
 * refund: BẮT BUỘC `jobRef` khớp đúng 1 giao dịch TRỪ (amount<0) của CHÍNH user này, và jobRef đó
 * CHƯA được hoàn lần nào — hoàn tối đa bằng số đã trừ (không tin `amount` client gửi). Vá lỗ
 * "tự nạp credit vô hạn" (`docs/AUDIT-BACKEND-2026-08-03.md` §5.1/R1) — trước đây refund cộng
 * thẳng `amount` client khai, không đối chiếu gì.
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
    const ref = typeof jobRef === 'string' ? jobRef.trim() : '';
    if (!ref) {
      return NextResponse.json({ error: 'refund cần jobRef khớp đúng giao dịch trừ tương ứng.' }, { status: 400 });
    }
    const result = await refundCreditsForJobRef(user.id, ref, amt, String(reason ?? 'refund'));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
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
