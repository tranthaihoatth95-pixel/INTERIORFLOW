/**
 * lib/present-editor/boq-xlsx-import.ts — NHẬP .xlsx VÀO BẢNG KHỐI LƯỢNG (chặng Trình chiếu).
 *
 * ⛔ LUẬT GỐC (Hoà chốt): **đích đến là bảng khối lượng ĐANG CÓ, KHÔNG tạo nguồn dữ liệu song
 * song.** BOQ luôn tự tính từ bản vẽ (`lib/boq/compute.ts`, gộp theo `matId`); nhập Excel chỉ
 * **NẠP GIÁ TRỊ vào lớp sửa-tay đã có** (`boq-overrides.ts`, field `'m2'`/`'donGia'`) — đúng cơ
 * chế người dùng gõ tay 1 ô trong `BoqTable`. Hệ quả bắt buộc, đã cài trong `buildBoqImportPlan`:
 *   · dòng Excel KHÔNG khớp mã nào trong BOQ ⇒ **BÁO RÕ, BỎ QUA** — tuyệt đối không đẻ hạng mục
 *     mới (một dòng BOQ không có `entityIds` là một dòng không truy được về bản vẽ = số ma).
 *   · không ghi ngược vào `Doc`, không đụng `lib/boq/**` (engine tính từ CAD).
 * Muốn thêm hạng mục thì phải vẽ/gán vật liệu ở chặng 2D — đó là nguồn sự thật, không phải file
 * Excel của ai gửi tới.
 *
 * ĐỌC CỘT: dùng lại `lib/materials/warehouse/xlsx-parse.ts` (SheetJS) — module đó đã học bài
 * mojibake UTF-8 của SheetJS với CSV (`XLSX.read(bytes,{type:'array'})` đọc "Mã" thành "MÃ£");
 * viết lại đường đọc thứ hai ở đây là chép lại nguyên con bug đã sửa.
 *
 * ĐOÁN CỘT: dùng lại `guessMapping` của `column-mapping.ts` (chấm điểm + cụm chặn + 13 ca bẫy đã
 * khoá bằng test) — KHÔNG viết bộ đoán thứ hai. Chỉ vá thêm ĐÚNG 2 lỗ mà bộ chung không thể biết
 * (nó phục vụ kho vật liệu, không phục vụ BOQ) — xem `BOQ_ONLY_HEADERS`.
 *
 * THUẦN: mọi hàm ở đây không đọc IDB/DOM/state — UI (`components/present-editor/Toolbar.tsx`) tự
 * nạp `BoqRow[]`, gọi các hàm này, rồi ghi qua `boq-overrides-persist.ts`. Import TƯƠNG ĐỐI
 * (không alias `@/`) theo quy ước mọi module có `.test.ts` chạy bằng sucrase-node.
 */
import type { BoqRow } from '../boq/model';
import { guessMapping, headerSignature } from '../materials/warehouse/column-mapping';
import { parseSpreadsheetFile, type ParsedSheet } from '../materials/warehouse/xlsx-parse';
import { setOverride, type BoqOverrideField, type BoqOverrideMap } from './boq-overrides';

export type { ParsedSheet };

/* ═══════════════════════ ① CỘT ═══════════════════════ */

/** 5 cột BOQ quan tâm. `ten` chỉ để ĐỐI CHIẾU mắt thường trong bảng xem trước — không bao giờ
 * dùng để khớp dòng (tên gõ tay muôn kiểu; khớp theo tên là cách chắc chắn nạp nhầm giá). */
export const BOQ_IMPORT_FIELDS = ['matId', 'ma', 'ten', 'qty', 'donGia'] as const;
export type BoqImportField = (typeof BOQ_IMPORT_FIELDS)[number];

export const BOQ_IMPORT_FIELD_LABEL: Record<BoqImportField, { vi: string; en: string }> = {
  matId: { vi: 'Mã vật liệu (matId)', en: 'Material id (matId)' },
  ma: { vi: 'Mã SP / SKU', en: 'Product code / SKU' },
  ten: { vi: 'Tên hạng mục (chỉ đối chiếu)', en: 'Item name (reference only)' },
  qty: { vi: 'Khối lượng', en: 'Quantity' },
  donGia: { vi: 'Đơn giá', en: 'Unit price' },
};

