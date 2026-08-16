/**
 * lib/ui/tien-trinh.test.ts — [marker: tienTrinh] lõi chỉ báo tiến trình.
 *   node_modules/.bin/sucrase-node lib/ui/tien-trinh.test.ts
 *
 * Trọng tâm: CẤM BỊA PHẦN TRĂM. Phần lớn ca dưới đây kiểm đúng một điều — khi KHÔNG có số
 * thật thì lõi phải trả "không đo được", chứ không được trả 0% (0% cũng là một con số, và
 * người dùng đọc nó thành "máy đã bắt đầu mà chưa nhúc nhích").
 */
import {
  tuPhanTram,
  tuPhanSo,
  phanTramHienThi,
  ariaTienTrinh,
  chiaVach,
  cuongDoVach,
  doDaiVet,
  KHONG_DO_DUOC,
  VET_NGAN_NHAT,
} from './tien-trinh';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function testTuPhanTram() {
  console.log('\n[1] tuPhanTram — thiếu số thật thì KHÔNG đo được, không rơi về 0%');
  ok('undefined → không đo được', tuPhanTram(undefined).doDuoc === false);
  ok('null → không đo được', tuPhanTram(null).doDuoc === false);
  ok('NaN → không đo được', tuPhanTram(Number.NaN).doDuoc === false);
  ok('Infinity → không đo được', tuPhanTram(Number.POSITIVE_INFINITY).doDuoc === false);
  ok('-Infinity → không đo được', tuPhanTram(Number.NEGATIVE_INFINITY).doDuoc === false);

  const a = tuPhanTram(0);
  ok('0 là SỐ THẬT → đo được, pct=0 (khác hẳn "không đo được")', a.doDuoc === true && a.pct === 0);
  const b = tuPhanTram(42.7);
  ok('42.7 → đo được, giữ nguyên không làm tròn ở lõi', b.doDuoc === true && b.pct === 42.7);
  const c = tuPhanTram(-30);
  ok('-30 → kẹp về 0', c.doDuoc === true && c.pct === 0);
  const d = tuPhanTram(1000);
  ok('1000 → kẹp về 100', d.doDuoc === true && d.pct === 100);
}

function testTuPhanSo() {
  console.log('\n[2] tuPhanSo — total ≤ 0 là CHƯA BIẾT TỔNG, không phải 0%');
  ok('total = 0 → không đo được (KHÔNG dùng mẹo Math.max(1,total))', tuPhanSo(0, 0).doDuoc === false);
  ok('total = -5 → không đo được', tuPhanSo(2, -5).doDuoc === false);
  ok('total = undefined → không đo được', tuPhanSo(3, undefined).doDuoc === false);
  ok('done = null → không đo được', tuPhanSo(null, 10).doDuoc === false);
  ok('total = NaN → không đo được', tuPhanSo(1, Number.NaN).doDuoc === false);

  const e = tuPhanSo(3, 12);
  ok('3/12 → đo được, 25%', e.doDuoc === true && e.pct === 25);
  const f = tuPhanSo(12, 12);
  ok('12/12 → 100%', f.doDuoc === true && f.pct === 100);
  const g = tuPhanSo(0, 12);
  ok('0/12 → đo được, 0% (đã biết tổng ⇒ có tiến trình để nói)', g.doDuoc === true && g.pct === 0);
  const h = tuPhanSo(30, 12);
  ok('30/12 → kẹp về 100, không vọt quá', h.doDuoc === true && h.pct === 100);
}

function testHienThi() {
  console.log('\n[3] phanTramHienThi — không đo được thì KHÔNG có gì để in');
  ok('không đo được → null (không phải chuỗi rỗng)', phanTramHienThi(KHONG_DO_DUOC) === null);
  ok('không đo được → tuyệt đối không chứa ký tự số', /[0-9]/.test(String(phanTramHienThi(KHONG_DO_DUOC) ?? '')) === false);
  ok('66.6% → "67%"', phanTramHienThi(tuPhanTram(66.6)) === '67%');
  ok('0% → "0%"', phanTramHienThi(tuPhanTram(0)) === '0%');
  ok('100% → "100%"', phanTramHienThi(tuPhanTram(100)) === '100%');
}

function testAria() {
  console.log('\n[4] ariaTienTrinh — indeterminate BỎ HẲN aria-valuenow (chuẩn WAI-ARIA)');
  const kd = ariaTienTrinh(KHONG_DO_DUOC, 'Đang gọi máy chủ');
  ok('không đo được → không có khoá aria-valuenow', !('aria-valuenow' in kd));
  ok('không đo được → vẫn có role=progressbar', kd.role === 'progressbar');
  ok('không đo được → vẫn có aria-label nói rõ việc gì', kd['aria-label'] === 'Đang gọi máy chủ');
  ok('không đo được → vẫn khai min/max', kd['aria-valuemin'] === 0 && kd['aria-valuemax'] === 100);

  const dd = ariaTienTrinh(tuPhanTram(48.4), 'Xuất PDF');
  ok('đo được → có aria-valuenow, làm tròn', dd['aria-valuenow'] === 48);
  ok('đo được → role/label giữ nguyên', dd.role === 'progressbar' && dd['aria-label'] === 'Xuất PDF');
}

