import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

async function ownFlow(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const flow = await prisma.flow.findUnique({ where: { id } });
  if (!flow || flow.userId !== user.id)
    return { error: NextResponse.json({ error: 'Không tìm thấy flow.' }, { status: 404 }) };
  return { user, flow };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await ownFlow(params.id);
  if ('error' in r) return r.error;
  return NextResponse.json({ flow: r.flow });
}

/**
 * PUT: autosave graph/name/project — body { graphJson?, name?, projectId? }
 * action=snapshot: tăng version + lưu FlowVersion (gọi khi Run flow)
 * action=share / unshare: bật/tắt share token
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const r = await ownFlow(params.id);
  if ('error' in r) return r.error;
  const body = await req.json().catch(() => ({}));

  if (body.action === 'snapshot') {
    const updated = await prisma.flow.update({
      where: { id: r.flow.id },
      data: { version: r.flow.version + 1 },
    });
    await prisma.flowVersion.create({
      data: { flowId: r.flow.id, version: r.flow.version, graphJson: r.flow.graphJson },
    });
    return NextResponse.json({ version: updated.version });
  }

  if (body.action === 'share' || body.action === 'unshare') {
    const shareToken = body.action === 'share' ? randomBytes(12).toString('hex') : null;
    await prisma.flow.update({ where: { id: r.flow.id }, data: { shareToken } });
    return NextResponse.json({ shareToken });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.graphJson === 'string') data.graphJson = body.graphJson;
  if (typeof body.name === 'string') data.name = body.name;
  if ('projectId' in body) data.projectId = body.projectId ?? null;
  const flow = await prisma.flow.update({ where: { id: r.flow.id }, data });
  return NextResponse.json({ ok: true, updatedAt: flow.updatedAt });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const r = await ownFlow(params.id);
  if ('error' in r) return r.error;
  await prisma.flow.delete({ where: { id: r.flow.id } });
  return NextResponse.json({ ok: true });
}
