import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/** GET ?after=<iso> — tin nhắn mới + danh sách ai đang online (lastSeen < 45s). */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const after = new URL(req.url).searchParams.get('after');
  const messages = await prisma.chatMessage.findMany({
    where: after ? { createdAt: { gt: new Date(after) } } : undefined,
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { user: { select: { name: true, id: true } } },
  });
  const online = await prisma.user.findMany({
    where: { lastSeenAt: { gt: new Date(Date.now() - 45_000) } },
    select: { id: true, name: true },
  });
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      userName: m.user.name,
      mine: m.userId === user.id,
    })),
    online,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { text } = await req.json().catch(() => ({}));
  const clean = String(text ?? '').trim().slice(0, 2000);
  if (!clean) return NextResponse.json({ error: 'Tin nhắn trống.' }, { status: 400 });
  const msg = await prisma.chatMessage.create({ data: { userId: user.id, text: clean } });
  return NextResponse.json({ id: msg.id, createdAt: msg.createdAt });
}
