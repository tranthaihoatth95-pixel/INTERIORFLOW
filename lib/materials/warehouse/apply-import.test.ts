/**
 * lib/materials/warehouse/apply-import.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/apply-import.test.ts
 */
import { buildImportRows, buildFfeTable, guessImportKind, parseConfidenceCell, parseNumberCell } from './apply-import';
import { guessMapping } from './column-mapping';
import type { ParsedSheet } from './xlsx-parse';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function sheet(headers: string[], rows: string[][]): ParsedSheet {
  return { sheetName: 'Sheet1', headers, rows };
}

// ---- dòng hợp lệ đầy đủ ----
{
  const s = sheet(
    ['Mã SP', 'Tên sản phẩm', 'Hãng', 'ĐVT', 'Đơn giá', 'Rộng', 'Sâu', 'Cao'],
    [['GACH-01', 'Gạch Terrazzo 60x60', 'ABC Ceramic', 'm2', '1250000', '600', '600', '10']],
  );
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('1 dòng ra 1 kết quả', rows.length === 1);
  ok('không lỗi', rows[0].error === null);
  ok('name đúng', rows[0].payload?.name === 'Gạch Terrazzo 60x60');
  ok('sku đúng', rows[0].payload?.sku === 'GACH-01');
  ok('priceVnd là số', rows[0].payload?.priceVnd === 1250000);
  ok('w/d/hUp đúng', rows[0].payload?.w === 600 && rows[0].payload?.d === 600 && rows[0].payload?.hUp === 10);
}

// ---- giá có ngăn nghìn bằng chấm (kiểu VN "1.250.000") ----
{
  const s = sheet(['Tên', 'Giá'], [['Sofa da', '15.500.000']]);
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('giá ngăn nghìn kiểu VN đọc đúng thành 15500000', rows[0].payload?.priceVnd === 15500000);
}

// ---- thiếu "Tên" (field bắt buộc) → lỗi, không tạo payload ----
{
  const s = sheet(['Tên', 'Giá'], [['', '100000']]);
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('thiếu tên → có lỗi', rows[0].error !== null);
  ok('thiếu tên → payload null', rows[0].payload === null);
}

// ---- ⑥ (KIỂM PHẢN BIỆN 06/08) giá không đọc được → NHẬN món, để giá trống, CẢNH BÁO rõ ----
// TRƯỚC: cả dòng bị vứt (`error`), mất luôn tên/mã/kích thước người ta đã gõ vì một ô phụ.
{
  const s = sheet(['Tên', 'Giá'], [['Đèn bàn', 'liên hệ']]);
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('giá chữ "liên hệ" → KHÔNG vứt dòng', rows[0].error === null && rows[0].payload !== null);
  ok('giá để TRỐNG (không đoán 0/NaN)', rows[0].payload?.priceVnd === undefined && rows[0].ffe?.priceVnd === null);
  ok('có CẢNH BÁO nói rõ (không im lặng)', rows[0].warnings.length === 1 && /Giá/.test(rows[0].warnings[0]));
}

