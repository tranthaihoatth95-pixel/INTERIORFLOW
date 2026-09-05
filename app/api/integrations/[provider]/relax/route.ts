import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { docThuGian } from '@/lib/integrations/relax';

export const dynamic = 'force-dynamic';

/** GET /api/integrations/{provider}/relax?q= — nhóm THƯ GIÃN, tách hẳn khỏi bối cảnh dự án. */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const q = new URL(req.url).searchParams.get('q') ?? undefined;
  const kq = await docThuGian(user.id, params.provider, q);
  if (!kq) return NextResponse.json({ error: 'provider không thuộc nhóm thư giãn' }, { status: 404 });
  return NextResponse.json(kq, { headers: { 'Cache-Control': 'private, no-store' } });
}
