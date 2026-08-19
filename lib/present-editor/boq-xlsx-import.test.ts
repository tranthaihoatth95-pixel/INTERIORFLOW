/**
 * lib/present-editor/boq-xlsx-import.test.ts — kiểm phần THUẦN của cửa nhập .xlsx vào bảng khối
 * lượng: đọc số · đoán cột · khớp mã · báo lỗi đúng dòng · dựng override. Chạy:
 *   npx tsx lib/present-editor/boq-xlsx-import.test.ts
 *   node_modules/.bin/sucrase-node lib/present-editor/boq-xlsx-import.test.ts   (đường `npm test`)
 */
import {
  parseBoqNumber, guessBoqColumns, unusedBoqColumns, buildBoqImportPlan, planToOverrides,
  describeBoqImportRow, emptyBoqColumns, type BoqImportColumns, type ParsedSheet,
} from './boq-xlsx-import';
import { overrideKey, type BoqOverrideMap } from './boq-overrides';
import type { BoqRow } from '../boq/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const row = (matId: string, ma: string, ten: string, m2: number, donGia: number): BoqRow => ({
  specId: matId, matId, ten, ncc: 'An Cường', ma, m2, qty: m2, unit: 'm2', kind: 'area',
  donGia, haoHutPhanTram: 5, thanhTien: Math.round(m2 * 1.05 * donGia), entityIds: [`h-${matId}`],
});

const BOQ: BoqRow[] = [
  row('spec-1', 'AC-1', 'Gỗ óc chó', 42.5, 1_240_000),
  row('spec-2', 'AC-2', 'Sàn gỗ sồi', 24.6, 1_250_000),
];

function sheet(headers: string[], rows: string[][]): ParsedSheet {
  return { sheetName: 'Sheet1', headers, rows };
}

console.log('\n[1] parseBoqNumber — mọi kiểu số của bảng thật');
{
  ok('"48.60" = 48.6 (dấu thập phân)', parseBoqNumber('48.60') === 48.6);
  ok('"12,5" = 12.5 (dấu phẩy thập phân kiểu VN)', parseBoqNumber('12,5') === 12.5);
  ok('"1.200.000" = 1200000 (dấu chấm nghìn)', parseBoqNumber('1.200.000') === 1_200_000);
  ok('"1,200,000 đ" = 1200000 (file app tự xuất, numFmt #,##0" đ")', parseBoqNumber('1,200,000 đ') === 1_200_000);
  ok('"1 200 000" = 1200000 (dấu cách nghìn)', parseBoqNumber('1 200 000') === 1_200_000);
  ok('"48,60 m²" = 48.6 (có đơn vị dính sau)', parseBoqNumber('48,60 m²') === 48.6);
  ok('"1.234,56" = 1234.56 (cả 2 dấu, dấu sau là thập phân)', parseBoqNumber('1.234,56') === 1234.56);
  ok('"1,234.56" = 1234.56 (kiểu Anh)', parseBoqNumber('1,234.56') === 1234.56);
  ok('"1.200" = 1200 — giới hạn CÓ CHỦ Ý (3 số sau dấu = dấu nghìn)', parseBoqNumber('1.200') === 1200);
  ok('ô trống = null', parseBoqNumber('  ') === null);
  ok('chữ = null', parseBoqNumber('chưa có giá') === null);
  ok('số âm = null (không nạp dữ liệu hỏng)', parseBoqNumber('-100000') === null);
  ok('"0" = 0 (số 0 hợp lệ, KHÁC null)', parseBoqNumber('0') === 0);
}

console.log('\n[2] guessBoqColumns — file do CHÍNH APP xuất ra phải nhận đủ 4 cột (round-trip)');
{
  const headers = ['Mã vật liệu', 'Tên vật liệu', 'NCC', 'Mã SP', 'Ảnh', 'Khối lượng', 'Đơn vị', 'Đơn giá (đ)', 'Hao hụt (%)', 'Thành tiền (đ)'];
  const c = guessBoqColumns(headers);
  ok('matId ← "Mã vật liệu" (bộ đoán chung nuốt vào ô Vật liệu — đã vá)', c.matId === 0);
  ok('ten ← "Tên vật liệu"', c.ten === 1);
  ok('ma ← "Mã SP"', c.ma === 3);
  ok('qty ← "Khối lượng" (không nằm trong từ khoá qty của kho vật liệu — đã vá)', c.qty === 5);
  ok('donGia ← "Đơn giá (đ)"', c.donGia === 7);
  ok('KHÔNG lấy nhầm "Thành tiền (đ)" làm đơn giá (cụm chặn của bộ đoán chung)', c.donGia !== 9);
  const rest = unusedBoqColumns(headers, c).map((x) => x.header);
  ok('cột không dùng nói ra đủ: NCC · Ảnh · Đơn vị · Hao hụt · Thành tiền', rest.length === 5 && rest.includes('NCC') && rest.includes('Thành tiền (đ)'));
}

