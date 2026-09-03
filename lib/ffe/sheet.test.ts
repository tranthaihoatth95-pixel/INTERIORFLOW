/**
 * lib/ffe/sheet.test.ts — hồ sơ FF&E nhiều món (G-M3-04). Chạy:
 *   node_modules/.bin/sucrase-node lib/ffe/sheet.test.ts
 * Phần .xlsx MỞ LẠI file zip bằng chính jszip (cùng cách `lib/boq/xlsx.test.ts` làm) — không chỉ
 * tin chuỗi trả về.
 */
import JSZip from 'jszip';
import { buildFfeSheet, ffeSheetToXlsxBuffer, FFE_NO_ROOM_LABEL, FFE_SHEET_HEADERS } from './sheet';
import { makeFfeItem, __resetFfeIdSeq, type FfeItem } from './item';
import { buildImportRows, buildFfeTable } from '../materials/warehouse/apply-import';
import { guessMapping } from '../materials/warehouse/column-mapping';
import { matchImagesForRows } from '../materials/warehouse/image-match';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const PNG_1PX = new Uint8Array(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  ),
);

__resetFfeIdSeq();

const ghe = makeFfeItem({
  id: 'ffe_ghe', name: 'Ghế ăn gỗ sồi', source: 'library', sku: 'NX-GH-01', vendor: 'Nhà Xinh',
  room: 'Phòng ăn', qty: 8, unit: 'cai', priceVnd: 1_200_000,
  w: 450, d: 500, hUp: 820, materials: ['gỗ sồi'], finish: 'sơn PU mờ', colorHex: '#8B5A2B',
  imageAssetId: 'asset-ghe',
});
const ban = makeFfeItem({
  id: 'ffe_ban', name: 'Bàn ăn 8 chỗ', source: 'manual', vendor: 'Nhà Xinh',
  room: 'Phòng ăn', qty: 1, unit: 'cai', priceVnd: 25_000_000,
});
const sofa = makeFfeItem({
  id: 'ffe_sofa', name: 'Sofa 3 chỗ', source: 'vision',
  room: 'Phòng khách', qty: 1, unit: 'cai', priceVnd: null, // CHƯA CÓ GIÁ
});
const den = makeFfeItem({
  id: 'ffe_den', name: 'Đèn thả trần', source: 'vision', qty: 3, unit: 'cai', priceVnd: 900_000,
  // KHÔNG khai room — phải hiện thành nhóm riêng, không được giấu
});

/* ═══ [1] gộp theo phòng + nhóm "Chưa gán phòng" HIỆN RA ═══ */
console.log('\n[1] gộp theo phòng, món chưa gán phòng vẫn hiện');
{
  const sheet = buildFfeSheet([ghe, ban, sofa, den]);
  ok('3 nhóm (Phòng ăn · Phòng khách · Chưa gán phòng)', sheet.groups.length === 3);
  ok('thứ tự nhóm = thứ tự gặp lần đầu', sheet.groups.map((g) => g.label).join('|') === `Phòng ăn|Phòng khách|${FFE_NO_ROOM_LABEL}`);
  ok('nhóm chưa gán phòng CÓ món, không bị nuốt', sheet.groups[2]?.rows.length === 1 && sheet.groups[2]?.rows[0]?.name === 'Đèn thả trần');
  ok('tổng số dòng = 4 (không rơi món nào)', sheet.rowCount === 4);
  ok('STT chạy liên tục qua các nhóm', sheet.groups.flatMap((g) => g.rows).map((r) => r.stt).join(',') === '1,2,3,4');
}

/* ═══ [2] tiền: chưa có giá KHÔNG coi là 0đ, phải đếm riêng ═══ */
console.log('\n[2] chưa có giá ≠ 0đ');
{
  const sheet = buildFfeSheet([ghe, ban, sofa, den]);
  // 8×1.200.000 + 25.000.000 + 3×900.000 = 9.600.000 + 25.000.000 + 2.700.000
  ok('tổng = 37.300.000 (KHÔNG cộng dòng chưa có giá như 0)', sheet.totalAmount === 37_300_000);
  ok('đếm đúng 1 món chưa có giá', sheet.missingPriceCount === 1);
  const khach = sheet.groups.find((g) => g.label === 'Phòng khách');
  ok('dòng sofa vẫn CÓ trong hồ sơ', khach?.rows.length === 1);
  ok('amount = null (không phải 0)', khach?.rows[0]?.amount === null);
  ok('subtotal nhóm đó = 0 nhưng có cờ missingPriceCount', khach?.subtotalAmount === 0 && khach?.missingPriceCount === 1);
  ok('Σ subtotal các nhóm = totalAmount', sheet.groups.reduce((s, g) => s + g.subtotalAmount, 0) === sheet.totalAmount);
}

