import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSessionUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export const dynamic = 'force-dynamic';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * POST /api/library/clip — nhận "clip" ảnh tham khảo từ web (Chrome extension companion) → lưu
 * vào Reference như 1 LibraryAsset (usage 'ref-render'). Nhận `{imageUrl}` (server tự tải) HOẶC
 * `{dataUrl}`. Gate getSessionUser (extension gọi kèm cookie same-origin / cùng trình duyệt đã login).
 * ⚠ Auth cross-origin extension cần cơ chế token về sau — xem extension/README.md.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { imageUrl, dataUrl, name, tags, sourceUrl } = await req.json().catch(() => ({}));

  let mime = '';
  let buf: Buffer | null = null;
  try {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (!m) return NextResponse.json({ error: 'dataUrl không hợp lệ.' }, { status: 400 });
      mime = m[1];
      buf = Buffer.from(m[2], 'base64');
    } else if (typeof imageUrl === 'string' && /^https?:\/\//.test(imageUrl)) {
      const r = await fetch(imageUrl);
      if (!r.ok) return NextResponse.json({ error: `Tải ảnh nguồn lỗi ${r.status}.` }, { status: 400 });
      mime = r.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
      if (!mime.startsWith('image/')) return NextResponse.json({ error: 'URL không phải ảnh.' }, { status: 400 });
      buf = Buffer.from(await r.arrayBuffer());
    } else {
      return NextResponse.json({ error: 'Cần imageUrl (http) hoặc dataUrl.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Không lấy được ảnh clip.' }, { status: 400 });
  }
  if (buf.length > 25 * 1024 * 1024) return NextResponse.json({ error: 'Ảnh quá 25MB.' }, { status: 413 });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
  const filename = `clip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  const asset = await prisma.libraryAsset.create({
    data: {
      userId: user.id,
      name: String(name ?? 'Clip từ web').slice(0, 120),
      category: 'Ref nội thất',
      tags: String(tags ?? 'clip web'),
      mime,
      path: filename,
      usage: 'ref-render',
      palette: '',
      caption: typeof sourceUrl === 'string' ? `Nguồn: ${sourceUrl}`.slice(0, 400) : '',
      content: null,
      w: 0,
      h: 0,
    },
  });
  return NextResponse.json({ id: asset.id, url: `/api/library/${asset.id}/file` });
}
