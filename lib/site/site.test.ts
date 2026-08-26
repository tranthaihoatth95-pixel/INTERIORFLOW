/**
 * lib/site/site.test.ts — kiểm tầng miền Ngữ Cảnh Dự Án (§47).
 * Khoá bằng máy đúng những luật dễ bị bào mòn nhất: ba tầng sự thật không được làm phẳng,
 * người quyết chứ không phải máy, và đổi hướng KHÔNG được xoá bằng chứng văn hoá.
 */
import {
  hoSoRong, coToaDo, deXuatDuocDuyet, apQuyetDinh, nguonHopLe,
  type DeXuatThietKe, type SuThat,
} from './types';
import { trangThaiNang, binhMinhHoangHon, lechGoc, muiGioGio } from './solar';
import { soHoSo, mienBiAnhHuong, suThatCu } from './anh-huong';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log(`  ok  - ${msg}`);
  else { console.log(`  FAIL - ${msg}`); fail++; }
}
const LUC = '2026-08-22T00:00:00.000Z';

console.log('\n[1] HỒ SƠ RỖNG LÀ HỢP LỆ — "chưa rõ" là sự thật, không phải lỗi (§5 · §36)');
const rong = hoSoRong('p1', LUC);
ok('hồ sơ rỗng dựng được', rong.duAnId === 'p1' && rong.phienBan === 1);
ok('độ chính xác mặc định là "chua-ro"', rong.viTri.doChinhXac === 'chua-ro');
ok('chưa có toạ độ', !coToaDo(rong));
ok('KHÔNG tự nhận là người dùng đã xác nhận', rong.viTri.nguoiDungXacNhan === false);

console.log('\n[2] NGUỒN GỐC — `verified` mà không nguồn là mâu thuẫn tự thân (§15)');
const coNguon: SuThat<number> = { giaTri: 1, co: 'verified', nguon: { tieuDe: 'x', layLuc: LUC, loai: 'tai-lieu', pham_vi: 'vung' } };
ok('verified + có nguồn → hợp lệ', nguonHopLe(coNguon));
ok('verified + KHÔNG nguồn → CHẶN', !nguonHopLe({ giaTri: 1, co: 'verified' }));
ok('inferred phải nói rõ còn thiếu gì', !nguonHopLe({ giaTri: 1, co: 'inferred' }));
ok('inferred + ghi chú → hợp lệ', nguonHopLe({ giaTri: 1, co: 'inferred', ghiChu: 'chưa đối chiếu bản gốc' }));
ok('measured (người tự khai) không đòi nguồn', nguonHopLe({ giaTri: 1, co: 'measured' }));

console.log('\n[3] NGƯỜI QUYẾT, KHÔNG PHẢI MÁY (§4) — ranh giới quan trọng nhất của tính năng');
const dx: DeXuatThietKe = { id: 'd1', tieuDe: 'Che nắng sâu', dienGiai: '', tuKetLuan: ['k1'], trangThai: 'cho-duyet' };
ok('đề xuất mới KHÔNG tự là sự thật dự án', dx.trangThai === 'cho-duyet');
ok('KHÔNG có người quyết → apQuyetDinh trả null (máy không tự nhận thay)', apQuyetDinh(dx, 'da-nhan', '  ', LUC) === null);
const daNhan = apQuyetDinh(dx, 'da-nhan', 'hoa', LUC);
ok('có người quyết → nhận được', daNhan?.trangThai === 'da-nhan' && daNhan.quyetDinh?.boi === 'hoa');
const daTuChoi = apQuyetDinh(dx, 'da-tu-choi', 'hoa', LUC, 'không hợp ngân sách');
ok('từ chối GIỮ LẠI lý do (§3C: bị từ chối vẫn còn trong lịch sử)', daTuChoi?.quyetDinh?.lyDo === 'không hợp ngân sách');

console.log('\n[4] NGỮ CẢNH CHO AI CHỈ GỒM THỨ ĐÃ DUYỆT (§27)');
const hs = { ...hoSoRong('p1', LUC), deXuat: [dx, daNhan!, daTuChoi!] };
const duyet = deXuatDuocDuyet(hs);
ok('chỉ lấy đề xuất ĐÃ NHẬN', duyet.length === 1 && duyet[0].trangThai === 'da-nhan');
ok('đề xuất CHỜ DUYỆT không lọt vào ngữ cảnh AI', !duyet.some((d) => d.trangThai === 'cho-duyet'));
ok('đề xuất BỊ TỪ CHỐI không lọt vào ngữ cảnh AI', !duyet.some((d) => d.trangThai === 'da-tu-choi'));

