/** Test `ke-widget-store.ts` — chạy: node_modules/.bin/sucrase-node lib/home/ke-widget-store.test.ts
 *
 * Phần THUẦN của luật PASS (`HOME-IMPLEMENTATION-SPEC.md` §5). Test này chứng minh được
 * mắt GHI XUỐNG → ĐỌC LẠI → CÙNG MỘT SỰ THẬT ở mức dữ liệu; mắt "đóng/tải lại trang thật"
 * thì chỉ trình duyệt mới chứng minh được, và đã làm bằng tay trên app (xem báo cáo phiên).
 */
import { chuanHoa, apDung, doiCho, an, hien, khoaKe, KE_RONG, type BayKe } from './ke-widget-store';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

const CO = [{ id: 'gio' }, { id: 'mau' }, { id: 'dna' }];

console.log('① khoá lưu tách theo người dùng');
ok('hai user hai khoá', khoaKe('u1') !== khoaKe('u2'));
ok('không user vẫn có khoá hợp lệ', khoaKe(null).length > 0);

console.log('② đọc giá trị lạ KHÔNG làm vỡ màn');
eq('null', chuanHoa(null), KE_RONG);
eq('chuỗi', chuanHoa('hỏng'), KE_RONG);
eq('mảng sai kiểu bị lọc', chuanHoa({ thuTu: ['a', 3, null, 'a'], an: [] }), { thuTu: ['a'], an: [] });
eq('vừa trên kệ vừa bị ẩn ⇒ ẩn thắng', chuanHoa({ thuTu: ['a', 'b'], an: ['b'] }), { thuTu: ['a'], an: ['b'] });

console.log('③ áp bày-đã-lưu lên danh sách widget CÓ THẬT');
{
  eq('kệ rỗng ⇒ giữ nguyên thứ tự gốc', apDung(CO, KE_RONG).tren.map((w) => w.id), ['gio', 'mau', 'dna']);
  eq('thứ tự đã lưu được tôn trọng', apDung(CO, { thuTu: ['dna', 'gio', 'mau'], an: [] }).tren.map((w) => w.id), ['dna', 'gio', 'mau']);

  // widget MỚI mà bản lưu chưa biết → xếp cuối, KHÔNG biến mất
  const r = apDung(CO, { thuTu: ['dna'], an: [] });
  eq('widget mới xếp cuối, không mất', r.tren.map((w) => w.id), ['dna', 'gio', 'mau']);

  // widget đã BỎ khỏi app → rơi lặng lẽ, không để lại ô trống
  const r2 = apDung(CO, { thuTu: ['dna', 'da-xoa', 'gio'], an: [] });
  eq('widget đã bỏ khỏi app rơi lặng lẽ', r2.tren.map((w) => w.id), ['dna', 'gio', 'mau']);

  // widget bị ẩn → không lên kệ NHƯNG vẫn đếm được (§30 không mục nào biến mất im lặng)
  const r3 = apDung(CO, { thuTu: ['gio'], an: ['mau'] });
  eq('bị ẩn thì không lên kệ', r3.tren.map((w) => w.id), ['gio', 'dna']);
  eq('bị ẩn vẫn ĐẾM ĐƯỢC', r3.daAn.map((w) => w.id), ['mau']);
  eq('tổng vào = tổng ra', r3.tren.length + r3.daAn.length, CO.length);
}

console.log('④ đổi chỗ — chạm biên thì ĐỨNG YÊN, không cuộn vòng');
{
  const bay: BayKe = { thuTu: ['gio', 'mau', 'dna'], an: [] };
  eq('sang phải', doiCho(bay, 'gio', 1, bay.thuTu).thuTu, ['mau', 'gio', 'dna']);
  eq('sang trái', doiCho(bay, 'dna', -1, bay.thuTu).thuTu, ['gio', 'dna', 'mau']);
  eq('biên trái đứng yên', doiCho(bay, 'gio', -1, bay.thuTu).thuTu, ['gio', 'mau', 'dna']);
  eq('biên phải đứng yên', doiCho(bay, 'dna', 1, bay.thuTu).thuTu, ['gio', 'mau', 'dna']);
  eq('id không có trên kệ ⇒ không đổi gì', doiCho(bay, 'la', 1, bay.thuTu), bay);
}

console.log('⑤ ẩn / gọi ra — đi rồi về, sự thật không đổi');
{
  let bay: BayKe = { thuTu: ['gio', 'mau', 'dna'], an: [] };
  bay = an(bay, 'mau', bay.thuTu);
  eq('ẩn rồi', bay, { thuTu: ['gio', 'dna'], an: ['mau'] });
  ok('ẩn hai lần không nhân đôi', JSON.stringify(an(bay, 'mau', bay.thuTu)) === JSON.stringify(bay));
  bay = hien(bay, 'mau', bay.thuTu);
  eq('gọi ra lại, xếp cuối', bay, { thuTu: ['gio', 'dna', 'mau'], an: [] });
}

console.log('⑥ ⭐ GHI XUỐNG → ĐỌC LẠI → CÙNG MỘT SỰ THẬT (phần thuần của luật PASS)');
{
  let bay: BayKe = { thuTu: ['gio', 'mau', 'dna'], an: [] };
  bay = doiCho(bay, 'dna', -1, bay.thuTu);
  bay = an(bay, 'gio', bay.thuTu);
  const daGhi = JSON.stringify(bay); // ← đây là đúng thứ đi vào localStorage
  const docLai = chuanHoa(JSON.parse(daGhi)); // ← và đây là đúng thứ đọc ra lúc vào lại
  eq('vòng ghi–đọc trùng khít', docLai, bay);
  eq(
    'bày trên màn sau khi vào lại y hệt lúc rời đi',
    apDung(CO, docLai).tren.map((w) => w.id),
    apDung(CO, bay).tren.map((w) => w.id),
  );
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
