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
  guessMapping, loadSavedMapping, saveMapping, unmappedColumns, MATERIAL_FIELDS, MATERIAL_FIELD_LABEL,
  type ColumnMapping, type MaterialField,
} from '@/lib/materials/warehouse/column-mapping';
import { buildImportRows, guessImportKind, runImport, uploadMatchedImages, type ImportRowResult, type RunImportOutcome } from '@/lib/materials/warehouse/apply-import';
import { IMPORT_KIND_LABEL } from '@/lib/materials/warehouse/dto';
import { matchImagesForRows, imageFileToXlsxImage } from '@/lib/materials/warehouse/image-match';
import { buildFfeSheet, ffeSheetToXlsxBuffer, type FfeSheetImage } from '@/lib/ffe/sheet';
import { SPEC_KINDS } from '@/lib/server/specs';

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
  /** Số dòng CÓ khai tên ảnh mà không tìm thấy file trong thư mục đã chọn — phải nói ra ở bước
   * xong, không được im lặng (kiểm phản biện vòng 2, 06/08). */
  const [imageMissCount, setImageMissCount] = useState(0);
  /**
   * Loại bản ghi cho cả lô (G-M3-07). Trước đây `runImport` ép cứng `'material'` ⇒ nhập bảng ghế
   * bàn vào kho thì thành "vật liệu". Nay: máy ĐOÁN (`guessImportKind`, đặt lúc mở file), người
   * nhập ĐỔI được. `kindGuessed` giữ giá trị máy đoán để câu giải thích dưới ô chọn nói đúng sự
   * thật ngay cả sau khi người dùng đổi tay.
   */
  const [kind, setKind] = useState<string>('material');
  const [kindGuessed, setKindGuessed] = useState<string>('material');
  const [progress, setProgress] = useState<{ done: number; total: number; phase: 'images' | 'rows' } | null>(null);
  /** Giữ TRỌN `RunImportOutcome` — kể cả `table` (`FfeTable`). Trước 06/08 kiểu state chỉ khai
   * `{ok, failed}` nên `table` bị vứt ngay tại đây và không nơi nào trong app dùng tới nó. */
  const [result, setResult] = useState<RunImportOutcome | null>(null);
  /** File ảnh đã ghép cho từng dòng — giữ lại để XUẤT hồ sơ FF&E có ảnh mà không phải tải lại từ
   * server (ảnh đang nằm sẵn trong bộ nhớ trình duyệt). Khoá = `FfeItem.id`. */
  const [ffeImages, setFfeImages] = useState<Map<string, File>>(new Map());
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

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
      const nextMapping = loadSavedMapping(parsed.headers) ?? guessMapping(parsed.headers);
      const guessed = guessImportKind(parsed, nextMapping);
      setSheet(parsed);
      setMapping(nextMapping);
      setKindGuessed(guessed);
      setKind(guessed);
      setStep('map');
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e));
    }
  };

  const rows: ImportRowResult[] = sheet && mapping ? buildImportRows(sheet, mapping) : [];
  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.length - validCount;
  const warnCount = rows.filter((r) => !r.error && r.warnings.length > 0).length;
  const droppedColumns = sheet && mapping ? unmappedColumns(sheet.headers, mapping) : [];

  const setField = (field: MaterialField, colIndex: number | null) => {
    setMapping((prev) => (prev ? { ...prev, [field]: colIndex } : prev));
  };

  const commitImport = async () => {
    if (!sheet || !mapping) return;
    saveMapping(sheet.headers, mapping);
    setStep('importing');
    let imageAssetIdByRow: Map<number, string> | undefined;
    const fileByItemId = new Map<string, File>();
    if (imageFiles.length > 0) {
      // Ghép theo DÒNG: cột "Ảnh" trước, SKU sau (`matchImagesForRows`). Trước 06/08 chỉ ghép
      // theo SKU == tên file ⇒ bảng ghi `ghe-xoay.jpg` với SKU `CH-MESH-01` cho ra 0/5 ảnh.
      const byRow = matchImagesForRows(
        imageFiles,
        rows.filter((r) => !r.error).map((r) => ({ rowIndex: r.rowIndex, sku: r.payload?.sku, imageRef: r.imageRef })),
      );
      // 06/08 (kiểm phản biện vòng 2) — dòng CÓ tên ảnh mà KHÔNG tìm thấy file phải được ĐẾM và
      // NÓI RA. Trước đây im lặng: người dùng chọn đúng thư mục, đúng tên, ra 0 ảnh, không hiểu
      // vì sao (ca thật: tên tiếng Việt NFD của macOS — đã vá ở `image-match.ts`, nhưng còn vô
      // số cách hụt khác: gõ sai tên, để ảnh ở thư mục con khác, đuôi .webp…).
      const wantImage = rows.filter((r) => !r.error && (r.imageRef ?? '').trim()).length;
      setImageMissCount(Math.max(0, wantImage - byRow.size));
      if (byRow.size > 0) {
        setProgress({ done: 0, total: byRow.size, phase: 'images' });
        imageAssetIdByRow = await uploadMatchedImages(byRow, (done, total) => setProgress({ done, total, phase: 'images' }));
        for (const r of rows) {
          const f = byRow.get(r.rowIndex);
          if (f && r.ffe) fileByItemId.set(r.ffe.id, f);
        }
      }
    }
    setProgress({ done: 0, total: validCount, phase: 'rows' });
    const outcome = await runImport(rows, {
      kind,
      imageAssetIdByRow,
      onProgress: (done, total) => setProgress({ done, total, phase: 'rows' }),
      tableLabel: tr('FF&E — nhập từ bảng tính', 'FF&E — imported from spreadsheet'),
    });
    setResult(outcome);
    setFfeImages(fileByItemId);
    setStep('done');
  };

  /**
   * ① Cửa THẬT cho hồ sơ FF&E nhiều món (G-M3-04). Trước 06/08 `buildFfeSheet`/
   * `ffeSheetToXlsxBuffer` có 0 nơi gọi — nghiệm thu "đưa CSV 5 món → ra bảng đủ 5 dòng có ảnh"
   * chỉ chạy được bằng script, đúng cái bệnh "code có, mặt tiền không có" mà cả vòng này đang chữa.
   */
  const exportFfeSheet = async () => {
    if (!result || exporting) return;
    setExporting(true);
    setExportNote(null);
    let skipped = 0;
    const images = new Map<string, FfeSheetImage>();
    for (const [itemId, file] of ffeImages) {
      const img = await imageFileToXlsxImage(file);
      if (img) images.set(itemId, img);
      else skipped += 1; // webp/gif/ảnh hỏng — Excel không nhận, PHẢI nói ra
    }
    try {
      const sheet = buildFfeSheet(result.table.items, { title: tr('HỒ SƠ FF&E', 'FF&E SCHEDULE') });
      const buf = await ffeSheetToXlsxBuffer(sheet, images);
      const blob = new Blob([buf as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FFE.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      setExportNote(
        skipped > 0
          ? tr(`Đã tải hồ sơ. ${skipped} ảnh KHÔNG nhúng được (chỉ nhận PNG/JPEG).`, `Downloaded. ${skipped} image(s) could not be embedded (PNG/JPEG only).`)
          : null,
      );
    } catch (e) {
      setExportNote(tr('Không dựng được file hồ sơ FF&E.', 'Could not build the FF&E file.') + ` (${e instanceof Error ? e.message : String(e)})`);
    }
    setExporting(false);
  };

  return (
    <div role="dialog" aria-modal style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.4)' }}>
      <div style={{ width: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <FileSpreadsheet size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Nhập vật liệu từ Excel/CSV', 'Import materials from Excel/CSV')}
          </span>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 6, background: 'transparent', color: 'var(--t4)', cursor: 'pointer' }}>
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
                borderRadius: 10, border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                background: dragOver ? 'var(--accent-soft, var(--field))' : 'var(--field)',
              }}
            >
              {/* soi-mien-tru: F-ICON-SIZE — glyph giữa VÙNG THẢ TỆP - cỡ icon giao diện làm mất tín hiệu thả */}
              <Upload size={26} strokeWidth={1.5} style={{ color: 'var(--t4)' }} />
              <b style={{ fontSize: 'var(--fs-ui)', color: 'var(--t1)' }}>{tr('Thả file .xlsx hoặc .csv vào đây', 'Drop an .xlsx or .csv file here')}</b>
              <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{tr('Bảng giá từ nhà cung cấp — ghép cột ở bước sau', "Supplier price list — you'll map columns next")}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: 6, height: 30, padding: '0 14px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
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
                  <AlertTriangle size={14} /> {fileError}
                </div>
              )}
            </div>
          )}

          {step === 'map' && sheet && mapping && (
            <>
              {/* Chọn loại bản ghi cho cả lô — G-M3-07. Đặt TRÊN bảng ghép cột vì nó quyết định
                  cả lô sẽ nằm ở ngăn nào của kho, người dùng cần thấy trước khi ngó từng cột. */}
              <div style={{ marginBottom: 14, padding: 10, borderRadius: 10, background: 'var(--field)', border: '1px solid var(--border)' }}>
                <label htmlFor="import-kind" style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>
                  {tr('Nhập vào ngăn nào của kho', 'Which shelf of the warehouse')}
                </label>
                <select
                  id="import-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)', fontSize: 12.5, padding: '0 8px' }}
                >
                  {SPEC_KINDS.map((k) => (
                    <option key={k} value={k}>{tr(IMPORT_KIND_LABEL[k]?.vi ?? k, IMPORT_KIND_LABEL[k]?.en ?? k)}</option>
                  ))}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'var(--t4)' }}>
                  {kind === kindGuessed
                    ? tr(
                        `Đoán theo dữ liệu: ${IMPORT_KIND_LABEL[kindGuessed]?.vi ?? kindGuessed}. Đổi được.`,
                        `Guessed from the data: ${IMPORT_KIND_LABEL[kindGuessed]?.en ?? kindGuessed}. You can change it.`,
                      )
                    : tr(
                        `Bạn đã đổi — máy đoán là ${IMPORT_KIND_LABEL[kindGuessed]?.vi ?? kindGuessed}.`,
                        `You changed it — the guess was ${IMPORT_KIND_LABEL[kindGuessed]?.en ?? kindGuessed}.`,
                      )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 16 }}>
                {MATERIAL_FIELDS.map((field) => (
                  <div key={field}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>
                      {tr(MATERIAL_FIELD_LABEL[field].vi, MATERIAL_FIELD_LABEL[field].en)}
                      {MATERIAL_FIELD_LABEL[field].required && ' *'}
                    </label>
                    <select
                      value={mapping[field] ?? ''}
                      onChange={(e) => setField(field, e.target.value === '' ? null : Number(e.target.value))}
                      style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, padding: '0 8px' }}
                    >
                      <option value="">{tr('— không dùng —', '— unused —')}</option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `(cột ${i + 1})`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* ② Cột người dùng ĐƯA VÀO mà app KHÔNG nhận — trước 06/08 bị bỏ rơi lặng lẽ
                  (`guessMapping` trả về "CỘT BỊ BỎ RƠI: [Ảnh]" mà màn hình không nói gì). */}
              {droppedColumns.length > 0 && (
                <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--warning) 12%, var(--field))', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                    {tr(`${droppedColumns.length} cột trong file KHÔNG được nhập:`, `${droppedColumns.length} column(s) in the file are NOT imported:`)}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--t3)' }}>
                    {droppedColumns.map((c) => `"${c.header}"`).join(' · ')}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--t4)' }}>
                    {tr('Ghép chúng vào một ô ở trên nếu cần — nếu không, dữ liệu của các cột này sẽ không vào kho.', 'Map them to a field above if you need them — otherwise this data will not enter the warehouse.')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
                  {tr(`Xem trước ${Math.min(PREVIEW_COUNT, rows.length)}/${rows.length} dòng`, `Preview ${Math.min(PREVIEW_COUNT, rows.length)}/${rows.length} rows`)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
                  {tr(`${validCount} hợp lệ`, `${validCount} valid`)}
                </span>
                {errorCount > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={14} /> {tr(`${errorCount} dòng lỗi`, `${errorCount} error row(s)`)}
                  </span>
                )}
                {warnCount > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={14} /> {tr(`${warnCount} dòng có cảnh báo (vẫn nhập)`, `${warnCount} row(s) with warnings (still imported)`)}
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
                      <th style={previewTh}>{tr('SL', 'Qty')}</th>
                      <th style={previewTh}>{tr('Phòng', 'Room')}</th>
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
                        <td style={previewTd}>{r.ffe ? `${r.ffe.qty} ${r.ffe.unit}` : '—'}</td>
                        <td style={previewTd}>{r.ffe?.room ?? '—'}</td>
                        <td style={previewTd}>{r.payload?.priceVnd != null ? r.payload.priceVnd.toLocaleString('vi-VN') : '—'}</td>
                        <td style={{ ...previewTd, color: r.error ? 'var(--danger)' : r.warnings.length ? 'var(--warning)' : 'var(--t4)' }}>
                          {r.error ?? r.warnings.join(' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* 06/08 — nhãn cũ ghi "ghép theo mã SKU trùng tên file" nay SAI so với code:
                      `matchImagesForRows` thử cột Ảnh TRƯỚC, hết mới tới SKU. Nhãn nói sai luật
                      ghép làm người dùng đặt tên file kiểu khác rồi tưởng app hỏng. */}
                  <FolderInput size={14} /> {tr('Ảnh (tuỳ chọn) — kéo cả thư mục, ghép theo cột Ảnh; không có thì theo mã SKU', 'Images (optional) — drop a whole folder, matched by the Image column, else by SKU')}
                </div>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  style={{ height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}
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
                {/* 06/08 — bảng CÓ cột Ảnh mà chưa chọn thư mục: trước đây im lặng, người dùng nhập
                    xong thấy hồ sơ FF&E 0 ảnh mà không hiểu vì sao. Tên file trong bảng chỉ là CHỮ,
                    không phải ảnh — phải nói ra chỗ này. */}
                {mapping?.image != null && imageFiles.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 6, lineHeight: 1.5 }}>
                    {tr(
                      'Bảng có cột Ảnh nhưng đó mới là TÊN FILE — chọn thư mục ảnh thì hồ sơ FF&E mới có hình.',
                      'The sheet has an Image column, but those are only FILE NAMES — pick the image folder to get pictures in the FF&E schedule.',
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {(step === 'importing' || step === 'done') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              {step === 'importing' && (
                <>
                  {/* soi-mien-tru: F-ICON-SIZE — glyph giữa VÙNG THẢ TỆP - cỡ icon giao diện làm mất tín hiệu thả */}
                  <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 'var(--fs-ui)', color: 'var(--t2)' }}>
                    {progress?.phase === 'images'
                      ? tr(`Đang tải ảnh ${progress.done}/${progress.total}…`, `Uploading images ${progress.done}/${progress.total}…`)
                      : tr(`Đang nhập ${progress?.done ?? 0}/${progress?.total ?? validCount}…`, `Importing ${progress?.done ?? 0}/${progress?.total ?? validCount}…`)}
                  </span>
                </>
              )}
              {step === 'done' && result && (
                <>
                  {/* soi-mien-tru: F-ICON-SIZE — glyph giữa VÙNG THẢ TỆP - cỡ icon giao diện làm mất tín hiệu thả */}
                  <CheckCircle2 size={22} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 600, color: 'var(--t1)' }}>
                    {tr(
                      `Đã thêm ${result.ok} ${(IMPORT_KIND_LABEL[kind]?.vi ?? kind).toLowerCase()}`,
                      `Added ${result.ok} ${(IMPORT_KIND_LABEL[kind]?.en ?? kind).toLowerCase()} item(s)`,
                    )}
                  </span>
                  {imageMissCount > 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.5, maxWidth: 380 }}>
                      {tr(
                        `${imageMissCount} dòng có tên ảnh nhưng không tìm thấy file trong thư mục đã chọn — hồ sơ FF&E sẽ trống ảnh ở những dòng đó.`,
                        `${imageMissCount} row(s) name an image that wasn't found in the chosen folder — those rows will have no picture in the FF&E schedule.`,
                      )}
                    </span>
                  )}
                  {/* Nói thẳng chỗ dữ liệu CHƯA vào kho được — luật §9 "cấm nút giả", và luật
                      8-điều "luôn nói rõ máy vừa làm gì".
                      🟢 SỬA 06/08 VÒNG 2: câu cũ kể CẢ BA cột (Số lượng · Phòng · Độ tin cậy) là
                      "chưa lưu được" — nay SAI với 2 cột sau: `ProductSpec` đã có cột
                      `room`/`confidence` thật (chủ dự án chạy `db push`), payload đã gửi, nên
                      chúng lưu được và còn nguyên sau khi đóng tab. Chỉ còn SỐ LƯỢNG là không vào
                      kho — và đó là CỐ Ý (danh mục dùng chung nhiều dự án thì không giữ số lượng
                      của một dự án). Để nguyên câu cũ = nói dối theo chiều ngược lại. */}
                  {mapping?.qty != null && (
                    <div style={{ fontSize: 11.5, color: 'var(--t4)', textAlign: 'center', maxWidth: 460 }}>
                      {tr(
                        'Cột Số lượng không lưu vào kho — kho giữ DANH MỤC (món này tồn tại, giá bao nhiêu), còn số lượng là của từng dự án. Nó nằm trong hồ sơ FF&E tải về bên dưới. Phòng và Độ tin cậy thì đã lưu vào kho.',
                        'Quantity is not stored in the warehouse — the warehouse holds the catalogue (what exists, at what price); quantity belongs to a project. It lives in the FF&E schedule below. Room and Confidence are saved to the warehouse.',
                      )}
                    </div>
                  )}

                  {/* ① Cửa THẬT của hồ sơ FF&E nhiều món. Không có bảng ⇒ disabled KÈM LÝ DO
                      (§9 cấm nút giả), không ẩn nút. */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <button
                      type="button"
                      onClick={() => void exportFfeSheet()}
                      disabled={result.table.items.length === 0 || exporting}
                      style={{
                        height: 30, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                        border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
                        cursor: result.table.items.length === 0 || exporting ? 'not-allowed' : 'pointer',
                        opacity: result.table.items.length === 0 || exporting ? 0.55 : 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <FileSpreadsheet size={18} />
                      {exporting
                        ? tr('Đang dựng hồ sơ…', 'Building schedule…')
                        : tr(`Tải hồ sơ FF&E (${result.table.items.length} món)`, `Download FF&E schedule (${result.table.items.length} item(s))`)}
                    </button>
                    {result.table.items.length === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--t4)', textAlign: 'center', maxWidth: 420 }}>
                        {tr('Chưa có món nào vào kho nên chưa dựng được hồ sơ — sửa các dòng lỗi bên dưới rồi nhập lại.', 'No item made it into the warehouse, so there is nothing to build — fix the failed rows below and import again.')}
                      </span>
                    )}
                    {exportNote && (
                      <span style={{ fontSize: 11, color: 'var(--warning)', textAlign: 'center', maxWidth: 420 }}>{exportNote}</span>
                    )}
                  </div>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--gap)', padding: 14, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {step === 'map' && (
            <button
              type="button"
              onClick={() => void commitImport()}
              disabled={validCount === 0}
              style={{ height: 'var(--tap)', padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: validCount === 0 ? 0.5 : 1 }}
            >
              {tr(`Nhập ${validCount} dòng`, `Import ${validCount} row(s)`)}
            </button>
          )}
          {step === 'done' && (
            <button
              type="button"
              onClick={onImported}
              style={{ height: 'var(--tap)', padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
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
