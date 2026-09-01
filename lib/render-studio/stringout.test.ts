/**
 * Test `stringout.ts` — chạy: node_modules/.bin/sucrase-node lib/render-studio/stringout.test.ts
 * (nằm sẵn trên đường `npm test`: `test:sweep` gom mọi `*.test.ts`.)
 *
 * Trục chính của bộ ca này KHÔNG phải "cộng số khung có đúng không" — mà là
 * **cảnh chưa render xong thì có bị độn thành khung đen không**. Đó là chỗ một
 * bản dựng thô nói dối được về vật liệu, và là lý do module tồn tại.
 */
import {
  FPS_MAC_DINH,
  dungStringout,
  inStringout,
  maThoiGian,
} from './stringout';
import type { CanhStringout } from './stringout';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}
function no(name: string, fn: () => unknown) {
  try {
    fn();
    fail++;
    console.log('  FAIL-', name, '(không nổ)');
  } catch {
    pass++;
    console.log('  ok  -', name);
  }
}
const gan = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

const c = (id: string, soKhung: number, thuTu?: number): CanhStringout =>
  ({ id, nhan: `cảnh ${id}`, soKhung, ...(thuTu === undefined ? {} : { thuTu }) });

// ── ① Nối đuôi, không hở không chồng ─────────────────────────────────────────
console.log('① xếp nối đuôi');
{
  const s = dungStringout([c('a', 50), c('b', 25), c('c', 75)]);
  ok('fps mặc định 25', s.fps === FPS_MAC_DINH);
  ok('giữ đủ 3 cảnh', s.canh.length === 3);
  ok('cảnh đầu bắt đầu ở khung 0', s.canh[0].batDauKhung === 0);
  ok('KHÔNG hở, KHÔNG chồng — ra của cảnh trước là vào của cảnh sau',
    s.canh.every((k, i) => i === 0 || k.batDauKhung === s.canh[i - 1].ketThucKhung));
  ok('tổng khung = tổng các cảnh', s.tongKhung === 150);
  ok('tổng giây = tổng khung / fps', gan(s.tongGiay, 6));
  ok('thời lượng từng cảnh quy ra giây đúng', gan(s.canh[1].thoiLuongGiay, 1));
  ok('mốc vào quy ra giây đúng', gan(s.canh[2].batDauGiay, 3));
  ok('fps khác ⇒ cùng số khung ra thời lượng khác',
    gan(dungStringout([c('a', 50)], { fps: 50 }).tongGiay, 1));
  ok('danh sách rỗng ⇒ 0, không nổ',
    dungStringout([]).tongKhung === 0 && dungStringout([]).canh.length === 0);
}

// ── ② KHÔNG BỊA KHUNG — trục chính ───────────────────────────────────────────
console.log('② cảnh chưa xong thì BỎ RA, không độn');
{
  const s = dungStringout([c('a', 50), c('chua-xong', 0), c('b', 25)]);
  ok('cảnh 0 khung KHÔNG lên trục', s.canh.every((k) => k.id !== 'chua-xong'));
  ok('nhưng nó ĐƯỢC GỌI TÊN, không biến mất im lặng',
    s.boQua.length === 1 && s.boQua[0].id === 'chua-xong');
  ok('lý do nói rõ là chưa render xong', s.boQua[0].lyDo.includes('chưa render xong'));
  ok('tổng thời lượng KHÔNG cộng thêm khung nào cho cảnh trống', s.tongKhung === 75);
  ok('các cảnh còn lại vẫn liền mạch',
    s.canh[1].batDauKhung === s.canh[0].ketThucKhung);

  const am = dungStringout([c('x', -5), c('a', 10)]);
  ok('khung âm bị bỏ ra kèm lý do', am.boQua.length === 1 && am.boQua[0].lyDo.includes('âm'));
  ok('khung âm KHÔNG kéo lùi trục', am.tongKhung === 10);

  const le = dungStringout([c('x', 12.5), c('a', 10)]);
  ok('khung không nguyên bị bỏ ra', le.boQua.length === 1 && le.boQua[0].lyDo.includes('không nguyên'));
  ok('NaN cũng bị bỏ ra', dungStringout([c('x', NaN)]).boQua.length === 1);
  ok('mọi cảnh đều hỏng ⇒ tổng 0 và boQua đủ tên',
    dungStringout([c('x', 0), c('y', 0)]).tongKhung === 0 &&
    dungStringout([c('x', 0), c('y', 0)]).boQua.length === 2);
}

