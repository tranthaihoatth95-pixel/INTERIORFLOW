/**
 * lib/auth/invite.ts — LỜI MỜI VÀO DỰ ÁN bằng token ký (HS256, jose). Không bảng mới.
 *
 * Token mang: {typ:'if-invite', v:1, pid, role (vai LƯU: viewer|bim|drafter|crea), inv (id
 * người mời), jti, iat, exp}. Ký bằng AUTH_SECRET — cùng biến môi trường phiên đăng nhập dùng
 * (`lib/server/auth.ts`), KHÔNG đẻ secret thứ hai. Thiếu AUTH_SECRET → chạy với secret dev và
 * `insecure:true` để UI/log nói thẳng, không im lặng.
 *
 * THU HỒI — token không trạng thái thì thu hồi kiểu gì? Ba lớp, cả ba đều kiểm ở lúc NHẬN:
 *   ① hết hạn (`exp`, mặc định 7 ngày, trần 30 ngày)
 *   ② `jti` nằm trong danh sách thu hồi của dự án (`collab-store` — server, xuyên thiết bị)
 *   ③ NGƯỜI MỜI phải CÒN năng lực `invite:create` lúc nhận — gỡ người mời khỏi dự án là mọi
 *      lời mời họ phát ra tự chết (kiểm ở route accept qua authorize-db, không ở đây)
 * Client từng cache "link còn hạn" vẫn bị chặn ở ① ② ③ — link ngoại tuyến không mở được cửa.
 *
 * Phần này THUẦN về logic (jose chạy cả Node lẫn Edge) — test bằng sucrase-node với secret giả.
 */

import { SignJWT, jwtVerify } from 'jose';
import { isInvitableStoredRole, type InvitableStoredRole } from './roles';

export const INVITE_DEFAULT_HOURS = 24 * 7;
export const INVITE_MAX_HOURS = 24 * 30;
const TYP = 'if-invite';

export interface InvitePayload {
  projectId: string;
  role: InvitableStoredRole;
  inviterId: string;
  jti: string;
  /** epoch giây */
  iat: number;
  exp: number;
}

export type InviteVerdict =
  | { ok: true; payload: InvitePayload }
  | { ok: false; reason: 'invalid' | 'expired' | 'wrong-type' | 'bad-role' };

export function inviteSecret(): { key: Uint8Array; insecure: boolean } {
  const raw = process.env.AUTH_SECRET || '';
  return { key: new TextEncoder().encode(raw || 'dev-secret-change-me'), insecure: !raw };
}

function newJti(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function clampInviteHours(h: unknown): number {
  const n = typeof h === 'number' && Number.isFinite(h) ? h : INVITE_DEFAULT_HOURS;
  return Math.min(INVITE_MAX_HOURS, Math.max(1, Math.floor(n)));
}

export async function createInviteToken(
  input: { projectId: string; role: InvitableStoredRole; inviterId: string; hours?: number },
  key: Uint8Array,
  nowMs = Date.now(),
): Promise<{ token: string; payload: InvitePayload }> {
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + clampInviteHours(input.hours) * 3600;
  const jti = newJti();
  const token = await new SignJWT({ typ: TYP, v: 1, pid: input.projectId, role: input.role, inv: input.inviterId })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(key);
  return { token, payload: { projectId: input.projectId, role: input.role, inviterId: input.inviterId, jti, iat, exp } };
}

/** Kiểm chữ ký + hạn + hình dạng. KHÔNG kiểm thu hồi/người mời (cần DB/store — route làm). */
export async function verifyInviteToken(token: string, key: Uint8Array, nowMs = Date.now()): Promise<InviteVerdict> {
  let payload: Record<string, unknown>;
  try {
    const r = await jwtVerify(token, key, { currentDate: new Date(nowMs) });
    payload = r.payload as Record<string, unknown>;
  } catch (e) {
    const expired = (e as { code?: string })?.code === 'ERR_JWT_EXPIRED';
    return { ok: false, reason: expired ? 'expired' : 'invalid' };
  }
  if (payload.typ !== TYP || payload.v !== 1) return { ok: false, reason: 'wrong-type' };
  const role = payload.role;
  if (!isInvitableStoredRole(role)) return { ok: false, reason: 'bad-role' };
  const pid = payload.pid;
  const inv = payload.inv;
  const jti = payload.jti;
  if (typeof pid !== 'string' || typeof inv !== 'string' || typeof jti !== 'string') return { ok: false, reason: 'invalid' };
  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return { ok: false, reason: 'invalid' };
  return { ok: true, payload: { projectId: pid, role, inviterId: inv, jti, iat: payload.iat, exp: payload.exp } };
}

/** Rút token từ chuỗi người dùng dán: link đầy đủ `…?token=…` hoặc token trần. */
export function extractInviteToken(raw: string): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const m = /[?&]token=([^&#\s]+)/.exec(s);
  const t = m ? decodeURIComponent(m[1]) : s;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t) ? t : null;
}
