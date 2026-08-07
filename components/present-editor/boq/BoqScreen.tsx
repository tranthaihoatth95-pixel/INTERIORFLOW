'use client';

/**
 * components/present-editor/boq/BoqScreen.tsx — B1 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`): màn BOQ
 * trong chặng Trình bày. Không dựng shell riêng (dùng `<AppShell>` đã mount ở
 * `PresentStageScreen.tsx`, xem file đó) — component này CHỈ là nội dung bên trong.
 *
 * Luồng: `getProjectDoc` (B0, đọc Doc SỐNG, không snapshot) → `POST /api/boq/[projectId]` (engine
 * đã có sẵn) → áp override (B5) → nhóm theo tầng (B6) → bảng (B2/B3/B4/B10 — `BoqTable.tsx`).
 * CẤM: `dataUrl`/`snapshot` (đúng `SPEC-TRINH-ONG-KINH-DU-LIEU.md` T1/T3) — grep 0 trong cả thư
 * mục `boq/` (R1).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, FileSpreadsheet, Printer, X } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { useCadStore } from '@/lib/cad/store';
import type { BoqError, BoqRow } from '@/lib/boq/model';
import { boqResultToXlsxBuffer, type BoqXlsxImage } from '@/lib/boq/xlsx';
import { getProjectDoc, type ProjectDocSource } from '@/lib/present-editor/project-doc';
import {
  applyBoqOverrides, totalWithOverrides, countOverrideStatus, setOverride, revertOverride,
  type BoqDisplayRow, type BoqOverrideField, type BoqOverrideMap,
} from '@/lib/present-editor/boq-overrides';
import { loadBoqOverrides, saveBoqOverrides } from '@/lib/present-editor/boq-overrides-persist';
import { groupBoqRows, type BoqGroupMode } from '@/lib/present-editor/boq-group';
import { buildBoqSpecExtraMap, type BoqSpecExtra } from '@/lib/present-editor/boq-spec-extra';
import type { Doc } from '@/lib/cad/model';
import { emptyDoc } from '@/lib/cad/model';
import { BoqTable, type BoqSelectedCell } from './BoqTable';
import { BoqErrorBanner } from './BoqErrors';
import { EmptyState } from '@/components/ui/EmptyState';

interface BoqApiResponse {
  rows: BoqRow[];
  errors: BoqError[];
  totalAmount: number;
  hit: boolean;
}

const COACH_KEY = 'if-boq-coach-dismissed';
const GROUP_MODE_KEY = 'if-boq-group-mode';

/** Trần số ảnh nhúng vào 1 file .xlsx — bảng vài trăm dòng × ảnh vài trăm KB sẽ ra file hàng chục
 * MB và làm treo tab lúc nạp. Vượt trần thì BÁO số ảnh bị bỏ, KHÔNG cắt âm thầm. */
const XLSX_IMAGE_LIMIT = 60;

/**
 * Nạp 1 ảnh về dạng `lib/boq/xlsx.ts` cần (byte + đuôi + kích thước GỐC px). Ở tầng client vì
 * module xuất .xlsx cố ý THUẦN (không fetch/không đọc đĩa — điều kiện để test được).
 * Trả `null` khi: tải hỏng · không phải PNG/JPEG (Excel không nhận webp/avif đáng tin) · ảnh
 * không giải mã được. Caller ĐẾM số null và báo cho người dùng, KHÔNG bỏ qua im lặng.
 */
async function loadImageForXlsx(url: string): Promise<BoqXlsxImage | null> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const type = (res.headers.get('content-type') ?? '').toLowerCase();
  const ext: 'png' | 'jpeg' | null = type.includes('png') ? 'png' : (type.includes('jpeg') || type.includes('jpg')) ? 'jpeg' : null;
  if (!ext) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());

  // Kích thước GỐC đọc bằng chính bộ giải mã ảnh của trình duyệt — KHÔNG tự parse header PNG/JPEG
  // (viết parser ảnh là việc riêng, dễ sai với ảnh progressive/EXIF-xoay).
  const blobUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const dim = await new Promise<{ w: number; h: number } | null>((resolve) => {
    const im = new Image();
    im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => resolve(null);
    im.src = blobUrl;
  });
  URL.revokeObjectURL(blobUrl);
  if (!dim || !dim.w || !dim.h) return null;
  return { bytes, ext, wPx: dim.w, hPx: dim.h };
}

