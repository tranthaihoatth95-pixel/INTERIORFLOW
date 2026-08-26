/**
 * lib/site/vat-ly.test.ts — kiểm PHA 2 · TRÍ TUỆ VẬT LÝ ĐỊA ĐIỂM.
 *
 * Khoá bằng máy đúng những luật dễ bị bào mòn nhất, theo thứ tự nguy hiểm giảm dần:
 *   ① thiếu dữ liệu thì RỖNG THẬT, không bịa số trông có vẻ hợp lý;
 *   ② gió KHÔNG được tự nhận là CFD;
 *   ③ tên địa danh mãi mãi chỉ là GỢI Ý, không bao giờ thành sự thật;
 *   ④ kết luận rỗng `tuSuThat` bị chặn;
 *   ⑤ đề xuất KHÔNG có đường nào tự lên `da-nhan`.
 */
import { hoSoRong, deXuatDuocDuyet, nguonHopLe, apQuyetDinh, type HoSoDiaDiem } from './types';
import {
  traKhiHau, dangKyNguonKhiHau, xoaNguonKhiHau, soNguonKhiHau, viPhamThoiTiet,
  phamViHopLeKhiHau, thangNongNhat, thangLanhNhat, bienDoNhietNam, muaMuaKho, doAmTbNam,
  suThatKhiHau, NGUONG_THANG_MUA_MM, type HoSoKhiHau, type Thang12,
} from './khi-hau';
import {
  traGio, dangKyNguonGio, xoaNguonGio, viPhamCFD, laCFD, NHAN_GIO, nhanGio, phamViHopLeGio,
  huongThoiToiDeg, muaGio, huongThinhHanhNhatDeg, gocGioToiMatDungDeg, suThatGioThinhHanh,
  type GioThinhHanh,
} from './gio';
import {
  goYTuTenDiaDanh, chiLaGoY, venBienTuKhoangCach, nguyCoNgapTuCaoDo, suThatDiaLy,
  NGUONG_VEN_BIEN_M,
} from './dia-ly';
import {
  hangDanXuat, suThatTuHoSo, suThatNang, gopSuThat, suyLuan, suyLuanTuHoSo, taoKetLuan,
  ketLuanHopLe, ketLuanTruyDuoc, taoDeXuat, deXuatTuKetLuan, viPhamNoiQua, LUAT,
} from './suy-luan';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log(`  ok  - ${msg}`);
  else { console.log(`  FAIL - ${msg}`); fail++; }
}
const LUC = '2026-08-22T00:00:00.000Z';
const NGAY = new Date(Date.UTC(2026, 7, 21));
const d12 = (v: number): Thang12<number> => [v, v, v, v, v, v, v, v, v, v, v, v];

const HCM_TAY: HoSoDiaDiem = {
  ...hoSoRong('p1', LUC),
  viTri: {
    viDo: 10.7769, kinhDo: 106.7009, muiGio: 'Asia/Ho_Chi_Minh',
    doChinhXac: 'cong-truong', nguoiDungXacNhan: true,
  },
  huong: { matDungChinhDeg: 270 },
};

console.log('\n[1] ⭐ THIẾU NGUỒN THÌ RỖNG THẬT — luật quan trọng nhất của lane này');
xoaNguonKhiHau(); xoaNguonGio();
ok('kho nguồn khí hậu RỖNG cố ý (chưa có bộ số liệu nào kiểm chứng được)', soNguonKhiHau() === 0);
ok('có toạ độ nhưng chưa cắm nguồn → traKhiHau trả null, KHÔNG ước lượng tạm', traKhiHau(HCM_TAY) === null);
ok('chưa cắm nguồn → traGio trả null', traGio(HCM_TAY) === null);
ok('chưa có toạ độ → traKhiHau null', traKhiHau(hoSoRong('p0', LUC)) === null);
const khRong: HoSoKhiHau = { phamVi: 'vung' };
ok('hồ sơ khí hậu rỗng → tháng nóng nhất là null, không bịa tháng 7', thangNongNhat(khRong) === null);
ok('hồ sơ khí hậu rỗng → biên độ nhiệt null', bienDoNhietNam(khRong) === null);
ok('không có dữ liệu mưa → không bịa mùa mưa', muaMuaKho(khRong) === null);
ok('hồ sơ khí hậu rỗng → KHÔNG sinh khoá sự thật nào', Object.keys(suThatKhiHau(khRong)).length === 0);
ok('gợi ý từ tên rỗng → trả {} chứ không đoán bừa cho đủ trường', Object.keys(goYTuTenDiaDanh('')).length === 0);
ok('⭐ thiếu MỨC NGẬP THAM CHIẾU → nguy cơ ngập là null (cao độ một mình không nói được gì)',
  nguyCoNgapTuCaoDo(2, undefined) === null);
