/**
 * components/nav/muc-dieu-huong.test.ts — khoá RÀNG BUỘC của bảng khai thanh trái
 * [marker: railHaiCum].
 * Chạy: `node_modules/.bin/sucrase-node components/nav/muc-dieu-huong.test.ts`
 *
 * 🔴 NGUỒN CHỐT: **Hoà 20/08 (đợt NAV-HAI-DAO)** — thanh trái CHỈ CÒN VIỆC, HAI ĐẢO DỌC:
 *   ĐẢO A · XƯỞNG/VIỆC : Trang chủ · Dự án · Files · Thư viện · Soát duyệt
 *   ĐẢO B · CHẶNG      : Thiết kế 2D · Thiết kế 3D · Trình chiếu
 * ĐÈ "BA CỤM" của `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 3 (bản đó đã đè "hai cụm"
 * 16-17/08) ở phần DANH SÁCH; điều 4 (Rail 52 · Shelf 240 · Panel 320, trần 440 là nợ) GIỮ.
 * Ràng buộc còn lại vẫn theo `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §5 §6.
 *
 * Mỗi mục dưới đây là MỘT CÁCH HỎNG đã lường trước, không phải một dòng cho đủ lệ:
 *  1. Đúng HAI đảo, đúng danh sách chốt — thêm/bớt mục lặng lẽ là lệch cấu trúc.
 *  2. ⛔ TIÊU CHÍ TRƯỢT của cả đợt: thanh trái KHÔNG được chứa Hồ sơ/Credit/Cài đặt/Tài khoản/
 *     Đăng xuất — chúng sống ở menu ảnh đại diện (cụm phải trên). Cộng ba thứ Hoà đã gỡ từ
 *     trước (Bảng màu · Kho vật liệu · Gallery) không được bò lại.
 *  3. Đường đi: mục cần dự án mà chưa mở dự án phải là `null`, không được ra `/projects/null/...`.
 *  4. Mục đang mở suy đúng từ đường — kể cả `/materials` `/colors` (kệ/bước của Thư viện), và
 *     các route ĐÃ RỜI rail phải trả `null` chứ không sáng nhầm mục khác.
 *  5. Mọi mục mờ đều CÓ lý do đọc được (§9 cấm nút giả không lý do).
 *  6. Nấc 320 bị bỏ thì phải kèm lý do — luật "ba nấc chi tiết là nhịp, không phải hạn ngạch".
 *  7. `nacKe` dừng ở hai đầu dải, không cuộn vòng (cuộn vòng = bấm nhầm là mất chỗ đang đứng).
 */

import {
  MUC_RAIL,
  THU_TU_CUM,
  BE_RONG_NAC,
  THU_TU_NAC,
  nacKe,
  duongCua,
  mucDangMo,
  lyDoMo,
  co320,
  type MucRail,
} from './muc-dieu-huong';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else {
    fail += 1;
    console.log('  FAIL -', msg);
  }
}
const byId = (id: string) => MUC_RAIL.find((m) => m.id === id) as MucRail;
const idsCua = (cum: 'viec' | 'chang') =>
  MUC_RAIL.filter((m) => m.cum === cum)
    .map((m) => m.id)
    .join(',');

console.log('\nmuc-dieu-huong — thanh trái HAI ĐẢO (Hoà chốt 20/08)');

console.log('\n[1] HAI đảo, đúng danh sách chốt');
ok('đúng hai đảo, không hơn', THU_TU_CUM.length === 2 && THU_TU_CUM.join(',') === 'viec,chang');
ok('ĐẢO VIỆC đúng 5 mục theo thứ tự chốt', idsCua('viec') === 'trang-chu,du-an,files,thu-vien,soat-duyet');
ok('ĐẢO CHẶNG đúng 3 mục theo thứ tự chốt', idsCua('chang') === 'thiet-ke-2d,thiet-ke-3d,trinh-chieu');
ok('tổng đúng 8 mục — không có mục lẻ ngoài hai đảo', MUC_RAIL.length === 8);
ok('không id nào trùng', new Set(MUC_RAIL.map((m) => m.id)).size === MUC_RAIL.length);
ok(
  'hai đảo đứng liền khối, không đan xen (khoảng thở chỉ có nghĩa khi khối liền)',
  (() => {
    const cums = MUC_RAIL.map((m) => m.cum);
    return cums.indexOf('chang') === cums.lastIndexOf('viec') + 1;
  })(),
);
ok('mọi mục đều thuộc một trong hai đảo', MUC_RAIL.every((m) => m.cum === 'viec' || m.cum === 'chang'));

