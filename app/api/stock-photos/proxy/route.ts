import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { isFetchableImageUrl } from '@/lib/stock-photos';

/**
 * app/api/stock-photos/proxy/route.ts — LẤY BYTE ảnh ngoài về qua server.
 *
 * Vì sao cần: nền đăng nhập lưu ảnh dạng dataURL trong localStorage, và canvas
 * `toDataURL()` sẽ bị TAINT nếu ảnh tải chéo domain không có CORS. Proxy này trả ảnh
 * cùng origin → canvas đọc được.
 *
 * KHÔNG phải cache/thư viện ảnh: chỉ pass-through 1 lần, giới hạn 12MB, chỉ nhận
 * content-type `image/*`, chặn host nội bộ (SSRF) qua `isFetchableImageUrl`.
 * Yêu cầu ĐĂNG NHẬP để không thành open proxy cho người ngoài.
 */

const MAX_BYTES = 12 * 1024 * 1024;

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const check = isFetchableImageUrl(new URL(req.url).searchParams.get('url') ?? '');
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(check.url, {
      headers: { 'User-Agent': 'InteriorFlow/1.0' },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const ct = (res.headers.get('content-type') ?? '').toLowerCase();
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 400 });
    if (!ct.startsWith('image/')) return NextResponse.json({ error: 'Không phải ảnh.' }, { status: 400 });

    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BYTES) return NextResponse.json({ error: 'Ảnh quá lớn (>12MB).' }, { status: 400 });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: 'Ảnh quá lớn (>12MB).' }, { status: 400 });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        // không cache lâu — proxy là đường đi, không phải kho ảnh
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Không tải được ảnh.' }, { status: 400 });
  } finally {
    clearTimeout(t);
  }
}
