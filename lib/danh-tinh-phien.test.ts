/**
 * lib/danh-tinh-phien.test.ts — KHOÁ HÀNH VI cho P0 mất dữ liệu 04/09.
 *
 * Bệnh: người dùng ĐANG ĐĂNG NHẬP mở thẳng `/projects/[id]/cad` (tab mới/bookmark/F5) thì bộ
 * đệm `lastUserId` rỗng ⇒ CadSheets/PresentSheets/autosave 3D chạy nhánh "thuần in-memory" ⇒
 * KHÔNG ghi gì xuống IndexedDB, KHÔNG báo lỗi. Máy chủ vẫn biết người này là ai — nên định danh
 * phải giải từ PHIÊN MÁY CHỦ, localStorage chỉ là bộ đệm.
 *
 * Năm bất biến test này canh, theo đúng thứ tự quan trọng:
 *   ① KHÔNG CHẮC THÌ KHÔNG GHI — thà không lưu còn hơn lưu nhầm chỗ người khác.
 *   ② CÓ PHIÊN MÁY CHỦ THÌ PHẢI GIẢI RA ĐƯỢC ĐỊNH DANH (đúng id, ghi đúng một lần).
 *   ③ ĐƯỜNG THƯỜNG KHÔNG ĐƯỢC CHẬM — đệm đã có thì 0 request, 0 đồng hồ, xong trong microtask.
 *   ④ MÁY CHỦ TREO KHÔNG ĐƯỢC TREO APP — hết giờ thì buông, không ghi gì (đừng đổi bệnh
 *      mất-dữ-liệu thành bệnh treo-app).
 *   ⑤ ĐỔI DỰ ÁN GIỮA PHIÊN — lượt cũ phải DỪNG, không ghi đè trạng thái lượt mới.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/danh-tinh-phien.test.ts
 */
import {
  giaiDanhTinh,
  danhTinhSanSang,
  danhTinhChoLuot,
  quenLuotDanhTinh,
  HAN_HOI_MS,
  type DapAnMayChu,
  type PhuThuocDanhTinh,
} from './danh-tinh-phien';
import { setLastUserId, getLastUserId, quenDemTrongBoNho } from './resume';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

/** Đồng hồ KHÔNG BAO GIỜ reo — dùng cho mọi ca không thử nhánh hết giờ (không để timer treo). */
const chuongCam = () => new Promise<void>(() => {});

/** Bàn thử: đếm request + bắt mọi lần ghi đệm, để phân biệt "im lặng" với "ghi bừa". */
function ban(
  dem: string | null,
  dapAn: (() => Promise<DapAnMayChu>) | 'nem' | 'treo',
  chuong: () => Promise<void> = chuongCam,
) {
  const daGhi: string[] = [];
  let soLanHoi = 0;
  let soLanXemDongHo = 0;
  let daCat = false;
  const deps: PhuThuocDanhTinh = {
    docDem: () => dem,
    ghiDem: (id: string) => { daGhi.push(id); },
    hoiMayChu: () => {
      soLanHoi += 1;
      if (dapAn === 'nem') return Promise.reject(new Error('mạng đứt'));
      if (dapAn === 'treo') return new Promise<DapAnMayChu>(() => {}); // không bao giờ trả lời
      return dapAn();
    },
    chuongHetGio: () => {
      soLanXemDongHo += 1;
      return chuong();
    },
    cat: () => { daCat = true; },
  };
  return { deps, daGhi, soLanHoi: () => soLanHoi, soLanXemDongHo: () => soLanXemDongHo, daCat: () => daCat };
}

const traLoi = (status: number, than: unknown, hongJson = false): (() => Promise<DapAnMayChu>) =>
  () => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => (hongJson ? Promise.reject(new Error('thân hỏng')) : Promise.resolve(than)),
  });

