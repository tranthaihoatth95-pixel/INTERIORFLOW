import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { planFlowVersionRetention } from '@/lib/flow-version-retention';

async function ownFlow(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  // deletedAt: null — flow đã xoá mềm coi như không tồn tại với mọi thao tác qua route này.
  const flow = await prisma.flow.findUnique({ where: { id, deletedAt: null } });
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
 * action=snapshot: tăng version + lưu FlowVersion, rồi tỉa theo thang lưu giữ (④ đổi cò, 01/08,
 *   docs/QUYET-DINH-HA-TANG-2026-07-31.md §④ phương án C) — CHỈ gọi khi người dùng bấm
 *   "Đánh dấu bản này" (CommandPalette.tsx qua lib/workspace.ts snapshotFlow()), KHÔNG còn tự
 *   động mỗi lượt "Chạy flow" như trước.
 * action=share / unshare: bật/tắt share token
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const r = await ownFlow(params.id);
  if ('error' in r) return r.error;
  const body = await req.json().catch(() => ({}));

  if (body.action === 'snapshot') {
    const updated = await prisma.flow.update({
      where: { id: r.flow.id },
      data: { version: r.flow.version + 1, rev: { increment: 1 }, lastEditedBy: r.user.id },
    });
    await prisma.flowVersion.create({
      data: { flowId: r.flow.id, version: r.flow.version, graphJson: r.flow.graphJson },
    });
    // Thang lưu giữ — đọc lại TOÀN BỘ mốc thời gian của flow này (chỉ id+createdAt, không kéo
    // graphJson nặng), lập kế hoạch tỉa THUẦN, xoá đúng các bản bị tỉa. Không chặn phản hồi nếu
    // lỗi (an toàn hơn để tồn 1 bản thừa còn hơn chặn thao tác đánh dấu của người dùng).
    try {
      const all = await prisma.flowVersion.findMany({
        where: { flowId: r.flow.id },
        select: { id: true, createdAt: true },
      });
      const deleteIds = planFlowVersionRetention(
        all.map((v) => ({ id: v.id, createdAtMs: v.createdAt.getTime() })),
        Date.now(),
      );
      if (deleteIds.length > 0) {
        await prisma.flowVersion.deleteMany({ where: { id: { in: deleteIds } } });
      }
    } catch {
      /* tỉa là dọn dẹp nền — lỗi ở đây không được làm hỏng việc đánh dấu bản vừa ghi thành công. */
    }
    return NextResponse.json({ version: updated.version });
  }

  if (body.action === 'share' || body.action === 'unshare') {
    const shareToken = body.action === 'share' ? randomBytes(12).toString('hex') : null;
    await prisma.flow.update({
      where: { id: r.flow.id },
      data: { shareToken, rev: { increment: 1 }, lastEditedBy: r.user.id },
    });
    return NextResponse.json({ shareToken });
  }

  const data: Record<string, unknown> = { rev: { increment: 1 }, lastEditedBy: r.user.id };
  if (typeof body.graphJson === 'string') data.graphJson = body.graphJson;
  if (typeof body.name === 'string') data.name = body.name;
  if ('projectId' in body) data.projectId = body.projectId ?? null;
  if (typeof body.coverUrl === 'string') data.coverUrl = body.coverUrl.slice(0, 500);
  if (typeof body.status === 'string') data.status = body.status.slice(0, 160);
  const flow = await prisma.flow.update({ where: { id: r.flow.id }, data });
  return NextResponse.json({ ok: true, updatedAt: flow.updatedAt });
}

/** 26/07 local-first: xoá MỀM — set deletedAt thay vì delete() thật (chuẩn bị Pha 2/3 đồng bộ). */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const r = await ownFlow(params.id);
  if ('error' in r) return r.error;
  await prisma.flow.update({
    where: { id: r.flow.id },
    data: { deletedAt: new Date(), rev: { increment: 1 }, lastEditedBy: r.user.id },
  });
  return NextResponse.json({ ok: true });
}
