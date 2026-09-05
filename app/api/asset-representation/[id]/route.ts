import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { kiemBodyPatch } from '../_lib/kiem';
import { kiemDelegate } from '../_lib/db';

/**
 * app/api/asset-representation/[id]
 *   PATCH {verify:true} — NGƯỜI KÝ một biểu diễn: truthLevel → verified + verifiedBy/verifiedAt.
 *     Đây là đường DUY NHẤT lên `verified` (cửa duyệt 03: máy không tự nâng). `provenance` giữ
 *     nguyên — dấu vết máy không bị xoá khi người ký (luật ⑤ image-to-3d).
 *   DELETE — xoá mềm (deletedAt), không xoá file vật lý (cùng luật LibraryAsset).
 * Quyền: asset của biểu diễn phải thuộc user; khác ⇒ 404.
 */

async function rowCuaUser(id: string, userId: string) {
  const row = await prisma.assetRepresentation.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, truthLevel: true, asset: { select: { userId: true, deletedAt: true } } },
  });
  if (!row || row.deletedAt || row.asset.deletedAt || row.asset.userId !== userId) return null;
  return row;
}

function loiJson(e: unknown, cho: string) {
  console.error(`[asset-representation/[id]] ${cho} — lỗi không lường trước:`, e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    { error: 'Lỗi máy chủ khi xử lý asset-representation.', ...(process.env.NODE_ENV === 'production' ? {} : { detail }) },
    { status: 500 },
  );
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const thieu = kiemDelegate();
    if (thieu) return thieu;
    const kiem = kiemBodyPatch(await req.json().catch(() => null));
    if (!kiem.ok) return NextResponse.json({ error: kiem.error }, { status: 400 });
    const row = await rowCuaUser(params.id, user.id);
    if (!row) return NextResponse.json({ error: 'Không tìm thấy biểu diễn.' }, { status: 404 });
    const updated = await prisma.assetRepresentation.update({
      where: { id: row.id },
      data: { truthLevel: 'verified', verifiedBy: user.id, verifiedAt: new Date() },
      select: { id: true, assetId: true, kind: true, payloadRef: true, truthLevel: true, provenance: true, verifiedBy: true, verifiedAt: true },
    });
    return NextResponse.json({ representation: updated });
  } catch (e) {
    return loiJson(e, 'PATCH');
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const thieu = kiemDelegate();
    if (thieu) return thieu;
    const row = await rowCuaUser(params.id, user.id);
    if (!row) return NextResponse.json({ error: 'Không tìm thấy biểu diễn.' }, { status: 404 });
    await prisma.assetRepresentation.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    return loiJson(e, 'DELETE');
  }
}
