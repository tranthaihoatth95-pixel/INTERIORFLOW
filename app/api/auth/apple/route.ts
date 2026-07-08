import { NextResponse } from 'next/server';
import { appleConfigured } from '@/lib/server/oauth';

/**
 * Sign in with Apple — STUB có chủ đích.
 * Apple yêu cầu tài khoản Apple Developer trả phí (99$/năm) + Services ID + key .p8
 * để ký client_secret (JWT ES256). Chưa có tài khoản nên route này chỉ dựng khung:
 * env-gated giống Google (APPLE_CLIENT_ID/APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY),
 * có key rồi thì thay nhánh dưới bằng redirect sang
 * https://appleid.apple.com/auth/authorize (+ callback route tương tự Google).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!appleConfigured()) {
    return NextResponse.json({ error: 'Cần Apple Developer — sắp bật.' }, { status: 503 });
  }
  // Env đủ nhưng flow chưa viết — vẫn 503 để không bao giờ crash app.
  return NextResponse.json({ error: 'Đăng nhập Apple đang hoàn thiện — sắp bật.' }, { status: 503 });
}
