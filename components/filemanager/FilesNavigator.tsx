'use client';

/**
 * components/filemanager/FilesNavigator.tsx — cây thư mục cho ổ ② Navigator của `/files`
 * (Hoà chỉ đạo 03/08: "/files và /settings phải bọc trong CÙNG AppShell như 3 chặng — Navigator
 * của /files = cây thư mục"). Đệ quy 2 cấp (root + con trực tiếp — dữ liệu mock hiện chỉ sâu
 * đúng 2 cấp, xem `lib/filemanager/mock-data.ts`), dùng lại `childFolders`/`folderStats` có
 * sẵn — không tạo nguồn dữ liệu mới.
 */

import { Folder, ChevronRight } from 'lucide-react';
import { childFolders, folderStats } from '@/lib/filemanager/queries';
import { useFileManagerLocalState } from '@/lib/filemanager/local-state';
import { formatBytes } from '@/lib/filemanager/types';
import { cn } from '@/lib/utils';

interface Props {
  currentFolderId: string | null;
  onSelect: (id: string | null) => void;
}

export function FilesNavigator({ currentFolderId, onSelect }: Props) {
  const { state } = useFileManagerLocalState();
  const roots = childFolders(null);

  return (
    <div className="px-1.5 py-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'flex h-[28px] w-full items-center gap-2 rounded-[8px] px-2 text-[12px] transition-colors duration-100',
          currentFolderId === null ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : 'text-[var(--t2)] hover:bg-[var(--hover)]',
        )}
      >
        <Folder size={13} className="shrink-0" />
        Files
      </button>
      {roots.map((root) => {
        const children = childFolders(root.id);
        const stats = folderStats(root.id, state.uploaded);
        return (
          <div key={root.id}>
            <button
              type="button"
              onClick={() => onSelect(root.id)}
              className={cn(
                'flex h-[28px] w-full items-center gap-1.5 rounded-[8px] px-2 text-[12px] transition-colors duration-100',
                currentFolderId === root.id ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : 'text-[var(--t2)] hover:bg-[var(--hover)]',
              )}
            >
              <ChevronRight size={11} className={cn('shrink-0 text-[var(--t4)] transition-transform', children.length === 0 && 'opacity-0')} />
              <span className="min-w-0 flex-1 truncate text-left">{root.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-[var(--t4)]">{stats.count || ''}</span>
            </button>
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  'flex h-[26px] w-full items-center gap-1.5 rounded-[8px] py-0 pl-7 pr-2 text-[11.5px] transition-colors duration-100',
                  currentFolderId === c.id ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : 'text-[var(--t3)] hover:bg-[var(--hover)]',
                )}
              >
                <span className="min-w-0 flex-1 truncate text-left">{c.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-[var(--t4)]">{formatBytes(folderStats(c.id, state.uploaded).bytes)}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