console.log('\n[3] guessBoqColumns — bảng của nhà cung cấp (chữ khác, vẫn phải ra)');
{
  const c = guessBoqColumns(['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền']);
  ok('ma ← "Mã hàng"', c.ma === 1);
  ok('ten ← "Tên hàng"', c.ten === 2);
  ok('qty ← "Số lượng"', c.qty === 4);
  ok('donGia ← "Đơn giá"', c.donGia === 5);
  ok('matId không có trong bảng NCC ⇒ null (khớp bằng mã hàng)', c.matId === null);
}

console.log('\n[4] buildBoqImportPlan — khớp mã, KHÔNG đẻ hạng mục mới');
{
  const cols: BoqImportColumns = { ...emptyBoqColumns(), ma: 0, ten: 1, qty: 2, donGia: 3 };
  const s = sheet(['Mã', 'Tên', 'Khối lượng', 'Đơn giá'], [
    ['AC-1', 'Gỗ óc chó', '40', '1.300.000'],   // khớp SKU, đổi cả 2 ô
    ['AC-9', 'Đá bàn bếp', '12', '2.000.000'],  // KHÔNG có trong BOQ
    ['AC-2', 'Sàn gỗ sồi', '24,6', '1.250.000'], // y hệt số máy
  ]);
  const plan = buildBoqImportPlan(s, cols, BOQ);
  ok('dòng 1 khớp spec-1', plan.rows[0].matId === 'spec-1');
  ok('dòng 1 ghi 2 ô (khối lượng + đơn giá)', plan.rows[0].fields.length === 2);
  ok('dòng 2 không khớp ⇒ status not-found, KHÔNG có matId', plan.rows[1].status === 'not-found' && plan.rows[1].matId === null);
  ok('dòng 3 số y hệt máy ⇒ unchanged, không ghi ô nào', plan.rows[2].status === 'unchanged' && plan.rows[2].fields.length === 0);
  ok('applyCount = 1 · cellCount = 2 · unchangedCount = 1 · skipped = 1',
    plan.applyCount === 1 && plan.cellCount === 2 && plan.unchangedCount === 1 && plan.skippedCount === 1);
  ok('gom mã lạc: ["AC-9"]', plan.unmatchedCodes.length === 1 && plan.unmatchedCodes[0] === 'AC-9');
  const msg = describeBoqImportRow(plan.rows[1], 'vi') ?? '';
  ok('câu báo đúng khuôn "dòng 3: mã AC-9 không có trong BOQ"', msg.startsWith('dòng 3:') && msg.includes('AC-9') && msg.includes('không có trong BOQ'));
  ok('câu báo tiếng Anh cũng có số dòng + mã', (describeBoqImportRow(plan.rows[1], 'en') ?? '').includes('row 3') === true);
  ok('dòng khớp bình thường không sinh câu báo nào', describeBoqImportRow(plan.rows[0], 'vi') === null);
}

console.log('\n[5] khớp bằng matId (file do app xuất ra) + mã hoa/thường/thừa khoảng trắng');
{
  const cols: BoqImportColumns = { ...emptyBoqColumns(), matId: 0, ma: 1, qty: 2, donGia: 3 };
  const s = sheet(['Mã vật liệu', 'Mã SP', 'Khối lượng', 'Đơn giá'], [
    [' SPEC-2 ', 'AC-2', '30', '1.400.000'],
  ]);
  const plan = buildBoqImportPlan(s, cols, BOQ);
  ok('matId " SPEC-2 " vẫn khớp spec-2 (chuẩn hoá hoa/thường + khoảng trắng)', plan.rows[0].matId === 'spec-2');
  ok('lấy được tên trong BOQ để đối chiếu', plan.rows[0].boqTen === 'Sàn gỗ sồi');
}

