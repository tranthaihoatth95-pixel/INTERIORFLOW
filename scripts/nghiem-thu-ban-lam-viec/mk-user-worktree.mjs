/**
 * Đặt lại mật khẩu user kiểm — bản CHẠY ĐÚNG DB CỦA WORKTREE.
 *
 * 🔴 VÌ SAO CÓ BẢN THỨ HAI (đo được 04/09, không phải lo xa): `mk-user.mjs` gọi
 * `new PrismaClient()` trần. Trong worktree, `node_modules` là **symlink** về repo gốc,
 * nên Prisma nạp `.env` theo đường THẬT của module — tức `.env` của repo gốc — chứ không
 * theo `cwd`. Chạy `mk-user.mjs` trong worktree thì nó **ghi vào `prisma/dev.db` của repo
 * gốc**: đo được mtime repo gốc nhảy lên còn bản worktree đứng yên, và server ở cổng
 * worktree trả `login 401` vì user vừa tạo nằm ở CSDL khác.
 *
 * ⇒ Bản này truyền `datasources` tường minh. Cùng bài học họ "đường dẫn nói dối" mà lượt
 * này đi đóng: thứ trông như đã chạy đúng, thật ra chạy chỗ khác.
 *
 * Chạy:  DATABASE_URL="file:$(pwd)/prisma/dev.db" node scripts/nghiem-thu-ban-lam-viec/mk-user-worktree.mjs
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Thiếu DATABASE_URL — phải trỏ tường minh vào prisma/dev.db của worktree.');
console.log('DB đang ghi:', url);

const p = new PrismaClient({ datasources: { db: { url } } });
const hash = await bcrypt.hash('matkhau123', 10);
const u = await p.user.upsert({
  where: { email: 'kiem@localhost.test' },
  update: { passwordHash: hash },
  create: { email: 'kiem@localhost.test', name: 'Kiem', passwordHash: hash },
  select: { id: true, email: true },
});
console.log('user', u.id, u.email);
await p.$disconnect();
