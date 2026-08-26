/**
 * lib/ui/trang-thai-tuong-tac.test.ts — [marker: trangThaiTuongTac]
 *   node_modules/.bin/sucrase-node lib/ui/trang-thai-tuong-tac.test.ts
 *
 * Trọng tâm KHÔNG phải "hàm chạy đúng chưa" mà là BA BẤT BIẾN KIẾN TRÚC:
 *   ① hai trạng thái CẤM cùng độc chiếm một kênh động (ca va kênh 16/08, nay máy giữ)
 *   ② `hong` CẤM còn chuyển động
 *   ③ trạng thái mang tin cần đọc lại thì CẤM thiếu kênh chữ
 * Ba ca này còn xanh thì lane sau có thêm trạng thái mới cũng không tái phát bệnh cũ.
 */
import {
  TRANG_THAI,
  KENH,
  KENH_DONG,
  MA_TRAN,
  vaChamKenhDong,
  duocPhepDong,
  batBuocCoChu,
  nhipVao,
  mauTrangThai,
  nhanTrangThai,
  PHAI_DUNG_YEN,
  type Kenh,
} from './trang-thai-tuong-tac';
import { NHIP } from './nhip';

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

function testVaChamKenhDong() {
  console.log('\n[1] ⛔ BẤT BIẾN SỐ MỘT — hai trạng thái CẤM cùng độc chiếm một kênh động');
  const va = vaChamKenhDong();
  ok(
    `bảng sạch, 0 va chạm (thấy: ${va.map((v) => `${v.kenh}←${v.cacTrangThai.join('+')}`).join(', ') || 'không có'})`,
    va.length === 0,
  );
  // Ca 16/08 tái hiện thành khẳng định: hover và running KHÔNG được cùng một kênh.
  ok(
    'troVao dùng viền TĨNH, dangChay dùng viền CHẠY — tách bằng CHUYỂN ĐỘNG',
    MA_TRAN.troVao.kenhDong === null && MA_TRAN.dangChay.kenhDong === 'vienChay',
  );
  ok(
    'troVao và dangChay tuy cùng chạm viền nhưng chỉ dangChay là kênh động',
    MA_TRAN.troVao.kenh.includes('vienDung') && !MA_TRAN.troVao.kenh.includes('vienChay'),
  );
}

function testHongDungHan() {
  console.log('\n[2] ⛔ BẤT BIẾN SỐ HAI — lỗi thì chuyển động DỪNG HẲN');
  ok('hong không có kênh động', MA_TRAN.hong.kenhDong === null);
  ok('hong không được phép động', duocPhepDong('hong') === false);
  ok('hong nằm trong danh sách PHẢI ĐỨNG YÊN', PHAI_DUNG_YEN.includes('hong'));
  ok('xong cũng đứng yên — việc xong rồi thì không còn gì đang xảy ra', duocPhepDong('xong') === false);
  ok('nghi đứng yên — trường LẶNG', duocPhepDong('nghi') === false);
  ok('voHieu đứng yên', duocPhepDong('voHieu') === false);
}

function testKenhChuDuPhong() {
  console.log('\n[3] ⛔ BẤT BIẾN SỐ BA — màu KHÔNG bao giờ là kênh duy nhất');
  // Mọi trạng thái MANG TIN cần đọc lại đều phải có chữ. Ba trạng thái con-trỏ được miễn.
  const mangTin = ['dangChon', 'dangChay', 'dangCho', 'canChuY', 'xong', 'hong', 'voHieu'] as const;
  for (const tt of mangTin) {
    ok(`${tt} có kênh chữ`, batBuocCoChu(tt));
    ok(`${tt} có nhãn chữ không rỗng`, MA_TRAN[tt].nhan.length > 0);
  }
  ok('troVao KHÔNG cần nhãn chữ (thao tác đang diễn ra, không phải tin đọc lại)', !batBuocCoChu('troVao'));
  ok('dangBam KHÔNG cần nhãn chữ', !batBuocCoChu('dangBam'));
}

function testMoiKenhDeuManguNghia() {
  console.log('\n[4] Mỗi hiệu ứng phải MANG NGHĨA — không kênh nào được cấp mà không giải thích');
  for (const tt of TRANG_THAI) {
    ok(`${tt} có lời giải thích vì sao được cấp kênh đó`, MA_TRAN[tt].viSao.trim().length >= 20);
  }
  ok('nghi không chiếm kênh nào — trường LẶNG là mặc định', MA_TRAN.nghi.kenh.length === 0);
  ok('nghi không tô màu gì', MA_TRAN.nghi.mau === null && mauTrangThai('nghi') === null);
}

function testKhaiBaoHopLe() {
  console.log('\n[5] Bảng khai báo hợp lệ — kênh có thật, kênh động phải nằm trong danh sách kênh');
  const tapKenh = new Set<Kenh>(KENH);
  for (const tt of TRANG_THAI) {
    const h = MA_TRAN[tt];
    ok(`${tt}: mọi kênh khai đều có thật`, h.kenh.every((k) => tapKenh.has(k)));
    if (h.kenhDong != null) {
      ok(`${tt}: kênh động "${h.kenhDong}" thật sự là kênh ĐỘNG`, KENH_DONG.has(h.kenhDong));
      ok(`${tt}: kênh động cũng phải được liệt kê trong danh sách kênh`, h.kenh.includes(h.kenhDong));
    }
  }
  ok('đủ 10 trạng thái', TRANG_THAI.length === 10);
  ok('đủ 7 kênh', KENH.length === 7);
}

function testMauChiTroToken() {
  console.log('\n[6] ⛔ Cấm màu mới — mọi màu phải là TÊN TOKEN, không hex');
  for (const tt of TRANG_THAI) {
    const m = MA_TRAN[tt].mau;
    if (m == null) continue;
    ok(`${tt}: màu "${m}" là biến CSS, không phải hex`, m.startsWith('--') && !m.includes('#'));
    ok(`${tt}: mauTrangThai() bọc đúng var()`, mauTrangThai(tt) === `var(${m})`);
  }
}

function testNhipDocTuNhip() {
  console.log('\n[7] Nhịp ĐỌC từ lib/ui/nhip.ts — không đẻ thang thời lượng thứ hai');
  for (const tt of TRANG_THAI) {
    const ms = nhipVao(tt);
    ok(`${tt}: nhịp ${ms}ms nằm trong thang NHIP`, Object.values(NHIP).includes(ms as never));
  }
  ok('phản hồi bấm dùng nhịp nhanh nhất (100-160ms)', nhipVao('dangBam') === NHIP.bam);
  ok('trỏ vào dùng nhịp bấm — phải cảm thấy tức thì', nhipVao('troVao') === NHIP.bam);
}

function testNhan() {
  console.log('\n[8] Nhãn trình đọc màn hình');
  ok('ghép nhãn trạng thái vào tên vật', nhanTrangThai('dangChay', 'Dựng ảnh') === 'Dựng ảnh — Đang chạy');
  ok('trạng thái không nhãn thì trả đúng tên vật, không bịa chữ', nhanTrangThai('nghi', 'Dựng ảnh') === 'Dựng ảnh');
  ok('trỏ vào cũng không bịa chữ', nhanTrangThai('troVao', 'Dựng ảnh') === 'Dựng ảnh');
}

testVaChamKenhDong();
testHongDungHan();
testKenhChuDuPhong();
testMoiKenhDeuManguNghia();
testKhaiBaoHopLe();
testMauChiTroToken();
testNhipDocTuNhip();
testNhan();

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
