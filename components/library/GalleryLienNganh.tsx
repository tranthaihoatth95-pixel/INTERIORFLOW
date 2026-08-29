'use client';

/**
 * components/library/GalleryLienNganh.tsx — Gallery liên ngành (K · 12/08, phiếu
 * `docs/phieu-giao/gallery-lien-nganh.md`, marker: chuỗi "gallery-curated").
 *
 * Hoà chốt 12/08 (`docs/00-CHOT.md` "[12/08 Hoà gật ④ GALLERY]"): "GALLERY = kho ảnh tuyển LIÊN
 * NGÀNH (kiến trúc · nội thất · cảnh quan · graphic · art), phân nhóm + bộ sưu tập xu hướng CÓ
 * NGUỒN; là MẶT TIỀN TUYỂN CHỌN của kệ Ảnh & tài sản — KHÔNG đẻ kho mới; NUÔI Thẻ DNA + moodboard
 * + Story Set chương 3."
 *
 * KHÔNG đẻ kho mới: đọc THẲNG `LibraryAsset` qua `GET /api/library` (cùng route
 * `lib/library/db-items.ts` đã dùng cho kệ Thư viện) — mọi phân loại mới (nhóm ngành/giấy
 * phép/nguồn/bộ sưu tập) encode vào `tags` theo quy ước `lib/library/gallery-tags.ts`, KHÔNG cột
 * DB mới, KHÔNG route mới.
 *
 * "Đường NUÔI" (VIỆC 5 phiếu): nút "Dùng cho moodboard/Thẻ DNA" trên thẻ ảnh COPY `imgId` chuẩn
 * (không gian `img_`, xem `lib/img-id.ts`) vào clipboard + phát `CustomEvent('if:gallery-use-asset')`
 * — KHÔNG dựng moodboard/Thẻ DNA ở phiếu này (ngoài phạm vi, "CẤM" ở vùng file ③).
 */

