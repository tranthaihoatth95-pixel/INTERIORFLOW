import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MS_OAUTH_STATE_COOKIE, microsoftConfigured, msTenant } from '@/lib/server/oauth';

/**
 * Bước 1 OAuth 2.0 authorization-code với Microsoft identity platform (Entra ID)
 * — ĐÚNG pattern app/api/auth/google (tự viết bằng fetch, KHÔNG NextAuth):
 *   GET /api/auth/microsoft → redirect sang màn consent của Microsoft.
 *
 * Cần env: MS365_CLIENT_ID + MS365_CLIENT_SECRET (dùng chung Azure App Registration
 * với tầng tích hợp MS365 — docs/INTEGRATIONS.md có hướng dẫn tạo).
 * Redirect URI phải khai trong Azure Portal (Web):
 *   ${origin}/api/auth/microsoft/callback
 *
 * Tenant 'common' (MS365_TENANT) → nhận cả tài khoản tổ chức (MS 365 workspace)
 * lẫn Microsoft account cá nhân. Chống CSRF: state cookie httpOnly 10 phút,
 * TÁCH tên với Google để 2 luồng không đè nhau.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!microsoftConfigured()) {
    return NextResponse.json(
      { error: 'Đăng nhập Microsoft chưa được cấu hình — cần MS365_CLIENT_ID và MS365_CLIENT_SECRET trong .env.local.' },
      { status: 503 },
    );
  }

  const origin = new URL(req.url).origin;
  const state = crypto.randomUUID();
  cookies().set(MS_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 phút — đủ cho một vòng consent
  });

  const params = new URLSearchParams({
    client_id: process.env.MS365_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/microsoft/callback`,
    response_type: 'code',
    response_mode: 'query',
    // scope tối thiểu cho login; offline_access phát refresh_token — lưu vào
    // IntegrationAccount để Outlook/Teams/Calendar dùng CHUNG identity này về sau.
    scope: 'openid profile email User.Read offline_access',
    state,
    prompt: 'select_account',
  });
  return NextResponse.redirect(
    `https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/authorize?${params}`,
  );
}