// ── ③ Thứ tự — ổn định, và người dựng thắng ──────────────────────────────────
console.log('③ thứ tự');
{
  const s = dungStringout([c('a', 10, 3), c('b', 10, 1), c('c', 10, 2)]);
  ok('sắp theo thuTu người dựng đặt',
    s.canh.map((k) => k.id).join('') === 'bca');

  const tron = dungStringout([c('a', 10), c('b', 10, 1), c('c', 10)]);
  ok('cảnh không khai thuTu xuống SAU cảnh có khai',
    tron.canh.map((k) => k.id).join('') === 'bac');
  ok('và giữ nguyên thứ tự đưa vào giữa chúng với nhau',
    tron.canh[1].id === 'a' && tron.canh[2].id === 'c');

  const hoa = dungStringout([c('a', 10, 2), c('b', 10, 2), c('c', 10, 1)]);
  ok('hoà thuTu ⇒ ỔN ĐỊNH theo thứ tự vào, không đảo bừa',
    hoa.canh.map((k) => k.id).join('') === 'cab');
  ok('thuTu âm vẫn xếp trước',
    dungStringout([c('a', 10, 1), c('b', 10, -4)]).canh[0].id === 'b');
}

// ── ④ Mã thời gian SMPTE ─────────────────────────────────────────────────────
console.log('④ maThoiGian');
ok('khung 0 ⇒ 00:00:00:00', maThoiGian(0, 25) === '00:00:00:00');
ok('24 khung @25fps vẫn trong giây đầu', maThoiGian(24, 25) === '00:00:00:24');
ok('25 khung @25fps ⇒ sang giây 1', maThoiGian(25, 25) === '00:00:01:00');
ok('90 giây @25fps ⇒ 00:01:30:00', maThoiGian(90 * 25, 25) === '00:01:30:00');
ok('một giờ @25fps ⇒ 01:00:00:00', maThoiGian(3600 * 25, 25) === '01:00:00:00');
ok('fps khác đọc ra mã khác', maThoiGian(25, 50) === '00:00:00:25');
ok('luôn đệm 2 chữ số', maThoiGian(1, 25) === '00:00:00:01');
no('khung âm ⇒ nổ, không trả chuỗi trông-như-đúng', () => maThoiGian(-1, 25));
no('khung không nguyên ⇒ nổ', () => maThoiGian(1.5, 25));
no('fps 0 ⇒ nổ', () => maThoiGian(10, 0));
no('dungStringout với fps 0 ⇒ nổ', () => dungStringout([c('a', 10)], { fps: 0 }));
no('dungStringout với fps âm ⇒ nổ', () => dungStringout([c('a', 10)], { fps: -25 }));

// ── ⑤ Bản in cho mắt người dựng ──────────────────────────────────────────────
console.log('⑤ inStringout');
{
  const s = dungStringout([c('a', 50), c('chua-xong', 0), c('b', 25)]);
  const txt = inStringout(s);
  ok('có dòng TỔNG', txt.includes('TỔNG'));
  ok('tổng in ra đúng mã thời gian', txt.includes('00:00:03:00'));
  ok('mốc vào cảnh 2 in đúng', txt.includes('00:00:02:00'));
  ok('cảnh bị bỏ ĐƯỢC IN RA — hộp rỗng phải nói ra', txt.includes('BỎ RA 1 cảnh'));
  ok('kèm lý do', txt.includes('chưa render xong'));
  ok('số dòng cảnh khớp số cảnh trên trục',
    txt.split('\n').filter((d) => /^\d{3} /.test(d)).length === 2);
  ok('không có cảnh bị bỏ ⇒ KHÔNG in khối BỎ RA',
    !inStringout(dungStringout([c('a', 10)])).includes('BỎ RA'));
}

console.log(`\nstringout.test.ts — pass ${pass} · fail ${fail}`);
if (fail > 0) process.exit(1);
