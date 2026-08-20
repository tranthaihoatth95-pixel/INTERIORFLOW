/**
 * lib/capabilities/anh-thanh-spec.test.ts — THUẦN, không mạng, không DOM.
 * Chạy: node_modules/.bin/sucrase-node lib/capabilities/anh-thanh-spec.test.ts
 *
 * Canh đúng ba luật ngữ pháp sự thật:
 *   ① vật liệu chỉ là ỨNG VIÊN, không bao giờ là khẳng định
 *   ② thứ ảnh không nói được thì ra ô "Chưa rõ" — máy không có đường nào điền
 *   ③ CẤM BỊA MÃ sản phẩm: mã không nguồn bị từ chối
 * + suy-ra KHÔNG lọt thành đã-kiểm khi gói thành spec và khi ghi xuống DB.
 */
import {
  ungVienVatLieu,
  thuocTinhKhongSuyDuoc,
  sanPhamChuaRo,
  sanPhamNguoiNhap,
  taoSpecTuUngVien,
  nhanKichThuoc,
  banGhiBieuDien,
  KIND_SPEC,
} from './anh-thanh-spec';
import { deXuatKhoi3D, nhanUngVien, type DauVaoDeXuat, type UngVienKhoi3D } from './image-to-3d';
import type { ObjectSilhouette } from '../vision/single-view-metrology';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const MAT_NA: ObjectSilhouette = {
  front: [{ x: 400, y: 500 }, { x: 900, y: 500 }, { x: 900, y: 1000 }, { x: 400, y: 1000 }],
};
const CO_BAN: DauVaoDeXuat = {
  nguon: { loai: 'libraryAsset', id: 'asset_abc123' },
  category: 'armchair',
  silhouette: MAT_NA,
  knownWidthMm: 800,
  now: 0,
  genId: () => 'i23_spec_1',
};
function uvOk(): UngVienKhoi3D {
  const r = deXuatKhoi3D(CO_BAN);
  if (!r.ok) throw new Error(r.tuChoi.lyDo);
  return r.ungVien;
}

/* ═════════ ① VẬT LIỆU LÀ ỨNG VIÊN ═════════ */
console.log('\n① vật liệu: đề xuất, không khẳng định');
{
  const khongMau = ungVienVatLieu();
  ok('có ứng viên để chọn', khongMau.length > 0);
  ok('MỌI ứng viên mang cờ inferred', khongMau.every((v) => v.mucSuThat === 'inferred'));
  ok('MỌI ứng viên khai thẳng là ứng viên', khongMau.every((v) => v.ungVien === true));
  ok('không có màu ảnh → KHÔNG bịa điểm xếp hạng', khongMau.every((v) => v.doGan === undefined));
  ok('  · và nói thẳng là chưa đọc được gì từ ảnh', khongMau.every((v) => v.bangChung.includes('Chưa đọc được')));

  const coMau = ungVienVatLieu({ mauAnh: { r: 138, g: 59, b: 46 } });
  ok('có màu ảnh → có điểm gần màu', coMau.every((v) => typeof v.doGan === 'number'));
  ok('  · xếp hạng giảm dần', coMau.every((v, i) => i === 0 || (coMau[i - 1].doGan ?? 0) >= (v.doGan ?? 0)));
  ok('  · bằng chứng tự khai giới hạn: màu KHÔNG nói được loại', coMau.every((v) => v.bangChung.includes('không nói được loại')));

  // Câu chữ máy sinh ra không được mang giọng khẳng định.
  const giongKhangDinh = /chắc chắn|đúng là|chính là|rõ ràng là/i;
  ok('không câu nào của máy mang giọng khẳng định', [...khongMau, ...coMau].every((v) => !giongKhangDinh.test(v.bangChung)));
  ok('trần số ứng viên tôn trọng được', ungVienVatLieu({ toiDa: 3 }).length === 3);
}

