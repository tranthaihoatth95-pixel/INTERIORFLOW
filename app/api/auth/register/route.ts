import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { hashPassword, createSession, publicUser, normalizeVNPhone } from '@/lib/server/auth';

/**
 * Đăng ký bằng email HOẶC số điện thoại (cần ít nhất một).
 * Body: { name, password, email?, phone? } — body cũ { email, name, password } vẫn chạy.
 * KHÔNG có OTP xác minh SĐT — app nội bộ/LAN, SĐT chỉ là định danh đăng nhập.
 */
export async function POST(req: Request) {
  const { email, phone, name, password } = await req.json().catch(() => ({}));

  if (!name || !password || String(password).length < 6) {
    return NextResponse.json({ error: 'Cần tên và mật khẩu ≥ 6 ký tự.' }, { status: 400 });
  }

  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  if (normalizedEmail && !normalizedEmail.includes('@')) {
    return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
  }
  const normalizedPhone = phone ? normalizeVNPhone(String(phone)) : null;
  if (phone && !normalizedPhone) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ (vd: 0912345678).' }, { status: 400 });
  }
  // CHECK trong code (SQLite không có CHECK constraint): phải có ít nhất email hoặc SĐT.
  if (!normalizedEmail && !normalizedPhone) {
    return NextResponse.json({ error: 'Cần email hoặc số điện thoại.' }, { status: 400 });
  }

  if (normalizedEmail) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return NextResponse.json({ error: 'Email đã đăng ký.' }, { status: 409 });
  }
  if (normalizedPhone) {
    const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existing) return NextResponse.json({ error: 'Số điện thoại đã đăng ký.' }, { status: 409 });
  }

  // người đầu tiên = admin, nhiều credits hơn
  const isFirst = (await prisma.user.count()) === 0;
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      name: String(name).trim(),
      passwordHash: await hashPassword(String(password)),
      isAdmin: isFirst,
      credits: isFirst ? 500 : 200,
    },
  });
  await prisma.creditTransaction.create({
    data: { userId: user.id, amount: user.credits, reason: 'Tặng credits khởi tạo' },
  });
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
