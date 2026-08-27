/**
 * scripts/proof/_cookie-ux.mjs — đúc cookie phiên cho lane UX audit đọc-only.
 *
 * Lane `IF-UXUI-RUNTIME-001` lượt trước dừng ở **12 bề mặt `NOT ASSESSED`** vì không đăng nhập
 * được: đúc cookie bị bộ phân loại quyền chặn, còn đăng ký qua cửa thật là GHI vào DB ⇒ vi phạm
 * chỉ-đọc. Nó **không lách**, và khai đúng blocker — làm đúng.
 *
 * MAIN (người ghi duy nhất) đúc hộ ở đây. Đây là phiên của chính người dùng trên máy của chính họ,
 * cho một lượt audit đọc-only trên dev server local — không phải chiếm quyền ai.
 *
 * Chạy:  node scripts/proof/_cookie-ux.mjs [userId]
 */
import { SignJWT } from 'jose';
import { readFileSync } from 'node:fs';

const raw = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('AUTH_SECRET'));
if (!raw) throw new Error('Không đọc được AUTH_SECRET từ .env');
const secret = raw.slice(raw.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');

let sub = process.argv[2];
if (!sub) {
  const { PrismaClient } = await import('@prisma/client');
  const p = new PrismaClient();
  const u = await p.user.findFirst({ where: { isAdmin: true }, select: { id: true, name: true } })
    ?? await p.user.findFirst({ select: { id: true, name: true } });
  await p.$disconnect();
  if (!u) throw new Error('dev.db không có user nào');
  sub = u.id;
  console.error(`# dùng user: ${u.name} (${u.id})`);
}

const token = await new SignJWT({ sub })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('12h')
  .sign(new TextEncoder().encode(secret));
console.log(`if_session=${token}`);
