'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Upload, Lock, FolderOpen, HardDriveDownload, Search, Image as ImageIcon } from 'lucide-react';
import { childFolders, filesInFolder, folderPath, folderStats, storageByRoot } from '@/lib/filemanager/queries';
import { useFileManagerLocalState, kindFromName } from '@/lib/filemanager/local-state';
import type { FmFile, FmFileKind } from '@/lib/filemanager/types';
import { formatBytes, FM_KIND_LABEL } from '@/lib/filemanager/types';
import {
  listRealFiles,
  realFsMessage,
  writeFileToRoot,
  deleteFileFromRoot,
  renameFileInRoot,
  readFileFromRoot,
  type RealFsFailure,
} from '@/lib/filemanager/real-fs';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { planUpload } from '@/lib/gateway/upload';
import {
  EMPTY_SELECTION,
  clickSelect,
  moveFocus,
  contextSelect,
  pruneSelection,
  type SelectionState,
} from '@/lib/filemanager/selection';
import { RawStyle } from './RawStyle';
import { FILES_MOCK_CSS } from './files-mock-css';
import { FmContextMenu, type FmMenuTarget } from './FmContextMenu';

type ViewMode = 'grid' | 'list';
type InspTab = 'mota' | 'binhluan';

/** SPEC-MAT-DO-CON-TRO §5 chốt 3: nhớ lựa chọn NGƯỜI DÙNG đã bấm; chưa bấm lần nào thì đọc
 *  `matchMedia('(hover: none) and (pointer: coarse)')` — ĐÚNG điều kiện đã dùng ở
 *  `globals.css:1030`, không phát minh cách phát hiện cảm ứng khác. */
const VIEW_PREF_KEY = 'interiorflow.filemanager_g4.view_pref_v1';

function readViewPref(): ViewMode | null {
  try {
    const raw = window.localStorage.getItem(VIEW_PREF_KEY);
    return raw === 'grid' || raw === 'list' ? raw : null;
  } catch {
    return null;
  }
}

/** File THẬT trên đĩa (đọc qua File System Access, xem `real-fs.ts`) — id luôn `real-<tên>`
 *  (gán ở `refreshReal()` dưới). Chỉ nhóm này có nội dung thật đứng sau để đổi tên/tải xuống. */
function isRealDiskFile(f: FmFile): boolean {
  return f.id.startsWith('real-');
}

/** Bản ghi tải-lên-trong-phiên CHƯA ghi được xuống đĩa (fallback lúc `writeFileToRoot` lỗi, xem
 *  `runUpload`) — không có Blob thật đứng sau, nhưng bản ghi này XOÁ được (nó chỉ là state). */
function isSessionUploadStub(f: FmFile): boolean {
  return f.id.startsWith('up-');
}

const REASON_MOCK_ONLY = 'Đây là dữ liệu mẫu minh hoạ, không có file thật để đổi/tải/xoá.';
const REASON_NEEDS_DISK = 'Chỉ dùng được với file đã ghi thật xuống đĩa (chưa ghi được — xem cảnh báo phía trên).';

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

/** Card lưới cho FILE (khác `.fol` của thư mục) — port `mock-if-tep.html` màn 01, đã audit
 *  A4 (docs/AUDIT-MOCK-MANPHU-2026-08-03.md). Ảnh là icon THEO LOẠI (chung cho mọi file cùng
 *  `kind`), KHÔNG bịa hình minh hoạ riêng cho từng file — chỉ `image`/`material` dùng đúng
 *  `f.thumbnail` khi có, không có thì hiện hatch+PLACEHOLDER (không giả vờ là ảnh thật). */