function fmtVnd(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function BoqScreen({ projectId, userId }: { projectId: string; userId: string }) {
  const tr = useT();
  // `useT()` trả hàm MỚI mỗi render (không memo hoá) — nếu đưa `tr` vào deps của `compute`
  // (useCallback) thì `compute` cũng đổi mỗi render, kéo `useEffect(() => compute(), [compute])`
  // chạy lại vô hạn (đã bắt được qua console "Maximum update depth exceeded" lúc verify browser).
  // `useLang()` trả nguyên trị 'vi'|'en' ổn định qua Zustand selector — dùng cái này trong deps.
  const lang = useLang();
  const router = useRouter();

  const [doc, setDoc] = useState<Doc>(emptyDoc());
  const [docSource, setDocSource] = useState<ProjectDocSource | null>(null);
  const [boq, setBoq] = useState<BoqApiResponse | null>(null);
  const [overrides, setOverrides] = useState<BoqOverrideMap>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<BoqSelectedCell | null>(null);
  const [coachDismissed, setCoachDismissed] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [groupMode, setGroupMode] = useState<BoqGroupMode>('storey');
  const [specExtra, setSpecExtra] = useState<Map<string, BoqSpecExtra>>(new Map());
  const historyRef = useRef<BoqOverrideMap[]>([]);

  useEffect(() => {
    try { setCoachDismissed(localStorage.getItem(COACH_KEY) === '1'); } catch { /* private mode — mặc định hiện coach, không crash */ }
    try {
      const saved = localStorage.getItem(GROUP_MODE_KEY);
      if (saved === 'room' || saved === 'storey') setGroupMode(saved);
    } catch { /* private mode — mặc định 'storey', không crash */ }
  }, []);

  const changeGroupMode = (mode: BoqGroupMode) => {
    setGroupMode(mode);
    try { localStorage.setItem(GROUP_MODE_KEY, mode); } catch { /* tiện nghi, không chặn nếu lưu lỗi */ }
  };

  // Cột "Quy cách"/"Đơn vị"/"Ảnh" (JOIN hiển thị, KHÔNG đụng lib/boq/*) — fetch 1 lần, đường có
  // sẵn dùng ở nhiều nơi khác (vd lib/render-studio/use-materials.ts), tự khai type tối thiểu tại
  // đây theo đúng quy ước "mỗi consumer tự lấy field mình cần" của lib/boq/from-project.ts.
  // 06/08 (G-M3-09/11): BỎ `?kind=material` — bảng nay có cả dòng MÓN RỜI, mã hàng của chúng nằm
  // ở kind 'furniture'/'lighting'/'fixture'… ⇒ lọc mỗi 'material' thì những dòng đó mất sạch quy
  // cách + ảnh (ô trống câm). Khớp với route `/api/boq/[projectId]` cũng vừa bỏ bộ lọc kind.
  useEffect(() => {
    let alive = true;
    fetch('/api/specs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (alive && data?.specs) setSpecExtra(buildBoqSpecExtraMap(data.specs)); })
      .catch((err) => {
        // Cột Quy cách/Đơn vị/Ảnh chỉ là JOIN hiển thị phụ (xem comment §121 ở trên) — không
        // chặn bảng BOQ chính khi hỏng, nhưng KHÔNG được nuốt lỗi im lặng (luật G-M20-02):
        // ghi log kèm lý do để phiên sau/console điều tra biết vì sao 3 cột đó trống.
        console.warn('[BoqScreen] Không tải được /api/specs — cột Quy cách/Đơn vị/Ảnh sẽ trống:', err);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!projectId || !userId) return;
    let alive = true;
    void loadBoqOverrides(userId, projectId).then((m) => { if (alive) setOverrides(m); });
    return () => { alive = false; };
  }, [projectId, userId]);

  const compute = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { doc: nextDoc, source } = await getProjectDoc(userId, projectId);
      setDoc(nextDoc);
      setDocSource(source);
      if (source === 'none' || nextDoc.entities.length === 0) {
        setBoq({ rows: [], errors: [], totalAmount: 0, hit: false });
        return;
      }
      const res = await fetch(`/api/boq/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc: nextDoc }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || (lang === 'vi' ? 'Không tính được BOQ — thử lại.' : 'Could not compute BOQ — try again.'));
      }
      setBoq(await res.json());
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [projectId, userId, lang]);

  useEffect(() => { void compute(); }, [compute]);

  const persistOverrides = useCallback((next: BoqOverrideMap) => {
    setOverrides(next);
    void saveBoqOverrides(userId, projectId, next).then(() => setSavedAt(Date.now()));
  }, [userId, projectId]);

  const onOverride = useCallback((matId: string, field: BoqOverrideField, value: number) => {
    historyRef.current.push(overrides);
    persistOverrides(setOverride(overrides, matId, field, value, Date.now()));
  }, [overrides, persistOverrides]);

  const onRevert = useCallback((matId: string, field: BoqOverrideField) => {
    historyRef.current.push(overrides);
    persistOverrides(revertOverride(overrides, matId, field));
  }, [overrides, persistOverrides]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        const prev = historyRef.current.pop();
        if (prev) { e.preventDefault(); persistOverrides(prev); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [persistOverrides]);

  const displayRows: BoqDisplayRow[] = boq ? applyBoqOverrides(boq.rows, overrides) : [];
  const groups = boq ? groupBoqRows(displayRows, doc, groupMode) : [];
  const liveTotal = totalWithOverrides(displayRows);
  const counts = countOverrideStatus(displayRows);
  const errorCount = boq?.errors.length ?? 0;

  const dismissCoach = () => {
    setCoachDismissed(true);
    try { localStorage.setItem(COACH_KEY, '1'); } catch { /* tiện nghi, không chặn nếu lưu lỗi */ }
  };

  const exportXlsx = async () => {
    if (!boq || exporting) return;
    setExporting(true);
    let skipped = 0;
    const images = new Map<string, BoqXlsxImage>();
    try {
      // G-M3-11 (06/08) — NẠP ẢNH rồi mới xuất. `lib/boq/xlsx.ts` cố ý THUẦN (không fetch bên
      // trong) nên khâu tải + đo kích thước ảnh nằm ở đây, tầng client. Trần `XLSX_IMAGE_LIMIT`
      // để bảng vài trăm dòng không kéo hàng trăm ảnh làm treo tab — vượt trần thì BÁO, không
      // âm thầm cắt.
      const wanted = displayRows
        .map((r) => ({ matId: r.matId, url: specExtra.get(r.matId)?.imageUrl ?? null }))
        .filter((x): x is { matId: string; url: string } => !!x.url);
      const take = wanted.slice(0, XLSX_IMAGE_LIMIT);
      skipped = wanted.length - take.length;
      const loaded = await Promise.all(take.map((x) => loadImageForXlsx(x.url)));
      loaded.forEach((img, i) => {
        if (img) images.set(take[i].matId, img);
        else skipped += 1;
      });
    } catch {
      // Ảnh hỏng/đứt mạng KHÔNG được chặn việc xuất bảng số — xuất tiếp, báo ở dưới.
      skipped = -1;
    }

    try {
      const buf = await boqResultToXlsxBuffer(
        { rows: displayRows, errors: boq.errors, totalAmount: liveTotal },
        { images },
      );
      // Uint8Array<ArrayBufferLike> vs BlobPart's ArrayBufferView<ArrayBuffer>: quirk kiểu lib.dom
      // của TS bản mới (SharedArrayBuffer thiếu vài field so ArrayBuffer) — buf luôn là
      // ArrayBuffer thật (jszip trả `uint8array`), ép kiểu an toàn, không đổi hành vi runtime.
      const blob = new Blob([buf as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOQ-${projectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Dựng file hỏng ⇒ BÁO, không để nút kẹt "Đang xuất…" vĩnh viễn (không nuốt lỗi).
      setErrorMsg(tr('Không dựng được file .xlsx — báo lỗi này cho Hoà kèm số dòng bảng.', 'Could not build the .xlsx file — report this along with the table row count.') + ` (${e instanceof Error ? e.message : String(e)})`);
      setExporting(false);
      return;
    }
    setExporting(false);
    // Nói thẳng file vừa tải về THIẾU gì — người gửi khách phải biết trước khi bấm Gửi.
    if (skipped === -1) {
      setErrorMsg(tr('Đã xuất bảng số, nhưng KHÔNG nhúng được ảnh nào (lỗi tải ảnh). File vẫn dùng được, chỉ thiếu cột ảnh.', 'Exported the table, but no images could be embedded (image load failed). The file is usable, just without the image column.'));
    } else if (skipped > 0) {
      setErrorMsg(tr(`Đã xuất file. ${skipped} ảnh KHÔNG nhúng được (quá trần ${XLSX_IMAGE_LIMIT} ảnh, hoặc định dạng ảnh không phải PNG/JPEG).`, `Exported. ${skipped} image(s) could not be embedded (over the ${XLSX_IMAGE_LIMIT}-image cap, or not PNG/JPEG).`));
    }
  };

  const selectedRow = selected ? displayRows.find((r) => r.matId === selected.matId) ?? null : null;
  const selectedOverride = selected && selectedRow ? (selected.field === 'm2' ? selectedRow.m2Override : selectedRow.donGiaOverride) : null;

  const viewOnDrawing = (entityIds: string[]) => {
    if (!entityIds.length) return;
    useCadStore.getState().select(entityIds);
    router.push(`/projects/${projectId}/cad`);
  };

  return (
    <div className="if-boq-print-root" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      {/* B9 — bố cục in A4 NGANG: cô lập bảng ra khỏi shell khi in (chuẩn "isolate ancestor",
          KHÔNG cần thư viện PDF riêng — @page landscape + ẩn mọi thứ khác qua class .if-boq-no-print).
          Đủ cho "in văn phòng"; preset "gửi nhà in" (+bleed/crop marks/pdf-font riêng, B9 đầy đủ
          theo phiếu) CHƯA làm ở đợt này — ghi rõ, không giả vờ đủ. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body * { visibility: hidden; }
          .if-boq-print-root, .if-boq-print-root * { visibility: visible; }
          .if-boq-print-root { position: absolute; inset: 0; height: auto !important; background: #fff !important; }
          .if-boq-no-print { display: none !important; }
          .if-boq-print-root table { font-size: 11px; }
        }
      `}</style>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="if-boq-no-print" style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{tr('Dự toán vật liệu', 'Bill of quantities')}</span>
            <div style={{ display: 'flex', gap: 2, background: 'var(--field)', borderRadius: 8, padding: 2, marginLeft: 12 }}>
              <button type="button" onClick={() => changeGroupMode('storey')} style={segStyle(groupMode === 'storey')}>{tr('Tầng', 'Storey')}</button>
              <button type="button" onClick={() => changeGroupMode('room')} style={segStyle(groupMode === 'room')}>{tr('Phòng', 'Room')}</button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => window.print()} disabled={!boq || loading} style={btnStyle(false)}>
                <Printer size={13} /> {tr('In A4 ngang', 'Print A4 landscape')}
              </button>
              <button type="button" onClick={exportXlsx} disabled={!boq || loading || exporting} style={btnStyle(false)}>
                <FileSpreadsheet size={13} /> {exporting ? tr('Đang xuất…', 'Exporting…') : tr('Xuất xlsx', 'Export xlsx')}
              </button>
              <button type="button" onClick={() => void compute()} disabled={loading} style={btnStyle(true)}>
                <RefreshCw size={13} /> {tr('Tính lại từ bản vẽ', 'Recompute from drawing')}
              </button>
            </div>
          </div>

          {!coachDismissed && (
            <div className="if-boq-no-print" style={{ margin: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 9, background: 'var(--accent-soft)', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
              {tr('Số tự sinh từ vùng tô — không phải Excel.', 'Numbers are generated from painted regions — not a spreadsheet.')}
              <button type="button" onClick={dismissCoach} style={{ marginLeft: 'auto', height: 26, padding: '0 11px', border: 0, borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {tr('Hiểu rồi', 'Got it')}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="if-boq-no-print" style={{ margin: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 9, background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          {boq && <div className="if-boq-no-print"><BoqErrorBanner errors={boq.errors} /></div>}

          {docSource === 'none' && !loading && (
            /* P5 (04/08) — khuôn EmptyState chung (mock mock-if-thu-vien-trong): hàng bảng ghost
               cho thấy bảng SẼ trông thế nào, kèm việc làm được tại chỗ (tính lại — phòng khi
               phiên khác vừa vẽ xong). "Mở bản vẽ" giữ làm nút phụ: đó là HÀNH ĐỘNG thật một
               bước, không phải lời nhắn "sang màn kia rồi quay lại" (thứ luật X2 cấm). */
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, overflow: 'auto' }}>
              <EmptyState
                ghost="rows"
                icon={<FileSpreadsheet size={18} />}
                title={tr('Chưa có khối lượng để tính', 'No quantities to compute yet')}
                desc={tr(
                  'BOQ tự sinh từ vùng tô vật liệu trong bản vẽ — không phải bảng nhập tay. Dự án này chưa có bản vẽ nào, nên bảng còn trống.',
                  'The BOQ is generated from painted material regions in the drawing — it is not a hand-typed sheet. This project has no drawing yet, so the table is empty.',
                )}
                actions={[
                  { label: tr('Tính lại từ bản vẽ', 'Recompute from drawing'), primary: true, icon: <RefreshCw size={13} />, onClick: () => void compute() },
                  { label: tr('Mở bản vẽ', 'Open drawing'), onClick: () => router.push(`/projects/${projectId}/cad`) },
                ]}
              />
            </div>
          )}

          {boq && docSource !== 'none' && (
            <BoqTable
              groups={groups}
              errors={boq.errors}
              totalAmount={liveTotal}
              projectId={projectId}
              specExtra={specExtra}
              onOverride={onOverride}
              onRevert={onRevert}
              selected={selected}
              onSelect={setSelected}
            />
          )}

          <div className="if-boq-no-print" style={{ height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', background: 'var(--panel)', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--t4)' }}>
            {errorCount > 0 && <span style={{ color: 'var(--danger)' }}>{tr(`${errorCount} vùng lỗi — bấm để xem`, `${errorCount} error region(s)`)}</span>}
            {counts.handEdited > 0 && <span style={{ color: 'var(--warning)' }}>{tr(`${counts.handEdited} ô đã rời khỏi mô hình`, `${counts.handEdited} cell(s) diverged from the model`)}</span>}
            <span style={{ marginLeft: 'auto' }}>{tr(`Lấy từ mô hình ${counts.fromModel} · Đã sửa tay ${counts.handEdited}`, `From model ${counts.fromModel} · Hand-edited ${counts.handEdited}`)}</span>
            {savedAt && <span>{tr('Đã lưu', 'Saved')} {new Date(savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>

        <aside className="if-boq-no-print" style={{ width: 236, flexShrink: 0, background: 'var(--panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t4)' }}>{tr('Ô đang chọn', 'Selected cell')}</span>
            {selected && (
              <button type="button" onClick={() => setSelected(null)} style={{ marginLeft: 'auto', width: 22, height: 22, border: 0, borderRadius: 6, background: 'transparent', color: 'var(--t4)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <X size={13} />
              </button>
            )}
          </div>
          {!selectedRow && (
            <div style={{ padding: 12, fontSize: 11, color: 'var(--t4)', lineHeight: 1.5 }}>
              {tr('Bấm 1 ô Khối lượng m² hoặc Đơn giá để xem chi tiết + sửa tay.', 'Click a Qty m² or Unit price cell to see details and edit.')}
            </div>
          )}
          {selectedRow && (
            <>
              <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{selectedRow.ten}</div>
                <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2, fontFamily: 'ui-monospace, Menlo, monospace' }}>{selected?.field === 'm2' ? tr('Khối lượng m²', 'Qty m²') : tr('Đơn giá', 'Unit price')}</div>
              </div>
              {selectedOverride && (
                <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: 'var(--field)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)' }}>{tr('Ô đã sửa tay', 'Hand-edited cell')}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 3, lineHeight: 1.5 }}>
                    {tr(
                      `Số này không còn theo mô hình. Mô hình cho ${selected?.field === 'm2' ? selectedOverride.machineValue.toFixed(2) : fmtVnd(selectedOverride.machineValue)}.`,
                      `No longer matches the model — model says ${selected?.field === 'm2' ? selectedOverride.machineValue.toFixed(2) : fmtVnd(selectedOverride.machineValue)}.`,
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => selected && onRevert(selected.matId, selected.field)}
                    style={{ marginTop: 8, height: 26, padding: '0 11px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)', color: 'var(--t1)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {tr('Lấy lại số từ mô hình', 'Reset to model value')}
                  </button>
                </div>
              )}
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 8 }}>{tr('Lấy từ', 'Sourced from')}</div>
                <div
                  onClick={() => viewOnDrawing(selectedRow.entityIds)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 9px', background: 'var(--field)', borderRadius: 8, cursor: 'pointer', fontSize: 11, color: 'var(--t1)' }}
                >
                  {tr(`${selectedRow.entityIds.length} vùng tô`, `${selectedRow.entityIds.length} region(s)`)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 6 }}>{tr('Bấm để xem trên bản vẽ', 'Click to view on the drawing')}</div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function segStyle(active: boolean): React.CSSProperties {
  return {
    height: 24, padding: '0 10px', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
    background: active ? 'var(--panel)' : 'transparent', color: active ? 'var(--t1)' : 'var(--t4)',
  };
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    height: 28, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
