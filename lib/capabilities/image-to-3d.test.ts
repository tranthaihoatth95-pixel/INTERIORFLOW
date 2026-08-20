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
  nacTuCanCu,
  nhanXuatXu,
  tomTatUngVien,
  HANH_DONG_DUYET,
  NAC_THEO_CAN_CU,
  HE_BIEU_DIEN,
  type CanCuSuThat,
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

  // Bậc 4 trả số rỗng (bắt trên app thật 20/08) → phải TỤT xuống bậc dưới, không chết ở cổng.
  // Ảnh 2×2 trắng trơn: `calibrateFromImage` không dựng nổi hiệu chỉnh thật.
  const anhTrang = { width: 2, height: 2, data: new Uint8ClampedArray(16).fill(255) };
  const coAnh = deXuatKhoi3D({ ...CO_BAN, image: anhTrang, genId: () => 'i23_tut_bac' });
  ok('kèm ảnh mà bậc 4 không ra số → tụt bậc, KHÔNG từ chối oan', coAnh.ok === true);
  ok('  · số tụt bậc vẫn dùng được (không phải 0)', coAnh.ok && [coAnh.ungVien.rong, coAnh.ungVien.sau, coAnh.ungVien.cao].every((k) => k.valueMm > 0));
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

  // 🔴 SỬA 20/08 (vòng 2) — bản trước khẳng định *"chỉ chiều người GÕ LẠI SỐ mới lên verified"*,
  // và cả một ca *"gõ lại ĐÚNG số máy vẫn tính là đã kiểm"*. Nó khoá đúng NGHI THỨC vừa bị bác:
  // gõ lại một con số không phải bằng chứng — nó chỉ là gõ lại. Nay khẳng định đúng bốn nghĩa
  // canonical: người CUNG CẤP số ⇒ human-override; người XÁC NHẬN có tham chiếu ⇒ human-confirmed;
  // để nguyên ⇒ không đổi gì. Cùng họ bài học Hough 15/08: test khoá hình dạng sai thì nó che bug.
  const daNhan = nhanUngVien(uv, { nguoiXacNhan: 'hoa' });
  ok('chỉ bấm Nhận, không gõ số nào → KHÔNG chiều nào lên verified', [daNhan.rong, daNhan.sau, daNhan.cao].every((k) => k.flag !== 'verified'));
  ok('  · cờ máy giữ nguyên từng chiều (suy vẫn là suy)', daNhan.sau.flag === 'inferred' && daNhan.rong.flag === uv.rong.flag);
  ok('  · flagMay GIỮ NGUYÊN dấu vết máy (không xoá lịch sử)', daNhan.sau.flagMay === 'inferred');
  ok('  · basis ghi tên người đã xem', daNhan.sau.basis.includes('hoa'));
  ok('  · giá trị mm không đổi khi chỉ ký, không sửa', daNhan.rong.valueMm === uv.rong.valueMm);
  ok('  · SUY-RA KHÔNG LỌT VÀO BOQ dù đã bấm Nhận', duocVaoBoq(daNhan).duoc === false);
  ok('  · lý do chặn nói đúng chiều nào còn suy', duocVaoBoq(daNhan).lyDo.includes('sâu'));

  // ĐƯỜNG ① — người CUNG CẤP số. Không cần gõ lại chiều nào đã đo được: chỉ chiều còn suy.
  const nguoiDua = nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { sauMm: 620 } });
  ok('người cung cấp số → chiều đó verified qua human-override', nguoiDua.sau.flag === 'verified' && nguoiDua.sau.canCu === 'human-override');
  ok('  · CHỈ chiều đó đổi, hai chiều kia giữ nguyên căn cứ máy', nguoiDua.rong.canCu === uv.rong.canCu && nguoiDua.cao.canCu === uv.cao.canCu);
  ok('  · chiều sửa mang số mới', nguoiDua.sau.valueMm === 620);
  ok('  · KHÔNG phải gõ lại hai chiều kia mà vẫn vào được BOQ', duocVaoBoq(nguoiDua).duoc === true);
  ok('  · BOQ giữ dấu vết: có cảnh báo số đến từ người', !!duocVaoBoq(nguoiDua).canhBao && duocVaoBoq(nguoiDua).canhBao!.includes('người nhập tay'));

  // ⛔ NGHI THỨC ĐÃ BỊ BÁC: gõ lại đúng con số máy KHÔNG còn được gọi là "đã kiểm".
  const goLaiYNguyen = nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { sauMm: uv.sau.valueMm } });
  ok('gõ lại ĐÚNG số máy = người nhập tay, KHÔNG phải "xác nhận đúng số máy"', goLaiYNguyen.sau.canCu === 'human-override');
  ok('  · không còn câu nghi thức nào trong basis', !goLaiYNguyen.sau.basis.includes('xác nhận đúng số máy'));

  // ĐƯỜNG ② — người XÁC NHẬN tường minh, có tham chiếu. KHÔNG gõ lại số nào.
  const xn = nhanUngVien(uv, { nguoiXacNhan: 'hoa', xacNhan: { sau: 'catalogue Mezzo 2026 tr.41' } });
  ok('xác nhận có tham chiếu → verified qua human-confirmed', xn.sau.flag === 'verified' && xn.sau.canCu === 'human-confirmed');
  ok('  · GIỮ NGUYÊN số máy (người không gõ lại gì)', xn.sau.valueMm === uv.sau.valueMm);
  ok('  · basis ghi lại đối chiếu với cái gì', xn.sau.basis.includes('catalogue Mezzo 2026 tr.41'));
  ok('  · đủ ba chiều hợp lệ → vào được BOQ', duocVaoBoq(xn).duoc === true);
  ok('xác nhận SUÔNG (tham chiếu rỗng) → ném lỗi, không có verified không bằng chứng', (() => {
    try { nhanUngVien(uv, { nguoiXacNhan: 'hoa', xacNhan: { sau: '   ' } }); return false; } catch { return true; }
  })());

  // Số người gõ mà hỏng: nói thẳng, không nuốt rồi vẫn báo "đã nhận".
  ok('gõ số ≤ 0 → ném lỗi kèm tên chiều', (() => {
    try { nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { caoMm: 0 } }); return false; }
    catch (e) { return e instanceof Error && e.message.includes('cao'); }
  })());

  // …và khi CHIỀU KHÁC còn suy thì ký lẻ KHÔNG mở được cổng BOQ. Dựng ca bằng bậc 2 (chỉ mặt
  // nạ, không neo) — bậc đó suy cả ba chiều, đúng ca người dùng gặp nhiều nhất.
  const bac2 = deXuatOk({ ...CO_BAN, knownWidthMm: undefined, genId: () => 'i23_test_bac2' });
  const bac2KyLe = nhanUngVien(bac2, { nguoiXacNhan: 'hoa', sua: { caoMm: 900 } });
  ok('bậc 2 (chỉ mặt nạ) vẫn để chiều sâu là suy', bac2.sau.flag === 'inferred');
  ok('  · ký lẻ chiều CAO không đụng tới chiều sâu', bac2KyLe.cao.flag === 'verified' && bac2KyLe.sau.flag === 'inferred');
  ok('  · ⇒ cả món vẫn đứng ngoài BOQ', duocVaoBoq(bac2KyLe).duoc === false);
  ok('  · lý do chặn gọi đúng tên chiều còn suy', duocVaoBoq(bac2KyLe).lyDo.includes('sâu') && !duocVaoBoq(bac2KyLe).lyDo.includes('cao'));

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

