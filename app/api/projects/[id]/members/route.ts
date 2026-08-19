import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import {
  AccessError,
  ROLES,
  assertProjectAccess,
  isProjectRole,
} from '@/lib/server/access';
import { RevConflictError, updateWithRevCheck, REV_CONFLICT_RESPONSE } from '@/lib/server/rev-guard';

/**
 * app/api/projects/[id]/members — CRUD thành viên dự án (ACCESS-CONTROL M1).
 *
 * Quy tắc (RESEARCH-ACCESS-CONTROL.md Q7 + §3):
 * - MỌI method qua getSessionUser() dòng đầu (P0 — bài học /api/comments).
 * - GET: member nào của dự án cũng xem được danh sách (viewer trở lên). Trả kèm myRole
 *   + currentStage/stageLocked để client gate UI (PRO_ONLY_TOOLS wave sau).
 * - POST/PATCH/DELETE: chỉ owner (hoặc User.isAdmin — assertProjectAccess coi admin là owner).
 * - Không bao giờ để dự án 0 owner: chặn đổi role/xoá owner CUỐI CÙNG.
 * - 404 thay 403 khi không phải member (không tiết lộ dự án tồn tại).
 *
 * W5 (19/08) — rev optimistic-concurrency, dùng chung `lib/server/rev-guard.ts` (trích từ H11).
 * POST/PATCH nhận thêm `expectedRev?: number` trong body; DELETE nhận `?expectedRev=` trên query
 * string (DELETE đã dùng query cho `userId`, giữ nhất quán). Khoá theo `ProjectMember.id` (PK
 * riêng của hàng, KHÔNG phải cặp projectId_userId — rev-guard chỉ biết `id`+`rev`). Không gửi
 * expectedRev → hành vi y hệt trước giờ (không breaking).
 */

function errResponse(e: unknown) {
  if (e instanceof AccessError) return NextResponse.json({ error: e.message }, { status: e.status });
  throw e;
}

