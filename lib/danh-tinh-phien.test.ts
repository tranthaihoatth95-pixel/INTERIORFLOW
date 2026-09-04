/**
 * lib/danh-tinh-phien.test.ts — KHOÁ HÀNH VI cho P0 mất dữ liệu 04/09.
 *
 * Bệnh: người dùng ĐANG ĐĂNG NHẬP mở thẳng `/projects/[id]/cad` (tab mới/bookmark/F5) thì bộ
 * đệm `lastUserId` rỗng ⇒ CadSheets/PresentSheets chạy nhánh "thuần in-memory" ⇒ KHÔNG ghi gì
 * xuống IndexedDB, KHÔNG báo lỗi. Máy chủ vẫn biết người này là ai — nên định danh phải giải
 * từ PHIÊN MÁY CHỦ, localStorage chỉ là bộ đệm.
 *
 * Hai bất biến test này canh, theo đúng thứ tự quan trọng:
 *   ① KHÔNG CHẮC THÌ KHÔNG GHI — thà không lưu còn hơn lưu nhầm chỗ người khác.
 *   ② CÓ PHIÊN MÁY CHỦ THÌ PHẢI GIẢI RA ĐƯỢC ĐỊNH DANH (đúng id, ghi đúng một lần).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/danh-tinh-phien.test.ts
 */
import { giaiDanhTinh, danhTinhSanSang, quenLuotDanhTinh, type DapAnMayChu } from './danh-tinh-phien';

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

/** Bàn thử: đếm request + bắt mọi lần ghi đệm, để phân biệt "im lặng" với "ghi bừa". */
function ban(dem: string | null, dapAn: (() => Promise<DapAnMayChu>) | 'nem') {
  const daGhi: string[] = [];
  let soLanHoi = 0;
  return {
    daGhi,
    soLanHoi: () => soLanHoi,
    deps: {
      docDem: () => dem,
      ghiDem: (id: string) => { daGhi.push(id); },
      hoiMayChu: () => {
        soLanHoi += 1;
        if (dapAn === 'nem') return Promise.reject(new Error('mạng đứt'));
        return dapAn();
      },
    },
  };
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

  console.log('③ ĐỆM ĐÃ CÓ → KHÔNG tốn request (đường thường, tuyệt đại đa số lượt vào trang)');
  {
    const b = ban('usr_cu', traLoi(200, { user: { id: 'usr_moi' } }));
    const r = await giaiDanhTinh(b.deps);
    ok('trả thẳng id trong đệm', r.trangThai === 'da-co' && r.userId === 'usr_cu');
    ok('KHÔNG hỏi máy chủ lần nào', b.soLanHoi() === 0);
    ok('KHÔNG ghi đè đệm đang có', b.daGhi.length === 0);
  }

  console.log('④ Ngoài trình duyệt (SSR/test) → im lặng, không đụng gì');
  {
    quenLuotDanhTinh();
    const r = await danhTinhSanSang();
    ok('không có window → không kết luận, không ném', r.trangThai === 'khong-ket-luan');
    quenLuotDanhTinh();
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
