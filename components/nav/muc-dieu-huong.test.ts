/**
 * components/nav/muc-dieu-huong.test.ts — khoá RÀNG BUỘC của bảng khai rail [marker: railHaiCum].
 * Chạy: `node_modules/.bin/sucrase-node components/nav/muc-dieu-huong.test.ts`
 *
 * Mỗi mục dưới đây là MỘT CÁCH HỎNG đã lường trước, không phải một dòng cho đủ lệ:
 *  1. Đúng hai cụm, đúng danh sách hợp đồng §1 — thêm/bớt mục lặng lẽ là lệch cấu trúc.
 *  2. Ba thứ Hoà đã GỠ khỏi rail (Bảng màu · Kho vật liệu · Gallery) không được bò trở lại.
 *  3. Đường đi: cụm dự án chưa mở dự án phải là `null`, không được ra `/projects/null/...`.
 *  4. Mục đang mở suy đúng từ đường — kể cả `/materials` và `/colors` (kệ/bước của Thư viện).
 *  5. Mọi mục mờ đều CÓ lý do đọc được (§9 cấm nút giả không lý do).
 *  6. Nấc 320 bị bỏ thì phải kèm lý do — luật "ba nấc chi tiết là nhịp, không phải hạn ngạch".
 *  7. `nacKe` dừng ở hai đầu dải, không cuộn vòng (cuộn vòng = bấm nhầm là mất chỗ đang đứng).
 */

import {
  MUC_RAIL,
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

console.log('\nmuc-dieu-huong — bảng khai rail hai cụm');

console.log('\n[1] Hai cụm, đúng danh sách hợp đồng §1');
ok('cụm XƯỞNG đúng 6 mục', MUC_RAIL.filter((m) => m.cum === 'xuong').length === 6);
ok('cụm DỰ ÁN đúng 5 mục', MUC_RAIL.filter((m) => m.cum === 'duAn').length === 5);
ok('không id nào trùng', new Set(MUC_RAIL.map((m) => m.id)).size === MUC_RAIL.length);
ok(
  'thứ tự cụm XƯỞNG đúng hợp đồng',
  MUC_RAIL.filter((m) => m.cum === 'xuong')
    .map((m) => m.id)
    .join(',') === 'tong-quan,bang-viec,chat-hop,files,thu-vien,cai-dat',
);
ok(
  'thứ tự cụm DỰ ÁN đúng hợp đồng',
  MUC_RAIL.filter((m) => m.cum === 'duAn')
    .map((m) => m.id)
    .join(',') === 'du-an-nay,so-tay,thiet-ke-2d,thiet-ke-3d,trinh-chieu',
);
ok('hai cụm đứng liền khối, không đan xen', (() => {
  const cums = MUC_RAIL.map((m) => m.cum);
  return cums.indexOf('duAn') === cums.lastIndexOf('xuong') + 1;
})());

console.log('\n[2] Ba thứ Hoà GỠ khỏi rail không được bò lại');
for (const cam of ['Bảng màu', 'Kho vật liệu', 'Gallery']) {
  ok(
    `"${cam}" không có mục riêng trên rail`,
    !MUC_RAIL.some((m) => m.vi.includes(cam) || m.en.includes(cam) || m.duong === '/colors' || m.duong === '/materials'),
  );
}

console.log('\n[3] Đường đi — chưa mở dự án thì cụm DỰ ÁN là null, không đẻ /projects/null/...');
ok('Files → /files', duongCua(byId('files'), null) === '/files');
ok('Tổng quan → /', duongCua(byId('tong-quan'), null) === '/');
ok('Chat · Họp → null (chưa có trang)', duongCua(byId('chat-hop'), 'p1') === null);
ok('Thiết kế 2D + dự án p1 → /projects/p1/cad', duongCua(byId('thiet-ke-2d'), 'p1') === '/projects/p1/cad');
ok('Thiết kế 2D KHÔNG dự án → null', duongCua(byId('thiet-ke-2d'), null) === null);
ok(
  'không đường nào của cụm DỰ ÁN chứa chữ "null"/"undefined"',
  MUC_RAIL.filter((m) => m.cum === 'duAn').every((m) => {
    const d = duongCua(m, null);
    return d === null;
  }),
);
ok('Dự án này giữ route /overview (deep-link không vỡ)', duongCua(byId('du-an-nay'), 'p1') === '/projects/p1/overview');

console.log('\n[4] Mục đang mở suy từ đường');
ok('/ → tong-quan', mucDangMo('/') === 'tong-quan');
ok('/tasks → bang-viec', mucDangMo('/tasks') === 'bang-viec');
ok('/files → files', mucDangMo('/files') === 'files');
ok('/library/gallery → thu-vien', mucDangMo('/library/gallery') === 'thu-vien');
ok('/materials → thu-vien (kệ của Thư viện, §1)', mucDangMo('/materials') === 'thu-vien');
ok('/colors → thu-vien (bước trong chọn vật liệu, §1)', mucDangMo('/colors') === 'thu-vien');
ok('/settings/avatar → cai-dat', mucDangMo('/settings/avatar') === 'cai-dat');
ok('/projects/abc/render → thiet-ke-3d', mucDangMo('/projects/abc/render') === 'thiet-ke-3d');
ok('/projects/abc/notebook → so-tay', mucDangMo('/projects/abc/notebook') === 'so-tay');
ok('/projects/abc/photo → null (không phải mục rail)', mucDangMo('/projects/abc/photo') === null);
ok('đường lạ → null', mucDangMo('/khong-co-that') === null);
ok('rỗng/undefined → null', mucDangMo('') === null && mucDangMo(undefined) === null);
ok(
  'mọi id trả về đều là mục có thật',
  ['/', '/tasks', '/files', '/library', '/materials', '/colors', '/settings', '/projects/p/cad']
    .map(mucDangMo)
    .every((id) => id !== null && MUC_RAIL.some((m) => m.id === id)),
);

console.log('\n[5] Mục mờ LUÔN có lý do đọc được — §9 cấm nút giả');
ok('Chat · Họp mờ kèm lý do dù đã mở dự án', Boolean(lyDoMo(byId('chat-hop'), true)?.vi));
ok('cụm DỰ ÁN chưa mở dự án → mờ kèm lý do', Boolean(lyDoMo(byId('thiet-ke-2d'), false)?.vi));
ok('cụm DỰ ÁN đã mở dự án → dùng được', lyDoMo(byId('thiet-ke-2d'), true) === null);
ok('cụm XƯỞNG không bị dự án khoá', lyDoMo(byId('files'), false) === null);
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

console.log('\n[6] Nấc 320 — bỏ thì phải kèm lý do, không im lặng');
ok(
  'mọi mục bỏ nấc 320 đều khai viSao',
  MUC_RAIL.every((m) => m.mat320.kieu !== 'khong' || m.mat320.viSao.trim().length > 10),
);
ok(
  'mọi mục CÓ nấc 320 đều khai moTa (bày cái gì)',
  MUC_RAIL.every((m) => m.mat320.kieu === 'khong' || m.mat320.moTa.trim().length > 0),
);
ok('Cài đặt bỏ nấc 320 (ví dụ nêu đích danh trong hợp đồng §5)', !co320(byId('cai-dat')));
ok('Chat · Họp bỏ nấc 320 (chưa có trang)', !co320(byId('chat-hop')));
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
ok('ba nấc chi tiết đúng 28 / 240 / 320', BE_RONG_NAC.dinhVi === 28 && BE_RONG_NAC.dieuHuong === 240 && BE_RONG_NAC.duyet === 320);
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