ok('thiếu cao độ → cũng null', nguyCoNgapTuCaoDo(undefined, 1.5) === null);

console.log('\n[2] §10 KHÍ HẬU ≠ THỜI TIẾT — chặn bảng khí tượng lẻn vào');
ok('hồ sơ khí hậu chuẩn KHÔNG có trường thời tiết nào',
  viPhamThoiTiet({ nhietDoTbThangC: d12(28), phamVi: 'vung' }).length === 0);
ok('⭐ thêm "nhietDoHienTai" là BỊ BẮT', viPhamThoiTiet({ nhietDoHienTai: 31 }).includes('nhietDoHienTai'));
ok('thêm "duBao7Ngay" là BỊ BẮT', viPhamThoiTiet({ duBao7Ngay: [] }).length === 1);
ok('thêm "lamMoiLuc" là BỊ BẮT', viPhamThoiTiet({ lamMoiLuc: LUC }).length === 1);
ok('§14 khí hậu KHÔNG được nhận ở thang công trường', !phamViHopLeKhiHau('cong-truong'));
ok('§14 khí hậu hợp lệ ở thang vùng', phamViHopLeKhiHau('vung') && phamViHopLeKhiHau('vung-khi-hau'));

console.log('\n[3] KHÍ HẬU — hàm thuần chạy trên dữ liệu ĐƯỢC ĐƯA VÀO (fixture của test, không phải số liệu thật)');
const KH_TEST: HoSoKhiHau = {
  // ⚠️ SỐ CỦA TEST, KHÔNG PHẢI SỐ LIỆU KHÍ HẬU CỦA NƠI NÀO — chỉ để kiểm hàm.
  nhietDoTbThangC: [20, 22, 25, 28, 30, 31, 31, 30, 29, 27, 24, 21],
  doAmTbThangPc: d12(80),
  luongMuaThangMm: [10, 10, 40, 90, 200, 300, 320, 310, 250, 150, 50, 20],
  buXaNgangThangKwhM2Ngay: d12(4.6),
  phamVi: 'vung',
};
ok('tháng nóng nhất tính đúng (tháng 6 hoặc 7 đều là 31°C → lấy cái đầu)', thangNongNhat(KH_TEST) === 6);
ok('tháng lạnh nhất tính đúng', thangLanhNhat(KH_TEST) === 1);
ok('biên độ nhiệt = 31 − 20 = 11', bienDoNhietNam(KH_TEST) === 11);
const mm = muaMuaKho(KH_TEST)!;
ok('mùa mưa nhận đúng các tháng ≥ ngưỡng', mm.thangMua.join(',') === '5,6,7,8,9,10');
ok('⭐ luôn GHI LẠI ngưỡng đã dùng — số không được thành số ma', mm.nguongMm === NGUONG_THANG_MUA_MM);
ok('đổi ngưỡng thì kết quả đổi theo, và ngưỡng mới được ghi lại', muaMuaKho(KH_TEST, 250)!.thangMua.join(',') === '6,7,8,9');
const stKh = suThatKhiHau(KH_TEST);
ok('sinh ra sự thật khoá "khi-hau.*" đúng tiền tố Mien', Object.keys(stKh).every((k) => k.startsWith('khi-hau.')));
ok('⭐ KHÔNG có nguồn → hạng chỉ là inferred, KHÔNG tự lên verified', stKh['khi-hau.doAmTbNamPc'].co === 'inferred');
ok('inferred phải nói rõ còn thiếu gì (nguonHopLe của types)', nguonHopLe(stKh['khi-hau.doAmTbNamPc']));
ok('không khai giờ nắng → KHÔNG sinh khoá giờ nắng', !('khi-hau.gioNangNamH' in stKh));
const KH_CO_NGUON: HoSoKhiHau = { ...KH_TEST, nguon: { tieuDe: 'nguồn giả lập của test', layLuc: LUC, loai: 'tai-lieu', pham_vi: 'vung' } };
ok('có nguồn thật → mới lên verified', suThatKhiHau(KH_CO_NGUON)['khi-hau.doAmTbNamPc'].co === 'verified');
ok('nguồn giả lập từ chối phạm vi sai: nguồn khai "cong-truong" bị traKhiHau loại', (() => {
  xoaNguonKhiHau();
  dangKyNguonKhiHau({ ten: 'sai-thang', tra: () => ({ ...KH_TEST, phamVi: 'cong-truong' as const }) });
  const r = traKhiHau(HCM_TAY);
  xoaNguonKhiHau();
  return r === null;
})());

