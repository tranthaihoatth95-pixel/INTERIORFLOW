/**
 * scripts/backfill-project-members.ts — ACCESS-CONTROL M1, chạy 1 lần sau `prisma db push`
 * (idempotent — chạy lại không tạo trùng nhờ upsert theo @@unique([projectId,userId])).
 *
 * Nguyên tắc (RESEARCH-ACCESS-CONTROL.md §2.5): mọi Project đang có phải sinh đúng 1
 * ProjectMember role 'owner' cho Project.userId — nếu bỏ bước này, khi bật lọc quyền
 * ở wave sau thì mọi người mất sạch dự án.
 *
 * Chạy: node_modules/.bin/sucrase-node scripts/backfill-project-members.ts
 * (DATABASE_URL lấy từ .env như Prisma bình thường)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({ select: { id: true, userId: true } });
  let created = 0;
  for (const p of projects) {
    const before = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: p.id, userId: p.userId } },
      select: { id: true },
    });
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: p.id, userId: p.userId } },
      update: {}, // đã có → không đụng (kể cả nếu ai đó đã đổi role tay)
      create: { projectId: p.id, userId: p.userId, role: 'owner' },
    });
    if (!before) created++;
  }
  const total = await prisma.projectMember.count();
  const orphans = await prisma.flow.count({ where: { projectId: null } });
  console.log(
    `✔ backfill: +${created} owner mới / ${projects.length} project · tổng ${total} member · ${orphans} flow chưa gắn project (giữ luật cũ Flow.userId)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
