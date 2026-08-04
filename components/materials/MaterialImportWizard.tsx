'use client';

/**
 * components/materials/MaterialImportWizard.tsx — VIỆC 4 (`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`):
 * cửa nhập Excel/CSV cho kho vật liệu. Nhận diện định dạng qua `lib/gateway/detect.ts` (Gateway)
 * — KHÔNG viết cửa nhận diện thứ hai. Luồng: chọn file → ghép cột (đoán + NHỚ theo tiêu đề, xem
 * `column-mapping.ts`) → xem trước 20 dòng (báo lỗi dòng hỏng) → (tuỳ chọn) kéo thư mục ảnh ghép
 * theo SKU → nhập thật (gọi lặp `POST /api/specs` có sẵn, không route bulk riêng).
 */
import { useEffect, useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, FolderInput } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { detectFormat } from '@/lib/gateway/detect';
import { routeFormat } from '@/lib/gateway/route';
import { parseSpreadsheetFile, type ParsedSheet } from '@/lib/materials/warehouse/xlsx-parse';
import {
  guessMapping, loadSavedMapping, saveMapping, MATERIAL_FIELDS, MATERIAL_FIELD_LABEL,
  type ColumnMapping, type MaterialField,
} from '@/lib/materials/warehouse/column-mapping';
import { buildImportRows, runImport, uploadMatchedImages, type ImportRowResult } from '@/lib/materials/warehouse/apply-import';
import { matchImagesBySku } from '@/lib/materials/warehouse/image-match';

type Step = 'pick' | 'map' | 'importing' | 'done';

const PREVIEW_COUNT = 20;

