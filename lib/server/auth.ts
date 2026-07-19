import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';

/**
 * ⚠️ CÁCH LY COOKIE THEO MÔI TRƯỜNG — sửa bug "CAD → Render văng ra màn đăng nhập".
 *
 * Cookie trình duyệt định danh theo HOST, **KHÔNG theo PORT**: `localhost:3000`,
 * `localhost:4090`, `localhost:4091` DÙNG CHUNG một lọ cookie. Repo này chạy nhiều
 * dev server song song (mỗi git worktree một port) và **worktree KHÔNG có `.env`**
 * → server đó thiếu AUTH_SECRET (rơi về `dev-secret-change-me`) lẫn DATABASE_URL.
 * Hệ quả trước khi sửa: mở app worktree trên `localhost:<port>` rồi bấm Đăng xuất
 * (hoặc bất kỳ đường nào gọi DELETE /api/auth/me) sẽ XOÁ `if_session` của host
 * `localhost` — tức xoá luôn phiên đăng nhập thật ở `localhost:3000`. Người dùng
 * không hề hay biết vì chặng CAD không kiểm tra phiên; mãi tới lúc bấm Render mới
 * lộ ra dưới dạng "tự nhiên bị văng ra đăng nhập".
 *
 * Cách ly: server KHÔNG cấu hình AUTH_SECRET là môi trường tạm → dùng TÊN COOKIE
 * KHÁC, nên không bao giờ đọc/ghi/xoá đè cookie của môi trường thật.
 */
const HAS_AUTH_SECRET = !!process.env.AUTH_SECRET;
const COOKIE = HAS_AUTH_SECRET ? 'if_session' : 'if_session_noenv';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');

if (!HAS_AUTH_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn(
    `[auth] KHÔNG thấy AUTH_SECRET (thiếu .env ở thư mục chạy?). Đang dùng secret dự phòng + ` +
      `cookie "${COOKIE}" để KHÔNG đụng phiên đăng nhập thật ở cùng host localhost. ` +
      `Muốn đăng nhập thật trên server này: copy .env từ repo chính sang.`,
  );
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/**
 * Tạo session cookie `if_session`.
 * remember=true (mặc định — GIỮ hành vi cũ cho mọi caller hiện có: register, Google
 * callback…): cookie persistent maxAge 30 ngày.
 * remember=false ("Ghi nhớ đăng nhập" KHÔNG tick): cookie PHIÊN — không maxAge, trình
 * duyệt đóng là hết. JWT bên trong vẫn exp 30d (backstop, giữ nguyên semantics token cũ).
 */
export async function createSession(userId: string, remember = true) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

/**
 * Kết quả đọc phiên — PHÂN BIỆT RÕ các trạng thái, không gộp hết thành `null`.
 *
 * Bản cũ `catch { return null }` nuốt chung 5 nguyên nhân rất khác nhau (không có
 * cookie · chữ ký sai · hết hạn · user không còn · DB lỗi). Client chỉ thấy 401 nên
 * luôn hiển thị màn đăng nhập, kể cả khi thật ra CHỈ LÀ DB trục trặc — và cookie chết
 * thì nằm lì trong trình duyệt nên user kẹt vòng lặp im lặng, đăng nhập lại cũng
 * không hiểu vì sao vừa nãy bị văng.
 *
 *   · `authenticated` — hợp lệ.
 *   · `anonymous`     — chưa từng đăng nhập (không có cookie). Hiện màn đăng nhập là ĐÚNG.
 *   · `stale`         — CÓ cookie nhưng đã chết (sai chữ ký / hết hạn / user không còn).
 *                       Phải XOÁ cookie + nói rõ cho người dùng, đừng im lặng.
 *   · `error`         — hạ tầng (DB) lỗi. TUYỆT ĐỐI không coi là "chưa đăng nhập" và
 *                       KHÔNG được xoá cookie — người dùng vẫn đang đăng nhập hợp lệ.
 */
export type SessionState =
  | { state: 'authenticated'; user: NonNullable<Awaited<ReturnType<typeof findUserById>>> }
  | { state: 'anonymous' }
  | { state: 'stale'; reason: 'invalid' | 'expired' | 'user-gone' }
  | { state: 'error' };

const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });

