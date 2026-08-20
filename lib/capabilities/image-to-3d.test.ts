/**
 * lib/capabilities/image-to-3d.test.ts — THUẦN, không mạng, không DOM.
 * Chạy: node_modules/.bin/sucrase-node lib/capabilities/image-to-3d.test.ts
 *
 * Ba khẳng định phiếu đòi, mỗi cái một khối:
 *   ① cờ `inferred` KHÔNG rò sang `measured` (và không rò vào BOQ)
 *   ② KHÔNG nhân bản asset (biểu diễn trỏ đúng danh tính ảnh gốc)
 *   ③ ảnh không đủ điều kiện thì TỪ CHỐI KÈM LÝ DO, không dựng khối cho có
 */
import {
  deXuatKhoi3D,
  demXetDauVao,
  nhanUngVien,
  boUngVien,
  duocDoVaoDoc,
  duocVaoBoq,
  bieuDienCuaUngVien,
  nacThapNhat,
  tomTatUngVien,
  HE_BIEU_DIEN,
  type DauVaoDeXuat,
  type UngVienKhoi3D,
} from './image-to-3d';
import { nangLucTheoId } from './compound';
import type { ObjectSilhouette } from '../vision/single-view-metrology';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* Mặt nạ giả: hình chữ nhật px — đủ để `measureObjectTiered` lên bậc ≥2 (có mặt nạ). */
const MAT_NA: ObjectSilhouette = {
  front: [
    { x: 400, y: 500 },
    { x: 900, y: 500 },
    { x: 900, y: 1000 },
    { x: 400, y: 1000 },
  ],
};

const CO_BAN: DauVaoDeXuat = {
  nguon: { loai: 'libraryAsset', id: 'asset_abc123', imageUrl: 'blob:xem-truoc' },
  category: 'armchair',
  silhouette: MAT_NA,
  knownWidthMm: 800,
  now: 0,
  genId: () => 'i23_test_1',
};

function deXuatOk(input: DauVaoDeXuat = CO_BAN): UngVienKhoi3D {
  const r = deXuatKhoi3D(input);
  if (!r.ok) throw new Error(`kỳ vọng ok nhưng bị từ chối: ${r.tuChoi.lyDo}`);
  return r.ungVien;
}

/* ═════════ ③ TỪ CHỐI CÓ LÝ DO — làm trước vì nó là cổng ═════════ */
console.log('\n③ từ chối ảnh không đủ điều kiện');
{
  const khongLoai = demXetDauVao({ ...CO_BAN, category: undefined as never });
  ok('thiếu loại đồ → từ chối', !!khongLoai);
  ok('  · lý do nói đúng chuyện loại đồ', !!khongLoai && khongLoai.lyDo.includes('loại đồ'));
  ok('  · có việc làm tiếp, không câm', !!khongLoai && khongLoai.canLam.length > 0);

  const khongNguon = demXetDauVao({ ...CO_BAN, nguon: { loai: 'libraryAsset', id: '' } });
  ok('thiếu ảnh → từ chối', !!khongNguon);

  // Ca quan trọng nhất (luật ③): không mặt nạ, không neo, không rộng-biết ⇒ bậc 1 = dải chuẩn
  // nghề, máy KHÔNG đọc ảnh. Phải từ chối chứ không trả khối bịa.
  const trong: DauVaoDeXuat = { nguon: CO_BAN.nguon, category: 'armchair', now: 0 };
  const tc = demXetDauVao(trong);
  ok('không mặt nạ + không neo + không rộng-biết → TỪ CHỐI (không dựng khối bịa)', !!tc);
  const kq = deXuatKhoi3D(trong);
  ok('  · deXuatKhoi3D cũng từ chối, không trả ứng viên', kq.ok === false);
  ok('  · nêu đủ 3 đường thoát', !kq.ok && kq.tuChoi.canLam.length === 3);

  ok('đủ điều kiện → qua cổng', demXetDauVao(CO_BAN) === null);

  // Số đo hỏng phải chặn ở cổng `dimsAreUsable` sẵn có, không nổ ra ngoài.
  // Số NGƯỜI NHẬP mà hỏng phải được NÓI RA, không bị nuốt rồi lặng lẽ tụt bậc.
  const hong = deXuatKhoi3D({ ...CO_BAN, knownWidthMm: Number.NaN });
  ok('rộng-biết = NaN → từ chối, không nuốt im lặng', hong.ok === false);
  ok('  · lý do gọi tên đúng ô người dùng gõ', !hong.ok && hong.tuChoi.lyDo.includes('chiều rộng thật'));
  const neoHong = deXuatKhoi3D({ ...CO_BAN, knownWidthMm: undefined, manualAnchor: { kind: 'door', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], realMm: -5 } });
  ok('neo tay ≤ 0 → từ chối', neoHong.ok === false);
  ok('bỏ trống thì KHÔNG bị coi là hỏng (chỉ mặt nạ vẫn chạy)', deXuatKhoi3D({ ...CO_BAN, knownWidthMm: undefined }).ok === true);
}

