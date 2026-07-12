/**
 * lib/server/auth-policy.ts — CHÍNH SÁCH tài khoản (PURE, không import Next/Prisma)
 * — tách khỏi lib/server/auth.ts để test được bằng sucrase-node (auth.ts kéo
 * next/headers nên không chạy ngoài Next).
 *
 * CHÍNH SÁCH (chủ dự án chốt Sprint 1 + 6-câu-treo 13/07):
 *   · Google OAuth: chỉ email đuôi @ttt.vn (env GOOGLE_ALLOWED_DOMAIN) được TẠO MỚI.
 *   · GRANDFATHER (quyết định #3): user Google NGOÀI domain nhưng ĐÃ TỒN TẠI trong DB
 *     (tạo trước khi siết chính sách) → vẫn đăng nhập tiếp; CHỈ chặn tạo mới.
 *   · Đăng ký tự do KHOÁ; bootstrap admin = scripts/seed-admin.ts (quyết định #2).
 */

/** Domain email được phép TẠO tài khoản qua Google. */
export const GOOGLE_ALLOWED_DOMAIN = (process.env.GOOGLE_ALLOWED_DOMAIN ?? 'ttt.vn').toLowerCase();

export function isAllowedGoogleEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${GOOGLE_ALLOWED_DOMAIN}`);
}

export type GoogleGate =
  | 'login-existing' // user đã có trong DB → cho vào (kể cả ngoài domain — grandfather)
  | 'create' // chưa có + đúng domain → tạo mới rồi vào
  | 'deny-new-outside-domain'; // chưa có + sai domain → từ chối

/**
 * Cổng quyết định cho Google callback — 3 ca (quyết định #3):
 *   1. cũ-ngoài-domain  → 'login-existing' (grandfather, vào được)
 *   2. mới-ngoài-domain → 'deny-new-outside-domain' (chặn)
 *   3. mới-đúng-domain  → 'create' (tạo được)
 */
export function googleSignInGate(email: string, userExists: boolean): GoogleGate {
  if (userExists) return 'login-existing';
  return isAllowedGoogleEmail(email) ? 'create' : 'deny-new-outside-domain';
}
