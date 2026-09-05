/**
 * do-productspec.mjs — đọc kho ProductSpec trong CSDL của CHÍNH worktree này.
 * Chốt chặn cứng: từ chối mọi DATABASE_URL nằm ngoài worktree (không được ghi/đọc dev.db repo chính).
 */
import { PrismaClient } from '@prisma/client';
import { realpathSync } from 'node:fs';

const url = process.env.DATABASE_URL ?? '';
const goc = realpathSync(process.cwd());
const duongDan = url.replace(/^file:/, '');
if (!duongDan.startsWith(goc + '/')) {
  console.error(`CHẶN: DATABASE_URL trỏ ra ngoài worktree.\n  url = ${url}\n  worktree = ${goc}`);
  process.exit(1);
}

const p = new PrismaClient({ datasources: { db: { url } } });
const specs = await p.productSpec.findMany({
  select: { id: true, sku: true, name: true, kind: true, matId: true, priceVnd: true, unit: true, wastagePercent: true },
});
console.log(`ProductSpec = ${specs.length} bản ghi`);
for (const s of specs) {
  console.log(`  ${s.id} | sku=${s.sku} | ${s.name} | kind=${s.kind} | matId=${s.matId} | ${s.priceVnd}/${s.unit} | hao=${s.wastagePercent}`);
}
await p.$disconnect();
