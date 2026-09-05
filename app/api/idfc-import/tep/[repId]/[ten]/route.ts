import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/**
 * GET /api/idfc-import/tep/[repId]/[ten] — trả một tệp dẫn xuất của biểu diễn `repId`.
 *
 * 🔴 VÌ SAO ĐƯỜNG DẪN CÓ HAI ĐOẠN chứ không phải `?rep=…`: `MTLLoader` của three.js phân giải
 * `map_Kd <tên tệp>` **TƯƠNG ĐỐI với thư mục của tệp .mtl**. Đường dạng `…/tep/<repId>/mon.mtl`
 * làm texture tự trỏ đúng `…/tep/<repId>/mon-basecolor.png` mà không phải viết lại MTL. Và đuôi
 * phải là `.obj` thật vì `Object3DWindow.tsx:97` chọn loader bằng `/\.obj(\?|$)/i`.
 *
 * QUYỀN: đọc theo đúng luật `GET /api/library/[id]/file` — người đăng nhập nào cũng đọc được
 * (*"Thư viện dùng chung cả team"*, `app/api/library/route.ts:7`). Không nới hơn, không siết hơn.
 *
 * AN TOÀN ĐƯỜNG DẪN: tên tệp thật LUÔN dựng từ `payloadRef` trong DB (do server tự đặt lúc ghi),
 * `[ten]` trên URL chỉ dùng để chọn hậu tố trong danh sách đóng — client KHÔNG bao giờ điều khiển
 * được đường dẫn đĩa.
 */

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/** Danh sách ĐÓNG các hậu tố hợp lệ → kiểu nội dung. Ngoài bảng này là 404. */
const HAU_TO: Record<string, string> = {
  'mon.obj': 'text/plain; charset=utf-8',
  'mon.mtl': 'text/plain; charset=utf-8',
  'mon-basecolor.png': 'image/png',
  'mon.idfc': 'application/json; charset=utf-8',
  'cau-kien.json': 'application/json; charset=utf-8',
};

export async function GET(_: Request, { params }: { params: { repId: string; ten: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const mime = HAU_TO[params.ten];
  if (!mime) return NextResponse.json({ error: 'Tên tệp không thuộc bộ dẫn xuất.' }, { status: 404 });

  if (typeof (prisma as { assetRepresentation?: unknown }).assetRepresentation === 'undefined')
    return NextResponse.json({ error: 'Prisma Client thiếu model AssetRepresentation.' }, { status: 503 });

  const row = await prisma.assetRepresentation.findUnique({
    where: { id: params.repId },
    select: { payloadRef: true, deletedAt: true, asset: { select: { deletedAt: true } } },
  });
  if (!row || row.deletedAt || row.asset.deletedAt)
    return NextResponse.json({ error: 'Không tìm thấy biểu diễn.' }, { status: 404 });

  // `payloadRef` = "idfc-<assetId>-<hậu tố>" ⇒ tiền tố là phần trước hậu tố đã ghi.
  const nen = row.payloadRef.replace(/-(?:mon\.obj|mon\.mtl|mon-basecolor\.png|mon\.idfc|cau-kien\.json)$/, '');
  if (nen === row.payloadRef || !/^idfc-[A-Za-z0-9_-]+$/.test(nen))
    return NextResponse.json({ error: 'Biểu diễn không thuộc cửa nhận diện cấu kiện.' }, { status: 404 });

  try {
    const buf = await readFile(path.join(UPLOAD_DIR, `${nen}-${params.ten}`));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': mime,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Tệp mất trên đĩa.' }, { status: 410 });
  }
}
