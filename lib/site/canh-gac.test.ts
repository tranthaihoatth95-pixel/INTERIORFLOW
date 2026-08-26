/**
 * lib/site/canh-gac.test.ts — CANH GÁC CHỐNG TÁI PHÁT (chỉ thị §4).
 * Mỗi khẳng định ở đây tương ứng MỘT lỗi đã trả giá thật trong phiên 22/08. Chúng không kiểm
 * "tính năng chạy đúng" — chúng kiểm "lỗi cũ không quay lại". Xoá một dòng ở đây là mở lại một hố.
 */
import { readFileSync, existsSync } from 'fs';
import { hoSoRong, deXuatDuocDuyet, apQuyetDinh, nguonHopLe, type DeXuatThietKe } from './types';
import { trangThaiNang, hangMuiGio } from './solar';
import { mienBiAnhHuong } from './anh-huong';
import { SO_NGUONG, dungDuocTrongSanXuat, tranDoTinCay, nguongHopLe, nguongDangIm } from './chinh-sach';

let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log(`  ok  - ${m}`); else { console.log(`  FAIL - ${m}`); fail++; } };
const doc = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const LUC = '2026-08-22T00:00:00.000Z';

console.log('\n[G1] 3D KHÔNG ĐƯỢC SỞ HỮU VỊ TRÍ LẦN NỮA');
{
  const f = doc('components/render-studio/scene3d-ui.ts');
  // Chỉ tính DÒNG MÃ — dòng bình luận (dấu mốc lỗi thời + câu cấm thêm lại) được phép nhắc tên.
  const dongMa = f.split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l));
  ok('scene3d-ui.ts: 0 dòng MÃ khai latDeg/lngDeg/northDeg', !dongMa.some((l) => /latDeg|lngDeg|northDeg/.test(l)));
  ok('vẫn giữ dấu mốc lỗi thời để phiên sau hiểu vì sao (không xoá lịch sử)', /LỖI THỜI|KHÔNG THÊM/.test(f));
  const lt = doc('components/render-studio/LightTab.tsx');
  ok('LightTab đọc hồ sơ địa điểm của DỰ ÁN', /trangThaiNang|HoSoDiaDiem|\/site/.test(lt));
}

