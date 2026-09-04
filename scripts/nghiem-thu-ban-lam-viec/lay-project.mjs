/** In projectId đầu tiên của user kiểm — để bộ đo chạy trên màn CÓ DỮ LIỆU, không phải màn rỗng. */
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Thiếu DATABASE_URL (xem mk-user-worktree.mjs — symlink node_modules làm Prisma đọc nhầm .env).');
const p = new PrismaClient({ datasources: { db: { url } } });
const ds = await p.project.findMany({ select: { id: true, name: true }, take: 5 });
console.log(JSON.stringify(ds, null, 1));
console.log('projects', await p.project.count(), '| users', await p.user.count());
await p.$disconnect();
