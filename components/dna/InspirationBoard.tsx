'use client';

/**
 * components/dna/InspirationBoard.tsx — BỀ MẶT CẢM HỨNG (`/inspiration`, marker `inspiration-surface`).
 *
 * Lát cắt dọc: Nhập ảnh có nguồn (Openverse/Unsplash/dán URL/tải lên — qua `StockPhotoPicker` +
 * `POST /api/library/from-url` / `POST /api/library`, route sẵn có) → tổ chức theo DỰ ÁN + tên +
 * facet nghề (không gian · bề mặt · vật liệu · ánh sáng · ngôn ngữ) → đọc ảnh
 * (`ImageIntelligenceView`) → cổng đầu vào + áp thành ý định lùi được (`InspirationApplyPanel`).
 *
 * KHÔNG phải Pinterest clone: không lưới vô hạn, không "ghim", không ảnh không nguồn. Mỗi thẻ mang
 * dải màu 2px đáy = trạng thái quyền (xanh dùng được · vàng cần xác nhận · đỏ chặn).
 *
 * Đọc kho qua `GET /api/library` (kho chung `LibraryAsset`, cùng cách Gallery) — ảnh có tag
 * `inspo:1` là ảnh của bề mặt này; ảnh thư viện khác vẫn đọc/áp được (không ngõ cụt) nhưng đứng ở
 * nhóm "Từ Kho chung". Gán dự án là TAG lúc nhập (`duan:<id>`) — kho chưa có PATCH tag, nên đổi dự
 * án sau khi nhập là việc SAU (ghi trong báo cáo, không giả vờ có).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ImagePlus, Search, Sparkles, Upload, X } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { LibraryToastHost, pushLibraryToast } from '@/components/library/LibraryToast';
import StockPhotoPicker, { type StockPickResult } from '@/components/common/StockPhotoPicker';
import { imgIdFromKey } from '@/lib/img-id';
import { smartImportImage } from '@/lib/images/smart-ingest';
import { classifyLicense, extractFacetsFromText, FACET_LABEL, parseInspirationTags, buildInspirationTags, stockPhotoImportTags, tagsToFreeText, type Facets, type FacetKind } from '@/lib/gu/inspiration-facets';
import { useInspirationLocal } from '@/lib/gu/inspiration-store';
import type { ImageIntelligenceSummary } from '@/lib/smartselect/image-intelligence';
import { ImageIntelligenceView } from '@/components/smartselect/ImageIntelligenceView';
import { INSPIRATION_CSS } from './inspiration-css';
import { InspirationApplyPanel } from './InspirationApplyPanel';

interface ApiAsset {
  id: string;
  imgId?: string;
  name: string;
  category: string;
  tags: string;
  caption?: string;
  url: string;
  w?: number | null;
  h?: number | null;
  mine?: boolean;
}

interface ProjectLite {
  id: string;
  name: string;
  clientName?: string | null;
}

export interface InspirationAsset {
  id: string;
  imgId: string;
  name: string;
  url: string;
  caption: string;
  tags: string;
  w: number | null;
  h: number | null;
  isInspiration: boolean;
  projectId: string | null;
  license: string | null;
  source: string | null;
  facets: Facets;
}

const FACET_ORDER: FacetKind[] = ['space', 'surface', 'material', 'light', 'style', 'furniture'];

function toAsset(a: ApiAsset): InspirationAsset {
  const info = parseInspirationTags(a.tags);
  const text = extractFacetsFromText([a.name, a.caption ?? '', tagsToFreeText(a.tags)].join(' · '));
  const facets = {} as Facets;
  for (const k of FACET_ORDER) facets[k] = [...info.facets[k], ...text[k]].filter((v, i, arr) => arr.indexOf(v) === i);
  return {
    id: a.id,
    imgId: a.imgId ?? imgIdFromKey(a.id),
    name: a.name,
    url: a.url,
    caption: a.caption ?? '',
    tags: a.tags ?? '',
    w: a.w ?? null,
    h: a.h ?? null,
    isInspiration: info.isInspiration,
    projectId: info.projectId,
    license: info.license,
    source: info.source,
    facets,
  };
}

function stripClass(license: string | null, source: string | null): 'ok' | 'warn' | 'bad' {
  if (source && /pinterest\.|pin\.it/i.test(source)) return 'bad';
  const c = classifyLicense(license).cls;
  if (c === 'lawful-attribution' || c === 'lawful-free') return 'ok';
  return 'warn';
}

export function InspirationBoard() {
  const tr = useT();
  const lang = useLang();
  const vi = lang !== 'en';
  const params = useSearchParams();
  const local = useInspirationLocal();

  const [assets, setAssets] = useState<InspirationAsset[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [query, setQuery] = useState('');
  const [facetFilter, setFacetFilter] = useState<{ kind: FacetKind; value: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [uploadLicense, setUploadLicense] = useState<'studio' | 'user' | 'cc0'>('studio');
  const fileRef = useRef<HTMLInputElement>(null);

  const urlProject = params?.get('project') ?? null;
  const projectId = urlProject ?? local.projectId;

  const refresh = useCallback(() => {
    fetch('/api/library')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('load'))))
      .then((j: { assets: ApiAsset[] }) => {
        setAssets((j.assets ?? []).map(toAsset));
        setLoadErr(false);
      })
      .catch(() => {
        setAssets([]);
        setLoadErr(true);
      });
  }, []);

  useEffect(() => {
    refresh();
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('load'))))
      .then((j: { projects?: ProjectLite[] }) => setProjects(j.projects ?? []))
      .catch(() => setProjects([]));
  }, [refresh]);

  const setProject = (id: string | null) => local.setProjectId(id);

  /* ── lọc + nhóm ── */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (assets ?? []).filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.caption.toLowerCase().includes(q)) return false;
      if (facetFilter && !a.facets[facetFilter.kind].includes(facetFilter.value)) return false;
      return true;
    });
  }, [assets, query, facetFilter]);

  const groups = useMemo(() => {
    const ofProject = visible.filter((a) => a.isInspiration && projectId && a.projectId === projectId);
    const otherInspo = visible.filter((a) => a.isInspiration && !(projectId && a.projectId === projectId));
    const fromLibrary = visible.filter((a) => !a.isInspiration);
    return { ofProject, otherInspo, fromLibrary };
  }, [visible, projectId]);

  const facetCounts = useMemo(() => {
    const out: Record<FacetKind, Map<string, number>> = { space: new Map(), surface: new Map(), material: new Map(), light: new Map(), style: new Map(), furniture: new Map() };
    for (const a of assets ?? []) {
      for (const k of FACET_ORDER) for (const v of a.facets[k]) out[k].set(v, (out[k].get(v) ?? 0) + 1);
    }
    return out;
  }, [assets]);

  const selected = useMemo(() => (assets ?? []).find((a) => a.id === selectedId) ?? null, [assets, selectedId]);
  const [summary, setSummary] = useState<ImageIntelligenceSummary | null>(null);
  useEffect(() => {
    setSummary(selected ? local.analyses[selected.imgId]?.summary ?? null : null);
    // chỉ đổi khi chọn ảnh khác — không đọc lại local mỗi lần lưu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const onAnalyzed = useCallback(
    (s: ImageIntelligenceSummary) => {
      setSummary(s);
      if (selected) local.saveAnalysis(selected.imgId, s);
    },
    [selected, local],
  );

  /* ── nhập từ nguồn ngoài (StockPhotoPicker → from-url) ── */
  const onPick = useCallback(
    async (r: StockPickResult) => {
      setImportBusy(true);
      setImportErr(null);
      try {
        const tags = stockPhotoImportTags(r.photo, projectId);
        const res = await fetch('/api/library/from-url', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: r.photo.full, name: (r.photo.title || r.photo.id).slice(0, 120), category: 'inspiration', tags, usage: 'ref-render' }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
        if (!res.ok) {
          setImportErr(j.error ?? tr('Không nhập được ảnh.', 'Could not import the image.'));
          return;
        }
        pushLibraryToast(tr(`Đã nhập "${r.photo.title || r.photo.id}" · ${r.credit}`, `Imported "${r.photo.title || r.photo.id}" · ${r.credit}`));
        refresh();
        if (j.id) setSelectedId(j.id);
      } finally {
        setImportBusy(false);
      }
    },
    [projectId, refresh, tr],
  );

  /* ── tải lên từ máy (smartImportImage → POST /api/library) ── */
  const onUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      setImportBusy(true);
      setImportErr(null);
      try {
        const imp = await smartImportImage(file);
        const name = file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 120);
        const tags = buildInspirationTags({ projectId, license: uploadLicense, source: 'upload', facets: extractFacetsFromText(name), extra: ['nganh:noi-that'] });
        const res = await fetch('/api/library', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, category: 'inspiration', tags, dataUrl: imp.dataUrl, usage: 'ref-render', w: imp.meta.width, h: imp.meta.height }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
        if (!res.ok) {
          setImportErr(j.error ?? tr('Không tải lên được.', 'Upload failed.'));
          return;
        }
        pushLibraryToast(tr(`Đã tải lên "${name}"`, `Uploaded "${name}"`));
        refresh();
        if (j.id) setSelectedId(j.id);
      } catch (err) {
        setImportErr(err instanceof Error ? err.message : tr('Không đọc được tệp.', 'Could not read the file.'));
      } finally {
        setImportBusy(false);
      }
    },
    [projectId, uploadLicense, refresh, tr],
  );

  const projectName = projects.find((p) => p.id === projectId)?.name;
  const L = (pair: [string, string]) => (vi ? pair[0] : pair[1]);

  const renderGroup = (title: string, items: InspirationAsset[], hint?: string) =>
    items.length === 0 ? null : (
      <div className="ins-group" key={title}>
        <div className="sec-head">
          <h2>{title}</h2>
          <span>{items.length}</span>
          {hint && <span>· {hint}</span>}
        </div>
        <div className="ins-grid">
          {items.map((a) => {
            const strip = stripClass(a.license, a.source);
            const chips = FACET_ORDER.flatMap((k) => a.facets[k].slice(0, 1)).slice(0, 3);
            return (
              <button
                type="button"
                key={a.id}
                className={selectedId === a.id ? 'ins-card on' : 'ins-card'}
                aria-pressed={selectedId === a.id}
                onClick={() => setSelectedId(a.id)}
              >
                <span className="cover" style={{ backgroundImage: `url(${a.url})` }} role="img" aria-label={a.name} />
                <span className="meta">
                  <b>{a.name}</b>
                  <span>{a.license ? classifyLicense(a.license).label || a.license : tr('chưa rõ giấy phép', 'license unknown')}</span>
                  {chips.length > 0 && (
                    <span className="facets">
                      {chips.map((c) => (
                        <i key={c}>{c}</i>
                      ))}
                    </span>
                  )}
                </span>
                <span className={`strip ${strip}`} aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
    );

  const hasAny = (assets?.length ?? 0) > 0;
  const visibleCount = groups.ofProject.length + groups.otherInspo.length + groups.fromLibrary.length;

  return (
    <div className="if-inspo" data-marker="inspiration-surface">
      <RawStyle css={INSPIRATION_CSS} />
      <LibraryToastHost />

      <div className="ins-head">
        <div className="ins-head-copy">
          <h1>{tr('Cảm hứng — ảnh có nguồn, đọc được, áp được', 'Inspiration — sourced, readable, applicable')}</h1>
          <p>
            {tr(
              'Nhập ảnh có giấy phép, máy đọc không gian · bố cục · ánh sáng · vật liệu với cờ nguồn, rồi góp vào Thẻ DNA dự án bằng một ý định lùi được — không sao chép hình học.',
              'Import licensed images, let the machine read space · composition · light · material with provenance flags, then contribute to the project DNA card as a reversible intent — no geometry copied.',
            )}
          </p>
        </div>
        <span className="ins-search">
          <Search size={14} strokeWidth={1.5} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('Tìm theo tên…', 'Search by name…')} aria-label={tr('Tìm ảnh cảm hứng', 'Search inspiration')} />
        </span>
      </div>

      <div className="ins-bar">
        <span className="lbl">{tr('Dự án', 'Project')}</span>
        <select className="ins-select" value={projectId ?? ''} onChange={(e) => setProject(e.target.value || null)} aria-label={tr('Chọn dự án', 'Choose project')}>
          <option value="">{tr('— chưa gán —', '— unassigned —')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}{p.clientName ? ` · ${p.clientName}` : ''}</option>
          ))}
        </select>
        {projectId && (
          <Link href={`/projects/${encodeURIComponent(projectId)}/overview`} className="ins-btn">
            <Sparkles size={14} /> {tr('Mở Thẻ DNA dự án', 'Open project DNA card')}
          </Link>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" className={importOpen ? 'ins-btn primary' : 'ins-btn'} onClick={() => setImportOpen((v) => !v)} aria-expanded={importOpen}>
          {importOpen ? <X size={14} /> : <ImagePlus size={14} />}
          {importOpen ? tr('Đóng nhập ảnh', 'Close import') : tr('Nhập ảnh có nguồn', 'Import sourced image')}
        </button>
      </div>

      {importOpen && (
        <div className="ins-import" data-marker="inspiration-import">
          <h3>{tr('Nhập ảnh có nguồn', 'Import a sourced image')}</h3>
          <p>
            {tr(
              'Openverse (CC) · Unsplash (cần key ở máy chủ) · dán URL ảnh. Link trang Pinterest bị từ chối — không cào ảnh.',
              'Openverse (CC) · Unsplash (server key required) · paste an image URL. Pinterest page links are refused — no scraping.',
            )}{' '}
            {projectId ? tr(`Ảnh sẽ gắn vào dự án "${projectName ?? projectId}".`, `Images attach to project "${projectName ?? projectId}".`) : tr('Chưa chọn dự án — ảnh vào nhóm chưa gán.', 'No project chosen — images go to the unassigned group.')}
          </p>
          <StockPhotoPicker lang={vi ? 'vi' : 'en'} onPick={onPick} count={12} maxGridHeight={240} initialQuery={projectName ? `${projectName} interior` : ''} />
          <div className="row">
            <span className="lbl">{tr('Hoặc tải lên', 'Or upload')}</span>
            <select className="ins-select" value={uploadLicense} onChange={(e) => setUploadLicense(e.target.value as 'studio' | 'user' | 'cc0')} aria-label={tr('Giấy phép ảnh tải lên', 'Upload license')}>
              <option value="studio">{tr('Ảnh của studio', "Studio's own")}</option>
              <option value="cc0">CC0</option>
              <option value="user">{tr('Tôi tự chịu trách nhiệm', 'I take responsibility')}</option>
            </select>
            <input ref={fileRef} type="file" accept="image/*,.tif,.tiff,.heic,.psd" hidden onChange={onUpload} />
            <button type="button" className="ins-btn" onClick={() => fileRef.current?.click()} disabled={importBusy}>
              <Upload size={14} /> {tr('Chọn tệp', 'Choose file')}
            </button>
            {importBusy && <span className="ins-note">{tr('Đang nhập…', 'Importing…')}</span>}
          </div>
          {importErr && <p className="err">{importErr}</p>}
        </div>
      )}

      {hasAny && (
        <div className="ins-chips">
          {FACET_ORDER.map((k) => {
            const entries = [...facetCounts[k].entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
            if (entries.length === 0) return null;
            return (
              <div className="ins-chiprow" key={k} role="group" aria-label={L(FACET_LABEL[k])}>
                <span className="lbl">{L(FACET_LABEL[k])}</span>
                {entries.map(([v, c]) => {
                  const on = facetFilter?.kind === k && facetFilter.value === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      className={on ? 'ins-chip on' : 'ins-chip'}
                      aria-pressed={on}
                      onClick={() => setFacetFilter(on ? null : { kind: k, value: v })}
                    >
                      {v} <span className="n">{c}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div className="ins-body">
        <div>
          {assets === null && <p className="ins-loading">{tr('Đang đọc kho…', 'Loading the store…')}</p>}
          {loadErr && (
            <div className="ins-empty">
              <span>{tr('Không đọc được kho — kiểm tra đăng nhập/kết nối rồi thử lại.', "Couldn't load the store — check sign-in/connection and try again.")}</span>
              <button type="button" className="ins-btn" onClick={refresh}>{tr('Thử lại', 'Retry')}</button>
            </div>
          )}
          {assets !== null && !loadErr && !hasAny && (
            <div className="ins-empty">
              <span>{tr('Chưa có ảnh nào. Nhập ảnh có nguồn để bắt đầu — mỗi ảnh mang giấy phép và xuất xứ.', 'No images yet. Import a sourced image to start — each carries a license and origin.')}</span>
              <button type="button" className="ins-btn primary" onClick={() => setImportOpen(true)}>
                <ImagePlus size={14} /> {tr('Nhập ảnh có nguồn', 'Import sourced image')}
              </button>
            </div>
          )}
          {assets !== null && hasAny && visibleCount === 0 && (
            <div className="ins-empty"><span>{tr('Không có ảnh nào khớp bộ lọc.', 'No image matches this filter.')}</span></div>
          )}
          {renderGroup(projectName ? tr(`Cảm hứng · ${projectName}`, `Inspiration · ${projectName}`) : tr('Cảm hứng · dự án đang chọn', 'Inspiration · current project'), groups.ofProject)}
          {renderGroup(tr('Cảm hứng · dự án khác / chưa gán', 'Inspiration · other / unassigned'), groups.otherInspo)}
          {renderGroup(tr('Từ Kho chung', 'From the shared store'), groups.fromLibrary, tr('chưa gắn cảm hứng, vẫn đọc/áp được', 'not tagged, still readable/applicable'))}
        </div>

        <aside className="ins-detail" aria-label={tr('Chi tiết ảnh', 'Image detail')}>
          {!selected ? (
            <div className="bd"><p className="ins-note">{tr('Chọn một ảnh để đọc và áp.', 'Pick an image to read and apply.')}</p></div>
          ) : (
            <>
              <div className="hd">
                <b>{selected.name}</b>
                <span>
                  {selected.license ? classifyLicense(selected.license).label || selected.license : tr('chưa rõ giấy phép', 'license unknown')}
                  {selected.source && (
                    <>
                      {' · '}
                      {/^https?:\/\//.test(selected.source) ? (
                        <a href={selected.source} target="_blank" rel="noreferrer noopener">{tr('nguồn', 'source')}</a>
                      ) : (
                        selected.source
                      )}
                    </>
                  )}
                  {selected.projectId && projects.find((p) => p.id === selected.projectId) && (
                    <> · {projects.find((p) => p.id === selected.projectId)!.name}</>
                  )}
                </span>
              </div>
              <div className="bd">
                <ImageIntelligenceView
                  asset={{ id: selected.id, imgId: selected.imgId, name: selected.name, url: selected.url, caption: selected.caption, tags: selected.tags }}
                  onAnalyzed={onAnalyzed}
                />
                <InspirationApplyPanel
                  asset={{ id: selected.id, imgId: selected.imgId, name: selected.name }}
                  summary={summary}
                  license={selected.license}
                  source={selected.source}
                  projectId={projectId}
                  projectName={projectName}
                  intents={local.intents}
                  onApplied={local.addIntent}
                  onReverted={local.removeIntent}
                  onToast={pushLibraryToast}
                />
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
