/**
 * lib/review/hien-thi-luat.test.ts — khoá HAI CHẾ ĐỘ HIỂN THỊ + TRỤC NGUỒN + BA RÀO AN TOÀN.
 * Chạy: node_modules/.bin/sucrase-node lib/review/hien-thi-luat.test.ts
 * (import TƯƠNG ĐỐI toàn chuỗi — cùng lý do rules-3d.test.ts, alias '@/' không sống ở sucrase.)
 *
 * ⚠️ Bài học 15/08 (bug Hough): *"test khẳng định 'trả về đường thoái lui' mà KHÔNG có test nào
 * khẳng định đường CHÍNH chạy được thì đó là test che bug"*. Nên ở đây mỗi rào an toàn có ĐỦ
 * HAI VẾ: một ca chứng minh đường thoái lui đúng (thiếu nguyên văn ⇒ báo thiếu), một ca chứng
 * minh đường chính chạy (có nguyên văn ⇒ trích ra ĐÚNG TỪNG CHỮ).
 */
import {
  CHE_DO_MAC_DINH,
  CHUA_PHAN_LOAI_NGUON,
  THIEU_NGUYEN_VAN,
  dungTheGopy,
  dungTheLuat,
  nhanLoaiNguon,
  nhanMuc,
} from './hien-thi-luat';
import { violationToFinding } from './luat/cad';
import type { FindingGopy, FindingLuat } from './types';
import type { StandardRule } from '../cad/standards/registry';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** Vi phạm mẫu — nội dung TRUNG TÍNH, không tên khách thật (LUẬT NỀN TẢNG). */
function luatMau(p: Partial<FindingLuat> = {}): FindingLuat {
  return {
    lop: 'luat',
    muc: 'do',
    nguon: 'QCVN 06:2022/BXD §3.2.1',
    ruleId: 'vn-fire-corridor-min-width',
    moTa: 'Hành lang thoát nạn rộng 1.050 mm — thiếu 150 mm so với mức tối thiểu 1.200 mm.',
    ...p,
  };
}

const NGUYEN_VAN_THAT =
  'Chiều rộng thông thuỷ của đường thoát nạn theo phương ngang không nhỏ hơn 1,2 m đối với ' +
  'hành lang chung dùng để thoát nạn cho hơn 15 người.';

console.log('\n[1] MẶC ĐỊNH là chế độ NGẮN — phần lớn thời gian là lúc đang vẽ, không phải lúc bảo vệ hồ sơ');
{
  ok('mặc định = ngan', CHE_DO_MAC_DINH === 'ngan');
}

console.log('\n[2] NGẮN — giữ đủ 4 thứ tối thiểu: mức + nhãn mức + một câu + số hiệu điều khoản');
{
  const t = dungTheLuat(luatMau(), 'ngan');
  ok('có mức', t.muc === 'do');
  ok('có NHÃN CHỮ của mức (không chỉ màu)', t.nhanMuc.vi === 'Bắt buộc' && t.nhanMuc.en === 'Mandatory');
  ok('có câu mô tả', t.moTa.includes('1.050 mm'));
  ok('VẪN dẫn số hiệu — bỏ nguồn đi là thẻ hết là "luật"', t.nguon === 'QCVN 06:2022/BXD §3.2.1');
}

console.log('\n[3] NGẮN — KHÔNG lộ nguyên văn, dù rule CÓ nguyên văn (đây là điểm khác duy nhất giữa 2 chế độ)');
{
  const t = dungTheLuat(luatMau({ nguyenVan: NGUYEN_VAN_THAT, cachSua: 'Dời tim tường trục B ra 150 mm.' }), 'ngan');
  ok('nguyenVan = null ở chế độ Ngắn', t.nguyenVan === null);
  ok('không báo thiếu nguyên văn ở chế độ Ngắn (không phải chuyện của chế độ này)', t.thieuNguyenVan === false);
  ok('không có dòng phụ ở chế độ Ngắn', t.dongPhu.length === 0);
}