console.log('\n[4] ⛔ GIÓ KHÔNG PHẢI CFD (§12) — nói thật, không nói quá');
ok('IF khẳng định trong CODE rằng mình KHÔNG chạy CFD', laCFD() === false);
ok('⭐ "luồng khí qua phòng ngủ đạt 0,4 m/s" BỊ BẮT là nói quá',
  viPhamCFD('Luồng khí qua phòng ngủ đạt 0,4 m/s').length > 0);
ok('"mô phỏng dòng chảy" BỊ BẮT', viPhamCFD('kết quả mô phỏng dòng chảy quanh nhà').length > 0);
ok('"CFD" BỊ BẮT', viPhamCFD('đã chạy CFD cho khối này').length > 0);
const G_TEST: GioThinhHanh = {
  // ⚠️ fixture của test, không phải số liệu gió của nơi nào.
  huongTuTheoThangDeg: [45, 45, 45, 90, 135, 135, 135, 135, 135, 135, 45, 45],
  tocDoTbThangMs: d12(3),
  khoangTocDoMs: { min: 2, max: 4 },
  phamVi: 'vung',
};
const nhan = nhanGio(G_TEST);
ok(`⭐ nhãn bắt buộc "${NHAN_GIO}" luôn có mặt`, nhan.includes(NHAN_GIO));
ok('⭐ câu mô tả gió KHÔNG chứa cách nói nào của CFD', viPhamCFD(nhan).length === 0);
ok('câu mô tả luôn nói rõ thang địa lý', nhan.includes('vung'));
ok('§14 gió KHÔNG được nhận ở thang công trường/lân cận',
  !phamViHopLeGio('cong-truong') && !phamViHopLeGio('lan-can') && phamViHopLeGio('vung'));
ok('nguồn gió khai sai thang bị traGio TỪ CHỐI (không hạ hạng, mà loại thẳng)', (() => {
  xoaNguonGio();
  dangKyNguonGio({ ten: 'sai-thang', tra: () => ({ ...G_TEST, phamVi: 'lan-can' as const }) });
  const r = traGio(HCM_TAY);
  xoaNguonGio();
  return r === null;
})());
ok('quy ước hướng: gió thổi tới TỪ 45° thì ĐI VỀ 225°', huongThoiToiDeg(45) === 225);
ok('hướng thịnh hành nhất cả năm = 135° (6 tháng, hơn hẳn 45° có 4 tháng)', huongThinhHanhNhatDeg(G_TEST) === 135);
ok('biến thiên theo mùa gom đúng nhóm tháng', muaGio(G_TEST)![0].thang.join(',') === '5,6,7,8,9,10');
ok('góc gió tới mặt đứng 270° trong tháng 6 = 135°', gocGioToiMatDungDeg(G_TEST, 6, 270) === 135);
ok('tháng ngoài 1..12 → null', gocGioToiMatDungDeg(G_TEST, 13, 270) === null);
const stGio = suThatGioThinhHanh(G_TEST);
ok('sự thật gió đúng tiền tố "gio."', Object.keys(stGio).every((k) => k.startsWith('gio.')));
ok('gió không nguồn → chỉ inferred', stGio['gio.huongThinhHanhTuDeg'].co === 'inferred');

