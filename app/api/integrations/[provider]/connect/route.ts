import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getProvider } from '@/lib/integrations/registry';
import { buildAuthUrl } from '@/lib/integrations/oauth-core';

export const dynamic = 'force-dynamic';

/** Bước 1 OAuth: redirect sang consent của provider (state CSRF theo provider). */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = getProvider(params.provider);
  if (!cfg) return NextResponse.json({ error: 'provider không hợp lệ' }, { status: 404 });
  if (cfg.kind !== 'oauth') {
    return NextResponse.json({ error: `${cfg.label} không dùng OAuth (kind=${cfg.kind}).` }, { status: 400 });
  }
  if (!cfg.configured()) {
    return NextResponse.json({ error: `${cfg.label} chưa cấu hình khoá trên máy chủ.` }, { status: 503 });
  }
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(buildAuthUrl(cfg, origin));
}
