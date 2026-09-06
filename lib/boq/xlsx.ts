/**
 * lib/boq/xlsx.ts — BOQ ENGINE (02/08): xuất `BoqResult` ra file `.xlsx` THẬT.
 *
 * KHÔNG thêm package (chỉ đạo gốc "đừng thêm package") — repo CHƯA có exceljs/xlsx/sheetjs (xem
 * `scripts/probe-xlsx-roundtrip.ts` đầu file: nhánh `exceljs` ghi rõ "CHƯA phải dependency của
 * repo", chỉ dùng tạm lúc thăm dò, không cài thật). `jszip` đã có sẵn (`package.json`, pptxgenjs
 * dùng nội bộ — xem `lib/pptx-zip-fonts.ts` tiền lệ "vá/tạo OOXML bằng chuỗi qua jszip, không kéo
 * thêm thư viện") ⇒ tự dựng OOXML .xlsx TỐI THIỂU (1 sheet, không sharedStrings — dùng inline
 * string `t="inlineStr"` cho mọi ô chữ, đơn giản hơn và không cần bảng string riêng) bằng jszip.
 *
 * Phạm vi: CHỈ xuất bảng BOQ (rows + tổng cuối) — KHÔNG xuất riêng sheet lỗi (out of scope, brief
 * gốc chỉ yêu cầu "Cột tiếng Việt, số có định dạng tiền tệ, tổng cuối bảng"). Nếu Hoà muốn thêm
 * sheet liệt kê `BoqError[]` để dễ soát, đó là việc kế tiếp — không tự làm thêm ở đây.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * 06/08 — G-M3-11 "file .xlsx xuất ra KHÔNG nhúng được ảnh" (`grep -n "image\|drawing\|media"
 * lib/boq/xlsx.ts` → 0 dòng). Hồ sơ vật liệu/FF&E gửi khách mà không có ảnh thì gần như vô dụng.
 * Nay file này tách làm 2 tầng:
 *   ① `buildXlsxBuffer(spec)` — MÁY dựng .xlsx tổng quát (ô chữ/số/công thức · bề rộng cột · chiều
 *      cao dòng · **ẢNH neo theo ô**). Không biết gì về BOQ.
 *   ② `boqResultToXlsxBuffer(result, opts)` — mặt tiền BOQ, dựng `spec` rồi gọi ①.
 * Hồ sơ FF&E nhiều món (`lib/ffe/sheet.ts`, G-M3-04) dùng CHUNG máy ① — đó là lý do tách, không
 * phải để cho đẹp: nếu không tách thì hồ sơ FF&E phải viết lại toàn bộ OOXML lần thứ hai.
 *
 * Ảnh: module này THUẦN — KHÔNG fetch/đọc đĩa. Caller tự nạp byte ảnh rồi truyền vào. Không có
 * ảnh ⇒ zip KHÔNG có phần `drawings/`/`media/` nào (file y hệt trước 06/08, không hồi quy).
 */

import JSZip from 'jszip';
import type { BoqResult, BoqRow } from './model';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/**
 * Ký tự ĐIỀU KHIỂN mà XML 1.0 KHÔNG cho phép ở bất cứ đâu, kể cả dạng thực thể `&#1;`. Giữ lại
 * đúng 3 ký tự hợp lệ: tab `\x09`, xuống dòng `\x0A`, về đầu dòng `\x0D`.
 *
 * 🔴 VÁ 06/08 vòng 3 — đo được: tên món chứa `\x01` (ký tự này lọt vào rất tự nhiên khi người ta
 * copy từ phần mềm kế toán/PDF/ERP) ⇒ zip vẫn dựng ra, nhưng `xml.dom.minidom` báo
 * `not well-formed (invalid token)` ⇒ **Excel báo "file hỏng"** và không ai lần ra nguyên nhân là
 * một ký tự vô hình trong một ô. Lọc BỎ hẳn (không thay bằng dấu gì): giữ nguyên chữ người dùng
 * đọc được, chỉ vứt thứ vốn không hiện lên màn hình.
 * (`&`, `<`, `>`, `"`, `'`, emoji, xuống dòng, tab đã đúng từ trước — không đụng.)
 */
