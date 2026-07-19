import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';

const COOKIE = 'if_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/**
 * Tạo session cookie `if_session`.
 * remember=true (mặc định — GIỮ hành vi cũ cho mọi caller hiện có: register, Google
 * callback…): cookie persistent maxAge 30 ngày.
 * remember=false ("Ghi nhớ đăng nhập" KHÔNG tick): cookie PHIÊN — không maxAge, trình
 * duyệt đóng là hết. JWT bên trong vẫn exp 30d (backstop, giữ nguyên semantics token cũ).
 */
export async function createSession(userId: string, remember = true) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

/** User hiện tại từ cookie — null nếu chưa đăng nhập. Đồng thời cập nhật lastSeenAt (presence). */
export async function getSessionUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = String(payload.sub);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    // presence: chỉ ghi khi đã cũ >20s để tránh spam write
    if (Date.now() - user.lastSeenAt.getTime() > 20_000) {
      await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Shape user trả về client. email/phone nullable trong DB (đăng ký bằng email HOẶC SĐT)
 * — coerce email về '' để giữ contract cũ của client (SessionUser.email: string).
 */
export function publicUser(u: {
  id: string;
  email: string | null;
  phone?: string | null;
  name: string;
  credits: number;
  isAdmin: boolean;
}) {
  return {
    id: u.id,
    email: u.email ?? '',
    phone: u.phone ?? null,
    name: u.name,
    credits: u.credits,
    isAdmin: u.isAdmin,
  };
}

/* ============================================================================
 * Identifier = email HOẶC số điện thoại VN.
 * KHÔNG có OTP: app chạy nội bộ/LAN, SĐT chỉ là định danh đăng nhập, không xác minh.
 * ==========================================================================*/

/**
 * Chuẩn hoá SĐT Việt Nam về dạng canonical `0xxxxxxxxx`.
 * Chấp nhận: "+84 912 345 678", "84912345678", "0912.345.678"…
 * Trả về null nếu không phải SĐT hợp lệ (9–11 số sau chuẩn hoá, bắt đầu bằng 0).
 */
export function normalizeVNPhone(raw: string): string | null {
  let s = String(raw).replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('84') && s.length >= 10) s = '0' + s.slice(2);
  if (!/^0\d{8,10}$/.test(s)) return null;
  return s;
}

/** identifier chứa '@' → email; ngược lại thử parse SĐT VN. */
export function parseIdentifier(raw: string): { email: string } | { phone: string } | null {
  const s = String(raw).trim();
  if (!s) return null;
  if (s.includes('@')) return { email: s.toLowerCase() };
  const phone = normalizeVNPhone(s);
  return phone ? { phone } : null;
}

/** Tìm user theo email hoặc SĐT — null nếu identifier không hợp lệ / không tồn tại. */
export async function findUserByIdentifier(raw: string) {
  const id = parseIdentifier(raw);
  if (!id) return null;
  return 'email' in id
    ? prisma.user.findUnique({ where: { email: id.email } })
    : prisma.user.findUnique({ where: { phone: id.phone } });
}

/* ============================================================================
 * CHÍNH SÁCH TẠO TÀI KHOẢN (chủ dự án chốt MỚI 19/07 — thay "chỉ Google @ttt.vn"):
 *   · Đăng ký + đăng nhập email MỌI domain (register công khai đã MỞ LẠI).
 *   · OAuth Google + Microsoft: chấp nhận mọi tài khoản (workspace lẫn cá nhân).
 *   · Bootstrap admin đầu tiên = scripts/seed-admin.ts (giữ nguyên).
 *   · KHÔNG có luồng reset mật khẩu qua email — admin reset tay (app nội bộ).
 * Logic thuần nằm ở lib/server/auth-policy.ts (pure — test được bằng sucrase-node);
 * re-export tại đây để giữ import path cũ cho mọi caller.
 * ==========================================================================*/

export { isValidAccountEmail, oauthSignInGate } from './auth-policy';
export type { OAuthGate } from './auth-policy';

/**
 * passwordHash ngẫu nhiên cho tài khoản social (Google) — không ai biết plaintext,
 * nên KHÔNG thể đăng nhập bằng mật khẩu; muốn đặt mật khẩu thì thêm flow riêng sau.
 */
export async function randomPasswordHash() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return hashPassword(Buffer.from(bytes).toString('base64url'));
}
