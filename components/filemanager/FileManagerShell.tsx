'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, FolderKanban, FolderOpen, LibraryBig, Settings, List, Upload, Lock } from 'lucide-react';
import { childFolders, filesInFolder, folderPath, folderStats, storageByRoot } from '@/lib/filemanager/queries';
import { useFileManagerLocalState } from '@/lib/filemanager/local-state';
import type { FmFile } from '@/lib/filemanager/types';
import { formatBytes } from '@/lib/filemanager/types';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { useFlowStore } from '@/lib/store';
import { RawStyle } from './RawStyle';
import { FILES_MOCK_CSS } from './files-mock-css';

type ViewMode = 'grid' | 'list';
type InspTab = 'mota' | 'binhluan';

interface UploadingItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  startedAt: number;
  durationMs: number;
}

const UPLOAD_DURATION_MS = 6000;
const STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;
const LIFECYCLE_TAG: Record<FmFile['lifecycle'], string> = { nhap: 'NHÁP', chinh_thuc: 'CHÍNH THỨC', luu_tru: 'LƯU TRỮ' };

export function FileManagerShell() {
  const [currentFolderId, setCurrentFolderIdRaw] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<FmFile | null>(null);
  const [insTab, setInsTab] = useState<InspTab>('mota');
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useFlowStore((s) => s.user);

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
    return [...filesInFolder(currentFolderId), ...state.uploaded.filter((f) => f.folderId === currentFolderId)];
  }, [currentFolderId, state.uploaded]);

  const byRoot = useMemo(() => storageByRoot(), []);
  const isRootView = currentFolderId === null;
  const canUpload = !isRootView && currentFolder?.permission === 'rw';
  const isEmpty = !isRootView && subfolders.length === 0 && files.length === 0 && uploading.length === 0;

  const usedTotal = byRoot.projects + byRoot.backups + byRoot.library + byRoot.knowledge + byRoot.system;
  const pct = Math.min(100, (usedTotal / STORAGE_QUOTA_BYTES) * 100);
  const ringDash = 163 * (pct / 100);

  const bars = [
    { k: 'Dự án', v: byRoot.projects, color: '#6a57f5' },
    { k: 'Sao lưu', v: byRoot.backups, color: '#a99cf8' },
    { k: 'Thư viện', v: byRoot.library, color: '#c9c1f2' },
    { k: 'Khác', v: byRoot.knowledge + byRoot.system, color: '#dcd7f5' },
  ];

  const runUpload = (fileList: FileList) => {
    if (!currentFolderId) return;
    Array.from(fileList).forEach((f) => {
      const id = `up-${Math.random().toString(36).slice(2, 8)}`;
      const startedAt = Date.now();
      setUploading((prev) => [...prev, { id, name: f.name, size: f.size, progress: 0, startedAt, durationMs: UPLOAD_DURATION_MS }]);
      const timer = window.setInterval(() => {
        setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, progress: Math.min(100, ((Date.now() - u.startedAt) / u.durationMs) * 100) } : u)));
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(timer);
        setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u)));
        window.setTimeout(() => {
          addUploadedFile(currentFolderId, { name: f.name, size: f.size });
          setUploading((prev) => prev.filter((u) => u.id !== id));
        }, 350);
      }, UPLOAD_DURATION_MS);
    });
  };

  return (
    <div className="if-files-outer">
      <RawStyle css={FILES_MOCK_CSS} />
      <div className="if-files-app">
        {/* RAIL — docs/mocks/mock-files-polished.html .rail/.railcap */}
        <div className="rail">
          <div className="railcap">
            <Link href="/" className="ri" aria-label="Dashboard"><LayoutGrid size={17} /><span className="tip">Dashboard</span></Link>
            <span className="ri" aria-label="Dự án" title="Chưa có trang riêng"><FolderKanban size={17} /><span className="tip">Dự án</span></span>
            <Link href="/files" className="ri on" aria-label="Files"><FolderOpen size={17} /><span className="tip">Files</span></Link>
            <Link href="/library" className="ri" aria-label="Master Library"><LibraryBig size={17} /><span className="tip">Master Library</span></Link>
            <div className="sep" />
            <Link href="/settings" className="ri" aria-label="Cài đặt"><Settings size={17} /><span className="tip">Cài đặt</span></Link>
          </div>
          <div className="bottom">
            <Link href="/settings" aria-label="Tài khoản">
              <span className="avatar"><UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={40} frame={false} /></span>
            </Link>
          </div>
        </div>

        {/* MAIN — .main */}
        <div className="main">
          <div className="crumbrow">
            <div>
              <h1>Files</h1>
              <div className="sub">Cây thư mục thật trên đĩa — mở Finder vẫn hiểu</div>
            </div>
            <div className="toolrow">
              <div className="viewseg">
                <span className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><LayoutGrid size={14} /></span>
                <span className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><List size={14} /></span>
              </div>
              <button type="button" className="upbtn" disabled={!canUpload} onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Tải lên
              </button>
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
          </div>

          <div className="crumbs">
            <button type="button" className="c" onClick={() => setCurrentFolderId(null)}>Files</button>
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
            <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--t2)', marginTop: 8 }}>
              <Lock size={11} />
              {currentFolder.permission === 'locked' ? 'Thư mục khoá — chỉ xem, không sửa/xoá.' : 'Chỉ đọc — không tải lên trực tiếp ở đây.'}
            </p>
          )}

          {subfolders.length > 0 && (
            <div className="folders">
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

          {isEmpty && (
            <div className="empty">
              <div className="fan">
                <div className="ph p1" />
                <div className="ph p2" />
                <div className="ph p3" />
              </div>
              <h2>Chưa có file trong {currentFolder?.name}</h2>
              <p>{canUpload ? 'Kéo file vào đây — bản vẽ, ảnh khảo sát, brief của khách.' : 'Thư mục chỉ đọc — chưa có nội dung.'}</p>
              {canUpload && (
                <button type="button" className="cta" onClick={() => fileInputRef.current?.click()}>
                  Chọn file từ máy <small>hoặc kéo thả</small>
                </button>
              )}
            </div>
          )}

          {!isRootView && files.length > 0 && (
            <div className="folders" style={{ marginTop: isEmpty ? 0 : 22 }}>
              {files.map((f) => (
                <button type="button" key={f.id} className="fol" onClick={() => setSelected(f)} style={{ borderColor: selected?.id === f.id ? '#6a57f5' : undefined }}>
                  <span className="ic" style={{ background: '#e6e3de' }} />
                  <span>
                    <b>{f.name}</b>
                    <span className="m">{formatBytes(f.sizeBytes)} · {f.addedByName}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {uploading.map((u) => (
            <div className="uptoast" key={u.id}>
              <div className="fic"><span className="badge">{(u.name.split('.').pop() || 'FILE').toUpperCase()}</span></div>
              <div className="meta">
                <div className="nm">{u.name}</div>
                <div className="sz">{formatBytes(u.size)} · còn {Math.max(0, Math.ceil((u.durationMs - (u.progress / 100) * u.durationMs) / 1000))} giây</div>
                <div className="track"><i style={{ width: `${u.progress}%` }} /></div>
              </div>
              <div className="pc">{u.progress.toFixed(0)}%</div>
            </div>
          ))}
        </div>

        {/* INSPECTOR — .insp */}
        <div className="insp">
          <div className="card stor">
            <div className="storrow">
              <svg className="ring" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--field)" strokeWidth="8" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${ringDash} ${163 - ringDash}`} transform="rotate(-90 32 32)" />
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
            <div className="card empty-insp">Chọn 1 file để xem chi tiết.</div>
          ) : (
            <div className="card">
              <div className="fprev"><div className="doc">{(selected.ext || 'FILE').toUpperCase()}</div></div>
              <div className="fname">{selected.name}</div>
              <div className="frow">
                {formatBytes(selected.sizeBytes)}
                <span className="tagofficial">{LIFECYCLE_TAG[selected.lifecycle]}</span>
              </div>
              {selected.matId && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'var(--field)', fontSize: 11.5, color: 'var(--t2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>matId</span><span style={{ color: 'var(--t1)', fontFamily: 'monospace' }}>{selected.matId}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Hãng</span><span style={{ color: 'var(--t1)' }}>{selected.brand}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Giá</span><span style={{ color: 'var(--t1)' }}>{selected.price}</span></div>
                </div>
              )}
              <div className="whorow">
                <span className="av"><UserAvatar id={selected.addedById} name={selected.addedByName} size={20} frame={false} /></span>
                Thêm bởi <b>{selected.addedByName}</b>
              </div>
              <div className="tabs">
                <span className={insTab === 'mota' ? 'on' : ''} onClick={() => setInsTab('mota')}>Mô tả</span>
                <span className={insTab === 'binhluan' ? 'on' : ''} onClick={() => setInsTab('binhluan')}>
                  Bình luận{(state.comments[selected.id]?.length ?? 0) > 0 ? ` · ${state.comments[selected.id]!.length}` : ''}
                </span>
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
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Viết bình luận…"
                      style={{ flex: 1, borderRadius: 8, padding: '6px 10px', fontSize: 12, background: 'var(--field)', color: 'var(--t1)', border: '1px solid var(--border)' }}
                    />
                    <button type="submit" style={{ borderRadius: 8, padding: '0 10px', fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent)', border: 0 }}>Gửi</button>
                  </form>
                </div>
              )}
              <button type="button" className="openbtn">Mở trong InteriorFlow</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
