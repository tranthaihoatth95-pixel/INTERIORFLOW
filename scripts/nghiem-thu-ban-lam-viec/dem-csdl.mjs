#!/usr/bin/env node
/**
 * Đếm bản ghi CSDL — dùng để chứng minh lượt chạy KHÔNG rò ghi sang CSDL repo chính.
 * `mtime` của `dev.db` KHÔNG phải bằng chứng: `npm test` của repo chạy Prisma thật trên nó.
 * Bằng chứng đúng là SỐ BẢN GHI so mốc sạch + dấu vết riêng của lane.
 *
 * ⚠️ `@prisma/client` là symlink ⇒ Prisma nạp `.env` theo đường THẬT của module. Phải truyền
 * `datasources.db.url` tường minh, không nhờ biến môi trường.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const url = process.argv[2];
if (!url) { console.error('dùng: node dem-csdl.mjs file:/duong/tuyet/doi/dev.db'); process.exit(2); }

const pr = new PrismaClient({ datasources: { db: { url } } });
const so = {
  User: await pr.user.count(),
  Project: await pr.project.count(),
  Flow: await pr.flow.count(),
  ProjectMember: await pr.projectMember.count(),
  ProjectFile: await pr.projectFile.count(),
  CreditTransaction: await pr.creditTransaction.count(),
};
console.log(url);
for (const [k, v] of Object.entries(so)) console.log(`  ${k.padEnd(15)} ${v}`);
await pr.$disconnect();
