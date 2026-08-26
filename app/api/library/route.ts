import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { imgIdFromKey } from '@/lib/img-id';
import { saveLibraryAssetFromBuffer } from '@/lib/server/library-save';

/** Thư viện dùng chung cả team — GET trả tất cả asset của mọi user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const assets = await prisma.libraryAsset.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json({
    assets: assets.map((a) => ({
      id: a.id,
      // Task #19: id ảnh chuẩn `img_…` DẪN XUẤT tất định từ cuid ổn định — độc lập tên file, chung
      // không gian với gallery/linked-asset/handoff. Áp cho MỌI hàng (cũ lẫn mới), không cột DB mới.
      imgId: imgIdFromKey(a.id),
      name: a.name,
      category: a.category,
      tags: a.tags,
      uploader: a.user.name,
      mine: a.userId === user.id,
      url: `/api/library/${a.id}/file`,
      // ---- Gu Engine ----
      usage: a.usage,
      palette: safeArr(a.palette),
      caption: a.caption,
      w: a.w,
      h: a.h,
      hasContent: !!a.content,
    })),
  });
}

function safeArr(s: string): string[] {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** POST { name, category, tags, dataUrl } — lưu file vào ./uploads + metadata DB.
 *  Nay đi qua `saveLibraryAssetFromBuffer` (lib/server/library-save.ts, 19/08 CONNECT-1) — cùng
 *  hàm ghi DB mà `POST /api/library/from-url` dùng, hành vi giữ nguyên như bản gốc. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { name, category, tags, dataUrl, usage, palette, caption, content, w, h } = await req
    .json()
    .catch(() => ({}));
  if (!name || !category || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return NextResponse.json({ error: 'Thiếu name/category/dataUrl.' }, { status: 400 });
  }
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return NextResponse.json({ error: 'dataUrl không hợp lệ.' }, { status: 400 });
  const [, , b64] = match;
  const buf = Buffer.from(b64, 'base64');
  const saved = await saveLibraryAssetFromBuffer({
    userId: user.id, name, category, tags, buf, usage, palette, caption, content, w, h,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ id: saved.id, imgId: saved.imgId, url: saved.url });
}
