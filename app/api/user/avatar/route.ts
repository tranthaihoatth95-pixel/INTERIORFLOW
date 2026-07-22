/**
 * GET/PATCH /api/user/avatar — đọc/ghi cấu hình avatar của user hiện tại.
 *
 * GET: trả AvatarConfig hiện tại (fallback deterministic từ userId nếu chưa lưu).
 * PATCH: body = AvatarConfig (partial OK, normalize sẽ fill fallback). Yêu cầu auth.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { normalizeAvatar, parseAvatar, serializeAvatar } from '@/lib/avatar';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const raw = (user as { avatar?: string | null }).avatar ?? null;
  return NextResponse.json({ avatar: parseAvatar(raw, user.id) });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const next = normalizeAvatar(body, user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: serializeAvatar(next) },
  });
  return NextResponse.json({ avatar: next });
}
