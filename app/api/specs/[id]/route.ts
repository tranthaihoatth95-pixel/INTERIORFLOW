import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { specPatch, specToDto } from '@/lib/server/specs';

/**
 * 05/08 — `docs/AUDIT-BACKEND-2026-08-03.md` §2.4 "đăng nhập là toàn quyền": trước đây BẤT KỲ
 * ai đăng nhập cũng PATCH/DELETE được ProductSpec — tức sửa `priceVnd` (làm sai tiền BOQ âm
 * thầm) hoặc xoá vĩnh viễn giá vật liệu của cả công ty. Đọc (GET) vẫn mở cho mọi người đã đăng
 * nhập (kho vật liệu là dữ liệu dùng chung, đúng chủ ý), chỉ GHI mới cần admin.
 *
 * Dùng ĐÚNG cửa `User.isAdmin` mà repo đã dùng ở `library/[id]/route.ts:16` và
 * `comments/route.ts:119` — không bịa cơ chế phân quyền thứ hai (audit §2.4 dòng cuối:
 * "chuẩn có sẵn để noi theo"). ProductSpec là kho CHUNG toàn công ty, không thuộc project nào
 * nên KHÔNG đi qua `assertProjectAccess` (cửa đó hỏi quyền trên 1 project cụ thể).
 */
function requireAdmin(user: { isAdmin: boolean } | null) {
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!user.isAdmin) {
    return NextResponse.json(
      { error: 'Chỉ admin được sửa/xoá giá vật liệu dùng chung.' },
      { status: 403 },
    );
  }
  return null;
}

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
  const denied = requireAdmin(user);
  if (denied) return denied;
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
  const denied = requireAdmin(user);
  if (denied) return denied;
  try {
    await prisma.productSpec.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  }
}