const XML_ILLEGAL_CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

function xmlEscape(s: string): string {
  return s
    .replace(XML_ILLEGAL_CONTROL_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Excel CẤM 7 ký tự trong tên sheet (`/ \ ? * [ ] :`) và giới hạn 31 ký tự; tên rỗng cũng không
 * hợp lệ. Hôm nay caller chỉ truyền 'BOQ'/'FF&E' nên chưa nổ — nhưng ai đặt tên sheet theo TÊN DỰ
 * ÁN ("Dự án A/B [2026]: bảng khối lượng…") là file mở ra hỏng ngay, mà lỗi lại hiện ở Excel chứ
 * không ở IF. Làm sạch tại cửa: bỏ ký tự cấm, gộp khoảng trắng, cắt 31 ký tự, rỗng thì rơi về
 * 'Sheet1'. Cố ý KHÔNG ném lỗi — tên tab là thứ trang trí, không đáng chặn cả file xuất. */
export function sanitizeSheetName(name: string): string {
  const cleaned = name
    .replace(XML_ILLEGAL_CONTROL_CHARS, '')
    .replace(/[/\\?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31)
    .trim();
  return cleaned || 'Sheet1';
}

/** Số cột (1-based) → chữ cột Excel (1→A, 27→AA…) — đủ dùng, bảng BOQ chỉ 8 cột nên không cần
 * xử lý quá AZ nhưng viết tổng quát cho chắc. */
function colLetter(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    const rem = (x - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function cellRef(colN: number, rowN: number): string {
  return `${colLetter(colN)}${rowN}`;
}

/** Style index tra ở `xl/styles.xml` bên dưới — giữ đồng bộ 2 nơi, đừng đổi 1 chỗ mà quên chỗ kia. */
export const STYLE = { NORMAL: 0, BOLD: 1, NUM_M2: 2, NUM_VND: 3, BOLD_VND: 4, NUM_INT: 5 } as const;

/* ═════════════════════════ ① MÁY DỰNG .xlsx TỔNG QUÁT ═════════════════════════ */

/** 1 ô trong bảng. `blank` = ô trống có thật (giữ chỗ, vd cột Ảnh khi món chưa có ảnh) — KHÁC với
 * "không khai ô", để cột sau không bị dồn sang trái. */
export type XlsxCell =
  | { t: 'text'; v: string; style?: number }
  | { t: 'num'; v: number; style?: number }
  | { t: 'formula'; f: string; v: number; style?: number }
  | { t: 'blank' };

export interface XlsxRow {
  cells: XlsxCell[];
  /** chiều cao dòng tính bằng ĐIỂM (pt) — Excel dùng pt cho row height. Bỏ trống = mặc định.
   * Dòng có ảnh PHẢI khai, không thì thumbnail tràn đè lên dòng dưới. */
  heightPt?: number;
}

/** 1 ảnh nhúng, neo vào ô (rowIndex/colIndex 0-based TÍNH THEO `rows[]` truyền vào). */
export interface XlsxImage {
  /** chỉ số dòng trong `rows[]` (0 = dòng đầu tiên, thường là header). */
  rowIndex: number;
  /** chỉ số cột 0-based. */
  colIndex: number;
  bytes: Uint8Array;
  ext: 'png' | 'jpeg';
  /** kích thước HIỂN THỊ trong file (px). Caller tự tính theo tỉ lệ ảnh gốc — máy này KHÔNG giải
   * mã ảnh để đo (giữ THUẦN, không kéo thư viện ảnh vào). */
  wPx: number;
  hPx: number;
}

export interface XlsxSheetSpec {
  /** tên tab sheet. */
  name: string;
  /** bề rộng từng cột (đơn vị "ký tự" của Excel) — thiếu phần tử nào thì cột đó dùng mặc định. */
  colWidths: number[];
  rows: XlsxRow[];
  images?: XlsxImage[];
}

/** 1 px ảnh = 9525 EMU (English Metric Unit) — hằng số OOXML, không phải số tự chế. */
const EMU_PER_PX = 9525;
/** offset nhỏ để ảnh không dính sát mép ô. */
const ANCHOR_INSET_EMU = 19050; // 2px

function cellXml(colN: number, rowN: number, cell: XlsxCell): string {
  if (cell.t === 'blank') return '';
  const s = cell.style ?? STYLE.NORMAL;
  if (cell.t === 'text') {
    return `<c r="${cellRef(colN, rowN)}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${xmlEscape(cell.v)}</t></is></c>`;
  }
  // Number.isFinite chặn NaN/Infinity lọt vào XML (ra file hỏng Excel không mở được) — nếu xảy ra
  // là lỗi lập trình ở tầng gọi, không phải input xấu bình thường nên throw thẳng, không âm thầm
  // ghi 0 (giống nguyên tắc "không tính bừa" của compute.ts).
  if (!Number.isFinite(cell.v)) {
    throw new Error(`buildXlsxBuffer: giá trị số không hợp lệ tại ${cellRef(colN, rowN)}: ${cell.v}`);
  }
  if (cell.t === 'formula') {
    // `<f>` là công thức sống Excel/LibreOffice tự chạy lại khi sửa dữ liệu; `<v>` giữ giá trị
    // cache (đúng bằng số ta đã tính) để file mở ra có số ngay, không cần Excel tính lại trước.
    return `<c r="${cellRef(colN, rowN)}" s="${s}"><f>${xmlEscape(cell.f)}</f><v>${cell.v}</v></c>`;
  }
  return `<c r="${cellRef(colN, rowN)}" s="${s}"><v>${cell.v}</v></c>`;
}

function buildSheetXml(spec: XlsxSheetSpec, hasDrawing: boolean): string {
  const rowsXml = spec.rows.map((row, i) => {
    const rowN = i + 1;
    const cells = row.cells.map((c, j) => cellXml(j + 1, rowN, c)).join('');
    const ht = row.heightPt ? ` ht="${row.heightPt}" customHeight="1"` : '';
    return `<row r="${rowN}"${ht}>${cells}</row>`;
  });

  const cols = spec.colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  return (
    XML_HEADER +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    (cols ? `<cols>${cols}</cols>` : '') +
    `<sheetData>${rowsXml.join('')}</sheetData>` +
    // ⚠️ thứ tự phần tử trong <worksheet> là BẮT BUỘC theo schema: <drawing> phải đứng SAU
    // <sheetData>. Đảo là Excel báo file hỏng.
    (hasDrawing ? '<drawing r:id="rId1"/>' : '') +
    '</worksheet>'
  );
}

/** `xl/drawings/drawing1.xml` — mỗi ảnh 1 `oneCellAnchor` (neo góc trên-trái vào ô, kích thước cố
 * định theo `ext`) + `editAs` mặc định. Chọn oneCellAnchor thay twoCellAnchor: ảnh giữ đúng tỉ lệ
 * đã tính, không méo theo bề rộng cột người dùng kéo. */
function buildDrawingXml(images: XlsxImage[]): string {
  const anchors = images.map((img, i) => {
    const cx = Math.max(1, Math.round(img.wPx * EMU_PER_PX));
    const cy = Math.max(1, Math.round(img.hPx * EMU_PER_PX));
    const id = i + 2; // id 1 dành cho sheet, ảnh bắt đầu từ 2 (quy ước Excel sinh ra)
    return (
      '<xdr:oneCellAnchor>' +
      `<xdr:from><xdr:col>${img.colIndex}</xdr:col><xdr:colOff>${ANCHOR_INSET_EMU}</xdr:colOff>` +
      `<xdr:row>${img.rowIndex}</xdr:row><xdr:rowOff>${ANCHOR_INSET_EMU}</xdr:rowOff></xdr:from>` +
      `<xdr:ext cx="${cx}" cy="${cy}"/>` +
      '<xdr:pic>' +
      `<xdr:nvPicPr><xdr:cNvPr id="${id}" name="Picture ${i + 1}" descr="${xmlEscape(`Ảnh dòng ${img.rowIndex + 1}`)}"/>` +
      '<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>' +
      `<xdr:blipFill><a:blip r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
      `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>' +
      '</xdr:pic>' +
      '<xdr:clientData/>' +
      '</xdr:oneCellAnchor>'
    );
  });

  return (
    XML_HEADER +
    '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" ' +
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    anchors.join('') +
    '</xdr:wsDr>'
  );
}

function buildDrawingRelsXml(images: XlsxImage[]): string {
  const rels = images
    .map((img, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.${img.ext}"/>`)
    .join('');
  return (
    XML_HEADER +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    rels +
    '</Relationships>'
  );
}

const SHEET_RELS_XML =
  XML_HEADER +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>' +
  '</Relationships>';

const STYLES_XML =
  XML_HEADER +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="3">' +
  '<numFmt numFmtId="164" formatCode="#,##0.00"/>' +
  '<numFmt numFmtId="165" formatCode="#,##0&quot; đ&quot;"/>' +
  '<numFmt numFmtId="166" formatCode="#,##0"/>' +
  '</numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="6">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' + // 0 NORMAL
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' + // 1 BOLD
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' + // 2 NUM_M2
  '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' + // 3 NUM_VND
  '<xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' + // 4 BOLD_VND
  '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' + // 5 NUM_INT
  '</cellXfs>' +
  '</styleSheet>';

function workbookXml(sheetName: string): string {
  return (
    XML_HEADER +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
    '</workbook>'
  );
}

const WORKBOOK_RELS_XML =
  XML_HEADER +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

const ROOT_RELS_XML =
  XML_HEADER +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '</Relationships>';

function contentTypesXml(images: XlsxImage[]): string {
  // `<Default Extension="png|jpeg">` — bắt buộc, thiếu là Excel coi file hỏng ngay khi mở.
  const exts = Array.from(new Set(images.map((i) => i.ext)));
  const imageDefaults = exts
    .map((e) => `<Default Extension="${e}" ContentType="image/${e}"/>`)
    .join('');
  const drawingOverride = images.length
    ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
    : '';
  return (
    XML_HEADER +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    imageDefaults +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    drawingOverride +
    '</Types>'
  );
}

/**
 * MÁY dựng buffer `.xlsx` THẬT (OOXML tối thiểu, tự viết XML, KHÔNG thêm package) từ 1 mô tả bảng.
 * Dùng chung cho BOQ (`boqResultToXlsxBuffer`) và hồ sơ FF&E (`lib/ffe/sheet.ts`).
 */
export async function buildXlsxBuffer(spec: XlsxSheetSpec): Promise<Uint8Array> {
  const images = spec.images ?? [];
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml(images));
  zip.file('_rels/.rels', ROOT_RELS_XML);
  zip.file('xl/workbook.xml', workbookXml(sanitizeSheetName(spec.name)));
  zip.file('xl/_rels/workbook.xml.rels', WORKBOOK_RELS_XML);
  zip.file('xl/styles.xml', STYLES_XML);
  zip.file('xl/worksheets/sheet1.xml', buildSheetXml(spec, images.length > 0));

  if (images.length) {
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', SHEET_RELS_XML);
    zip.file('xl/drawings/drawing1.xml', buildDrawingXml(images));
    zip.file('xl/drawings/_rels/drawing1.xml.rels', buildDrawingRelsXml(images));
    images.forEach((img, i) => {
      zip.file(`xl/media/image${i + 1}.${img.ext}`, img.bytes);
    });
  }

  return zip.generateAsync({ type: 'uint8array' });
}

/* ═════════════════════════ ② MẶT TIỀN BOQ ═════════════════════════ */

/** 1 ảnh cho 1 dòng BOQ — caller (UI/route) tự nạp byte + tự đo kích thước gốc. */
export interface BoqXlsxImage {
  bytes: Uint8Array;
  ext: 'png' | 'jpeg';
  /** kích thước GỐC px — dùng để giữ tỉ lệ khi thu về ô thumbnail. */
  wPx: number;
  hPx: number;
}

/**
 * ⭐ 06/09 — DẤU VẾT SỬA TAY (lane ĐẦU RA NÓI THẬT, `docs/CHUAN-DAU-RA-NGHE.md` §3 + §7).
 *
 * Soi file thật 06/09 bắt được lỗi NÓI SAI nặng nhất của cả đường xuất: người dùng sửa tay
 * 12,76 → 20 m² trên màn, MÀN HÌNH nói thật (chấm hổ phách + "⚠ máy 12.76"), nhưng TỆP ghi
 * `F2=20` **y hệt một ô đo được**, và `12.76` không còn ở đâu trong zip. Thầu nhận bảng
 * 27.000.000đ mà không một dấu vết nào cho biết có người đã đè lên 17.226.000đ của máy.
 *
 * ⇒ Ba cột cuối bảng, LUÔN có (không đổi theo dữ liệu — bảng ổn định giữa các lần xuất, so được):
 *   · `Nguồn số`         — "Đo được" / "Người sửa tay". Đọc là biết ngay, không cần hỏi ai.
 *   · `Số máy: khối lượng` / `Số máy: đơn giá (đ)` — giá trị MÁY đã tính TRƯỚC khi bị đè.
 *     Trống khi ô đó không bị đè: điền lại số y hệt cột bên trái chỉ là nhiễu, còn ô trống ở
 *     đây TỰ GIẢI THÍCH ("Đo được" ⇒ không có số máy nào khác).
 * Kèm dòng `TỔNG theo số máy` (chỉ khi bảng có ≥1 ô sửa tay) để chênh lệch đọc được ở cấp tổng.
 *
 * ⛔ KHÔNG đổi con số người dùng đã sửa — người quyết cuối [T5]; máy chỉ không được GIẤU.
 * ⛔ Tên cột cố ý KHÔNG phải "Khối lượng"/"Đơn giá" trần — `lib/present-editor/boq-xlsx-import.ts`
 *    nhập lại chính file này, hai cột trùng từ khoá là bộ đoán cột nuốt nhầm (test canh: nhập lại
 *    file có 13 cột vẫn map đúng 5 cột dữ liệu gốc).
 */
const HEADERS = [
  'Mã vật liệu', 'Tên vật liệu', 'NCC', 'Mã SP', 'Ảnh',
  'Khối lượng', 'Đơn vị', 'Đơn giá (đ)', 'Hao hụt (%)', 'Thành tiền (đ)',
  'Nguồn số', 'Số máy: khối lượng', 'Số máy: đơn giá (đ)',
];
const COL_WIDTHS = [16, 30, 20, 14, 12, 14, 10, 16, 12, 18, 16, 18, 20];
const COL_AMOUNT = 10; // cột "Thành tiền" (1-based) — dải SUM của dòng tổng
const COL_IMAGE0 = 4; // cột "Ảnh", 0-based — nơi neo thumbnail

/** Nhãn cột `Nguồn số` — đúng 2 giá trị, không có nấc thứ ba. */
export const NGUON_SO = { MAY: 'Đo được', TAY: 'Người sửa tay' } as const;
/** Nhãn dòng tổng theo số máy — export để test mở-file khẳng định đúng chuỗi này. */
export const NHAN_TONG_SO_MAY = 'TỔNG theo số máy (trước khi sửa tay)';

/** Một ô đã bị người dùng đè: `machineValue` = số MÁY tính ra trước đó. Hình dạng khớp
 * `BoqOverrideInfo` (`lib/present-editor/boq-overrides.ts`) — cố ý khai lại ở đây thay vì import,
 * để `lib/boq` không phụ thuộc ngược lên `lib/present-editor`. */
export interface BoqOSuaTay {
  value: number;
  machineValue: number;
  at: number;
}

/** `BoqRow` kèm dấu vết sửa tay (nếu có). Mọi field thêm đều optional ⇒ `BoqResult` thuần vẫn
 * truyền vào được y như trước, không caller nào phải đổi. */
export type BoqRowCoDauVet = BoqRow & {
  m2Override?: BoqOSuaTay;
  donGiaOverride?: BoqOSuaTay;
};

/** Ô ảnh trong bảng: cao 48px. Ảnh thu theo tỉ lệ để lọt trong hộp 64×48 px. */
const THUMB_BOX_W_PX = 64;
const THUMB_BOX_H_PX = 48;
const IMAGE_ROW_HEIGHT_PT = 40; // 48px ≈ 36pt + đệm

/** Thành tiền TÍNH LẠI TỪ SỐ MÁY — dùng đúng công thức của `compute.ts`
 * (`round(khốiLượng × (1 + haoHụt%) × đơnGiá)`), chỉ thay hai đầu vào bằng giá trị máy đã tính
 * trước khi bị đè. Ô nào không bị đè thì giá trị máy CHÍNH LÀ giá trị đang hiện. */
function thanhTienTheoSoMay(row: BoqRowCoDauVet): number {
  const qtyMay = row.m2Override ? row.m2Override.machineValue : row.qty;
  const giaMay = row.donGiaOverride ? row.donGiaOverride.machineValue : row.donGia;
  return Math.round(qtyMay * (1 + row.haoHutPhanTram / 100) * giaMay);
}

function fitThumb(wPx: number, hPx: number): { w: number; h: number } {
  if (!(wPx > 0) || !(hPx > 0)) return { w: THUMB_BOX_W_PX, h: THUMB_BOX_H_PX };
  const k = Math.min(THUMB_BOX_W_PX / wPx, THUMB_BOX_H_PX / hPx);
  return { w: Math.max(1, Math.round(wPx * k)), h: Math.max(1, Math.round(hPx * k)) };
}

/**
 * Dựng buffer `.xlsx` THẬT từ 1 `BoqResult`.
 * Dùng trong route/script — vd `fs.writeFileSync(path, await boqResultToXlsxBuffer(result))`.
 *
 * `opts.images` — Map khoá theo `BoqRow.matId`. Dòng nào không có ảnh thì ô Ảnh để TRỐNG (không
 * bịa, không chèn placeholder giả). Không truyền gì ⇒ file y hệt bản trước 06/08 (không có phần
 * `drawings/`/`media/` trong zip).
 */
export async function boqResultToXlsxBuffer(
  result: Omit<BoqResult, 'rows'> & { rows: BoqRowCoDauVet[] },
  opts?: { images?: Map<string, BoqXlsxImage> },
): Promise<Uint8Array> {
  const imagesByMatId = opts?.images;
  const rows: XlsxRow[] = [];
  const images: XlsxImage[] = [];
  /** Bảng có ít nhất một ô bị người dùng đè ⇒ mới thêm dòng "TỔNG theo số máy". Bảng sạch thì
   * không thêm dòng nào — không bịa ra một con số thứ hai để người đọc phải đối chiếu vô ích. */
  let coSuaTay = false;
  let tongTheoSoMay = 0;

  rows.push({ cells: HEADERS.map((h) => ({ t: 'text' as const, v: h, style: STYLE.BOLD })) });

  for (const row of result.rows) {
    const img = imagesByMatId?.get(row.matId);
    const rowIndex = rows.length; // 0-based, đúng chỉ số dòng trong rows[] khi push xong
    // Món ĐẾM dùng định dạng số nguyên; vùng tô dùng 2 số lẻ (m²) — cùng 1 cột "Khối lượng",
    // `unit` ở cột kế bên nói rõ nó là gì (đọc `BoqRow.qty`/`unit`, không đọc `m2` đã deprecated).
    const qtyStyle = row.kind === 'count' ? STYLE.NUM_INT : STYLE.NUM_M2;
    // Dấu vết sửa tay — chỉ ĐỌC field có sẵn trên row, KHÔNG tính lại gì của người dùng.
    const suaTay = row.m2Override || row.donGiaOverride;
    if (suaTay) coSuaTay = true;
    tongTheoSoMay += thanhTienTheoSoMay(row);
    rows.push({
      heightPt: img ? IMAGE_ROW_HEIGHT_PT : undefined,
      cells: [
        { t: 'text', v: row.matId },
        { t: 'text', v: row.ten },
        { t: 'text', v: row.ncc },
        { t: 'text', v: row.ma },
        { t: 'blank' },
        { t: 'num', v: row.qty, style: qtyStyle },
        { t: 'text', v: row.unit },
        { t: 'num', v: row.donGia, style: STYLE.NUM_VND },
        { t: 'num', v: row.haoHutPhanTram, style: STYLE.NUM_M2 },
        { t: 'num', v: row.thanhTien, style: STYLE.NUM_VND },
        { t: 'text', v: suaTay ? NGUON_SO.TAY : NGUON_SO.MAY },
        row.m2Override
          ? { t: 'num', v: row.m2Override.machineValue, style: qtyStyle }
          : { t: 'blank' },
        row.donGiaOverride
          ? { t: 'num', v: row.donGiaOverride.machineValue, style: STYLE.NUM_VND }
          : { t: 'blank' },
      ],
    });
    if (img) {
      const { w, h } = fitThumb(img.wPx, img.hPx);
      images.push({ rowIndex, colIndex: COL_IMAGE0, bytes: img.bytes, ext: img.ext, wPx: w, hPx: h });
    }
  }

  // Dòng tổng cuối bảng (bold) — CHỈ cộng result.rows (đã tự loại vùng lỗi từ computeBoq, xem
  // model.ts BoqResult.totalAmount doc). SỐNG: SUM() thật trên dải "Thành tiền" của các dòng dữ
  // liệu — sửa 1 ô trong Excel/LibreOffice thì tổng tự đổi theo, không còn là số chết (B8). Bảng
  // 0 dòng thì KHÔNG có dải nào để SUM (J2:J1 vô nghĩa) → giữ số 0 tĩnh.
  const totalRowN = rows.length + 1; // 1-based
  const totalCell: XlsxCell = result.rows.length > 0
    ? {
      t: 'formula',
      f: `SUM(${cellRef(COL_AMOUNT, 2)}:${cellRef(COL_AMOUNT, totalRowN - 1)})`,
      v: result.totalAmount,
      style: STYLE.BOLD_VND,
    }
    : { t: 'num', v: result.totalAmount, style: STYLE.BOLD_VND };

  rows.push({
    cells: [
      { t: 'text', v: 'TỔNG CỘNG', style: STYLE.BOLD },
      { t: 'blank' }, { t: 'blank' }, { t: 'blank' }, { t: 'blank' },
      { t: 'blank' }, { t: 'blank' }, { t: 'blank' }, { t: 'blank' },
      totalCell,
    ],
  });

  // Chênh lệch phải đọc được Ở CẤP TỔNG, không bắt người ta tự cộng lại 3 cột dấu vết. Số TĨNH
  // (không SUM) vì nó cộng những giá trị KHÔNG nằm trong một dải cột nào của bảng — công thức giả
  // ở đây sẽ tự sai khi ai đó sửa ô trong Excel, tệ hơn là không có.
  if (coSuaTay) {
    rows.push({
      cells: [
        { t: 'text', v: NHAN_TONG_SO_MAY, style: STYLE.BOLD },
        { t: 'blank' }, { t: 'blank' }, { t: 'blank' }, { t: 'blank' },
        { t: 'blank' }, { t: 'blank' }, { t: 'blank' }, { t: 'blank' },
        { t: 'num', v: tongTheoSoMay, style: STYLE.BOLD_VND },
      ],
    });
  }

  return buildXlsxBuffer({ name: 'BOQ', colWidths: COL_WIDTHS, rows, images });
}