function FileThumb({ f }: { f: FmFile }) {
  if (f.kind === 'image') {
    if (f.thumbnail) {
      return <span className="fcimg" style={{ background: `linear-gradient(135deg, ${f.thumbnail[0]}, ${f.thumbnail[1]})` }} />;
    }
    return (
      <span className="fchatch">
        <ImageIcon size={18} />
        <span className="fcph">PLACEHOLDER</span>
      </span>
    );
  }
  if (f.kind === 'material') {
    const [c1, c2] = f.thumbnail ?? ['#c79a63', '#8a6a44'];
    return <span className="fcsphere" style={{ background: `radial-gradient(circle at 34% 28%, ${c1}, ${c2})` }} />;
  }
  if (f.kind === 'idf' || f.kind === 'cad') {
    return (
      <span className="fcplan">
        <svg width="64" height="44" viewBox="0 0 200 120" fill="var(--ink)">
          <rect x="26" y="18" width="148" height="5" />
          <rect x="26" y="97" width="148" height="5" />
          <rect x="26" y="18" width="5" height="84" />
          <rect x="169" y="18" width="5" height="84" />
          <rect x="98" y="23" width="5" height="34" />
        </svg>
      </span>
    );
  }
  const badgeColor: Partial<Record<FmFile['kind'], string>> = { pdf: 'var(--danger)', sheet: 'var(--success)', video: 'var(--accent)' };
  return (
    <span className="fcdoc">
      <span className="fcdocbadge" style={{ color: badgeColor[f.kind] ?? 'var(--t3)' }}>{(f.ext || f.kind).toUpperCase().slice(0, 4)}</span>
    </span>
  );
}

