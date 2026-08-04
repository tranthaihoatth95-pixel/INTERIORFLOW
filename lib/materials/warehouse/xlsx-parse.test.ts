/**
 * lib/materials/warehouse/xlsx-parse.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/xlsx-parse.test.ts
 */
import * as XLSX from 'xlsx';
import { parseSpreadsheetFile } from './xlsx-parse';

let pass = 0;
let fail = 0;
async function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function xlsxFile(aoa: unknown[][]): File {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BangGia');
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  // Buffer<ArrayBufferLike> vs BlobPart's ArrayBufferView<ArrayBuffer>: cùng quirk kiểu lib.dom
  // đã ghi ở `components/present-editor/boq/BoqScreen.tsx` exportXlsx — buf luôn ArrayBuffer thật.
  return new File([buf as BlobPart], 'bang-gia.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function csvFile(text: string): File {
  return new File([text], 'bang-gia.csv', { type: 'text/csv' });
}

async function main() {
  // ---- xlsx thật (round-trip qua chính thư viện xlsx) ----
  {
    const file = xlsxFile([
      ['Mã SP', 'Tên', 'Giá'],
      ['A1', 'Ghế gỗ', 500000],
      ['A2', 'Bàn kính', 1200000],
    ]);
    const parsed = await parseSpreadsheetFile(file);
    await ok('xlsx: đọc đúng 3 header', parsed.headers.length === 3 && parsed.headers[0] === 'Mã SP');
    await ok('xlsx: đọc đúng 2 dòng dữ liệu', parsed.rows.length === 2);
    await ok('xlsx: dòng 1 đúng cột', parsed.rows[0][0] === 'A1' && parsed.rows[0][1] === 'Ghế gỗ');
    await ok('xlsx: số Excel đọc ra thành chuỗi hiển thị đúng', parsed.rows[0][2] === '500000');
  }

  // ---- csv ----
  {
    const file = csvFile('Mã SP,Tên,Giá\nB1,Đèn trần,300000\nB2,Rèm vải,150000\n');
    const parsed = await parseSpreadsheetFile(file);
    await ok('csv: đọc đúng header', parsed.headers.join('|') === 'Mã SP|Tên|Giá');
    await ok('csv: đọc đúng 2 dòng', parsed.rows.length === 2);
    await ok('csv: dòng 2 đúng cột', parsed.rows[1][0] === 'B2' && parsed.rows[1][1] === 'Rèm vải');
  }

  // ---- dòng trắng ở giữa/cuối bị bỏ qua ----
  {
    const file = csvFile('Tên,Giá\nC1,100\n,\nC2,200\n');
    const parsed = await parseSpreadsheetFile(file);
    await ok('bỏ qua dòng hoàn toàn trống', parsed.rows.length === 2);
  }

  // ---- file rỗng → ném lỗi rõ, không trả bảng rỗng âm thầm ----
  {
    let threw = false;
    try {
      await parseSpreadsheetFile(new File([], 'empty.csv'));
    } catch {
      threw = true;
    }
    await ok('file rỗng ném lỗi', threw);
  }

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
