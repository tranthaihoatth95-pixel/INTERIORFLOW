'use client';

/**
 * components/filemanager/TepNguonDuAn.tsx — khu **Tệp nguồn dự án**: mặt người dùng của chuỗi
 * contract `ProjectFile → xem bằng mắt → Promote → LibraryAsset (+ ProjectAssetUsage)`.
 *
 * Vị trí trong dòng chảy (`docs/IF-KIEN-TRUC.md` §5): đây là MẮT XÍCH ĐẦU — tệp thô thuộc ĐÚNG
 * MỘT dự án; bấm "Đưa vào Thư viện" là bước Promote sinh vật dùng-lại-được ở tầng Thư viện và
 * nối ngược về dự án bằng usage. Mount trong ngăn ① *Tệp dự án* của `/files`
 * (`app/files/page.tsx`), ĐỨNG TRÊN `FileManagerShell` — shell đó là cây thư mục đĩa/mock,
 * còn khu này là dữ liệu server thật (`/api/project-files`, live 20/08).
 *
 * ĐỌC TỪ CODE ROUTE, KHÔNG TIN MÔ TẢ: POST nhận **JSON {projectId, name, dataUrl}** (route.ts:53
 * — không phải multipart); 415 trả kèm lý do từ sniff magic-bytes — UI hiện NGUYÊN VĂN, không
 * nuốt. Promote idempotent: `daCo: true` là 200 lặng lẽ, UI nói "đã có, không nhân bản".
 *
 * HUMAN GATE trước Promote = checkbox "Đã xem": người dùng nhìn tệp rồi xác nhận. KHÔNG chế
 * engine review — gate ở đây là mắt người (đúng phạm vi phiếu). Nút mờ đi đường
 * `aria-disabled` + `aria-describedby` (khuôn ToolbarChip 16/08), độ mờ qua token `--mo-vo-hieu`.
 *
 * XEM TRƯỚC — nói thật về giới hạn: `ProjectFile` KHÔNG có route đọc nội dung (chỉ
 * `/api/library/[id]/file` cho asset ĐÃ promote). ⇒ ảnh thật chỉ hiện được cho ① tệp vừa upload
 * trong phiên (dataUrl còn trong bộ nhớ) và ② tệp đã promote (đọc qua asset). Tệp cũ chưa
 * promote hiện Ô LOẠI TỆP (badge PNG/PDF…) — không giả vờ là ảnh thật (cùng luật `FileThumb`).
 *
 * projectId: đọc `useFlowStore(s => s.currentProjectId)` (cùng nguồn `LibrarySheet.tsx:381`).
 * `/files` vào thẳng bằng URL thì store chưa có dự án ⇒ hiện <select> chọn từ `fetchFlows()`
 * (API thật, lib/workspace) — chọn ở đây là state CỤC BỘ của khu này, KHÔNG ghi ngược vào store
 * (currentProjectId còn điều khiển điều hướng chặng — lib/store.ts:107, không mượn tay đổi).
 *
 * Sau promote thành công: bắn `window` event `if:library-db-refresh` — `LibrarySheet` nghe và
 * gọi `refreshDb()` sẵn có (không store mới, cùng khuôn event `if:navigator-toggle`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, RefreshCw, Trash2, Eye, Library } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { fetchFlows, type ProjectMeta } from '@/lib/workspace';
import {
  USAGE_HIEN_THI,
  USAGE_LIST,
  usageMacDinh,
  loaiTep,
  kiemKichThuoc,
  lyDoChuaGui,
  nhanKetQua,
} from './tep-nguon';

/** Bản ghi `ProjectFile` như GET trả (FILE_SELECT — app/api/project-files/_lib/guard.ts:48). */
interface TepDuAn {
  id: string;
  projectId: string;
  name: string;
  mime: string;
  path: string;
  contentHash: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface KetQuaPromote {
  daCo: boolean;
  assetId: string;
  assetUrl: string;
}

/** Đọc lỗi JSON của API — route LUÔN trả body JSON có `error` (guard.ts), nhưng vẫn phòng thân. */
async function docLoi(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.error === 'string') return j.error;
  } catch {
    // body không phải JSON — rơi xuống mã HTTP trần
  }
  return `HTTP ${res.status}`;
}

function docFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Không đọc được tệp từ máy.'));
    r.readAsDataURL(file);
  });
}

/** Ô xem trước 48px — ảnh thật khi CÓ THẬT (dataUrl phiên / asset đã promote), còn lại là badge
 *  loại tệp. Không bịa hình (cùng luật `FileThumb` của `FileManagerShell`). */