interface Props {
  /** Hoà 03/08 — Navigator (`FilesNavigator`, ổ ② `AppShell`) và nội dung chính giờ là 2 ANH EM
   * cùng đọc `currentFolderId` từ `app/files/page.tsx` (nguồn chung), thay vì state riêng —
   * bấm cây thư mục ở Navigator phải đổi được nội dung `.main` bên này. */
  currentFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function FileManagerShell({ currentFolderId, onSelectFolder }: Props) {
  // Khởi tạo tĩnh 'list' (khớp SSR — server luôn coi là desktop) rồi tự đổi sau mount nếu có
  // lựa chọn đã lưu hoặc máy là cảm ứng — tránh lệch hydration giữa server/client (§5 chốt 3).
  const [view, setViewState] = useState<ViewMode>('list');
  const [insTab, setInsTab] = useState<InspTab>('mota');
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [realFiles, setRealFiles] = useState<FmFile[]>([]);
  const [fsNote, setFsNote] = useState<string | null>(null);
  /** R6 19/08 — ghi chú THẬT từ Format Router khi upload loại chưa chặng nào mở được (khác fsNote: fsNote = lỗi ghi đĩa). */
  const [gwNote, setGwNote] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<FmFileKind | 'all'>('all');
  const [sel, setSel] = useState<SelectionState>(EMPTY_SELECTION);
  const [ctxTarget, setCtxTarget] = useState<FmMenuTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readViewPref();
    if (saved) {
      setViewState(saved);
      return;
    }
    const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    setViewState(touchOnly ? 'grid' : 'list');
  }, []);

  const setView = (v: ViewMode) => {
    setViewState(v);
    try {
      window.localStorage.setItem(VIEW_PREF_KEY, v);
    } catch {
      // quota/private-mode — chỉ mất việc NHỚ lựa chọn, không chặn đổi view trong phiên
    }
  };

  const setCurrentFolderId = (id: string | null) => {
    setSel(EMPTY_SELECTION);
    setSearch('');
    setKindFilter('all');
    setCtxTarget(null);
    onSelectFolder(id);
  };

  const { state, addComment, addUploadedFile, removeUploadedFile } = useFileManagerLocalState();

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

  /** Chip lọc — CHỈ hiện loại thật sự có trong thư mục đang mở (không hardcode 3 chip cứng
   *  như mock, xem bảng so sánh docs/AUDIT-MOCK-MANPHU-2026-08-03.md §2.10). */
  const availableKinds = useMemo(() => {
    const seen = new Set<FmFileKind>();
    for (const f of files) seen.add(f.kind);
    return Array.from(seen);
  }, [files]);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => (kindFilter === 'all' || f.kind === kindFilter) && (!q || f.name.toLowerCase().includes(q)));
  }, [files, search, kindFilter]);

  const visibleIds = useMemo(() => filteredFiles.map((f) => f.id), [filteredFiles]);

  // Danh sách hiển thị đổi (đổi thư mục/tìm/lọc) → gạt id không còn thấy khỏi tập chọn
  // (`lib/filemanager/selection.ts` `pruneSelection`, đúng SPEC-MAT-DO-CON-TRO §4#1).
  useEffect(() => {
    setSel((prev) => pruneSelection(visibleIds, prev));
  }, [visibleIds]);

  /** Panel chi tiết bên phải luôn theo mục đang có TIÊU ĐIỂM (`focusId`) — click thường/mũi tên
   *  đều dời tiêu điểm nên đều tự cập nhật panel; ⌘-click/shift-click chọn nhiều thì panel theo
   *  mục bấm/tới SAU CÙNG (đúng hành vi Finder — panel không hiện được nhiều file 1 lúc). */
  const selected = useMemo(() => filteredFiles.find((f) => f.id === sel.focusId) ?? null, [filteredFiles, sel.focusId]);

  const onFileActivate = useCallback(
    (f: FmFile, mods: { shift?: boolean; toggle?: boolean } = {}) => {
      setSel((prev) => clickSelect(visibleIds, prev, f.id, mods));
    },
    [visibleIds],
  );

  const onFileContextMenu = useCallback(
    (e: React.MouseEvent, f: FmFile) => {
      e.preventDefault();
      setSel((prev) => contextSelect(visibleIds, prev, f.id));
      const MENU_W = 176;
      const MENU_H = 116;
      const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
      const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);
      setCtxTarget({ fileId: f.id, fileName: f.name, x, y });
    },
    [visibleIds],
  );

  const handleRename = useCallback(
    async (fileId: string, newName: string) => {
      const f = filteredFiles.find((x) => x.id === fileId);
      if (!f || !isRealDiskFile(f)) return;
      const res = await renameFileInRoot(pathSegments, f.name, newName);
      if (res.ok) await refreshReal();
      else setFsNote(realFsMessage(res.reason as RealFsFailure));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredFiles, pathSegments],
  );

  const handleDownload = useCallback(
    async (fileId: string) => {
      const f = filteredFiles.find((x) => x.id === fileId);
      if (!f || !isRealDiskFile(f)) return;
      const res = await readFileFromRoot(pathSegments, f.name);
      if (!res.ok) {
        setFsNote(realFsMessage(res.reason as RealFsFailure));
        return;
      }
      const url = URL.createObjectURL(res.value);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [filteredFiles, pathSegments],
  );

  /** Xoá 1 hay nhiều file đã chọn — dùng chung cho menu chuột phải (1 file) và phím Delete
   *  (cả cụm đang chọn). Xác nhận 1 lần bằng `window.confirm` — cùng khuôn `MaterialsScreen.tsx`/
   *  `TaskBoardScreen.tsx`, không phát minh hộp thoại riêng cho màn này. */
  const handleDeleteMany = useCallback(
    async (ids: string[]) => {
      const targets = ids
        .map((id) => filteredFiles.find((f) => f.id === id))
        .filter((f): f is FmFile => !!f && (isRealDiskFile(f) || isSessionUploadStub(f)));
      if (targets.length === 0) {
        setFsNote(REASON_MOCK_ONLY);
        return;
      }
      const label = targets.length === 1 ? `"${targets[0]!.name}"` : `${targets.length} file đã chọn`;
      if (!window.confirm(`Xoá ${label}? Không hoàn tác được.`)) return;
      let ioFailed = false;
      for (const f of targets) {
        if (isRealDiskFile(f)) {
          const res = await deleteFileFromRoot(pathSegments, f.name);
          if (!res.ok) ioFailed = true;
        } else {
          removeUploadedFile(f.id);
        }
      }
      if (ioFailed) setFsNote(realFsMessage('io'));
      await refreshReal();
      setSel((prev) => ({ ...prev, selectedIds: prev.selectedIds.filter((id) => !targets.some((t) => t.id === id)) }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredFiles, pathSegments, removeUploadedFile],
  );

  // Bàn phím: mũi tên dời tiêu điểm (Shift = nới dải) · Enter thu về đúng 1 mục đang tiêu điểm ·
  // Delete/Backspace xoá cả cụm đang chọn. Bỏ qua khi đang gõ trong ô input/textarea (thanh tìm,
  // ô đổi tên) — không được nuốt phím gõ chữ thường (SPEC-MAT-DO-CON-TRO §4#2).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (visibleIds.length === 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSel((prev) => moveFocus(visibleIds, prev, 1, e.shiftKey));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSel((prev) => moveFocus(visibleIds, prev, -1, e.shiftKey));
      } else if (e.key === 'Enter') {
        setSel((prev) => (prev.focusId ? { selectedIds: [prev.focusId], anchorId: prev.focusId, focusId: prev.focusId } : prev));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        setSel((prev) => {
          if (prev.selectedIds.length > 0) {
            e.preventDefault();
            void handleDeleteMany(prev.selectedIds);
          }
          return prev;
        });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visibleIds, handleDeleteMany]);

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
    setGwNote(null);

    // R6 19/08 — MỌI file upload đi qua MỘT CỬA Format Router (`lib/gateway/upload.ts#planUpload`,
    // cùng cửa với /library/ingest và present Toolbar). Router chỉ PHÂN LOẠI — bản GỐC vẫn ghi
    // đĩa y như cũ (luật gốc-bất-biến); loại chưa chặng nào mở được thì NÓI THẬT, không im lặng.
    const chuaMoDuoc: string[] = [];
    for (const file of items) {
      try {
        const bytes = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
        const plan = planUpload({ name: file.name, bytes });
        if (plan.importableStages.length === 0) chuaMoDuoc.push(file.name);
      } catch {
        // đọc đầu file lỗi → bỏ qua phân loại, upload vẫn chạy bình thường
      }
    }
    if (chuaMoDuoc.length > 0) {
      const vi = chuaMoDuoc.slice(0, 3).join(', ') + (chuaMoDuoc.length > 3 ? '…' : '');
      setGwNote(`Đã giữ bản gốc trên đĩa; ${chuaMoDuoc.length} tệp (${vi}) hiện chưa chặng nào của IF mở được — sẽ mở được khi có importer, không cần tải lại.`);
    }

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
      className={`filerow${sel.selectedIds.includes(f.id) ? ' sel' : ''}`}
      onClick={(e) => onFileActivate(f, { shift: e.shiftKey, toggle: e.metaKey || e.ctrlKey })}
      onContextMenu={(e) => onFileContextMenu(e, f)}
    >
      <span className="ficon">{(f.ext || '—').toUpperCase().slice(0, 4)}</span>
      <span className="fnamecell">{f.name}</span>
      <span className="ftype">{FM_KIND_LABEL[f.kind]}</span>
      <span className="fmeta">{f.addedByName}</span>
      <span className="fsize">{formatBytes(f.sizeBytes)}</span>
    </button>
  );

  const ctxFile = ctxTarget ? filteredFiles.find((f) => f.id === ctxTarget.fileId) ?? null : null;
  const ctxIsReal = !!ctxFile && isRealDiskFile(ctxFile);
  const ctxIsUploadStub = !!ctxFile && isSessionUploadStub(ctxFile);

  return (
    <div className="if-files-outer">
      <RawStyle css={FILES_MOCK_CSS} />
      <div className="if-files-app">
        {/* Rail (`components/LeftRail.tsx`) — XOÁ 03/08: `/files` nay bọc trong `<AppShell>`
            (`app/files/page.tsx`), Navigator = `FilesNavigator` (cây thư mục). */}

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
              <Lock size={14} />
              {currentFolder.permission === 'locked' ? 'Thư mục khoá — chỉ xem, không sửa/xoá.' : 'Chỉ đọc — không tải lên trực tiếp ở đây.'}
            </p>
          )}

          {fsNote && (
            <p className="fsnote">
              <HardDriveDownload size={18} /> {fsNote}
            </p>
          )}

          {gwNote && (
            <p className="fsnote">
              <HardDriveDownload size={18} /> {gwNote}
            </p>
          )}

          {!isRootView && files.length > 0 && (
            <div className="searchrow">
              <div className="searchbox">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tệp trong thư mục"
                  aria-label="Tìm tệp trong thư mục"
                />
              </div>
              {availableKinds.length > 1 && (
                <div className="chiprow" role="group" aria-label="Lọc theo loại">
                  <button type="button" className={kindFilter === 'all' ? 'chip on' : 'chip'} onClick={() => setKindFilter('all')}>Tất cả</button>
                  {availableKinds.map((k) => (
                    <button key={k} type="button" className={kindFilter === k ? 'chip on' : 'chip'} onClick={() => setKindFilter(k)}>
                      {FM_KIND_LABEL[k]}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

          {!isRootView && files.length > 0 && filteredFiles.length === 0 && (
            <div className="noresults">Không tìm thấy tệp phù hợp với bộ lọc.</div>
          )}

          {!isRootView && filteredFiles.length > 0 && (
            view === 'grid' ? (
              <div className="filegrid" style={{ marginTop: 22 }}>
                {filteredFiles.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`filecard${sel.selectedIds.includes(f.id) ? ' sel' : ''}`}
                    onClick={(e) => onFileActivate(f, { shift: e.shiftKey, toggle: e.metaKey || e.ctrlKey })}
                    onContextMenu={(e) => onFileContextMenu(e, f)}
                  >
                    <span className="fcthumb"><FileThumb f={f} /></span>
                    <span className="fcbody">
                      <b>{f.name}</b>
                      <span className="m"><span>{formatBytes(f.sizeBytes)}</span><span>{f.addedByName}</span></span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="filelist">
                <div className="filehead">
                  <span>Tên</span><span>Loại</span><span>Người thêm</span><span>Dung lượng</span>
                </div>
                {filteredFiles.map(fileRow)}
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

          {uploading.length > 0 && (
            <div className="uptoast">
              <div className="uphead">
                Đang tải lên {uploading.length} tệp · {uploading.filter((u) => u.done).length}/{uploading.length}
              </div>
              <div className="uplist">
                {uploading.map((u) => (
                  <div className="upitem" key={u.id}>
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
            </div>
          )}
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
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            // Lối tắt này đọc từ `files` KHÔNG lọc — bỏ bộ lọc/tìm trước để file
                            // vừa chọn chắc chắn nằm trong `visibleIds`, không thì `clickSelect`
                            // (đòi id có mặt trong danh sách truyền vào) sẽ lặng lẽ không làm gì.
                            setSearch('');
                            setKindFilter('all');
                            setSel(clickSelect(files.map((x) => x.id), EMPTY_SELECTION, f.id));
                          }}
                          className="quickfile"
                        >
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
                <FolderOpen size={20} /> Mở trong InteriorFlow
              </button>
            </div>
          )}
        </div>
      </div>

      <FmContextMenu
        target={ctxTarget}
        onDismiss={() => setCtxTarget(null)}
        canRename={ctxIsReal}
        canDownload={ctxIsReal}
        canDelete={ctxIsReal || ctxIsUploadStub}
        renameReason={ctxIsReal ? '' : ctxIsUploadStub ? REASON_NEEDS_DISK : REASON_MOCK_ONLY}
        downloadReason={ctxIsReal ? '' : ctxIsUploadStub ? REASON_NEEDS_DISK : REASON_MOCK_ONLY}
        deleteReason={REASON_MOCK_ONLY}
        onRename={handleRename}
        onDownload={handleDownload}
        onDelete={(fileId) => void handleDeleteMany([fileId])}
      />
    </div>
  );
}
