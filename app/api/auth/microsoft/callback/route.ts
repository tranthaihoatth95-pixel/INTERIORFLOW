import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/server/db';
import { createSession, randomPasswordHash, oauthSignInGate } from '@/lib/server/auth';
import { MS_OAUTH_STATE_COOKIE, microsoftConfigured, msTenant } from '@/lib/server/oauth';
import { saveTokens } from '@/lib/integrations/oauth-core';

/**
 * Bước 2 OAuth Microsoft: Entra ID redirect về đây kèm ?code&state — ĐÚNG pattern
 * app/api/auth/google/callback:
 *   1. so khớp state với cookie chống CSRF (cookie riêng của luồng MS)
 *   2. đổi code → access_token (POST login.microsoftonline.com/{tenant}/oauth2/v2.0/token)
 *   3. lấy email + name từ Microsoft Graph /me (mail ?? userPrincipalName)
 *   4. find-or-create User theo email — chính sách MỚI 19/07: MỌI tài khoản MS
 *      (365 workspace lẫn cá nhân), passwordHash ngẫu nhiên như tài khoản social Google
 *   5. best-effort: lưu token (mã hoá) vào IntegrationAccount provider 'ms365' —
 *      Outlook/Teams/Calendar về sau dùng CHUNG identity này, khỏi connect lại.
 *      Thiếu INTEGRATION_ENC_KEY → bỏ qua êm, login vẫn thành công.
 *   6. set CHÍNH cookie session `if_session` như đăng nhập thường → redirect về `/`
 *
 * Lỗi ở bước nào cũng KHÔNG throw — redirect về `/?auth_error=...`, app không crash vì OAuth.
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

  if (!microsoftConfigured()) {
    return fail(origin, 'Đăng nhập Microsoft chưa được cấu hình trên máy chủ.');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = cookies().get(MS_OAUTH_STATE_COOKIE)?.value;
  cookies().delete(MS_OAUTH_STATE_COOKIE); // state dùng một lần

  if (url.searchParams.get('error')) {
    // user bấm Huỷ ở màn consent — quay về login, không báo lỗi to tát
    return fail(origin, 'Bạn đã huỷ đăng nhập Microsoft.');
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail(origin, 'Phiên đăng nhập Microsoft không hợp lệ, thử lại nhé.');
  }

  try {
    // code → tokens
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.MS365_CLIENT_ID!,
          client_secret: process.env.MS365_CLIENT_SECRET!,
          redirect_uri: `${origin}/api/auth/microsoft/callback`,
          grant_type: 'authorization_code',
        }),
      },
    );
    if (!tokenRes.ok) {
      return fail(origin, 'Microsoft từ chối mã đăng nhập — kiểm tra redirect URI trong Azure Portal.');
    }
    const tokens: { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string } =
      await tokenRes.json();
    if (!tokens.access_token) return fail(origin, 'Không nhận được token từ Microsoft.');

    // token → email + name (Microsoft Graph — cần scope User.Read)
    const infoRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return fail(origin, 'Không đọc được thông tin tài khoản Microsoft.');
    const info: { mail?: string | null; userPrincipalName?: string; displayName?: string } =
      await infoRes.json();
    // Tài khoản tổ chức thường có `mail`; cá nhân/một số tenant chỉ có userPrincipalName.
    const email = (info.mail ?? info.userPrincipalName)?.trim().toLowerCase();
    if (!email) return fail(origin, 'Tài khoản Microsoft không có email.');

    // CHÍNH SÁCH MỚI (19/07): mọi domain — gate chỉ chặn email dị dạng.
    let user = await prisma.user.findUnique({ where: { email } });
    const gate = oauthSignInGate(email, !!user);
    if (gate === 'deny-invalid-email') {
      return fail(origin, 'Email từ Microsoft không hợp lệ, thử tài khoản khác nhé.');
    }

    if (!user) {
      // gate === 'create' — người đầu tiên = admin (giữ luật cũ; bootstrap chuẩn là seed-admin)
      const isFirst = (await prisma.user.count()) === 0;
      user = await prisma.user.create({
        data: {
          email,
          name: info.displayName?.trim() || email.split('@')[0],
          passwordHash: await randomPasswordHash(),
          isAdmin: isFirst,
          credits: isFirst ? 500 : 200,
        },
      });
      await prisma.creditTransaction.create({
        data: { userId: user.id, amount: user.credits, reason: 'Tặng credits khởi tạo' },
      });
    }

    // Best-effort: lưu token vào IntegrationAccount 'ms365' (mã hoá AES-GCM) để tầng
    // tích hợp Outlook/Teams/Calendar dùng lại — thiếu INTEGRATION_ENC_KEY thì bỏ qua êm.
    try {
      await saveTokens(user.id, 'ms365', {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        scope: tokens.scope,
      });
    } catch {
      /* không chặn login vì thiếu khoá mã hoá / lỗi lưu token tích hợp */
    }

    await createSession(user.id); // CHÍNH cookie if_session như login thường
    return NextResponse.redirect(new URL('/', origin));
  } catch {
    return fail(origin, 'Đăng nhập Microsoft gặp lỗi mạng, thử lại nhé.');
  }
}