function OXemTruoc({ tep, anhSan }: { tep: TepDuAn; anhSan: string | null }) {
  const khung: React.CSSProperties = {
    width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--r-2)',
    border: '1px solid var(--border)', background: 'var(--field)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  };
  if (anhSan && loaiTep(tep.mime) === 'anh') {
    // eslint-disable-next-line @next/next/no-img-element
    return <span style={khung}><img src={anhSan} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>;
  }
  const badge = loaiTep(tep.mime) === 'pdf' ? 'PDF' : (tep.mime.split('/')[1] ?? 'FILE').toUpperCase().slice(0, 4);
  return (
    <span style={khung} aria-hidden>
      <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)', color: 'var(--t3)', letterSpacing: '.04em' }}>{badge}</span>
    </span>
  );
}

export function TepNguonDuAn() {
  const tr = useT();
  const storeProjectId = useFlowStore((s) => s.currentProjectId);
  /** Dự án đang thao tác — store thắng khi có; vào thẳng URL thì người dùng tự chọn. */
  const [chonProjectId, setChonProjectId] = useState<string | null>(null);
  const projectId = storeProjectId ?? chonProjectId;

  const [duAnList, setDuAnList] = useState<ProjectMeta[] | null>(null);
  const [tepList, setTepList] = useState<TepDuAn[] | null>(null);
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [dangUpload, setDangUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /** dataUrl của tệp upload TRONG PHIÊN — nguồn duy nhất cho ảnh-thật trước khi promote. */
  const [anhPhien, setAnhPhien] = useState<Record<string, string>>({});
  const [daXem, setDaXem] = useState<Record<string, boolean>>({});
  const [usageChon, setUsageChon] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});
  const [dangGui, setDangGui] = useState<Record<string, boolean>>({});
  const [ketQua, setKetQua] = useState<Record<string, KetQuaPromote>>({});
  const [loiTheoTep, setLoiTheoTep] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const idNhan = useMemo(() => `tepnguon-${Math.random().toString(36).slice(2, 8)}`, []);

  // Store chưa có dự án ⇒ tải danh sách thật để chọn (không phải placeholder).
  useEffect(() => {
    if (storeProjectId || duAnList !== null) return;
    let cancelled = false;
    fetchFlows()
      .then(({ projects }) => { if (!cancelled) setDuAnList(projects); })
      .catch((e) => { if (!cancelled) { setDuAnList([]); setLoiChung(e instanceof Error ? e.message : String(e)); } });
    return () => { cancelled = true; };
  }, [storeProjectId, duAnList]);

  const napTep = useCallback(async () => {
    if (!projectId) return;
    setDangTai(true);
    setLoiChung(null);
    try {
      const res = await fetch(`/api/project-files?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) throw new Error(await docLoi(res));
      const j = await res.json();
      setTepList(Array.isArray(j.files) ? j.files : []);
    } catch (e) {
      setTepList(null);
      setLoiChung(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [projectId]);

  useEffect(() => { setTepList(null); void napTep(); }, [napTep]);

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!projectId) return;
    setDangUpload(true);
    setLoiChung(null);
    for (const file of Array.from(files)) {
      // Fail-fast cùng ngưỡng server (25MB) — đỡ encode base64 một tệp chắc chắn bị 413.
      const qua = kiemKichThuoc(file.size);
      if (qua) { setLoiChung(`${file.name}: ${tr(qua.vi, qua.en)}`); continue; }
      try {
        const dataUrl = await docFileDataUrl(file);
        const res = await fetch('/api/project-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, name: file.name, dataUrl }),
        });
        if (!res.ok) {
          // 415/413/… — hiện NGUYÊN VĂN lý do server (sniff magic-bytes), không nuốt.
          setLoiChung(`${file.name}: ${await docLoi(res)}`);
          continue;
        }
        const j = await res.json();
        const row: TepDuAn = j.file;
        setTepList((prev) => [row, ...(prev ?? [])]);
        setAnhPhien((prev) => ({ ...prev, [row.id]: dataUrl }));
      } catch (e) {
        setLoiChung(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    setDangUpload(false);
  }, [projectId, tr]);

  const promote = useCallback(async (tep: TepDuAn) => {
    setDangGui((p) => ({ ...p, [tep.id]: true }));
    setLoiTheoTep((p) => { const { [tep.id]: _bo, ...con } = p; return con; });
    try {
      const usage = usageChon[tep.id] ?? usageMacDinh(tep.mime);
      const note = (ghiChu[tep.id] ?? '').trim();
      const res = await fetch(`/api/project-files/${tep.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage, ...(note ? { note } : {}) }),
      });
      if (!res.ok) throw new Error(await docLoi(res));
      const j = await res.json();
      setKetQua((p) => ({ ...p, [tep.id]: { daCo: !!j.daCo, assetId: j.asset.id, assetUrl: j.asset.url } }));
      // LibrarySheet đang mở/đã cache thì nạp lại kệ — sheet nghe event này (LibrarySheet.tsx).
      window.dispatchEvent(new Event('if:library-db-refresh'));
    } catch (e) {
      setLoiTheoTep((p) => ({ ...p, [tep.id]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setDangGui((p) => ({ ...p, [tep.id]: false }));
    }
  }, [usageChon, ghiChu]);

  const xoa = useCallback(async (tep: TepDuAn) => {
    // window.confirm — cùng khuôn FileManagerShell/MaterialsScreen, không hộp thoại riêng.
    if (!window.confirm(tr(`Xoá mềm "${tep.name}" khỏi tệp nguồn? Asset đã đưa vào Thư viện (nếu có) vẫn giữ nguyên.`,
      `Soft-delete "${tep.name}" from project sources? Any Library asset created from it stays.`))) return;
    try {
      const res = await fetch(`/api/project-files/${tep.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await docLoi(res));
      setTepList((prev) => (prev ?? []).filter((f) => f.id !== tep.id));
    } catch (e) {
      setLoiTheoTep((p) => ({ ...p, [tep.id]: e instanceof Error ? e.message : String(e) }));
    }
  }, [tr]);

  const nutNho: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 'var(--tap)',
    padding: '0 12px', borderRadius: 'var(--r-2)', border: '1px solid var(--border)',
    background: 'var(--field)', color: 'var(--t2)', fontSize: 'var(--fs-2xs)', cursor: 'pointer',
  };

  return (
    <section
      aria-label={tr('Tệp nguồn dự án', 'Project source files')}
      style={{ display: 'grid', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}
      onDragOver={(e) => { e.preventDefault(); if (projectId) setDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (projectId && e.dataTransfer.files?.length) void upload(e.dataTransfer.files); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
          {tr('Tệp nguồn dự án', 'Project source files')}
        </h2>
        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
          {tr('thô, thuộc dự án — xem rồi đưa vào Thư viện', 'raw, per-project — review, then promote to the Library')}
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
          <button type="button" style={nutNho} onClick={() => void napTep()} data-testid="tepnguon-reload">
            <RefreshCw size={13} strokeWidth={1.8} aria-hidden />{tr('Đọc lại', 'Reload')}
          </button>
          <button
            type="button"
            style={{ ...nutNho, ...(projectId ? {} : { opacity: 'var(--mo-vo-hieu)', cursor: 'default' }) }}
            aria-disabled={projectId ? undefined : true}
            aria-describedby={projectId ? undefined : `${idNhan}-canduan`}
            onClick={projectId && !dangUpload ? () => inputRef.current?.click() : undefined}
            data-testid="tepnguon-upload-btn"
          >
            <FileUp size={13} strokeWidth={1.8} aria-hidden />
            {dangUpload ? tr('Đang tải lên…', 'Uploading…') : tr('Tải tệp lên', 'Upload file')}
          </button>
        </span>
        {!projectId && (
          <span id={`${idNhan}-canduan`} className="if-tooltip-a11y">
            {tr('Chọn một dự án trước — tệp nguồn thuộc đúng một dự án.', 'Pick a project first — source files belong to exactly one project.')}
          </span>
        )}
        <input
          ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf"
          style={{ display: 'none' }} data-testid="tepnguon-input"
          onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Chưa có dự án trong store (vào thẳng /files) — chọn dự án THẬT từ /api/flows. */}
      {!storeProjectId && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
          {tr('Dự án', 'Project')}
          <select
            value={chonProjectId ?? ''}
            onChange={(e) => setChonProjectId(e.target.value || null)}
            data-testid="tepnguon-project-select"
            style={{ minHeight: 'var(--tap)', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-2xs)', padding: '0 8px' }}
          >
            <option value="">{duAnList === null ? tr('Đang tải danh sách…', 'Loading…') : tr('— chọn dự án —', '— pick a project —')}</option>
            {(duAnList ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}

      {loiChung && (
        <p role="alert" style={{ margin: 0, padding: '8px 12px', borderRadius: 'var(--r-2)', border: '1px solid var(--danger)', fontSize: 'var(--fs-2xs)', color: 'var(--t1)' }}>
          {loiChung}
        </p>
      )}

      {projectId && dangTai && tepList === null && (
        <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>{tr('Đang đọc tệp nguồn…', 'Reading source files…')}</p>
      )}

      {projectId && tepList !== null && tepList.length === 0 && (
        <p style={{ margin: 0, padding: '18px 14px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--r-3)', fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
          {dragOver
            ? tr('Thả tệp vào đây', 'Drop files here')
            : tr('Chưa có tệp nguồn nào — kéo ảnh/PDF vào đây hoặc bấm "Tải tệp lên".', 'No source files yet — drop images/PDFs here or click "Upload file".')}
        </p>
      )}

      {projectId && tepList !== null && tepList.length > 0 && (
        <ul style={{ display: 'grid', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
          {tepList.map((tep) => {
            const kq = ketQua[tep.id];
            const xemRoi = !!daXem[tep.id];
            const guiDangChay = !!dangGui[tep.id];
            const lyDo = lyDoChuaGui({ daXem: xemRoi, dangGui: guiDangChay });
            const anhSan = anhPhien[tep.id] ?? (kq ? kq.assetUrl : null);
            const usage = usageChon[tep.id] ?? usageMacDinh(tep.mime);
            return (
              <li key={tep.id} data-testid={`tepnguon-row-${tep.id}`}
                style={{ display: 'grid', gap: 8, padding: 'var(--pad-card)', borderRadius: 'var(--r-3)', border: '1px solid var(--border)', background: 'var(--card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <OXemTruoc tep={tep} anhSan={anhSan} />
                  <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{tep.name}</span>
                    <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
                      {tep.mime} · {new Date(tep.uploadedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </span>
                  {kq && (
                    <span data-testid={`tepnguon-ketqua-${tep.id}`}
                      style={{ marginLeft: 'auto', fontSize: 'var(--fs-2xs)', color: 'var(--t1)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '2px 10px' }}>
                      {tr(nhanKetQua(kq.daCo).vi, nhanKetQua(kq.daCo).en)}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* HUMAN GATE — xem bằng mắt rồi xác nhận; chưa tick thì nút promote mờ có lý do. */}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--t2)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={xemRoi} data-testid={`tepnguon-daxem-${tep.id}`}
                      onChange={(e) => setDaXem((p) => ({ ...p, [tep.id]: e.target.checked }))} />
                    <Eye size={13} strokeWidth={1.8} aria-hidden />{tr('Đã xem', 'Reviewed')}
                  </label>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
                    {tr('Dùng làm', 'Use as')}
                    <select value={usage} data-testid={`tepnguon-usage-${tep.id}`}
                      onChange={(e) => setUsageChon((p) => ({ ...p, [tep.id]: e.target.value }))}
                      style={{ minHeight: 'var(--tap)', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-2xs)', padding: '0 8px' }}>
                      {USAGE_LIST.map((u) => <option key={u} value={u}>{tr(USAGE_HIEN_THI[u]!.vi, USAGE_HIEN_THI[u]!.en)}</option>)}
                    </select>
                  </label>

                  <input
                    value={ghiChu[tep.id] ?? ''} placeholder={tr('Ghi chú (tuỳ chọn)', 'Note (optional)')}
                    onChange={(e) => setGhiChu((p) => ({ ...p, [tep.id]: e.target.value }))}
                    aria-label={tr('Ghi chú promote', 'Promote note')}
                    style={{ minHeight: 'var(--tap)', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-2xs)', padding: '0 8px', width: 160 }}
                  />

                  <button
                    type="button" data-testid={`tepnguon-promote-${tep.id}`}
                    style={{ ...nutNho, color: 'var(--t1)', ...(lyDo ? { opacity: 'var(--mo-vo-hieu)', cursor: 'default' } : {}) }}
                    aria-disabled={lyDo ? true : undefined}
                    aria-describedby={lyDo ? `${idNhan}-lydo-${tep.id}` : undefined}
                    onClick={lyDo ? undefined : () => void promote(tep)}
                  >
                    <Library size={13} strokeWidth={1.8} aria-hidden />
                    {guiDangChay ? tr('Đang gửi…', 'Sending…') : kq ? tr(nhanKetQua(kq.daCo).vi, nhanKetQua(kq.daCo).en) : tr('Đưa vào Thư viện', 'Promote to Library')}
                  </button>
                  {lyDo && <span id={`${idNhan}-lydo-${tep.id}`} className="if-tooltip-a11y">{tr(lyDo.vi, lyDo.en)}</span>}

                  <button type="button" style={{ ...nutNho, marginLeft: 'auto' }} data-testid={`tepnguon-xoa-${tep.id}`}
                    onClick={() => void xoa(tep)}>
                    <Trash2 size={13} strokeWidth={1.8} aria-hidden />{tr('Xoá', 'Delete')}
                  </button>
                </div>

                {loiTheoTep[tep.id] && (
                  <p role="alert" style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t1)', border: '1px solid var(--danger)', borderRadius: 'var(--r-2)', padding: '6px 10px' }}>
                    {loiTheoTep[tep.id]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