export type BoqImportColumns = Record<BoqImportField, number | null>;

export function emptyBoqColumns(): BoqImportColumns {
  return { matId: null, ma: null, ten: null, qty: null, donGia: null };
}

/** Chuẩn hoá tiêu đề — mượn ĐÚNG `normalizeHeader` của `column-mapping.ts` qua cửa đã export
 * (`headerSignature` trên mảng 1 phần tử = chính nó). Chép lại hàm chuẩn hoá là mở đường cho hai
 * nơi lệch nhau về sau. */
function normHeader(h: string): string {
  return headerSignature([h]);
}

/**
 * ⛔ ĐÚNG 2 LỖ của bộ đoán chung — đo thật trên file do chính app xuất ra
 * (`boqResultToXlsxBuffer`, `lib/boq/xlsx.ts:341` — header `['Mã vật liệu','Tên vật liệu','NCC',
 * 'Mã SP','Ảnh','Khối lượng','Đơn vị','Đơn giá (đ)','Hao hụt (%)','Thành tiền (đ)']`):
 *   · **matId** — `MATERIAL_FIELDS` KHÔNG có khái niệm này (kho vật liệu chỉ biết SKU). Tệ hơn:
 *     "Mã vật liệu" chấm cho `materials` 572đ > cho `sku` 518đ (từ khoá 'vat lieu' phủ dài hơn
 *     'ma') nên bộ chung nuốt cột này vào ô Vật liệu.
 *   · **qty** — từ khoá qty là `['so luong','sl','qty','quantity','so bo','count']`, KHÔNG có
 *     "khối lượng". Bảng BOQ nào cũng dùng chữ đó ⇒ cột khối lượng rơi mất, im lặng.
 * Chỉ vá 2 ô này, mọi ô khác vẫn do bộ chung quyết — thêm từ khoá mới thì ghi lý do vào đây.
 */
const BOQ_ONLY_HEADERS: Record<'matId' | 'qty', readonly string[]> = {
  matId: ['ma vat lieu', 'ma vat tu', 'matid', 'mat id'],
  qty: ['khoi luong', 'dien tich', 'so m2', 'khoiluong'],
};

/**
 * Đoán cột cho bảng BOQ = bộ đoán CHUNG + vá 2 lỗ ở trên.
 * `sku → ma` · `name → ten` · `qty → qty` · `priceVnd → donGia` (bộ chung đã chặn sẵn các bẫy
 * "Thành tiền"/"Đánh giá"/"Gia công" cho cột giá — đó chính là lý do dùng lại nó).
 */
export function guessBoqColumns(headers: string[]): BoqImportColumns {
  const base = guessMapping(headers);
  const out: BoqImportColumns = {
    matId: null,
    ma: base.sku,
    ten: base.name,
    qty: base.qty,
    donGia: base.priceVnd,
  };
  const norm = headers.map(normHeader);
  const used = new Set<number>(Object.values(out).filter((v): v is number => v != null));
  (['matId', 'qty'] as const).forEach((field) => {
    if (out[field] != null) return;
    const idx = norm.findIndex((h, i) => !used.has(i) && h !== '' && BOQ_ONLY_HEADERS[field].some((kw) => h.includes(kw)));
    if (idx >= 0) {
      out[field] = idx;
      used.add(idx);
    }
  });
  return out;
}

/** Cột trong file mà bản nhập BOQ KHÔNG dùng — hiện ra để người dùng biết mình vừa bỏ gì lại
 * (bài học G-M3-05: bỏ rơi cột mà không nói một tiếng). */
export function unusedBoqColumns(headers: string[], columns: BoqImportColumns): { header: string; index: number }[] {
  const taken = new Set(Object.values(columns).filter((v): v is number => v != null));
  return headers
    .map((header, index) => ({ header: header.trim(), index }))
    .filter((c) => c.header.length > 0 && !taken.has(c.index));
}

/* ═══════════════════════ ② SỐ ═══════════════════════ */

