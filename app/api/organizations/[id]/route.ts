import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { accessErrorPayload } from '@/lib/server/access';
import { assertOrganizationAccess } from '@/lib/server/tenant-context';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await assertOrganizationAccess(user.id, params.id);
    const organization = await prisma.organization.findUnique({ where: { id: params.id } });
    return NextResponse.json({ organization });
  } catch (error) {
    const payload = accessErrorPayload(error);
    if (payload) return NextResponse.json({ error: payload.message }, { status: payload.status });
    throw error;
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Tên tổ chức không hợp lệ.' }, { status: 400 });
  try {
    await assertOrganizationAccess(user.id, params.id, 'admin');
    const organization = await prisma.organization.update({ where: { id: params.id }, data: { name } });
    return NextResponse.json({ organization });
  } catch (error) {
    const payload = accessErrorPayload(error);
    if (payload) return NextResponse.json({ error: payload.message }, { status: payload.status });
    throw error;
  }
}
