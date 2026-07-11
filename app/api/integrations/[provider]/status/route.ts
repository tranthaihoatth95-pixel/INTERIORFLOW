import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { providerStatus } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

/** Trạng thái 1 provider: {configured, connected}. Chạy được KHÔNG cần khoá thật (để test). */
export async function GET(_req: Request, { params }: { params: { provider: string } }) {
  const user = await getSessionUser();
  const s = await providerStatus(user?.id ?? null, params.provider);
  if (!s) return NextResponse.json({ error: 'provider không hợp lệ' }, { status: 404 });
  return NextResponse.json(s);
}