export function MaterialImportWizard({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const tr = useT();
  const [step, setStep] = useState<Step>('pick');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; phase: 'images' | 'rows' } | null>(null);
  const [result, setResult] = useState<{ ok: number; failed: { rowIndex: number; name: string; error: string }[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // `webkitdirectory` không có trong kiểu JSX chuẩn — gắn attribute tay, tránh ép kiểu `any`.
  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const openFile = async (file: File) => {
    setFileError(null);
    // Gateway quyết định — KHÔNG tự đoán đuôi ở đây (đúng chỉ đạo "nối vào route.ts").
    const format = detectFormat({ name: file.name });
    const action = routeFormat(format, 'cad'); // stage không ảnh hưởng vì đây không phải ảnh
    if (action.kind !== 'library-bulk-ingest') {
      setFileError(tr('Chỉ nhận file .xlsx hoặc .csv.', 'Only .xlsx or .csv files are accepted.'));
      return;
    }
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.rows.length === 0) {
        setFileError(tr('File không có dòng dữ liệu nào (chỉ có tiêu đề).', 'File has no data rows (header only).'));
        return;
      }
      setSheet(parsed);
      setMapping(loadSavedMapping(parsed.headers) ?? guessMapping(parsed.headers));
      setStep('map');
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e));
    }
  };

  const rows: ImportRowResult[] = sheet && mapping ? buildImportRows(sheet, mapping) : [];
  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.length - validCount;

  const setField = (field: MaterialField, colIndex: number | null) => {
    setMapping((prev) => (prev ? { ...prev, [field]: colIndex } : prev));
  };

  const commitImport = async () => {
    if (!sheet || !mapping) return;
    saveMapping(sheet.headers, mapping);
    setStep('importing');
    let imageAssetIdBySku: Map<string, string> | undefined;
    if (imageFiles.length > 0) {
      const skus = rows.filter((r) => r.payload?.sku).map((r) => r.payload!.sku!);
      const bySku = matchImagesBySku(imageFiles, skus);
      if (bySku.size > 0) {
        setProgress({ done: 0, total: bySku.size, phase: 'images' });
        imageAssetIdBySku = await uploadMatchedImages(bySku, (done, total) => setProgress({ done, total, phase: 'images' }));
      }
    }
    setProgress({ done: 0, total: validCount, phase: 'rows' });
    const outcome = await runImport(rows, {
      imageAssetIdBySku,
      onProgress: (done, total) => setProgress({ done, total, phase: 'rows' }),
    });
    setResult(outcome);
    setStep('done');
  };

  return (
    <div role="dialog" aria-modal style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.4)' }}>
      <div style={{ width: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <FileSpreadsheet size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Nhập vật liệu từ Excel/CSV', 'Import materials from Excel/CSV')}
          </span>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--t4)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          {step === 'pick' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) void openFile(e.dataTransfer.files[0]);
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 20px',
                borderRadius: 12, border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                background: dragOver ? 'var(--accent-soft, var(--field))' : 'var(--field)',
              }}
            >
              <Upload size={26} strokeWidth={1.5} style={{ color: 'var(--t4)' }} />
              <b style={{ fontSize: 13, color: 'var(--t1)' }}>{tr('Thả file .xlsx hoặc .csv vào đây', 'Drop an .xlsx or .csv file here')}</b>
              <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{tr('Bảng giá từ nhà cung cấp — ghép cột ở bước sau', "Supplier price list — you'll map columns next")}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: 6, height: 30, padding: '0 14px', borderRadius: 8, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                {tr('Chọn file từ máy', 'Choose a file')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) void openFile(e.target.files[0]); e.target.value = ''; }}
              />
              {fileError && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 12 }}>
                  <AlertTriangle size={13} /> {fileError}
                </div>
              )}
            </div>
          )}

          {step === 'map' && sheet && mapping && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {MATERIAL_FIELDS.map((field) => (
                  <div key={field}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>
                      {tr(MATERIAL_FIELD_LABEL[field].vi, MATERIAL_FIELD_LABEL[field].en)}
                      {MATERIAL_FIELD_LABEL[field].required && ' *'}
                    </label>
                    <select
                      value={mapping[field] ?? ''}
                      onChange={(e) => setField(field, e.target.value === '' ? null : Number(e.target.value))}
                      style={{ width: '100%', height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, padding: '0 8px' }}
                    >
                      <option value="">{tr('— không dùng —', '— unused —')}</option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `(cột ${i + 1})`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
                  {tr(`Xem trước ${Math.min(PREVIEW_COUNT, rows.length)}/${rows.length} dòng`, `Preview ${Math.min(PREVIEW_COUNT, rows.length)}/${rows.length} rows`)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
                  {tr(`${validCount} hợp lệ`, `${validCount} valid`)}
                </span>
                {errorCount > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={11} /> {tr(`${errorCount} dòng lỗi`, `${errorCount} error row(s)`)}
                  </span>
                )}
              </div>

              <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'var(--field)' }}>
                      <th style={previewTh}>#</th>
                      <th style={previewTh}>{tr('Tên', 'Name')}</th>
                      <th style={previewTh}>{tr('Mã', 'SKU')}</th>
                      <th style={previewTh}>{tr('Giá', 'Price')}</th>
                      <th style={previewTh}>{tr('Ghi chú', 'Note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, PREVIEW_COUNT).map((r) => (
                      <tr key={r.rowIndex} style={{ background: r.error ? 'color-mix(in srgb, var(--danger) 10%, transparent)' : undefined }}>
                        <td style={previewTd}>{r.rowIndex + 1}</td>
                        <td style={previewTd}>{r.payload?.name ?? '—'}</td>
                        <td style={{ ...previewTd, fontFamily: 'ui-monospace, Menlo, monospace' }}>{r.payload?.sku ?? '—'}</td>
                        <td style={previewTd}>{r.payload?.priceVnd != null ? r.payload.priceVnd.toLocaleString('vi-VN') : '—'}</td>
                        <td style={{ ...previewTd, color: r.error ? 'var(--danger)' : 'var(--t4)' }}>{r.error ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FolderInput size={13} /> {tr('Ảnh (tuỳ chọn) — kéo cả thư mục, ghép theo mã SKU trùng tên file', 'Images (optional) — drop a whole folder, matched by filename == SKU')}
                </div>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  style={{ height: 28, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}
                >
                  {imageFiles.length > 0 ? tr(`${imageFiles.length} file trong thư mục`, `${imageFiles.length} files in folder`) : tr('Chọn thư mục ảnh', 'Choose image folder')}
                </button>
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                />
              </div>
            </>
          )}

          {(step === 'importing' || step === 'done') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              {step === 'importing' && (
                <>
                  <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, color: 'var(--t2)' }}>
                    {progress?.phase === 'images'
                      ? tr(`Đang tải ảnh ${progress.done}/${progress.total}…`, `Uploading images ${progress.done}/${progress.total}…`)
                      : tr(`Đang nhập ${progress?.done ?? 0}/${progress?.total ?? validCount}…`, `Importing ${progress?.done ?? 0}/${progress?.total ?? validCount}…`)}
                  </span>
                </>
              )}
              {step === 'done' && result && (
                <>
                  <CheckCircle2 size={22} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                    {tr(`Đã thêm ${result.ok} vật liệu`, `Added ${result.ok} material(s)`)}
                  </span>
                  {result.failed.length > 0 && (
                    <div style={{ width: '100%', maxHeight: 180, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>
                        {tr(`${result.failed.length} dòng lỗi:`, `${result.failed.length} failed row(s):`)}
                      </div>
                      {result.failed.map((f, i) => (
                        <div key={i} style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 3 }}>
                          {tr('Dòng', 'Row')} {f.rowIndex + 1} {f.name && `(${f.name})`} — {f.error}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 14, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {step === 'map' && (
            <button
              type="button"
              onClick={() => void commitImport()}
              disabled={validCount === 0}
              style={{ height: 32, padding: '0 16px', borderRadius: 8, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: validCount === 0 ? 0.5 : 1 }}
            >
              {tr(`Nhập ${validCount} dòng`, `Import ${validCount} row(s)`)}
            </button>
          )}
          {step === 'done' && (
            <button
              type="button"
              onClick={onImported}
              style={{ height: 32, padding: '0 16px', borderRadius: 8, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              {tr('Xong', 'Done')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const previewTh: React.CSSProperties = { textAlign: 'left', padding: '5px 8px', fontSize: 10.5, fontWeight: 600, color: 'var(--t4)', borderBottom: '1px solid var(--border)' };
const previewTd: React.CSSProperties = { padding: '4px 8px', color: 'var(--t2)', borderBottom: '1px solid var(--border)' };
