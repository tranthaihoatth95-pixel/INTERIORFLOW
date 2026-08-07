/**
 * lib/ffe/item.test.ts — khoá 3 hành vi của "một món rời" mà trước 06/08 vòng 3 KHÔNG có test
 * nào (file `item.ts` là hợp đồng dùng chung của FF&E · BOQ · cửa nhập Excel · khối Bảng món,
 * nhưng test của nó nằm rải trong test của các tầng gọi nó, không có chỗ nào khoá chính nó).
 * Chạy: node_modules/.bin/sucrase-node lib/ffe/item.test.ts
 *
 * Thứ file này khoá:
 *  ① `normalizeQty` đọc số bằng ĐÚNG cỗ máy chung `parse-number.ts`, không phải bộ đọc riêng;
 *  ② `isCountUnit` nhận đủ mọi đơn vị ĐẾM mà chính app mời người dùng chọn;
 *  ③ `groupByRoom` không tách một phòng thành nhiều nhóm vì khác cách gõ phím.
 */
import { normalizeQty, isCountUnit, groupByRoom, makeFfeItem, FFE_COUNT_UNITS, __resetFfeIdSeq } from './item';
import { parseNumberCell } from './parse-number';
import { FFE_UNIT_OPTIONS } from '../nodes/defs/ffe-table';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ═══ [1] MỘT cỗ máy đọc số, không hai ═══
 * Đo được trên bản trước: `normalizeQty('1.200','cai') = 1` · `('2,450','cai') = 2` ·
 * `('1.234.567','cai') = null` — trong khi `parseNumberCell('1.200') = 1200` từ lâu. Hậu quả đã
 * chạy thật: hồ sơ FF&E ra `1.2 m2 × 250.000 = 300.000đ` thay vì `1200 × 250.000 =
 * 300.000.000đ`, **0 lỗi 0 cảnh báo** — sai 1000 lần mà bảng trông bình thường. */
console.log('\n[1] normalizeQty đọc số bằng đúng cỗ máy chung parse-number.ts');
{
  ok('"1.200" → 1200 (trước: 1)', normalizeQty('1.200', 'cai') === 1200);
  ok('"2,450" → 2450 (trước: 2)', normalizeQty('2,450', 'cai') === 2450);
  ok('"1.234.567" → 1234567 (trước: null)', normalizeQty('1.234.567', 'cai') === 1_234_567);
  ok('"1.234,5" với đơn vị ĐO → 1234.5 (trước: null)', normalizeQty('1.234,5', 'm2') === 1234.5);
  ok('"12 cái" → 12 (đuôi không đổi độ lớn)', normalizeQty('12 cái', 'cai') === 12);

  // ...và mọi dạng NHẬP NHẰNG vẫn bị TỪ CHỐI, không đoán bừa (luật của parse-number).
  ok('"2.45tr" → null (trước: 2 — sai độ lớn, im lặng)', normalizeQty('2.45tr', 'cai') === null);
  ok('"50k" → null (trước: 50)', normalizeQty('50k', 'cai') === null);
  ok('"(1.500)" → null: số ÂM kế toán, KHÔNG thành +2 như trước', normalizeQty('(1.500)', 'cai') === null);
  ok('"khoảng chục cái" → null', normalizeQty('khoảng chục cái', 'cai') === null);
  ok('ô TRỐNG → null ("chưa khai", caller tự đặt mặc định)', normalizeQty('', 'cai') === null);

  // Số truyền vào sẵn kiểu `number` (lib/ffe/sheet.ts, lib/boq/compute.ts) đi thẳng, không đổi.
  ok('số 3 với đơn vị đếm → 3', normalizeQty(3, 'cai') === 3);
  ok('số 2.6 với đơn vị ĐẾM → làm tròn 3', normalizeQty(2.6, 'cai') === 3);
  ok('số 2.6 với đơn vị ĐO → giữ 2.6', normalizeQty(2.6, 'm2') === 2.6);
  ok('số ÂM → null', normalizeQty(-1, 'cai') === null);
  ok('NaN → null', normalizeQty(Number.NaN, 'cai') === null);

  // Hai đường đọc PHẢI ra cùng một kết quả — đây chính là điều "một cỗ máy" nghĩa là gì.
  for (const v of ['1.200', '2,450', '2.450.000 đ', '1.234,5', '1,234.5', '2 450 000', '12 cái']) {
    ok(`"${v}": normalizeQty khớp parseNumberCell`, normalizeQty(v, 'm2') === parseNumberCell(v));
  }
}

