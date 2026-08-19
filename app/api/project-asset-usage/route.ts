import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';

/**
 * app/api/project-asset-usage — ProjectAssetUsage API (H6→bước kế, phiếu 20/08).
 *
 * Bước đầu chuỗi Reference/Asset: Q5(schema) → Understand → Promote → LibraryAsset →
 * ProjectAssetUsage(ĐÂY) → H9 → downstream. Model đã tồn tại thật trong dev.db (H6 xong).
 *
 * POST {projectId, assetId, usage, note?, workspaceId?, canvasId?, addedBy?} — gắn một asset
 * vào một project với một usage cụ thể. `workspaceId`/`canvasId` là string tự do (TRANSITIONAL,
 * xem comment schema.prisma:690-697) — KHÔNG validate FK.
 *
 * Cùng vấn đề soft-delete với ProjectMember (schema.prisma:719-724, xem
 * app/api/projects/[id]/members/route.ts POST dòng ~94-129 làm mẫu): @@unique([projectId,
 * assetId, usage]) không loại trừ deletedAt → gỡ rồi gắn lại CÙNG bộ ba khoá sẽ đụng unique nếu
 * create() mù. Route này PHẢI tra hàng cũ trước: đã xoá mềm → hồi sinh (update deletedAt:null);
 * còn sống → 409; không có → create.
 *
 * GET ?projectId=X — list usage còn sống của 1 project, kèm asset cơ bản.
 * GET ?assetId=X — where-used: list mọi project đang REUSE asset này.
 *
 * ProjectAssetUsage KHÔNG có field `rev` trong schema (kiểm tại ⓪ tiền đề) → KHÔNG áp
 * rev-guard (lib/server/rev-guard.ts) cho model này, khác với ProjectMember/Flow.
 */

function errResponse(e: unknown) {
  if (e instanceof AccessError) return NextResponse.json({ error: e.message }, { status: e.status });
  throw e;
}

const ASSET_SELECT = {
  id: true,
  name: true,
  path: true,
  mime: true,
  category: true,
} as const;

/** POST — gắn asset vào project với 1 usage. Cần ít nhất 'viewer' trên project (không stage-gated: gắn tham chiếu không phải sửa nội dung chặng). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const assetId = typeof body.assetId === 'string' ? body.assetId : '';
  const usage = typeof body.usage === 'string' ? body.usage : '';
  const note = typeof body.note === 'string' ? body.note : undefined;
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : undefined;
  const canvasId = typeof body.canvasId === 'string' ? body.canvasId : undefined;
  const addedBy = typeof body.addedBy === 'string' && body.addedBy ? body.addedBy : user.id;

  if (!projectId || !assetId || !usage)
    return NextResponse.json({ error: 'Cần projectId + assetId + usage.' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'viewer');

    const asset = await prisma.libraryAsset.findUnique({
      where: { id: assetId },
      select: { id: true, deletedAt: true },
    });
    if (!asset || asset.deletedAt)
      return NextResponse.json({ error: 'Không tìm thấy asset.' }, { status: 404 });

    // Tra hàng cũ theo composite unique — tên field Prisma sinh: projectId_assetId_usage
    // (thứ tự đúng @@unique([projectId, assetId, usage]) trong schema).
    const existed = await prisma.projectAssetUsage.findUnique({
      where: { projectId_assetId_usage: { projectId, assetId, usage } },
      select: { id: true, deletedAt: true },
    });

    let row;
    if (existed && !existed.deletedAt) {
      return NextResponse.json({ error: 'Asset đã gắn với usage này rồi.' }, { status: 409 });
    } else if (existed) {
      // Hồi sinh hàng cũ đã xoá mềm — cùng khuôn ProjectMember POST.
      row = await prisma.projectAssetUsage.update({
        where: { id: existed.id },
        data: { deletedAt: null, note: note ?? null, workspaceId, canvasId, addedBy },
        include: { asset: { select: ASSET_SELECT } },
      });
    } else {
      row = await prisma.projectAssetUsage.create({
        data: { projectId, assetId, usage, note: note ?? null, workspaceId, canvasId, addedBy },
        include: { asset: { select: ASSET_SELECT } },
      });
    }
    return NextResponse.json({ usage: row });
  } catch (e) {
    return errResponse(e);
  }
}

/**
 * GET ?projectId=X — usage còn sống của 1 project.
 * GET ?assetId=X — where-used: project nào đang dùng asset này.
 * Cần đúng MỘT trong hai param.
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const assetId = url.searchParams.get('assetId');

  if (!projectId && !assetId)
    return NextResponse.json({ error: 'Cần ?projectId= hoặc ?assetId=.' }, { status: 400 });
  if (projectId && assetId)
    return NextResponse.json({ error: 'Chỉ được truyền một trong hai: projectId hoặc assetId.' }, { status: 400 });

  try {
    if (projectId) {
      await assertProjectAccess(user.id, projectId, 'viewer');
      const rows = await prisma.projectAssetUsage.findMany({
        where: { projectId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { asset: { select: ASSET_SELECT } },
      });
      return NextResponse.json({ usages: rows });
    }

    // assetId: where-used — không gate theo assertProjectAccess vì trải rộng nhiều project;
    // chỉ trả các project mà user hiện là member (không rò rỉ project của người khác).
    const rows = await prisma.projectAssetUsage.findMany({
      where: { assetId: assetId!, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    const memberProjectIds = new Set(
      (
        await prisma.projectMember.findMany({
          where: { userId: user.id, deletedAt: null, projectId: { in: rows.map((r) => r.projectId) } },
          select: { projectId: true },
        })
      ).map((m) => m.projectId),
    );
    const visible = rows.filter((r) => memberProjectIds.has(r.projectId));
    return NextResponse.json({ usages: visible });
  } catch (e) {
    return errResponse(e);
  }
}
