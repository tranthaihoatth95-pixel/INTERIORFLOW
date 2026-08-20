/**
 * components/filemanager/tep-nguon-trang-thai.test.ts — test lõi 3-vật/7-nấc + DRIFT-GUARD tag.
 *
 * Phần đắt nhất là drift-guard `tagNguonTep` ↔ `tagNguonProjectFile` (`lib/server/promote.ts`):
 * nếu server đổi cú pháp tag provenance mà client quên, hàng "đã vào Thư viện" sẽ **im lặng tụt
 * về "cần xem lại"** sau mỗi lần tải lại trang — hỏng câm, không lỗi, không ai thấy. Đúng loại
 * bệnh test phải chặn thay vì trông vào trí nhớ.
 * (Import `lib/server/**` trong test là quy ước sẵn của repo — `lib/server/promote.test.ts`.)
 */
import assert from 'assert';
import { tagNguonProjectFile } from '../../lib/server/promote';
import {
  VAT_NHAN,
  huyHieuVat,
  TRANG_THAI_LIST,
  TRANG_THAI_NHAN,
  tinhTrangThai,
  chuPhu,
  lyDoChuaMoTaiSan,
  lyDoChuaXemDangDung,
  tagNguonTep,
  timAssetTheoTep,
  NAC_LIST,
  NAC_NHAN,
} from './tep-nguon-trang-thai';

// ── DRIFT-GUARD: tag provenance hai phía phải trùng KHÍT ──────────────────────────────────────
for (const id of ['abc123', 'ckq9z0000xyz', 'A-B_c']) {
  assert.strictEqual(
    tagNguonTep(id),
    tagNguonProjectFile(id),
    `tagNguonTep lệch tagNguonProjectFile ở id=${id} — Promote sẽ đóng tag mà UI không nhận ra`,
  );
}

// ── ① VẬT ────────────────────────────────────────────────────────────────────────────────────
// Mỗi vật phải có ĐỦ ký hiệu + hai thứ tiếng + câu ranh giới; thiếu là huy hiệu câm.
for (const [key, n] of Object.entries(VAT_NHAN)) {
  assert.ok(n.ky.trim(), `vật "${key}" thiếu ký hiệu`);
  assert.ok(n.vi.trim() && n.en.trim(), `vật "${key}" thiếu nhãn hai thứ tiếng`);
  assert.ok(n.y.vi.trim() && n.y.en.trim(), `vật "${key}" thiếu câu giải nghĩa`);
}
// Ký hiệu phải PHÂN BIỆT ĐƯỢC với nhau — trùng ký là mất kênh hình dạng, chỉ còn màu.
{
  const kys = Object.values(VAT_NHAN).map((n) => n.ky);
  assert.strictEqual(new Set(kys).size, kys.length, 'ký hiệu vật bị trùng nhau');
}
// Hai họ ký hiệu (vật ↔ trạng thái) KHÔNG được giao nhau — giao là đọc nhầm trục.
{
  const vat = new Set(Object.values(VAT_NHAN).map((n) => n.ky));
  for (const t of TRANG_THAI_LIST) {
    assert.ok(!vat.has(TRANG_THAI_NHAN[t].ky), `ký hiệu "${TRANG_THAI_NHAN[t].ky}" dùng cho CẢ vật lẫn trạng thái`);
  }
}

assert.deepStrictEqual(huyHieuVat({ coAsset: false, dangDung: false }), ['tepDuAn']);
assert.deepStrictEqual(huyHieuVat({ coAsset: true, dangDung: false }), ['tepDuAn', 'taiSanThuVien']);
assert.deepStrictEqual(
  huyHieuVat({ coAsset: true, dangDung: true }),
  ['tepDuAn', 'taiSanThuVien', 'dangDung'],
  'ba vật hiện SONG SONG — không nấc nào đè nấc nào',
);

// ── ② TRẠNG THÁI ─────────────────────────────────────────────────────────────────────────────
assert.strictEqual(TRANG_THAI_LIST.length, 7, 'phải đủ 7 nấc, không hơn không kém');
assert.strictEqual(new Set(TRANG_THAI_LIST).size, 7, 'nấc trùng nhau trong TRANG_THAI_LIST');
for (const t of TRANG_THAI_LIST) {
  const n = TRANG_THAI_NHAN[t];
  assert.ok(n, `nấc "${t}" chưa có nhãn`);
  assert.ok(n.ky.trim() && n.vi.trim() && n.en.trim(), `nấc "${t}" thiếu ký hiệu hoặc nhãn`);
}
{
  const kys = TRANG_THAI_LIST.map((t) => TRANG_THAI_NHAN[t].ky);
  assert.strictEqual(new Set(kys).size, kys.length, 'ký hiệu trạng thái bị trùng nhau');
}