/** Đọc phiên hiện tại kèm LÝ DO. Đồng thời cập nhật lastSeenAt (presence). */
export async function getSession(): Promise<SessionState> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return { state: 'anonymous' };

  // ── Tầng 1: xác thực token (thuần CPU, không đụng DB) ───────────────────────
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return { state: 'stale', reason: 'invalid' };
    userId = String(payload.sub);
  } catch (e) {
    // Hết hạn ≠ chữ ký sai. "Chữ ký sai" thường là cookie do server KHÁC cùng host
    // localhost phát hành (worktree thiếu .env → secret dự phòng) — xem ghi chú COOKIE.
    const expired = (e as { code?: string })?.code === 'ERR_JWT_EXPIRED';
    return { state: 'stale', reason: expired ? 'expired' : 'invalid' };
  }

  // ── Tầng 2: tra DB. Lỗi ở đây là lỗi HẠ TẦNG, không phải "chưa đăng nhập" ────
  try {
    const user = await findUserById(userId);
    if (!user) return { state: 'stale', reason: 'user-gone' };
    // presence chỉ là thông tin PHỤ: ghi hỏng thì bỏ qua, KHÔNG được làm rớt phiên
    // (bản cũ để lỗi ghi này rơi vào catch chung → đá người dùng về màn đăng nhập).
    if (Date.now() - user.lastSeenAt.getTime() > 20_000) {
      await prisma.user
        .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
        .catch(() => {});
    }
    return { state: 'authenticated', user };
  } catch {
    return { state: 'error' };
  }
}

/**
 * User hiện tại từ cookie — null nếu không đăng nhập được.
 * Giữ NGUYÊN chữ ký cũ cho ~22 route đang dùng; muốn biết lý do thì gọi `getSession()`.
 */
export async function getSessionUser() {
  const s = await getSession();
  return s.state === 'authenticated' ? s.user : null;
}

/**
 * Shape user trả về client. email/phone nullable trong DB (đăng ký bằng email HOẶC SĐT)
 * — coerce email về '' để giữ contract cũ của client (SessionUser.email: string).
 */
export function publicUser(u: {
  id: string;
  email: string | null;
  phone?: string | null;
  name: string;
  credits: number;
  isAdmin: boolean;
}) {
  return {
    id: u.id,
    email: u.email ?? '',
    phone: u.phone ?? null,
    name: u.name,
    credits: u.credits,
    isAdmin: u.isAdmin,
  };
}

/* ============================================================================
 * Identifier = email HOẶC số điện thoại VN.
 * KHÔNG có OTP: app chạy nội bộ/LAN, SĐT chỉ là định danh đăng nhập, không xác minh.
 * ==========================================================================*/

/**
 * Chuẩn hoá SĐT Việt Nam về dạng canonical `0xxxxxxxxx`.
 * Chấp nhận: "+84 912 345 678", "84912345678", "0912.345.678"…
 * Trả về null nếu không phải SĐT hợp lệ (9–11 số sau chuẩn hoá, bắt đầu bằng 0).
 */
export function normalizeVNPhone(raw: string): string | null {
  let s = String(raw).replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('84') && s.length >= 10) s = '0' + s.slice(2);
  if (!/^0\d{8,10}$/.test(s)) return null;
  return s;
}

/** identifier chứa '@' → email; ngược lại thử parse SĐT VN. */
export function parseIdentifier(raw: string): { email: string } | { phone: string } | null {
  const s = String(raw).trim();
  if (!s) return null;
  if (s.includes('@')) return { email: s.toLowerCase() };
  const phone = normalizeVNPhone(s);
  return phone ? { phone } : null;
}

/** Tìm user theo email hoặc SĐT — null nếu identifier không hợp lệ / không tồn tại. */
export async function findUserByIdentifier(raw: string) {
  const id = parseIdentifier(raw);
  if (!id) return null;
  return 'email' in id
    ? prisma.user.findUnique({ where: { email: id.email } })
    : prisma.user.findUnique({ where: { phone: id.phone } });
}

/* ============================================================================
 * CHÍNH SÁCH TẠO TÀI KHOẢN (chủ dự án chốt MỚI 19/07 — thay "chỉ Google @ttt.vn"):
 *   · Đăng ký + đăng nhập email MỌI domain (register công khai đã MỞ LẠI).
 *   · OAuth Google + Microsoft: chấp nhận mọi tài khoản (workspace lẫn cá nhân).
 *   · Bootstrap admin đầu tiên = scripts/seed-admin.ts (giữ nguyên).
 *   · KHÔNG có luồng reset mật khẩu qua email — admin reset tay (app nội bộ).
 * Logic thuần nằm ở lib/server/auth-policy.ts (pure — test được bằng sucrase-node);
 * re-export tại đây để giữ import path cũ cho mọi caller.
 * ==========================================================================*/

export { isValidAccountEmail, oauthSignInGate } from './auth-policy';
export type { OAuthGate } from './auth-policy';

/**
 * passwordHash ngẫu nhiên cho tài khoản social (Google) — không ai biết plaintext,
 * nên KHÔNG thể đăng nhập bằng mật khẩu; muốn đặt mật khẩu thì thêm flow riêng sau.
 */
export async function randomPasswordHash() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return hashPassword(Buffer.from(bytes).toString('base64url'));
}
