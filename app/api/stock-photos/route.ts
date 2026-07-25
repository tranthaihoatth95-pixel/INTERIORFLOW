import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import {
  availableSources,
  isFetchableImageUrl,
  isPinterestPageUrl,
  normalizeOpenverse,
  normalizeUnsplash,
  photoFromLink,
  PINTEREST_HINT_VI,
  type StockPhoto,
} from '@/lib/stock-photos';

/**
 * app/api/stock-photos/route.ts — CỬA DUY NHẤT ra các nguồn ảnh ngoài.
 *
 * Key API nằm ở server (không lộ ra client). Nguồn thiếu key thì tự BIẾN MẤT khỏi danh sách
 * `GET` → UI không hiện tab đó, không báo lỗi. Xem lib/stock-photos.ts (luật + giới hạn
 * Pinterest) và docs/IMAGE-SOURCES.md.
 *
 *  GET                      → { sources: [...] }         danh sách nguồn khả dụng
 *  POST { action:'search' } → { photos: StockPhoto[] }   tìm theo từ khoá (openverse|unsplash)
 *  POST { action:'link' }   → { photo: StockPhoto }      nhận URL ảnh user dán
 *  POST { action:'use' }    → { ok: true }               ping đếm tải Unsplash (bắt buộc theo ToS)
 */

const UA = 'InteriorFlow/1.0 (+https://github.com/tranthaihoatth95-pixel/INTERIORFLOW)';
const TIMEOUT_MS = 9_000;

function unsplashKey(): string {
  return (process.env.UNSPLASH_ACCESS_KEY ?? '').trim();
}

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: ctrl.signal });
    if (!res.ok) return { error: `HTTP ${res.status}` as const, json: null };
    return { error: null, json: (await res.json()) as unknown };
  } catch {
    return { error: 'network' as const, json: null };
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ sources: availableSources(!!unsplashKey()) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: 'search' | 'link' | 'use';
    source?: string;
    query?: string;
    url?: string;
    count?: number;
    downloadLocation?: string;
  };
  const action = body.action ?? 'search';

  /* ─── ① DÁN URL ảnh (đường hợp lệ duy nhất cho ảnh Pinterest — xem lib/stock-photos.ts) ─── */
  if (action === 'link') {
    const raw = String(body.url ?? '');
    if (isPinterestPageUrl(raw)) {
      return NextResponse.json({ error: PINTEREST_HINT_VI, kind: 'pinterest-page' }, { status: 400 });
    }
    const check = isFetchableImageUrl(raw);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

    // Xác nhận đúng là ẢNH (HEAD trước, GET range nếu server không cho HEAD) — không tải cả file.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      let res = await fetch(check.url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: ctrl.signal });
      if (!res.ok || !res.headers.get('content-type')) {
        res = await fetch(check.url, {
          headers: { 'User-Agent': UA, Range: 'bytes=0-0' },
          signal: ctrl.signal,
        });
      }
      const ct = (res.headers.get('content-type') ?? '').toLowerCase();
      if (!res.ok) return NextResponse.json({ error: `Không tải được ảnh (HTTP ${res.status}).` }, { status: 400 });
      if (!ct.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Link này không trả về ảnh (hãy dùng URL ảnh trực tiếp, kết thúc bằng .jpg/.png/.webp…).' },
          { status: 400 },
        );
      }
      return NextResponse.json({ photo: photoFromLink(check.url) });
    } catch {
      return NextResponse.json({ error: 'Không kết nối được tới URL đó.' }, { status: 400 });
    } finally {
      clearTimeout(t);
    }
  }

  /* ─── ② Ping đếm tải Unsplash — BẮT BUỘC theo điều khoản khi user thực sự dùng ảnh ─── */
  if (action === 'use') {
    const key = unsplashKey();
    const loc = String(body.downloadLocation ?? '');
    if (!key || !loc.startsWith('https://api.unsplash.com/')) return NextResponse.json({ ok: true });
    await fetchJson(loc, { Authorization: `Client-ID ${key}` }); // lỗi thì bỏ qua, không chặn user
    return NextResponse.json({ ok: true });
  }

  /* ─── ③ Tìm theo từ khoá ─── */
  const q = String(body.query ?? '').trim();
  if (!q) return NextResponse.json({ error: 'Thiếu từ khoá.' }, { status: 400 });
  const count = Math.min(30, Math.max(1, Number(body.count) || 12));
  const source = body.source === 'unsplash' ? 'unsplash' : 'openverse';

  if (source === 'unsplash') {
    const key = unsplashKey();
    if (!key) {
      // Nguồn chưa cấu hình → KHÔNG coi là lỗi hệ thống, chỉ báo gọn để UI ẩn tab.
      return NextResponse.json({ photos: [], unavailable: true });
    }
    const url =
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}` +
      `&per_page=${count}&content_filter=high&orientation=landscape`;
    const { error, json } = await fetchJson(url, { Authorization: `Client-ID ${key}` });
    if (error) {
      return NextResponse.json(
        { photos: [], error: error === 'network' ? 'Không kết nối được Unsplash.' : `Unsplash ${error}` },
        { status: 200 },
      );
    }
    const photos = normalizeUnsplash((json as { results?: unknown })?.results);
    return NextResponse.json({ photos });
  }

  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}` +
    `&page_size=${count}&license_type=commercial,modification&mature=false`;
  const { error, json } = await fetchJson(url);
  if (error) {
    return NextResponse.json(
      { photos: [] as StockPhoto[], error: error === 'network' ? 'Không kết nối được Openverse.' : `Openverse ${error}` },
      { status: 200 },
    );
  }
  return NextResponse.json({ photos: normalizeOpenverse((json as { results?: unknown })?.results) });
}