console.log('\n[2] ⛔ TIÊU CHÍ TRƯỢT — thanh trái không chứa chuyện CỦA TÔI, và không lặp');
// Hoà 20/08 nguyên văn: "TRƯỢT nếu thanh trái còn chứa Hồ sơ/Credit/Cài đặt". Kiểm theo CẢ HAI
// kênh — nhãn (người đọc thấy) và đường đi (máy đi tới) — vì đổi nhãn mà giữ route vẫn là lặp.
for (const cam of ['Hồ sơ', 'Credit', 'Cài đặt', 'Tài khoản', 'Đăng xuất', 'Cá nhân']) {
  ok(`nhãn "${cam}" không có trên thanh trái`, !MUC_RAIL.some((m) => m.vi.includes(cam)));
}
for (const cam of ['Profile', 'Credit', 'Settings', 'Account', 'Sign out', 'Personal']) {
  ok(`nhãn EN "${cam}" không có trên thanh trái`, !MUC_RAIL.some((m) => m.en.includes(cam)));
}
ok(
  'không mục nào trỏ vào /settings hay /settings/avatar (cửa duy nhất là menu ảnh đại diện)',
  !MUC_RAIL.some((m) => (m.duong ?? '').startsWith('/settings')),
);
console.log('    — ba thứ Hoà gỡ từ trước vẫn phải ở ngoài:');
for (const cam of ['Bảng màu', 'Kho vật liệu', 'Gallery']) {
  ok(
    `"${cam}" không có mục riêng trên thanh trái`,
    !MUC_RAIL.some((m) => m.vi.includes(cam) || m.en.includes(cam) || m.duong === '/colors' || m.duong === '/materials'),
  );
}

console.log('\n[3] Đường đi — chưa mở dự án thì không đẻ /projects/null/...');
ok('Trang chủ → /', duongCua(byId('trang-chu'), null) === '/');
ok('Files → /files', duongCua(byId('files'), null) === '/files');
ok('Thư viện → /library', duongCua(byId('thu-vien'), null) === '/library');
ok('Soát duyệt → null (chưa có trang riêng)', duongCua(byId('soat-duyet'), 'p1') === null);
ok('Dự án + p1 → /projects/p1/overview (deep-link không vỡ)', duongCua(byId('du-an'), 'p1') === '/projects/p1/overview');
ok('Dự án KHÔNG có dự án → null', duongCua(byId('du-an'), null) === null);
ok('Thiết kế 2D + p1 → /projects/p1/cad', duongCua(byId('thiet-ke-2d'), 'p1') === '/projects/p1/cad');
ok('Thiết kế 2D KHÔNG dự án → null', duongCua(byId('thiet-ke-2d'), null) === null);
ok(
  'mọi mục CẦN dự án đều về null khi chưa mở — không chuỗi "null"/"undefined" nào lọt ra',
  MUC_RAIL.filter((m) => m.duoi).every((m) => duongCua(m, null) === null),
);
ok(
  'ĐẢO VIỆC vẫn có mục sống khi chưa mở dự án (không thì thanh trái chết cứng lúc mới vào app)',
  MUC_RAIL.filter((m) => m.cum === 'viec').some((m) => duongCua(m, null) !== null),
);
ok(
  'cả ba chặng đều cần dự án (không chặng nào lọt ra ngoài luật)',
  MUC_RAIL.filter((m) => m.cum === 'chang').every((m) => Boolean(m.duoi)),
);

console.log('\n[4] Mục đang mở suy từ đường');
ok('/ → trang-chu', mucDangMo('/') === 'trang-chu');
ok('/files → files', mucDangMo('/files') === 'files');
ok('/library/gallery → thu-vien', mucDangMo('/library/gallery') === 'thu-vien');
ok('/materials → thu-vien (kệ của Thư viện, §1)', mucDangMo('/materials') === 'thu-vien');
ok('/colors → thu-vien (bước trong chọn vật liệu, §1)', mucDangMo('/colors') === 'thu-vien');
ok('/projects/abc/overview → du-an', mucDangMo('/projects/abc/overview') === 'du-an');
ok('/projects/abc/render → thiet-ke-3d', mucDangMo('/projects/abc/render') === 'thiet-ke-3d');
ok('/projects/abc/cad → thiet-ke-2d', mucDangMo('/projects/abc/cad') === 'thiet-ke-2d');
ok('/projects/abc/present → trinh-chieu', mucDangMo('/projects/abc/present') === 'trinh-chieu');
// Bốn route ĐÃ RỜI thanh trái — phải là null, KHÔNG được sáng nhầm sang mục khác. Đây là cách
// hỏng thật của mọi lần rút gọn điều hướng: bỏ mục nhưng quên bỏ nhánh suy, rail sáng bừa.
ok('/settings → null (Cài đặt sang menu ảnh đại diện)', mucDangMo('/settings') === null);
ok('/settings/avatar → null (Hồ sơ/avatar sang menu ảnh đại diện)', mucDangMo('/settings/avatar') === null);
ok('/tasks → null (Bảng việc đã rời thanh trái)', mucDangMo('/tasks') === null);
ok('/projects/abc/notebook → null (Sổ tay đã rời thanh trái)', mucDangMo('/projects/abc/notebook') === null);
ok('/projects/abc/photo → null (không phải mục thanh trái)', mucDangMo('/projects/abc/photo') === null);
ok('đường lạ → null', mucDangMo('/khong-co-that') === null);
ok('rỗng/undefined → null', mucDangMo('') === null && mucDangMo(undefined) === null);
ok(
  'mọi id trả về đều là mục có thật',
  ['/', '/files', '/library', '/materials', '/colors', '/projects/p/cad', '/projects/p/overview']
    .map(mucDangMo)
    .every((id) => id !== null && MUC_RAIL.some((m) => m.id === id)),
);

