import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';
import { HIDDEN_NOTEBOOK_PREFIX } from '@/lib/notebook/resolveProject';

/**
 * GET /api/projects/[id]/overview — dữ liệu TỔNG QUAN của ĐÚNG một dự án (Task #18).
 *
 * SCOPE 'project' — MỌI truy vấn lọc chặt theo `[id]`, không rò dữ liệu dự án khác:
 *   - flows: chỉ `where.projectId === id`.
 *   - members: chỉ của project đó (qua assertProjectAccess + count).
 *
 * `[id]` có thể là:
 *   1) Project.id thật → trả project + flows của nó + số thành viên + role của tôi.
 *   2) Flow.id (flow CHƯA gán dự án — "dự án tự do") → trả dạng project nhẹ 1 flow.
 *      Đây là vì card ở Gallery điều hướng bằng id ổn định = Project.id ?? Flow.id
 *      (lib/scope.ts). Không tạo bucket ẩn ở đây (chỉ đọc).
 * 404 (không 403) khi không có quyền — không tiết lộ dự án tồn tại.
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = String(params.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'Không tìm thấy dự án.' }, { status: 404 });

  // ── Trường hợp 1: [id] là Project thật ──────────────────────────────────────
  try {
    const myRole = await assertProjectAccess(user.id, id, 'viewer');
    const [project, flows, memberCount] = await Promise.all([
      prisma.project.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          clientName: true,
          larkProjectCode: true,
          currentStage: true,
          stageLocked: true,
          createdAt: true,
        },
      }),
      prisma.flow.findMany({
        where: { projectId: id, deletedAt: null }, // ← lọc chặt theo dự án: KHÔNG lấy flow dự án khác
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          coverUrl: true,
          status: true,
          updatedAt: true,
          version: true,
        },
      }),
      prisma.projectMember.count({ where: { projectId: id, deletedAt: null } }),
    ]);
    // Project ẩn của Notebook (__nb:) không phải dự án thật — không cho xem như dự án.
    if (project && project.name.startsWith(HIDDEN_NOTEBOOK_PREFIX)) {
      return NextResponse.json({ error: 'Không tìm thấy dự án.' }, { status: 404 });
    }
    return NextResponse.json({
      kind: 'project',
      scope: 'project',
      id,
      myRole,
      project: project
        ? {
            ...project,
            createdAt: project.createdAt.toISOString(),
          }
        : null,
      memberCount,
      flows: flows.map((f) => ({ ...f, updatedAt: f.updatedAt.toISOString() })),
    });
  } catch (e) {
    if (!(e instanceof AccessError)) throw e;
    // AccessError → rơi xuống thử Flow.id bên dưới (không lộ 403).
  }

  // ── Trường hợp 2: [id] là Flow.id của user (flow chưa gán dự án) ─────────────
  const flow = await prisma.flow.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      userId: true,
      name: true,
      coverUrl: true,
      status: true,
      updatedAt: true,
      version: true,
      projectId: true,
    },
  });
  if (flow && flow.userId === user.id) {
    return NextResponse.json({
      kind: 'flow',
      scope: 'project',
      id,
      myRole: 'owner',
      // Flow tự do: bọc như "dự án 1 flow" để trang overview hiển thị đồng nhất.
      project: {
        id,
        name: flow.name,
        clientName: null,
        larkProjectCode: null,
        currentStage: 'concept',
        stageLocked: false,
        createdAt: null,
      },
      memberCount: 1,
      flows: [{ ...flow, updatedAt: flow.updatedAt.toISOString() }],
    });
  }

  return NextResponse.json({ error: 'Không tìm thấy dự án.' }, { status: 404 });
}
