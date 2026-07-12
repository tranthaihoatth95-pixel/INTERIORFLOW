import { NextResponse } from 'next/server';
import { verifyPassword, createSession, publicUser, findUserByIdentifier } from '@/lib/server/auth';

/**
 * Đăng nhập bằng email HOẶC số điện thoại.
 * Body mới: { identifier, password, remember? } — identifier = email hoặc SĐT VN;
 *   remember=false → cookie PHIÊN (đóng trình duyệt là hết), mặc định true (30 ngày).
 * Body cũ:  { email, password } — GIỮ backward compat (client cũ vẫn chạy, remember=true).
 */
export async function POST(req: Request) {
  const { identifier, email, phone, password, remember } = await req.json().catch(() => ({}));
  const raw = String(identifier ?? email ?? phone ?? '').trim();
  const user = await findUserByIdentifier(raw);
  if (!user || !(await verifyPassword(String(password ?? ''), user.passwordHash))) {
    return NextResponse.json({ error: 'Sai email/SĐT hoặc mật khẩu.' }, { status: 401 });
  }
  await createSession(user.id, remember !== false);
  return NextResponse.json({ user: publicUser(user) });
}