console.log('\n[4] ĐẦY ĐỦ — ĐƯỜNG CHÍNH: có nguyên văn thì trích ĐÚNG TỪNG CHỮ, không cắt, không rút gọn');
{
  const t = dungTheLuat(luatMau({ nguyenVan: NGUYEN_VAN_THAT }), 'dayDu');
  ok('trích nguyên văn y hệt chuỗi gốc', t.nguyenVan === NGUYEN_VAN_THAT);
  ok('không gắn cờ thiếu', t.thieuNguyenVan === false);
}

console.log('\n[5] ĐẦY ĐỦ — thêm cách sửa + ngày hiệu lực + cờ chưa đối chiếu bản gốc (đúng B1)');
{
  const t = dungTheLuat(
    luatMau({ cachSua: 'Dời tim tường trục B ra 150 mm về phía phòng kho.', ngayHieuLuc: '2022-01-16', chuaKiemChung: true }),
    'dayDu',
  );
  ok('có dòng "Cách sửa"', t.dongPhu.some((d) => d.nhan.vi === 'Cách sửa' && d.giaTri.includes('150 mm')));
  ok('có dòng "Hiệu lực từ"', t.dongPhu.some((d) => d.nhan.vi === 'Hiệu lực từ' && d.giaTri === '2022-01-16'));
  ok('cờ chưa đối chiếu bản gốc bật', t.chuaKiemChung === true);
}

console.log('\n[6] TẤT ĐỊNH — cùng finding + cùng chế độ, dựng 10 lần ra 10 kết quả y hệt (lớp luật, không phải AI)');
{
  const f = luatMau({ nguyenVan: NGUYEN_VAN_THAT, loaiNguon: 'luat', cachSua: 'Nới 150 mm.' });
  const chuan = JSON.stringify(dungTheLuat(f, 'dayDu'));
  let giong = true;
  for (let i = 0; i < 10; i += 1) if (JSON.stringify(dungTheLuat(f, 'dayDu')) !== chuan) giong = false;
  ok('10 lượt giống hệt nhau', giong);
}

console.log('\n[7] TRỤC NGUỒN — ba loại có nhãn riêng, đọc ra được ai ban hành');
{
  ok('luat', nhanLoaiNguon('luat').vi === 'Luật nhà nước');
  ok('tieuChuan', nhanLoaiNguon('tieuChuan').vi === 'Tiêu chuẩn ngành');
  ok('xuHuong', nhanLoaiNguon('xuHuong').vi === 'Xu hướng');
  ok('song ngữ đủ cả ba', ['luat', 'tieuChuan', 'xuHuong'].every((k) => nhanLoaiNguon(k as never).en.length > 0));
}

console.log('\n[8] TRỤC NGUỒN — rule KHÔNG khai thì hiện "Chưa phân loại nguồn", KHÔNG suy từ mức');
{
  const do_ = dungTheLuat(luatMau({ muc: 'do' }), 'dayDu');
  const vang = dungTheLuat(luatMau({ muc: 'vang' }), 'dayDu');
  ok('mức đỏ KHÔNG bị suy thành loại "luat"', do_.chipNguon.nhan.vi === CHUA_PHAN_LOAI_NGUON);
  ok('mức vàng KHÔNG bị suy thành loại "tieuChuan"', vang.chipNguon.nhan.vi === CHUA_PHAN_LOAI_NGUON);
  ok('cờ phanLoaiRoi = false để UI vẽ viền đứt', do_.chipNguon.phanLoaiRoi === false);
}

console.log('\n[9] HAI TRỤC ĐỘC LẬP — tiêu chuẩn ngành VẪN được ở mức Bắt buộc (hợp đồng viện dẫn), B3');
{
  const t = dungTheLuat(luatMau({ muc: 'do', loaiNguon: 'tieuChuan' }), 'dayDu');
  ok('giữ nguyên mức đỏ', t.muc === 'do' && t.nhanMuc.vi === 'Bắt buộc');
  ok('giữ nguyên nguồn tiêu chuẩn', t.chipNguon.nhan.vi === 'Tiêu chuẩn ngành' && t.chipNguon.phanLoaiRoi === true);
  ok('KHÔNG báo lệch (đây là ca hợp lệ)', t.canhBaoNhatQuan === null);
}
{
  const t = dungTheLuat(luatMau({ muc: 'vang', loaiNguon: 'luat' }), 'dayDu');
  ok('luật nhà nước VẪN được ở mức khuyến nghị', t.muc === 'vang' && t.chipNguon.nhan.vi === 'Luật nhà nước');
}