/* ═════════ ①b BỐN NGHĨA CANONICAL — CĂN CỨ LÀ NGUỒN, NẤC LÀ HỆ QUẢ ═════════ */
console.log('\n①b bốn nghĩa canonical: measured · verified · human-override · inferred');
{
  const uv = deXuatOk();

  // Bất biến nền: KHÔNG có căn cứ nào mà thiếu nấc, và nấc luôn suy từ căn cứ.
  ok('mọi căn cứ đều có nấc — bảng ánh xạ không lỗ', (Object.keys(NAC_THEO_CAN_CU) as CanCuSuThat[]).every((c) => ['measured', 'inferred', 'verified'].includes(nacTuCanCu(c))));
  ok('KHÔNG đẻ nấc thứ tư — vẫn đúng bộ 3 đã có', new Set(Object.values(NAC_THEO_CAN_CU)).size === 3);
  ok('human-override là VERIFIED, không phải measured', nacTuCanCu('human-override') === 'verified');
  ok('human-confirmed là VERIFIED', nacTuCanCu('human-confirmed') === 'verified');
  ok('dải chuẩn nghề là INFERRED (một con số trong sách không phải phép đo)', nacTuCanCu('category-prior') === 'inferred');

  const moiChieu = (u: UngVienKhoi3D) => [u.rong, u.sau, u.cao];
  const bs = (u: UngVienKhoi3D) => moiChieu(u).every((k) => k.flag === nacTuCanCu(k.canCu) && k.flagMay === nacTuCanCu(k.canCuMay));
  ok('máy sinh: flag LUÔN = nacTuCanCu(canCu)', bs(uv));

  // 🔴 KHẲNG ĐỊNH TRUNG TÂM CỦA CẢ LƯỢT SỬA.
  const cacDuong: UngVienKhoi3D[] = [
    nhanUngVien(uv, { nguoiXacNhan: 'hoa' }),
    nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { rongMm: 810, sauMm: 620, caoMm: 900 } }),
    nhanUngVien(uv, { nguoiXacNhan: 'hoa', xacNhan: { rong: 'bản vẽ TK-04', sau: 'đo tay tại xưởng 20/08', cao: 'trang hãng' } }),
    nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { sauMm: 620 }, xacNhan: { cao: 'trang hãng' } }),
  ];
  ok('HUMAN OVERRIDE KHÔNG BAO GIỜ MANG NHÃN measured — mọi đường, mọi chiều', cacDuong.every((u) => moiChieu(u).every((k) => !(k.canCu === 'human-override' && k.flag === 'measured'))));
  ok('  · và nhãn xuất xứ của nó gọi đúng tên "người nhập tay"', nhanXuatXu('human-override') === 'người nhập tay' && !nhanXuatXu('human-override').includes('đo'));
  ok('bất biến flag=nacTuCanCu giữ qua CẢ BỐN đường ký', cacDuong.every(bs));
  ok('đã lên verified thì basis KHÔNG BAO GIỜ rỗng', cacDuong.every((u) => moiChieu(u).filter((k) => k.flag === 'verified').every((k) => k.basis.trim().length > 0)));
  ok('  · …và căn cứ của nó phải là một trong hai đường người', cacDuong.every((u) => moiChieu(u).filter((k) => k.flag === 'verified').every((k) => k.canCu === 'human-override' || k.canCu === 'human-confirmed')));
  ok('dấu vết MÁY còn nguyên sau mọi đường ký (canCuMay không bị ghi đè)', cacDuong.every((u) => u.sau.canCuMay === uv.sau.canCuMay));

  // Ưu tiên MEASURED: ghi đè lên một chiều máy VỐN đã đo được thì phải nói ra.
  ok('rộng của ca này máy đo được (bậc 3, có neo rộng thật)', uv.rong.flag === 'measured' && uv.rong.canCu === 'calibrated');
  const deLen = nhanUngVien(uv, { nguoiXacNhan: 'hoa', sua: { rongMm: 810, sauMm: 620 } });
  ok('ghi đè lên số ĐO ĐƯỢC → cảnh báo nói thẳng, ưu tiên số đo', (duocVaoBoq(deLen).canhBao ?? '').includes('vốn đã đo được') || (duocVaoBoq(deLen).canhBao ?? '').includes('VỐN ĐÃ đo được'));

  // Cổng BOQ luôn trả xuất xứ đủ ba chiều — kể cả khi chặn.
  const cong = duocVaoBoq(uv);
  ok('BOQ trả xuất xứ đủ 3 chiều kể cả khi CHẶN', cong.duoc === false && cong.xuatXu.length === 3);
  ok('  · mỗi dòng xuất xứ có chữ cho người đọc', cong.xuatXu.every((x) => x.nhan.length > 0 && x.flag === nacTuCanCu(x.canCu)));
  ok('  · không dòng nào gọi số của người là "đo được"', duocVaoBoq(cacDuong[1]).xuatXu.filter((x) => x.canCu === 'human-override').every((x) => !x.nhan.includes('đo được')));

  // Bốn hành động thật — thay cho nghi thức gõ lại.
  ok('khai đủ 4 hành động ở cửa duyệt', HANH_DONG_DUYET.length === 4);
  ok('  · có đủ Xác nhận · Sửa · Nhập kích thước đã biết · Hiệu chỉnh lại', ['Xác nhận', 'Sửa', 'Nhập kích thước đã biết', 'Hiệu chỉnh lại'].every((n) => HANH_DONG_DUYET.some((h) => h.nhan === n)));
  ok('  · không hành động nào là "gõ lại đúng số cũ để mở khoá"', HANH_DONG_DUYET.every((h) => !h.mo.includes('gõ lại đúng')));
  ok('  · Hiệu chỉnh lại cho ra số MÁY (calibrated), không phải số người', HANH_DONG_DUYET.find((h) => h.id === 'hieuChinhLai')!.canCu === 'calibrated');
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
