import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/** Thư viện dùng chung cả team — GET trả tất cả asset của mọi user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const assets = await prisma.libraryAsset.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json({
    assets: assets.map((a) => ({
      id: a.id,
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

const USAGES = ['ref-render', 'slide', 'material', 'layout', 'cad', 'brief'];

/** POST { name, category, tags, dataUrl } — lưu file vào ./uploads + metadata DB. */
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
  const [, mime, b64] = match;
  const buf = Buffer.from(b64, 'base64');
  if (buf.length > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'File quá 25MB.' }, { status: 413 });
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
  const filename = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  const asset = await prisma.libraryAsset.create({
    data: {
      userId: user.id,
      name: String(name).slice(0, 120),
      category: String(category),
      tags: String(tags ?? ''),
      mime,
      path: filename,
      // ---- Gu Engine: chưng cất gu (client gửi lên; thiếu thì default) ----
      usage: USAGES.includes(usage) ? usage : 'ref-render',
      palette: Array.isArray(palette) ? JSON.stringify(palette.slice(0, 8)) : '',
      caption: typeof caption === 'string' ? caption.slice(0, 400) : '',
      content: typeof content === 'string' ? content.slice(0, 20000) : null,
      w: Number.isFinite(w) ? Math.round(w) : 0,
      h: Number.isFinite(h) ? Math.round(h) : 0,
    },
  });
  return NextResponse.json({ id: asset.id, url: `/api/library/${asset.id}/file` });
}
