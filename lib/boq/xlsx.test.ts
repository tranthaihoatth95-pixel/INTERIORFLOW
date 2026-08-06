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

/** PNG 1×1 THẬT (không phải byte rác) — để file .xlsx sinh ra mở được bằng Excel/LibreOffice mà
 * không báo ảnh hỏng. Base64 chuẩn, giải bằng Buffer (test chạy trong Node qua sucrase-node). */
const PNG_1PX = new Uint8Array(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  ),
);

async function main() {
  const result: BoqResult = {
    rows: [
      { matId: 'spec-san-go', ten: 'Sàn gỗ công nghiệp', ncc: 'An Cường', ma: 'AC-SG-08', m2: 6, qty: 6, unit: 'm2', kind: 'area', donGia: 300_000, haoHutPhanTram: 5, thanhTien: 1_890_000, entityIds: ['h1'] },
      { matId: 'spec-gach', ten: 'Gạch "ceramic" & sứ <đặc biệt>', ncc: '', ma: '', m2: 15, qty: 15, unit: 'm2', kind: 'area', donGia: 200_000, haoHutPhanTram: 0, thanhTien: 3_000_000, entityIds: ['h2', 'h3', 'h4'] },
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

  /* ═══ [4] sheet1.xml — header tiếng Việt đủ 10 cột (06/08: +Ảnh, +Đơn vị; "Diện tích (m²)"
         đổi thành "Khối lượng" vì bảng nay có cả dòng đếm cái/bộ) ═══ */
  console.log('\n[4] header 10 cột tiếng Việt');
  const sheet = await zip.files['xl/worksheets/sheet1.xml'].async('string');
  for (const h of ['Mã vật liệu', 'Tên vật liệu', 'NCC', 'Mã SP', 'Ảnh', 'Khối lượng', 'Đơn vị', 'Đơn giá (đ)', 'Hao hụt (%)', 'Thành tiền (đ)']) {
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

  /* ═══ [7] style áp đúng — header bold(s=1), số VND dùng style tiền tệ(s=3), tổng bold-VND(s=4).
         06/08: đơn giá dời từ cột F sang H, "Thành tiền" từ H sang J (chèn Ảnh + Đơn vị). ═══ */
  console.log('\n[7] style index');
  ok('header dùng style bold (s="1")', /r="A1" t="inlineStr" s="1"/.test(sheet));
  ok('đơn giá dùng style tiền tệ (s="3")', /<c r="H2" s="3">/.test(sheet));
  ok('dòng tổng dùng style bold-VND (s="4")', /s="4"><f>SUM\(J2:J3\)<\/f><v>4890000<\/v>/.test(sheet));

  /* ═══ [7b] B8 — tổng SỐNG bằng SUM(), không phải số chết (docs/PHIEU-TRINH-BOQ-EDITOR.md B8) ═══ */
  console.log('\n[7b] B8 — dòng tổng là công thức SUM() sống');
  ok('có công thức SUM( trên cột Thành tiền', sheet.includes('<f>SUM(J2:J3)</f>'));
  ok('vẫn giữ <v> cache = tổng đúng (mở file thấy số ngay)', /<f>SUM\(J2:J3\)<\/f><v>4890000<\/v>/.test(sheet));

  /* ═══ [7c] 06/08 — cột "Đơn vị" hiện đúng đơn vị của từng dòng ═══ */
  console.log('\n[7c] cột Đơn vị');
  ok('ô đơn vị "m2" cột G', /<c r="G2" t="inlineStr" s="0"><is><t xml:space="preserve">m2<\/t>/.test(sheet));

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

  /* ═══ [9b] KHÔNG ảnh ⇒ zip KHÔNG có phần drawings/media nào (không hồi quy bản trước 06/08) ═══ */
  console.log('\n[9b] bản KHÔNG ảnh: zip sạch, không thừa part');
  ok('không có xl/media/', !entries.some((e) => e.startsWith('xl/media/')));
  ok('không có xl/drawings/', !entries.some((e) => e.startsWith('xl/drawings/')));
  ok('không có rels của sheet', !entries.includes('xl/worksheets/_rels/sheet1.xml.rels'));
  ok('sheet KHÔNG có thẻ <drawing>', !sheet.includes('<drawing'));
  ok('[Content_Types] KHÔNG khai đuôi png', !contentTypes.includes('Extension="png"'));

  /* ═══ [10] G-M3-11 — ẢNH NHÚNG THẬT: mở lại zip, kiểm đủ 5 mảnh OOXML bắt buộc ═══ */
  console.log('\n[10] ảnh nhúng vào .xlsx (G-M3-11)');
  const withImages = await boqResultToXlsxBuffer(result, {
    images: new Map([
      ['spec-san-go', { bytes: PNG_1PX, ext: 'png' as const, wPx: 100, hPx: 50 }],
    ]),
  });
  const zipImg = await JSZip.loadAsync(withImages);
  const imgEntries = Object.keys(zipImg.files).sort();
  ok('có xl/media/image1.png', imgEntries.includes('xl/media/image1.png'));
  ok('có xl/drawings/drawing1.xml', imgEntries.includes('xl/drawings/drawing1.xml'));
  ok('có xl/drawings/_rels/drawing1.xml.rels', imgEntries.includes('xl/drawings/_rels/drawing1.xml.rels'));
  ok('có xl/worksheets/_rels/sheet1.xml.rels', imgEntries.includes('xl/worksheets/_rels/sheet1.xml.rels'));

  const imgBytes = await zipImg.files['xl/media/image1.png'].async('uint8array');
  ok('byte ảnh giữ nguyên (không bị mã hoá lại)', imgBytes.length === PNG_1PX.length && imgBytes[1] === 0x50);

  const sheetImg = await zipImg.files['xl/worksheets/sheet1.xml'].async('string');
  ok('sheet có thẻ <drawing r:id="rId1"/>', sheetImg.includes('<drawing r:id="rId1"/>'));
  ok('<drawing> đứng SAU </sheetData> (đúng thứ tự schema, đảo là Excel báo hỏng)',
    sheetImg.indexOf('<drawing') > sheetImg.indexOf('</sheetData>'));
  ok('dòng có ảnh được nâng chiều cao', /<row r="2" ht="40" customHeight="1">/.test(sheetImg));

  const sheetRels = await zipImg.files['xl/worksheets/_rels/sheet1.xml.rels'].async('string');
  ok('sheet rels rId1 trỏ ../drawings/drawing1.xml', sheetRels.includes('Id="rId1"') && sheetRels.includes('Target="../drawings/drawing1.xml"'));

  const drawing = await zipImg.files['xl/drawings/drawing1.xml'].async('string');
  const drawingRels = await zipImg.files['xl/drawings/_rels/drawing1.xml.rels'].async('string');
  ok('drawing dùng r:embed="rId1"', drawing.includes('r:embed="rId1"'));
  ok('drawing rels rId1 trỏ ../media/image1.png', drawingRels.includes('Id="rId1"') && drawingRels.includes('Target="../media/image1.png"'));
  ok('ảnh neo đúng CỘT Ảnh (col 4, 0-based)', drawing.includes('<xdr:col>4</xdr:col>'));
  ok('ảnh neo đúng DÒNG của món (row 1, 0-based = dòng 2 Excel)', drawing.includes('<xdr:row>1</xdr:row>'));
  // 100×50 px lọt hộp 64×48 ⇒ hệ số min(0.64, 0.96)=0.64 ⇒ 64×32 px ⇒ EMU 609600×304800
  ok('ảnh thu theo TỈ LỆ gốc, không bóp méo (100×50 → 64×32 px)', drawing.includes('cx="609600" cy="304800"'));

  const ctImg = await zipImg.files['[Content_Types].xml'].async('string');
  ok('[Content_Types] khai Default png', ctImg.includes('<Default Extension="png" ContentType="image/png"/>'));
  ok('[Content_Types] khai Override drawing1.xml', ctImg.includes('/xl/drawings/drawing1.xml'));

  /* ═══ [11] dòng MÓN RỜI (kind:'count') xuất đúng đơn vị + số nguyên ═══ */
  console.log('\n[11] dòng món rời trong xlsx');
  const countBuf = await boqResultToXlsxBuffer({
    rows: [{ matId: 'spec-ghe', ten: 'Ghế ăn gỗ sồi', ncc: 'AA', ma: 'GH-01', m2: 8, qty: 8, unit: 'cai', kind: 'count', donGia: 1_200_000, haoHutPhanTram: 0, thanhTien: 9_600_000, entityIds: ['b1'] }],
    errors: [],
    totalAmount: 9_600_000,
  });
  const countSheet = await (await JSZip.loadAsync(countBuf)).files['xl/worksheets/sheet1.xml'].async('string');
  ok('khối lượng dùng style số NGUYÊN (s="5"), không phải m² 2 số lẻ', /<c r="F2" s="5"><v>8<\/v><\/c>/.test(countSheet));
  ok('đơn vị ghi "cai"', countSheet.includes('<t xml:space="preserve">cai</t>'));

  console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
