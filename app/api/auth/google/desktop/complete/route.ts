import { NextResponse } from 'next/server';
import { createSession } from '@/lib/server/auth';
import { consumeDesktopTicket, localDesktopOrigin } from '@/lib/server/google-desktop-oauth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = localDesktopOrigin(url);
  if (!origin) return NextResponse.json({ error: 'OAuth desktop chỉ chạy trên app cục bộ.' }, { status: 400 });
  const ticket = url.searchParams.get('ticket') || '';
  const userId = consumeDesktopTicket(ticket);
  if (!userId) {
    const failed = new URL('/', origin);
    failed.searchParams.set('auth_error', 'Mã hoàn tất đăng nhập đã hết hạn hoặc đã được dùng.');
    return NextResponse.redirect(failed);
  }
  await createSession(userId);
  return NextResponse.redirect(new URL('/', origin));
}
