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
 */

import JSZip from 'jszip';
import type { BoqResult } from './model';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
const STYLE = { NORMAL: 0, BOLD: 1, NUM_M2: 2, NUM_VND: 3, BOLD_VND: 4 } as const;

function textCell(colN: number, rowN: number, text: string, style: number = STYLE.NORMAL): string {
  return `<c r="${cellRef(colN, rowN)}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
}

function numberCell(colN: number, rowN: number, value: number, style: number): string {
  // Number.isFinite chặn NaN/Infinity lọt vào XML (ra file hỏng Excel không mở được) — nếu xảy ra
  // là lỗi lập trình ở computeBoq, không phải input xấu bình thường nên throw thẳng, không âm
  // thầm ghi 0 (giống nguyên tắc "không tính bừa" của compute.ts).
  if (!Number.isFinite(value)) throw new Error(`boqResultToXlsxBuffer: giá trị số không hợp lệ tại ${cellRef(colN, rowN)}: ${value}`);
  return `<c r="${cellRef(colN, rowN)}" s="${style}"><v>${value}</v></c>`;
}

/** Ô công thức OOXML: `<f>` là công thức sống Excel/LibreOffice tự chạy lại khi sửa dữ liệu; `<v>`
 * giữ giá trị cache (đúng bằng số ta đã tính) để file mở ra có số ngay, không cần Excel tính lại
 * trước. Dùng cho dòng TỔNG — B8, sửa lỗi "tổng là số chết" (`docs/PHIEU-TRINH-BOQ-EDITOR.md` B8). */
function formulaCell(colN: number, rowN: number, formula: string, cachedValue: number, style: number): string {
  if (!Number.isFinite(cachedValue)) throw new Error(`boqResultToXlsxBuffer: giá trị số không hợp lệ tại ${cellRef(colN, rowN)}: ${cachedValue}`);
  return `<c r="${cellRef(colN, rowN)}" s="${style}"><f>${xmlEscape(formula)}</f><v>${cachedValue}</v></c>`;
}

const HEADERS = ['Mã vật liệu', 'Tên vật liệu', 'NCC', 'Mã SP', 'Diện tích (m²)', 'Đơn giá (đ)', 'Hao hụt (%)', 'Thành tiền (đ)'];
const COL_COUNT = HEADERS.length; // 8 — khớp {matId, tên, NCC, mã, m², đơn giá, hao hụt %, thành tiền}

function buildSheetXml(result: BoqResult): string {
  const rows: string[] = [];

  // Header (row 1, bold)
  rows.push(
    `<row r="1">${HEADERS.map((h, i) => textCell(i + 1, 1, h, STYLE.BOLD)).join('')}</row>`,
  );

  let r = 2;
  for (const row of result.rows) {
    const cells = [
      textCell(1, r, row.matId),
      textCell(2, r, row.ten),
      textCell(3, r, row.ncc),
      textCell(4, r, row.ma),
      numberCell(5, r, row.m2, STYLE.NUM_M2),
      numberCell(6, r, row.donGia, STYLE.NUM_VND),
      numberCell(7, r, row.haoHutPhanTram, STYLE.NUM_M2),
      numberCell(8, r, row.thanhTien, STYLE.NUM_VND),
    ].join('');
    rows.push(`<row r="${r}">${cells}</row>`);
    r += 1;
  }

  // Dòng tổng cuối bảng (bold) — CHỈ cộng result.rows (đã tự loại vùng lỗi từ computeBoq, xem
  // model.ts BoqResult.totalAmount doc). SỐNG: SUM() thật trên dải "Thành tiền" (cột H) của các
  // dòng dữ liệu — sửa 1 ô trong Excel/LibreOffice thì tổng tự đổi theo, không còn là số chết
  // (B8). Bảng 0 dòng thì KHÔNG có dải nào để SUM (H2:H1 vô nghĩa) → giữ số 0 tĩnh.
  const totalRow = r;
  const totalCell = result.rows.length > 0
    ? formulaCell(8, totalRow, `SUM(${cellRef(8, 2)}:${cellRef(8, totalRow - 1)})`, result.totalAmount, STYLE.BOLD_VND)
    : numberCell(8, totalRow, result.totalAmount, STYLE.BOLD_VND);
  rows.push(
    `<row r="${totalRow}">${textCell(1, totalRow, 'TỔNG CỘNG', STYLE.BOLD)}${totalCell}</row>`,
  );

  const cols = Array.from({ length: COL_COUNT }, (_, i) => {
    const widths = [16, 30, 20, 14, 14, 16, 12, 18];
    return `<col min="${i + 1}" max="${i + 1}" width="${widths[i]}" customWidth="1"/>`;
  }).join('');

  return (
    XML_HEADER +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<cols>${cols}</cols>` +
    `<sheetData>${rows.join('')}</sheetData>` +
    '</worksheet>'
  );
}

const STYLES_XML =
  XML_HEADER +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="2">' +
  '<numFmt numFmtId="164" formatCode="#,##0.00"/>' +
  '<numFmt numFmtId="165" formatCode="#,##0&quot; đ&quot;"/>' +
  '</numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="5">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' + // 0 NORMAL
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' + // 1 BOLD
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' + // 2 NUM_M2
  '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' + // 3 NUM_VND
  '<xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' + // 4 BOLD_VND
  '</cellXfs>' +
  '</styleSheet>';

const WORKBOOK_XML =
  XML_HEADER +
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  '<sheets><sheet name="BOQ" sheetId="1" r:id="rId1"/></sheets>' +
  '</workbook>';

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

const CONTENT_TYPES_XML =
  XML_HEADER +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  '</Types>';

/** Dựng buffer `.xlsx` THẬT (OOXML tối thiểu, tự viết XML, KHÔNG thêm package) từ 1 `BoqResult`.
 * Dùng trong route/script — vd `fs.writeFileSync(path, await boqResultToXlsxBuffer(result))`. */
export async function boqResultToXlsxBuffer(result: BoqResult): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
  zip.file('_rels/.rels', ROOT_RELS_XML);
  zip.file('xl/workbook.xml', WORKBOOK_XML);
  zip.file('xl/_rels/workbook.xml.rels', WORKBOOK_RELS_XML);
  zip.file('xl/styles.xml', STYLES_XML);
  zip.file('xl/worksheets/sheet1.xml', buildSheetXml(result));
  return zip.generateAsync({ type: 'uint8array' });
}
