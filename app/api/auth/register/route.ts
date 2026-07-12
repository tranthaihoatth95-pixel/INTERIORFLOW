import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { hashPassword, createSession, publicUser, normalizeVNPhone, getSessionUser } from '@/lib/server/auth';

/**
 * Tạo tài khoản email/SĐT + mật khẩu.
 *
 * CHÍNH SÁCH (chủ dự án chốt Sprint 1): ĐĂNG KÝ TỰ DO ĐÃ KHOÁ.
 *   · Người dùng thường vào bằng Google OAuth @ttt.vn (/api/auth/google).
 *   · Route này chỉ còn 2 cửa:
 *       1. BOOTSTRAP — DB chưa có user nào: cho phép tạo user đầu tiên (thành admin),
 *          nếu không thì hệ thống mới không bao giờ có admin.
 *       2. ADMIN CẤP — request có session của user isAdmin: admin tạo hộ tài khoản
 *          (KHÔNG đổi session của admin sang tài khoản mới).
 *   · TODO(admin-provisioning): UI quản lý tài khoản cho admin (cấp/reset mật khẩu tay)
 *     — chưa thiết kế hệ role mới, tận dụng cờ isAdmin sẵn có trong schema.
 *
 * Body: { name, password, email?, phone? } — cần ít nhất email hoặc SĐT.
 * KHÔNG có OTP xác minh SĐT — app nội bộ/LAN, SĐT chỉ là định danh đăng nhập.
 */
export async function POST(req: Request) {
  const { email, phone, name, password } = await req.json().catch(() => ({}));

  // Cửa vào: bootstrap (DB trống) hoặc admin đã đăng nhập. Còn lại → 403.
  const isFirst = (await prisma.user.count()) === 0;
  const requester = isFirst ? null : await getSessionUser();
  if (!isFirst && !requester?.isAdmin) {
    return NextResponse.json(
      { error: 'Đăng ký tự do đã khoá — đăng nhập Google bằng email @ttt.vn, hoặc liên hệ admin để được cấp tài khoản.' },
      { status: 403 },
    );
  }

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
  // Chỉ set session khi TỰ đăng ký (bootstrap). Admin cấp hộ → GIỮ session admin,
  // không tự động đăng nhập vào tài khoản vừa tạo.
  if (isFirst) await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
