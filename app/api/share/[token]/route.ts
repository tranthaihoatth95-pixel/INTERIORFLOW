import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

/** Public — khách xem flow read-only qua share token, không cần đăng nhập. */
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const flow = await prisma.flow.findUnique({
    where: { shareToken: params.token },
    select: { name: true, graphJson: true, version: true, updatedAt: true, user: { select: { name: true } } },
  });
  if (!flow) return NextResponse.json({ error: 'Link không tồn tại hoặc đã tắt.' }, { status: 404 });
  return NextResponse.json({
    name: flow.name,
    graphJson: flow.graphJson,
    version: flow.version,
    updatedAt: flow.updatedAt,
    owner: flow.user.name,
  });
}