console.log('\n[5] 🔴 TÊN ĐỊA DANH MÃI MÃI CHỈ LÀ GỢI Ý (§9)');
const goY = goYTuTenDiaDanh('Khu nghỉ dưỡng Bãi Biển Xanh');
ok('nhận ra gợi ý ven biển', goY.venBien?.giaTri === true);
ok('⭐ luôn ở hạng inferred, KHÔNG BAO GIỜ verified/measured', goY.venBien?.co === 'inferred');
ok('⭐ ghi chú nói rõ suy từ CHỮ nào', /khớp chữ/.test(goY.venBien?.ghiChu ?? ''));
ok('máy canh chiLaGoY() xác nhận toàn bộ chỉ là gợi ý', chiLaGoY(goY));
const bay = goYTuTenDiaDanh('Thành phố Hải Dương');
ok('⭐ CA BẪY: "Hải Dương" cũng ra gợi ý ven biển — và ĐÚNG là chỉ gợi ý, vì nó KHÔNG giáp biển',
  bay.venBien?.co === 'inferred' && chiLaGoY(bay));
ok('gợi ý từ tên KHÔNG bao giờ qua nổi cửa `verified` của types', !nguonHopLe({ ...bay.venBien!, co: 'verified' }));
ok('tên không khớp gì → không sinh trường nào', Object.keys(goYTuTenDiaDanh('Nhà anh Ba')).length === 0);
const vb = venBienTuKhoangCach(800);
ok('ĐO ĐƯỢC 800m < ngưỡng → ven biển', vb.venBien.giaTri === true);
ok('đo mà không khai nguồn thì vẫn chỉ inferred', vb.venBien.co === 'inferred');
ok('ghi chú ghi lại NGƯỠNG đã dùng', vb.venBien.ghiChu!.includes(String(NGUONG_VEN_BIEN_M)));
const vbNguon = venBienTuKhoangCach(800, { tieuDe: 'đo trên bản đồ nền dự án', layLuc: LUC, loai: 'do-dac', pham_vi: 'cong-truong' });
ok('⭐ đường DUY NHẤT lên verified là ĐO + CÓ NGUỒN', vbNguon.venBien.co === 'verified' && nguonHopLe(vbNguon.venBien));
ok('đổ ra sự thật giữ NGUYÊN hạng, không nâng lén', suThatDiaLy(goY)['dia-ly.venBien'].co === 'inferred');

console.log('\n[6] ⭐ FACT → INSIGHT: kết luận PHẢI truy được về sự thật (§3B)');
ok('hạng dẫn xuất = mắt xích YẾU NHẤT', hangDanXuat(['verified', 'inferred']) === 'inferred');
ok('toàn verified thì mới verified', hangDanXuat(['verified', 'verified']) === 'verified');
ok('rỗng đầu vào → inferred', hangDanXuat([]) === 'inferred');
const kRong = { id: 'k', tieuDe: 'x', dienGiai: '', tuSuThat: [] as string[], mucDo: 'luu-y' as const };
ok('⭐ kết luận rỗng tuSuThat bị CHẶN', !ketLuanHopLe(kRong));
ok('⭐ taoKetLuan trả null cho kết luận rỗng nguồn gốc — nơi gọi không lách được', taoKetLuan(kRong) === null);
ok('tuSuThat toàn chuỗi trắng cũng bị chặn', !ketLuanHopLe({ ...kRong, tuSuThat: ['  '] }));
ok('khoá không tồn tại trong tập sự thật → không truy được', !ketLuanTruyDuoc({ ...kRong, tuSuThat: ['khong.co'] }, {}));
ok('hồ sơ RỖNG → 0 kết luận (không bịa ra kết luận nào)', suyLuanTuHoSo(hoSoRong('p0', LUC), NGAY).length === 0);
ok('tập sự thật rỗng → 0 kết luận', suyLuan({}).length === 0);

