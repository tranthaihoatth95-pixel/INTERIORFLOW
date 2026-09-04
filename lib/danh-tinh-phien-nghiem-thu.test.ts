/**
 * lib/danh-tinh-phien-nghiem-thu.test.ts — NGHIỆM THU P0 mất dữ liệu 04/09.
 *
 * Khác `danh-tinh-phien.test.ts` (khoá hành vi của LÕI giải định danh), file này khoá đúng MỘT
 * thứ: **CA HỎNG NGOÀI ĐỜI có còn không.** Nó dựng lại đúng hình dạng effect mount của ba đường
 * GHI (`components/cad/CadSheets.tsx:402` · `components/present-editor/PresentSheets.tsx:322` ·
 * `lib/cad/cad3d-autosave.ts:32`) rồi đếm SỐ LẦN GHI XUỐNG ĐĨA.
 *
 * CA HỎNG (nguyên văn): người dùng ĐANG ĐĂNG NHẬP hợp lệ mở THẲNG `/projects/[id]/present`
 * (tab mới · bookmark · F5) → làm việc → việc KHÔNG được lưu, KHÔNG báo lỗi.
 *
 * ⚠️ VÌ SAO GIEO Ở `AppChrome` LÀ CHƯA ĐỦ — đây là điều test này tồn tại để chứng minh:
 * `danhTinhSanSang()` chỉ KHỞI ĐỘNG một request. `setLastUserId` sớm nhất cũng phải đợi một
 * microtask + một vòng mạng. Nên MỌI lời gọi `getLastUserId()` ĐỒNG BỘ trong cùng lượt flush
 * effect đó đều trả `null` — **không phụ thuộc thứ tự effect cha/con**, nên đây là thua cuộc
 * chạy đua TẤT ĐỊNH, không phải lỗi thi thoảng.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/danh-tinh-phien-nghiem-thu.test.ts
 */
import { danhTinhSanSang, danhTinhChoLuot, quenLuotDanhTinh } from './danh-tinh-phien';
import { getLastUserId, quenDemTrongBoNho } from './resume';
import { sheetsKey, saveSheets, type SheetsRecord } from './sheets-persist';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const USER = 'usr_deeplink';
const ROUTE = '/present-editor';
const BUCKET = 'prj_westlake';

/* ---- Bàn thử: trình duyệt tối thiểu + phiên máy chủ HỢP LỆ (đúng ca hỏng) ---- */
const g = globalThis as unknown as { window?: unknown; fetch?: unknown };
g.window = {}; // `danhTinhSanSang` cần `typeof window !== 'undefined'`
let soLanHoiMayChu = 0;
g.fetch = () => {
  soLanHoiMayChu += 1;
  // Phiên HỢP LỆ — đúng ca hỏng: máy chủ BIẾT người này là ai, chỉ bộ đệm cục bộ là rỗng.
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ user: { id: USER } }) });
};

/** Đĩa giả: ghi vào đây thì mới tính là "việc được lưu". Ghi khoá nào cũng ghi lại để phân
 *  biệt MẤT HẲN (0 lần ghi) với GHI NHẦM KHOÁ (có ghi, sai bucket). */
const dia: string[] = [];
function luuMotLuot(userId: string | null): void {
  // ⛔ ĐÚNG hình dạng ba đường ghi thật: không có userId thì RETURN, không saver, không ghi.
  if (!userId) return;
  dia.push(sheetsKey(userId, ROUTE, BUCKET));
}

function batDauPhien(): void {
  quenLuotDanhTinh();
  quenDemTrongBoNho();
  dia.length = 0;
}

