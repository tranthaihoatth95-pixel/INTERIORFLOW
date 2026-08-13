'use client';

/**
 * components/common/StockPhotoPicker.tsx — BỘ CHỌN ẢNH TỪ NGUỒN NGOÀI, dùng lại ở mọi chỗ
 * cần ảnh: nền đăng nhập (Đổi nền) · Reference chặng Present · moodboard.
 *
 * Nguồn: Openverse (CC, không cần key) · Unsplash (cần `UNSPLASH_ACCESS_KEY` — thiếu key thì
 * tab TỰ ẨN, không báo lỗi) · dán URL ảnh (đường hợp lệ duy nhất cho ảnh Pinterest).
 * Luật + giới hạn Pinterest: `lib/stock-photos.ts`, `docs/IMAGE-SOURCES.md`.
 *
 * GHI CÔNG: mỗi ảnh luôn hiện dòng ghi công (tác giả · giấy phép · nguồn) — điều khoản
 * Unsplash/CC bắt buộc. Khi user CHỌN ảnh Unsplash, component tự ping endpoint đếm tải.
 *
 * Không tự lưu ảnh vào đâu — trả kết quả qua `onPick`, nơi gọi quyết định làm gì.
 */

import { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import {
  creditLine,
  type StockPhoto,
  type StockSourceId,
  type StockSourceInfo,
} from '@/lib/stock-photos';

export interface StockPickResult {
  photo: StockPhoto;
  /** dòng ghi công đã dựng sẵn — nơi gọi nên lưu kèm ảnh. */
  credit: string;
}

interface Props {
  /** gợi ý từ khoá ban đầu (vd tên dự án / style). */
  initialQuery?: string;
  onPick: (r: StockPickResult) => void | Promise<void>;
  lang?: 'vi' | 'en';
  /** số ảnh mỗi lượt tìm. */
  count?: number;
  /** chiều cao tối đa vùng lưới ảnh (px). */
  maxGridHeight?: number;
}

export default function StockPhotoPicker({
  initialQuery = '',
  onPick,
  lang = 'vi',
  count = 12,
  maxGridHeight = 220,
}: Props) {
  const en = lang === 'en';
  const [sources, setSources] = useState<StockSourceInfo[] | null>(null);
  const [source, setSource] = useState<StockSourceId>('openverse');
  const [query, setQuery] = useState(initialQuery);
  const [linkUrl, setLinkUrl] = useState('');
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // Nguồn khả dụng do SERVER quyết (nguồn thiếu key không xuất hiện) → tab tự ẩn gọn gàng.
  useEffect(() => {
    let alive = true;
    fetch('/api/stock-photos')
      .then((r) => (r.ok ? r.json() : { sources: [] }))
      .then((j: { sources?: StockSourceInfo[] }) => {
        if (!alive) return;
        const list = j.sources ?? [];
        setSources(list);
        if (list.length && !list.some((s) => s.id === 'openverse')) setSource(list[0].id);
      })
      .catch(() => alive && setSources([]));
    return () => {
      alive = false;
    };
  }, []);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/stock-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', source, query: q, count }),
      });
      const j = (await res.json()) as { photos?: StockPhoto[]; error?: string };
      setPhotos(j.photos ?? []);
      if (j.error) setErr(j.error);
      else if (!j.photos?.length) setErr(en ? 'No results.' : 'Không có kết quả.');
    } catch {
      setErr(en ? 'Network error.' : 'Lỗi mạng.');
    } finally {
      setBusy(false);
    }
  }, [query, source, count, en]);

  const resolveLink = useCallback(async () => {
    const u = linkUrl.trim();
    if (!u) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/stock-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', url: u }),
      });
      const j = (await res.json()) as { photo?: StockPhoto; error?: string };
      if (j.photo) {
        setPhotos([j.photo]);
      } else {
        setPhotos([]);
        setErr(j.error ?? (en ? 'Could not read that URL.' : 'Không đọc được URL đó.'));
      }
    } catch {
      setErr(en ? 'Network error.' : 'Lỗi mạng.');
    } finally {
      setBusy(false);
    }
  }, [linkUrl, en]);

  const choose = useCallback(
    async (p: StockPhoto) => {
      setPicked(p.id);
      // Điều khoản Unsplash: ping endpoint đếm tải khi ảnh được DÙNG THẬT. Lỗi thì bỏ qua.
      if (p.source === 'unsplash' && p.downloadLocation) {
        void fetch('/api/stock-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'use', downloadLocation: p.downloadLocation }),
        }).catch(() => {});
      }
      await onPick({ photo: p, credit: creditLine(p) });
    },
    [onPick],
  );

  if (sources === null) {
    return (
      <p style={note}>
        <Loader2 size={11} className="pe-spin" /> {en ? 'Loading sources…' : 'Đang nạp nguồn ảnh…'}
      </p>
    );
  }
  if (!sources.length) {
    return <p style={note}>{en ? 'Sign in to use online image sources.' : 'Đăng nhập để dùng nguồn ảnh trên mạng.'}</p>;
  }

  const active = sources.find((s) => s.id === source) ?? sources[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {/* chọn nguồn — nguồn thiếu key đã bị server lọc, không hiện ở đây */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {sources.map((s) => {
          const on = s.id === active.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSource(s.id);
                setPhotos([]);
                setErr(null);
              }}
              style={{
                ...tab,
                borderColor: on ? 'var(--accent)' : 'var(--border)',
                color: on ? 'var(--accent)' : 'var(--t3)',
              }}
            >
              {en ? s.en : s.vi}
            </button>
          );
        })}
      </div>

      {active.searchable ? (
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void search();
            }}
            placeholder={en ? 'e.g. warm stone interior' : 'vd: nội thất đá ấm, sảnh khách sạn'}
            style={inp}
          />
          <button type="button" onClick={() => void search()} disabled={busy} style={goBtn}>
            {busy ? <Loader2 size={12} className="pe-spin" /> : <Search size={12} />}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void resolveLink();
            }}
            placeholder="https://…/anh.jpg"
            style={inp}
          />
          <button type="button" onClick={() => void resolveLink()} disabled={busy} style={goBtn}>
            {busy ? <Loader2 size={12} className="pe-spin" /> : <LinkIcon size={12} />}
          </button>
        </div>
      )}

      {(en ? active.noteEn : active.noteVi) && (
        <p style={{ ...note, display: 'block' }}>{en ? active.noteEn : active.noteVi}</p>
      )}
      {err && <p style={{ ...note, color: '#e08b6f', display: 'block' }}>{err}</p>}

      {photos.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 5,
            maxHeight: maxGridHeight,
            overflowY: 'auto',
            paddingRight: 2,
          }}
        >
          {photos.map((p) => (
            <div key={`${p.source}_${p.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                type="button"
                onClick={() => void choose(p)}
                title={p.title || p.landing}
                style={{
                  position: 'relative',
                  padding: 0,
                  border: `1px solid ${picked === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'transparent',
                  cursor: 'pointer',
                  aspectRatio: '4 / 3',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumb}
                  alt={p.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  draggable={false}
                />
              </button>
              {/* GHI CÔNG — bắt buộc theo điều khoản Unsplash/CC, không được bỏ */}
              <span style={{ fontSize: 8.5, lineHeight: 1.25, color: 'var(--t5)', overflow: 'hidden' }}>
                {creditLine(p) || '—'}
                {p.landing && (
                  <a
                    href={p.landing}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ marginLeft: 3, color: 'var(--t4)' }}
                    title={en ? 'Open source page' : 'Mở trang gốc'}
                  >
                    <ExternalLink size={8} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 28,
  padding: '0 8px',
  fontSize: 11,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg2, transparent)',
  color: 'var(--t2)',
};
const goBtn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 28,
  height: 28,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
};
const tab: React.CSSProperties = {
  height: 24,
  padding: '0 8px',
  fontSize: 10.5,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  cursor: 'pointer',
};
const note: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 9.5,
  lineHeight: 1.4,
  color: 'var(--t5)',
};