void (async () => {
  console.log('① KHÔNG CHẮC THÌ KHÔNG GHI — mọi nhánh mơ hồ đều phải để đệm nguyên trạng');
  {
    const b = ban(null, traLoi(401, { user: null, reason: 'anonymous' }));
    const r = await giaiDanhTinh(b.deps);
    ok('401 → kết luận "chưa đăng nhập"', r.trangThai === 'chua-dang-nhap');
    ok('401 → KHÔNG ghi đệm', b.daGhi.length === 0);
  }
  {
    const b = ban(null, traLoi(503, { user: null, reason: 'server-unavailable' }));
    const r = await giaiDanhTinh(b.deps);
    ok('503 → KHÔNG kết luận là chưa đăng nhập', r.trangThai === 'khong-ket-luan');
    ok('503 → KHÔNG ghi đệm', b.daGhi.length === 0);
  }
  {
    const b = ban(null, 'nem');
    const r = await giaiDanhTinh(b.deps);
    ok('mạng đứt → không kết luận, app không ném lỗi', r.trangThai === 'khong-ket-luan');
    ok('mạng đứt → KHÔNG ghi đệm', b.daGhi.length === 0);
  }
  {
    const b = ban(null, traLoi(200, { user: null }));
    const r = await giaiDanhTinh(b.deps);
    ok('200 mà thân không có user.id → KHÔNG ghi đệm', b.daGhi.length === 0 && r.trangThai === 'khong-ket-luan');
  }
  {
    const b = ban(null, traLoi(200, { user: { id: '   ' } }));
    await giaiDanhTinh(b.deps);
    ok('id toàn khoảng trắng → KHÔNG ghi đệm', b.daGhi.length === 0);
  }
  {
    const b = ban(null, traLoi(200, null, true));
    const r = await giaiDanhTinh(b.deps);
    ok('thân JSON hỏng → KHÔNG ghi đệm', b.daGhi.length === 0 && r.trangThai === 'khong-ket-luan');
  }

  console.log('② CÓ PHIÊN MÁY CHỦ → PHẢI GIẢI RA ĐỊNH DANH (đây là ca P0: vào thẳng URL studio)');
  {
    const b = ban(null, traLoi(200, { user: { id: 'usr_abc', name: 'Hoà', email: 'a@b.c' } }));
    const r = await giaiDanhTinh(b.deps);
    ok('đệm rỗng + phiên hợp lệ → gieo mới', r.trangThai === 'gieo-moi');
    ok('giải ra ĐÚNG id của máy chủ', r.trangThai === 'gieo-moi' && r.userId === 'usr_abc');
    ok('ghi đệm ĐÚNG MỘT lần, đúng giá trị', b.daGhi.length === 1 && b.daGhi[0] === 'usr_abc');
  }

  console.log('③ ĐƯỜNG THƯỜNG (đã qua Home) KHÔNG ĐƯỢC CHẬM — 0 request, 0 đồng hồ, xong microtask');
  {
    const b = ban('usr_cu', traLoi(200, { user: { id: 'usr_moi' } }));
    let xong = false;
    const p = giaiDanhTinh(b.deps).then((r) => { xong = true; return r; });
    // Nhường vài microtask — KHÔNG nhường macrotask (không setTimeout). Chạm mạng là trượt ca này.
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    ok('xong ngay trong microtask (không chờ mạng)', xong);
    const r = await p;
    ok('trả thẳng id trong đệm', r.trangThai === 'da-co' && r.userId === 'usr_cu');
    ok('KHÔNG hỏi máy chủ lần nào', b.soLanHoi() === 0);
    ok('KHÔNG cả đụng tới đồng hồ hết giờ', b.soLanXemDongHo() === 0);
    ok('KHÔNG ghi đè đệm đang có', b.daGhi.length === 0);
  }

  console.log('④ MÁY CHỦ TREO → hết giờ thì buông, KHÔNG treo app, KHÔNG ghi gì');
  {
    // Máy chủ không bao giờ trả lời; chuông reo ngay (đồng hồ giả — không chờ 8 giây thật).
    const b = ban(null, 'treo', () => Promise.resolve());
    const r = await giaiDanhTinh(b.deps);
    ok('hết giờ → khong-ket-luan, lý do "het-gio"', r.trangThai === 'khong-ket-luan' && r.lyDo === 'het-gio');
    ok('hết giờ → KHÔNG ghi đệm (không đoán bừa là ai)', b.daGhi.length === 0);
    ok('hết giờ → CẮT request, không để kết nối mồ côi', b.daCat());
  }
  {
    // Máy chủ trả lời TRƯỚC chuông ⇒ chuông thua, không được cắt oan.
    const b = ban(null, traLoi(200, { user: { id: 'usr_kip' } }), chuongCam);
    const r = await giaiDanhTinh(b.deps);
    ok('trả lời kịp → vẫn gieo bình thường', r.trangThai === 'gieo-moi');
    ok('trả lời kịp → KHÔNG cắt request', !b.daCat());
  }
  ok('hạn hỏi là số hữu hạn, đủ rộng cho máy chủ chậm', HAN_HOI_MS > 0 && HAN_HOI_MS <= 15000);

  console.log('⑤ ĐỔI DỰ ÁN GIỮA PHIÊN — lượt cũ phải DỪNG, không ghi đè lượt mới');
  {
    quenLuotDanhTinh();
    quenDemTrongBoNho();
    let conSong = true;
    const p = danhTinhChoLuot(() => conSong);
    conSong = false; // effect cũ bị dọn NGAY trong lúc đang chờ định danh (bucketId đổi)
    const r = await p;
    ok('lượt đã huỷ → tiepTuc = false', r.tiepTuc === false);
    ok('lượt đã huỷ → KHÔNG trả userId để caller lỡ tay dùng', r.userId === null);
  }
  {
    quenLuotDanhTinh();
    quenDemTrongBoNho();
    const r = await danhTinhChoLuot(() => true);
    ok('lượt còn sống → tiepTuc = true', r.tiepTuc === true);
  }

  console.log('⑥ ĐƯỜNG LÙI BỘ NHỚ — localStorage bị chặn thì định danh vẫn dùng được cả tab');
  {
    // Trong node KHÔNG có `localStorage` ⇒ `setItem` ném ⇒ ĐÚNG ca trình duyệt chặn ghi
    // (chế độ riêng tư / Safari / webview / origin bị thu hồi bộ nhớ).
    quenDemTrongBoNho();
    ok('trước khi định danh: đệm rỗng', getLastUserId() === null);
    setLastUserId('usr_ls_chan');
    ok('localStorage ném mà vẫn đọc lại được id (đường lùi bộ nhớ)', getLastUserId() === 'usr_ls_chan');
    setLastUserId('');
    ok('id rỗng KHÔNG được đè lên id thật', getLastUserId() === 'usr_ls_chan');
    quenDemTrongBoNho();
    ok('quên đường lùi → về rỗng (không rò sang ca sau)', getLastUserId() === null);
  }

  console.log('⑦ Ngoài trình duyệt (SSR/test) → im lặng, không đụng gì');
  {
    quenLuotDanhTinh();
    const r = await danhTinhSanSang();
    ok('không có window → không kết luận, không ném', r.trangThai === 'khong-ket-luan');
    quenLuotDanhTinh();
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
