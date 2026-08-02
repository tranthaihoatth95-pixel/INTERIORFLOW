'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Upload, Lock, FolderOpen, HardDriveDownload } from 'lucide-react';
import { childFolders, filesInFolder, folderPath, folderStats, storageByRoot } from '@/lib/filemanager/queries';
import { useFileManagerLocalState, kindFromName } from '@/lib/filemanager/local-state';
import type { FmFile } from '@/lib/filemanager/types';
import { formatBytes } from '@/lib/filemanager/types';
import { listRealFiles, realFsMessage, writeFileToRoot, type RealFsFailure } from '@/lib/filemanager/real-fs';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { LeftRail } from '@/components/LeftRail';
import { RawStyle } from './RawStyle';
import { FILES_MOCK_CSS } from './files-mock-css';

type ViewMode = 'grid' | 'list';
type InspTab = 'mota' | 'binhluan';

interface UploadingItem {
  id: string;
  name: string;
  size: number;
  /** 0..100 — tiến trình ghi. File System Access không báo tiến trình từng phần nên chỉ có
   *  0 (đang ghi) → 100 (xong); giữ thanh để người dùng thấy "máy đang làm", không giả lập số. */
  done: boolean;
  error?: string;
}

const STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;
const LIFECYCLE_TAG: Record<FmFile['lifecycle'], string> = { nhap: 'NHÁP', chinh_thuc: 'CHÍNH THỨC', luu_tru: 'LƯU TRỮ' };

