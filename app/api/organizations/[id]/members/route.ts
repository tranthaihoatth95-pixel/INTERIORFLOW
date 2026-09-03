import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { accessErrorPayload } from '@/lib/server/access';
import { assertOrganizationAccess } from '@/lib/server/tenant-context';
import { isOrgRole } from '@/lib/server/tenant-context-policy';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await assertOrganizationAccess(user.id, params.id);
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: params.id, deletedAt: null },
      select: { userId: true, orgRole: true, joinedAt: true, user: { select: { name: true } } },
    });
    return NextResponse.json({ members });
  } catch (error) {
    const payload = accessErrorPayload(error);
    if (payload) return NextResponse.json({ error: payload.message }, { status: payload.status });
    throw error;
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.userId !== 'string' || !isOrgRole(body.orgRole))
    return NextResponse.json({ error: 'Cần userId và orgRole admin|member.' }, { status: 400 });
  try {
    await assertOrganizationAccess(user.id, params.id, 'admin');
    const target = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
    if (!target) return NextResponse.json({ error: 'User không tồn tại.' }, { status: 400 });
    const member = await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: params.id, userId: body.userId } },
      create: { organizationId: params.id, userId: body.userId, orgRole: body.orgRole },
      update: { orgRole: body.orgRole, deletedAt: null },
    });
    return NextResponse.json({ member });
  } catch (error) {
    const payload = accessErrorPayload(error);
    if (payload) return NextResponse.json({ error: payload.message }, { status: payload.status });
    throw error;
  }
}