/* ═══ [3] cột chuẩn ngành đủ 12, có ô DUYỆT SX ═══ */
console.log('\n[3] 12 cột chuẩn ngành');
{
  ok('đủ 12 cột', FFE_SHEET_HEADERS.length === 12);
  for (const h of ['STT', 'Mã', 'Ảnh', 'Tên món', 'Quy cách / Kích thước', 'Vật liệu · Hoàn thiện', 'Nhà cung cấp', 'Đơn giá (đ)', 'Số lượng', 'Đơn vị', 'Thành tiền (đ)', 'Duyệt SX']) {
    ok(`có cột "${h}"`, (FFE_SHEET_HEADERS as readonly string[]).includes(h));
  }
  const sheet = buildFfeSheet([ghe], { approvals: { ffe_ghe: 'approved' } });
  const row = sheet.groups[0].rows[0];
  ok('mã = sku', row.code === 'NX-GH-01');
  ok('quy cách = w×d×h mm', row.spec === '450×500×820 mm');
  ok('vật liệu · hoàn thiện gộp đủ 3 phần', row.finish === 'gỗ sồi · sơn PU mờ · #8B5A2B');
  ok('trạng thái duyệt đọc từ opts', row.approval === 'approved');
  ok('mặc định là "chờ duyệt", KHÔNG tự cho là đã duyệt', buildFfeSheet([ghe]).groups[0].rows[0].approval === 'pending');
  ok('món không có mã hiện "—" thay vì rỗng', buildFfeSheet([ban]).groups[0].rows[0].code === '—');
  ok('món không có kích thước hiện "—"', buildFfeSheet([ban]).groups[0].rows[0].spec === '—');
}

/* ═══ [4] số lượng hỏng → LOẠI khỏi bảng + BÁO id, không tự thay bằng 1 ═══ */
console.log('\n[4] số lượng hỏng → báo, không đoán');
{
  const hong: FfeItem = { ...ghe, id: 'ffe_hong', qty: Number.NaN };
  const sheet = buildFfeSheet([ban, hong]);
  ok('dòng hỏng KHÔNG vào bảng', sheet.rowCount === 1);
  ok('id dòng hỏng được báo ra', sheet.invalidQtyItemIds.length === 1 && sheet.invalidQtyItemIds[0] === 'ffe_hong');
}

/* ═══ [5] số lượng đơn vị ĐẾM luôn là số nguyên (dùng chung normalizeQty của item.ts) ═══ */
console.log('\n[5] đơn vị đếm → số nguyên');
{
  const le: FfeItem = { ...ghe, id: 'ffe_le', qty: 2.6, priceVnd: 1_000_000 };
  const sheet = buildFfeSheet([le]);
  ok('2.6 cái → làm tròn 3 (không để số lẻ cái)', sheet.groups[0].rows[0].qty === 3);
  ok('thành tiền tính theo qty đã chuẩn hoá (3 × 1.000.000)', sheet.groups[0].rows[0].amount === 3_000_000);
}

