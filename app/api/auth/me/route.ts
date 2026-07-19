import { NextResponse } from 'next/server';
import { getSession, clearSession, publicUser } from '@/lib/server/auth';

/**
 * Phiên hiện tại. Trả về LÝ DO chứ không chỉ 401 trống — client cần phân biệt
 * "chưa đăng nhập" (hiện màn đăng nhập) với "server đang lỗi" (giữ nguyên phiên,
 * thử lại) và "cookie đã chết" (xoá cookie + báo rõ cho người dùng).
 */
export async function GET() {
  const s = await getSession();

  if (s.state === 'authenticated') {
    return NextResponse.json({ user: publicUser(s.user) });
  }

  // DB/hạ tầng lỗi — người dùng VẪN đang đăng nhập hợp lệ. Không xoá cookie, không
  // trả 401 (401 sẽ khiến client đá về màn đăng nhập oan).
  if (s.state === 'error') {
    return NextResponse.json({ user: null, reason: 'server-unavailable' }, { status: 503 });
  }

  // Cookie chết (sai chữ ký / hết hạn / user không còn): XOÁ ngay để lần sau vào
  // sạch sẽ, thay vì để cookie zombie nằm lì gây văng đi văng lại không rõ lý do.
  if (s.state === 'stale') {
    clearSession();
    return NextResponse.json({ user: null, reason: s.reason }, { status: 401 });
  }

  return NextResponse.json({ user: null, reason: 'anonymous' }, { status: 401 });
}

export async function DELETE() {
  clearSession();
  return NextResponse.json({ ok: true });
}