async function ownerCount(projectId: string) {
  return prisma.projectMember.count({ where: { projectId, role: 'owner', deletedAt: null } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const myRole = await assertProjectAccess(user.id, params.id, 'viewer');
    const [members, project] = await Promise.all([
      prisma.projectMember.findMany({
        where: { projectId: params.id, deletedAt: null },
        orderBy: { joinedAt: 'asc' },
        select: {
          userId: true,
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.project.findUnique({
        where: { id: params.id },
        select: { currentStage: true, stageLocked: true },
      }),
    ]);
    return NextResponse.json({
      myRole,
      canManage: myRole === 'owner',
      currentStage: project?.currentStage ?? 'concept',
      stageLocked: project?.stageLocked ?? false,
      members: members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (e) {
    return errResponse(e);
  }
}

/** POST body {userId, role, expectedRev?} — thêm thành viên. Chỉ owner/admin. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const targetId = typeof body.userId === 'string' ? body.userId : '';
  const role = body.role;
  const expectedRev = typeof body.expectedRev === 'number' ? body.expectedRev : undefined;
  if (!targetId || !isProjectRole(role))
    return NextResponse.json(
      { error: `Cần userId + role hợp lệ (${ROLES.join('|')}).` },
      { status: 400 },
    );
  try {
    await assertProjectAccess(user.id, params.id, 'owner');
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) return NextResponse.json({ error: 'User không tồn tại.' }, { status: 400 });
    // 26/07 local-first: tra CẢ hàng đã xoá mềm — deletedAt KHÔNG nằm trong @@unique nên
    // create() mới sẽ đụng constraint nếu hàng cũ (đã gỡ) còn tồn tại. Có hàng cũ + còn hiệu
    // lực (deletedAt null) → 409 như cũ; có hàng cũ ĐÃ xoá mềm → "hồi sinh" bằng update thay
    // vì create.
    const existed = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.id, userId: targetId } },
      select: { id: true, deletedAt: true },
    });
    if (existed && !existed.deletedAt)
      return NextResponse.json({ error: 'Đã là thành viên — dùng đổi vai (PATCH).' }, { status: 409 });
    let member;
    if (existed) {
      try {
        member = await updateWithRevCheck(existed.id, expectedRev, (where) =>
          prisma.projectMember.update({
            where,
            data: {
              role,
              deletedAt: null,
              joinedAt: new Date(),
              rev: { increment: 1 },
              lastEditedBy: user.id,
            },
            select: { userId: true, role: true, joinedAt: true },
          }),
        );
      } catch (e) {
        if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
        throw e;
      }
    } else {
      member = await prisma.projectMember.create({
        data: { projectId: params.id, userId: targetId, role, lastEditedBy: user.id },
        select: { userId: true, role: true, joinedAt: true },
      });
    }
    return NextResponse.json({ member });
  } catch (e) {
    return errResponse(e);
  }
}

/** PATCH body {userId, role, expectedRev?} — đổi vai. Chỉ owner/admin. Không hạ owner cuối cùng. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const targetId = typeof body.userId === 'string' ? body.userId : '';
  const role = body.role;
  const expectedRev = typeof body.expectedRev === 'number' ? body.expectedRev : undefined;
  if (!targetId || !isProjectRole(role))
    return NextResponse.json(
      { error: `Cần userId + role hợp lệ (${ROLES.join('|')}).` },
      { status: 400 },
    );
  try {
    await assertProjectAccess(user.id, params.id, 'owner');
    const m = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.id, userId: targetId }, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!m) return NextResponse.json({ error: 'Chưa phải thành viên.' }, { status: 404 });
    if (m.role === 'owner' && role !== 'owner' && (await ownerCount(params.id)) <= 1)
      return NextResponse.json(
        { error: 'Không thể hạ vai owner cuối cùng — thêm owner khác trước.' },
        { status: 400 },
      );
    let member;
    try {
      member = await updateWithRevCheck(m.id, expectedRev, (where) =>
        prisma.projectMember.update({
          where,
          data: { role, rev: { increment: 1 }, lastEditedBy: user.id },
          select: { userId: true, role: true },
        }),
      );
    } catch (e) {
      if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
      throw e;
    }
    return NextResponse.json({ member });
  } catch (e) {
    return errResponse(e);
  }
}

/**
 * DELETE ?userId=<id>&expectedRev=<n> — gỡ thành viên. Owner/admin gỡ được mọi người; member
 * thường chỉ tự rời (self-leave). Không gỡ owner cuối cùng. `expectedRev` optional (W5, 19/08).
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const targetId = url.searchParams.get('userId') ?? '';
  const expectedRevRaw = url.searchParams.get('expectedRev');
  const expectedRev =
    expectedRevRaw !== null && Number.isFinite(Number(expectedRevRaw))
      ? Number(expectedRevRaw)
      : undefined;
  if (!targetId) return NextResponse.json({ error: 'Thiếu userId.' }, { status: 400 });
  try {
    // self-leave chỉ cần là member; gỡ người khác cần owner.
    await assertProjectAccess(user.id, params.id, targetId === user.id ? 'viewer' : 'owner');
    const m = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.id, userId: targetId }, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!m) return NextResponse.json({ error: 'Chưa phải thành viên.' }, { status: 404 });
    if (m.role === 'owner' && (await ownerCount(params.id)) <= 1)
      return NextResponse.json(
        { error: 'Không thể gỡ owner cuối cùng — chuyển quyền owner trước.' },
        { status: 400 },
      );
    // 26/07 local-first: xoá MỀM — set deletedAt thay vì delete() thật (chuẩn bị Pha 2/3 đồng bộ).
    try {
      await updateWithRevCheck(m.id, expectedRev, (where) =>
        prisma.projectMember.update({
          where,
          data: { deletedAt: new Date(), rev: { increment: 1 }, lastEditedBy: user.id },
        }),
      );
    } catch (e) {
      if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
      throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errResponse(e);
  }
}