/* ═══ [6] xuất .xlsx CÓ ẢNH — mở lại zip kiểm thật ═══ */
async function main() {
  console.log('\n[6] xuất .xlsx có ảnh (nối vào máy của lib/boq/xlsx.ts)');
  const sheet = buildFfeSheet([ghe, ban, sofa, den]);
  const buf = await ffeSheetToXlsxBuffer(sheet, new Map([
    ['ffe_ghe', { bytes: PNG_1PX, ext: 'png' as const, wPx: 200, hPx: 200 }],
  ]));
  const zip = await JSZip.loadAsync(buf);
  const entries = Object.keys(zip.files).sort();
  ok('có xl/media/image1.png', entries.includes('xl/media/image1.png'));
  ok('có xl/drawings/drawing1.xml', entries.includes('xl/drawings/drawing1.xml'));

  const ws = await zip.files['xl/worksheets/sheet1.xml'].async('string');
  ok('có tiêu đề hồ sơ', ws.includes('HỒ SƠ FF&amp;E'));
  ok('có dải phòng "Phòng ăn"', ws.includes('Phòng ăn — 2 dòng'));
  ok('dải "Chưa gán phòng" HIỆN trong file, không giấu', ws.includes(`${FFE_NO_ROOM_LABEL} — 1 dòng`));
  ok('dải phòng có món chưa giá nói rõ', ws.includes('Phòng khách — 1 dòng · 1 dòng CHƯA CÓ GIÁ'));
  ok('ô "chưa có giá" là CHỮ, không phải số 0', ws.includes('<t xml:space="preserve">chưa có giá</t>'));
  ok('có ô Duyệt SX', ws.includes('<t xml:space="preserve">Chờ duyệt</t>'));
  ok('có dòng cảnh báo cuối bảng về món chưa có giá', ws.includes('KHÔNG nằm trong tổng trên'));
  ok('sheet có thẻ <drawing>', ws.includes('<drawing r:id="rId1"/>'));

  const drawing = await zip.files['xl/drawings/drawing1.xml'].async('string');
  ok('ảnh neo đúng cột Ảnh (col 2, 0-based)', drawing.includes('<xdr:col>2</xdr:col>'));
  // rows: 0 tiêu đề · 1 header · 2 dải "Phòng ăn" · 3 = dòng ghế
  ok('ảnh neo đúng dòng của món ghế (row 3, 0-based)', drawing.includes('<xdr:row>3</xdr:row>'));
  // 200×200 lọt hộp 64×48 ⇒ k = 48/200 = 0.24 ⇒ 48×48 px ⇒ 457200 EMU
  ok('ảnh giữ tỉ lệ vuông (200×200 → 48×48 px)', drawing.includes('cx="457200" cy="457200"'));

  /* ═══ [7] KHÔNG ảnh vẫn ra file hợp lệ ═══ */
  console.log('\n[7] hồ sơ không ảnh vẫn xuất được');
  const plain = await ffeSheetToXlsxBuffer(sheet);
  const plainZip = await JSZip.loadAsync(plain);
  const plainEntries = Object.keys(plainZip.files);
  ok('buffer có dữ liệu', plain.length > 0);
  ok('không có media/drawings thừa', !plainEntries.some((e) => e.startsWith('xl/media/') || e.startsWith('xl/drawings/')));
  const plainWs = await plainZip.files['xl/worksheets/sheet1.xml'].async('string');
  ok('vẫn đủ 12 header', FFE_SHEET_HEADERS.every((h) => plainWs.includes(`<t xml:space="preserve">${h.replace(/&/g, '&amp;')}</t>`)));
  ok('vẫn có TỔNG CỘNG', plainWs.includes('TỔNG CỘNG'));

  /* ═══ [9] ① NGHIỆM THU GỐC CỦA HOÀ, chạy qua ĐÚNG chuỗi hàm mà nút trên UI gọi:
         bảng 5 món (có cột Ảnh) → buildImportRows → buildFfeTable → buildFfeSheet →
         ffeSheetToXlsxBuffer  ⇒ file .xlsx có ĐỦ 5 DÒNG và 5 ẢNH.
         Trước vòng kiểm phản biện, `buildFfeSheet`/`ffeSheetToXlsxBuffer` có 0 nơi gọi trong app
         ⇒ nghiệm thu này chỉ chạy được bằng script. Nay `MaterialImportWizard` (bước kết quả,
         nút "Tải hồ sơ FF&E") gọi đúng chuỗi dưới đây. ═══ */
  console.log('\n[9] ① CSV 5 món → hồ sơ .xlsx đủ 5 dòng CÓ ẢNH (nghiệm thu gốc)');
  const headers = ['Tên', 'Mã SP', 'Số lượng', 'Đơn vị', 'Phòng', 'Đơn giá', 'Ảnh'];
  const dataRows = [
    ['Ghế xoay lưới', 'CH-MESH-01', '5', 'cái', 'Phòng làm việc', '2.450.000 đ', 'ghe-xoay.jpg'],
    ['Bàn làm việc', 'TB-WORK-01', '2', 'cái', 'Phòng làm việc', '4 800 000', 'ban-lam-viec.jpg'],
    ['Tủ hồ sơ', 'CB-FILE-01', '3', 'cái', 'Phòng làm việc', '3200000 VND', 'tu-ho-so.jpg'],
    ['Đèn bàn', 'LT-DESK-01', '5', 'cái', 'Phòng làm việc', 'liên hệ', 'den-ban.jpg'],
    ['Kệ sách', 'SH-BOOK-01', '1', 'cái', 'Phòng đọc', '1.900.000', 'ke-sach.jpg'],
  ];
  const parsed = { sheetName: 'Sheet1', headers, rows: dataRows };
  const mapping = guessMapping(headers);
  ok('cột "Ảnh" được ghép', mapping.image === 6);
  const importRows = buildImportRows(parsed, mapping);
  ok('5/5 dòng qua được (ô giá "liên hệ" KHÔNG làm rơi dòng — ⑥)', importRows.filter((r) => !r.error).length === 5);
  ok('dòng "liên hệ" có cảnh báo', importRows[3].warnings.length === 1);
  ok('giá "2.450.000 đ" đọc đúng', importRows[0].payload?.priceVnd === 2_450_000);

  const table = buildFfeTable(importRows, 'FF&E test');
  ok('bảng món giữ đủ 5 món (outcome.table — ③)', table.items.length === 5);

  // Ghép ảnh theo ĐÚNG cách wizard làm (cột Ảnh trước, SKU sau)
  const files = ['ghe-xoay.jpg', 'ban-lam-viec.jpg', 'tu-ho-so.jpg', 'den-ban.jpg', 'ke-sach.jpg']
    .map((n) => new File([PNG_1PX as BlobPart], n, { type: 'image/png' }));
  const byRow = matchImagesForRows(files, importRows.map((r) => ({ rowIndex: r.rowIndex, sku: r.payload?.sku, imageRef: r.imageRef })));
  ok('5/5 món ghép được ảnh (trước: 0/5 — ②)', byRow.size === 5);

  const imgMap = new Map<string, { bytes: Uint8Array; ext: 'png'; wPx: number; hPx: number }>();
  for (const r of importRows) {
    const f = byRow.get(r.rowIndex);
    if (f && r.ffe) imgMap.set(r.ffe.id, { bytes: PNG_1PX, ext: 'png', wPx: 100, hPx: 100 });
  }
  const e2eSheet = buildFfeSheet(table.items, { title: 'HỒ SƠ FF&E' });
  ok('hồ sơ đủ 5 dòng', e2eSheet.rowCount === 5);
  ok('gộp đúng 2 phòng', e2eSheet.groups.length === 2);
  ok('món "liên hệ" hiện là CHƯA CÓ GIÁ, không phải 0đ', e2eSheet.missingPriceCount === 1);
  // 5×2.450.000 + 2×4.800.000 + 3×3.200.000 + 1×1.900.000 = 12.250.000+9.600.000+9.600.000+1.900.000
  ok('tổng tiền = 33.350.000 (không cộng món chưa có giá như 0)', e2eSheet.totalAmount === 33_350_000);

  const e2eBuf = await ffeSheetToXlsxBuffer(e2eSheet, imgMap);
  const e2eZip = await JSZip.loadAsync(e2eBuf);
  // jszip liệt kê CẢ entry thư mục 'xl/media/' — lọc `.dir` để đếm đúng số FILE ảnh.
  const media = Object.keys(e2eZip.files).filter((f) => f.startsWith('xl/media/') && !e2eZip.files[f].dir);
  ok('file .xlsx nhúng ĐỦ 5 ảnh', media.length === 5);
  const e2eWs = await e2eZip.files['xl/worksheets/sheet1.xml'].async('string');
  for (const name of ['Ghế xoay lưới', 'Bàn làm việc', 'Tủ hồ sơ', 'Đèn bàn', 'Kệ sách']) {
    ok(`có dòng "${name}"`, e2eWs.includes(`<t xml:space="preserve">${name}</t>`));
  }
  const e2eDrawing = await e2eZip.files['xl/drawings/drawing1.xml'].async('string');
  ok('5 neo ảnh trong drawing', (e2eDrawing.match(/<xdr:oneCellAnchor>/g) ?? []).length === 5);

  /* ═══ [8] hồ sơ rỗng không nổ ═══ */
  console.log('\n[8] hồ sơ 0 món');
  const empty = buildFfeSheet([]);
  ok('0 nhóm, 0 dòng, tổng 0', empty.groups.length === 0 && empty.rowCount === 0 && empty.totalAmount === 0);
  const emptyBuf = await ffeSheetToXlsxBuffer(empty);
  ok('vẫn xuất được file', emptyBuf.length > 0);

  /* ═══ [9] Slice 5 — độ đảm bảo: dòng nào đã đảm bảo, dòng nào proxy; tổng tách hai lớp ═══ */
  console.log('\n[9] độ đảm bảo theo thang chung (lib/distill/assurance)');
  const items9: FfeItem[] = [
    makeFfeItem({ id: 'a9_lib', name: 'Ghế thư viện', source: 'library', specId: 'spec_1', room: 'A', qty: 2, unit: 'cai', priceVnd: 100 }),
    makeFfeItem({ id: 'a9_lib_verified', name: 'Ghế danh mục duyệt', source: 'library', specId: 'spec_2', room: 'A', qty: 1, unit: 'cai', priceVnd: 1000 }),
    makeFfeItem({ id: 'a9_vision', name: 'Sofa máy đo', source: 'vision', confidence: 'inferred', room: 'A', qty: 1, unit: 'cai', priceVnd: 10 }),
    makeFfeItem({ id: 'a9_vision_measured', name: 'Bàn máy đo được', source: 'vision', confidence: 'measured', room: 'B', qty: 1, unit: 'cai', priceVnd: 10000 }),
    makeFfeItem({ id: 'a9_manual_fix', name: 'Đèn người sửa số', source: 'vision', confidence: 'manual', room: 'B', qty: 1, unit: 'cai', priceVnd: 100000 }),
    makeFfeItem({ id: 'a9_vision_nogia', name: 'Kệ máy đoán chưa giá', source: 'vision', room: 'B', qty: 1, unit: 'cai', priceVnd: null }),
  ];
  const s9 = buildFfeSheet(items9, { specVerified: { spec_2: true } });
  const grade = (id: string) => s9.groups.flatMap((g) => g.rows).find((r) => r.item.id === id)?.assurance;
  ok('library chưa duyệt = declared', grade('a9_lib') === 'declared');
  ok('library specVerified = catalog-approved', grade('a9_lib_verified') === 'catalog-approved');
  ok('vision inferred = inferred', grade('a9_vision') === 'inferred');
  ok('vision measured = declared', grade('a9_vision_measured') === 'declared');
  ok('vision + manual = user-override', grade('a9_manual_fix') === 'user-override');
  ok('vision không confidence = inferred', grade('a9_vision_nogia') === 'inferred');
  ok('proxyRowCount toàn bảng = 2 (kể cả dòng chưa giá)', s9.proxyRowCount === 2);
  ok('nhóm A proxy 1, nhóm B proxy 1', s9.groups[0].proxyRowCount === 1 && s9.groups[1].proxyRowCount === 1);
  ok('verified = 200 + 1000 + 10000 + 100000', s9.amountByAssurance.verified === 111_200);
  ok('proxy = 10 (dòng chưa giá không cộng)', s9.amountByAssurance.proxy === 10);
  ok('BẤT BIẾN verified + proxy === totalAmount', s9.amountByAssurance.verified + s9.amountByAssurance.proxy === s9.totalAmount);
  ok('totalAmount giữ nghĩa cũ (mọi dòng có giá)', s9.totalAmount === 111_210);
  const s9b = buildFfeSheet(items9);
  ok('không truyền specVerified ⇒ món thư viện vẫn declared, không tụt xuống proxy', s9b.groups.flatMap((g) => g.rows).find((r) => r.item.id === 'a9_lib_verified')?.assurance === 'declared');
  ok('hồ sơ rỗng: amountByAssurance 0/0, proxyRowCount 0', empty.amountByAssurance.verified === 0 && empty.amountByAssurance.proxy === 0 && empty.proxyRowCount === 0);

  console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
