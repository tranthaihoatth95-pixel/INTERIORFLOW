import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/server/db';
import { oauthSignInGate, randomPasswordHash } from '@/lib/server/auth';
import { googleDesktopConfigured } from '@/lib/server/oauth';
import {
  GOOGLE_DESKTOP_STATE_COOKIE,
  GOOGLE_DESKTOP_VERIFIER_COOKIE,
  issueDesktopTicket,
  localDesktopOrigin,
} from '@/lib/server/google-desktop-oauth';

export const dynamic = 'force-dynamic';

function fail(origin: string, message: string) {
  const url = new URL('/', origin);
  url.searchParams.set('auth_error', message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = localDesktopOrigin(url);
  if (!origin) return NextResponse.json({ error: 'OAuth desktop chỉ chạy trên app cục bộ.' }, { status: 400 });
  if (!googleDesktopConfigured()) return fail(origin, 'Google Sign-In cho desktop chưa được cấu hình.');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = cookies().get(GOOGLE_DESKTOP_STATE_COOKIE)?.value;
  const verifier = cookies().get(GOOGLE_DESKTOP_VERIFIER_COOKIE)?.value;
  cookies().delete(GOOGLE_DESKTOP_STATE_COOKIE);
  cookies().delete(GOOGLE_DESKTOP_VERIFIER_COOKIE);

  if (url.searchParams.get('error')) return fail(origin, 'Bạn đã huỷ đăng nhập Google.');
  if (!code || !state || !cookieState || !verifier || state !== cookieState) {
    return fail(origin, 'Phiên đăng nhập Google không hợp lệ, thử lại nhé.');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_DESKTOP_CLIENT_ID!,
        redirect_uri: `${origin}/api/auth/google/desktop/callback`,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) return fail(origin, 'Google từ chối mã đăng nhập — kiểm tra Desktop OAuth Client ID.');
    const tokens: { access_token?: string } = await tokenRes.json();
    if (!tokens.access_token) return fail(origin, 'Không nhận được token từ Google.');

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return fail(origin, 'Không đọc được thông tin tài khoản Google.');
    const info: { email?: string; name?: string; email_verified?: boolean } = await infoRes.json();
    const email = info.email?.trim().toLowerCase();
    if (!email || info.email_verified !== true) return fail(origin, 'Google chưa xác minh email của tài khoản này.');

    let user = await prisma.user.findUnique({ where: { email } });
    if (oauthSignInGate(email, !!user) === 'deny-invalid-email') return fail(origin, 'Email từ Google không hợp lệ.');
    if (!user) {
      const isFirst = (await prisma.user.count()) === 0;
      user = await prisma.user.create({
        data: {
          email,
          name: info.name?.trim() || email.split('@')[0],
          passwordHash: await randomPasswordHash(),
          isAdmin: isFirst,
          credits: isFirst ? 500 : 200,
        },
      });
      await prisma.creditTransaction.create({
        data: { userId: user.id, amount: user.credits, reason: 'Tặng credits khởi tạo' },
      });
    }

    const ticket = issueDesktopTicket(user.id);
    return NextResponse.redirect(`interiorflow://auth/google?ticket=${encodeURIComponent(ticket)}`);
  } catch {
    return fail(origin, 'Đăng nhập Google gặp lỗi mạng, thử lại nhé.');
  }
}
