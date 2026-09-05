/**
 * do-nen-du-lieu.mjs — đếm bản ghi nền của CSDL worktree (đối chiếu mốc sạch trước/sau lượt chạy).
 * Chốt chặn cứng: từ chối mọi DATABASE_URL nằm ngoài worktree.
 */
import { PrismaClient } from '@prisma/client';
import { realpathSync } from 'node:fs';

const url = process.env.DATABASE_URL ?? '';
const goc = realpathSync(process.cwd());
if (!url.replace(/^file:/, '').startsWith(goc + '/')) {
  console.error(`CHẶN: DATABASE_URL ngoài worktree.\n  url = ${url}\n  worktree = ${goc}`);
  process.exit(1);
}

const p = new PrismaClient({ datasources: { db: { url } } });
const dem = {
  User: await p.user.count(),
  Project: await p.project.count(),
  Flow: await p.flow.count(),
  Member: await p.projectMember.count(),
  File: await p.projectFile.count(),
  Credit: await p.creditTransaction.count(),
  ProductSpec: await p.productSpec.count(),
};
console.log(JSON.stringify(dem));
const us = await p.user.findMany({ select: { id: true, email: true } });
const ps = await p.project.findMany({ select: { id: true, name: true } });
console.log('users =', JSON.stringify(us));
console.log('projects =', JSON.stringify(ps));
await p.$disconnect();
