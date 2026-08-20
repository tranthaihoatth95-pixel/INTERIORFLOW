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

console.log('\n[8] HỆ BIỂU TƯỢNG — tám icon phải đọc như MỘT BỘ (Hoà chốt 20/08)');
/* Đo THẬT, không chấm bằng mắt: đếm số phần tử vẽ trong `iconNode` của chính lucide đã cài.
 * Đây là thước cho luật *"hai icon cạnh nhau mà độ phức tạp lệch hẳn = TRƯỢT"* — trước nay luật
 * đó không kiểm được nên icon cứ trôi mỗi lần ai đó thấy cái khác "đẹp hơn".
 * Đọc tệp thay vì import: `lucide-react` là ESM, `sucrase-node` chạy CJS — đọc tệp là cách duy
 * nhất lấy được số thật mà không kéo bundler vào một test thuần. */
import { readFileSync, existsSync } from 'fs';

/** mục rail → tên tệp icon trong lucide (kebab-case). Sai tên là test đỏ, không im lặng. */
const TEP_ICON: Record<string, string> = {
  'trang-chu': 'house',
  'du-an': 'folders',
  files: 'folder',
  'thu-vien': 'square-stack',
  'soat-duyet': 'file-check-corner', // `FileCheck2` tái xuất từ tệp này
  'thiet-ke-2d': 'grid-2x2',
  'thiet-ke-3d': 'box',
  'trinh-chieu': 'monitor',
};
function soPhanTu(ten: string): number | null {
  const p = `node_modules/lucide-react/dist/esm/icons/${ten}.mjs`;
  if (!existsSync(p)) return null;
  // `\[\s*` chứ không `\[`: lucide xuống dòng sau dấu mở ngoặc ở icon một phần tử (vd `folder`),
  // regex bám sát sẽ đếm nhầm thành 0 — bẫy làm cái ĐƠN GIẢN NHẤT trông như cái rỗng.
  return (readFileSync(p, 'utf8').match(/\[\s*"(path|rect|line|circle|polyline|polygon|ellipse)"/g) ?? []).length;
}
ok('bảng tệp icon phủ đúng 8 mục của thanh trái', MUC_RAIL.every((m) => TEP_ICON[m.id]) && Object.keys(TEP_ICON).length === MUC_RAIL.length);
const dem = MUC_RAIL.map((m) => ({ id: m.id, n: soPhanTu(TEP_ICON[m.id]) }));
ok('mọi tệp icon tra được (tên lucide đúng)', dem.every((d) => d.n !== null));
const sos = dem.map((d) => d.n ?? -1);
console.log('    phần tử/icon:', dem.map((d) => `${d.id}=${d.n}`).join(' · '));
ok(
  'không icon nào quá 3 phần tử — trên 3 là cần chi tiết nhỏ mới đọc, trượt cửa "hiểu dưới 1 giây" ở 16-18px',
  sos.every((n) => n >= 1 && n <= 3),
);
ok(
  'độ phức tạp không lệch hẳn: cái rối nhất ≤ 3× cái đơn giản nhất',
  Math.max(...sos) <= 3 * Math.min(...sos),
);
// Bốn hình Hoà loại đích danh. Khoá bằng TÊN TỆP chứ không bằng nhãn: đổi icon là đổi chỗ này,
// và chỗ này phải cãi lại.
for (const [cam, viSao] of [
  ['layout-grid', 'Trang chủ không dùng icon 4-ô kiểu dashboard'],
  ['building-2', 'Dự án không dùng hình toà nhà chi tiết'],
  ['library', 'Thư viện không dùng bốn vạch dọc (đọc ra thanh equalizer)'],
  ['library-big', 'Thư viện không dùng SÁCH theo nghĩa đen — gáy nghiêng phá trục hình'],
  ['blocks', 'không dùng Blocks: rx=1, lệch nửa bán kính so với cả bộ r2'],
  ['folder-kanban', 'Dự án không dùng FolderKanban: 4 phần tử, vượt trần độ phức tạp'],
  ['presentation', 'Trình chiếu không dùng bảng-treo-chân-xiên — rời khỏi trục chữ nhật'],
  ['shield-check', 'Soát duyệt không dùng khiên bảo mật'],
] as const) {
  ok(`${viSao} (${cam})`, !Object.values(TEP_ICON).includes(cam));
}
// Đọc `HE_BIEU_TUONG` bằng VĂN BẢN chứ không `import`: alias `@/` không sống trong sucrase-node
// (test thuần, không bundler) — và test này vốn đã đọc tệp để đếm phần tử icon, cùng một lối.
{
  const src = readFileSync('components/ui/command-icon.tsx', 'utf8');
  const so = (ten: string): number | null => {
    const m = new RegExp(`${ten}:\\s*([0-9.]+)`).exec(src);
    return m ? parseFloat(m[1]) : null;
  };
  const khung = so('khung');
  const hinh = so('hinh');
  const net = so('net');
  const netNhan = so('netNhan');
  ok('khung icon = 20', khung === 20);
  ok('hình quang học trong dải 16-18', hinh !== null && hinh >= 16 && hinh <= 18);
  ok('nét thường ≥ 1,5', net !== null && net >= 1.5);
  ok('nét khi nhấn ≤ 1,75 — trần cứng, chặn ca strokeWidth=2 cũ', netNhan !== null && netNhan <= 1.75);
}

console.log('\n[9] NGỮ PHÁP HÌNH — cả cột phải đọc ra là MỘT HỌ (Hoà chốt 20/08)');
/* Trục: chữ nhật → chữ nhật bo → viên nang → tròn. Thứ khiến tám hình đọc ra cùng một bộ, và
 * kiểm được bằng máy, là **BÁN KÍNH GÓC**. Đọc cả `rx` của <rect> lẫn bán kính cung `a<r> <r>`
 * trong path — hai cách lucide bo góc. */
function banKinh(ten: string): number[] {
  const p = `node_modules/lucide-react/dist/esm/icons/${ten}.mjs`;
  if (!existsSync(p)) return [];
  const src = readFileSync(p, 'utf8');
  // `"?` bắt buộc: lucide ghi `rx: "2"` CÓ NGOÁY KÉP. Bản nháp đầu của chính test này quên nó và
  // báo "không có bán kính" cho đúng ba icon rect-thuần — tức im lặng bỏ qua thứ cần kiểm nhất.
  const rx = [...src.matchAll(/rx:\s*"?([0-9.]+)"?/g)].map((m) => parseFloat(m[1]));
  const cung = [...src.matchAll(/[aA]\s*([0-9.]+)[ ,]([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  return [...rx, ...cung];
}
const troi = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const d = new Map<number, number>();
  for (const x of xs) d.set(x, (d.get(x) ?? 0) + 1);
  return [...d.entries()].sort((a, b) => b[1] - a[1])[0][0];
};
const bk = MUC_RAIL.map((m) => ({ id: m.id, r: troi(banKinh(TEP_ICON[m.id])) }));
console.log('    bán kính trội/icon:', bk.map((x) => `${x.id}=${x.r}`).join(' · '));
ok('mọi icon đều đọc được bán kính góc', bk.every((x) => x.r !== null));
ok(
  'CẢ TÁM cùng MỘT bán kính góc (r2) — đây là thứ làm cột đọc ra một họ',
  bk.every((x) => x.r === 2),
);
ok(
  '`blocks` vẫn phải bị loại — rx=1, lệch nửa bán kính so với cả bộ',
  troi(banKinh('blocks')) === 2 ? !Object.values(TEP_ICON).includes('blocks') : true,
);
// TIẾN TRÌNH PHẲNG → KHỐI → MẶT: ba chặng phải đứng đúng thứ tự đó và KHÔNG được đổi lẻ.
ok(
  'đảo CHẶNG đúng bộ ba tiến trình: mặt phẳng chia ô → khối → mặt xuất',
  MUC_RAIL.filter((m) => m.cum === 'chang')
    .map((m) => TEP_ICON[m.id])
    .join(',') === 'grid-2x2,box,monitor',
);
// TRẠNG THÁI ĐANG MỞ KHÔNG ĐƯỢC DỰA VÀO MÀU. Kiểm trên NGUỒN của rail: nét không được đổi theo
// trạng thái (nét là thuộc tính của HỌ), và phải có dấu chỉ HÌNH DẠNG.
{
  const rail = readFileSync('components/nav/RailDieuHuong.tsx', 'utf8');
  ok(
    'nét icon KHÔNG đổi theo trạng thái — không còn ternary `dangMo ?` trên strokeWidth',
    /strokeWidth=\{HE_BIEU_TUONG\.net\}/.test(rail) && !/strokeWidth=\{dangMo \?/.test(rail),
  );
  ok('có DẤU CHỈ hình dạng cho mục đang mở (kênh sống được khi bỏ màu)', /data-chi-dau="dang-mo"/.test(rail));
  ok('có kênh trợ năng độc lập màu: aria-current', /aria-current=/.test(rail));
  // Nền phải là trường tông RẤT NHẸ, không phải "ô vuông tím to" (Hoà bác 20/08).
  // Khoá bằng SỐ: `--accent-soft` là 14%; trần mới là 6%.
  const mNen = /color-mix\(in srgb, var\(--accent\) ([0-9.]+)%/.exec(rail);
  ok('nền hàng đang mở khai bằng color-mix, không dùng lại --accent-soft 14%', mNen !== null && !/dangMo \? 'var\(--accent-soft\)'/.test(rail));
  ok('nền hàng đang mở ≤ 6% — trường tông rất nhẹ, vạch mép mới là kênh chính', mNen !== null && parseFloat(mNen[1]) <= 6);
  ok(
    'icon đang mở đổi TƯƠNG PHẢN (--t1), không đổi HUE (--accent) — hue chỉ còn ở vạch mép',
    /color: dangMo \? 'var\(--t1\)'/.test(rail),
  );
  ok(
    'ĐẢO CHẶNG có HỘP QUANG HỌC DÙNG CHUNG ôm cả ba, không phải ba nền riêng',
    /cum === 'chang'/.test(rail) && /color-mix\(in srgb, var\(--t1\) 3%/.test(rail),
  );
  ok('đảo chặng giãn dọc GỌN hơn đảo việc', /gonDoc \? 30 :/.test(rail));
  ok('có VIÊN NHÃN mọc từ tâm khi rê/focus ở nấc định vị', /data-vien-nhan/.test(rail) && /transformOrigin: 'left center'/.test(rail));
  ok('viên nhãn mở bằng CẢ chuột lẫn bàn phím', /onFocus: \(\) => setReVao\(true\)/.test(rail));
  ok('viên nhãn tuân prefers-reduced-motion', /reduceMotion \? 'none' : 'transform/.test(rail));
  ok('ô đặt icon cố định để tâm quang học thẳng trục', /data-o-icon/.test(rail));
}

console.log(fail ? `\n❌ ${fail} kiểm HỎNG\n` : '\n✅ Tất cả kiểm ĐẠT\n');
if (fail) process.exit(1);
