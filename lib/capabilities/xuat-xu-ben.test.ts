/**
 * lib/capabilities/xuat-xu-ben.test.ts — khoá hợp đồng GHI BỀN xuất xứ (W1-6).
 *
 * Chạy: `npx sucrase-node lib/capabilities/xuat-xu-ben.test.ts` (import TƯƠNG ĐỐI, không `@/`).
 *
 * ⚠️ CỔNG HARNESS (F-15) ở [0]: một test chỉ đúng khi nó thật sự nạp module thật. Ở đây cổng là
 *    `KHOA_LUU` + đúng bộ hàm xuất — nạp phải file rỗng là đỏ ngay dòng đầu, không phải xanh giả.
 * ⚠️ F-17: khẳng định phải có CHỦ THỂ (kiểm trường tồn tại + đúng kiểu trước khi kiểm nội dung),
 *    và nhóm ca phải có ít nhất một ca **mong THẤY** — [2] là ca dương tính đó.
 */

import assert from 'node:assert';
import {
  KHOA_LUU,
  TRAN_BAN_GHI,
  coBatPersist,
  docXuatXuBen,
  ghiXuatXuBen,
  luocAnhNang,
  subscribeSuCoGhi,
  suCoGhiGanNhat,
  xoaSuCoGhi,
  xoaXuatXuBen,
  type SuCoGhi,
} from './xuat-xu-ben';
import { dungKeHoach, dungXuatXu, type XuatXu, type YeuCauDung } from './visual-generate';
import { nhanDeXuat, getNguonAnh, resetNguonAnh, themDeXuat } from './nguon-anh';

/* ── [0] CỔNG HARNESS ─────────────────────────────────────────────────────────────────────── */
assert.equal(typeof KHOA_LUU, 'string', '[0] HARNESS: KHOA_LUU không phải chuỗi — module rỗng?');
assert.ok(KHOA_LUU.length > 0, '[0] HARNESS: KHOA_LUU rỗng');
for (const [ten, f] of Object.entries({ ghiXuatXuBen, docXuatXuBen, luocAnhNang, coBatPersist })) {
  assert.equal(typeof f, 'function', `[0] HARNESS: thiếu hàm ${ten} — module không nạp đúng`);
}
assert.equal(typeof TRAN_BAN_GHI, 'number', '[0] HARNESS: TRAN_BAN_GHI mất');