assert.strictEqual(tinhTrangThai({}), 'canXemLai', 'mặc định là CHƯA ai nhìn, không phải "sẵn sàng"');
assert.strictEqual(tinhTrangThai({ daXem: true }), 'sanSang');
assert.strictEqual(tinhTrangThai({ dangTaiLen: true }), 'dangTaiLen');
assert.strictEqual(tinhTrangThai({ dangDuaVao: true, daXem: true }), 'dangDuaVao');
assert.strictEqual(tinhTrangThai({ daVaoThuVien: true }), 'daVaoThuVien');
assert.strictEqual(
  tinhTrangThai({ daVaoThuVien: true, daXem: false }),
  'daVaoThuVien',
  'đã vào Thư viện thì thôi hỏi "xem chưa"',
);
assert.strictEqual(
  tinhTrangThai({ dangDuaVao: true, daVaoThuVien: true }),
  'dangDuaVao',
  'việc ĐANG CHẠY thắng kết quả cũ — bấm lại phải thấy "đang", không thấy "đã"',
);
assert.strictEqual(
  tinhTrangThai({ lyDoKhongHoTro: 'Loại tệp chưa nhận được.', loi: 'HTTP 500' }),
  'khongHoTro',
  '"không hỗ trợ" cụ thể hơn "lỗi" nên đứng trước',
);
assert.strictEqual(tinhTrangThai({ loi: 'mất mạng' }), 'loi');

// Câu phụ phải là NGUYÊN VĂN của máy chủ — không cắt, không viết lại.
{
  const raw = 'Loại tệp chưa nhận được (magic-bytes: 41 43 31 30).';
  assert.strictEqual(chuPhu('khongHoTro', { lyDoKhongHoTro: raw }), raw);
  assert.strictEqual(chuPhu('loi', { loi: 'HTTP 413' }), 'HTTP 413');
  assert.strictEqual(chuPhu('sanSang', { daXem: true }), null, 'nấc bình thường không đẻ câu phụ');
}

// ── ③ LÝ DO NÚT MỜ ───────────────────────────────────────────────────────────────────────────
assert.strictEqual(lyDoChuaMoTaiSan({ coAsset: true }), null);
assert.strictEqual(lyDoChuaXemDangDung({ coAsset: true }), null);
for (const f of [lyDoChuaMoTaiSan, lyDoChuaXemDangDung]) {
  const l = f({ coAsset: false });
  assert.ok(l && l.vi.trim() && l.en.trim(), 'nút mờ PHẢI kèm lý do hai thứ tiếng — không có nút câm');
}

// ── ④ KHỚP TỆP ↔ TÀI SẢN ─────────────────────────────────────────────────────────────────────
{
  const assets = [
    { id: 'a1', name: 'khác', url: '/x', tags: 'license:user,nguon:projectfile:pf-KHAC' },
    { id: 'a2', name: 'đúng', url: '/y', tags: 'NGUON:PROJECTFILE:PF-1,license:user' },
    { id: 'a3', name: 'rỗng', url: '/z', tags: '' },
  ];
  assert.strictEqual(timAssetTheoTep(assets, 'pf-1')?.id, 'a2', 'khớp tag phải bỏ qua hoa/thường');
  assert.strictEqual(timAssetTheoTep(assets, 'pf-999'), null);
  // Khớp theo TỪNG tag, không `includes` cả chuỗi: id là tiền tố của id khác thì không được dính.
  const bay = [{ id: 'b', name: 'b', url: '/b', tags: 'nguon:projectfile:pf-12345' }];
  assert.strictEqual(timAssetTheoTep(bay, 'pf-123'), null, 'khớp nhầm theo TIỀN TỐ id — gắn nhầm dự án');
}

// ── ⑤ BA NẤC BÊN PHẢI ────────────────────────────────────────────────────────────────────────
assert.strictEqual(NAC_LIST.length, 3);
{
  const hoi = NAC_LIST.map((n) => NAC_NHAN[n].hoi.vi);
  assert.strictEqual(
    new Set(hoi).size,
    3,
    'hai nấc trả lời cùng một câu hỏi ⇒ nấc to chỉ là bản phóng to — trái luật ba-nấc-ba-công-năng',
  );
  for (const n of NAC_LIST) {
    const x = NAC_NHAN[n];
    assert.ok(x.vi.trim() && x.en.trim() && x.hoi.vi.trim() && x.hoi.en.trim(), `nấc "${n}" thiếu nhãn/câu hỏi`);
  }
}

console.log('tep-nguon-trang-thai.test.ts — OK');
