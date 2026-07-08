/**
 * Hằng số + helper dùng chung cho social sign-in (Google thật, Apple stub).
 * OAuth 2.0 authorization-code flow TỰ VIẾT bằng fetch — KHÔNG NextAuth/passport.
 */

/** Cookie giữ `state` chống CSRF giữa bước redirect và callback (httpOnly, 10 phút). */
export const OAUTH_STATE_COOKIE = 'if_oauth_state';

/** Google đã cấu hình chưa — env-gated, thiếu key thì API trả 503, UI hiện "cần cấu hình". */
export const googleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Apple cần tài khoản Apple Developer trả phí + key .p8 — hiện chỉ dựng khung, gate bằng env. */
export const appleConfigured = () =>
  Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);
