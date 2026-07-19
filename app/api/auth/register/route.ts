import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { hashPassword, publicUser, normalizeVNPhone, getSessionUser, createSession, isValidAccountEmail } from '@/lib/server/auth';

/**
 * Tạo tài khoản email/SĐT + mật khẩu.
 *
 * CHÍNH SÁCH MỚI (chủ dự án chốt 19/07 — THAY quyết định "register 403" Sprint 1/2):
 * ĐĂNG KÝ CÔNG KHAI ĐÃ MỞ LẠI — email BẤT KỲ domain nào (@ttt.vn, gmail, domain
 * công ty khác…) đều đăng ký được. Lý do: đề phòng sau này rời công ty, sản phẩm
 * không bị trói vào mail @ttt.vn.
 *   · Mật khẩu ≥ 6 ký tự + bcrypt (giữ như cũ).
 *   · Đăng ký công khai → TỰ ĐĂNG NHẬP luôn (set cookie session) như flow register cổ điển.
 *   · Admin đã đăng nhập vẫn CẤP HỘ được tài khoản — trường hợp đó GIỮ session admin,
 *     KHÔNG đổi sang tài khoản mới (hành vi cấp-hộ cũ).
 *   · Bootstrap admin đầu tiên vẫn = `scripts/seed-admin.ts` (user đăng ký công khai
 *     KHÔNG BAO GIỜ tự thành admin — kể cả khi DB trống, tránh race cũ).
 *
 * Body: { name, password, email?, phone? } — cần ít nhất email hoặc SĐT.
 * KHÔNG có OTP xác minh SĐT — SĐT chỉ là định danh đăng nhập.
 */
export async function POST(req: Request) {
  const { email, phone, name, password } = await req.json().catch(() => ({}));

  // Ai đang gọi? — admin cấp hộ (giữ session admin) hay tự đăng ký công khai (auto-login).
  const requester = await getSessionUser();
  const adminProvisioning = !!requester?.isAdmin;

  if (!name || !password || String(password).length < 6) {
    return NextResponse.json({ error: 'Cần tên và mật khẩu ≥ 6 ký tự.' }, { status: 400 });
  }

  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  if (normalizedEmail && !isValidAccountEmail(normalizedEmail)) {
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

  // User mới LUÔN là user thường (admin đầu tiên đã có từ seed-admin.ts).
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      name: String(name).trim(),
      passwordHash: await hashPassword(String(password)),
      isAdmin: false,
      credits: 200,
    },
  });
  await prisma.creditTransaction.create({
    data: { userId: user.id, amount: user.credits, reason: 'Tặng credits khởi tạo' },
  });

  if (!adminProvisioning) {
    // Tự đăng ký công khai → đăng nhập luôn (cookie 30 ngày như flow social).
    await createSession(user.id);
  }
  // Admin cấp hộ → GIỮ session admin, KHÔNG tự động đăng nhập vào tài khoản vừa tạo.
  return NextResponse.json({ user: publicUser(user) });
}