/* ═══ [2] đơn vị ĐẾM phải phủ đúng dropdown của chính app ═══
 * Đo được: `FFE_UNIT_OPTIONS` (`lib/nodes/defs/ffe-table.ts`) mời chọn 'tấm' và tự khai "4 đơn vị
 * đầu là ĐẾM", nhưng `isCountUnit('tấm') = false` ⇒ chọn 'tấm' thì số lượng KHÔNG bị ép nguyên
 * (`normalizeQty('2.6','tấm') = 2.6`) và BOQ ném cảnh báo "IF chưa biết đơn vị này" cho đúng đơn
 * vị IF vừa mời chọn. */
console.log('\n[2] isCountUnit phủ đủ đơn vị ĐẾM trong dropdown của chính app');
{
  ok("'tấm' là đơn vị ĐẾM (trước: false)", isCountUnit('tấm'));
  ok("'cặp' là đơn vị ĐẾM (trước: false)", isCountUnit('cặp'));
  ok("'cái'/'bộ'/'chiếc' không hồi quy", isCountUnit('cái') && isCountUnit('bộ') && isCountUnit('chiếc'));
  ok("hoa/thường/không dấu đều nhận ('TẤM', 'tam')", isCountUnit('TẤM') && isCountUnit('tam'));
  ok("'tấm' ⇒ số lượng bị ép NGUYÊN (2.6 → 3)", normalizeQty(2.6, 'tấm') === 3);

  // ⛔ đơn vị ĐO tuyệt đối không được lọt vào bộ đếm
  for (const u of ['md', 'm', 'm2', 'm3', 'kg', 'lít']) ok(`'${u}' KHÔNG phải đơn vị đếm`, !isCountUnit(u));

  // Chốt ràng buộc 2 file: 4 đơn vị đầu của dropdown phải ĐẾM, 3 đơn vị sau phải ĐO.
  const dem = FFE_UNIT_OPTIONS.slice(0, 4);
  const do_ = FFE_UNIT_OPTIONS.slice(4);
  ok(`4 đơn vị đầu dropdown (${dem.join('/')}) đều là ĐẾM — khớp comment ffe-table.ts`, dem.every((u) => isCountUnit(u)));
  ok(`3 đơn vị sau (${do_.join('/')}) đều KHÔNG phải đếm`, do_.every((u) => !isCountUnit(u)));
  ok('FFE_COUNT_UNITS không lẫn đơn vị đo', !(FFE_COUNT_UNITS as readonly string[]).includes('md'));
}

/* ═══ [3] groupByRoom — một phòng là MỘT nhóm ═══
 * Đo được: "Phòng khách" · "phòng khách" · "Phòng  khách" (hai dấu cách) ra **3 nhóm** ⇒ hồ sơ
 * FF&E tách một phòng thành 3 mục kèm 3 dòng "Cộng…". Bảng đến từ nhiều nguồn (gõ tay + Excel +
 * bốc từ ảnh) thì đây là ca mặc định, không phải ca hiếm. */
console.log('\n[3] groupByRoom gộp đúng 1 phòng, nhãn theo bản gặp ĐẦU TIÊN');
{
  __resetFfeIdSeq();
  const mk = (room: string | undefined, name: string) => makeFfeItem({ name, room, source: 'manual' });
  const g = groupByRoom([
    mk('Phòng khách', 'A'), mk('phòng khách', 'B'), mk('Phòng  khách', 'C'), mk(' Phòng khách ', 'D'),
  ]);
  ok('4 cách gõ → ĐÚNG 1 nhóm (trước: 3)', g.size === 1);
  ok('đủ 4 món trong nhóm, không rơi món nào', g.get('Phòng khách')?.length === 4);
  ok('nhãn giữ nguyên bản gặp ĐẦU TIÊN, không tự viết hoa lại', [...g.keys()][0] === 'Phòng khách');

  const g2 = groupByRoom([mk('phòng ngủ 1', 'A'), mk('Phòng ngủ 1', 'B')]);
  ok('bản đầu viết thường thì nhãn cũng viết thường (không sửa chữ của người dùng)', [...g2.keys()][0] === 'phòng ngủ 1');

  // Phòng KHÁC nhau vẫn phải tách — không gộp quá tay.
  const g3 = groupByRoom([mk('Phòng khách', 'A'), mk('Phòng ngủ', 'B'), mk(undefined, 'C'), mk('   ', 'D')]);
  ok('phòng khác nhau vẫn tách đủ nhóm', g3.size === 3);
  ok('món chưa khai phòng gom vào khoá rỗng (caller hiện "Chưa gán phòng")', g3.get('')?.length === 2);
  ok('thứ tự nhóm = thứ tự gặp lần đầu', [...g3.keys()].join('|') === 'Phòng khách|Phòng ngủ|');

  // KHÔNG bỏ dấu: "Phong khach" là cách viết khác, không tự quyết hộ người dùng.
  ok('có dấu ≠ không dấu (không gộp bừa)', groupByRoom([mk('Phòng khách', 'A'), mk('Phong khach', 'B')]).size === 2);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
