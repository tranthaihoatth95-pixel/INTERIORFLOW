import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { specPatch, specToDto } from '@/lib/server/specs';

/** GET /api/specs/:id — chi tiết 1 spec (property panel CAD đọc theo BlockEntity.specId). */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const spec = await prisma.productSpec.findUnique({ where: { id: params.id } });
  if (!spec) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  return NextResponse.json({ spec: specToDto(spec) });
}

/** PATCH /api/specs/:id — sửa partial (chỉ field có mặt trong body). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body JSON không hợp lệ.' }, { status: 400 });
  }
  const data = specPatch(body as Record<string, unknown>);
  if (!Object.keys(data).length) {
    return NextResponse.json({ error: 'Không có field hợp lệ để sửa.' }, { status: 400 });
  }
  try {
    const spec = await prisma.productSpec.update({ where: { id: params.id }, data });
    return NextResponse.json({ spec: specToDto(spec) });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  }
}

/** DELETE /api/specs/:id — entity CAD giữ specId mồ côi vẫn vô hại (FK mềm, render bỏ qua). */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await prisma.productSpec.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  }
}
