import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { planFlowVersionRetention } from '@/lib/flow-version-retention';
import { RevConflictError, updateWithRevCheck, REV_CONFLICT_RESPONSE } from '@/lib/server/rev-guard';

/**
 * H11 (19/08) — rev optimistic-concurrency. `rev` tăng ở MỌI lần ghi (schema.prisma:97 comment
 * gốc) nhưng TRƯỚC ĐÂY không route nào dùng nó để CHẶN ghi đè: 2 tab cùng sửa 1 flow → tab ghi
 * sau âm thầm đè tab ghi trước, không ai biết. Nay client (lib/store.ts persistNow, đã sửa cùng
 * lượt) gửi kèm `expectedRev` = rev flow đang cầm trên máy. Có gửi + không khớp rev hiện tại
 * trên DB → 409, KHÔNG ghi. Không gửi (client cũ, hoặc nhánh assignProject không đụng graphJson)
 * → hành vi y hệt trước giờ, không breaking.
 *
 * W5 (19/08, cùng ngày) — 4 hàm helper (RevConflictError/revWhere/updateWithRevCheck/
 * REV_CONFLICT_RESPONSE) TRÍCH XUẤT sang `lib/server/rev-guard.ts` (dùng chung cho ProjectMember +
 * LibraryAsset). File này nay chỉ IMPORT, không giữ bản local — tránh có "đường thứ hai" cho cùng
 * cơ chế (B25). `where: { id, rev }` vẫn là "extended whereUnique" (Prisma ≥4.5) như comment gốc
 * mô tả — chi tiết cơ chế xem `lib/server/rev-guard.ts`.
 */
function updateFlowWithRevCheck(
  flowId: string,
  expectedRev: number | undefined,
  data: Prisma.FlowUpdateInput,
) {
  return updateWithRevCheck(flowId, expectedRev, (where) => prisma.flow.update({ where, data }));
}

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
 * PUT: autosave graph/name/project — body { graphJson?, name?, projectId?, expectedRev? }
 * expectedRev (H11, 19/08, optional): rev flow client đang cầm — có gửi mà lệch rev thật trên
 *   DB thì 409 REV_CONFLICT, không ghi. Không gửi → hành vi cũ (luôn ghi).
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
  const expectedRev = typeof body.expectedRev === 'number' ? body.expectedRev : undefined;

  if (body.action === 'snapshot') {
    let updated;
    try {
      updated = await updateFlowWithRevCheck(r.flow.id, expectedRev, {
        version: r.flow.version + 1,
        rev: { increment: 1 },
        lastEditedBy: r.user.id,
      });
    } catch (e) {
      if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
      throw e;
    }
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
    return NextResponse.json({ version: updated.version, rev: updated.rev });
  }

  if (body.action === 'share' || body.action === 'unshare') {
    const shareToken = body.action === 'share' ? randomBytes(12).toString('hex') : null;
    let updated;
    try {
      updated = await updateFlowWithRevCheck(r.flow.id, expectedRev, {
        shareToken,
        rev: { increment: 1 },
        lastEditedBy: r.user.id,
      });
    } catch (e) {
      if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
      throw e;
    }
    return NextResponse.json({ shareToken: updated.shareToken, rev: updated.rev });
  }

  const data: Prisma.FlowUpdateInput = { rev: { increment: 1 }, lastEditedBy: r.user.id };
  if (typeof body.graphJson === 'string') data.graphJson = body.graphJson;
  if (typeof body.name === 'string') data.name = body.name;
  // 05/08 (`docs/AUDIT-BACKEND-2026-08-03.md` §2.5) — TRƯỚC ĐÂY gán `projectId` BẤT KỲ mà không
  // kiểm quyền trên project ĐÍCH: người ngoài dự án gán flow rác của mình vào projectId của dự
  // án khách → flow đó hiện trong `projects/[id]/overview` của nạn nhân (route đó chỉ lọc theo
  // projectId). Không đọc trộm được gì nhưng là GHI CHÉO RANH GIỚI DỰ ÁN.
  // Nay đi qua `assertProjectAccess` — cùng cửa duy nhất mọi route khác dùng (lib/server/access.ts),
  // KHÔNG tự query ProjectMember tại đây. Mức 'drafter' theo đúng chỉ định của audit §2.5.
  // Gỡ flow khỏi dự án (`projectId: null`) không cần quyền gì thêm — đó là flow của chính mình
  // (`ownFlow` đã chặn ở trên), đem về kho cá nhân là quyền của chủ flow.
  if ('projectId' in body) {
    const target = body.projectId ?? null;
    if (typeof target === 'string' && target) {
      try {
        await assertProjectAccess(r.user.id, target, 'drafter');
      } catch (e) {
        const p = accessErrorPayload(e);
        if (p) return NextResponse.json({ error: p.message }, { status: p.status });
        throw e;
      }
    } else if (target !== null) {
      return NextResponse.json({ error: 'projectId không hợp lệ.' }, { status: 400 });
    }
    // `data` giờ gõ kiểu `Prisma.FlowUpdateInput` (trước là `Record<string, unknown>`) — Prisma
    // sinh input dùng quan hệ (`project: { connect/disconnect }`) chứ không cho gán thẳng scalar
    // `projectId` khi model có declare `@relation`, dù cột DB vẫn là `projectId` bình thường.
    data.project = target ? { connect: { id: target } } : { disconnect: true };
  }
  if (typeof body.coverUrl === 'string') data.coverUrl = body.coverUrl.slice(0, 500);
  if (typeof body.status === 'string') data.status = body.status.slice(0, 160);
  let flow;
  try {
    flow = await updateFlowWithRevCheck(r.flow.id, expectedRev, data);
  } catch (e) {
    if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
    throw e;
  }
  return NextResponse.json({ ok: true, updatedAt: flow.updatedAt, rev: flow.rev });
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
