/**
 * lib/ui/so-cuc-bo.test.ts — [marker: soCucBo]
 *   node_modules/.bin/sucrase-node lib/ui/so-cuc-bo.test.ts
 *
 * Trọng tâm: THÀ KHÔNG VẼ CÒN HƠN VẼ SAI. Phần lớn ca dưới đây kiểm đúng một điều — tham số
 * vô nghĩa thì lõi trả rỗng / không hút, chứ không dựng bừa một cái thước hay một lực hít.
 * Thước sai tệ hơn không có thước: nó trông như đo được.
 */
import {
  vachThuoc,
  viTriTrenThuoc,
  hutNamCham,
  KHONG_HUT,
  xepChieu,
  phaSo,
  coHien,
  CHIEU,
  TEN_CHIEU,
} from './so-cuc-bo';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function testVachThuoc() {
  console.log('\n[1] vachThuoc — tham số vô nghĩa thì KHÔNG dựng thước');
  ok('bước = 0 → rỗng', vachThuoc(0, 100, 0).length === 0);
  ok('bước âm → rỗng', vachThuoc(0, 100, -5).length === 0);
  ok('max = min → rỗng', vachThuoc(50, 50, 1).length === 0);
  ok('max < min → rỗng', vachThuoc(100, 0, 1).length === 0);
  ok('NaN → rỗng', vachThuoc(Number.NaN, 100, 1).length === 0);
  ok('quá dày (>4000 vạch) → rỗng, thà không vẽ', vachThuoc(0, 100000, 1).length === 0);

  const v = vachThuoc(0, 100, 10, 5);
  ok('0..100 bước 10 → 11 vạch', v.length === 11);
  ok('vạch đầu là vạch chính', v[0].chinh === true);
  ok('vạch thứ 5 là vạch chính (nhịp 5)', v[5].chinh === true);
  ok('vạch thứ 3 là vạch phụ', v[3].chinh === false);
  ok('giá trị đúng thật, không làm tròn hộ', v[3].giaTri === 30);
  ok('mọi vạch chính cách nhau đúng nhịp', v.filter((x) => x.chinh).length === 3);
}

function testViTri() {
  console.log('\n[2] viTriTrenThuoc — kẹp trong [0,1]');
  ok('giữa thước → 0.5', viTriTrenThuoc(50, 0, 100) === 0.5);
  ok('dưới min → kẹp 0', viTriTrenThuoc(-20, 0, 100) === 0);
  ok('trên max → kẹp 1', viTriTrenThuoc(500, 0, 100) === 1);
  ok('khoảng suy biến → 0, không chia cho 0', viTriTrenThuoc(5, 10, 10) === 0);
}

function testHutNamCham() {
  console.log('\n[3] hutNamCham — LỰC LIÊN TỤC, không bật-tắt phựt');
  ok('không có mốc nào → không hút', hutNamCham(50, [], 10) === KHONG_HUT);
  ok('ngoài tầm → không hút', hutNamCham(50, [100, 200], 10).dangHut === false);
  ok('ngưỡng ≤ 0 → không hút', hutNamCham(50, [50], 0).dangHut === false);

  const trungKhit = hutNamCham(50, [50, 80], 10);
  ok('trùng khít → lực = 1', trungKhit.dangHut && trungKhit.luc === 1);
  ok('trùng khít → khoảng cách 0', trungKhit.khoangCach === 0);
  ok('chọn đúng mốc gần nhất', trungKhit.dich === 50);

  const nuaTam = hutNamCham(55, [50], 10);
  ok('cách nửa tầm → lực 0.5 (liên tục, không phải bật-tắt)', Math.abs(nuaTam.luc - 0.5) < 1e-9);

  const mepTam = hutNamCham(60, [50], 10);
  ok('đúng mép tầm → vẫn hút nhưng lực 0', mepTam.dangHut === true && mepTam.luc === 0);

  const nhieuMoc = hutNamCham(52, [40, 50, 55, 90], 10);
  ok('nhiều mốc trong tầm → lấy mốc GẦN NHẤT', nhieuMoc.dich === 50 || nhieuMoc.dich === 55);
  ok('mốc gần nhất của 52 là 50 (cách 2) chứ không phải 55 (cách 3)', nhieuMoc.dich === 50);
  ok('mốc vô nghĩa bị bỏ qua, không làm hỏng cả phép tính', hutNamCham(50, [Number.NaN, 51], 10).dich === 51);
}

function testXepChieu() {
  console.log('\n[4] xepChieu — chiều phụ LÙI chứ không ẨN');
  const soDo = { rong: 1200, sau: 600, cao: 750 } as const;
  const a = xepChieu(soDo, 'rong');
  ok('luôn trả đủ BA chiều, kể cả khi chỉ sửa một', a.length === 3);
  ok('đúng chiều đang sửa được nhấn', a.find((o) => o.chieu === 'rong')?.nhanManh === true);
  ok('chiều phụ không bị nhấn', a.find((o) => o.chieu === 'cao')?.nhanManh === false);
  ok('chiều phụ VẪN có giá trị (lùi, không ẩn)', a.find((o) => o.chieu === 'cao')?.giaTri === 750);

  const b = xepChieu(soDo, null);
  ok('chưa kéo chiều nào → cả ba ngang nhau', b.every((o) => !o.nhanManh));
  ok('thứ tự chiều ổn định theo CHIEU', b.map((o) => o.chieu).join(',') === CHIEU.join(','));
  ok('mọi chiều có tên tiếng Việt', CHIEU.every((c) => TEN_CHIEU[c].length > 0));
}

function testPhaSo() {
  console.log('\n[5] phaSo — hiện khi đang sửa, NÁN LẠI một nhịp, rồi lùi đi');
  ok('đang kéo → dangSua', phaSo(true, false) === 'dangSua');
  ok('vừa buông → vuaChot (nán lại cho mắt kịp đọc số cuối)', phaSo(false, true) === 'vuaChot');
  ok('không có việc gì → an', phaSo(false, false) === 'an');
  ok('đang kéo thắng vừa buông', phaSo(true, true) === 'dangSua');
  ok('pha an thì KHÔNG vẽ — số cục bộ không phải ô thông tin thường trực', coHien('an') === false);
  ok('pha dangSua thì vẽ', coHien('dangSua') === true);
  ok('pha vuaChot thì vẫn vẽ', coHien('vuaChot') === true);
}

testVachThuoc();
testViTri();
testHutNamCham();
testXepChieu();
testPhaSo();

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