/* ═════════ ① CỜ inferred KHÔNG RÒ ═════════ */
console.log('\n① cờ 3 nấc không rò');
{
  const uv = deXuatOk();
  ok('ứng viên ra lò là ĐỀ XUẤT', uv.trangThai === 'deXuat');
  ok('máy sinh KHÔNG BAO GIỜ tự cho verified', uv.mucSuThat !== 'verified');
  ok('mỗi chiều có flagMay lưu cờ máy gốc', !!uv.rong.flagMay && !!uv.sau.flagMay && !!uv.cao.flagMay);
  ok('flag ban đầu === flagMay (chưa ai ký)', uv.rong.flag === uv.rong.flagMay && uv.cao.flag === uv.cao.flagMay);
  ok('mọi cờ nằm trong đúng bộ 3 nấc đã có', [uv.rong.flag, uv.sau.flag, uv.cao.flag].every((f) => ['measured', 'inferred', 'verified'].includes(f)));
  ok('sâu suy từ ảnh đơn → inferred', uv.sau.flag === 'inferred');
  ok('mucSuThat tổng = nấc thấp nhất', uv.mucSuThat === nacThapNhat([uv.rong.flag, uv.sau.flag, uv.cao.flag]));
  ok('nacThapNhat: một inferred kéo cả món xuống', nacThapNhat(['measured', 'verified', 'inferred']) === 'inferred');
  ok('nacThapNhat: measured + verified → measured', nacThapNhat(['verified', 'measured']) === 'measured');

  // BOQ — cổng cứng
  ok('đề xuất chưa duyệt → KHÔNG vào BOQ', duocVaoBoq(uv).duoc === false);
  ok('  · lý do nói rõ là chưa duyệt', duocVaoBoq(uv).lyDo.includes('chưa duyệt'));

  const daNhan = nhanUngVien(uv, { nguoiXacNhan: 'hoa' });
  ok('người ký → cả ba chiều verified', daNhan.rong.flag === 'verified' && daNhan.sau.flag === 'verified' && daNhan.cao.flag === 'verified');
  ok('  · flagMay GIỮ NGUYÊN dấu vết máy (không xoá lịch sử)', daNhan.sau.flagMay === 'inferred');
  ok('  · basis ghi tên người ký', daNhan.sau.basis.includes('hoa'));
  ok('  · giá trị mm không đổi khi chỉ ký, không sửa', daNhan.rong.valueMm === uv.rong.valueMm);
  ok('đã ký → vào được BOQ', duocVaoBoq(daNhan).duoc === true);

  // Sửa tay
  const suaTay = nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { caoMm: 880 } });
  ok('sửa tay đổi đúng số', suaTay.cao.valueMm === 880);
  ok('  · sai số về 0 (số người nhập, không phải khoảng máy đoán)', suaTay.cao.toleranceMm === 0);
  ok('  · basis nói rõ người nhập tay + số máy cũ', suaTay.cao.basis.includes('người nhập tay') && suaTay.cao.basis.includes(String(uv.cao.valueMm)));
  ok('  · heightMm khối đi theo số đã sửa', suaTay.heightMm === 880);
  ok('  · entity mang heightMm mới', suaTay.entities.every((e) => e.heightMm === 880));

  // Ứng viên gốc bất biến — còn để so/hoàn tác
  ok('nhận trả BẢN MỚI, ứng viên gốc không đổi', uv.trangThai === 'deXuat' && uv.rong.flag !== 'verified');

  ok('không ai ký → ném lỗi, không có verified vô chủ', (() => {
    try { nhanUngVien(uv, { nguoiXacNhan: '' }); return false; } catch { return true; }
  })());
}

