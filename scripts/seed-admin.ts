/**
 * scripts/seed-admin.ts — SEED tài khoản ADMIN (quyết định #2, Sprint 2).
 *
 * THAY cho cửa bootstrap "register khi DB trống" (đã đóng ở app/api/auth/register):
 * admin đầu tiên (hoặc cấp lại quyền/mật khẩu admin) tạo bằng script này, chạy tay
 * trên máy chủ — không còn đường tự đăng ký nào từ ngoài.
 *
 * CÁCH CHẠY (từ gốc repo):
 *   SEED_ADMIN_EMAIL=admin@ttt.vn SEED_ADMIN_PASSWORD=matkhau6+ \
 *     node_modules/.bin/sucrase-node scripts/seed-admin.ts
 *
 * · Đọc env SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (mật khẩu ≥ 6 ký tự).
 * · Tự nạp .env / .env.local ở gốc repo (DATABASE_URL…) nếu biến chưa có sẵn
 *   — sucrase-node là node trần, không có lớp env của Next.
 * · IDEMPOTENT (upsert theo email):
 *     - chưa có user → tạo mới: isAdmin=true, credits 500 + CreditTransaction khởi tạo.
 *     - đã có user  → cập nhật: isAdmin=true + đặt lại passwordHash theo env
 *       (đây cũng là đường "admin reset mật khẩu tay" đã chốt). KHÔNG đụng credits.
 *   Chạy lại bao nhiêu lần cũng chỉ có đúng 1 user cho email đó.
 */

import { readFileSync } from 'fs';
import path from 'path';

/* ---- nạp .env/.env.local thủ công (không thêm dep dotenv) — KHÔNG đè biến có sẵn ---- */
function loadEnvFile(file: string) {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    return; // không có file — bỏ qua
  }
  for (const line of raw.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile(path.join(process.cwd(), '.env.local')); // override cục bộ (DB test worktree) đọc TRƯỚC
loadEnvFile(path.join(process.cwd(), '.env'));

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';

  if (!email || !email.includes('@')) {
    console.error('✗ Cần SEED_ADMIN_EMAIL hợp lệ (vd: admin@ttt.vn).');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('✗ Cần SEED_ADMIN_PASSWORD ≥ 6 ký tự.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('✗ Thiếu DATABASE_URL (đặt trong .env/.env.local hoặc truyền env trực tiếp).');
    process.exit(1);
  }

  // import động SAU khi env đã nạp (PrismaClient đọc DATABASE_URL lúc khởi tạo).
  const { PrismaClient } = await import('@prisma/client');
  const bcrypt = (await import('bcryptjs')).default;
  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { isAdmin: true, passwordHash },
      });
      console.log(`✓ Cập nhật admin: ${email} (id=${existing.id}) — isAdmin=true, mật khẩu đã đặt lại.`);
    } else {
      const user = await prisma.user.create({
        data: {
          email,
          name: process.env.SEED_ADMIN_NAME?.trim() || email.split('@')[0],
          passwordHash,
          isAdmin: true,
          credits: 500,
        },
      });
      await prisma.creditTransaction.create({
        data: { userId: user.id, amount: 500, reason: 'Tặng credits khởi tạo (seed admin)' },
      });
      console.log(`✓ Tạo admin mới: ${email} (id=${user.id}) — credits 500.`);
    }

    const admins = await prisma.user.count({ where: { isAdmin: true } });
    console.log(`  Tổng admin trong DB: ${admins}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('✗ Seed lỗi:', e instanceof Error ? e.message : e);
  process.exit(1);
});
