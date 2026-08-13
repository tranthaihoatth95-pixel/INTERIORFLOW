'use client';

/**
 * components/colors/ColorImportWizard.tsx — VIỆC 1a + 1b: cửa NẠP bảng màu vào IF.
 *
 * Ba đường vào, MỘT bộ ghép cột + MỘT bộ kiểm dòng (`lib/colors/build.ts`) — không ba luật khác
 * nhau về "hex thế nào là hợp lệ":
 *   ① tệp .csv/.xlsx (kéo thả hoặc chọn)  ② dán thẳng từ clipboard  ③ pull từ Larkbase
 *
 * Với ③: **Hoà không dùng được UI Larkbase** ⇒ nhập mã bảng xong, IF tự đọc ra TÊN CỘT THẬT rồi
 * cho ghép cột ngay tại đây. Không có bước nào bảo người dùng "mở Lark lên xem/sửa".
 *
 * Lưu vào đâu do người dùng chọn: **studio** (dùng chung mọi dự án) hoặc **dự án** (tệp
 * `colors.json` trong thư mục dự án). Chưa mở dự án nào thì nút "dự án" `disabled` KÈM LÝ DO
 * (luật §9 — cấm nút giả, cấm giấu ô trống).
 */

import { useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, ClipboardPaste, Cloud, Download, Loader2, X, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import {
  COLOR_FIELDS, COLOR_FIELD_LABEL, EMPTY_COLOR_MAPPING, guessColorMapping, buildColorSource,
  type ColorColumnMapping, type ColorField, type ParsedGrid, type ColorRowError,
} from '@/lib/colors/build';
import { parseColorFile, parseDelimitedText, COLOR_CSV_TEMPLATE } from '@/lib/colors/user-csv';
import { pullLarkColorSource } from '@/lib/colors/larkbase';
import { saveStudioColorSource, saveProjectColorSource } from '@/lib/colors/store';
import type { ColorSource, ColorSourceOrigin } from '@/lib/colors/types';
import { ColorAccuracyNotice } from './ColorAccuracyNotice';

type Tab = 'file' | 'paste' | 'lark';

export function ColorImportWizard({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const tr = useT();
  const projectId = useFlowStore((s) => s.currentProjectId);
  const projectName = useFlowStore((s) => s.flowName) || 'Không tên';

  const [tab, setTab] = useState<Tab>('file');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [grid, setGrid] = useState<ParsedGrid | null>(null);
  const [mapping, setMapping] = useState<ColorColumnMapping>(EMPTY_COLOR_MAPPING);
  const [origin, setOrigin] = useState<ColorSourceOrigin>('user-csv');
  const [sourceId, setSourceId] = useState<string>('');
  const [name, setName] = useState('');
  const [licenseNote, setLicenseNote] = useState('');

  const [pasteText, setPasteText] = useState('');
  const [tableId, setTableId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /** Dựng thử `ColorSource` theo mapping hiện tại — xem trước lỗi TRƯỚC khi lưu. */
  const preview: { source: ColorSource; errors: ColorRowError[] } | null = useMemo(() => {
    if (!grid) return null;
    return buildColorSource({
      ...grid, mapping, id: sourceId || `col_${Date.now().toString(36)}`,
      name: name.trim() || tr('Bảng màu chưa đặt tên', 'Untitled colour library'),
      origin, scope: 'studio', licenseNote: licenseNote.trim() || undefined,
    });
  }, [grid, mapping, sourceId, name, origin, licenseNote, tr]);

  const loadGrid = (g: ParsedGrid, o: ColorSourceOrigin, suggestedName: string, id?: string) => {
    setGrid(g);
    setMapping(guessColorMapping(g.headers));
    setOrigin(o);
    setSourceId(id ?? `col_${Date.now().toString(36)}`);
    if (!name.trim()) setName(suggestedName);
    setError(null);
  };

  const onFile = async (f: File) => {
    setBusy(true); setError(null);
    try {
      loadGrid(await parseColorFile(f), 'user-csv', f.name.replace(/\.[^.]+$/, ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const onPaste = () => {
    setError(null);
    const g = parseDelimitedText(pasteText);
    if (!g.headers.length || !g.rows.length) {
      setError(tr('Chưa đọc được bảng — cần dòng tiêu đề và ít nhất 1 dòng dữ liệu.',
        'Nothing to read — need a header row and at least one data row.'));
      return;
    }
    loadGrid(g, 'user-paste', tr('Bảng dán tay', 'Pasted list'));
  };

  const onLarkPreview = async () => {
    setBusy(true); setError(null);
    try {
      const r = await pullLarkColorSource({ tableId: tableId.trim() });
      if (r.mode !== 'preview') throw new Error('Máy chủ trả sai chế độ.');
      loadGrid({ headers: r.fieldNames, rows: r.sampleRows }, 'larkbase', `Larkbase ${tableId.trim()}`, `lark_${tableId.trim()}`);
      setMapping(r.guessed);
      setLicenseNote(tr('Nạp từ Larkbase của studio (pull-only).', 'Pulled from the studio Larkbase (pull-only).'));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const save = async (scope: 'studio' | 'project') => {
    if (!grid || !preview) return;
    setBusy(true); setError(null);
    try {
      // Larkbase: dựng lại từ TOÀN BỘ bản ghi ở server (bản xem trước chỉ có 20 dòng đầu — lưu
      // thẳng nó là mất phần còn lại, đúng kiểu hỏng im lặng phải tránh).
      let source = preview.source;
      if (origin === 'larkbase') {
        const r = await pullLarkColorSource({ tableId: tableId.trim(), mapping, sourceName: name.trim() });
        if (r.mode !== 'pull') throw new Error('Máy chủ trả sai chế độ.');
        source = { ...r.source, licenseNote: licenseNote.trim() || r.source.licenseNote };
      }
      if (!source.colors.length) {
        throw new Error(tr('Không có màu hợp lệ nào để lưu — kiểm lại cột "Mã hex".',
          'No valid colours to save — check the Hex column mapping.'));
      }
      if (scope === 'studio') {
        if (!saveStudioColorSource({ ...source, scope: 'studio' })) {
          throw new Error(tr('Không ghi được vào bộ nhớ trình duyệt (có thể đã đầy).',
            'Could not write to browser storage (it may be full).'));
        }
      } else {
        if (!projectId) throw new Error(tr('Chưa mở dự án nào.', 'No project is open.'));
        const res = await saveProjectColorSource(projectId, projectName, { ...source, scope: 'project', projectId });
        if (!res.ok) {
          throw new Error(tr(`Không ghi được vào thư mục dự án (${res.reason}).`,
            `Could not write to the project folder (${res.reason}).`));
        }
      }
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const downloadTemplate = () => {
    // BOM ﻿ bắt buộc — thiếu là Excel mở ra mất sạch dấu tiếng Việt.
    const blob = new Blob([`﻿${COLOR_CSV_TEMPLATE}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mau-bang-mau-interiorflow.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <div style={panel}>
        <div style={head}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.5 }}>
            {tr('Nạp bảng màu', 'Import a colour library')}
          </span>
          <button type="button" onClick={onClose} aria-label={tr('Đóng', 'Close')} style={{ marginLeft: 'auto', ...ghostBtn }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              ['file', <FileSpreadsheet key="i" size={13} />, tr('Từ tệp', 'From file')],
              ['paste', <ClipboardPaste key="i" size={13} />, tr('Dán tay', 'Paste')],
              ['lark', <Cloud key="i" size={13} />, tr('Từ Larkbase', 'From Larkbase')],
            ] as const).map(([k, icon, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)} style={btn(tab === k)}>
                {icon} {label}
              </button>
            ))}
            <button type="button" onClick={downloadTemplate} style={{ ...btn(false), marginLeft: 'auto' }}>
              <Download size={13} /> {tr('Tải mẫu CSV', 'Download CSV template')}
            </button>
          </div>

          {tab === 'file' && (
            <div style={box}>
              <p style={hint}>
                {tr('Cột cần có: name · code · hex · brand · note. Nhận .csv và .xlsx.',
                  'Columns: name · code · hex · brand · note. Accepts .csv and .xlsx.')}
              </p>
              <input
                ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} style={btn(true)}>
                <FileSpreadsheet size={13} /> {tr('Chọn tệp…', 'Choose a file…')}
              </button>
            </div>
          )}

          {tab === 'paste' && (
            <div style={box}>
              <p style={hint}>
                {tr('Dán thẳng từ Excel/Google Sheets. Dòng đầu là tiêu đề cột.',
                  'Paste straight from Excel/Google Sheets. First row is the header.')}
              </p>
              <textarea
                value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6}
                placeholder={'name\tcode\thex\nTrắng ngà\tS-01\t#f4f1ea'}
                /* `height: 'auto'` PHẢI ghi đè `field.height = 30` — bắt được lúc verify browser:
                   `rows={6}` bị chiều cao cố định của `field` nuốt, ô dán chỉ hiện 2 dòng. */
                style={{ ...field, height: 'auto', minHeight: 108, padding: '8px', fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
              />
              <button type="button" onClick={onPaste} disabled={!pasteText.trim()} style={btn(true, !pasteText.trim())}>
                {tr('Đọc bảng đã dán', 'Read pasted table')}
              </button>
            </div>
          )}

          {tab === 'lark' && (
            <div style={box}>
              <p style={hint}>
                {tr('Dán mã bảng (table_id) của Larkbase. IF tự đọc tên cột — không cần mở Lark. Chỉ ĐỌC, IF không bao giờ ghi ngược.',
                  'Paste the Larkbase table_id. IF reads the column names for you — no need to open Lark. Read-only; IF never writes back.')}
              </p>
              <input
                value={tableId} onChange={(e) => setTableId(e.target.value)} placeholder="tblXXXXXXXX"
                style={{ ...field, fontFamily: 'ui-monospace, monospace' }}
              />
              <button type="button" onClick={() => void onLarkPreview()} disabled={!tableId.trim() || busy} style={btn(true, !tableId.trim() || busy)}>
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Cloud size={13} />} {tr('Đọc bảng', 'Read table')}
              </button>
            </div>
          )}

          {error && (
            <div style={errBox}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12.5, lineHeight: 1.6 }}>{error}</span>
            </div>
          )}

          {grid && preview && (
            <>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div>
                <div style={label}>{tr('Ghép cột', 'Map columns')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {COLOR_FIELDS.map((f: ColorField) => (
                    <label key={f} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--t3)' }}>
                        {tr(COLOR_FIELD_LABEL[f].vi, COLOR_FIELD_LABEL[f].en)}
                        {COLOR_FIELD_LABEL[f].required ? ' *' : ''}
                      </span>
                      <select
                        value={mapping[f] ?? ''}
                        onChange={(e) => setMapping({ ...mapping, [f]: e.target.value === '' ? null : Number(e.target.value) })}
                        style={field}
                      >
                        <option value="">{tr('— không dùng —', '— unused —')}</option>
                        {grid.headers.map((h, i) => <option key={i} value={i}>{h || `#${i + 1}`}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={label}>
                  {tr(`Xem trước — ${preview.source.colors.length} màu hợp lệ, ${preview.errors.length} dòng lỗi`,
                    `Preview — ${preview.source.colors.length} valid colours, ${preview.errors.length} bad rows`)}
                  {origin === 'larkbase' ? tr(' (mẫu 20 dòng đầu)', ' (first 20 rows only)') : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {preview.source.colors.slice(0, 24).map((c, i) => (
                    <div key={i} title={`${c.code} · ${c.name} · ${c.hex}`} style={swatch(c.hex)} />
                  ))}
                </div>
                {preview.errors.length > 0 && (
                  <ul style={{ margin: '8px 0 0', padding: '0 0 0 18px', color: 'var(--t4)' }}>
                    {preview.errors.slice(0, 6).map((e, i) => (
                      <li key={i} style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                        {tr(`Dòng ${e.row}: ${e.reason}`, `Row ${e.row}: ${e.reason}`)}
                      </li>
                    ))}
                    {preview.errors.length > 6 && (
                      <li style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                        {tr(`…và ${preview.errors.length - 6} dòng nữa`, `…and ${preview.errors.length - 6} more`)}
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--t3)' }}>{tr('Tên bảng', 'Library name')}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--t3)' }}>
                    {tr('Nguồn gốc / quyền dùng (studio tự khai)', 'Provenance / rights (declared by you)')}
                  </span>
                  <input
                    value={licenseNote} onChange={(e) => setLicenseNote(e.target.value)}
                    placeholder={tr('vd: bảng nội bộ tự đo', 'e.g. measured in-house')} style={field}
                  />
                </label>
              </div>

              <ColorAccuracyNotice />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button" onClick={() => void save('project')} disabled={busy || !projectId}
                  title={projectId ? undefined : tr('Chưa mở dự án nào — mở một dự án rồi quay lại, hoặc lưu theo studio.',
                    'No project open — open one first, or save to the studio instead.')}
                  style={btn(false, busy || !projectId)}
                >
                  {tr('Lưu theo dự án', 'Save to project')}
                </button>
                <button type="button" onClick={() => void save('studio')} disabled={busy} style={btn(true, busy)}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : null} {tr('Lưu theo studio', 'Save to studio')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── style (token, không hardcode hex — tự đúng cả 2 theme; mọi cỡ chữ khai line-height ≥1.5) ── */

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center',
  background: 'rgba(0,0,0,.45)', padding: 20,
};
const panel: React.CSSProperties = {
  width: 'min(720px, 100%)', maxHeight: '86vh', display: 'flex', flexDirection: 'column',
  borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--panel)', overflow: 'hidden',
};
const head: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px',
  borderBottom: '1px solid var(--border)', flexShrink: 0,
};
const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--field)',
};
const field: React.CSSProperties = {
  height: 30, padding: '0 8px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--panel)', color: 'var(--t1)', fontSize: 12.5, lineHeight: 1.6, outline: 'none',
};
const hint: React.CSSProperties = { margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' };
const label: React.CSSProperties = { fontSize: 12, lineHeight: 1.5, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 };
const errBox: React.CSSProperties = {
  display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-sm)',
  background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))', color: 'var(--t1)',
};
const ghostBtn: React.CSSProperties = {
  height: 26, width: 26, display: 'grid', placeItems: 'center', cursor: 'pointer',
  border: '1px solid var(--border)', borderRadius: 10, background: 'var(--field)', color: 'var(--t3)',
};

function btn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    height: 30, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 10,
    fontSize: 12, lineHeight: 1.5, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
function swatch(hex: string): React.CSSProperties {
  return { width: 34, height: 34, borderRadius: 10, background: hex, border: '1px solid var(--border)' };
}
