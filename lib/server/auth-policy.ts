/**
 * lib/server/auth-policy.ts — CHÍNH SÁCH tài khoản (PURE, không import Next/Prisma)
 * — tách khỏi lib/server/auth.ts để test được bằng sucrase-node (auth.ts kéo
 * next/headers nên không chạy ngoài Next).
 *
 * Chính sách trung tính:
 *   · Đăng ký + đăng nhập bằng email MỌI domain hợp lệ — app không bị trói vào
 *     một studio hay nhà cung cấp email.
 *   · OAuth (Google + Microsoft): chấp nhận MỌI tài khoản — workspace lẫn cá nhân.
 *     Gate chỉ còn chặn email dị dạng (nhiều @, thiếu domain) phòng provider trả rác.
 *   · Bootstrap admin vẫn = scripts/seed-admin.ts (giữ nguyên).
 *   · KHÔNG có luồng reset mật khẩu qua email — admin reset tay (app nội bộ).
 */

/**
 * Email đủ hình dạng để tạo tài khoản: đúng 1 dấu @, local khác rỗng,
 * domain có ít nhất 1 dấu chấm. KHÔNG validate RFC đầy đủ — provider OAuth
 * đã xác minh email thật; đây chỉ là lưới chắn dữ liệu dị dạng.
 */
export function isValidAccountEmail(email: string): boolean {
  const s = String(email).trim().toLowerCase();
  const parts = s.split('@');
  if (parts.length !== 2) return false; // chặn địa chỉ có nhiều dấu @
  const [local, domain] = parts;
  if (!local) return false;
  return /^[^\s@]+\.[^\s@]+$/.test(domain);
}

export type OAuthGate =
  | 'login-existing' // user đã có trong DB → cho vào
  | 'create' // chưa có + email hợp lệ → tạo mới rồi vào (MỌI domain)
  | 'deny-invalid-email'; // email dị dạng → từ chối (không phân biệt domain)

/**
 * Cổng quyết định cho OAuth callback (Google + Microsoft dùng chung):
 *   1. đã tồn tại      → 'login-existing'
 *   2. mới + hợp lệ    → 'create' (KHÔNG còn chặn theo domain)
 *   3. mới + dị dạng   → 'deny-invalid-email'
 */
export function oauthSignInGate(email: string, userExists: boolean): OAuthGate {
  if (userExists) return 'login-existing';
  return isValidAccountEmail(email) ? 'create' : 'deny-invalid-email';
}
