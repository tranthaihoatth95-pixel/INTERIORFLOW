import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from '@/lib/server/mime-sniff';
import { canReadLibraryAsset, duongDanTrongThuMuc } from '@/lib/server/access';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const asset = await prisma.libraryAsset.findUnique({ where: { id: params.id, deletedAt: null } });
  if (!asset) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  // R8 — phạm vi ĐỌC. Mặc định giữ nguyên kho dùng chung; bật cờ thì 404 (không 403: không xác
  // nhận asset của người khác có tồn tại hay không).
  if (!canReadLibraryAsset(user, asset))
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  // R8 — path traversal. `asset.path` từ DB; `../` trong đó là đọc file tuỳ ý ngoài `uploads/`.
  const duongDan = duongDanTrongThuMuc(path.join(process.cwd(), 'uploads'), asset.path);
  if (!duongDan) return NextResponse.json({ error: 'File mất trên đĩa.' }, { status: 410 });
  try {
    const buf = await readFile(duongDan);
    // §6.2 R3 — KHÔNG trả thẳng `asset.mime` (cột lưu từ upload, có thể là dữ liệu từ TRƯỚC khi
    // vá whitelist) — sniff lại byte THẬT mỗi lần trả file, ép Content-Type về đúng whitelist +
    // luôn kèm `nosniff` + `attachment` cho bất kỳ thứ gì KHÔNG phải ảnh raster (kể cả file cũ lỡ
    // lọt qua trước khi có whitelist — mặc định an toàn nhất, không đoán).
    const kind = sniffKind(buf);
    const isImage = isRasterImageKind(kind);
    const contentType = isImage ? SNIFFED_MIME[kind] : 'application/octet-stream';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=86400',
    };
    if (!isImage) {
      const safeName = asset.name.replace(/[^\w.\- ]/g, '_').slice(0, 120) || 'file';
      headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
    }
    return new NextResponse(buf, { headers });
  } catch {
    return NextResponse.json({ error: 'File mất trên đĩa.' }, { status: 410 });
  }
}
