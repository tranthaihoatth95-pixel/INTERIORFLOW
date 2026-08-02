/**
 * lib/boq/xlsx.test.ts — round-trip qua chính jszip (KHÔNG parse DOM XML — cùng tinh thần
 * `scripts/probe-xlsx-roundtrip.ts` nhánh ziponly: kiểm entry bắt buộc + so chuỗi nội dung XML
 * sinh ra, KHÔNG khẳng định Excel thật mở được — Hoà tự mở file mẫu ở [10] để kiểm bằng mắt).
 * Chạy: node_modules/.bin/sucrase-node lib/boq/xlsx.test.ts
 */
import JSZip from 'jszip';
import { boqResultToXlsxBuffer } from './xlsx';
import type { BoqResult } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

async function main() {
  const result: BoqResult = {
    rows: [
      { matId: 'spec-san-go', ten: 'Sàn gỗ công nghiệp', ncc: 'An Cường', ma: 'AC-SG-08', m2: 6, donGia: 300_000, haoHutPhanTram: 5, thanhTien: 1_890_000, entityIds: ['h1'] },
      { matId: 'spec-gach', ten: 'Gạch "ceramic" & sứ <đặc biệt>', ncc: '', ma: '', m2: 15, donGia: 200_000, haoHutPhanTram: 0, thanhTien: 3_000_000, entityIds: ['h2', 'h3', 'h4'] },
    ],
    errors: [],
    totalAmount: 4_890_000,
  };

  const buf = await boqResultToXlsxBuffer(result);

  /* ═══ [1] buffer không rỗng ═══ */
  console.log('\n[1] buffer sinh ra');
  ok('buffer có dữ liệu', buf.length > 0);

  /* ═══ [2] load lại bằng chính jszip — cấu trúc zip hợp lệ ═══ */
  console.log('\n[2] load lại bằng jszip');
  const zip = await JSZip.loadAsync(buf);
  const entries = Object.keys(zip.files).sort();
  const required = [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/worksheets/sheet1.xml',
  ];
  for (const req of required) ok(`có entry bắt buộc "${req}"`, entries.includes(req));

  /* ═══ [3] Content_Types khai đủ 3 Override cần thiết ═══ */
  console.log('\n[3] [Content_Types].xml');
  const contentTypes = await zip.files['[Content_Types].xml'].async('string');
  ok('khai workbook.xml', contentTypes.includes('/xl/workbook.xml'));
  ok('khai sheet1.xml', contentTypes.includes('/xl/worksheets/sheet1.xml'));
  ok('khai styles.xml', contentTypes.includes('/xl/styles.xml'));

  /* ═══ [4] sheet1.xml — header tiếng Việt đủ 8 cột ═══ */
  console.log('\n[4] header 8 cột tiếng Việt');
  const sheet = await zip.files['xl/worksheets/sheet1.xml'].async('string');
  for (const h of ['Mã vật liệu', 'Tên vật liệu', 'NCC', 'Mã SP', 'Diện tích (m²)', 'Đơn giá (đ)', 'Hao hụt (%)', 'Thành tiền (đ)']) {
    ok(`có header "${h}"`, sheet.includes(`<t xml:space="preserve">${h}</t>`));
  }

  /* ═══ [5] dữ liệu số đúng giá trị (không làm tròn/lệch qua bước xuất XML) ═══ */
  console.log('\n[5] số liệu đúng');
  ok('có 6 (m²)', sheet.includes('<v>6</v>'));
  ok('có 300000 (đơn giá)', sheet.includes('<v>300000</v>'));
  ok('có 1890000 (thành tiền dòng 1)', sheet.includes('<v>1890000</v>'));
  ok('có 15 (m² gộp dòng 2)', sheet.includes('<v>15</v>'));
  ok('có tổng cuối bảng 4890000', sheet.includes('<v>4890000</v>'));
  ok('có nhãn TỔNG CỘNG', sheet.includes('TỔNG CỘNG'));

  /* ═══ [6] XML-escape tên vật liệu có ký tự đặc biệt (& " < >) ═══ */
  console.log('\n[6] escape ký tự đặc biệt trong tên vật liệu');
  ok('escape đúng, không phá cấu trúc XML', sheet.includes('Gạch &quot;ceramic&quot; &amp; sứ &lt;đặc biệt&gt;'));
  ok('KHÔNG lọt chuỗi chưa escape (sẽ phá XML)', !sheet.includes('Gạch "ceramic" & sứ <đặc biệt>'));

  /* ═══ [7] style áp đúng — header bold(s=1), số VND dùng style tiền tệ(s=3), tổng bold-VND(s=4) ═══ */
  console.log('\n[7] style index');
  ok('header dùng style bold (s="1")', /r="A1" t="inlineStr" s="1"/.test(sheet));
  ok('đơn giá dùng style tiền tệ (s="3")', /<c r="F2" s="3">/.test(sheet));
  ok('dòng tổng dùng style bold-VND (s="4")', /s="4"><v>4890000<\/v>/.test(sheet));

  /* ═══ [8] styles.xml có đủ numFmt tiền tệ + m² ═══ */
  console.log('\n[8] styles.xml');
  const styles = await zip.files['xl/styles.xml'].async('string');
  ok('có numFmt #,##0.00 (m²)', styles.includes('#,##0.00'));
  ok('có numFmt tiền VND', styles.includes('#,##0&quot; đ&quot;'));

  /* ═══ [9] BOQ rỗng (0 dòng) vẫn ra file hợp lệ — không throw, tổng = 0 ═══ */
  console.log('\n[9] BOQ rỗng vẫn xuất được');
  const emptyBuf = await boqResultToXlsxBuffer({ rows: [], errors: [], totalAmount: 0 });
  ok('buffer rỗng vẫn có dữ liệu (còn header+dòng tổng)', emptyBuf.length > 0);
  const emptyZip = await JSZip.loadAsync(emptyBuf);
  const emptySheet = await emptyZip.files['xl/worksheets/sheet1.xml'].async('string');
  ok('vẫn có header', emptySheet.includes('Mã vật liệu'));
  ok('tổng = 0', emptySheet.includes('TỔNG CỘNG') && /<v>0<\/v>/.test(emptySheet));

  console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
