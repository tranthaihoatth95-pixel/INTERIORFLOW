import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { normalizeUnsplash } from '@/lib/stock-photos';

/**
 * Illustration Picker — thác nguồn cho hình minh hoạ moodboard (theo chốt user):
 *   ① Reference anh đã tải (match theo caption/tag)
 *   → ② search ảnh dùng được thương mại: **Openverse (CC)** + **Unsplash** (25/07)
 *   → ③ cờ generate (chỉ khi thực sự cần, app tự route sang SD/NVIDIA).
 *
 * Openverse là API công khai, không cần key. Unsplash cần `UNSPLASH_ACCESS_KEY` — THIẾU KEY
 * thì tầng đó tự bỏ qua, KHÔNG lỗi. Cả hai yêu cầu ghi công → trả kèm creator + license.
 * Nguồn Pinterest KHÔNG khả thi bằng API (xem lib/stock-photos.ts + docs/IMAGE-SOURCES.md):
 * user dán URL ảnh / upload qua StockPhotoPicker thay vì tự động lấy.
 */
interface RefLite { id: string; name?: string; caption?: string; tags?: string[]; usage?: string }

// Chỉ pick hình minh hoạ từ ref loại "mood/nội thất" — tránh lẫn dàn-trang/template, CAD, brief, PDF.
const MOOD_USAGES = new Set(['ref-render', 'slide', 'material']);

function scoreMatch(query: string, r: RefLite): number {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const hay = `${r.name ?? ''} ${r.caption ?? ''} ${(r.tags ?? []).join(' ')}`.toLowerCase();
  return words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
}

interface OvResult {
  url?: string; thumbnail?: string; title?: string; creator?: string;
  license?: string; license_url?: string; foreign_landing_url?: string;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { query, references, count = 6, allowSearch = true, allowGenerate = false } =
    (await req.json().catch(() => ({}))) as {
      query?: string; references?: RefLite[]; count?: number; allowSearch?: boolean; allowGenerate?: boolean;
    };
  const q = String(query ?? '').trim();
  if (!q) return NextResponse.json({ error: 'Thiếu từ khoá.' }, { status: 400 });

  const picks: Record<string, unknown>[] = [];

  // ① Reference trước — CHỈ ref loại mood/nội thất (bỏ dàn-trang/CAD/brief để không pick nhầm)
  const moodRefs = (references ?? []).filter((r) => !r.usage || MOOD_USAGES.has(r.usage));
  for (const r of moodRefs.map((r) => ({ r, s: scoreMatch(q, r) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)) {
    picks.push({ source: 'reference', refId: r.r.id, title: r.r.name ?? '', score: r.s });
    if (picks.length >= count) break;
  }

  // ② Openverse (CC, dùng thương mại được) nếu còn thiếu
  let searchError: string | null = null;
  if (picks.length < count && allowSearch) {
    const need = count - picks.length;
    try {
      const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${need}&license_type=commercial,modification&mature=false`;
      const res = await fetch(url, { headers: { 'User-Agent': 'InteriorFlow/1.0' } });
      if (res.ok) {
        const j = (await res.json()) as { results?: OvResult[] };
        for (const o of j.results ?? []) {
          picks.push({
            source: 'openverse',
            url: o.url,
            thumb: o.thumbnail ?? o.url,
            title: o.title ?? '',
            credit: o.creator ?? '',
            license: (o.license ?? '').toUpperCase(),
            licenseUrl: o.license_url ?? '',
            landing: o.foreign_landing_url ?? '',
          });
        }
      } else searchError = `Openverse HTTP ${res.status}`;
    } catch {
      searchError = 'Không kết nối được Openverse (kiểm tra mạng).';
    }
  }

  // ②b Unsplash (miễn phí kể cả thương mại, PHẢI ghi công) — chỉ khi có key và vẫn thiếu ảnh.
  if (picks.length < count && allowSearch) {
    const key = (process.env.UNSPLASH_ACCESS_KEY ?? '').trim();
    if (key) {
      const need = count - picks.length;
      try {
        const url =
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}` +
          `&per_page=${need}&content_filter=high&orientation=landscape`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'InteriorFlow/1.0', Authorization: `Client-ID ${key}` },
        });
        if (res.ok) {
          const j = (await res.json()) as { results?: unknown };
          for (const p of normalizeUnsplash(j.results)) {
            picks.push({
              source: 'unsplash',
              url: p.full,
              thumb: p.thumb,
              title: p.title,
              credit: p.creditName,
              license: p.license,
              licenseUrl: p.licenseUrl,
              landing: p.landing,
              downloadLocation: p.downloadLocation,
            });
          }
        } else if (!searchError) searchError = `Unsplash HTTP ${res.status}`;
      } catch {
        if (!searchError) searchError = 'Không kết nối được Unsplash.';
      }
    }
  }

  // ③ cờ generate — chỉ gợi ý khi vẫn thiếu và user cho phép
  const generate = picks.length < count && allowGenerate;

  return NextResponse.json({
    picks,
    generate,
    sources: {
      reference: picks.filter((p) => p.source === 'reference').length,
      openverse: picks.filter((p) => p.source === 'openverse').length,
      unsplash: picks.filter((p) => p.source === 'unsplash').length,
    },
    searchError,
  });
}
