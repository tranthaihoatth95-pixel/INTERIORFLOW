/**
 * app/api/comments/image/[id]/route.ts — IF-SECURE-ARTIFACT-DELIVERY-001.
 *
 * Đường ĐỌC CÓ XÁC THỰC cho ảnh đính kèm góp ý. Thay cho `/comments-images/<id>.<ext>` (file tĩnh
 * trong `public/`, không qua bất kỳ cửa quyền nào). Ảnh nay xếp đúng hạng với siêu dữ liệu góp ý
 * ở `app/api/comments/route.ts`: chưa có phiên thì không byte nào rời máy chủ.
 *
 * Vẫn phục vụ được file di sản còn nằm ở `public/comments-images/` — đọc ngã về, KHÔNG di chuyển.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { docAnhGopY } from '@/lib/server/comment-artifact';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const anh = await docAnhGopY(params.id);
  // 404 chứ không 403: id sai hình dạng, id không tồn tại và file mất trên đĩa phải KHÔNG phân
  // biệt được từ ngoài — nếu không, chính mã trạng thái trở thành máy dò sự tồn tại.
  if (!anh) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  return new NextResponse(new Uint8Array(anh.buf), {
    headers: {
      'Content-Type': anh.mime,
      'Content-Length': String(anh.buf.length),
      'X-Content-Type-Options': 'nosniff',
      // `private` — cấm proxy/CDN dùng chung bản sao giữa các phiên khác nhau.
      'Cache-Control': 'private, max-age=86400',
      'Content-Disposition': 'inline',
    },
  });
}
