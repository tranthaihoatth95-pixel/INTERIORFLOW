import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getProvider } from '@/lib/integrations/registry';
import { disconnect } from '@/lib/integrations/oauth-core';

export const dynamic = 'force-dynamic';

/** Ngắt kết nối: xoá token đã lưu của (user, provider). */
export async function POST(_req: Request, { params }: { params: { provider: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!getProvider(params.provider)) return NextResponse.json({ error: 'provider không hợp lệ' }, { status: 404 });
  await disconnect(user.id, params.provider);
  return NextResponse.json({ ok: true });
}