export function FileManagerShell() {
  const [currentFolderId, setCurrentFolderIdRaw] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<FmFile | null>(null);
  const [insTab, setInsTab] = useState<InspTab>('mota');
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [realFiles, setRealFiles] = useState<FmFile[]>([]);
  const [fsNote, setFsNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setCurrentFolderId = (id: string | null) => {
    setSelected(null);
    setCurrentFolderIdRaw(id);
  };

  const { state, addComment, addUploadedFile } = useFileManagerLocalState();

  const path = useMemo(() => folderPath(currentFolderId), [currentFolderId]);
  const subfolders = useMemo(() => childFolders(currentFolderId), [currentFolderId]);
  const currentFolder = path[path.length - 1] ?? null;
  const pathSegments = useMemo(() => path.map((p) => p.name), [path]);

  const files = useMemo(() => {
    if (!currentFolderId) return [];
    const mock = filesInFolder(currentFolderId);
    const session = state.uploaded.filter((f) => f.folderId === currentFolderId);
    // File THẬT đọc từ đĩa thắng bản ghi session cùng tên (tránh hiện 2 dòng cho 1 file).
    const realNames = new Set(realFiles.map((f) => f.name));
    return [...mock, ...session.filter((f) => !realNames.has(f.name)), ...realFiles];
  }, [currentFolderId, state.uploaded, realFiles]);

  /** Đọc lại file thật dưới thư mục đang mở. */
  const refreshReal = useCallback(async () => {
    if (!currentFolderId) {
      setRealFiles([]);
      return;
    }
    const res = await listRealFiles(pathSegments);
    if (!res.ok) {
      setRealFiles([]);
      return;
    }
    setRealFiles(
      res.value.map((f) => ({
        id: `real-${f.name}`,
        folderId: currentFolderId,
        name: f.name,
        ext: f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.') + 1).toLowerCase() : '',
        kind: kindFromName(f.name),
        sizeBytes: f.sizeBytes,
        addedById: 'you',
        addedByName: 'Bạn',
        source: 'local',
        lifecycle: 'nhap',
        description: 'File thật trên đĩa — trong thư mục bạn đã chọn ở Cài đặt.',
      })),
    );
  }, [currentFolderId, pathSegments]);

  useEffect(() => {
    void refreshReal();
  }, [refreshReal]);

  const byRoot = useMemo(() => storageByRoot(), []);
  const isRootView = currentFolderId === null;
  const canUpload = !isRootView && currentFolder?.permission === 'rw';
  const showEmptyBlock = files.length === 0 && uploading.length === 0;

  const usedTotal = byRoot.projects + byRoot.backups + byRoot.library + byRoot.knowledge + byRoot.system;
  const pct = Math.min(100, (usedTotal / STORAGE_QUOTA_BYTES) * 100);
  const RING_C = 2 * Math.PI * 26;
  const ringOffset = RING_C * (1 - pct / 100);

  const bars = [
    { k: 'Dự án', v: byRoot.projects, color: '#6a57f5' },
    { k: 'Sao lưu', v: byRoot.backups, color: '#a99cf8' },
    { k: 'Thư viện', v: byRoot.library, color: '#c9c1f2' },
    { k: 'Khác', v: byRoot.knowledge + byRoot.system, color: '#dcd7f5' },
  ];

  /**
   * Tải lên THẬT — ghi thẳng vào `<thư mục gốc>/<đường dẫn đang mở>/`. Nếu chưa chọn thư mục gốc
   * (hoặc trình duyệt không hỗ trợ) thì KHÔNG im lặng: ghi bản ghi session + hiện rõ lý do và
   * cách khắc phục, để người dùng không tưởng file đã nằm trên đĩa (bài học 31/07).
   */
  const runUpload = async (fileList: FileList) => {
    if (!currentFolderId) return;
    const items = Array.from(fileList);
    setFsNote(null);

    for (const file of items) {
      const id = `up-${Math.random().toString(36).slice(2, 8)}`;
      setUploading((prev) => [...prev, { id, name: file.name, size: file.size, done: false }]);

      const res = await writeFileToRoot(pathSegments, file);

      if (res.ok) {
        setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, done: true } : u)));
        await refreshReal();
        window.setTimeout(() => setUploading((prev) => prev.filter((u) => u.id !== id)), 900);
      } else {
        // Không ghi được ổ đĩa → vẫn giữ bản ghi phiên để người dùng thấy mình vừa chọn gì,
        // NHƯNG nói thẳng là chưa nằm trên đĩa + cách sửa.
        addUploadedFile(currentFolderId, { name: file.name, size: file.size });
        setFsNote(realFsMessage(res.reason as RealFsFailure));
        setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, done: true, error: 'chưa ghi được ổ đĩa' } : u)));
        window.setTimeout(() => setUploading((prev) => prev.filter((u) => u.id !== id)), 2200);
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload) return;
    if (e.dataTransfer.files?.length) void runUpload(e.dataTransfer.files);
  };

  const fileRow = (f: FmFile) => (
    <button
      type="button"
      key={f.id}
      className={`filerow${selected?.id === f.id ? ' sel' : ''}`}
      onClick={() => setSelected(f)}
    >
      <span className="ficon">{(f.ext || '—').toUpperCase().slice(0, 4)}</span>
      <span className="fnamecell">{f.name}</span>
      <span className="fmeta">{f.addedByName}</span>
      <span className="fsize">{formatBytes(f.sizeBytes)}</span>
    </button>
  );

  return (
    <div className="if-files-outer">
      <RawStyle css={FILES_MOCK_CSS} />
      <div className="if-files-app">
        {/* Rail DÙNG CHUNG toàn app (`components/LeftRail.tsx`) — G4 đã bỏ rail riêng 03/08 theo
            chỉ đạo Hoà ("đừng dựng rail thứ hai"). Mục Files trong đó đã nối route `/files`. */}
        <LeftRail />

        <div
          className="main"
          onDragOver={(e) => {
            e.preventDefault();
            if (canUpload) setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setDragOver(false);
          }}
          onDrop={onDrop}
        >
          <div className="crumbrow">
            <div>
              <h1>Files</h1>
              <div className="sub">Cây thư mục thật trên đĩa — mở Finder vẫn hiểu</div>
            </div>
            <div className="toolrow">
              <div className="viewseg" role="tablist" aria-label="Kiểu hiển thị">
                <button type="button" role="tab" aria-selected={view === 'grid'} className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Dạng lưới">
                  <LayoutGrid size={14} />
                </button>
                <button type="button" role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="Dạng danh sách">
                  <List size={14} />
                </button>
              </div>
              {canUpload && (
                <button type="button" className="upbtn" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> Tải lên
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void runUpload(e.target.files);
                  e.target.value = '';
                }}
                data-testid="fm-upload-input"
              />
            </div>
          </div>

          <div className="crumbs">
            <button type="button" className="c" onClick={() => setCurrentFolderId(null)}>Files</button>
            {isRootView && <span>&nbsp;· {subfolders.length} thư mục · {formatBytes(usedTotal)}</span>}
            {path.map((p, i) => (
              <span key={p.id} style={{ display: 'contents' }}>
                {' › '}
                {i === path.length - 1 ? (
                  <b className="c">{p.name}</b>
                ) : (
                  <button type="button" className="c" onClick={() => setCurrentFolderId(p.id)}>{p.name}</button>
                )}
              </span>
            ))}
          </div>

          {!canUpload && !isRootView && currentFolder && (
            <p className="permnote">
              <Lock size={11} />
              {currentFolder.permission === 'locked' ? 'Thư mục khoá — chỉ xem, không sửa/xoá.' : 'Chỉ đọc — không tải lên trực tiếp ở đây.'}
            </p>
          )}

          {fsNote && (
            <p className="fsnote">
              <HardDriveDownload size={12} /> {fsNote}
            </p>
          )}

          {subfolders.length > 0 && (
            <div className={view === 'grid' ? 'folders' : 'folders list'}>
              {subfolders.map((f) => {
                const stats = folderStats(f.id, state.uploaded);
                const dim = stats.count === 0;
                return (
                  <button type="button" key={f.id} className={dim ? 'fol dim' : 'fol'} onClick={() => setCurrentFolderId(f.id)}>
                    <span className="ic" />
                    <span>
                      <b>{f.name}</b>
                      <span className="m">{dim ? 'trống' : `${stats.count} file · ${formatBytes(stats.bytes)}`}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isRootView && files.length > 0 && (
            view === 'grid' ? (
              <div className="folders" style={{ marginTop: 22 }}>
                {files.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`fol${selected?.id === f.id ? ' sel' : ''}`}
                    onClick={() => setSelected(f)}
                  >
                    <span className="ic file" />
                    <span>
                      <b>{f.name}</b>
                      <span className="m">{formatBytes(f.sizeBytes)} · {f.addedByName}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="filelist">
                <div className="filehead">
                  <span>Tên</span><span>Người thêm</span><span>Dung lượng</span>
                </div>
                {files.map(fileRow)}
              </div>
            )
          )}

          {showEmptyBlock && (
            <div className={dragOver ? 'empty dragover' : 'empty'}>
              <div className="fan">
                <div className="ph p1" />
                <div className="ph p2" />
                <div className="ph p3" />
              </div>
              {isRootView ? (
                <>
                  <h2>Chọn 1 thư mục để xem file</h2>
                  <p>Files chỉ chứa thư mục — file thật nằm bên trong từng dự án.</p>
                </>
              ) : (
                <>
                  <h2>Chưa có file trong {currentFolder?.name}</h2>
                  <p>{canUpload ? 'Kéo file vào đây — bản vẽ, ảnh khảo sát, brief của khách.' : 'Thư mục chỉ đọc — chưa có nội dung.'}</p>
                </>
              )}
              {canUpload && (
                <button type="button" className="cta" onClick={() => fileInputRef.current?.click()}>
                  Chọn file từ máy <small>hoặc kéo thả</small>
                </button>
              )}
            </div>
          )}

          {dragOver && canUpload && !showEmptyBlock && (
            <div className="dropveil">Thả file vào {currentFolder?.name}</div>
          )}

          {uploading.map((u) => (
            <div className="uptoast" key={u.id}>
              <div className="fic"><span className="badge">{(u.name.split('.').pop() || 'FILE').toUpperCase()}</span></div>
              <div className="meta">
                <div className="nm">{u.name}</div>
                <div className="sz">
                  {formatBytes(u.size)} · {u.error ? u.error : u.done ? 'đã ghi xuống đĩa' : 'đang ghi…'}
                </div>
                <div className="track"><i style={{ width: u.done ? '100%' : '45%' }} /></div>
              </div>
              <div className="pc">{u.done ? (u.error ? '!' : '✓') : '…'}</div>
            </div>
          ))}
        </div>

        <div className="insp">
          <div className="card stor">
            <div className="storrow">
              <svg className="ring" viewBox="0 0 64 64" focusable="false">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--field)" strokeWidth="8" />
                <circle
                  cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={RING_C} strokeDashoffset={ringOffset} transform="rotate(-90 32 32)"
                />
              </svg>
              <div>
                <div className="big">{formatBytes(usedTotal)}</div>
                <div className="small">trên {formatBytes(STORAGE_QUOTA_BYTES)} · {pct.toFixed(0)}%</div>
              </div>
            </div>
            <div className="bars">
              {bars.map((b) => (
                <div className="brow" key={b.k}>
                  <span className="k">{b.k}</span>
                  <span className="tr"><i style={{ width: `${usedTotal ? (b.v / usedTotal) * 100 : 0}%`, background: b.color }} /></span>
                  <span className="v">{formatBytes(b.v)}</span>
                </div>
              ))}
            </div>
          </div>

          {!selected ? (
            <div className="card empty-insp">
              {isRootView || !currentFolder ? (
                <p style={{ margin: 0, textAlign: 'center', color: 'var(--t2)' }}>Chọn 1 thư mục rồi chọn file để xem chi tiết.</p>
              ) : (
                <>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: 'var(--t1)' }}>{currentFolder.name}</p>
                  <p style={{ margin: '0 0 12px', color: 'var(--t2)' }}>
                    {files.length} file · {formatBytes(files.reduce((s, f) => s + f.sizeBytes, 0))}
                  </p>
                  {files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--t3)' }}>File trong thư mục</span>
                      {files.slice(0, 3).map((f) => (
                        <button key={f.id} type="button" onClick={() => setSelected(f)} className="quickfile">
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                          <span style={{ color: 'var(--t3)', flexShrink: 0 }}>{formatBytes(f.sizeBytes)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="fprev"><div className="doc">{(selected.ext || 'FILE').toUpperCase()}</div></div>
              <div className="fname">{selected.name}</div>
              <div className="frow">
                {formatBytes(selected.sizeBytes)}
                <span className="tagofficial">{LIFECYCLE_TAG[selected.lifecycle]}</span>
              </div>
              {selected.matId && (
                <div className="matbox">
                  <div><span>matId</span><span style={{ color: 'var(--t1)', fontFamily: 'monospace' }}>{selected.matId}</span></div>
                  <div><span>Hãng</span><span style={{ color: 'var(--t1)' }}>{selected.brand}</span></div>
                  <div><span>Giá</span><span style={{ color: 'var(--t1)' }}>{selected.price}</span></div>
                </div>
              )}
              <div className="whorow">
                <span className="av"><UserAvatar id={selected.addedById} name={selected.addedByName} size={20} frame={false} /></span>
                Thêm bởi <b>{selected.addedByName}</b>
              </div>
              <div className="tabs">
                <button type="button" className={insTab === 'mota' ? 'on' : ''} onClick={() => setInsTab('mota')}>Mô tả</button>
                <button type="button" className={insTab === 'binhluan' ? 'on' : ''} onClick={() => setInsTab('binhluan')}>
                  Bình luận{(state.comments[selected.id]?.length ?? 0) > 0 ? ` · ${state.comments[selected.id]!.length}` : ''}
                </button>
              </div>
              {insTab === 'mota' ? (
                <div className="desc">{selected.description}</div>
              ) : (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(state.comments[selected.id] ?? []).map((c) => (
                    <div key={c.id} style={{ fontSize: 12 }}>
                      <b style={{ color: 'var(--t1)' }}>{c.author}</b>
                      <div style={{ color: 'var(--t3)' }}>{c.text}</div>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!draft.trim()) return;
                      addComment(selected.id, draft.trim());
                      setDraft('');
                    }}
                    style={{ display: 'flex', gap: 6 }}
                  >
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Viết bình luận…" className="cinput" />
                    <button type="submit" className="cbtn">Gửi</button>
                  </form>
                </div>
              )}
              <button type="button" className="openbtn">
                <FolderOpen size={13} /> Mở trong InteriorFlow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