console.log('\n[5] MẶT TRỜI TẤT ĐỊNH (§11) — TP.HCM 10.7769N 106.7009E');
const hcm = { ...hoSoRong('p1', LUC), viTri: { viDo: 10.7769, kinhDo: 106.7009, muiGio: 'Asia/Ho_Chi_Minh', doChinhXac: 'cong-truong' as const, nguoiDungXacNhan: true } };
ok('chưa có toạ độ → trả null, KHÔNG đoán vị trí mặc định', trangThaiNang(rong, new Date(Date.UTC(2026, 7, 21)), 12) === null);
ok('múi giờ IANA đọc ra +7', muiGioGio(hcm, new Date(Date.UTC(2026, 7, 21))) === 7);
const trua = trangThaiNang(hcm, new Date(Date.UTC(2026, 7, 21)), 12)!;
ok('giữa trưa mặt trời TRÊN chân trời', trua.tren && trua.caoDoDeg > 60);
const chieu = trangThaiNang(hcm, new Date(Date.UTC(2026, 7, 21)), 16.5)!;
ok('16h30 mặt trời ngả TÂY (phương vị 240–290°)', chieu.phuongViDeg > 240 && chieu.phuongViDeg < 290);
ok('16h30 vẫn trên chân trời nhưng đã thấp', chieu.tren && chieu.caoDoDeg < trua.caoDoDeg);
const dem = trangThaiNang(hcm, new Date(Date.UTC(2026, 7, 21)), 23)!;
ok('23h đã lặn (cao độ ÂM)', !dem.tren && dem.caoDoDeg < 0);
const bmhh = binhMinhHoangHon(hcm, new Date(Date.UTC(2026, 7, 21)))!;
ok('bình minh TP.HCM khoảng 5–6h', bmhh.binhMinh! > 5 && bmhh.binhMinh! < 6.5);
ok('hoàng hôn TP.HCM khoảng 18–19h', bmhh.hoangHon! > 17.5 && bmhh.hoangHon! < 19);

console.log('\n[6] MẶT ĐỨNG TÂY — ca kinh điển của cả tính năng');
ok('chưa khai hướng → góc tới là null, KHÔNG mặc định 0 lặng lẽ', trangThaiNang(hcm, new Date(Date.UTC(2026, 7, 21)), 16.5)!.gocToiMatDungDeg === null);
const tay = { ...hcm, huong: { matDungChinhDeg: 270 } };
const toiTay = trangThaiNang(tay, new Date(Date.UTC(2026, 7, 21)), 16.5)!;
ok('mặt đứng Tây lúc 16h30 hứng nắng gần trực diện (<40°)', toiTay.gocToiMatDungDeg! < 40);
const dong = { ...hcm, huong: { matDungChinhDeg: 90 } };
ok('cùng lúc đó mặt đứng Đông thì KHÔNG (>90°)', trangThaiNang(dong, new Date(Date.UTC(2026, 7, 21)), 16.5)!.gocToiMatDungDeg! > 90);
ok('lệch góc vòng qua 0° tính đúng', lechGoc(350, 10) === 20 && lechGoc(10, 350) === 20);

console.log('\n[7] ĐỔI SỰ THẬT → CÁI GÌ CŨ ĐI (§32) — luật "đừng quét sạch cho an toàn"');
const A = { ...hcm, huong: { matDungChinhDeg: 270 } };
const B = { ...A, huong: { matDungChinhDeg: 180 } };
ok('đổi hướng mặt đứng bị phát hiện', soHoSo(A, B).includes('huong-mat-dung'));
ok('đổi hướng KHÔNG bị nhầm thành đổi toạ độ', !soHoSo(A, B).includes('toa-do'));
const doHuong = mienBiAnhHuong(['huong-mat-dung']);
ok('đổi hướng làm CŨ phân tích nắng', doHuong.includes('nang'));
ok('⭐ đổi hướng KHÔNG đụng bằng chứng thủ công', !doHuong.includes('thu-cong'));
ok('⭐ đổi hướng KHÔNG đụng bằng chứng văn hoá', !doHuong.includes('van-hoa'));
const doToaDo = mienBiAnhHuong(['toa-do']);
ok('đổi toạ độ làm CŨ cả khí hậu lẫn bằng chứng địa phương', doToaDo.includes('khi-hau') && doToaDo.includes('thu-cong'));
const hsCoSuThat = { ...A, suThat: { 'nang.gocChieu': { giaTri: 1, co: 'inferred' as const, ghiChu: 'x' }, 'thu-cong.det': { giaTri: 2, co: 'verified' as const, nguon: { tieuDe: 'n', layLuc: LUC, loai: 'tai-lieu' as const, pham_vi: 'vung' as const } } } };
const cu = suThatCu(hsCoSuThat, ['huong-mat-dung']);
ok('chỉ khoá nắng thành cũ', cu.includes('nang.gocChieu') && !cu.includes('thu-cong.det'));

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả kiểm ĐẠT');
if (fail) process.exit(1);