/* ═════════ ② THỨ ẢNH KHÔNG NÓI ĐƯỢC ═════════ */
console.log('\n② ô "Chưa rõ" — máy không có đường nào điền');
{
  const c = thuocTinhKhongSuyDuoc();
  ok('sáu ô đều là "Chưa rõ"', c.length === 6 && c.every((x) => x.giaTri === 'Chưa rõ'));
  ok('mỗi ô kèm việc phải làm', c.every((x) => x.canLam.length > 0));
  const ten = c.map((x) => x.ten.toLowerCase()).join(' | ');
  ok('phủ đúng các thuộc tính ảnh không mang', ['chống cháy', 'chống trượt', 'tiêu âm', 'loài gỗ'].every((k) => ten.includes(k)));
}

/* ═════════ ③ CẤM BỊA MÃ SẢN PHẨM ═════════ */
console.log('\n③ sản phẩm: cấm bịa mã');
{
  const may = sanPhamChuaRo();
  ok('máy chỉ trả "Chưa rõ"', may.ten === 'Chưa rõ' && may.mucSuThat === 'chuaRo');
  ok('  · và KHÔNG có mã nào', may.sku === undefined && may.nhaCungCap === undefined);

  const bia = sanPhamNguoiNhap({ ten: 'Ghế X', sku: 'ABC-123', nguoiNhap: 'hoa' });
  ok('mã KHÔNG nguồn → từ chối', bia.ok === false);
  ok('  · lý do nói rõ phải kèm nguồn', !bia.ok && bia.lyDo.includes('nguồn'));

  const that = sanPhamNguoiNhap({ ten: 'Ghế X', sku: 'ABC-123', nguon: 'catalogue hãng 2026 tr.42', nguoiNhap: 'hoa' });
  ok('mã CÓ nguồn + có người nhập → nhận', that.ok === true);
  ok('  · và chỉ khi đó mới là verified', that.ok && that.sanPham.mucSuThat === 'verified' && that.sanPham.nguoiNhap === 'hoa');

  ok('tên trống → từ chối', sanPhamNguoiNhap({ ten: '  ', nguoiNhap: 'hoa' }).ok === false);
  ok('không người nhập → từ chối', sanPhamNguoiNhap({ ten: 'Ghế X', nguoiNhap: '' }).ok === false);
  ok('tên không mã → nhận, không tự đẻ mã', (() => {
    const r = sanPhamNguoiNhap({ ten: 'Ghế gỗ tay vịn', nguoiNhap: 'hoa' });
    return r.ok && r.sanPham.sku === undefined;
  })());
}