// ---- ⑥ giá ghi kèm tiền tệ/khoảng trắng → ĐỌC ĐƯỢC (trước: vứt cả dòng) ----
{
  const s = sheet(['Tên', 'Giá'], [
    ['Ghế A', '2.450.000 đ'],
    ['Ghế B', '2450000 VND'],
    ['Ghế C', '2 450 000'],
    ['Ghế D', '2,450,000'],
    ['Ghế E', '1.234,5'],
    ['Ghế F', '1,234.5'],
  ]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  ok('"2.450.000 đ" → 2450000', rows[0].payload?.priceVnd === 2_450_000);
  ok('"2450000 VND" → 2450000', rows[1].payload?.priceVnd === 2_450_000);
  ok('"2 450 000" → 2450000', rows[2].payload?.priceVnd === 2_450_000);
  ok('"2,450,000" → 2450000', rows[3].payload?.priceVnd === 2_450_000);
  ok('"1.234,5" (kiểu VN) → 1234.5', rows[4].payload?.priceVnd === 1234.5);
  ok('"1,234.5" (kiểu Anh-Mỹ) → 1234.5', rows[5].payload?.priceVnd === 1234.5);
  ok('không dòng nào bị vứt', rows.every((r) => r.error === null));
  ok('không dòng nào bị cảnh báo oan', rows.every((r) => r.warnings.length === 0));
}

// ---- ④d nối từ cửa nhập: giá ÂM bị CHẶN NGAY, không để lọt xuống BOQ thành tiền âm ----
{
  const s = sheet(['Tên', 'Giá'], [['Ghế lỗi', '-100000']]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  ok('giá âm → dòng bị loại kèm lý do', rows[0].error !== null && /ÂM/.test(rows[0].error!));
  ok('giá âm → không có payload lọt vào kho', rows[0].payload === null);
}

// ---- ② cột "Ảnh": tên file → imageRef; URL → gắn thẳng vào món ----
{
  const s = sheet(['Tên', 'Mã', 'Ảnh'], [
    ['Ghế xoay', 'CH-MESH-01', 'ghe-xoay.jpg'],
    ['Bàn', 'TB-01', 'https://cdn.example.com/ban.png'],
  ]);
  const mapping = guessMapping(s.headers);
  ok('cột "Ảnh" ĐƯỢC ghép (trước: không có trường nào để ghép)', mapping.image === 2);
  const rows = buildImportRows(s, mapping);
  ok('tên file giữ trong imageRef', rows[0].imageRef === 'ghe-xoay.jpg');
  ok('tên file KHÔNG bị nhét vào imageUrl', rows[0].ffe?.imageUrl === undefined);
  ok('URL http gắn thẳng vào món', rows[1].ffe?.imageUrl === 'https://cdn.example.com/ban.png');
}

// ---- nhiều dòng, có dòng lỗi lẫn dòng tốt — không dòng nào làm hỏng dòng khác ----
{
  const s = sheet(
    ['Tên', 'Giá'],
    [
      ['Ghế A', '500000'],
      ['', '200000'],
      ['Ghế B', '700000'],
    ],
  );
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('3 dòng ra 3 kết quả', rows.length === 3);
  ok('dòng 1 ok', rows[0].error === null);
  ok('dòng 2 lỗi', rows[1].error !== null);
  ok('dòng 3 ok, không bị ảnh hưởng bởi dòng 2 lỗi', rows[2].error === null && rows[2].payload?.name === 'Ghế B');
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 06/08 — G-M3-05 (bảng FF&E vào TRỌN) · G-M3-07 (chọn loại) · G-M3-08 (phòng/độ tin cậy).
// ═══════════════════════════════════════════════════════════════════════════════════════════

const FFE_HEADERS = ['Tên sản phẩm', 'SKU', 'Rộng (W mm)', 'Sâu (D mm)', 'Cao (H mm)', 'Vật liệu', 'Màu sắc', 'Độ tin cậy', 'Phòng', 'Số lượng', 'ĐVT', 'Đơn giá'];

// ---- bảng FF&E: 4 trường từng rơi mất nay vào trọn ----
{
  const s = sheet(FFE_HEADERS, [
    ['Ghế lounge Volumen', 'GHE-01', '780', '820', '720', 'gỗ sồi; vải lanh', '#C79A63', 'Suy đoán', 'Phòng khách', '4', 'cái', '12500000'],
  ]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  const r = rows[0];
  ok('dòng FF&E hợp lệ', r.error === null);
  ok('VẬT LIỆU không còn rơi mất → xuống ProductSpec.materials',
    JSON.stringify(r.payload?.materials) === JSON.stringify(['gỗ sồi', 'vải lanh']));
  ok('MÀU không còn rơi mất → ProductSpec.colorHex, chuẩn hoá chữ thường', r.payload?.colorHex === '#c79a63');
  ok('PHÒNG không còn rơi mất (giữ trong món rời)', r.ffe?.room === 'Phòng khách');
  ok('ĐỘ TIN CẬY không còn rơi mất (giữ trong món rời)', r.ffe?.confidence === 'inferred');
  ok('số lượng đọc đúng', r.ffe?.qty === 4);
  ok('đơn vị đọc đúng', r.ffe?.unit === 'cái');
  ok('giá về đúng cả 2 tầng', r.payload?.priceVnd === 12500000 && r.ffe?.priceVnd === 12500000);
  ok('3 chiều về cả 2 tầng', r.payload?.hUp === 720 && r.ffe?.hUp === 720);
  ok("nguồn món rời là 'import'", r.ffe?.source === 'import');
}

// ---- số lượng gõ bậy → BÁO LỖI, không âm thầm thành 1 hay 0 ----
{
  const s = sheet(['Tên', 'Số lượng'], [['Ghế', 'khoảng chục cái'], ['Bàn', '3'], ['Đèn', '']]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  ok('số lượng là chữ → lỗi rõ', rows[0].error !== null && /Số lượng/.test(rows[0].error!));
  ok('số lượng là chữ → không tạo món', rows[0].ffe === null);
  ok('số lượng hợp lệ vẫn qua', rows[1].error === null && rows[1].ffe?.qty === 3);
  ok('ô số lượng TRỐNG → mặc định 1, không coi là lỗi', rows[2].error === null && rows[2].ffe?.qty === 1);
}

// ---- đọc chữ độ tin cậy người ta gõ trong Excel ----
{
  ok('"Đo được" → measured', parseConfidenceCell('Đo được') === 'measured');
  ok('"đã đo" → measured', parseConfidenceCell('đã đo') === 'measured');
  ok('"Suy đoán" → inferred', parseConfidenceCell('Suy đoán') === 'inferred');
  ok('"ước lượng" → inferred', parseConfidenceCell('ước lượng') === 'inferred');
  ok('"nhập tay" → manual', parseConfidenceCell('nhập tay') === 'manual');
  ok('ô trống → chưa biết (undefined)', parseConfidenceCell('') === undefined);
  // KHÔNG được đoán bừa thành 'measured': khoe "đo được" cho số ước lượng là sai nguy hiểm nhất.
  ok('chữ lạ → chưa biết, KHÔNG đoán thành measured', parseConfidenceCell('abc xyz') === undefined);
}

// ---- G-M3-07: đoán loại theo dữ liệu, không ép cứng 'material' ----
{
  const ffe = sheet(FFE_HEADERS, [
    ['Ghế', 'G1', '780', '820', '720', '', '', '', 'Khách', '4', 'cái', '1'],
    ['Bàn', 'B1', '1200', '600', '750', '', '', '', 'Khách', '1', 'bộ', '1'],
  ]);
  ok('đủ 3 chiều + đơn vị đếm ⇒ đoán NỘI THẤT', guessImportKind(ffe, guessMapping(ffe.headers)) === 'furniture');

  const gach = sheet(['Mã SP', 'Tên sản phẩm', 'ĐVT', 'Đơn giá'], [['G-01', 'Gạch Terrazzo', 'm2', '1250000']]);
  ok('bảng giá gạch (không 3 chiều) ⇒ vẫn đoán VẬT LIỆU như cũ', guessImportKind(gach, guessMapping(gach.headers)) === 'material');

  const day = sheet(['Tên', 'Rộng', 'Sâu', 'Cao', 'ĐVT'], [['Đá ốp', '600', '600', '20', 'm2']]);
  ok('có 3 chiều nhưng bán theo m² ⇒ vẫn là VẬT LIỆU', guessImportKind(day, guessMapping(day.headers)) === 'material');
}

// ---- gom cả lô thành 1 bảng món ----
{
  const s = sheet(['Tên', 'Phòng', 'Số lượng'], [['Ghế', 'Khách', '4'], ['', 'Khách', '1'], ['Đèn', 'Ngủ 1', '2']]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  const t = buildFfeTable(rows, 'FF&E — nhập từ Excel');
  ok('bảng bỏ dòng hỏng, giữ 2 món tốt', t.items.length === 2);
  ok('giữ nhãn bảng', t.label === 'FF&E — nhập từ Excel');
  ok('giữ phòng của từng món', t.items[0].room === 'Khách' && t.items[1].room === 'Ngủ 1');
}

/* ═══ 🔴 KIỂM PHẢN BIỆN VÒNG 2 (06/08) — đuôi ĐỘ LỚN bị nuốt ⇒ SỐ SAI IM LẶNG ═══
 * Bản vá "đọc được 2.450.000 đ" bóc SẠCH chữ trước khi đọc số, nên `2.45tr` ra **2,45đ** và
 * `(1.500.000)` ra **+1.500.000** (lách cả chốt giá-âm) — đều NHẬN, không một cảnh báo. Trước bản
 * vá đó cả 6 ca này bị TỪ CHỐI ồn ào. Số sai trông như đúng nguy hiểm hơn hẳn số bị từ chối. */
console.log('\n[đuôi độ lớn] cấm bóc chữ làm sai độ lớn con số');
{
  const phaiTuChoi = ['2.45tr', '2tr5', '1,5 triệu', '50k', '1e3', '50%', '1,5m', 'liên hệ', '1.234.5'];
  for (const v of phaiTuChoi) ok(`"${v}" → TỪ CHỐI (không đoán bừa)`, parseNumberCell(v) === undefined);

  const phaiDoc: [string, number][] = [
    ['2.450.000 đ', 2_450_000], ['2.450.000đ', 2_450_000], ['2450000 VND', 2_450_000], ['2 450 000', 2_450_000],
    ['1.234,5', 1234.5], ['1,234.5', 1234.5], ['12.345.678,90', 12_345_678.9], ['1500 mm', 1500], ['12 cái', 12],
  ];
  for (const [v, n] of phaiDoc) ok(`"${v}" → ${n} (không hồi quy bản vá tiền tệ)`, parseNumberCell(v) === n);

  ok('"(1.500.000)" đọc thành ÂM theo quy ước kế toán', parseNumberCell('(1.500.000)') === -1_500_000);
}

/* ═══ 🔴 VÒNG 3 (06/08) — ① MỘT cỗ máy đọc số cho cả cửa nhập lẫn số lượng ═══
 * `parseNumberCell` nay sống ở `lib/ffe/parse-number.ts` và `normalizeQty` gọi CHÍNH NÓ. Trước
 * đó ô "Số lượng" đi qua bộ đọc riêng, yếu hơn: `'1.200'` → **1** (thay vì 1200) ⇒ hồ sơ FF&E ra
 * 300.000đ thay vì 300.000.000đ, 0 lỗi 0 cảnh báo. Khoá cả 2 chiều tại đúng cửa nhập Excel. */
console.log('\n[vòng 3 ①] cột Số lượng đọc bằng đúng cỗ máy của cột Giá');
{
  const s = sheet(['Tên', 'Số lượng', 'ĐVT'], [
    ['Gạch', '1.200', 'cái'],
    ['Ván sàn', '2,450', 'cái'],
    ['Dây điện', '1.234,5', 'm'],
    ['Đèn', '50k', 'cái'],
    ['Bàn', '(1.500)', 'cái'],
  ]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  ok('"1.200" → 1200 (trước: 1 — sai 1000 lần, im lặng)', rows[0].ffe?.qty === 1200);
  ok('"2,450" → 2450 (trước: 2)', rows[1].ffe?.qty === 2450);
  ok('"1.234,5" đơn vị ĐO → 1234.5 (trước: cả dòng bị loại)', rows[2].error === null && rows[2].ffe?.qty === 1234.5);
  ok('"50k" vẫn TỪ CHỐI ồn ào (không đoán 50)', rows[3].error !== null && /Số lượng/.test(rows[3].error!));
  ok('"(1.500)" số âm kế toán → loại, KHÔNG thành +2 như trước', rows[4].error !== null);
  ok('cột Giá và cột Số lượng nay đọc y hệt nhau', parseNumberCell('1.200') === 1200);
}

/* ═══ 🔴 VÒNG 3 (06/08) — ⑦ ghép ĐÚNG cột rồi vẫn RƠI GIÁ TRỊ, im lặng ═══
 * Đo được: `normalizeColorHex('Trắng sữa'|'Xám'|'RAL 9010'|'NCS S 1000-N') = undefined` và
 * `parseConfidenceCell('Cao'|'Thấp'|'90%') = undefined` ⇒ dòng thật vào kho KHÔNG có `colorHex`,
 * `warnings: []`. Bảng giá NCC Việt gần như không bao giờ ghi mã hex ⇒ cột "Màu" người ta bỏ
 * công đưa vào bị nuốt gần như MỌI lần. */
console.log('\n[vòng 3 ⑦] màu / độ tin cậy đọc không được thì phải NÓI + giữ chữ gốc');
{
  const s = sheet(['Tên', 'Màu sắc', 'Độ tin cậy'], [
    ['Ghế', 'Trắng sữa', 'Cao'],
    ['Bàn', 'RAL 9010', '90%'],
    ['Đèn', '#C79A63', 'Suy đoán'],
  ]);
  const rows = buildImportRows(s, guessMapping(s.headers));

  ok('màu chữ → dòng VẪN được nhập (không vứt vì một ô phụ)', rows[0].error === null);
  ok('màu chữ → CÓ cảnh báo (trước: warnings rỗng)', rows[0].warnings.some((w) => /Màu "Trắng sữa"/.test(w)));
  ok('màu chữ → chữ gốc GIỮ trong Ghi chú, không bốc hơi', rows[0].payload?.note === 'Màu: Trắng sữa');
  ok('màu chữ → ô Màu vẫn TRỐNG (không đoán hex từ tên gọi)', rows[0].payload?.colorHex === undefined);
  ok('độ tin cậy chữ lạ → CÓ cảnh báo', rows[0].warnings.some((w) => /Độ tin cậy "Cao"/.test(w)));
  ok('độ tin cậy chữ lạ → chữ gốc giữ trong confidenceBasis (không nhét thêm vào note)',
    rows[0].ffe?.confidenceBasis === 'Cao' && rows[0].ffe?.confidence === undefined);

  ok('mã RAL cũng được giữ chữ + cảnh báo', rows[1].payload?.note === 'Màu: RAL 9010' && rows[1].warnings.length === 2);

  ok('màu ĐỌC ĐƯỢC thì KHÔNG cảnh báo oan, không bẩn Ghi chú',
    rows[2].payload?.colorHex === '#c79a63' && rows[2].payload?.note === undefined && rows[2].warnings.length === 0);
  ok('độ tin cậy đọc được vẫn về đúng mức', rows[2].ffe?.confidence === 'inferred');
}

// ---- ⑦ ghi chú SẴN CÓ của người dùng không bị đè, chỉ nối thêm ----
{
  const s = sheet(['Tên', 'Ghi chú', 'Màu'], [['Ghế', 'Hàng đặt 30 ngày', 'Xám']]);
  const rows = buildImportRows(s, guessMapping(s.headers));
  ok('nối vào ghi chú cũ, không ghi đè', rows[0].payload?.note === 'Hàng đặt 30 ngày · Màu: Xám');
  ok('món rời cũng mang ghi chú đã nối', rows[0].ffe?.note === 'Hàng đặt 30 ngày · Màu: Xám');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
