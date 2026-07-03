import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { hashPassword, createSession, publicUser } from '@/lib/server/auth';

export async function POST(req: Request) {
  const { email, name, password } = await req.json().catch(() => ({}));
  if (!email || !name || !password || String(password).length < 6) {
    return NextResponse.json(
      { error: 'Cần email, tên và mật khẩu ≥ 6 ký tự.' },
      { status: 400 },
    );
  }
  const normalized = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return NextResponse.json({ error: 'Email đã đăng ký.' }, { status: 409 });

  // người đầu tiên = admin, nhiều credits hơn
  const isFirst = (await prisma.user.count()) === 0;
  const user = await prisma.user.create({
    data: {
      email: normalized,
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
