import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { googleDesktopConfigured } from '@/lib/server/oauth';
import {
  GOOGLE_DESKTOP_STATE_COOKIE,
  GOOGLE_DESKTOP_VERIFIER_COOKIE,
  localDesktopOrigin,
  newPkce,
} from '@/lib/server/google-desktop-oauth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!googleDesktopConfigured()) {
    return NextResponse.json({ error: 'Google Sign-In cho desktop chưa được cấu hình.' }, { status: 503 });
  }
  const url = new URL(req.url);
  const origin = localDesktopOrigin(url);
  if (!origin) return NextResponse.json({ error: 'OAuth desktop chỉ chạy trên app cục bộ.' }, { status: 400 });

  const state = crypto.randomUUID();
  const { verifier, challenge } = newPkce();
  const cookie = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 600 };
  cookies().set(GOOGLE_DESKTOP_STATE_COOKIE, state, cookie);
  cookies().set(GOOGLE_DESKTOP_VERIFIER_COOKIE, verifier, cookie);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_DESKTOP_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/desktop/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