console.log('\n[G2] URL THẮNG "DỰ ÁN GẦN NHẤT"');
{
  const r = doc('components/nav/RailDieuHuong.tsx');
  ok('rail suy id dự án TỪ ĐƯỜNG DẪN', /duAnTrenDuong/.test(r) && /\\\/projects\\\//.test(r));
  const m = /const duAnHieuLuc = ([^;]+);/.exec(r)?.[1] ?? '';
  ok('đường dẫn đứng ĐẦU chuỗi ưu tiên', m.trim().startsWith('duAnTrenDuong'));
}

console.log('\n[G3] HỒ SƠ RỖNG LÀ TRẠNG THÁI HỢP LỆ');
{
  const h = hoSoRong('p', LUC);
  ok('rỗng → chua-ro, không văng lỗi', h.viTri.doChinhXac === 'chua-ro');
  ok('rỗng → chưa xác nhận', h.viTri.nguoiDungXacNhan === false);
  ok('rỗng + hỏi nắng → null (không đoán vị trí mặc định)', trangThaiNang(h, new Date(Date.UTC(2026, 7, 21)), 12) === null);
}

console.log('\n[G4] "Sài Gòn" KHÔNG ĐƯỢC ĐỌC THÀNH TOẠ ĐỘ ĐỘ-PHÚT-GIÂY');
{
  // Bẫy thật: regex DMS bắt chữ `n` cuối chuỗi làm ký hiệu hướng Bắc.
  const dms = /^\s*\d{1,3}[°\s]\s*\d{1,2}['\s]\s*[\d.]+"?\s*[NSns]\b/;
  for (const t of ['Sài Gòn', 'Hải Dương', 'Đà Nẵng', 'Cần Thơ']) {
    ok(`"${t}" KHÔNG khớp mẫu toạ độ DMS`, !dms.test(t));
  }
  ok('toạ độ DMS thật thì vẫn khớp', dms.test(`10° 46' 36.8" N`));
}

console.log('\n[G5] SỰ THẬT NGOÀI `verified` PHẢI CÓ NGUỒN');
{
  ok('verified không nguồn → chặn', !nguonHopLe({ giaTri: 1, co: 'verified' }));
  ok('verified có nguồn → qua', nguonHopLe({ giaTri: 1, co: 'verified', nguon: { tieuDe: 'x', layLuc: LUC, loai: 'tai-lieu', pham_vi: 'vung' } }));
}

console.log('\n[G6] ĐỀ XUẤT BỊ TỪ CHỐI KHÔNG BAO GIỜ VÀO NGỮ CẢNH AI');
{
  const d: DeXuatThietKe = { id: 'd', tieuDe: 't', dienGiai: '', tuKetLuan: ['k'], trangThai: 'cho-duyet' };
  const tuChoi = apQuyetDinh(d, 'da-tu-choi', 'hoa', LUC)!;
  const h = { ...hoSoRong('p', LUC), deXuat: [d, tuChoi] };
  ok('cả chờ-duyệt lẫn bị-từ-chối đều bị loại', deXuatDuocDuyet(h).length === 0);
  ok('máy KHÔNG tự nhận thay người', apQuyetDinh(d, 'da-nhan', '', LUC) === null);
}

console.log('\n[G7] ĐỔI HƯỚNG CHỈ LÀM CŨ PHÂN TÍCH NẮNG');
{
  const m = mienBiAnhHuong(['huong-mat-dung']);
  ok('làm cũ nắng', m.includes('nang'));
  ok('KHÔNG đụng thủ công', !m.includes('thu-cong'));
  ok('KHÔNG đụng văn hoá', !m.includes('van-hoa'));
  ok('KHÔNG đụng vật liệu', !m.includes('vat-lieu'));
}

console.log('\n[G8] NGƯỠNG CHƯA CÓ NGUỒN KHÔNG ĐƯỢC THÀNH CANONICAL');
{
  for (const id of ['mua.thang-mua', 'dia-ly.ven-bien', 'khi-hau.am-cao']) {
    const n = SO_NGUONG[id];
    ok(`${id} vẫn ở hạng "uoc-le"`, n.hang === 'uoc-le');
    ok(`${id} IM trong sản xuất`, !dungDuocTrongSanXuat(n));
  }
  ok('cả ba đang im', nguongDangIm().length === 3);
  ok('dùng ngưỡng ước lệ → trần chỉ tới inferred', tranDoTinCay([SO_NGUONG['khi-hau.am-cao']]) === 'inferred');
  ok('nâng hạng mà KHÔNG có nguồn → nguongHopLe chặn', !nguongHopLe({ ...SO_NGUONG['mua.thang-mua'], hang: 'chuan' }));
  ok('có nguồn thật thì mới lên chuẩn được', nguongHopLe({ ...SO_NGUONG['mua.thang-mua'], hang: 'chuan', nguon: { tieuDe: 'QCVN', layLuc: LUC, loai: 'tai-lieu', pham_vi: 'vung' } }));
}

console.log('\n[G9] MÚI GIỜ SUY TỪ KINH ĐỘ KHÔNG BAO GIỜ LÀ SỰ THẬT ĐÃ KIỂM');
{
  const goc = { viDo: 10.7769, kinhDo: 106.7009, doChinhXac: 'cong-truong' as const, nguoiDungXacNhan: true };
  const suy = { ...hoSoRong('p', LUC), viTri: goc };
  ok('không khai múi giờ → hạng inferred', hangMuiGio(suy).co === 'inferred');
  ok('lý do nói THẲNG là suy từ kinh độ', /kinh độ/i.test(hangMuiGio(suy).vi));
  ok('⭐ nắng tính từ múi giờ suy ra → KHÔNG được verified', trangThaiNang(suy, new Date(Date.UTC(2026, 7, 21)), 12)!.co === 'inferred');
  const khai = { ...hoSoRong('p', LUC), viTri: { ...goc, muiGio: 'Asia/Ho_Chi_Minh', muiGioCo: 'verified' as const } };
  ok('múi giờ tra từ nguồn → nắng mới lên verified', trangThaiNang(khai, new Date(Date.UTC(2026, 7, 21)), 12)!.co === 'verified');
  ok('người dùng tự khai → measured, không tự phong verified', hangMuiGio({ ...khai, viTri: { ...khai.viTri, muiGioCo: 'measured' } }).co === 'measured');
}

console.log('\n[G10] CỔNG MÁY ĐO BẰNG MÃ THOÁT, KHÔNG BẰNG GREP');
{
  const sol = doc('lib/site/solar.ts');
  ok('solar.ts KHÔNG dùng alias `@/` cho value import (sucrase không phân giải)', !/from '@\//.test(sol));
  ok('giữ lời cảnh báo tại chỗ để không ai "dọn" lại thành alias', /sucrase|MÃ THOÁT|mã thoát/i.test(sol));
}

console.log('\n[G11] KÉO GIỜ CHỈ ĐỔI ÁNH SÁNG — KHÔNG CHẠM VẬT THỂ (§25)');
{
  const lt = doc('components/render-studio/LightTab.tsx');
  const i = lt.indexOf('const applyDateTime');
  const than = i >= 0 ? lt.slice(i, i + 900) : '';
  ok('có đường kéo giờ', Boolean(than));
  // Bộ từ CẤM: nếu đường kéo giờ chạm tới entity/scene/doc thì nó có thể reset mô hình.
  const cam = ['entit', 'setDoc', 'setEntities', 'setScene', 'rebuild', 'reload', 'setSelected', 'clearSelection'];
  const dinh = cam.filter((t) => new RegExp(t, 'i').test(than));
  ok(`đường kéo giờ KHÔNG chạm entity/scene/selection (dính: ${dinh.join(',') || 'không'})`, dinh.length === 0);
  ok('chỉ ghi qua writeSun', /writeSun\(/.test(than));
  ok('góc nắng lấy TỪ HỒ SƠ dự án, không từ state riêng của 3D', /gocNangTuHoSo\(hoSo/.test(than));
  ok('giữ lời giải thích §25 tại chỗ', /§25/.test(lt));
}

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả canh gác ĐẠT');
if (fail) process.exit(1);
