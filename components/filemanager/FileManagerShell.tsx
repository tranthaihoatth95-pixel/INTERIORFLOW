'use client';

import { useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Upload } from 'lucide-react';
import { childFolders, filesInFolder, folderPath, folderStats, storageByRoot } from '@/lib/filemanager/queries';
import { useFileManagerLocalState } from '@/lib/filemanager/local-state';
import type { FmFile } from '@/lib/filemanager/types';
import { AppRail } from './AppRail';
import { FolderCard } from './FolderCard';
import { FileTile } from './FileTile';
import { EmptyState } from './EmptyState';
import { UploadCard } from './UploadCard';
import { FileManagerInspector } from './FileManagerInspector';
import { FM, FmThemeVars } from './fm-tokens';

type ViewMode = 'grid' | 'list';

interface UploadingItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  startedAt: number;
  durationMs: number;
}

const UPLOAD_DURATION_MS = 4200;

export function FileManagerShell() {
  const [currentFolderId, setCurrentFolderIdRaw] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<FmFile | null>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đổi thư mục → bỏ chọn file cũ, tránh inspector hiện chi tiết 1 file không còn trên màn hình.
  const setCurrentFolderId = (id: string | null) => {
    setSelected(null);
    setCurrentFolderIdRaw(id);
  };

  const { state, addComment, addUploadedFile } = useFileManagerLocalState();

  const path = useMemo(() => folderPath(currentFolderId), [currentFolderId]);
  const subfolders = useMemo(() => childFolders(currentFolderId), [currentFolderId]);
  const currentFolder = path[path.length - 1] ?? null;
  const files = useMemo(() => {
    if (!currentFolderId) return [];
    const base = filesInFolder(currentFolderId);
    const extra = state.uploaded.filter((f) => f.folderId === currentFolderId);
    return [...base, ...extra];
  }, [currentFolderId, state.uploaded]);

  const byRoot = useMemo(() => storageByRoot(), []);
  const isRootView = currentFolderId === null;
  const canUpload = !isRootView && currentFolder?.permission === 'rw';
  const isEmpty = !isRootView && subfolders.length === 0 && files.length === 0 && uploading.length === 0;

  const runUpload = (fileList: FileList) => {
    if (!currentFolderId) return;
    Array.from(fileList).forEach((f) => {
      const id = `up-progress-${Math.random().toString(36).slice(2, 8)}`;
      const startedAt = Date.now();
      setUploading((prev) => [...prev, { id, name: f.name, size: f.size, progress: 0, startedAt, durationMs: UPLOAD_DURATION_MS }]);
      const timer = window.setInterval(() => {
        setUploading((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: Math.min(100, ((Date.now() - u.startedAt) / u.durationMs) * 100) } : u))
        );
      }, 90);
      window.setTimeout(() => {
        window.clearInterval(timer);
        setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u)));
        window.setTimeout(() => {
          addUploadedFile(currentFolderId, { name: f.name, size: f.size });
          setUploading((prev) => prev.filter((u) => u.id !== id));
        }, 380);
      }, UPLOAD_DURATION_MS);
    });
  };

  return (
    <div className="flex h-dvh w-full" style={{ background: FM.bg, color: FM.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <FmThemeVars />
      <AppRail active="files" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto py-[26px] pl-2.5 pr-[30px]">
        <div className="flex items-start gap-3.5">
          <div>
            <h1 className="m-0 text-[22px]" style={{ letterSpacing: '-0.02em' }}>Files</h1>
            <p className="mt-[3px] text-[12px]" style={{ color: FM.mut }}>
              Cây thư mục thật trên đĩa — mở Finder vẫn hiểu
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-[3px] rounded-[11px] p-[3px]" style={{ background: FM.chip }}>
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-label="Xem lưới"
                className="flex h-7 w-8 items-center justify-center rounded-lg"
                style={view === 'grid' ? { background: '#fff', color: FM.ink, boxShadow: '0 1px 3px rgba(0,0,0,.10)' } : { color: '#77777f' }}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                aria-label="Xem danh sách"
                className="flex h-7 w-8 items-center justify-center rounded-lg"
                style={view === 'list' ? { background: '#fff', color: FM.ink, boxShadow: '0 1px 3px rgba(0,0,0,.10)' } : { color: '#77777f' }}
              >
                <List size={14} />
              </button>
            </div>
            {canUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[38px] items-center gap-[7px] rounded-[19px] px-[18px] text-[12.5px] font-semibold text-white"
                style={{ background: FM.ink, boxShadow: '0 4px 14px rgba(38,38,43,.25)' }}
              >
                <Upload size={14} /> Tải lên
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) runUpload(e.target.files);
              e.target.value = '';
            }}
            data-testid="fm-upload-input"
          />
        </div>

        <nav className="mt-5 flex min-w-0 flex-wrap items-center gap-1.5 text-[12.5px]" style={{ color: FM.mut }} aria-label="breadcrumb">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className="rounded-lg px-[9px] py-1 hover:bg-black/5"
            style={!currentFolder ? { color: FM.ink, fontWeight: 600 } : undefined}
          >
            Files
          </button>
          {path.map((p, i) => (
            <span key={p.id} className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden>›</span>
              <button
                type="button"
                onClick={() => setCurrentFolderId(p.id)}
                className="truncate rounded-lg px-[9px] py-1 hover:bg-black/5"
                style={i === path.length - 1 ? { color: FM.ink, fontWeight: 600 } : undefined}
              >
                {p.name}
              </button>
            </span>
          ))}
        </nav>

        {!canUpload && !isRootView && currentFolder && (
          <p className="mt-2 text-[11.5px]" style={{ color: FM.mut }}>
            {currentFolder.permission === 'locked' ? '🔒 Thư mục khoá — chỉ xem, không sửa/xoá.' : '🔒 Chỉ đọc — không tải lên trực tiếp ở đây.'}
          </p>
        )}

        {subfolders.length > 0 && (
          <div className="mt-[18px] flex flex-wrap gap-2.5">
            {subfolders.map((f) => (
              <FolderCard key={f.id} folder={f} stats={folderStats(f.id, state.uploaded)} onOpen={setCurrentFolderId} />
            ))}
          </div>
        )}

        {isEmpty ? (
          <EmptyState canUpload={canUpload} folderName={currentFolder?.name ?? ''} onUpload={() => fileInputRef.current?.click()} />
        ) : (
          !isRootView &&
          files.length > 0 && (
            <div className={`mt-6 pb-24 ${view === 'grid' ? 'flex flex-wrap gap-3' : 'flex flex-col gap-0.5'}`}>
              {files.map((f) => (
                <FileTile key={f.id} file={f} view={view} selected={selected?.id === f.id} onSelect={setSelected} />
              ))}
            </div>
          )
        )}

        {uploading.length > 0 && (
          <div className="absolute bottom-[26px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            {uploading.map((u) => (
              <UploadCard
                key={u.id}
                name={u.name}
                size={u.size}
                progress={u.progress}
                secondsLeft={Math.max(0, Math.ceil((u.durationMs - (u.progress / 100) * u.durationMs) / 1000))}
              />
            ))}
          </div>
        )}
      </main>

      <FileManagerInspector
        file={selected}
        byRoot={byRoot}
        comments={selected ? state.comments[selected.id] ?? [] : []}
        onAddComment={addComment}
      />
    </div>
  );
}