/* ── kho giả: đủ mặt `Storage` mà test cần, và ném được theo lệnh ─────────────────────────── */
class KhoGia {
  map = new Map<string, string>();
  nemKhiGhi: Error | null = null;
  get length() {
    return this.map.size;
  }
  getItem(k: string) {
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    if (this.nemKhiGhi) throw this.nemKhiGhi;
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
}

const G = globalThis as Record<string, unknown>;
function datKho(k: KhoGia | null) {
  if (k) G.localStorage = k as unknown as Storage;
  else delete G.localStorage;
}
function datCo(bat: boolean) {
  if (bat) G.__IF_PERSIST_XUATXU = '1';
  else delete G.__IF_PERSIST_XUATXU;
}
// Môi trường test không được thừa hưởng cờ thật từ shell — đặt lại cho tất định.
delete process.env.IF_PERSIST_XUATXU;
delete process.env.NEXT_PUBLIC_IF_PERSIST_XUATXU;

// Tầng máy chủ không được chạm mạng trong test thuần: xuất xứ dựng ở đây KHÔNG có `nguonId`,
// đúng như đường chạy sản xuất hôm nay (`StageToolbelt.tsx` không truyền `nguonId`).
const ANH_DATA = `data:image/png;base64,${'A'.repeat(400)}`;

function xuatXuMau(over: Partial<YeuCauDung> = {}): XuatXu {
  const yc: YeuCauDung = {
    anhNguon: ANH_DATA,
    kieuNguon: 'phac',
    yDinh: 'phòng khách tối giản',
    nac: 'nhanh',
    doiAnhSang: 'Daylight',
    ...over,
  };
  return dungXuatXu({
    yeuCau: yc,
    chuoi: dungKeHoach(yc),
    creditUocTinh: 7,
    taoLuc: 1_700_000_000_000,
    provider: 'proof-provider',
    model: 'proof-model',
  });
}

/**
 * Toàn bộ ca nằm trong một hàm async: `sucrase-node` biên dịch sang CJS, mà CJS KHÔNG cho
 * top-level await. Cổng harness [0] ở trên cố ý đứng NGOÀI để đỏ ngay khi module nạp sai.
 */
async function chay() {

/* ── [1] CỜ TẮT ⇒ KHÔNG GHI GÌ ────────────────────────────────────────────────────────────── */
{
  const kho = new KhoGia();
  datKho(kho);
  datCo(false);
  assert.equal(coBatPersist(), false, '[1] cờ phải TẮT ở mặc định');
  const kq = await ghiXuatXuBen({ id: 'd1', xuatXu: xuatXuMau(), anhKetQua: ANH_DATA });
  assert.equal(kq.ok, false, '[1] cờ tắt thì không báo ok');
  assert.equal(kq.boQua, 'co-tat', '[1] phải nói rõ lý do bỏ qua là cờ tắt');
  assert.equal(kho.map.size, 0, '[1] CỜ TẮT MÀ VẪN GHI — vi phạm luật bắt buộc của Wave 1');
  assert.deepEqual(docXuatXuBen(), [], '[1] kho phải trống');
}

/* ── [2] CA MONG THẤY · ghi → đọc lại → XuatXu ĐỦ TRƯỜNG (F-17: chủ thể trước, nội dung sau) ─ */
{
  const kho = new KhoGia();
  datKho(kho);
  datCo(true);
  xoaSuCoGhi();
  assert.equal(coBatPersist(), true, '[2] cờ phải BẬT');

  const goc = xuatXuMau();
  const kq = await ghiXuatXuBen({ id: 'd2', xuatXu: goc, anhKetQua: ANH_DATA });
  assert.equal(kq.ok, true, '[2] ghi phải thành công');
  assert.equal(kq.cucBo, undefined, '[2] không được có sự cố cục bộ');

  // ── chủ thể: kho có thật, mục có thật ──
  assert.notEqual(kho.getItem(KHOA_LUU), null, '[2] KHÔNG có mục nào dưới KHOA_LUU — ghi trượt chỗ');
  const ds = docXuatXuBen();
  assert.equal(Array.isArray(ds), true, '[2] docXuatXuBen phải trả mảng');
  assert.equal(ds.length, 1, '[2] phải đọc lại đúng 1 bản ghi');
  const b = ds[0];
  assert.equal(b.id, 'd2', '[2] id sai');
  const x = b.xuatXu;
  assert.equal(typeof x, 'object', '[2] xuatXu không phải object');

  // ── nội dung: ĐỦ TRƯỜNG của `XuatXu` ──
  for (const truong of [
    'nangLucId', 'nguon', 'chuoiLenh', 'thamSo', 'provider', 'model',
    'taoLuc', 'creditUocTinh', 'mucSuThat', 'trangThaiNhan',
  ] as const) {
    assert.ok(truong in x, `[2] xuất xứ đọc lại THIẾU trường ${truong}`);
  }
  assert.equal(x.nangLucId, goc.nangLucId, '[2] nangLucId lệch');
  assert.equal(x.provider, 'proof-provider', '[2] provider lệch');
  assert.equal(x.model, 'proof-model', '[2] model lệch');
  assert.equal(x.taoLuc, 1_700_000_000_000, '[2] taoLuc lệch');
  assert.equal(x.creditUocTinh, 7, '[2] creditUocTinh lệch');
  assert.equal(x.mucSuThat, goc.mucSuThat, '[2] mucSuThat lệch');
  assert.ok(Array.isArray(x.chuoiLenh) && x.chuoiLenh.length > 0, '[2] chuoiLenh rỗng — mất chuỗi lệnh');
  assert.deepEqual([...x.chuoiLenh], [...goc.chuoiLenh], '[2] chuoiLenh lệch');
  assert.deepEqual(x.thamSo, goc.thamSo, '[2] thamSo lệch');
  assert.equal(x.nguon.kieu, 'phac', '[2] kiểu nguồn lệch');

  // ── luật "giữ xuất xứ, KHÔNG nhồi base64" — và việc lược phải được KHAI ──
  assert.equal(x.nguon.anh, undefined, '[2] ảnh nguồn data: URL bị nhồi vào kho — vỡ quota chờ sẵn');
  assert.ok(b.anhNguonLuoc && b.anhNguonLuoc.bytes > 0, '[2] lược ảnh mà KHÔNG khai — dữ liệu cắt lén');
  assert.equal(b.anhKetQua, '', '[2] ảnh kết quả data: URL phải bị lược');
  assert.equal(b.anhKetQuaLuoc, true, '[2] lược ảnh kết quả mà không khai');
  assert.ok(!(kho.getItem(KHOA_LUU) as string).includes('data:image'), '[2] chuỗi lưu vẫn còn base64');
}

/* ── [3] GHI HỎNG ⇒ CÓ ĐƯỜNG BÁO, KHÔNG NÉM RA NGOÀI ─────────────────────────────────────── */
{
  const kho = new KhoGia();
  const eQuota = new Error('The quota has been exceeded.');
  eQuota.name = 'QuotaExceededError';
  kho.nemKhiGhi = eQuota;
  datKho(kho);
  datCo(true);
  xoaSuCoGhi();

  const thay: SuCoGhi[] = [];
  const huy = subscribeSuCoGhi((s) => thay.push(s));

  let nem: unknown = null;
  let kq;
  try {
    kq = await ghiXuatXuBen({ id: 'd3', xuatXu: xuatXuMau(), anhKetQua: '' });
  } catch (e) {
    nem = e;
  }
  huy();

  assert.equal(nem, null, '[3] ghi hỏng mà NÉM ra ngoài — sẽ làm rơi luồng nhận ảnh');
  assert.ok(kq, '[3] phải trả kết quả');
  assert.equal(kq!.ok, false, '[3] ghi hỏng mà báo ok');
  assert.ok(kq!.cucBo, '[3] không có mô tả sự cố trong kết quả');
  assert.equal(kq!.cucBo!.noi, 'cucBo', '[3] sai nơi xảy ra sự cố');
  assert.equal(kq!.cucBo!.ma, 'quota', '[3] không nhận ra lỗi quota');
  assert.ok(kq!.cucBo!.loi.trim().length > 0, '[3] câu lỗi RỖNG — đúng thứ "nuốt im lặng" mà mục này chống');

  assert.equal(thay.length, 1, '[3] đường báo KHÔNG phát — sự cố bị nuốt im lặng');
  assert.equal(thay[0].ma, 'quota', '[3] sự cố phát ra sai mã');
  const gan = suCoGhiGanNhat();
  assert.ok(gan, '[3] suCoGhiGanNhat rỗng — ai không kịp subscribe thì mất dấu');
  assert.equal(gan!.ma, 'quota', '[3] sự cố đọng lại sai mã');
}

/* ── [4] KHÔNG CÓ KHO (SSR/node/trình duyệt chặn) ⇒ báo, không ném ───────────────────────── */
{
  datKho(null);
  datCo(true);
  xoaSuCoGhi();
  const kq = await ghiXuatXuBen({ id: 'd4', xuatXu: xuatXuMau() });
  assert.equal(kq.ok, false, '[4] không có kho mà báo ok');
  assert.equal(kq.cucBo?.ma, 'khong-co-kho', '[4] sai mã sự cố');
  assert.deepEqual(docXuatXuBen(), [], '[4] đọc khi không có kho phải trả mảng rỗng, không ném');
}

/* ── [5] DỮ LIỆU CŨ / THIẾU TRƯỜNG / HỎNG ⇒ ĐỌC ĐƯỢC, KHÔNG CRASH ───────────────────────── */
{
  const kho = new KhoGia();
  datKho(kho);
  datCo(true);

  // Bản ghi thời "v0": chỉ có id + một xuất xứ cụt. Đây là hình dạng chắc chắn tồn tại ngoài đời.
  kho.map.set(
    KHOA_LUU,
    JSON.stringify([
      { id: 'cu-1', xuatXu: { nangLucId: 'visual.generate' } },
      { id: 'cu-2', xuatXu: { chuoiLenh: ['ai.render'], taoLuc: 123 } },
      { khongCoId: true, xuatXu: {} }, // không cứu được → bỏ RIÊNG nó
      'rác',                            // không phải object → bỏ
      null,
    ]),
  );

  let ds: ReturnType<typeof docXuatXuBen> = [];
  assert.doesNotThrow(() => {
    ds = docXuatXuBen();
  }, '[5] đọc dữ liệu cũ mà CRASH');
  assert.equal(ds.length, 2, '[5] phải cứu đúng 2 bản ghi còn dùng được, bỏ riêng phần hỏng');

  const a = ds[0];
  assert.equal(a.id, 'cu-1', '[5] id bản ghi cũ lệch');
  assert.equal(a.xuatXu.nangLucId, 'visual.generate', '[5] mất trường có thật của bản ghi cũ');
  assert.ok(Array.isArray(a.xuatXu.chuoiLenh), '[5] chuoiLenh thiếu phải thành mảng rỗng, không undefined');
  assert.equal(a.xuatXu.chuoiLenh.length, 0, '[5] chuoiLenh thiếu mà lại có phần tử');
  assert.equal(typeof a.xuatXu.thamSo, 'object', '[5] thamSo thiếu phải thành object rỗng');
  assert.equal(a.xuatXu.taoLuc, 0, '[5] taoLuc thiếu phải là 0, không NaN/undefined');
  assert.equal(a.xuatXu.creditUocTinh, 0, '[5] creditUocTinh thiếu phải là 0');
  // Thứ nằm trong kho BỀN chỉ có thể là thứ người đã NHẬN — không được suy ngược thành 'deXuat'.
  assert.equal(a.xuatXu.trangThaiNhan, 'daNhan', '[5] suy sai trạng thái nhận cho bản ghi cũ');
  assert.deepEqual([...ds[1].xuatXu.chuoiLenh], ['ai.render'], '[5] mất chuoiLenh có thật');

  // Kho chứa JSON hỏng hẳn: vẫn không được ném.
  kho.map.set(KHOA_LUU, '{{{ không phải json');
  assert.doesNotThrow(() => docXuatXuBen(), '[5] JSON hỏng mà CRASH');
  assert.deepEqual(docXuatXuBen(), [], '[5] JSON hỏng phải trả rỗng');
}

/* ── [6] TRẦN BẢN GHI — không phình vô hạn, và giữ bản MỚI NHẤT ──────────────────────────── */
{
  const kho = new KhoGia();
  datKho(kho);
  datCo(true);
  for (let i = 0; i < TRAN_BAN_GHI + 5; i++) {
    await ghiXuatXuBen({ id: `n${i}`, xuatXu: xuatXuMau() });
  }
  const ds = docXuatXuBen();
  assert.equal(ds.length, TRAN_BAN_GHI, `[6] vượt trần ${TRAN_BAN_GHI}`);
  assert.equal(ds[ds.length - 1].id, `n${TRAN_BAN_GHI + 4}`, '[6] cắt mất bản MỚI thay vì bản cũ');

  // Ghi lại cùng id ⇒ thay tại chỗ, không nhân đôi.
  const truoc = docXuatXuBen().length;
  await ghiXuatXuBen({ id: `n${TRAN_BAN_GHI + 4}`, xuatXu: xuatXuMau() });
  assert.equal(docXuatXuBen().length, truoc, '[6] ghi lại cùng id lại đẻ thêm bản ghi');
}

/* ── [7] luocAnhNang thuần — không lược thứ KHÔNG phải data: URL ─────────────────────────── */
{
  const coUrl = xuatXuMau({ anhNguon: 'https://cdn.example/anh.png' });
  const r = luocAnhNang(coUrl);
  assert.equal(r.boBytes, 0, '[7] lược nhầm một URL thường');
  assert.equal(r.xuatXu.nguon.anh, 'https://cdn.example/anh.png', '[7] mất tham chiếu ảnh hợp lệ');

  const r2 = luocAnhNang(xuatXuMau());
  assert.ok(r2.boBytes > 0, '[7] không lược data: URL');
  assert.equal(r2.xuatXu.nguon.anh, undefined, '[7] data: URL vẫn còn');
}

/* ── [8] `nhanDeXuat()` — cú bấm của người là chỗ DUY NHẤT ghi bền ───────────────────────── */
{
  const mocDeXuat = (id: string) => ({ id, anh: 'https://cdn.example/kq.png', xuatXu: xuatXuMau() });

  // cờ TẮT ⇒ luồng nhận chạy y hệt hôm nay, kho không mọc gì
  const khoTat = new KhoGia();
  datKho(khoTat);
  datCo(false);
  resetNguonAnh();
  themDeXuat(mocDeXuat('b1'));
  nhanDeXuat('b1');
  assert.equal(getNguonAnh().daNhan.length, 1, '[8] cờ tắt làm hỏng luồng nhận');
  assert.equal(getNguonAnh().anhNguon, 'https://cdn.example/kq.png', '[8] cờ tắt: không đổi ảnh nguồn');
  assert.equal(khoTat.map.size, 0, '[8] CỜ TẮT MÀ nhanDeXuat VẪN GHI');

  // cờ BẬT ⇒ có bản ghi bền, và luồng nhận vẫn nguyên
  const khoBat = new KhoGia();
  datKho(khoBat);
  datCo(true);
  resetNguonAnh();
  themDeXuat(mocDeXuat('b2'));
  nhanDeXuat('b2');
  await new Promise((r) => setTimeout(r, 0)); // ghi là `void` — nhường một nhịp cho microtask
  assert.equal(getNguonAnh().daNhan.length, 1, '[8] cờ bật làm hỏng luồng nhận');
  const ds = docXuatXuBen();
  assert.equal(ds.length, 1, '[8] nhanDeXuat KHÔNG ghi bền khi cờ bật');
  assert.equal(ds[0].id, 'b2', '[8] ghi sai id');
  assert.equal(ds[0].xuatXu.trangThaiNhan, 'daNhan', '[8] ghi bền phải mang trạng thái ĐÃ NHẬN');

  // kho hỏng ⇒ luồng nhận VẪN không rơi (đây là ca đắt nhất của mục này)
  const khoHong = new KhoGia();
  khoHong.nemKhiGhi = new Error('bể');
  datKho(khoHong);
  resetNguonAnh();
  xoaSuCoGhi();
  themDeXuat(mocDeXuat('b3'));
  assert.doesNotThrow(() => nhanDeXuat('b3'), '[8] kho hỏng làm NÉM ở nhanDeXuat');
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(getNguonAnh().daNhan.length, 1, '[8] kho hỏng làm rơi luồng nhận ảnh');
  assert.ok(suCoGhiGanNhat(), '[8] kho hỏng mà KHÔNG có đường báo — nuốt im lặng');
}

}

/* ── dọn — chạy SAU khi mọi ca xong, cả khi đỏ (đừng để lại cờ/kho bẩn cho tiến trình khác) ── */
function don() {
  xoaXuatXuBen();
  resetNguonAnh();
  datCo(false);
  datKho(null);
}

chay().then(
  () => {
    don();
    console.log('xuat-xu-ben.test.ts — ĐẠT (8 nhóm)');
  },
  (e) => {
    don();
    console.error(e);
    process.exit(1);
  },
);
