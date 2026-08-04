/**
 * lib/materials/warehouse/xlsx-parse.ts — đọc XLSX/CSV thành bảng thô (VIỆC 4). Dùng `xlsx`
 * (SheetJS) cho CẢ hai định dạng. Thuần đọc — KHÔNG ghép cột (đó là `column-mapping.ts`), KHÔNG
 * gọi API.
 *
 * Nhận diện định dạng đi qua `lib/gateway/detect.ts` (`detectFormat`) — ĐÚNG chỉ đạo phiếu
 * "ĐỌC lib/gateway/route.ts TRƯỚC... KHÔNG viết cửa nhập thứ hai": Gateway đã có bộ nhận diện
 * đuôi+magic-byte dùng chung toàn app, không tự chế lại ở đây.
 *
 * ⚠️ Bug thật bắt được lúc viết test: `XLSX.read(bytes, {type:'array'})` cho CSV đọc SAI mọi ký
 * tự có dấu tiếng Việt (mojibake "Mã" → "MÃ£") — SheetJS coi buffer CSV là binary/latin1, không
 * tự nhận UTF-8. Vì bảng giá NCC VN gần như luôn có dấu, phải TỰ giải mã UTF-8 rồi đưa CHUỖI vào
 * `XLSX.read(text, {type:'string'})` cho nhánh CSV. Nhánh XLSX (ZIP+XML) KHÔNG có bug này — XML
 * trong file tự khai UTF-8, SheetJS đọc đúng sẵn — nên vẫn dùng `{type:'array'}` như cũ.
 */
import * as XLSX from 'xlsx';
// Import TƯƠNG ĐỐI (không alias `@/...`) — quy ước bắt buộc cho mọi module có `.test.ts` chạy
// qua `sucrase-node` (KHÔNG resolve alias, xem STATUS.md sự cố `boq-group.ts` 04/08).
import { detectFormat } from '../../gateway/detect';

export interface ParsedSheet {
  /** Tên sheet đã đọc (sheet ĐẦU TIÊN của workbook — đủ cho bảng giá 1-sheet của NCC). */
  sheetName: string;
  /** Dòng đầu tiên — tiêu đề cột, nguyên văn (chưa trim/chuẩn hoá). */
  headers: string[];
  /** Các dòng dữ liệu SAU dòng tiêu đề — mỗi dòng là mảng ô theo ĐÚNG thứ tự cột của `headers`. */
  rows: string[][];
}

function gridToSheet(grid: string[][]): Omit<ParsedSheet, 'sheetName'> {
  const [headerRow, ...dataRows] = grid;
  if (!headerRow || headerRow.length === 0) throw new Error('File không có dòng tiêu đề cột.');
  const headers = headerRow.map((h) => String(h ?? '').trim());
  const rows = dataRows
    .filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''))
    .map((r) => headers.map((_, i) => String(r[i] ?? '').trim()));
  return { headers, rows };
}

/** Đọc 1 File (input[type=file] hoặc drop) thành bảng thô. Ném lỗi nếu file rỗng/hỏng/không có
 * sheet nào/không phải xlsx·csv — caller (UI) bắt và hiện thông báo, KHÔNG nuốt lỗi ở đây (import
 * sai âm thầm là lỗi chết người với dữ liệu giá, đúng luật VIỆC 2 của phiếu). */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  if (buf.byteLength === 0) throw new Error('File rỗng.');
  const bytes = new Uint8Array(buf);
  const format = detectFormat({ name: file.name, bytes: bytes.slice(0, 8192) });

  if (format === 'csv') {
    // Giải mã UTF-8 TAY — xem cảnh báo ở đầu file vì sao không đưa buffer thô cho SheetJS.
    const text = new TextDecoder('utf-8').decode(bytes);
    const wb = XLSX.read(text, { type: 'string' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error('Không đọc được nội dung CSV.');
    const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], { header: 1, raw: false, defval: '' });
    return { sheetName, ...gridToSheet(grid) };
  }

  if (format !== 'xlsx') {
    throw new Error('Chỉ nhận file .xlsx hoặc .csv — file này không đúng định dạng (kiểm lại đuôi/nội dung file).');
  }

  const wb = XLSX.read(bytes, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('Không tìm thấy sheet nào trong file.');
  // header:1 → mảng-của-mảng (giữ đúng vị trí cột kể cả ô trống), raw:false → format số/ngày
  // thành chuỗi hiển thị (không cần caller tự lo kiểu Excel serial date/number).
  const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], { header: 1, raw: false, defval: '' });
  return { sheetName, ...gridToSheet(grid) };
}
