/**
 * /api/dev-identity — DANH TÍNH NGUỒN của server đang chạy. CHỈ TỒN TẠI Ở DEV.
 *
 * VÌ SAO CÓ: cả ngày 22/08 mất thời gian vì một câu không trả lời được —
 * *"cổng này đang phục vụ MÃ NÀO?"*. Ba cổng cùng sống, nhìn giống hệt nhau:
 *   :3000 dev (hỏng vì hai `next dev` cùng ghi `.next`) · :3777 ảnh chụp phát hành ĐÓNG BĂNG
 *   · :3778 build từ mã hiện tại. Đo trên cổng sai ⇒ số rác, và không ai biết là rác.
 *
 * Route này để MÁY tự trả lời, không phải người nhớ: nó khai `cwd` + `HEAD` + `pid` của
 * CHÍNH tiến trình đang phục vụ. `scripts/dev-electron.mjs` đọc rồi so với repo tại chỗ;
 * lệch ⇒ DỪNG TO, không mở app im lặng (luật wrong-server guard).
 *
 * ⛔ SẢN XUẤT: trả 404. Không phải để "ẩn" — mà vì bản đóng gói KHÔNG có khái niệm
 * "mã hiện tại"; hỏi câu này ở đó là vô nghĩa. `dynamic = 'force-dynamic'` để Next không
 * prerender thành hằng lúc build.
 */
import { NextResponse } from 'next/server';
import { execFileSync } from 'node:child_process';

export const dynamic = 'force-dynamic';

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }
  return NextResponse.json({
    kind: 'current-source',
    cwd: process.cwd(),
    pid: process.pid,
    head: git(['rev-parse', 'HEAD']),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    // `dirty` = có sửa chưa commit. Cây này thường xuyên dirty (nhiều phiên) — đây là
    // THÔNG TIN cho người đọc, KHÔNG phải điều kiện chặn.
    dirty: git(['status', '--porcelain']).length > 0,
    startedAt: new Date().toISOString(),
  });
}
