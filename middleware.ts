import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * middleware.ts — LƯỚI ĐỠ xác thực cho toàn bộ `/api/*`
 * (`docs/AUDIT-BACKEND-2026-08-03.md` §2.1: "middleware.ts KHÔNG TỒN TẠI, 51/55 route tự gọi
 * getSessionUser() dòng đầu — không route nào sót, nhưng không có lưới").
 *
 * ⚠️ ĐÂY LÀ LƯỚI ĐỠ, KHÔNG PHẢI CỬA CHÍNH. Route VẪN PHẢI tự gọi `getSessionUser()` như cũ —
 * không được xoá dòng đó ở bất kỳ route nào sau khi có file này. Lý do:
 *   · Middleware chạy ở EDGE runtime — KHÔNG dùng được Prisma, nên chỉ xác thực được CHỮ KÝ
 *     token, KHÔNG kiểm được user còn tồn tại trong DB (`getSession()` tầng 2, `lib/server/auth.ts`)
 *     — user bị xoá vẫn có cookie hợp lệ về mặt chữ ký.
 *   · Middleware không biết `user.id`/`isAdmin`/quyền project — mọi phân quyền thật vẫn ở route
 *     (`assertProjectAccess`, `user.isAdmin`).
 * Giá trị của nó: route MỚI quên `getSessionUser()` thì vẫn không lộ dữ liệu cho người lạ —
 * đúng nghĩa "lưới đỡ" mà audit đề nghị.
 *
 * DANH SÁCH CÔNG KHAI — đúng 4 nhóm audit §2.1 xác nhận "không kiểm phiên là ĐÚNG THIẾT KẾ":
 *   · `auth/*`      — cửa đăng nhập/đăng ký + luồng OAuth (state CSRF tự lo trong route).
 *   · `health`      — 3 boolean cấu hình provider. Audit đánh 🟡 "nên gate" nhưng ĐỂ CÔNG KHAI:
 *                     đây là endpoint để kiểm server sống (dùng lúc CHƯA đăng nhập được), gate
 *                     nó thì mất đúng công dụng. Ghi rõ để không ai tưởng bỏ sót.
 *   · `share/[token]` — link chia sẻ công khai CÓ CHỦ Ý (token 12 byte ngẫu nhiên).
 *
 * Cookie: tên đổi theo môi trường (`lib/server/auth.ts:44` — `if_session` / `if_session_wt` /
 * `if_session_noenv` để worktree không đụng phiên thật). Không import hằng đó vào đây được
 * (auth.ts kéo theo Prisma/bcrypt/fs — không chạy ở Edge), nên thử cả 3 tên. Đây là chủ ý, không
 * phải hardcode ẩu: 3 tên là TOÀN BỘ tập giá trị có thể của biến `COOKIE` bên đó.
 */

const SESSION_COOKIES = ['if_session', 'if_session_wt', 'if_session_noenv'] as const;

/** Cùng công thức secret với `lib/server/auth.ts:46` (`||` để chuỗi rỗng cũng rơi về fallback). */
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');

/** `/api/auth/...`, `/api/health`, `/api/share/...` — xem docstring. */
function isPublicApi(pathname: string): boolean {
  return (
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/share/')
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicApi(pathname)) return NextResponse.next();

  const token = SESSION_COOKIES.map((name) => req.cookies.get(name)?.value).find(Boolean);
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) throw new Error('no-sub');
  } catch {
    // Chữ ký sai / hết hạn — route sẽ không bao giờ được gọi. Cùng shape lỗi mà mọi route đang
    // trả (`{ error: 'unauthorized' }`, 401) để client không phải xử lý thêm dạng lỗi mới.
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

/** CHỈ chạy trên `/api/*` — không đụng trang, không đụng asset tĩnh (`_next`, ảnh…). */
export const config = {
  matcher: '/api/:path*',
};