import { useMemo, useState } from 'react';
import {
  Building2, Sofa, Trees, PenTool, Palette, Search, Link2, Plus, X, Sparkles,
  Compass, Copy, type LucideIcon,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { GALLERY_CSS } from './gallery-css';
import { LibraryToastHost, pushLibraryToast } from './LibraryToast';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import {
  collectionLabel,
  collectionsFrom,
  groupByIndustry,
  curatedOnly,
  useGalleryAssets,
  type GalleryAsset,
} from '@/lib/library/gallery-data';
import {
  GALLERY_INDUSTRIES,
  GALLERY_LICENSES,
  MISSING_SOURCE_MESSAGE,
  type GalleryIndustry,
  type GalleryLicense,
} from '@/lib/library/gallery-tags';
import { checkGallerySourceUrl } from '@/lib/library/gallery-source-guard';
import { useGalleryLocalState } from '@/lib/library/gallery-local-state';

/** Sự kiện "dùng ảnh này cho moodboard/Thẻ DNA" — chỗ NGHE (moodboard/DNA engine) là việc SAU,
 * ngoài phạm vi phiếu này (mục ⑤ "KHÔNG xây moodboard/DNA ở phiếu này"). */
export const GALLERY_USE_ASSET_EVENT = 'if:gallery-use-asset';

const INDUSTRY_ICON: Record<GalleryIndustry, LucideIcon> = {
  'kien-truc': Building2,
  'noi-that': Sofa,
  'canh-quan': Trees,
  graphic: PenTool,
  art: Palette,
};

/** Chấm màu — mượn đúng token đã dùng cho chấm kệ Thư viện (`lib/library/shelves.ts` ShelfDef.dot),
 * KHÔNG bịa hex mới (L4). 5 ngành ↔ 5 token khác nhau để phân biệt bằng mắt không cần đọc chữ. */
const INDUSTRY_DOT: Record<GalleryIndustry, string> = {
  'kien-truc': 'var(--t3)',
  'noi-that': 'var(--accent)',
  'canh-quan': 'var(--success)',
  graphic: 'var(--k-doc)',
  art: 'var(--accent-warm)',
};

function licenseLabel(id: GalleryLicense | null, tr: (vi: string, en: string) => string): string {
  if (!id) return tr('Chưa rõ giấy phép', 'Unknown license');
  const hit = GALLERY_LICENSES.find((l) => l.id === id);
  return hit ? tr(hit.label[0], hit.label[1]) : id;
}

function industryLabel(id: GalleryIndustry, tr: (vi: string, en: string) => string): string {
  const hit = GALLERY_INDUSTRIES.find((g) => g.id === id);
  return hit ? tr(hit.label[0], hit.label[1]) : id;
}

export function GalleryLienNganh() {
  const tr = useT();
  const { assets, loaded, error, refresh } = useGalleryAssets();
  const { suggestions, addSuggestion, removeSuggestion } = useGalleryLocalState();

  const [query, setQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<GalleryIndustry | null>(null);
  const [licenseFilter, setLicenseFilter] = useState<GalleryLicense | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [hienLoc, setHienLoc] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceErr, setSourceErr] = useState<string | null>(null);

  const collections = useMemo(() => collectionsFrom(assets), [assets]);

  /* MẶT TIỀN chỉ ăn hàng ĐÃ TUYỂN (Hoà chốt 30/08). Ảnh chưa gắn ngành+giấy phép vẫn nằm nguyên
   * trong Thư viện — không mất, chỉ không lên mặt tiền. Số bị giữ lại hiện ở một dòng cuối trang,
   * KHÔNG im lặng: giấu 1.580 ảnh mà không nói là đúng bệnh "biến mất không dấu vết". */
  const curated = useMemo(() => curatedOnly(assets), [assets]);
  const soChuaTuyen = assets.length - curated.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return curated.filter((a) => {
      if (industryFilter && a.nganh !== industryFilter) return false;
      if (licenseFilter && a.license !== licenseFilter) return false;
      if (collectionFilter && !(a.hasSource && a.bosuutap.includes(collectionFilter))) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.category.toLowerCase().includes(q) && !a.caption.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [curated, industryFilter, licenseFilter, collectionFilter, query]);

  const industryOrder = useMemo(() => GALLERY_INDUSTRIES.map((g) => g.id), []);
  const groups = useMemo(() => groupByIndustry(filtered, industryOrder), [filtered, industryOrder]);

  const useForNourish = (a: GalleryAsset) => {
    const detail = { imgId: a.imgId, name: a.name, url: a.url };
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(a.imgId).catch(() => {});
    }
    window.dispatchEvent(new CustomEvent(GALLERY_USE_ASSET_EVENT, { detail }));
    pushLibraryToast(tr(`Đã sao chép mã "${a.name}" — dán vào moodboard/Thẻ DNA`, `Copied "${a.name}"'s id — paste it into a moodboard/Design DNA card`));
  };

  const submitSource = () => {
    const check = checkGallerySourceUrl(sourceUrl);
    if (!check.ok) {
      setSourceErr(tr(check.message[0], check.message[1]));
      return;
    }
    addSuggestion(sourceUrl.trim(), '');
    setSourceUrl('');
    setSourceErr(null);
    pushLibraryToast(tr('Đã thêm nguồn — chờ gắn vào ảnh', 'Source added — link it to an image next'));
  };

  const hasAnyAsset = curated.length > 0;
  const hasAnyVisible = groups.length > 0;
  const isFiltering = !!query.trim() || !!industryFilter || !!licenseFilter || !!collectionFilter;

  return (
    <div className="if-gallery-root" data-marker="gallery-curated">
      <RawStyle css={GALLERY_CSS} />

      {/* ĐẦU TRANG MỎNG (Hoà chốt 30/08: "ảnh trước, bộ máy sau").
          Bản cũ đặt <h1> + một đoạn văn giải thích + ô tìm to trước lưới ảnh; cộng 12 chip lọc bên
          dưới thì tấm ảnh ĐẦU TIÊN rơi xuống quá nửa màn. Một mặt cảm hứng mà phải đọc trước khi
          nhìn thì nó là tài liệu, không phải cảm hứng. Chữ giải thích chuyển vào `title` của nút
          lọc — vẫn tra được, không chắn mắt. */}
      <div className="gal-bar">
        <span className="gal-search">
          <Search size={16} strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Tìm trong Gallery…', 'Search the gallery…')}
            aria-label={tr('Tìm trong Gallery', 'Search the gallery')}
          />
        </span>
        <button
          type="button"
          className={hienLoc ? 'gal-loc-nut on' : 'gal-loc-nut'}
          aria-pressed={hienLoc}
          aria-expanded={hienLoc}
          title={tr(
            'Ảnh tuyển có nguồn và giấy phép rõ ràng — kiến trúc · nội thất · cảnh quan · graphic · art. Dùng lại được cho hồ sơ khách.',
            'Curated images with clear source and license — architecture · interior · landscape · graphic · art. Reusable in client deliverables.',
          )}
          onClick={() => setHienLoc((v) => !v)}
        >
          {tr('Lọc', 'Filter')}
          {isFiltering && <span className="gal-loc-cham" aria-hidden />}
        </button>
      </div>

      {hienLoc && (
      <div className="gal-filters">
        <div className="gal-chiprow" role="group" aria-label={tr('Lọc theo nhóm ngành', 'Filter by discipline')}>
          <span className="lbl">{tr('Ngành', 'Discipline')}</span>
          <button type="button" className={industryFilter === null ? 'gal-chip on' : 'gal-chip'} aria-pressed={industryFilter === null} onClick={() => setIndustryFilter(null)}>
            {tr('Tất cả', 'All')}
          </button>
          {GALLERY_INDUSTRIES.map((g) => (
            <button
              type="button"
              key={g.id}
              className={industryFilter === g.id ? 'gal-chip on' : 'gal-chip'}
              aria-pressed={industryFilter === g.id}
              onClick={() => setIndustryFilter((cur) => (cur === g.id ? null : g.id))}
            >
              <span className="dot" style={{ background: INDUSTRY_DOT[g.id] }} />
              {tr(g.label[0], g.label[1])}
            </button>
          ))}
        </div>
        <div className="gal-chiprow" role="group" aria-label={tr('Lọc theo giấy phép', 'Filter by license')}>
          <span className="lbl">{tr('Giấy phép', 'License')}</span>
          <button type="button" className={licenseFilter === null ? 'gal-chip on' : 'gal-chip'} aria-pressed={licenseFilter === null} onClick={() => setLicenseFilter(null)}>
            {tr('Tất cả', 'All')}
          </button>
          {GALLERY_LICENSES.map((l) => (
            <button
              type="button"
              key={l.id}
              className={licenseFilter === l.id ? 'gal-chip on' : 'gal-chip'}
              aria-pressed={licenseFilter === l.id}
              onClick={() => setLicenseFilter((cur) => (cur === l.id ? null : l.id))}
            >
              {tr(l.label[0], l.label[1])}
            </button>
          ))}
        </div>
      </div>
      )}

      {collections.length > 0 && (
        <div className="gal-collections">
          <div className="sec-head">
            <Compass size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            <h2>{tr('Bộ sưu tập xu hướng', 'Trend collections')}</h2>
            <span>{tr('có nguồn', 'sourced')}</span>
          </div>
          <div className="gal-colrow">
            {collections.map((c) => (
              <button
                type="button"
                key={c.slug}
                className={collectionFilter === c.slug ? 'gal-colcard on' : 'gal-colcard'}
                onClick={() => setCollectionFilter((cur) => (cur === c.slug ? null : c.slug))}
                aria-pressed={collectionFilter === c.slug}
              >
                <span className="cover" style={{ backgroundImage: `url(${c.items[0].url})` }} />
                <span className="meta">
                  <b>{collectionLabel(c.slug)}</b>
                  <span>{tr(`${c.items.length} ảnh`, `${c.items.length} images`)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loaded && <p className="gal-loading">{tr('Đang đọc kho…', 'Loading the store…')}</p>}

      {loaded && error && (
        <div className="gal-empty">
          <span>{tr('Không đọc được kho — kiểm tra kết nối rồi thử lại.', "Couldn't load the store — check your connection and try again.")}</span>
          <button type="button" className="go" onClick={refresh}>{tr('Thử lại', 'Retry')}</button>
        </div>
      )}

      {loaded && !error && !hasAnyAsset && (
        <div className="gal-empty">
          <span>
            {tr(
              'Gallery chưa có ảnh nào trong kho. Nhập ảnh sạch (CC0/Unsplash) vào Kho chung để bắt đầu tuyển.',
              'The gallery has no images yet. Import clean images (CC0/Unsplash) into the shared store to start curating.',
            )}
          </span>
          <button type="button" className="go" onClick={() => openLibrarySheet()}>
            <Plus size={18} strokeWidth={1.5} />
            {tr('Nhập từ Kho chung', 'Import from the shared store')}
          </button>
        </div>
      )}

      {loaded && !error && hasAnyAsset && !hasAnyVisible && (
        <div className="gal-empty">
          <span>
            {isFiltering
              ? tr('Không có ảnh nào khớp bộ lọc.', 'No image matches this filter.')
              : tr('Chưa có ảnh nào gắn nhóm ngành.', 'No image has a discipline tag yet.')}
          </span>
        </div>
      )}

      {groups.map((g) => {
        const Icon = INDUSTRY_ICON[g.id];
        return (
          <div className="gal-group" key={g.id}>
            <div className="sec-head">
              <span className="ic"><Icon size={14} strokeWidth={1.5} /></span>
              <h2>{industryLabel(g.id, tr)}</h2>
              <span>{g.items.length}</span>
            </div>
            <div className="gal-grid">
              {g.items.map((a) => (
                <GalleryCard key={a.id} asset={a} onUse={useForNourish} tr={tr} />
              ))}
            </div>
          </div>
        );
      })}

      {/* KHỐI "Chưa gắn nhóm ngành" ĐÃ BỎ 30/08 — nó từng dựng 1.629 thẻ, cao 200.103 px.
          Nguồn nay đã lọc ở `curatedOnly()` nên khối này không bao giờ có hàng; giữ lại là giữ
          một nhánh chết. Số ảnh bị giữ ngoài mặt tiền KHÔNG bị giấu — nó ở dòng ngay dưới. */}
      {soChuaTuyen > 0 && (
        <p className="gal-con-lai">
          {tr(
            `Còn ${soChuaTuyen} ảnh trong Thư viện chưa gắn nhóm ngành hoặc giấy phép — chưa lên mặt tiền, không mất.`,
            `${soChuaTuyen} more images in your Library still lack a discipline or license tag — not shown here, not lost.`,
          )}
        </p>
      )}

      {/* VIỆC 4 (phiếu): "mọi ô nhập URL trong vùng library từ chối domain pinterest". Gallery
          hiện chưa có ô nhập URL nào khác (đã grep trước khi làm — 0 kết quả `type="url"` trong
          `app/library`/`components/library`/`lib/library`), nên đây là CỬA THẬT duy nhất — không
          phải trang trí. Danh sách chỉ sống cục bộ (localStorage, `gallery-local-state.ts`) vì
          ghi vào kho chung `LibraryAsset` cần route PATCH mới, ngoài vùng file được giao. */}
      <div className="gal-source">
        <h3>{tr('Đề xuất nguồn mới', 'Suggest a new source')}</h3>
        <p>
          {tr(
            'Tìm thấy một nguồn ảnh sạch, có giấy phép rõ? Dán link vào đây — Pinterest không dùng được.',
            'Found a clean, clearly licensed image source? Paste the link here — Pinterest links aren’t accepted.',
          )}
        </p>
        <div className="gal-source-row">
          <input
            value={sourceUrl}
            onChange={(e) => { setSourceUrl(e.target.value); setSourceErr(null); }}
            onKeyDown={(e) => e.key === 'Enter' && submitSource()}
            placeholder={tr('https://…', 'https://…')}
            aria-label={tr('Đường dẫn nguồn', 'Source link')}
          />
          <button type="button" onClick={submitSource}>
            <Link2 size={18} strokeWidth={1.5} />
            {tr('Thêm nguồn', 'Add source')}
          </button>
        </div>
        {sourceErr && (
          <p className="gal-source-err">
            <X size={14} strokeWidth={1.5} style={{ flex: 'none', marginTop: 1 }} />
            {sourceErr}
          </p>
        )}
        {suggestions.length > 0 && (
          <div className="gal-source-list">
            {suggestions.map((s) => (
              <div className="gal-source-item" key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer noopener">{s.url}</a>
                <button type="button" onClick={() => removeSuggestion(s.id)} aria-label={tr('Bỏ đề xuất', 'Remove suggestion')}>
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <LibraryToastHost />
    </div>
  );
}

function GalleryCard({ asset, onUse, tr }: { asset: GalleryAsset; onUse: (a: GalleryAsset) => void; tr: (vi: string, en: string) => string }) {
  return (
    <div className="gal-card">
      <span className="shot" style={{ backgroundImage: `url(${asset.url})` }} title={asset.name}>
        <span className={asset.license ? 'gal-badge' : 'gal-badge unknown'}>{licenseLabel(asset.license, tr)}</span>
      </span>
      <div className="body">
        <span className="name">{asset.name}</span>
        {asset.nguon ? (
          <span className="src" title={asset.nguon}>{asset.nguon}</span>
        ) : (
          <span className="src missing" title={tr(MISSING_SOURCE_MESSAGE[0], MISSING_SOURCE_MESSAGE[1])}>
            {tr(MISSING_SOURCE_MESSAGE[0], MISSING_SOURCE_MESSAGE[1])}
          </span>
        )}
        <button type="button" className="use" onClick={() => onUse(asset)}>
          <Copy size={14} strokeWidth={1.5} />
          {tr('Dùng cho moodboard / Thẻ DNA', 'Use for moodboard / Design DNA')}
        </button>
      </div>
    </div>
  );
}
