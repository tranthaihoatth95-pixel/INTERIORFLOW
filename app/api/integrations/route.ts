import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { allStatuses } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

/** GET /api/integrations — mọi provider kèm nhóm/năng lực/scope thiếu. Không cần khoá thật để chạy. */
export async function GET() {
  const user = await getSessionUser();
  const items = await allStatuses(user?.id ?? null);
  return NextResponse.json({ items, daDangNhap: !!user }, { headers: { 'Cache-Control': 'private, no-store' } });
}
