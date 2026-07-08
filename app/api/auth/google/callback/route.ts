import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/server/db';
import { createSession, randomPasswordHash } from '@/lib/server/auth';
import { OAUTH_STATE_COOKIE, googleConfigured } from '@/lib/server/oauth';

/**
 * Bước 2 OAuth Google: Google redirect về đây kèm ?code&state.
 *   1. so khớp state với cookie chống CSRF
 *   2. đổi code → access_token (POST oauth2.googleapis.com/token, kèm client_secret)
 *   3. lấy email + name từ userinfo
 *   4. find-or-create User theo email (passwordHash ngẫu nhiên — tài khoản social
 *      không đăng nhập bằng mật khẩu được)
 *   5. set CHÍNH cookie session `if_session` như đăng nhập thường → redirect về `/`
 *
 * Lỗi ở bước nào cũng KHÔNG throw — redirect về `/?auth_error=...` để intro hiển thị,
 * app không bao giờ crash vì OAuth.
 */
export const dynamic = 'force-dynamic';

function fail(origin: string, message: string) {
  const url = new URL('/', origin);
  url.searchParams.set('auth_error', message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  if (!googleConfigured()) {
    return fail(origin, 'Đăng nhập Google chưa được cấu hình trên máy chủ.');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = cookies().get(OAUTH_STATE_COOKIE)?.value;
  cookies().delete(OAUTH_STATE_COOKIE); // state dùng một lần

  if (url.searchParams.get('error')) {
    // người dùng bấm Huỷ ở màn consent — quay về intro, không báo lỗi to tát
    return fail(origin, 'Bạn đã huỷ đăng nhập Google.');
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail(origin, 'Phiên đăng nhập Google không hợp lệ, thử lại nhé.');
  }

  try {
    // code → tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail(origin, 'Google từ chối mã đăng nhập — kiểm tra redirect URI trong Cloud Console.');
    const tokens: { access_token?: string } = await tokenRes.json();
    if (!tokens.access_token) return fail(origin, 'Không nhận được token từ Google.');

    // token → email + name
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return fail(origin, 'Không đọc được thông tin tài khoản Google.');
    const info: { email?: string; name?: string; email_verified?: boolean } = await infoRes.json();
    const email = info.email?.trim().toLowerCase();
    if (!email) return fail(origin, 'Tài khoản Google không có email.');

    // find-or-create — cùng luật với /api/auth/register (người đầu tiên = admin)
    let user = await prisma.user.findUnique({ where: { email } });
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

    await createSession(user.id); // CHÍNH cookie if_session như login thường
    return NextResponse.redirect(new URL('/', origin));
  } catch {
    return fail(origin, 'Đăng nhập Google gặp lỗi mạng, thử lại nhé.');
  }
}