console.log('\n[7] ⭐⭐ CA KINH ĐIỂN 1 — mặt đứng TÂY + nắng chiều ⇒ chói / hấp thụ nhiệt');
const stNang = suThatNang(HCM_TAY, NGAY);
ok('có toạ độ + hướng → sinh được sự thật nắng bằng hình học tất định', Object.keys(stNang).length === 3);
ok('góc tới nhỏ nhất buổi chiều của mặt đứng Tây là NHỎ (<45°)',
  (stNang['nang.gocToiMatDungMinChieuDeg'].giaTri as number) < 45);
ok('⭐ CHƯA khai hướng → KHÔNG sinh sự thật nắng nào (im chứ không đoán)',
  Object.keys(suThatNang({ ...HCM_TAY, huong: {} }, NGAY)).length === 0);
ok('chưa có toạ độ → cũng không sinh gì', Object.keys(suThatNang(hoSoRong('p0', LUC), NGAY)).length === 0);
const kTay = suyLuanTuHoSo(HCM_TAY, NGAY);
const kNang = kTay.find((k) => k.id === 'nang-chieu-mat-dung');
ok('⭐ CA KINH ĐIỂN CHẠY ĐƯỢC: mặt đứng Tây sinh ra kết luận nguy cơ nắng chiều', Boolean(kNang));
ok('kết luận là RỦI RO', kNang?.mucDo === 'rui-ro');
ok('⭐ kết luận KHAI ĐỦ sự thật đã sinh ra nó', (kNang?.tuSuThat.length ?? 0) >= 3);
ok('mọi khoá trong tuSuThat đều truy được về tập sự thật thật', ketLuanTruyDuoc(kNang!, gopSuThat(HCM_TAY, NGAY)));
ok('diễn giải nói được cả CHÓI lẫn HẤP THỤ NHIỆT', /chói/i.test(kNang!.dienGiai) && /nhiệt/i.test(kNang!.dienGiai));
const dong = { ...HCM_TAY, huong: { matDungChinhDeg: 90 } };
ok('⭐ mặt đứng ĐÔNG cùng ngày thì KHÔNG sinh kết luận nắng chiều (luật không bắn bừa)',
  !suyLuanTuHoSo(dong, NGAY).some((k) => k.id === 'nang-chieu-mat-dung'));

console.log('\n[8] ⭐⭐ CA KINH ĐIỂN 2 — độ ẩm cao + ven biển ⇒ ăn mòn / ẩm mốc');
const suAmBien = { ...suThatKhiHau(KH_TEST), ...suThatDiaLy({ venBien: vbNguon.venBien }) };
const kAm = suyLuan(suAmBien).find((k) => k.id === 'am-ven-bien');
ok('⭐ CA KINH ĐIỂN CHẠY ĐƯỢC: ẩm cao + ven biển sinh kết luận', Boolean(kAm));
ok('nói được ăn mòn', /ăn mòn/i.test(kAm!.dienGiai));
ok('nói được ẩm mốc', /mốc/i.test(kAm!.dienGiai));
ok('truy về ĐÚNG hai sự thật đã sinh ra nó',
  kAm!.tuSuThat.includes('khi-hau.doAmTbNamPc') && kAm!.tuSuThat.includes('dia-ly.venBien'));
ok('⭐ chỉ có ven biển mà KHÔNG có số ẩm → luật im, không đoán ẩm',
  suyLuan(suThatDiaLy({ venBien: vbNguon.venBien })).length === 0);
ok('ẩm thấp hơn ngưỡng → luật im', (() => {
  const kho = { ...suThatKhiHau({ ...KH_TEST, doAmTbThangPc: d12(60) }), ...suThatDiaLy({ venBien: vbNguon.venBien }) };
  return !suyLuan(kho).some((k) => k.id === 'am-ven-bien');
})());
ok('⭐ ven biển mới ở hạng GỢI Ý thì kết luận phải nói rõ ra', (() => {
  const mo = { ...suThatKhiHau(KH_TEST), ...suThatDiaLy(goY) };
  const k = suyLuan(mo).find((x) => x.id === 'am-ven-bien');
  return Boolean(k) && /suy đoán/i.test(k!.dienGiai);
})());
ok('độ ẩm trung bình năm tính đúng từ fixture', doAmTbNam(KH_TEST) === 80);

