/**
 * components/site/nang-tu-ho-so.test.ts — KHOÁ BẰNG MÁY luật §25:
 * kéo thanh giờ chỉ được đổi HAI GÓC của mặt trời, không đụng gì khác.
 */

import { gocNangTuHoSo } from './nang-tu-ho-so';
import { hoSoRong, type HoSoDiaDiem } from '../../lib/site/types';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log(`  ok  - ${msg}`);
  else {
    console.log(`  FAIL - ${msg}`);
    fail++;
  }
}

const LUC = '2026-08-22T00:00:00.000Z';
function hcm(): HoSoDiaDiem {
  const h = hoSoRong('p-test', LUC);
  h.viTri = { ...h.viTri, viDo: 10.7769, kinhDo: 106.7009, muiGio: 'Asia/Ho_Chi_Minh', doChinhXac: 'cong-truong', nguoiDungXacNhan: true };
  return h;
}

console.log('\n[1] THIẾU DỮ KIỆN THÌ IM — không đoán một vị trí mặc định rồi vẽ nắng sai');
ok('chưa có toạ độ → null', gocNangTuHoSo(hoSoRong('p', LUC), '2026-06-21', 12) === null);
ok('chưa chọn ngày → null', gocNangTuHoSo(hcm(), '', 12) === null);
ok('ngày hỏng → null', gocNangTuHoSo(hcm(), 'khong-phai-ngay', 12) === null);

console.log('\n[2] §25 — KÉO GIỜ CHỈ ĐỔI HAI GÓC, KHÔNG ĐỘNG VÀO GÌ KHÁC');
const p = gocNangTuHoSo(hcm(), '2026-06-21', 12);
ok('đủ dữ kiện thì có kết quả', p !== null);
const khoa = p ? Object.keys(p).sort() : [];
ok(
  `patch ĐÚNG hai khoá azimuthDeg + altitudeDeg (thấy: ${khoa.join(', ')})`,
  khoa.length === 2 && khoa[0] === 'altitudeDeg' && khoa[1] === 'azimuthDeg',
);
ok('không mang theo intensity (người dùng chỉnh, máy không được trả về mặc định)', !('intensity' in (p ?? {})));
ok('không mang theo colorK', !('colorK' in (p ?? {})));

console.log('\n[3] SỐ PHẢI ĐÚNG NGHỀ — trưa hạ chí ở TP.HCM mặt trời gần đỉnh đầu');
ok(`cao độ trưa 21/6 > 75° (thật: ${p?.altitudeDeg.toFixed(1)}°)`, (p?.altitudeDeg ?? 0) > 75);
const sang = gocNangTuHoSo(hcm(), '2026-06-21', 7);
const chieu = gocNangTuHoSo(hcm(), '2026-06-21', 17);
ok(`7h mặt trời ở phía ĐÔNG, phương vị 45..115° (thật: ${sang?.azimuthDeg.toFixed(0)}°)`, (sang?.azimuthDeg ?? -1) > 45 && (sang?.azimuthDeg ?? 999) < 115);
ok(`17h mặt trời ở phía TÂY, phương vị 245..315° (thật: ${chieu?.azimuthDeg.toFixed(0)}°)`, (chieu?.azimuthDeg ?? -1) > 245 && (chieu?.azimuthDeg ?? 999) < 315);
ok('nửa đêm mặt trời dưới chân trời (cao độ âm)', (gocNangTuHoSo(hcm(), '2026-06-21', 0)?.altitudeDeg ?? 0) < 0);

console.log('\n[4] ĐỔI GIỜ THÌ SỐ PHẢI ĐỔI — không phải giá trị đóng băng');
ok('7h khác 17h', Math.abs((sang?.azimuthDeg ?? 0) - (chieu?.azimuthDeg ?? 0)) > 90);

console.log(fail === 0 ? '\n✅ nang-tu-ho-so: tất cả đạt' : `\n❌ nang-tu-ho-so: ${fail} lỗi`);
if (fail > 0) process.exit(1);