/**
 * Đọc 1 ô thành số. Bảng thật (và chính file app xuất ra — numFmt `#,##0" đ"` / `#,##0.00`) cho
 * đủ kiểu: `"1,200,000 đ"` · `"1.200.000"` · `"48.60"` · `"12,5"` · `"48,60 m²"`.
 *
 * Luật tách dấu:
 *   · có CẢ `,` và `.` ⇒ dấu XUẤT HIỆN SAU là dấu thập phân, dấu kia là dấu nghìn.
 *   · chỉ một loại dấu, xuất hiện ≥2 lần ⇒ chắc chắn dấu NGHÌN ("1.200.000").
 *   · chỉ một dấu, sau nó ĐÚNG 3 chữ số ⇒ coi là dấu NGHÌN ("1.200" = 1200).
 *     ⚠️ GIỚI HẠN CÓ CHỦ Ý: "1.200" nghĩa "một phẩy hai" sẽ đọc thành 1200. Tiền/khối lượng nội
 *     thất VN viết 3 số lẻ gần như không có, còn tiền viết dấu nghìn thì có mọi dòng — chọn cái
 *     sai ít hơn, và bảng xem trước cho người dùng thấy số trước khi áp.
 *   · còn lại ⇒ dấu THẬP PHÂN ("48.60", "12,5").
 * Trả `null` khi: ô trống · không ra số hữu hạn · số ÂM (khối lượng/đơn giá âm là dữ liệu hỏng,
 * thà bỏ ô đó và báo còn hơn nạp vào rồi ra thành tiền âm).
 */
