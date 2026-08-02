'use client';

import type { FmFolder } from '@/lib/filemanager/types';
import { formatBytes } from '@/lib/filemanager/types';
import { FM } from './fm-tokens';

interface Props {
  folder: FmFolder;
  stats: { count: number; bytes: number };
  onOpen: (id: string) => void;
}

/** Chip folder — VẬT MẪU mock-files-polished.html `.fol` (icon 2 lớp tím/be + tên + "n file · size"). */
export function FolderCard({ folder, stats, onOpen }: Props) {
  const empty = stats.count === 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(folder.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(folder.id)}
      className="flex cursor-pointer items-center gap-2.5 rounded-[13px] px-3.5 py-2.5 text-[12.5px] transition-transform duration-150 hover:-translate-y-0.5"
      style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}
      data-testid="folder-chip"
    >
      <span className="relative block h-[26px] w-[30px] shrink-0 rounded-[7px]" style={{ background: `linear-gradient(180deg, ${empty ? '#d8d5cf' : '#8f7df7'}, ${empty ? '#c2beb6' : FM.accent})` }}>
        <span className="absolute -top-1 left-0 h-1.5 w-3.5 rounded-t-[4px]" style={{ background: empty ? '#d8d5cf' : '#8f7df7' }} />
      </span>
      <span className="flex flex-col">
        <b className="font-semibold" style={{ color: FM.ink }}>{folder.name}</b>
        <span className="text-[10.5px]" style={{ color: FM.mut }}>
          {empty ? 'trống' : `${stats.count} file · ${formatBytes(stats.bytes)}`}
        </span>
      </span>
    </div>
  );
}
