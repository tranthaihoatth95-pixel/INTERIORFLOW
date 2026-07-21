import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/lark-user-map — "Gán tài khoản IF" (tab Nhân sự, panel "Chi tiết"): ánh xạ TAY
 * 1 lần "Tài khoản" Larkbase (vd "An.LNT") ↔ User.id nội bộ IF (docs/RESEARCH-HOME-GALLERY-
 * DASHBOARD.md §3 câu hỏi (f)). CHỈ ghi vào Prisma nội bộ — không đụng Larkbase.
 *
 * ⚠️ KHÔNG dùng cho phân quyền truy cập app (đã chốt tách biệt hoàn toàn — §2.3 quyết định 1).
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const larkAccount = typeof body?.larkAccount === 'string' ? body.larkAccount.trim() : '';
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  if (!larkAccount || !userId) {
    return NextResponse.json({ error: 'Thiếu larkAccount hoặc userId.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: 'Không tìm thấy User.' }, { status: 404 });

  const map = await prisma.larkUserMap.upsert({
    where: { larkAccount },
    update: { userId },
    create: { larkAccount, userId },
  });
  return NextResponse.json({ ok: true, map: { larkAccount: map.larkAccount, userId: map.userId } });
}

/** DELETE — gỡ 1 ánh xạ (sửa nhầm). Body { larkAccount }. */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const larkAccount = typeof body?.larkAccount === 'string' ? body.larkAccount.trim() : '';
  if (!larkAccount) return NextResponse.json({ error: 'Thiếu larkAccount.' }, { status: 400 });
  await prisma.larkUserMap.delete({ where: { larkAccount } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