console.log('\n[10] A11Y — mức phân biệt được bằng HÌNH DẠNG + CHỮ, không chỉ bằng màu');
{
  const d = nhanMuc('do');
  const v = nhanMuc('vang');
  ok('hai mức khác hình dạng', d.hinhDang !== v.hinhDang);
  ok('hai mức khác nhãn chữ', d.nhan.vi !== v.nhan.vi);
  ok('góp ý khác hình dạng cả hai mức luật', dungTheGopy({ lop: 'gopy', moTa: 'x' }).hinhDang === 'tia' && d.hinhDang !== 'tia' && v.hinhDang !== 'tia');
}

console.log('\n[11] ⛔ RÀO — RULE KHÔNG CÓ NGUYÊN VĂN THÌ KHÔNG ĐƯỢC BỊA (ca rủi ro pháp lý cao nhất)');
{
  const t = dungTheLuat(luatMau(), 'dayDu');
  ok('nguyenVan = null, không sinh chữ thay thế', t.nguyenVan === null);
  ok('gắn cờ thiếu để UI hiện đúng câu chuẩn', t.thieuNguyenVan === true);
  ok('câu chuẩn nói rõ chỉ có SỐ HIỆU', THIEU_NGUYEN_VAN.includes('Chưa có nguyên văn') && THIEU_NGUYEN_VAN.includes('số hiệu'));
}

console.log('\n[12] ⛔ RÀO — KHÔNG lấy `moTa` (câu code dựng từ số đo) đắp vào chỗ nguyên văn');
{
  const moTaRieng = 'Cửa phòng ngủ 2 rộng 700 mm — dưới mức tối thiểu 800 mm.';
  const t = dungTheLuat(luatMau({ moTa: moTaRieng }), 'dayDu');
  ok('nguyenVan KHÔNG bằng moTa', t.nguyenVan !== moTaRieng);
  ok('nguyenVan vẫn null', t.nguyenVan === null);
  ok('moTa giữ nguyên chỗ của nó', t.moTa === moTaRieng);
}

console.log('\n[13] ⛔ RÀO — KHÔNG lấy `nguon` (số hiệu) đắp vào chỗ nguyên văn');
{
  const t = dungTheLuat(luatMau({ loaiNguon: 'luat' }), 'dayDu');
  ok('nguyenVan không phải số hiệu', t.nguyenVan !== t.nguon);
  ok('số hiệu vẫn hiện riêng', t.nguon === 'QCVN 06:2022/BXD §3.2.1');
}

console.log('\n[14] ⛔ GÓP Ý KHÔNG BAO GIỜ MANG CỜ CHẶN — và không có chỗ nào để khai mức đỏ/vàng');
{
  const g: FindingGopy = { lop: 'gopy', moTa: 'Ba phối cảnh liền nhau đều ngang tầm mắt; thêm một góc từ trên xuống sẽ cho khách thấy tổng thể.' };
  const t = dungTheGopy(g);
  ok('chan === false', t.chan === false);
  ok('không có trường muc', !('muc' in t));
  ok('không có trường nhanMuc', !('nhanMuc' in t));
  ok('không có trường nguon (không dẫn được điều khoản)', !('nguon' in t));
  ok('mang dấu "gợi ý" ở đầu', t.nhanDau.vi === 'gợi ý');
  ok('nói thẳng là không chặn xuất hồ sơ', t.nhanKhongChan.vi.includes('Không chặn'));
}
{
  // nguonCongKhai đi qua nguyên vẹn khi có (bắt buộc cho góp ý xu hướng — chốt 07/08 §12.3 ②)
  const t = dungTheGopy({ lop: 'gopy', moTa: 'x', nguonCongKhai: 'ISO 3864-1:2011' });
  ok('nguonCongKhai đi qua nguyên vẹn', t.nguonCongKhai === 'ISO 3864-1:2011');
  ok('không có nguồn thì null, không bịa', dungTheGopy({ lop: 'gopy', moTa: 'x' }).nguonCongKhai === null);
}