export function parseBoqNumber(raw: string): number | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  // bỏ mọi thứ không phải chữ số/dấu — đơn vị ("m²", "đ", "VND"), khoảng trắng thường & hẹp
  const s = trimmed.replace(/[^\d.,-]/g, '');
  if (!s || !/\d/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let decSep = '';
  if (lastComma >= 0 && lastDot >= 0) {
    decSep = lastComma > lastDot ? ',' : '.';
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const parts = s.split(sep);
    const tail = parts[parts.length - 1];
    decSep = parts.length > 2 || tail.length === 3 ? '' : sep;
  }

  let plain: string;
  if (decSep === ',') plain = s.replace(/\./g, '').replace(',', '.');
  else if (decSep === '.') plain = s.replace(/,/g, '');
  else plain = s.replace(/[.,]/g, '');

  const n = Number(plain);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/* ═══════════════════════ ③ KHỚP DÒNG ═══════════════════════ */

export type BoqImportStatus =
  /** khớp mã + có ít nhất 1 ô số hợp lệ KHÁC số máy ⇒ sẽ ghi override */
  | 'apply'
  /** khớp mã nhưng số y hệt số máy ⇒ KHÔNG ghi (ghi vào là dòng bị đánh dấu "đã sửa tay" oan) */
  | 'unchanged'
  /** dòng không có mã nào đọc được */
  | 'no-code'
  /** mã không có trong BOQ hiện tại — BỎ QUA, không tạo hạng mục mới */
  | 'not-found'
  /** mã trỏ tới ≥2 hạng mục BOQ khác nhau ⇒ không đoán bừa */
  | 'ambiguous'
  /** mã đã xuất hiện ở dòng trước của chính file này */
  | 'duplicate'
  /** khớp mã nhưng không có ô số nào đọc được */
  | 'no-value';

/** Ghi chú phụ trên 1 dòng (vẫn có thể `apply` nhờ ô còn lại). */
export type BoqImportNote = 'qty-invalid' | 'donGia-invalid' | 'qty-same' | 'donGia-same';

export interface BoqXlsxImportRow {
  /** chỉ số trong `sheet.rows` (0-based, KHÔNG tính dòng tiêu đề). */
  rowIndex: number;
  /** số dòng NGƯỜI DÙNG thấy trong Excel (tiêu đề = 1). Mọi câu báo lỗi dùng số này. */
  lineNo: number;
  /** mã đọc được, nguyên văn (để in ra trong câu báo). */
  code: string;
  ten: string;
  qty: number | null;
  donGia: number | null;
  /** hạng mục BOQ khớp được — `null` nghĩa là không áp gì cả. */
  matId: string | null;
  /** tên hạng mục trong BOQ (để đối chiếu với `ten` của file). */
  boqTen: string | null;
  status: BoqImportStatus;
  /** ô sẽ ghi thật (đã bỏ ô hỏng + ô trùng số máy). */
  fields: BoqOverrideField[];
  notes: BoqImportNote[];
}

export interface BoqXlsxImportPlan {
  rows: BoqXlsxImportRow[];
  /** số DÒNG sẽ ghi. */
  applyCount: number;
  /** số Ô sẽ ghi (1 dòng có thể ghi cả khối lượng lẫn đơn giá). */
  cellCount: number;
  unchangedCount: number;
  /** số dòng bị bỏ qua vì mọi lý do (không mã · không khớp · trùng · nhập nhằng · không số). */
  skippedCount: number;
  /** mã có trong file mà BOQ không có — gom lại để báo một câu gọn. */
  unmatchedCodes: string[];
}

/** So khối lượng: 2 số lẻ là mức bảng đang hiện (`fmtM2`), dưới ngưỡng đó coi như không đổi. */
const QTY_EPS = 5e-3;

function normCode(s: string): string {
  return String(s ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function cellAt(row: string[], col: number | null): string {
  if (col == null || col < 0) return '';
  return String(row[col] ?? '').trim();
}

/**
 * Dựng KẾ HOẠCH nạp — thuần, không ghi gì. UI hiện đúng bảng này cho người dùng duyệt TRƯỚC khi
 * áp (luật §7 "đích đến phải sửa được / không bước nào là hộp đen").
 *
 * Khớp theo MÃ, hai vòng: `matId` trước (chính xác tuyệt đối, có trong file do app xuất ra), rồi
 * tới `ma`/SKU. KHÔNG bao giờ khớp theo tên.
 */
export function buildBoqImportPlan(
  sheet: ParsedSheet,
  columns: BoqImportColumns,
  boqRows: BoqRow[],
): BoqXlsxImportPlan {
  const byMatId = new Map<string, BoqRow>();
  /** mã SKU → các hạng mục mang mã đó (≥2 ⇒ nhập nhằng, không đoán). */
  const bySku = new Map<string, BoqRow[]>();
  for (const r of boqRows) {
    const id = normCode(r.matId);
    if (id && !byMatId.has(id)) byMatId.set(id, r);
    const sku = normCode(r.ma);
    if (!sku) continue;
    const list = bySku.get(sku);
    if (list) list.push(r);
    else bySku.set(sku, [r]);
  }

  const seen = new Map<string, number>(); // mã → lineNo đã gặp trong chính file này
  const unmatched: string[] = [];
  const rows: BoqXlsxImportRow[] = sheet.rows.map((cells, rowIndex) => {
    const lineNo = rowIndex + 2; // +1 vì 0-based, +1 vì dòng tiêu đề
    const rawMatId = cellAt(cells, columns.matId);
    const rawMa = cellAt(cells, columns.ma);
    const code = rawMatId || rawMa;
    const ten = cellAt(cells, columns.ten);
    const qtyRaw = cellAt(cells, columns.qty);
    const donGiaRaw = cellAt(cells, columns.donGia);
    const qty = parseBoqNumber(qtyRaw);
    const donGia = parseBoqNumber(donGiaRaw);
    const notes: BoqImportNote[] = [];
    if (qtyRaw && qty == null) notes.push('qty-invalid');
    if (donGiaRaw && donGia == null) notes.push('donGia-invalid');

    const base = { rowIndex, lineNo, code, ten, qty, donGia, notes };

    if (!code) return { ...base, matId: null, boqTen: null, status: 'no-code' as const, fields: [] };

    const key = normCode(code);
    const dup = seen.get(key);
    if (dup != null) return { ...base, matId: null, boqTen: null, status: 'duplicate' as const, fields: [] };
    seen.set(key, lineNo);

    let hit = byMatId.get(key) ?? null;
    if (!hit) {
      const list = bySku.get(key) ?? [];
      if (list.length > 1) return { ...base, matId: null, boqTen: null, status: 'ambiguous' as const, fields: [] };
      hit = list[0] ?? null;
    }
    if (!hit) {
      unmatched.push(code);
      return { ...base, matId: null, boqTen: null, status: 'not-found' as const, fields: [] };
    }

    const fields: BoqOverrideField[] = [];
    if (qty != null) {
      if (Math.abs(qty - hit.m2) < QTY_EPS) notes.push('qty-same');
      else fields.push('m2');
    }
    if (donGia != null) {
      if (Math.round(donGia) === Math.round(hit.donGia)) notes.push('donGia-same');
      else fields.push('donGia');
    }

    const status: BoqImportStatus = fields.length > 0
      ? 'apply'
      : qty == null && donGia == null
        ? 'no-value'
        : 'unchanged';
    return { ...base, matId: hit.matId, boqTen: hit.ten, status, fields };
  });

  const applyCount = rows.filter((r) => r.status === 'apply').length;
  const cellCount = rows.reduce((s, r) => s + r.fields.length, 0);
  const unchangedCount = rows.filter((r) => r.status === 'unchanged').length;
  return {
    rows,
    applyCount,
    cellCount,
    unchangedCount,
    skippedCount: rows.length - applyCount - unchangedCount,
    unmatchedCodes: unmatched,
  };
}

/**
 * Kế hoạch → `BoqOverrideMap` mới. KHÔNG xoá override cũ của dòng không có trong file (file Excel
 * thường chỉ chứa một phần bảng — coi thiếu-dòng là "xoá sửa tay" thì mất việc người dùng đã làm).
 * `now` do caller truyền (giữ hàm thuần, test được).
 */
export function planToOverrides(plan: BoqXlsxImportPlan, current: BoqOverrideMap, now: number): BoqOverrideMap {
  let next = current;
  for (const r of plan.rows) {
    if (r.status !== 'apply' || !r.matId) continue;
    for (const f of r.fields) {
      const v = f === 'm2' ? r.qty : r.donGia;
      if (v == null) continue;
      next = setOverride(next, r.matId, f, v, now);
    }
  }
  return next;
}

/** Câu báo cho 1 dòng — song ngữ, "dòng N: …" theo đúng khuôn `SPEC-NGON-NGU-CHI-DAN` (nói việc,
 * không nói mã lỗi). `null` = dòng bình thường, không cần nói gì. */
export function describeBoqImportRow(row: BoqXlsxImportRow, lang: 'vi' | 'en'): string | null {
  const vi = lang === 'vi';
  const at = vi ? `dòng ${row.lineNo}` : `row ${row.lineNo}`;
  switch (row.status) {
    case 'no-code':
      return vi ? `${at}: không có mã — bỏ qua` : `${at}: no code — skipped`;
    case 'not-found':
      return vi
        ? `${at}: mã ${row.code} không có trong BOQ — bỏ qua (BOQ chỉ nhận hạng mục có trên bản vẽ)`
        : `${at}: code ${row.code} is not in the BOQ — skipped (the BOQ only holds items that exist on the drawing)`;
    case 'ambiguous':
      return vi
        ? `${at}: mã ${row.code} trùng ở nhiều hạng mục trong BOQ — không đoán, bỏ qua`
        : `${at}: code ${row.code} matches several BOQ items — skipped instead of guessing`;
    case 'duplicate':
      return vi ? `${at}: mã ${row.code} đã có ở dòng trên — bỏ dòng này` : `${at}: code ${row.code} already appeared above — skipped`;
    case 'no-value':
      return vi ? `${at}: không có khối lượng/đơn giá đọc được` : `${at}: no readable quantity or unit price`;
    case 'unchanged':
      return vi ? `${at}: số y hệt bảng hiện tại — không ghi đè` : `${at}: same as the current value — nothing written`;
    default: {
      const bad: string[] = [];
      if (row.notes.includes('qty-invalid')) bad.push(vi ? 'khối lượng không đọc được' : 'unreadable quantity');
      if (row.notes.includes('donGia-invalid')) bad.push(vi ? 'đơn giá không đọc được' : 'unreadable unit price');
      return bad.length ? `${at}: ${bad.join(' · ')}` : null;
    }
  }
}

/* ═══════════════════════ ④ ĐỌC FILE ═══════════════════════ */

/** Đọc file người dùng chọn thành bảng thô. Mượn nguyên đường đọc của kho vật liệu (SheetJS +
 * bản vá UTF-8 cho CSV) — xem docblock đầu file. Ném lỗi có câu tiếng Việt sẵn, UI chỉ việc hiện. */
export async function readBoqSheetFile(file: File): Promise<ParsedSheet> {
  return parseSpreadsheetFile(file);
}