function testChiaVach() {
  console.log('\n[5] chiaVach — mỗi vạch một đơn vị đọc được, điểm sáng nói "đang ở đâu"');
  const kd = chiaVach(KHONG_DO_DUOC, 24);
  ok('không đo được → 0 vạch sáng, không có mút', kd.soVachSang === 0 && kd.viTriMut === null);

  const zero = chiaVach(tuPhanTram(0), 24);
  ok('0% → 0 vạch sáng, không có mút', zero.soVachSang === 0 && zero.viTriMut === null);

  const chut = chiaVach(tuPhanTram(1), 24);
  ok('1% → sàn 1 vạch ("vừa bắt đầu" khác "chưa bắt đầu")', chut.soVachSang === 1 && chut.viTriMut === 0);

  const nua = chiaVach(tuPhanTram(50), 24);
  ok('50%/24 vạch → 12 vạch sáng', nua.soVachSang === 12);
  ok('50% → mút ở vạch cuối cùng đang sáng (index 11)', nua.viTriMut === 11);

  const gan = chiaVach(tuPhanTram(99.9), 24);
  ok('99.9% → KHÔNG được làm tròn thành đầy (tối đa n−1 = 23)', gan.soVachSang === 23);

  const day = chiaVach(tuPhanTram(100), 24);
  ok('100% → sáng hết 24 vạch', day.soVachSang === 24);
  ok('100% → không còn mút (xong rồi, không còn "đang ở đâu")', day.viTriMut === null);

  const be = chiaVach(tuPhanTram(50), 0);
  ok('soVach = 0 → tự nâng sàn về 1, không chia cho 0', be.soVachSang >= 0 && Number.isFinite(be.soVachSang));

  console.log('\n[6] bất biến — soVachSang luôn nằm trong 0..soVach với mọi %');
  let ngoaiKhoang = 0;
  let mutSai = 0;
  for (let p = -20; p <= 120; p += 0.5) {
    const r = chiaVach(tuPhanTram(p), 18);
    if (r.soVachSang < 0 || r.soVachSang > 18) ngoaiKhoang += 1;
    if (r.viTriMut !== null && (r.viTriMut < 0 || r.viTriMut >= r.soVachSang)) mutSai += 1;
  }
  ok('281 mẫu — 0 lần soVachSang ra ngoài 0..18', ngoaiKhoang === 0);
  ok('281 mẫu — 0 lần mút trỏ ra ngoài vùng đã sáng', mutSai === 0);
}

function testKhongCoUocLuong() {
  console.log('\n[7] lõi CỐ Ý không có hàm ước lượng thời gian còn lại');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('./tien-trinh') as Record<string, unknown>;
  const ten = Object.keys(mod);
  const nghiNgo = ten.filter((k) => /eta|conLai|uocLuong|estimate|remaining/i.test(k));
  ok(`0 hàm ước lượng ETA trong lõi (thấy: ${nghiNgo.join(', ') || 'không có'})`, nghiNgo.length === 0);
  ok('lõi chỉ xuất đúng bộ hàm đã khai', ten.length > 0);
}