/* ═════════ ④ GÓI THÀNH SPEC — SUY RA KHÔNG LỌT THÀNH ĐÃ KIỂM ═════════ */
console.log('\n④ tờ spec giữ đúng mức sự thật từng ô');
{
  ok('nhãn suy ra có dấu ≈ và chữ SUY RA', nhanKichThuoc(812.4, 'inferred') === '≈ 812 mm · SUY RA');
  ok('nhãn đo được KHÔNG có dấu ≈', !nhanKichThuoc(812, 'measured').includes('≈'));
  // 🔴 SỬA NGHĨA 20/08 — `verified` không còn MỘT nhãn. Người TỰ ĐƯA SỐ ≠ người ĐỐI CHIẾU với
  // tham chiếu đáng tin; gộp hai thứ vào chữ "ĐÃ KIỂM" là xoá mất đúng thứ người đọc hồ sơ cần.
  ok('người xác nhận có tham chiếu → ĐÃ KIỂM', nhanKichThuoc(800, 'verified', 'human-confirmed').includes('ĐÃ KIỂM'));
  ok('người tự đưa số → NGƯỜI NHẬP, KHÔNG được đọc thành đo được/đã kiểm', (() => {
    const n = nhanKichThuoc(800, 'verified', 'human-override');
    return n.includes('NGƯỜI NHẬP') && !n.includes('ĐÃ KIỂM') && !n.includes('ĐO ĐƯỢC');
  })());

  const uv = uvOk();
  ok('chưa duyệt thì KHÔNG ra được spec', (() => {
    try { taoSpecTuUngVien(uv, {}); return false; } catch { return true; }
  })());

  const chiBam = nhanUngVien(uv, { nguoiXacNhan: 'hoa' });
  const s1 = taoSpecTuUngVien(chiBam, { vatLieu: ungVienVatLieu()[0] });
  ok('chỉ bấm Nhận → không ô nào thành ĐÃ KIỂM', s1.kichThuoc.every((k) => !k.nhan.includes('ĐÃ KIỂM')));
  ok('  · chiều sâu vẫn hiện SUY RA', s1.kichThuoc.find((k) => k.ten === 'Sâu')!.nhan.includes('SUY RA'));
  ok('  · mức sự thật tổng KHÔNG phải verified', s1.mucSuThat !== 'verified');
  ok('  · cổng BOQ đóng, có lý do', s1.boq.duoc === false && s1.boq.lyDo.length > 0);
  ok('  · sản phẩm mặc định là Chưa rõ', s1.sanPham.ten === 'Chưa rõ');
  ok('  · vật liệu đi kèm vẫn là ứng viên inferred', s1.vatLieu?.mucSuThat === 'inferred');

  const kyDu = nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { rongMm: 800, sauMm: 620, caoMm: 900 } });
  const s2 = taoSpecTuUngVien(kyDu, {});
  ok('người đưa đủ ba số → cả ba verified nhưng mang nhãn NGƯỜI NHẬP', s2.kichThuoc.every((k) => k.flag === 'verified' && k.nhan.includes('NGƯỜI NHẬP')));
  ok('  · KHÔNG ô nào bị dán lại nhãn ĐO ĐƯỢC', s2.kichThuoc.every((k) => !k.nhan.includes('ĐO ĐƯỢC')));
  ok('  · mức sự thật tổng lên verified', s2.mucSuThat === 'verified');
  ok('  · cổng BOQ mở', s2.boq.duoc === true);
  ok('  · …nhưng BOQ mang theo cảnh báo xuất xứ, không im lặng', !!s2.boq.canhBao);
  ok('  · xuất xứ đủ ba chiều đi kèm spec', s2.boq.xuatXu.length === 3 && s2.kichThuoc.every((k) => k.xuatXu.length > 0));

  // Đường XÁC NHẬN — không gõ lại số nào, nêu đối chiếu với cái gì.
  const xn = nhanUngVien(uv, { nguoiXacNhan: 'hoa', xacNhan: { rong: 'bản vẽ TK-04', sau: 'catalogue tr.41', cao: 'đo tay 20/08' } });
  const s3 = taoSpecTuUngVien(xn, {});
  ok('xác nhận có tham chiếu → ĐÃ KIỂM, số giữ nguyên của máy', s3.kichThuoc.every((k) => k.nhan.includes('ĐÃ KIỂM')) && s3.kichThuoc.find((k) => k.ten === 'Sâu')!.valueMm === uv.sau.valueMm);
  ok('  · bản lưu giữ được căn cứ để sau này còn tra', (() => {
    const p = JSON.parse(banGhiBieuDien(s3).provenance) as { kichThuoc: { canCu: string; canCuMay: string }[] };
    return p.kichThuoc.every((k) => k.canCu === 'human-confirmed' && k.canCuMay !== 'human-confirmed');
  })());

  /* ── bản ghi xuống DB ── */
  const b1 = banGhiBieuDien(s1);
  ok('bản ghi trỏ ĐÚNG danh tính ảnh gốc (không nhân bản asset)', b1.assetId === 'asset_abc123');
  ok('kind là chuỗi tự do đã khai', b1.kind === KIND_SPEC);
  ok('truthLevel = nấc THẤP NHẤT, không ăn theo chữ ký', b1.truthLevel === s1.mucSuThat && b1.truthLevel !== 'verified');
  ok('chưa ai gõ số → verifiedBy để trống', b1.verifiedBy === null);
  ok('provenance giữ basis từng chiều (cãi nhau còn tra được)', (() => {
    const p = JSON.parse(b1.provenance) as { kichThuoc: { basis: string; flag: string }[] };
    return p.kichThuoc.length === 3 && p.kichThuoc.every((k) => k.basis.length > 0);
  })());
  ok('provenance giữ cả cờ máy gốc', JSON.parse(b1.provenance).kichThuoc.every((k: { flagMay: string }) => !!k.flagMay));

  const b2 = banGhiBieuDien(s2);
  ok('có người gõ số → truthLevel verified + có tên người ký', b2.truthLevel === 'verified' && b2.verifiedBy === 'hoa');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