/* ═════════ CỬA DUYỆT ═════════ */
console.log('\n cửa duyệt: Xem trước → Nhận / Bỏ');
{
  const uv = deXuatOk();
  ok('có khối nháp để xem trước', uv.entities.length > 0);
  ok('entity nháp mang heightMm ⇒ ống kính 3D đùn được', uv.entities.every((e) => e.heightMm === uv.heightMm));
  ok('CHƯA duyệt thì CẤM đổ vào Doc', duocDoVaoDoc(uv) === false);
  ok('duyệt rồi mới đổ được', duocDoVaoDoc(nhanUngVien(uv, { nguoiXacNhan: 'hoa' })) === true);

  const daBo = boUngVien(uv, 'không giống');
  ok('bỏ → trạng thái daBo', daBo.trangThai === 'daBo');
  ok('bỏ → entities xoá sạch (không lỡ tay đổ nháp đã bỏ)', daBo.entities.length === 0);
  ok('bỏ → không đổ được vào Doc', duocDoVaoDoc(daBo) === false);
  ok('bỏ rồi không nhận lại được', (() => {
    try { nhanUngVien(daBo, { nguoiXacNhan: 'hoa' }); return false; } catch { return true; }
  })());
  ok('tóm tắt có số + nguồn gốc', /\d+×\d+×\d+mm/.test(tomTatUngVien(uv)));
}

/* ═════════ ② KHÔNG NHÂN BẢN ASSET ═════════ */
console.log('\n② không nhân bản danh tính asset');
{
  const daNhan = nhanUngVien(deXuatOk(), { nguoiXacNhan: 'hoa' });
  const bd = bieuDienCuaUngVien(daNhan);
  ok('biểu diễn trỏ ĐÚNG id ảnh gốc — không đẻ asset mới', bd.entityId === 'asset_abc123');
  ok('entityType đúng bảng LibraryAsset', bd.entityType === 'LibraryAsset');
  ok('externalId là id BIỂU DIỄN, khác id asset', bd.externalId === 'i23_test_1' && bd.externalId !== bd.entityId);
  ok('system là chuỗi tự do đã khai', bd.system === HE_BIEU_DIEN);
  ok('ghi vết người ký', bd.lastWriteBy === 'hoa');
  ok('hình dạng khớp ExternalRef (4 cột neo + lastWriteBy)', ['system', 'externalId', 'entityType', 'entityId', 'lastWriteBy'].every((k) => k in bd));

  const tuFile = nhanUngVien(
    deXuatOk({ ...CO_BAN, nguon: { loai: 'projectFile', id: 'pf_777' }, genId: () => 'i23_test_2' }),
    { nguoiXacNhan: 'hoa' },
  );
  ok('nguồn ProjectFile → entityType ProjectFile, cùng id', bieuDienCuaUngVien(tuFile).entityType === 'ProjectFile' && bieuDienCuaUngVien(tuFile).entityId === 'pf_777');

  ok('chưa duyệt thì KHÔNG gắn được biểu diễn', (() => {
    try { bieuDienCuaUngVien(deXuatOk()); return false; } catch { return true; }
  })());
}

/* ═════════ DÂY VỚI compound.ts (chỉ đọc) ═════════ */
console.log('\n khớp khai báo năng lực trong compound.ts');
{
  const nl = nangLucTheoId('image-to-3d');
  ok('năng lực tồn tại', !!nl);
  ok('mucSuThat khai là suyRa — khớp cờ máy sinh của module này', nl?.mucSuThat === 'suyRa');
  ok('deXuat: true — máy sinh là đề xuất', nl?.deXuat === true);
  // 🔴 SỬA 20/08 — bản đầu của test này khẳng định `lenhNoiBo.includes('vision.measureObjectTiered')`,
  // tức nó KHOÁ ĐÚNG HÌNH DẠNG SAI: `vision.measureObjectTiered` KHÔNG phải node (grep
  // `lib/nodes/registry.ts` = 0), nó là TÊN HÀM. Khi contract tách `hamNoiBo` ra cho đúng, test này
  // đỏ — và đỏ ĐÚNG. Đây là ca mẫu của luật rút từ vụ Hough 15/08: *test khẳng định một hình dạng
  // hỏng thì nó che bug chứ không bảo vệ gì*. Nay khẳng định đúng chỗ máy thật nằm.
  ok(
    'máy hiểu THẬT khai ở hamNoiBo (KHÔNG phải lenhNoiBo — nó là hàm, không phải node)',
    !!nl?.hamNoiBo?.some((h) => h.includes('measureObjectTiered')),
  );
  ok(
    'lenhNoiBo rỗng — năng lực này chưa có node nào, khai thật thay vì trỏ id ma',
    nl?.lenhNoiBo.length === 0,
  );
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
