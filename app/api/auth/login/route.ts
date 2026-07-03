import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { verifyPassword, createSession, publicUser } from '@/lib/server/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const user = await prisma.user.findUnique({
    where: { email: String(email ?? '').trim().toLowerCase() },
  });
  if (!user || !(await verifyPassword(String(password ?? ''), user.passwordHash))) {
    return NextResponse.json({ error: 'Sai email hoặc mật khẩu.' }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