(async () => {
  console.log('① CA HỎNG — đọc ĐỒNG BỘ lúc mount (hình dạng ba đường ghi HIỆN TẠI)');
  {
    batDauPhien();
    void danhTinhSanSang();          // AppChrome: chỉ KHỞI ĐỘNG request, không await
    const userId = getLastUserId();  // CadSheets/PresentSheets/autosave-3D: đọc ĐỒNG BỘ ngay
    luuMotLuot(userId);
    ok('đệm rỗng lúc mount dù phiên máy chủ HỢP LỆ', userId === null);
    ok('⇒ KHÔNG một byte nào xuống đĩa (đây chính là P0)', dia.length === 0);
    await danhTinhSanSang();
    ok('máy chủ vẫn khẳng định đúng người này', getLastUserId() === USER);
    ok('⇒ thông tin CÓ SẴN, chỉ là đọc quá sớm — không phải thiếu dữ liệu', true);
  }

  console.log('② ĐƯỜNG ĐÃ CHỮA — `danhTinhChoLuot()` chờ đúng một lượt rồi mới đọc');
  {
    batDauPhien();
    void danhTinhSanSang();
    const { tiepTuc, userId } = await danhTinhChoLuot(() => true);
    if (tiepTuc) luuMotLuot(userId);
    ok('giải ra ĐÚNG định danh của phiên máy chủ', userId === USER);
    ok('⇒ việc ĐƯỢC ghi xuống đĩa (đúng 1 lần)', dia.length === 1);
    ok('⇒ ghi vào ĐÚNG bucket của dự án đang mở', dia[0] === `${USER}::${ROUTE}::${BUCKET}`);
  }

  console.log('③ HÌNH DẠNG KHOÁ KHÔNG ĐỔI — dữ liệu cũ trên đĩa phải đọc lại được nguyên vẹn');
  {
    ok('khoá vẫn là `userId::route::projectId`', sheetsKey(USER, ROUTE, BUCKET) === `${USER}::${ROUTE}::${BUCKET}`);
    ok('không có projectId vẫn là khoá cũ `userId::route`', sheetsKey(USER, ROUTE) === `${USER}::${ROUTE}`);
  }

  console.log('④ MẤT HẲN, KHÔNG PHẢI GHI NHẦM KHOÁ — cổng chặn ở tầng ghi');
  {
    const rec: SheetsRecord = { v: 1, activeId: 's0', ts: 1, sheets: [{ id: 's0', name: 'Hồ sơ 1' }] };
    // Giả sử ai đó lỡ tay truyền userId rỗng xuống (autosave 3D truyền `userId ?? ''`):
    ok('userId rỗng ⇒ saveSheets trả 0, KHÔNG mở DB, KHÔNG ghi khoá `::route::bucket`',
      (await saveSheets('', ROUTE, rec, BUCKET)) === 0);
    ok('nếu KHÔNG có cổng chặn thì khoá hỏng sẽ là `::route::bucket` (chứng cứ hình dạng)',
      sheetsKey('', ROUTE, BUCKET) === `::${ROUTE}::${BUCKET}`);
  }

  console.log('⑤ ĐƯỜNG THƯỜNG (đã qua Home/đăng nhập) KHÔNG ĐƯỢC TỐN THÊM REQUEST');
  {
    const truoc = soLanHoiMayChu;
    quenLuotDanhTinh(); // đệm VẪN còn id từ ca trên — mô phỏng phiên đã đăng nhập bình thường
    const r = await danhTinhChoLuot(() => true);
    ok('đệm đã có ⇒ trả về ngay', r.userId === USER);
    ok('đệm đã có ⇒ 0 request tới máy chủ', soLanHoiMayChu === truoc);
  }

  console.log('⑥ ĐỔI DỰ ÁN GIỮA CHỪNG — lượt cũ phải DỪNG, không ghi đè bucket mới');
  {
    batDauPhien();
    void danhTinhSanSang();
    let conSong = true;
    const p = danhTinhChoLuot(() => conSong);
    conSong = false;            // bucketId đổi ⇒ effect cũ bị dọn
    const { tiepTuc, userId } = await p;
    if (tiepTuc) luuMotLuot(userId);
    ok('lượt đã huỷ ⇒ tiepTuc=false', tiepTuc === false);
    ok('lượt đã huỷ ⇒ KHÔNG ghi gì (không đè dự án mới)', dia.length === 0);
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