console.log('\n[9] GIÓ TRONG KẾT LUẬN — vẫn không được nói quá');
const suGio = { ...suThatTuHoSo(HCM_TAY), ...suThatGioThinhHanh({ ...G_TEST, huongTuTheoThangDeg: d12(280) }) };
const kGio = suyLuan(suGio).find((k) => k.id === 'gio-thuan-mat-dung');
ok('mặt đứng Tây + gió tới từ 280° → sinh kết luận CƠ HỘI', kGio?.mucDo === 'co-hoi');
ok(`kết luận gió mang nhãn "${NHAN_GIO}"`, kGio!.dienGiai.includes(NHAN_GIO));
ok('⭐ kết luận gió KHÔNG chứa cách nói nào của CFD', viPhamNoiQua(kGio!).length === 0);
ok('⭐ TOÀN BỘ kết luận sinh ra trong test này đều sạch nói-quá',
  [...kTay, ...suyLuan(suAmBien), kGio!].every((k) => viPhamNoiQua(k).length === 0));

console.log('\n[10] ⭐⭐ ĐỀ XUẤT KHÔNG CÓ ĐƯỜNG NÀO TỰ LÊN `da-nhan` (§4)');
const dxs = deXuatTuKetLuan([...kTay, kAm!, kGio!]);
ok('sinh được đề xuất từ kết luận', dxs.length >= 2);
ok('⭐ MỌI đề xuất ra đời ở trạng thái cho-duyet', dxs.every((d) => d.trangThai === 'cho-duyet'));
ok('⭐ KHÔNG đề xuất nào tự là da-nhan', !dxs.some((d) => d.trangThai === 'da-nhan'));
ok('⭐ đề xuất mới sinh KHÔNG có quyết định của ai cả', dxs.every((d) => d.quyetDinh === undefined));
ok('mọi đề xuất đều dẫn về ít nhất một kết luận', dxs.every((d) => d.tuKetLuan.length > 0));
ok('taoDeXuat KHÔNG nhận đề xuất treo lơ lửng', taoDeXuat({ id: 'x', tieuDe: 'y', dienGiai: '', tuKetLuan: [] }) === null);
const hsCoDeXuat: HoSoDiaDiem = { ...HCM_TAY, deXuat: dxs };
ok('⭐ ngữ cảnh cho AI vẫn RỖNG cho tới khi có người gật (§27)', deXuatDuocDuyet(hsCoDeXuat).length === 0);
const daNhan = apQuyetDinh(dxs[0], 'da-nhan', 'hoa', LUC);
ok('chỉ CON NGƯỜI mới đổi được trạng thái', daNhan?.trangThai === 'da-nhan' && daNhan.quyetDinh?.boi === 'hoa');
ok('máy không có tên thì không nhận thay được', apQuyetDinh(dxs[0], 'da-nhan', '', LUC) === null);
ok('kết luận lạ (chưa có hướng xử lý) thì bỏ qua, KHÔNG bịa đề xuất',
  deXuatTuKetLuan([{ id: 'la-hoac', tieuDe: 'x', dienGiai: '', tuSuThat: ['a'], mucDo: 'luu-y' }]).length === 0);
ok('đề xuất KHÔNG chứa cách nói CFD', dxs.every((d) => viPhamNoiQua(d).length === 0));

console.log('\n[11] KIỂM DIỆN RỘNG — mọi luật đều tự khai và đều truy nguồn');
ok('mỗi luật có id và mô tả', LUAT.every((l) => l.id.trim() && l.moTa.trim()));
ok('id các luật KHÔNG trùng nhau', new Set(LUAT.map((l) => l.id)).size === LUAT.length);
ok('⭐ mọi luật chạy trên tập RỖNG đều trả null (không có luật nào bắn khi không có dữ kiện)',
  LUAT.every((l) => l.chay({}) === null));

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả kiểm ĐẠT');
if (fail) process.exit(1);
