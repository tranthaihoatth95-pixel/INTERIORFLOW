import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getProvider } from '@/lib/integrations/registry';
import { verifyState, exchangeCode, saveTokens } from '@/lib/integrations/oauth-core';

export const dynamic = 'force-dynamic';

/** Bước 2 OAuth: verify state → đổi code lấy token → lưu (mã hoá) → về app. Không bao giờ crash. */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const url = new URL(req.url);
  const origin = url.origin;
  const back = (msg: string, ok = false) => {
    const u = new URL('/', origin);
    u.searchParams.set(ok ? 'integration' : 'integration_error', ok ? params.provider : msg);
    return NextResponse.redirect(u);
  };

  const user = await getSessionUser();
  if (!user) return back('cần đăng nhập trước khi kết nối');

  const cfg = getProvider(params.provider);
  if (!cfg || cfg.kind !== 'oauth') return back('provider không hợp lệ');
  if (url.searchParams.get('error')) return back('bạn đã huỷ kết nối');
  if (!verifyState(cfg.id, url.searchParams.get('state'))) return back('phiên kết nối không hợp lệ, thử lại');

  const code = url.searchParams.get('code');
  if (!code) return back('thiếu mã uỷ quyền');

  try {
    const tokens = await exchangeCode(cfg, code, origin);
    if (!tokens.access_token) return back('không nhận được token');
    await saveTokens(user.id, cfg.id, tokens);
    return back(cfg.id, true);
  } catch (e) {
    return back(e instanceof Error ? e.message.slice(0, 80) : 'lỗi đổi token');
  }
}
