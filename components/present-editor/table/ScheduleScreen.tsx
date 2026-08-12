'use client';

/**
 * components/present-editor/table/ScheduleScreen.tsx — MẶT TIỀN `schedule` (nhãn "Bảng thống kê")
 * của `TableDocEngine` (Đợt 4, `docs/phieu-giao/editor-bang-bieu-mau.md`). Cùng kiến trúc màn BOQ
 * (`components/present-editor/boq/BoqScreen.tsx`, KHÔNG đụng file đó):
 *
 * Luồng: `getProjectDoc` (Doc 2D SỐNG, không snapshot — B0 đã có, tái dùng nguyên) → gieo dòng
 * (`buildScheduleRowSeeds`) → merge với trạng thái đã lưu (`resyncTableRows`, giữ ô tay) → áp
 * override (`applyTableOverrides`) → nhóm (`groupTableRows`) → `TableDocGrid`.
 *
 * "Cập nhật từ bản vẽ" là hành động NGƯỜI DÙNG chủ động bấm (không tự resync mỗi lần Doc đổi) —
 * tránh cảm giác "máy tự âm thầm động vào dữ liệu" mỗi khi mở màn; LẦN ĐẦU (chưa có gì lưu) thì
 * tự gieo ngay vì không có gì để mất.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, FileSpreadsheet, Printer, ListTree } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { useCadStore } from '@/lib/cad/store';
import { getProjectDoc, type ProjectDocSource } from '@/lib/present-editor/project-doc';
import {
  applyTableOverrides, countTableOverrideStatus, groupTableRows, resyncTableRows,
  revertTableOverride, setTableOverride, buildTableRows,
  type TableOverrideMap, type TableRow,
} from '@/lib/present-editor/table-doc-engine';
import { buildScheduleRowSeeds, SCHEDULE_COLUMNS } from '@/lib/present-editor/schedule-table';
import { loadTableDocState, saveTableDocState } from '@/lib/present-editor/table-doc-persist';
import { tableDocToXlsxBuffer } from '@/lib/present-editor/table-doc-xlsx';
import type { Doc } from '@/lib/cad/model';
import { emptyDoc } from '@/lib/cad/model';
import { TableDocGrid } from './TableDocGrid';
import { EmptyState } from '@/components/ui/EmptyState';

const DOC_TYPE = 'schedule';

export function ScheduleScreen({ projectId, userId }: { projectId: string; userId: string }) {
  const tr = useT();
  const lang = useLang();
  const router = useRouter();

  const [doc, setDoc] = useState<Doc>(emptyDoc());
  const [docSource, setDocSource] = useState<ProjectDocSource | null>(null);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [overrides, setOverrides] = useState<TableOverrideMap>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const bootedRef = useRef(false);
  // Gương ref cho rows/overrides (cùng pattern `sheetsRef`/`activeIdRef` ở PresentSheets.tsx) —
  // `compute` là 1 closure ỔN ĐỊNH (deps chỉ [projectId, userId]) nên KHÔNG được đọc thẳng state
  // `rows`/`overrides` bên trong nó (sẽ dính giá trị CŨ từ lần tạo closure — bug closure cũ kinh
  // điển của React). Đọc qua ref luôn lấy đúng giá trị MỚI NHẤT tại thời điểm gọi.
  const rowsRef = useRef<TableRow[]>([]);
  const overridesRef = useRef<TableOverrideMap>({});
  const setRowsBoth = (next: TableRow[]) => { rowsRef.current = next; setRows(next); };
  const setOverridesBoth = (next: TableOverrideMap) => { overridesRef.current = next; setOverrides(next); };

  const compute = useCallback(async (opts?: { forceResync?: boolean }) => {
    if (!projectId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [{ doc: nextDoc, source }, persisted] = await Promise.all([
        getProjectDoc(userId, projectId),
        bootedRef.current ? Promise.resolve(null) : loadTableDocState(userId, projectId, DOC_TYPE),
      ]);
      setDoc(nextDoc);
      setDocSource(source);

      const seeds = buildScheduleRowSeeds(nextDoc);
      const prevRows = persisted ? persisted.rows : rowsRef.current;
      const prevOverrides = persisted ? persisted.overrides : overridesRef.current;
      if (persisted) setOverridesBoth(persisted.overrides);

      if (!bootedRef.current && prevRows.length === 0) {
        // Lần đầu tiên, chưa có gì lưu — gieo ngay, không có ô tay nào để mất.
        const built = buildTableRows(seeds);
        setRowsBoth(built);
        void saveTableDocState(userId, projectId, DOC_TYPE, { rows: built, overrides: prevOverrides });
        setSyncMsg(null);
      } else if (opts?.forceResync) {
        const r = resyncTableRows(prevRows, seeds);
        setRowsBoth(r.rows);
        void saveTableDocState(userId, projectId, DOC_TYPE, { rows: r.rows, overrides: prevOverrides });
        setSyncMsg(
          tr(
            `Đã cập nhật — ${r.added} dòng mới, ${r.matched} dòng khớp lại${r.orphanedNow ? `, ${r.orphanedNow} dòng không còn thấy trên bản vẽ` : ''}.`,
            `Updated — ${r.added} new, ${r.matched} matched${r.orphanedNow ? `, ${r.orphanedNow} no longer on the drawing` : ''}.`,
          ),
        );
      } else if (persisted) {
        setRowsBoth(persisted.rows);
      }
      bootedRef.current = true;
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId]);

  useEffect(() => { void compute(); }, [compute]);

  const persistOverrides = useCallback((next: TableOverrideMap) => {
    setOverridesBoth(next);
    void saveTableDocState(userId, projectId, DOC_TYPE, { rows: rowsRef.current, overrides: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, projectId]);

  const onEditCell = useCallback((rowId: string, colKey: string, raw: string) => {
    const col = SCHEDULE_COLUMNS.find((c) => c.key === colKey);
    const value = col?.kind === 'number' ? (raw.trim() === '' ? null : Number(raw.replace(',', '.'))) : (raw.trim() === '' ? null : raw);
    if (col?.kind === 'number' && value !== null && !Number.isFinite(value as number)) return; // gõ chữ vào ô số — bỏ qua, không lưu rác
    persistOverrides(setTableOverride(overrides, rowId, colKey, value, Date.now()));
  }, [overrides, persistOverrides]);

  const onRevertCell = useCallback((rowId: string, colKey: string) => {
    persistOverrides(revertTableOverride(overrides, rowId, colKey));
  }, [overrides, persistOverrides]);

  const displayRows = applyTableOverrides(rows, overrides);
  const groups = groupTableRows(displayRows, SCHEDULE_COLUMNS);
  const counts = countTableOverrideStatus(displayRows);

  const viewOnDrawing = (entityId: string) => {
    useCadStore.getState().select([entityId]);
    router.push(`/projects/${projectId}/cad`);
  };

  const exportXlsx = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const buf = await tableDocToXlsxBuffer(tr('Bảng thống kê', 'Schedule'), SCHEDULE_COLUMNS, displayRows, lang === 'en' ? 'en' : 'vi');
      const blob = new Blob([buf as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bang-thong-ke-${projectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrorMsg(tr('Không dựng được file .xlsx.', 'Could not build the .xlsx file.') + ` (${e instanceof Error ? e.message : String(e)})`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="if-schedule-print-root" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body * { visibility: hidden; }
          .if-schedule-print-root, .if-schedule-print-root * { visibility: visible; }
          .if-schedule-print-root { position: absolute; inset: 0; height: auto !important; background: #fff !important; }
          .if-schedule-no-print { display: none !important; }
          .if-schedule-print-root table { font-size: 11px; }
        }
      `}</style>
      <div className="if-schedule-no-print" style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
        <ListTree size={14} style={{ color: 'var(--t4)' }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{tr('Bảng thống kê', 'Schedule')}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => window.print()} disabled={groups.length === 0 || loading} style={btnStyle(false)}>
            <Printer size={13} /> {tr('In A4 ngang', 'Print A4 landscape')}
          </button>
          <button type="button" onClick={exportXlsx} disabled={groups.length === 0 || loading || exporting} style={btnStyle(false)}>
            <FileSpreadsheet size={13} /> {exporting ? tr('Đang xuất…', 'Exporting…') : tr('Xuất xlsx', 'Export xlsx')}
          </button>
          <button type="button" onClick={() => void compute({ forceResync: true })} disabled={loading} style={btnStyle(true)}>
            <RefreshCw size={13} /> {tr('Cập nhật từ bản vẽ', 'Update from drawing')}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="if-schedule-no-print" style={{ margin: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 9, background: 'var(--accent-soft)', borderRadius: 'var(--r-2)', padding: '8px 12px', fontSize: 13 }}>
          {syncMsg}
        </div>
      )}
      {errorMsg && (
        <div className="if-schedule-no-print" style={{ margin: '10px 14px 0', background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))', borderRadius: 'var(--r-2)', padding: '8px 12px', fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      {docSource === 'none' && !loading && (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, overflow: 'auto' }}>
          <EmptyState
            ghost="rows"
            icon={<ListTree size={18} />}
            title={tr('Chưa có gì để thống kê', 'Nothing to tally yet')}
            desc={tr(
              'Bảng thống kê đếm CỬA và PHÒNG từ bản vẽ — dự án này chưa có bản vẽ nào, nên bảng còn trống.',
              'The schedule counts DOORS and ROOMS from the drawing — this project has no drawing yet, so the table is empty.',
            )}
            actions={[
              { label: tr('Cập nhật từ bản vẽ', 'Update from drawing'), primary: true, icon: <RefreshCw size={13} />, onClick: () => void compute({ forceResync: true }) },
              { label: tr('Mở bản vẽ', 'Open drawing'), onClick: () => router.push(`/projects/${projectId}/cad`) },
            ]}
          />
        </div>
      )}

      {docSource !== 'none' && groups.length === 0 && !loading && (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, overflow: 'auto' }}>
          <EmptyState
            ghost="rows"
            icon={<ListTree size={18} />}
            title={tr('Chưa có cửa hay phòng nào trong bản vẽ', 'No doors or rooms in the drawing yet')}
            desc={tr(
              'Bảng thống kê v1 đếm cửa đi (gán loại "Cửa đi") và phòng (đã khoanh vùng). Vẽ/gán xong quay lại bấm "Cập nhật từ bản vẽ".',
              'The v1 schedule counts doors (tagged "Door") and rooms (already outlined). Draw/tag them, then come back and click "Update from drawing".',
            )}
            actions={[{ label: tr('Cập nhật từ bản vẽ', 'Update from drawing'), primary: true, icon: <RefreshCw size={13} />, onClick: () => void compute({ forceResync: true }) }]}
          />
        </div>
      )}

      {groups.length > 0 && (
        <TableDocGrid columns={SCHEDULE_COLUMNS} groups={groups} onEditCell={onEditCell} onRevertCell={onRevertCell} onViewOnDrawing={viewOnDrawing} />
      )}

      <div className="if-schedule-no-print" style={{ height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', background: 'var(--panel)', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--t4)' }}>
        {counts.orphaned > 0 && <span style={{ color: 'var(--warning)' }}>{tr(`${counts.orphaned} dòng không còn trên bản vẽ`, `${counts.orphaned} row(s) no longer on the drawing`)}</span>}
        <span style={{ marginLeft: 'auto' }}>{tr(`Lấy từ mô hình ${counts.fromModel} · Đã sửa tay ${counts.handEdited}`, `From model ${counts.fromModel} · Hand-edited ${counts.handEdited}`)}</span>
      </div>
    </div>
  );
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    height: 28, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 'var(--r-2)', fontSize: 11.5, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
