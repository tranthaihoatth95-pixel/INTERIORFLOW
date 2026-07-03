import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';

const COOKIE = 'if_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
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

export function publicUser(u: { id: string; email: string; name: string; credits: number; isAdmin: boolean }) {
  return { id: u.id, email: u.email, name: u.name, credits: u.credits, isAdmin: u.isAdmin };
}
