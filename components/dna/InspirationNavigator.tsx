'use client';

/**
 * components/dna/InspirationNavigator.tsx — ổ ② Navigator cho `/inspiration`, cùng vai
 * `GalleryNavigator`/`MaterialsNavigator`: danh sách DỰ ÁN (tổ chức theo dự án — đề bài slice 11),
 * bấm là đổi `?project=` trên URL (URL là nguồn sự thật, board đọc qua `useSearchParams`).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lightbulb, FolderKanban } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface ProjectLite {
  id: string;
  name: string;
}

export function InspirationNavigator() {
  const tr = useT();
  const params = useSearchParams();
  const active = params?.get('project') ?? '';
  const [projects, setProjects] = useState<ProjectLite[]>([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('load'))))
      .then((j: { projects?: ProjectLite[] }) => setProjects(j.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  const row = 'flex h-[30px] w-full items-center gap-2.5 rounded-[10px] px-2 text-[12.5px] transition-colors hover:bg-[var(--hover)]';
  return (
    <div className="px-1.5 py-1 flex flex-col gap-0.5">
      <Link href="/inspiration" className={`${row} ${!active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--t1)]'}`} aria-current={!active ? 'page' : undefined}>
        <Lightbulb size={14} strokeWidth={1.75} className="shrink-0" />
        {tr('Tất cả cảm hứng', 'All inspiration')}
      </Link>
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/inspiration?project=${encodeURIComponent(p.id)}`}
          className={`${row} ${active === p.id ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--t2)]'}`}
          aria-current={active === p.id ? 'page' : undefined}
        >
          <FolderKanban size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
          <span className="truncate">{p.name}</span>
        </Link>
      ))}
    </div>
  );
}
