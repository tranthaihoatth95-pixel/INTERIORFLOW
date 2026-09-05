#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/dem-db.mjs — ĐẾM BẢN GHI MỘT CSDL SQLite, CHỈ ĐỌC.
 *
 * VÌ SAO KHÔNG DÙNG `mtime` LÀM BẰNG CHỨNG: `npm test` của repo có tệp chạy Prisma thật trên
 * `dev.db`, nên giờ sửa đổi đụng liên tục mà chẳng nói lên điều gì. Bằng chứng đúng là **số bản
 * ghi** so với mốc sạch, cộng với dấu vết riêng của lượt đang chạy.
 *
 * ⛔ CHỐT CHẶN CỨNG: từ chối mọi đường KHÔNG nằm trong thư mục đang đứng, trừ khi có `--ngoai`.
 * `@prisma/client` là symlink nên Prisma nạp `.env` theo đường THẬT của module — worktree quên
 * truyền đường tuyệt đối là âm thầm ghi vào CSDL của repo chính (đã xảy ra thật).
 *
 * Chạy: node scripts/nghiem-thu-ban-lam-viec/dem-db.mjs --db=file:/duong/tuyet/doi/dev.db [--ngoai]
 */
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const arg = (t, m) => {
  const v = process.argv.find((a) => a.startsWith(`--${t}=`));
  return v ? v.slice(t.length + 3) : m;
};
const DB = arg('db', '');
const NGOAI = process.argv.includes('--ngoai');

if (!DB.startsWith('file:/')) {
  console.error('⛔ cần --db=file:<đường TUYỆT ĐỐI>');
  process.exit(2);
}
const duong = DB.slice('file:'.length);
if (!NGOAI && !duong.startsWith(process.cwd() + path.sep)) {
  console.error(`⛔ ${duong} nằm NGOÀI thư mục đang đứng (${process.cwd()}).`);
  console.error('   Cố ý muốn đọc CSDL khác thì thêm --ngoai (chỉ đọc, không ghi gì).');
  process.exit(2);
}

const pr = new PrismaClient({ datasources: { db: { url: DB } } });
const dem = {
  user: () => pr.user.count(),
  project: () => pr.project.count(),
  flow: () => pr.flow.count(),
  projectMember: () => pr.projectMember.count(),
  projectFile: () => pr.projectFile.count(),
};
const ra = {};
for (const [k, f] of Object.entries(dem)) ra[k] = await f().catch(() => 'n/a');
await pr.$disconnect();
console.log(duong);
console.log(JSON.stringify(ra, null, 2));
