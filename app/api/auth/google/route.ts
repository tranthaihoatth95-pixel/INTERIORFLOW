import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OAUTH_STATE_COOKIE, googleConfigured } from '@/lib/server/oauth';

/**
 * Bước 1 của OAuth 2.0 authorization-code flow với Google (tự viết, KHÔNG NextAuth):
 *   GET /api/auth/google → redirect sang màn consent của Google.
 *
 * Cần env: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (.env.local).
 * Redirect URI phải khai trong Google Cloud Console (Authorized redirect URIs):
 *   ${origin}/api/auth/google/callback   (vd: http://localhost:3000/api/auth/google/callback)
 *
 * Chống CSRF: phát `state` ngẫu nhiên, giữ trong cookie httpOnly 10 phút,
 * callback so khớp lại rồi xoá.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: 'Đăng nhập Google chưa được cấu hình — cần GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong .env.local.' },
      { status: 503 },
    );
  }

  const origin = new URL(req.url).origin;
  const state = crypto.randomUUID();
  cookies().set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 phút — đủ cho một vòng consent
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
