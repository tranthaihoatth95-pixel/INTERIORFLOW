'use client';

/**
 * components/library/LibraryOverviewNavigator.tsx — ổ ② Navigator cho `/library` và
 * `/library/knowledge` (cùng vai `GalleryNavigator`/`FilesNavigator`): danh sách MỤC của trang
 * tổng để nhảy neo, cộng hai mặt tiền đứng cạnh (Gallery · Kho vật liệu) và Kho tri thức.
 * Rail điều hướng (ổ ⓪) vẫn là bản đồ app; cột này chỉ là mục lục của TRANG đang mở.
 */
import Link from 'next/link';
import { BookOpenText, Images, LayoutGrid, Palette } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { OVERVIEW_SECTIONS } from '@/lib/library/overview';

const ROW = 'flex h-[30px] w-full items-center gap-2.5 rounded-[var(--r-2)] px-2 text-[length:var(--fs-ui)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

export function LibraryOverviewNavigator({ trang }: { trang: 'tong' | 'tri-thuc' }) {
  const tr = useT();
  return (
    <div className="px-1.5 py-1">
      <Link href="/library" aria-current={trang === 'tong' ? 'page' : undefined} className={`${ROW} ${trang === 'tong' ? 'bg-[var(--accent-soft)] text-[var(--t1)]' : 'text-[var(--t2)]'}`}>
        <LayoutGrid size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
        {tr('Trang tổng', 'Overview')}
      </Link>
      {trang === 'tong' && (
        <ul className="mt-1 flex flex-col gap-0.5 pl-1" aria-label={tr('Mục trong trang', 'Sections on this page')}>
          {OVERVIEW_SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a href={`#muc-${s.id}`} className={`${ROW} text-[var(--t2)]`}>
                <span className="w-5 shrink-0 font-mono text-[length:var(--fs-2xs)] text-[var(--t4)]">{String(i + 1).padStart(2, '0')}</span>
                <span className="truncate">{tr(s.label[0], s.label[1])}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 px-2 pb-1 text-[length:var(--fs-2xs)] font-bold uppercase tracking-wider text-[var(--t3)]">
        {tr('Mặt tiền', 'Faces')}
      </div>
      <Link href="/library/knowledge" aria-current={trang === 'tri-thuc' ? 'page' : undefined} className={`${ROW} ${trang === 'tri-thuc' ? 'bg-[var(--accent-soft)] text-[var(--t1)]' : 'text-[var(--t2)]'}`}>
        <BookOpenText size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
        {tr('Kho tri thức', 'Knowledge base')}
      </Link>
      <Link href="/library/gallery" className={`${ROW} text-[var(--t2)]`}>
        <Images size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
        {tr('Gallery', 'Gallery')}
      </Link>
      <Link href="/materials" className={`${ROW} text-[var(--t2)]`}>
        <Palette size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
        {tr('Kho vật liệu', 'Material store')}
      </Link>
    </div>
  );
}
