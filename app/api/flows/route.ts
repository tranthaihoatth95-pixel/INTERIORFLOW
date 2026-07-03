import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/** Danh sách flow của user (kèm project). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const flows = await prisma.flow.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      version: true,
      updatedAt: true,
      shareToken: true,
      project: { select: { id: true, name: true } },
    },
  });
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, clientName: true },
  });
  return NextResponse.json({ flows, projects });
}

/** Tạo flow mới (kèm graph hiện tại nếu gửi lên) hoặc project mới. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.type === 'project') {
    const project = await prisma.project.create({
      data: { userId: user.id, name: String(body.name ?? 'Dự án mới'), clientName: body.clientName ?? null },
    });
    return NextResponse.json({ project });
  }

  const flow = await prisma.flow.create({
    data: {
      userId: user.id,
      name: String(body.name ?? 'Untitled flow'),
      projectId: body.projectId ?? null,
      graphJson: typeof body.graphJson === 'string' ? body.graphJson : '{"nodes":[],"edges":[]}',
    },
  });
  return NextResponse.json({ flow: { id: flow.id, name: flow.name, version: flow.version } });
}
