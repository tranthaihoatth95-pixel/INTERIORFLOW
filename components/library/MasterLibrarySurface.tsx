'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Upload } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Asset { id: string; name: string; category: string; usage: string; tags: string; url: string; }

export function MasterLibrarySurface() {
  const tr = useT();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => {
    fetch('/api/library')
      .then((r) => {
        if (!r.ok) throw new Error(`library:${r.status}`);
        return r.json();
      })
      .then((d) => setAssets(Array.isArray(d.assets) ? d.assets : []))
      .catch(() => setLoadError(true))
      .finally(() => setLoaded(true));
  }, []);
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return assets.filter((a) => !q || `${a.name} ${a.category} ${a.usage} ${a.tags}`.toLocaleLowerCase().includes(q));
  }, [assets, query]);
  return (
    <main className="h-full overflow-y-auto bg-[var(--bg)] px-[clamp(24px,5vw,80px)] py-10" data-workspace-surface="master-library">
      <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-5 border-b border-[var(--border)] pb-7">
        <div><p className="mb-2 text-xs uppercase tracking-[.18em] text-[var(--t3)]">InteriorFlow</p><h1 className="text-4xl font-semibold tracking-tight text-[var(--t1)]">{tr('Thư viện tổng', 'Master Library')}</h1><p className="mt-2 max-w-2xl text-sm text-[var(--t3)]">{tr('Tài sản thật của studio, giữ nguồn và loại sử dụng.', 'Your studio assets, with source and usage intact.')}</p></div>
        <Link href="/library/ingest" className="flex min-h-11 items-center gap-2 rounded-[var(--r-full)] bg-[var(--accent)] px-5 text-sm font-medium text-white"><Upload size={17}/>{tr('Nhập tài sản', 'Import assets')}</Link>
      </header>
      <div className="mx-auto mt-7 max-w-7xl">
        <label className="flex min-h-12 max-w-xl items-center gap-3 rounded-[var(--r-full)] border border-[var(--border)] bg-[var(--panel)] px-4 text-[var(--t3)]"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('Tìm theo tên, loại, thẻ…', 'Search name, type or tag…')} className="min-w-0 flex-1 bg-transparent text-[var(--t1)] outline-none"/></label>
        {!loaded ? <p className="py-16 text-[var(--t3)]" aria-live="polite">{tr('Đang đọc thư viện…', 'Loading library…')}</p> : loadError ? <p className="py-16 text-[var(--t3)]" role="alert">{tr('Chưa đọc được thư viện. Hãy kiểm tra kết nối rồi tải lại.', 'The library could not be loaded. Check your connection and reload.')}</p> : shown.length === 0 ? <p className="py-16 text-[var(--t3)]">{tr('Không có tài sản khớp. Không tạo dữ liệu minh họa.', 'No matching assets. No sample data was generated.')}</p> : (
          <section className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5" aria-label={tr('Tài sản', 'Assets')}>
            {shown.map((asset) => <article key={asset.id} className="overflow-hidden rounded-[var(--r-3)] border border-[var(--border)] bg-[var(--panel)]"><div className="aspect-[4/3] bg-[var(--field)]"><img src={asset.url} alt={asset.name} className="h-full w-full object-cover" loading="lazy"/></div><div className="p-4"><h2 className="truncate font-medium text-[var(--t1)]">{asset.name}</h2><p className="mt-1 truncate text-xs text-[var(--t3)]">{asset.category || asset.usage || tr('Chưa phân loại', 'Unclassified')}</p></div></article>)}
          </section>
        )}
      </div>
    </main>
  );
}
