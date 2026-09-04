import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { docLichHop } from '@/lib/integrations/calendar';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/{provider}/calendar?tu=ISO&den=ISO&max=25 — họp/lịch cho bối cảnh dự án.
 * Luôn 200 với `KetQuaTichHop` (trạng thái nói việc tiếp theo), trừ 401/404. Không bao giờ trả token.
 */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const u = new URL(req.url);
  const max = Number(u.searchParams.get('max') ?? '');
  const kq = await docLichHop(user.id, params.provider, {
    tu: u.searchParams.get('tu') ?? undefined,
    den: u.searchParams.get('den') ?? undefined,
    max: Number.isFinite(max) && max > 0 ? max : undefined,
  });
  if (!kq) return NextResponse.json({ error: 'provider không có năng lực lịch' }, { status: 404 });
  return NextResponse.json(kq, { headers: { 'Cache-Control': 'private, no-store' } });
}
