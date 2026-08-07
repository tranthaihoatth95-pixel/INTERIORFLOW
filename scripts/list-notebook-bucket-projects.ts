/**
 * scripts/list-notebook-bucket-projects.ts — M-SCOPE VIỆC 7 (07/08).
 *
 * CHỈ LIỆT KÊ — KHÔNG XOÁ (KS4: lùi được, chờ Hoà duyệt trước khi động tới dữ liệu thật).
 *
 * `Project.name` bắt đầu `__nb:` là bucket ẩn của Notebook per-user (`lib/notebook/
 * resolveProject.ts` — `HIDDEN_NOTEBOOK_PREFIX`), TỰ ĐỘNG loại khỏi Gallery/`/api/flows` — không
 * phải "dự án thật" người dùng thấy. Đo 07/08 lúc viết script này: 4 hàng.
 *
 * Chạy: node_modules/.bin/sucrase-node scripts/list-notebook-bucket-projects.ts
 *
 * Muốn xoá SAU KHI Hoà duyệt từng dòng — soft-delete (giữ nguyên quy ước xoá mềm của repo),
 * KHÔNG hard-delete, KHÔNG chạy hàng loạt không xem trước:
 *   sqlite3 dev.db "UPDATE Project SET deletedAt=datetime('now') WHERE id='<id>';"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const HIDDEN_NOTEBOOK_PREFIX = '__nb:'; // chép nguyên giá trị từ lib/notebook/resolveProject.ts — không import (script chạy ngoài Next alias)

async function main() {
  const rows = await prisma.project.findMany({
    where: { name: { startsWith: HIDDEN_NOTEBOOK_PREFIX }, deletedAt: null },
    select: { id: true, name: true, userId: true, createdAt: true, _count: { select: { flows: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (rows.length === 0) {
    console.log('Không có Project __nb: nào còn sống (deletedAt: null).');
    return;
  }

  console.log(`${rows.length} Project __nb: (bucket Notebook ẩn) đang sống trong dev.db:\n`);
  for (const r of rows) {
    console.log(`  ${r.id}  |  ${r.name}  |  userId=${r.userId}  |  ${r._count.flows} flow  |  tạo ${r.createdAt.toISOString()}`);
  }
  console.log(
    '\n⛔ CHƯA XOÁ GÌ. Đây là bucket kỹ thuật của Notebook (tự tạo per-user, KHÔNG phải dự án ' +
      'người dùng thấy) — nhưng script này KHÔNG tự phán "an toàn xoá", chỉ liệt kê để Hoà tự ' +
      'quyết từng dòng (đặc biệt dòng có flow > 0 — xoá Project sẽ SetNull flow đó, không mất flow, ' +
      'nhưng flow sẽ về trạng thái mồ côi, xem VIỆC 1).',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
