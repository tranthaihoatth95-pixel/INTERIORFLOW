/** lib/site/vitals-site.test.ts — DÂY Site → Vitals (§6 · §D · §E). */
import { hoSoRong } from './types';
import { tinHieuDiaDiem, tinhLai, mienDangCu } from './vitals-site';

let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log(`  ok  - ${m}`); else { console.log(`  FAIL - ${m}`); fail++; } };
const LUC = '2026-08-22T00:00:00.000Z';
const goc = hoSoRong('p', LUC);

console.log('\n[1] KHÔNG CÓ GÌ CŨ → VITALS IM TUYỆT ĐỐI');
ok('hồ sơ trống → không tín hiệu', tinHieuDiaDiem(goc) === null);
ok('daCu rỗng → không tín hiệu', tinHieuDiaDiem({ ...goc, daCu: [] }) === null);
ok('hồ sơ CHƯA KHAI không phải một cảnh báo', tinHieuDiaDiem({ ...goc, viTri: { doChinhXac: 'chua-ro', nguoiDungXacNhan: false } }) === null);

console.log('\n[2] CÓ DẤU CŨ → TÍN HIỆU MANG SỐ THẬT');
{
  const h = { ...goc, daCu: ['nang.gocChieu', 'nang.gioNang'] };
  const t = tinHieuDiaDiem(h)!;
  ok('có tín hiệu', Boolean(t));
  ok('số đếm THẬT từ daCu', t.so === 2);
  ok('nhãn mang số, không chung chung', /2 phân tích/.test(t.nhan));
  ok('nói rõ miền nào', t.chiTiet.includes('Phân tích nắng'));
  ok('trả lời được "tại sao"', /địa điểm/.test(t.viSao));
  ok('chỉ đúng miền để đi tới, không phải trang chung', t.mien.join() === 'nang');
}

console.log('\n[3] TÍNH LẠI GỠ CÓ CHỌN LỌC — KHÔNG "DỌN HẾT CHO GỌN"');
{
  const h = { ...goc, daCu: ['nang.gocChieu', 'van-hoa.det', 'thu-cong.gom'] };
  ok('ba miền đang cũ', mienDangCu(h).length === 3);
  const sau = tinhLai(h, ['nang']);
  ok('gỡ đúng nắng', !sau.daCu!.some((k) => k.startsWith('nang')));
  ok('⭐ văn hoá VẪN cũ (cũ vì lý do khác)', sau.daCu!.includes('van-hoa.det'));
  ok('⭐ thủ công VẪN cũ', sau.daCu!.includes('thu-cong.gom'));
  ok('tín hiệu vẫn còn vì còn miền cũ', tinHieuDiaDiem(sau)!.so === 2);
  const het = tinhLai(sau, ['van-hoa', 'thu-cong']);
  ok('gỡ nốt → Vitals TẮT HẲN', tinHieuDiaDiem(het) === null);
}

console.log('\n[4] VITALS KHÔNG PHẢI SỔ NHẬT KÝ (§E)');
{
  const h = { ...goc, daCu: ['nang.a'] };
  ok('xử xong thì tín hiệu BIẾN MẤT (không giữ lịch sử)', tinHieuDiaDiem(tinhLai(h, ['nang'])) === null);
}

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả kiểm ĐẠT');
if (fail) process.exit(1);
