/**
 * lib/server/credits.test.ts — kiểm `refundCreditsForJobRef` (vá R1, `docs/AUDIT-BACKEND-2026-08-03.md`
 * §5.1) bằng Prisma THẬT trên `dev.db` (tạo user tạm + dọn sạch cuối bài, không mock).
 * Chạy: node_modules/.bin/sucrase-node lib/server/credits.test.ts
 */
import { prisma } from './db';
import { spendCredits, refundCreditsForJobRef } from './credits';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

async function withTempUser<T>(startCredits: number, fn: (userId: string) => Promise<T>): Promise<T> {
  const user = await prisma.user.create({
    data: {
      email: `test-refund-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test Refund',
      passwordHash: 'x',
      credits: startCredits,
    },
  });
  try {
    return await fn(user.id);
  } finally {
    // CreditTransaction có onDelete: Cascade theo userId — xoá user là xoá sạch sổ cái tạm.
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

async function main() {
  console.log('refundCreditsForJobRef — đối chiếu jobRef, hoàn tối đa bằng số đã trừ, 1 lần/jobRef');

  await withTempUser(100, async (userId) => {
    ok('KHÔNG có giao dịch trừ nào khớp jobRef → từ chối', (await refundCreditsForJobRef(userId, 'job-khong-ton-tai', 50, 'test')).ok === false);
    const balAfterReject = (await prisma.user.findUnique({ where: { id: userId } }))!.credits;
    ok('bị từ chối → số dư KHÔNG đổi', balAfterReject === 100);
  });

  await withTempUser(100, async (userId) => {
    const paid = await spendCredits(userId, 4, 'test spend', 'job-A');
    ok('spendCredits trừ đúng 4', paid === true);
    const balAfterSpend = (await prisma.user.findUnique({ where: { id: userId } }))!.credits;
    ok('số dư sau spend = 96', balAfterSpend === 96);

    // 🔴 Ca R1 chính: client XIN hoàn 999999 (bug cũ) — chỉ được hoàn tối đa 4 (số đã trừ).
    const r1 = await refundCreditsForJobRef(userId, 'job-A', 999_999, 'refund quá tay');
    ok('refund quá số đã trừ (999999) → VẪN CHỈ hoàn đúng 4 (refundedAmount)', r1.ok === true && r1.ok && r1.refundedAmount === 4);
    const balAfterRefund = (await prisma.user.findUnique({ where: { id: userId } }))!.credits;
    ok('số dư về đúng 100 (KHÔNG phải 999999+96)', balAfterRefund === 100);

    // Hoàn lần 2 cùng jobRef → phải bị chặn (mỗi jobRef hoàn đúng 1 lần).
    const r2 = await refundCreditsForJobRef(userId, 'job-A', 4, 'refund lần 2');
    ok('hoàn LẦN 2 cùng jobRef → bị từ chối', r2.ok === false);
    const balAfterSecondAttempt = (await prisma.user.findUnique({ where: { id: userId } }))!.credits;
    ok('hoàn lần 2 bị chặn → số dư KHÔNG đổi thêm (vẫn 100)', balAfterSecondAttempt === 100);
  });

  await withTempUser(50, async (userId) => {
    // jobRef của NGƯỜI KHÁC — không được hoàn chéo.
    const other = await prisma.user.create({
      data: { email: `other-${Date.now()}@test.local`, name: 'Other', passwordHash: 'x', credits: 50 },
    });
    try {
      await spendCredits(other.id, 4, 'test spend', 'job-other');
      const r = await refundCreditsForJobRef(userId, 'job-other', 4, 'refund chéo user');
      ok('jobRef thuộc user KHÁC → từ chối (không hoàn chéo)', r.ok === false);
      const bal = (await prisma.user.findUnique({ where: { id: userId } }))!.credits;
      ok('không hoàn chéo → số dư user hiện tại không đổi', bal === 50);
    } finally {
      await prisma.user.delete({ where: { id: other.id } }).catch(() => {});
    }
  });

  await withTempUser(100, async (userId) => {
    // Refund từng phần: trừ 8, xin hoàn 3 (ít hơn đã trừ) → chỉ hoàn đúng 3, jobRef vẫn coi là
    // "đã hoàn" (chặn hoàn thêm lần nữa dù chưa hoàn đủ — đúng luật "mỗi jobRef hoàn đúng 1 lần").
    await spendCredits(userId, 8, 'test spend', 'job-B');
    const r1 = await refundCreditsForJobRef(userId, 'job-B', 3, 'hoàn 1 phần');
    ok('xin hoàn ít hơn đã trừ (3 < 8) → hoàn đúng 3', r1.ok === true && r1.ok && r1.refundedAmount === 3);
    const r2 = await refundCreditsForJobRef(userId, 'job-B', 5, 'xin hoàn nốt phần còn lại');
    ok('gọi refund LẦN 2 (dù chưa hoàn đủ) → vẫn bị chặn, đúng luật 1 lần/jobRef', r2.ok === false);
  });

  console.log('spendCredits — gọi SONG SONG không tiêu quá số dư (R2: /api/jobs mượn atomic này)');
  await withTempUser(10, async (userId) => {
    // Số dư 10, giá 1 lượt = 4 → chỉ đủ cho ĐÚNG 2 lượt (8), lượt thứ 3 phải bị từ chối. Bắn
    // ĐỒNG THỜI 5 lượt (Promise.all, không await tuần tự) — compare-and-set `updateMany` của
    // spendCredits phải tự tuần tự hoá đúng ở tầng DB, không cần khoá tay ở đây.
    const results = await Promise.all(Array.from({ length: 5 }, () => spendCredits(userId, 4, 'race test', `race-${Math.random()}`)));
    const succeeded = results.filter(Boolean).length;
    ok('5 lượt trừ 4 credit song song, số dư 10 → ĐÚNG 2 lượt thành công (không phải 3+)', succeeded === 2);
    const bal = (await prisma.user.findUnique({ where: { id: userId } }))!.credits;
    ok('số dư cuối = 10 - 2×4 = 2 (không âm, không lệch)', bal === 2);
  });

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
