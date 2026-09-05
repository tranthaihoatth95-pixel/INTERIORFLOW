/**
 * lib/present-editor/to-ban-ve.test.ts — canh HAI LUẬT NGHỀ bằng máy. Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/to-ban-ve.test.ts
 *
 * Môi trường node KHÔNG có sessionStorage → chính là kịch bản "storage hỏng": gửi phải rơi xuống
 * fallback bộ nhớ và nhận vẫn đủ (consume-once), y bài học B1 của handoff.ts.
 */
import { STANDARD_SCALES } from '../cad/model';
import {
  TY_LE_BAN_VE,
  laTyLeChuan,
  nhanTyLe,
  vungInMm,
  tyLeVuaKhung,
  tyLeApDung,
  dauVetNguon,
  trangThaiNguon,
  coTheTuCapNhat,
  khungTenRong,
  guiToSangTrinhChieu,
  nhanToTuChang,
  coToDangCho,
  ghiDauVetNguon,
  docDauVetNguon,
  type ToBanVe,
  type NeoNguon,
} from './to-ban-ve';

let pass = 0;
let fail = 0;
function t(name: string, fn: () => void) {
  try {
    fn();
    pass++;
  } catch (e) {
    fail++;
    console.error(`✗ ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function eq(a: unknown, b: unknown, msg = '') {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${msg} — nhận ${sa}, mong ${sb}`);
}
function ok(v: unknown, msg = '') {
  if (!v) throw new Error(msg || 'mong true');
}

/* ── dãy tỉ lệ không được trôi khỏi LUẬT chuẩn đầu ra ─────────────────────────────── */

t('TY_LE_BAN_VE là TẬP CON của STANDARD_SCALES (không đẻ dãy tỉ lệ thứ hai)', () => {
  for (const n of TY_LE_BAN_VE) {
    ok((STANDARD_SCALES as readonly number[]).includes(n), `1:${n} không có trong STANDARD_SCALES`);
  }
});

t('TY_LE_BAN_VE tăng dần — tyLeVuaKhung dựa vào thứ tự này để lấy tỉ lệ NHỎ NHẤT đủ dùng', () => {
  for (let i = 1; i < TY_LE_BAN_VE.length; i++) {
    ok(TY_LE_BAN_VE[i] > TY_LE_BAN_VE[i - 1], 'dãy phải tăng dần');
  }
});

t('nhanTyLe đọc được', () => {
  eq(nhanTyLe({ kieu: 'chuan', n: 50 }), '1:50');
  eq(nhanTyLe({ kieu: 'tuy-chinh', n: 75 }), '1:75');
  eq(nhanTyLe({ kieu: 'vua-khung' }), 'Vừa khung');
  eq(laTyLeChuan(50), true);
  eq(laTyLeChuan(75), false);
});

/* ── 🔴 LUẬT ①: CẤM CO GIÃN ÂM THẦM ───────────────────────────────────────────────── */

const A3_NGANG = { rongMm: 420, caoMm: 297 };

t('vungInMm trừ lề hai bên, lề âm bị kẹp về 0', () => {
  eq(vungInMm(A3_NGANG, 10), { rongMm: 400, caoMm: 277 });
  eq(vungInMm(A3_NGANG, -5), { rongMm: 420, caoMm: 297 });
});

t('1:50 vừa giấy ⇒ giữ nguyên 50, không cảnh báo', () => {
  const r = tyLeApDung({ kieu: 'chuan', n: 50 }, { rongMm: 15000, caoMm: 10000 }, vungInMm(A3_NGANG, 10));
  eq(r.n, 50);
  eq(r.tranKhung, false);
  eq(r.canhBao, null);
});

t('⛔ 1:20 KHÔNG lọt giấy ⇒ VẪN trả 20 (không tự hạ xuống 1:100), có cảnh báo', () => {
  const r = tyLeApDung({ kieu: 'chuan', n: 20 }, { rongMm: 15000, caoMm: 10000 }, vungInMm(A3_NGANG, 10));
  eq(r.n, 20, 'máy TỰ ĐỔI tỉ lệ = hỏng hồ sơ — đây là luật nghề, không phải chuyện thẩm mỹ');
  eq(r.tranKhung, true);
  ok(r.canhBao && r.canhBao.includes('không tự co giãn'), 'phải nói rõ máy không tự đổi');
});

t('⛔ tỉ lệ tuỳ chỉnh cũng KHÔNG bị co giãn âm thầm', () => {
  const r = tyLeApDung({ kieu: 'tuy-chinh', n: 33 }, { rongMm: 15000, caoMm: 10000 }, vungInMm(A3_NGANG, 10));
  eq(r.n, 33);
  eq(r.tranKhung, true);
});

t('"Vừa khung" CHỈ chạy khi người dùng chọn tường minh — và lấy tỉ lệ CHUẨN nhỏ nhất đủ dùng', () => {
  const vungIn = vungInMm(A3_NGANG, 10);
  eq(tyLeVuaKhung({ rongMm: 15000, caoMm: 10000 }, vungIn), 50);
  const r = tyLeApDung({ kieu: 'vua-khung' }, { rongMm: 15000, caoMm: 10000 }, vungIn);
  eq(r.n, 50);
  eq(r.tranKhung, false);
});

t('Vừa khung mà cả dãy chuẩn đều không đủ ⇒ KHÔNG bịa số lẻ ngoài dãy, báo tràn', () => {
  const vungIn = vungInMm(A3_NGANG, 10);
  eq(tyLeVuaKhung({ rongMm: 900000, caoMm: 900000 }, vungIn), null);
  const r = tyLeApDung({ kieu: 'vua-khung' }, { rongMm: 900000, caoMm: 900000 }, vungIn);
  ok(laTyLeChuan(r.n), 'tỉ lệ trả về phải nằm trong dãy chuẩn — số lẻ kiểu 1:47 là thứ LUẬT cấm');
  eq(r.tranKhung, true);
});

t('nội dung rỗng ⇒ tyLeVuaKhung trả null thay vì chia cho 0', () => {
  eq(tyLeVuaKhung({ rongMm: 0, caoMm: 0 }, vungInMm(A3_NGANG, 10)), null);
});

/* ── 🔴 LUẬT ②: NGUỒN ĐỔI ⇒ ĐÁNH DẤU CŨ, KHÔNG TỰ SỬA ────────────────────────────── */

t('dauVetNguon TẤT ĐỊNH — chạy 10 lần ra 10 kết quả giống nhau', () => {
  const a = dauVetNguon(['doc-1', 42, 'A3', 50]);
  for (let i = 0; i < 10; i++) eq(dauVetNguon(['doc-1', 42, 'A3', 50]), a);
  ok(dauVetNguon(['doc-1', 43, 'A3', 50]) !== a, 'đổi một mẩu là dấu vết phải đổi');
  ok(dauVetNguon(['doc-2', 42, 'A3', 50]) !== a, 'đổi docId là dấu vết phải đổi');
});

const neo = (dauVet: string): NeoNguon => ({ chang: 'cad2d', docId: 'doc-1', dauVet, luc: 1 });

t('nguồn không đổi ⇒ Hiện hành', () => {
  eq(trangThaiNguon(neo('abc'), 'abc'), 'hien-hanh');
});

t('⛔ nguồn ĐỔI ⇒ "cu" (đánh dấu), KHÔNG có đường nào tự ghi đè tờ', () => {
  eq(trangThaiNguon(neo('abc'), 'xyz'), 'cu');
});

t('không đọc được dấu vết nguồn ⇒ "khong-ro", KHÔNG đoán thành hien-hanh', () => {
  eq(trangThaiNguon(neo('abc'), null), 'khong-ro');
  eq(trangThaiNguon(neo('abc'), undefined), 'khong-ro');
  eq(trangThaiNguon(neo('abc'), ''), 'khong-ro');
});

const toMau = (over: Partial<ToBanVe> = {}): ToBanVe => ({
  id: 'to-1',
  nhan: 'Mặt bằng bố trí',
  khoGiay: 'A3',
  huong: 'landscape',
  le: 10,
  tyLe: { kieu: 'chuan', n: 50 },
  khungTen: khungTenRong(),
  neo: neo('abc'),
  noiDungMm: { rongMm: 15000, caoMm: 10000 },
  ...over,
});

t('⛔ tờ ĐÃ PHÁT HÀNH thì máy không được tự cập nhật, dù nguồn đổi', () => {
  eq(coTheTuCapNhat(toMau()), true);
  eq(coTheTuCapNhat(toMau({ daPhatHanh: true })), false);
});

/* ── cầu 2D/3D → Present ─────────────────────────────────────────────────────────── */

t('storage hỏng (node) ⇒ rơi fallback bộ nhớ, nhận vẫn đủ + consume-once', () => {
  eq(coToDangCho(), false, 'đầu bài phải sạch');
  guiToSangTrinhChieu([toMau(), toMau({ id: 'to-2' })]);
  eq(coToDangCho(), true, 'coToDangCho KHÔNG được tiêu thụ');
  const nhan1 = nhanToTuChang();
  eq(nhan1.length, 2);
  eq(nhan1[0].id, 'to-1');
  eq(nhan1[1].tyLe, { kieu: 'chuan', n: 50 }, 'tỉ lệ phải qua cầu nguyên vẹn');
  eq(nhanToTuChang().length, 0, 'consume-once: lần hai phải rỗng');
  eq(coToDangCho(), false);
});

t('gửi rỗng ⇒ false, không làm bẩn cầu', () => {
  eq(guiToSangTrinhChieu([]), false);
  eq(nhanToTuChang().length, 0);
});

t('neo nguồn đi qua cầu nguyên vẹn — dây về nguồn không được đứt khi chuyển chặng', () => {
  guiToSangTrinhChieu([toMau({ neo: { chang: 'model3d', docId: 'scene-9', sheetId: 'vp-2', dauVet: 'zz', luc: 7 } })]);
  const [t1] = nhanToTuChang();
  eq(t1.neo.chang, 'model3d');
  eq(t1.neo.docId, 'scene-9');
  eq(t1.neo.sheetId, 'vp-2');
  eq(t1.neo.dauVet, 'zz');
});

/* ── sổ dấu vết nguồn (2D ghi · Present đọc) ─────────────────────────────────────── */

t('không có localStorage ⇒ đọc trả null ⇒ trạng thái "khong-ro", KHÔNG đoán hien-hanh', () => {
  eq(docDauVetNguon('doc-1'), null);
  eq(trangThaiNguon(neo('abc'), docDauVetNguon('doc-1')), 'khong-ro');
});

t('ghi vào sổ hỏng ⇒ trả false, không ném lỗi làm sập chặng nguồn', () => {
  eq(ghiDauVetNguon('doc-1', 'abc'), false);
});

t('docId rỗng ⇒ không ghi, đọc trả null', () => {
  eq(ghiDauVetNguon('', 'abc'), false);
  eq(docDauVetNguon(''), null);
});

t('sổ dấu vết chạy đúng khi CÓ localStorage (giả lập) — 2D ghi, Present đọc thấy CŨ', () => {
  const kho = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => kho.get(k) ?? null,
    setItem: (k: string, v: string) => void kho.set(k, v),
    removeItem: (k: string) => void kho.delete(k),
  };
  try {
    const cu = dauVetNguon(['doc-9', 10]);
    eq(ghiDauVetNguon('doc-9', cu), true);
    // tờ được gửi lúc nguồn còn ở dấu vết `cu`
    const neoTo = { chang: 'cad2d' as const, docId: 'doc-9', dauVet: cu, luc: 1 };
    eq(trangThaiNguon(neoTo, docDauVetNguon('doc-9')), 'hien-hanh');
    // nguồn ĐỔI (thêm entity) → 2D ghi dấu vết mới
    ghiDauVetNguon('doc-9', dauVetNguon(['doc-9', 11]));
    eq(trangThaiNguon(neoTo, docDauVetNguon('doc-9')), 'cu', 'nguồn đổi phải ra CŨ');
    // ⛔ và tờ KHÔNG bị hàm nào ở đây sửa — chỉ trạng thái đổi
    eq(neoTo.dauVet, cu, 'neo của tờ phải nguyên vẹn, máy không tự ghi đè');
  } finally {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
});

console.log(`${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