function testDoDaiVet() {
  console.log('\n[8] doDaiVet — độ dài vệt SUY TỪ TỐC ĐỘ THẬT, thiếu dữ kiện thì KHÔNG đoán');
  ok('lần đầu (dt = 0) → vệt ngắn nhất, không bịa độ dài', doDaiVet(10, 0, 48) === VET_NGAN_NHAT);
  ok('dt âm → vệt ngắn nhất', doDaiVet(10, -100, 48) === VET_NGAN_NHAT);
  ok('không tiến (delta = 0) → vệt ngắn nhất', doDaiVet(0, 500, 48) === VET_NGAN_NHAT);
  ok('lùi lại (delta < 0) → vệt ngắn nhất, KHÔNG vệt ngược', doDaiVet(-8, 500, 48) === VET_NGAN_NHAT);
  ok('NaN → vệt ngắn nhất', doDaiVet(Number.NaN, 500, 48) === VET_NGAN_NHAT);
  ok('Infinity → vệt ngắn nhất', doDaiVet(10, Number.POSITIVE_INFINITY, 48) === VET_NGAN_NHAT);

  const cham = doDaiVet(1, 1000, 48); // ~0,48 vạch/giây
  const vua = doDaiVet(10, 1000, 48); // ~4,8 vạch/giây
  const nhanh = doDaiVet(40, 1000, 48); // ~19 vạch/giây
  ok(`chậm (${cham}) ≤ vừa (${vua}) ≤ nhanh (${nhanh}) — vệt DÀI RA theo tốc độ`, cham <= vua && vua <= nhanh);
  ok('chạy nhanh cho vệt dài hơn hẳn chạy chậm', nhanh > cham);
  ok('trần = 1/5 thanh — vệt không nuốt mất phần đã chạy xong', doDaiVet(100, 1, 48) <= Math.floor(48 / 5));
  ok('cực nhanh vẫn không vượt trần', doDaiVet(1e6, 1, 48) === Math.floor(48 / 5));

  console.log('\n[9] bất biến doDaiVet — mọi đầu vào đều ra số hữu hạn trong [2, n/5]');
  let sai = 0;
  for (const n of [1, 4, 16, 48, 200]) {
    const tran = Math.max(VET_NGAN_NHAT, Math.floor(n / 5));
    for (const d of [-5, 0, 0.1, 3, 50, 100, 1e9]) {
      for (const dt of [-1, 0, 1, 16, 500, 5000]) {
        const v = doDaiVet(d, dt, n);
        if (!Number.isFinite(v) || v < VET_NGAN_NHAT || v > tran) sai += 1;
      }
    }
  }
  ok('210 tổ hợp — 0 lần ra ngoài khoảng', sai === 0);
}

function testCuongDoVach() {
  console.log('\n[10] cuongDoVach — sáng nhất ở ĐẦU MÚT, nguội dần về sau');
  ok('đúng ở mút → 1 (chói nhất = chỗ việc đang diễn ra)', cuongDoVach(20, 20, 5) === 1);
  ok('vạch ngay sau mút → nhỏ hơn 1 nhưng > 0', cuongDoVach(19, 20, 5) > 0 && cuongDoVach(19, 20, 5) < 1);
  ok('giảm ĐỀU: cách 1 sáng hơn cách 2', cuongDoVach(19, 20, 5) > cuongDoVach(18, 20, 5));
  ok('ngoài vệt → 0 (đã nguội về màu nền, KHÔNG phải tắt)', cuongDoVach(10, 20, 5) === 0);
  ok('vạch CHƯA chạy tới (i > mút) → 0 — vệt chỉ nằm PHÍA SAU, đó là tin "đi hướng nào"', cuongDoVach(25, 20, 5) === 0);

  console.log('\n[11] ⭐ XONG thì KHÔNG có vệt — vệt là dấu hiệu ĐANG CÓ VIỆC, không phải trang trí');
  const day = chiaVach(tuPhanTram(100), 48);
  ok('100% → viTriMut = null', day.viTriMut === null);
  let tongSang = 0;
  for (let i = 0; i < 48; i += 1) tongSang += cuongDoVach(i, day.viTriMut, 5);
  ok('100% → tổng cường độ vệt = 0 (không vạch nào chói)', tongSang === 0);
  const chua = chiaVach(tuPhanTram(0), 48);
  let tong0 = 0;
  for (let i = 0; i < 48; i += 1) tong0 += cuongDoVach(i, chua.viTriMut, 5);
  ok('0% → tổng cường độ vệt = 0 (chưa có việc gì đang xảy ra)', tong0 === 0);
  const khongDo = chiaVach(KHONG_DO_DUOC, 48);
  let tongKd = 0;
  for (let i = 0; i < 48; i += 1) tongKd += cuongDoVach(i, khongDo.viTriMut, 5);
  ok('không đo được → tổng cường độ vệt = 0 (thanh vạch không dùng tới)', tongKd === 0);

  console.log('\n[12] bất biến cuongDoVach — luôn nằm trong [0,1], đơn điệu giảm về phía sau');
  let ngoai = 0;
  let khongDonDieu = 0;
  for (const dai of [1, 2, 5, 9]) {
    const mut = 30;
    let truoc = cuongDoVach(mut, mut, dai);
    for (let i = mut - 1; i >= 0; i -= 1) {
      const v = cuongDoVach(i, mut, dai);
      if (!(v >= 0 && v <= 1)) ngoai += 1;
      if (v > truoc) khongDonDieu += 1;
      truoc = v;
    }
  }
  ok('0 lần ra ngoài [0,1]', ngoai === 0);
  ok('0 lần sáng NGƯỢC lên (càng xa mút càng không được sáng hơn)', khongDonDieu === 0);
}

testTuPhanTram();
testTuPhanSo();
testHienThi();
testAria();
testChiaVach();
testKhongCoUocLuong();
testDoDaiVet();
testCuongDoVach();

console.log(`\n${fail === 0 ? '✅' : '❌'} tien-trinh: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
