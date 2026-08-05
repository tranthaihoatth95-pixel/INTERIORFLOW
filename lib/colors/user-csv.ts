/**
 * lib/colors/user-csv.ts — VIỆC 1a: studio TỰ nạp bảng màu của mình (CSV/Excel kéo vào, hoặc
 * dán thẳng từ clipboard).
 *
 * Đây là cách DUY NHẤT bảng màu của một hãng vào được IF: **người dùng mang vào máy mình**, app
 * không phát hành kèm bảng nào (xem `types.ts` đầu file — lý do NC-16/EU database right).
 *
 * TÁI DÙNG, KHÔNG VIẾT CỬA NHẬP THỨ HAI:
 *   - Đọc tệp .xlsx/.csv đi qua `lib/materials/warehouse/xlsx-parse.ts` `parseSpreadsheetFile()`
 *     — đã có sẵn, đã xử lý đúng **bug mojibake CSV UTF-8 của SheetJS** (dấu tiếng Việt), và
 *     bản thân nó lại đi qua `lib/gateway/detect.ts` để nhận diện định dạng. Ba tầng đó không
 *     dựng lại ở đây.
 *   - Ghép cột → `ColorSource` nằm ở `build.ts` (dùng CHUNG với đường Larkbase), không nhân đôi.
 *
 * Nhánh CLIPBOARD tự parse (`parseDelimitedText`) chứ không nhờ SheetJS: dán từ Excel/Sheets ra
 * là **TSV**, dán từ tệp .csv là CSV, và người dùng VN hay gặp CSV dấu **chấm phẩy** (Excel bản
 * locale dùng dấu phẩy làm dấu thập phân). Tự dò dấu phân cách rẻ hơn và không nuốt lỗi im lặng.
 */

import { parseSpreadsheetFile } from '../materials/warehouse/xlsx-parse';
import type { ParsedGrid } from './build';

/* ═══════════════════════ ĐỌC VĂN BẢN DÁN ═══════════════════════ */

/** Dò dấu phân cách: tab → chấm phẩy → phẩy, chọn cái xuất hiện nhiều nhất ở dòng đầu. */
function detectDelimiter(firstLine: string): string {
  const counts: [string, number][] = [
    ['\t', (firstLine.match(/\t/g) || []).length],
    [';', (firstLine.match(/;/g) || []).length],
    [',', (firstLine.match(/,/g) || []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

/**
 * Parse CSV/TSV thuần (RFC 4180 phần dùng thật): ô trong nháy kép giữ nguyên dấu phân cách +
 * xuống dòng, `""` là một dấu nháy. Không dùng regex tách dòng — dán từ Excel có ô nhiều dòng.
 */
export function parseDelimitedText(text: string): ParsedGrid {
  const src = (text || '').replace(/^﻿/, ''); // BOM Excel hay chèn
  const firstLineEnd = src.search(/\r?\n/);
  const delim = detectDelimiter(firstLineEnd === -1 ? src : src.slice(0, firstLineEnd));

  const grid: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === delim) { row.push(cell); cell = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(cell); grid.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  row.push(cell);
  grid.push(row);

  const cleaned = grid.filter((r) => r.some((c) => c.trim() !== ''));
  const headerRow = cleaned.shift() ?? [];
  const headers = headerRow.map((h) => h.trim());
  const rows = cleaned.map((r) => headers.map((_, i) => (r[i] ?? '').trim()));
  return { headers, rows };
}

/** Đọc 1 tệp .xlsx/.csv → lưới thô. Ném lỗi có chữ đọc được (caller hiện lên UI). */
export async function parseColorFile(file: File): Promise<ParsedGrid> {
  const sheet = await parseSpreadsheetFile(file);
  return { headers: sheet.headers, rows: sheet.rows };
}

/* ═══════════════════════ MẪU TẢI VỀ ═══════════════════════ */

/**
 * Mẫu CSV để studio điền. Dữ liệu mẫu là **màu TỰ ĐẶT tên trung tính**, KHÔNG lấy mã/tên của hãng
 * nào — chính file mẫu cũng phải sạch (LUẬT NỀN TẢNG: IF không dính thương hiệu ai).
 * UI tải về nhớ ghép BOM `﻿` phía trước, nếu không Excel mở ra mất dấu tiếng Việt.
 */
export const COLOR_CSV_TEMPLATE = [
  'name,code,hex,brand,note',
  'Trắng ngà,S-01,#f4f1ea,,Trần và tường phòng khách',
  'Xám khói,S-02,#8d9299,,',
  'Xanh rêu,S-03,#4a5d4e,,Nhấn mảng tủ',
].join('\r\n');