console.log('\n[5] Mục mờ LUÔN có lý do đọc được — §9 cấm nút giả');
ok('Soát duyệt mờ kèm lý do dù đã mở dự án', Boolean(lyDoMo(byId('soat-duyet'), true)?.vi));
ok('mục cần dự án, chưa mở dự án → mờ kèm lý do', Boolean(lyDoMo(byId('thiet-ke-2d'), false)?.vi));
ok('mục cần dự án, đã mở dự án → dùng được', lyDoMo(byId('thiet-ke-2d'), true) === null);
ok('Dự án chưa mở → mờ kèm lý do', Boolean(lyDoMo(byId('du-an'), false)?.vi));
ok('Files/Thư viện KHÔNG bị dự án khoá', lyDoMo(byId('files'), false) === null && lyDoMo(byId('thu-vien'), false) === null);
ok(
  'HỄ không có đường đi thì PHẢI có lý do (và ngược lại)',
  MUC_RAIL.every((m) => {
    for (const duAn of [null, 'p1']) {
      const coDuong = duongCua(m, duAn) !== null;
      const coLyDo = lyDoMo(m, duAn !== null) !== null;
      if (coDuong === coLyDo) return false;
    }
    return true;
  }),
);
ok(
  'mọi lý do đều song ngữ và không rỗng',
  MUC_RAIL.every((m) => {
    const r = lyDoMo(m, false);
    return r === null || (r.vi.trim().length > 0 && r.en.trim().length > 0);
  }),
);
ok(
  'lý do "chưa mở dự án" chỉ đúng chỗ CHỌN dự án là Trang chủ (không còn "Tổng quan" — mục đó đã đổi tên)',
  (lyDoMo(byId('thiet-ke-2d'), false)?.vi ?? '').includes('Trang chủ'),
);

console.log('\n[6] Nấc 320 — bỏ thì phải kèm lý do, không im lặng');
ok(
  'mọi mục bỏ nấc 320 đều khai viSao',
  MUC_RAIL.every((m) => m.mat320.kieu !== 'khong' || m.mat320.viSao.trim().length > 10),
);
ok(
  'mọi mục CÓ nấc 320 đều khai moTa (bày cái gì)',
  MUC_RAIL.every((m) => m.mat320.kieu === 'khong' || m.mat320.moTa.trim().length > 0),
);
ok('Trang chủ bỏ nấc 320 (bày bản thu nhỏ của chính nó là nói hai lần)', !co320(byId('trang-chu')));
ok('Soát duyệt bỏ nấc 320 (chưa có trang riêng)', !co320(byId('soat-duyet')));
ok('Thư viện giữ nấc 320 (cột ô tròn vật liệu — Hoà nêu đích danh)', co320(byId('thu-vien')));
ok(
  'ít nhất một mục ĐÃ NỐI nguồn thật — nếu không, nấc 320 chỉ là kéo dãn',
  MUC_RAIL.some((m) => m.mat320.kieu !== 'khong' && m.mat320.daNoiNguon),
);
ok(
  'cả 3 chặng đều đã nối nguồn "chặng đang dở"',
  ['thiet-ke-2d', 'thiet-ke-3d', 'trinh-chieu'].every((id) => {
    const m = byId(id).mat320;
    return m.kieu === 'tinhTrang' && m.daNoiNguon;
  }),
);

console.log('\n[7] Bước nấc chi tiết — dừng ở hai đầu, KHÔNG cuộn vòng');
// 52/240/320 — chốt EXS điều 4: Rail 52-56 (chọn 52 = --tap-lg 44 + 2×4 lề hàng) · Shelf 220-280
// (giữ 240) · Panel min 320 (trần resize 440 là NỢ phiếu riêng, chưa có cơ chế resize).
ok('ba nấc chi tiết đúng 52 / 240 / 320', BE_RONG_NAC.dinhVi === 52 && BE_RONG_NAC.dieuHuong === 240 && BE_RONG_NAC.duyet === 320);
ok('thứ tự từ hẹp tới rộng', THU_TU_NAC.join(',') === 'dinhVi,dieuHuong,duyet');
ok('hẹp nhất không lui được nữa', nacKe('dinhVi', -1) === null);
ok('rộng nhất không tiến được nữa', nacKe('duyet', 1) === null);
ok('dinhVi +1 → dieuHuong', nacKe('dinhVi', 1) === 'dieuHuong');
ok('duyet -1 → dieuHuong', nacKe('duyet', -1) === 'dieuHuong');
ok(
  'bề rộng tăng nghiêm ngặt theo thứ tự',
  THU_TU_NAC.every((n, i) => i === 0 || BE_RONG_NAC[n] > BE_RONG_NAC[THU_TU_NAC[i - 1]]),
);

console.log(fail ? `\n❌ ${fail} kiểm HỎNG\n` : '\n✅ Tất cả kiểm ĐẠT\n');
if (fail) process.exit(1);