console.log('\n[15] ⛔ XU HƯỚNG KHÔNG ĐƯỢC CHẶN — máy BÁO lệch, KHÔNG tự hạ mức thay người (B2 + [N1])');
{
  const t = dungTheLuat(luatMau({ muc: 'do', loaiNguon: 'xuHuong' }), 'dayDu');
  ok('có cảnh báo nhất quán', t.canhBaoNhatQuan !== null);
  ok('cảnh báo song ngữ', Boolean(t.canhBaoNhatQuan?.vi) && Boolean(t.canhBaoNhatQuan?.en));
  ok('KHÔNG tự hạ mức xuống vàng — máy không quyết thay người ở chỗ pháp lý', t.muc === 'do');
  ok('xu hướng ở mức vàng thì không báo gì', dungTheLuat(luatMau({ muc: 'vang', loaiNguon: 'xuHuong' }), 'dayDu').canhBaoNhatQuan === null);
}

console.log('\n[16] NÚT — chỉ hiện khi CÓ dữ liệu thật, không hiện nút giả (luật §9 "cấm nút giả")');
{
  const tron = dungTheLuat(luatMau(), 'dayDu');
  ok('không cachSua ⇒ không nút Sửa', tron.coNutSua === false);
  ok('không vị trí ⇒ không nút Tới chỗ này', tron.coNutToiCho === false);
  const day = dungTheLuat(luatMau({ cachSua: 'Nới 150 mm.', viTri: { entityId: 'e-1' } }), 'dayDu');
  ok('có cachSua ⇒ có nút Sửa', day.coNutSua === true);
  ok('có entityId ⇒ có nút Tới chỗ này', day.coNutToiCho === true);
  ok('chỉ có toạ độ mm cũng đủ để nhảy tới', dungTheLuat(luatMau({ viTri: { mm: { x: 0, y: 0 } } }), 'ngan').coNutToiCho === true);
}

console.log('\n[17] DÂY TỪ BỘ LUẬT — rule khai gì thì finding mang nấy, rule không khai thì để TRỐNG');
{
  const v = {
    ruleId: 'r-test', source: 'TCVN 0000:2026 §1', severity: 'error' as const,
    category: 'egress', message: 'Thiếu 150 mm.', verified: true,
  };
  const rule: StandardRule = {
    id: 'r-test', source: 'TCVN 0000:2026 §1', category: 'egress', severity: 'error',
    description: 'mẫu', params: {}, verified: true,
    loaiNguon: 'luat', nguyenVan: NGUYEN_VAN_THAT, effectiveFrom: '2026-02-01',
  };
  const coRule = violationToFinding(v, rule);
  ok('mang loaiNguon từ rule', coRule.loaiNguon === 'luat');
  ok('mang nguyenVan từ rule', coRule.nguyenVan === NGUYEN_VAN_THAT);
  ok('mang effectiveFrom thành ngayHieuLuc', coRule.ngayHieuLuc === '2026-02-01');

  const khongRule = violationToFinding(v);
  ok('tra không thấy rule ⇒ loaiNguon trống, KHÔNG đoán', khongRule.loaiNguon === undefined);
  ok('tra không thấy rule ⇒ nguyenVan trống, KHÔNG bịa', khongRule.nguyenVan === undefined);
  ok('tra không thấy rule ⇒ ngayHieuLuc trống', khongRule.ngayHieuLuc === undefined);
  ok('phần cũ của Violation vẫn dịch đúng như trước', khongRule.muc === 'do' && khongRule.ruleId === 'r-test');

  const ruleTron: StandardRule = { ...rule, loaiNguon: undefined, nguyenVan: undefined, effectiveFrom: undefined };
  const t = dungTheLuat(violationToFinding(v, ruleTron), 'dayDu');
  ok('rule cũ (chưa khai gì) vẫn dựng thẻ được, chỉ là báo thiếu', t.thieuNguyenVan === true && t.chipNguon.phanLoaiRoi === false);
}

console.log(`\n──────── hien-thi-luat: ${pass} ok · ${fail} fail ────────\n`);
if (fail > 0) process.exit(1);