console.log('\n[6] các ca phải BỎ QUA có lý do rõ');
{
  const cols: BoqImportColumns = { ...emptyBoqColumns(), ma: 0, qty: 1, donGia: 2 };
  const dupBoq: BoqRow[] = [...BOQ, row('spec-3', 'AC-1', 'Gỗ óc chó (tầng 2)', 10, 1_240_000)];
  const s = sheet(['Mã', 'Khối lượng', 'Đơn giá'], [
    ['', '10', '100000'],          // không mã
    ['AC-2', 'chưa có', 'n/a'],    // khớp nhưng không số nào đọc được
    ['AC-1', '5', '1.000.000'],    // mã trùng 2 hạng mục trong BOQ
    ['AC-2', '9', '1.000.000'],    // mã lặp trong chính file
  ]);
  const plan = buildBoqImportPlan(s, cols, dupBoq);
  ok('dòng không mã ⇒ no-code', plan.rows[0].status === 'no-code');
  ok('không số nào đọc được ⇒ no-value', plan.rows[1].status === 'no-value');
  ok('… và ghi chú rõ 2 ô hỏng', plan.rows[1].notes.includes('qty-invalid') && plan.rows[1].notes.includes('donGia-invalid'));
  ok('mã trùng 2 hạng mục BOQ ⇒ ambiguous, không đoán', plan.rows[2].status === 'ambiguous');
  ok('mã lặp trong file ⇒ duplicate (giữ lần đầu)', plan.rows[3].status === 'duplicate');
  ok('0 dòng được áp', plan.applyCount === 0 && plan.cellCount === 0);
  ok('câu báo nhập nhằng nói rõ lý do', (describeBoqImportRow(plan.rows[2], 'vi') ?? '').includes('nhiều hạng mục'));
}

console.log('\n[7] ô hỏng KHÔNG kéo chết ô lành cùng dòng');
{
  const cols: BoqImportColumns = { ...emptyBoqColumns(), ma: 0, qty: 1, donGia: 2 };
  const plan = buildBoqImportPlan(sheet(['Mã', 'KL', 'Giá'], [['AC-1', '50', 'liên hệ']]), cols, BOQ);
  ok('vẫn apply', plan.rows[0].status === 'apply');
  ok('chỉ ghi ô khối lượng', plan.rows[0].fields.length === 1 && plan.rows[0].fields[0] === 'm2');
  ok('có ghi chú đơn giá không đọc được', plan.rows[0].notes.includes('donGia-invalid'));
  ok('câu báo nói rõ ô nào hỏng', (describeBoqImportRow(plan.rows[0], 'vi') ?? '').includes('đơn giá không đọc được'));
}

console.log('\n[8] planToOverrides — ghi đúng ô, giữ override cũ của dòng ngoài file');
{
  const cols: BoqImportColumns = { ...emptyBoqColumns(), ma: 0, qty: 1, donGia: 2 };
  const s = sheet(['Mã', 'KL', 'Giá'], [
    ['AC-1', '40', '1.300.000'],
    ['AC-9', '12', '2.000.000'], // không khớp — tuyệt đối không được sinh override
  ]);
  const plan = buildBoqImportPlan(s, cols, BOQ);
  const cu: BoqOverrideMap = { [overrideKey('spec-2', 'donGia')]: { matId: 'spec-2', field: 'donGia', value: 999, at: 1 } };
  const next = planToOverrides(plan, cu, 5_000);
  ok('ghi khối lượng spec-1 = 40', next[overrideKey('spec-1', 'm2')]?.value === 40);
  ok('ghi đơn giá spec-1 = 1.300.000', next[overrideKey('spec-1', 'donGia')]?.value === 1_300_000);
  ok('dấu thời gian lấy từ caller (hàm thuần)', next[overrideKey('spec-1', 'm2')]?.at === 5000);
  ok('KHÔNG đẻ override cho mã lạc AC-9', Object.values(next).every((o) => o.matId === 'spec-1' || o.matId === 'spec-2'));
  ok('override cũ của spec-2 còn nguyên', next[overrideKey('spec-2', 'donGia')]?.value === 999);
  ok('map cũ không bị sửa tại chỗ (immutable)', Object.keys(cu).length === 1);
}

console.log('\n[9] bảng BOQ rỗng — mọi dòng đều không khớp, không nổ');
{
  const cols: BoqImportColumns = { ...emptyBoqColumns(), ma: 0, qty: 1 };
  const plan = buildBoqImportPlan(sheet(['Mã', 'KL'], [['AC-1', '5']]), cols, []);
  ok('status not-found', plan.rows[0].status === 'not-found');
  ok('planToOverrides trả về đúng map cũ', planToOverrides(plan, {}, 1) && Object.keys(planToOverrides(plan, {}, 1)).length === 0);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
