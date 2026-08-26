import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { isFetchableImageUrl } from '@/lib/stock-photos';
import { saveLibraryAssetFromBuffer, LIBRARY_MAX_BYTES } from '@/lib/server/library-save';

/**
 * app/api/library/from-url/route.ts — 19/08, phiếu CONNECT-1 (nối "Pick hình"
 * Openverse/Unsplash ở `/library/ingest` thành lưu THẬT — trước đây chỉ set React state, không
 * ghi đâu cả).
 *
 * `POST /api/library` chỉ nhận `dataUrl` client tự encode (upload từ máy). Ảnh chọn từ
 * Openverse/Unsplash là URL NGOÀI — route này server tự TẢI ảnh về (chặn SSRF bằng
 * `isFetchableImageUrl`, cùng hàm route `/api/stock-photos` action `link` đã dùng), rồi ghi qua
 * ĐÚNG MỘT hàm `saveLibraryAssetFromBuffer` — không chế cú pháp lưu thứ hai.
 *
 * POST { url, name, category, tags?, usage? } → { id, imgId, url }
 */
const UA = 'InteriorFlow/1.0 (+https://github.com/tranthaihoatth95-pixel/INTERIORFLOW)';
const TIMEOUT_MS = 15_000;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { url, name, category, tags, usage } = (await req.json().catch(() => ({}))) as {
    url?: string; name?: string; category?: string; tags?: string; usage?: string;
  };
  const check = isFetchableImageUrl(String(url ?? ''));
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
  if (!name || !category) return NextResponse.json({ error: 'Thiếu name/category.' }, { status: 400 });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let buf: Buffer;
  try {
    const res = await fetch(check.url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (!res.ok) return NextResponse.json({ error: `Không tải được ảnh (HTTP ${res.status}).` }, { status: 400 });
    const ct = (res.headers.get('content-type') ?? '').toLowerCase();
    if (!ct.startsWith('image/')) {
      return NextResponse.json({ error: 'URL không trả về ảnh.' }, { status: 400 });
    }
    const len = Number(res.headers.get('content-length') ?? '0');
    if (Number.isFinite(len) && len > LIBRARY_MAX_BYTES) {
      return NextResponse.json({ error: 'Ảnh quá 25MB.' }, { status: 413 });
    }
    const ab = await res.arrayBuffer();
    if (ab.byteLength > LIBRARY_MAX_BYTES) {
      return NextResponse.json({ error: 'Ảnh quá 25MB.' }, { status: 413 });
    }
    buf = Buffer.from(ab);
  } catch {
    return NextResponse.json({ error: 'Không kết nối được tới URL ảnh.' }, { status: 400 });
  } finally {
    clearTimeout(t);
  }

  const saved = await saveLibraryAssetFromBuffer({
    userId: user.id,
    name: String(name),
    category: String(category),
    tags: String(tags ?? ''),
    buf,
    usage,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ id: saved.id, imgId: saved.imgId, url: saved.url });
}
