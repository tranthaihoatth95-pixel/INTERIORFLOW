/**
 * components/nav/muc-dieu-huong.test.ts — khoá RÀNG BUỘC của bảng khai thanh trái
 * [marker: railHaiCum].
 * Chạy: `node_modules/.bin/sucrase-node components/nav/muc-dieu-huong.test.ts`
 *
 * 🔴 NGUỒN CHỐT: **Hoà 23/08** — *"tách 2 phần"* + *"BỎ LUÔN CÁI NHÁP"*. ĐÚNG HAI VIÊN:
 *   VIÊN 1 · XƯỞNG/VIỆC : Trang chủ · Dự án · Cảm hứng · Thư viện
 *   VIÊN 2 · CHẶNG      : Thiết kế 2D · Thiết kế 3D · Trình chiếu  (+ nút `+`, không phải MucRail)
 * ĐÈ bản BA ĐẢO 22/08: viên ngữ cảnh dự án (Tổng quan · Flows · Tệp dự án · Quyết định·DNA) BỎ
 * HẲN khỏi rail; Files và Soát duyệt cũng rời. Route của cả sáu VẪN SỐNG — chỉ rời bản đồ.
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
  DUONG_MO_DU_AN,
  mucDangMo,
  lyDoMo,
  goiYCua,
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
const idsCua = (cum: (typeof THU_TU_CUM)[number]) =>
  MUC_RAIL.filter((m) => m.cum === cum)
    .map((m) => m.id)
    .join(',');

console.log('\nmuc-dieu-huong — thanh trái HAI ĐẢO (Hoà chốt 20/08)');

console.log('\n[1] ĐÚNG HAI viên, đúng danh sách chốt 23/08');
ok('đúng hai viên, đúng thứ tự', THU_TU_CUM.length === 2 && THU_TU_CUM.join(',') === 'viec,chang');
ok('VIÊN 1 đúng 4 mục theo thứ tự chốt', idsCua('viec') === 'trang-chu,du-an,cam-hung,thu-vien');
ok('VIÊN 2 đúng 3 mục theo thứ tự chốt', idsCua('chang') === 'thiet-ke-2d,thiet-ke-3d,trinh-chieu');
ok('tổng đúng 7 mục — không có mục lẻ ngoài hai viên', MUC_RAIL.length === 7);
// ⛔ SÁU MỤC ĐÃ RỜI RAIL 23/08. Khoá bằng ID: đây đúng là loại thứ bò về khi phiên sau thấy
// "thiếu chỗ vào Files" rồi tiện tay thêm lại một dòng — thêm lại là tái phát thanh dọc dài.
for (const boi of ['files', 'soat-duyet', 'tong-quan', 'flows-workspace', 'tep-du-an', 'quyet-dinh-dna']) {
  ok(`mục "${boi}" KHÔNG còn trên thanh trái`, !MUC_RAIL.some((m) => m.id === boi));
}
ok('không còn viên NGỮ CẢNH DỰ ÁN', !MUC_RAIL.some((m) => (m.cum as string) === 'du-an'));
// Mục "Dự án" ở viên VIỆC phải là SỔ TOÀN CỤC — sống không cần dự án nào. Đây chính là lệch đã
// sửa 22/08; khoá lại để không ai lặng lẽ trỏ nó về `/projects/<id>/…` lần nữa.
ok('Dự án = sổ toàn cục, KHÔNG cần dự án đang mở', duongCua(byId('du-an'), null) === '/projects');
ok('Dự án KHÔNG phải mục project-local', byId('du-an').duoi === undefined);
ok('Cảm hứng có mặt và có đường đi thật', duongCua(byId('cam-hung'), null) === '/library/gallery');
ok('không id nào trùng', new Set(MUC_RAIL.map((m) => m.id)).size === MUC_RAIL.length);
ok(
  'hai viên đứng liền khối, không đan xen (khoảng hở chỉ có nghĩa khi khối liền)',
  (() => {
    const cums = MUC_RAIL.map((m) => m.cum);
    const daiLienKhoi = THU_TU_CUM.every((c) => {
      const dau = cums.indexOf(c);
      const cuoi = cums.lastIndexOf(c);
      return dau >= 0 && cums.slice(dau, cuoi + 1).every((x) => x === c);
    });
    const dungThuTu = THU_TU_CUM.map((c) => cums.indexOf(c)).every((v, i, a) => i === 0 || a[i - 1] < v);
    return daiLienKhoi && dungThuTu;
  })(),
);
ok('mọi mục đều thuộc một trong hai viên', MUC_RAIL.every((m) => THU_TU_CUM.includes(m.cum)));
// Ảnh tham chiếu Hoà gửi: mỗi cụm 3-5 icon là ngưỡng đọc được. Trên 5 thì viên dài ra và lại
// đọc thành một đoạn thanh — đúng thứ chốt này sinh ra để chặn.
ok(
  'mỗi viên 3-5 mục (ngưỡng đọc được, rút từ 10 ảnh tham chiếu 23/08)',
  THU_TU_CUM.every((c) => {
    const n = MUC_RAIL.filter((m) => m.cum === c).length;
    return n >= 3 && n <= 5;
  }),
);

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
ok('Thư viện → /library', duongCua(byId('thu-vien'), null) === '/library');
ok('Cảm hứng → /library/gallery (route ĐANG SỐNG, không đẻ route mới)', duongCua(byId('cam-hung'), null) === '/library/gallery');
ok('Thiết kế 2D + p1 → /projects/p1/cad', duongCua(byId('thiet-ke-2d'), 'p1') === '/projects/p1/cad');
// 🔀 ĐỔI KHI HOÀ NHÁNH (05/09): chưa có dự án thì mục chặng KHÔNG còn trả `null` — nó dẫn về chỗ
// TẠO dự án. Xem khối [5b] và chú thích trong `duongCua`.
ok('Thiết kế 2D KHÔNG dự án → dẫn về chỗ tạo dự án', duongCua(byId('thiet-ke-2d'), null) === DUONG_MO_DU_AN);
ok(
  'không đường nào của mục CẦN dự án chứa chữ "null"/"undefined"',
  MUC_RAIL.filter((m) => m.duoi).every((m) => {
    const d = duongCua(m, null);
    return d === null || !/null|undefined/.test(d);
  }),
);
ok(
  'VIÊN VIỆC vẫn có mục sống khi chưa mở dự án (không thì thanh trái chết cứng lúc mới vào app)',
  MUC_RAIL.filter((m) => m.cum === 'viec').some((m) => duongCua(m, null) !== null),
);
ok(
  'cả ba chặng đều cần dự án (không chặng nào lọt ra ngoài luật)',
  MUC_RAIL.filter((m) => m.cum === 'chang').every((m) => Boolean(m.duoi)),
);

console.log('\n[4] Mục đang mở suy từ đường');
ok('/ → trang-chu', mucDangMo('/') === 'trang-chu');
ok('/library/gallery → cam-hung', mucDangMo('/library/gallery') === 'cam-hung');
ok('/library → thu-vien (gallery là tiền tố CON, không được nuốt)', mucDangMo('/library') === 'thu-vien');
ok('/materials → thu-vien (kệ của Thư viện, §1)', mucDangMo('/materials') === 'thu-vien');
ok('/colors → thu-vien (bước trong chọn vật liệu, §1)', mucDangMo('/colors') === 'thu-vien');
// `/projects` trần PHẢI khớp chính xác — nếu nó nuốt cả `/projects/<id>/…` thì Tổng quan không
// bao giờ sáng. Đây là bẫy thứ tự nhánh, khoá lại bằng test.
ok('/projects → du-an (sổ toàn cục)', mucDangMo('/projects') === 'du-an');
ok('/projects KHÔNG nuốt route con', mucDangMo('/projects/abc/cad') === 'thiet-ke-2d');
// Hai route RỜI RAIL 23/08. Chúng vẫn sống và vẫn vào được, chỉ là rail không còn mục đại diện.
// ⛔ Đừng "chữa" bằng cách cho sáng nhờ mục gần giống — sáng nhầm là NÓI DỐI VỊ TRÍ.
ok('/files → null (Files đã rời thanh trái)', mucDangMo('/files') === null);
ok('/projects/abc/overview → null (Tổng quan đã rời thanh trái)', mucDangMo('/projects/abc/overview') === null);
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
  ['/', '/library', '/library/gallery', '/materials', '/colors', '/projects/p/cad', '/projects/p/present']
    .map(mucDangMo)
    .every((id) => id !== null && MUC_RAIL.some((m) => m.id === id)),
);

console.log('\n[5] Mục mờ LUÔN có lý do đọc được — §9 cấm nút giả');
/* 🔀 HOÀ NHÁNH 05/09 — `lyDoMo` nay CHỈ nhận `muc`. Cờ "có dự án dùng được" thôi đi vào lý do
 * TẮT; nó chuyển sang `goiYCua` (gợi ý đi kèm mục CÒN BẤM ĐƯỢC). Bất biến "không có đường đi ⇒
 * phải có lý do" (ca ngay dưới) GIỮ NGUYÊN — nó là thứ chặn nút giả; chỉ khác là nay mục chặng
 * luôn CÓ đường nên nó không còn cần lý do. */
ok('Dự án (sổ toàn cục) KHÔNG BAO GIỜ mờ', lyDoMo(byId('du-an')) === null);
ok(
  'Cảm hứng/Thư viện KHÔNG bị dự án khoá',
  lyDoMo(byId('cam-hung')) === null && lyDoMo(byId('thu-vien')) === null,
);
// Bốn mục viên VIỆC đều toàn cục ⇒ mở app lần đầu là thấy MỘT viên sống trọn vẹn. Nếu có mục
// nào bị khoá thì viên 1 đọc ra nham nhở ngay khung hình đầu — đúng bệnh P0 21/08 vừa chữa.
ok('cả 4 mục viên VIỆC đều dùng được khi chưa mở dự án',
  MUC_RAIL.filter((m) => m.cum === 'viec').every((m) => lyDoMo(m) === null));
ok(
  'HỄ không có đường đi thì PHẢI có lý do (và ngược lại)',
  MUC_RAIL.every((m) => {
    for (const duAn of [null, 'p1']) {
      const coDuong = duongCua(m, duAn) !== null;
      const coLyDo = lyDoMo(m) !== null;
      if (coDuong === coLyDo) return false;
    }
    return true;
  }),
);
ok(
  'mọi lý do đều song ngữ và không rỗng',
  MUC_RAIL.every((m) => {
    const r = lyDoMo(m);
    return r === null || (r.vi.trim().length > 0 && r.en.trim().length > 0);
  }),
);
/* ═══ [5b] CHƯA CÓ DỰ ÁN THÌ CHẶNG VẪN BẤM ĐƯỢC — ghim bản vá 05/09 ═══════════════════════
 * Chủ dự án mở bản cài lần đầu, chưa có dự án nào, bấm các mục chặng thì KHÔNG RA GÌ: tất cả là
 * `aria-disabled`, không href. Trái LUẬT X2 ("không màn nào chặn vì chưa làm bước trước"). Gốc là
 * chính khẳng định ở trên khi nó còn coi "chưa có dự án" là lý do TẮT. Bốn ca dưới ghim để lỗi đó
 * không quay lại trong im lặng.
 *
 * 🔀 Ghi chú hoà nhánh: danh sách mục chặng CỐ Ý suy từ `MUC_RAIL` (`m.duoi` = mục chỉ có nghĩa
 * khi đã mở dự án) thay vì chép cứng một dãy id. Hai nhánh có hai bộ id khác nhau (bản này 3 mục
 * chặng, bản kia 5 — thêm `du-an-nay`/`so-tay`); chép cứng id là khoá test vào MỘT cấu trúc rail,
 * còn suy từ `duoi` thì khoá đúng HÀNH VI, sống qua mọi lần đổi cấu trúc. Ca cuối canh cho danh
 * sách không bao giờ rỗng — rỗng thì cả khối này xanh mà chẳng kiểm gì.
 * ═══════════════════════════════════════════════════════════════════════════════════════════ */
{
  const chang = MUC_RAIL.filter((m) => m.duoi && !m.chuaCoTrang);
  ok('có ít nhất một mục chặng để kiểm (khối này không được rỗng mà vẫn xanh)', chang.length > 0);
  ok(
    'chưa có dự án → MỌI mục chặng vẫn có đường đi (không mục nào chết)',
    chang.every((m) => duongCua(m, null) === DUONG_MO_DU_AN),
  );
  ok(
    'chưa có dự án → KHÔNG mục chặng nào bị coi là tắt',
    chang.every((m) => lyDoMo(m) === null),
  );
  ok(
    'chưa có dự án → mỗi mục chặng có GỢI Ý song ngữ nói bấm vào thì gì xảy ra',
    chang.every((m) => {
      const g = goiYCua(m, false);
      return g !== null && g.vi.trim().length > 0 && g.en.trim().length > 0;
    }),
  );
  ok(
    'ĐÃ có dự án → đường đi trỏ đúng dự án đó, và thôi gợi ý',
    chang.every((m) => duongCua(m, 'p1') === `/projects/p1/${m.duoi}` && goiYCua(m, true) === null),
  );
  ok(
    'mục KHÔNG cần dự án không bao giờ mang gợi ý dự án',
    MUC_RAIL.filter((m) => !m.duoi).every((m) => goiYCua(m, false) === null),
  );
  /* Giữ nguyên tinh thần ca 02/09: câu hiện ra phải nói VIỆC LÀM ĐƯỢC (tạo dự án) và KHÔNG bảo
     đi "chọn" ở một Trang chủ đang trống. Nay nó là GỢI Ý chứ không còn là lý do tắt. */
  const g = goiYCua(byId('thiet-ke-2d'), false)?.vi ?? '';
  ok('chưa có dự án ⇒ gợi ý nói VIỆC LÀM ĐƯỢC (tạo dự án)', /tạo/i.test(g));
  ok('… và KHÔNG bảo đi "chọn" ở một Trang chủ đang trống', !/chọn/i.test(g));
}

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
// 52/240/320 — `docs/control/IF-CANONICAL.md` §10 `[CHỐT]` **Neo 52px**. Mâu thuẫn 28↔52 ĐÃ ĐÓNG
// 23/08 theo chỉ thị cuối của Hoà (§SIDEBAR MAP "52px anchor rail"); bản vẽ `mock-rail-hai-cum.html`
// (28px) LỖI THỜI ở con số này. Khoá số ở đây để không ai lặng lẽ hạ về 28 rồi quên báo.
/* 52 → 72 (02/09): nấc hẹp nay chở CHỮ DƯỚI ICON, không còn là cột hình câm. */
ok('ba nấc chi tiết đúng 72 / 240 / 320', BE_RONG_NAC.dinhVi === 72 && BE_RONG_NAC.dieuHuong === 240 && BE_RONG_NAC.duyet === 320);
ok('nấc hẹp đủ chỗ cho nhãn 64px + lề', BE_RONG_NAC.dinhVi >= 72);
ok('thứ tự từ hẹp tới rộng', THU_TU_NAC.join(',') === 'dinhVi,dieuHuong,duyet');
ok('hẹp nhất không lui được nữa', nacKe('dinhVi', -1) === null);
ok('rộng nhất không tiến được nữa', nacKe('duyet', 1) === null);
ok('dinhVi +1 → dieuHuong', nacKe('dinhVi', 1) === 'dieuHuong');
ok('duyet -1 → dieuHuong', nacKe('duyet', -1) === 'dieuHuong');
ok(
  'bề rộng tăng nghiêm ngặt theo thứ tự',
  THU_TU_NAC.every((n, i) => i === 0 || BE_RONG_NAC[n] > BE_RONG_NAC[THU_TU_NAC[i - 1]]),
);

console.log('\n[8] HỆ BIỂU TƯỢNG — bảy icon phải đọc như MỘT BỘ (Hoà chốt 20/08)');
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
  'cam-hung': 'compass',
  'thu-vien': 'gallery-horizontal-end',
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
ok('bảng tệp icon phủ đúng 7 mục của thanh trái', MUC_RAIL.every((m) => TEP_ICON[m.id]) && Object.keys(TEP_ICON).length === MUC_RAIL.length);
const dem = MUC_RAIL.map((m) => ({ id: m.id, n: soPhanTu(TEP_ICON[m.id]) }));
// ── BA SILHOUETTE PHẢI KHÁC HẲN NHAU (Hoà soi 22/08) ──────────────────────────────────────
// Ba mục hình-chữ-nhật đứng LIỀN NHAU trên viên VIỆC. Bài học 22/08: `folders`/`folder` khác
// nhau đúng một cái tai gập — ở 16-18px là KHÔNG phân biệt được.
// Nay: tệp-gập-chồng (dự án) · vòm-bóng-đèn (cảm hứng) · dãy-thẻ-mẫu (thư viện).
ok(
  'Dự án · Cảm hứng · Thư viện dùng BA tệp icon khác nhau',
  new Set(['du-an', 'cam-hung', 'thu-vien'].map((k) => TEP_ICON[k])).size === 3,
);
// 🔴 Cảm hứng đứng NGAY CẠNH Thư viện. Mọi icon "ảnh" của lucide đều là KHUNG CHỮ NHẬT ⇒ ở
// 18px sẽ đọc lẫn với dãy thẻ của Thư viện. Khoá lại để không ai "sửa cho đúng nghĩa hơn".
ok(
  'Cảm hứng KHÔNG dùng khung ảnh chữ nhật (trùng silhouette với Thư viện)',
  !['image', 'images', 'gallery-vertical', 'gallery-vertical-end', 'gallery-horizontal', 'gallery-thumbnails'].includes(
    TEP_ICON['cam-hung'],
  ),
);
// `Sparkles` để dành cho nút `+`: lấp lánh là ngôn ngữ của AI, dùng ở hai chỗ thì `+` mất nghĩa.
ok('Cảm hứng KHÔNG dùng sắc lấp lánh — kênh đó thuộc về nút `+`', TEP_ICON['cam-hung'] !== 'sparkles');
// 🔴 `lightbulb` bị chính test [9] bác: cung `a6 6` ⇒ bán kính 6, cả bộ còn lại r2. Khoá lại
// bằng tên tệp để lần sau không ai thử lại rồi phải đo lại từ đầu.
ok('Cảm hứng KHÔNG dùng bóng đèn — cung r6, lệch gấp ba bán kính của cả bộ', TEP_ICON['cam-hung'] !== 'lightbulb');
ok(
  'Thư viện KHÔNG dùng motif chồng-lớp (đọc ra sao chép/nhân bản)',
  !['square-stack', 'copy', 'layers', 'layers-2', 'files'].includes(TEP_ICON['thu-vien']),
);
ok(
  'Thư viện KHÔNG dùng thư mục, KHÔNG dùng lưới 2×2',
  !/^folder/.test(TEP_ICON['thu-vien']) && !/grid-2x2|layout-grid/.test(TEP_ICON['thu-vien']),
);

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
  /* 🔴 THÊM 02/09 — CỔNG NÀY VỪA HOÁ MÙ, và tôi tự gây ra.
   * Rail nay dùng hằng CỤC BỘ `ICON_RAIL` (26/22/1.75) chứ không còn `HE_BIEU_TUONG`. Khối đo
   * bên trên vẫn đọc `command-icon.tsx` và vẫn XANH — tức nó đang chấm một con số mà thanh
   * điều hướng không dùng nữa. Cổng xanh trong khi thứ nó canh đã đổi là dạng hỏng tệ nhất:
   * nó cho cảm giác đã kiểm.
   * ⇒ Đo THÊM chính hằng của rail. Trần nét 1.75 giữ nguyên (mượn trần cũ, KHÔNG nới); khung
   * phải ôm được hình, và hình không được vượt khung. */
  {
    const rail = readFileSync('components/nav/RailDieuHuong.tsx', 'utf8');
    const m = /ICON_RAIL\s*=\s*\{\s*khung:\s*([0-9.]+),\s*hinh:\s*([0-9.]+),\s*net:\s*([0-9.]+)/.exec(rail);
    ok('rail khai hằng icon riêng, đọc được bằng máy', m !== null);
    if (m) {
      const [kR, hR, nR] = [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
      ok('nét icon rail ≤ 1,75 — ĐÚNG trần cũ, không nới', nR <= 1.75);
      ok('hình icon rail không vượt khung của nó', hR <= kR);
      ok('icon rail TO HƠN icon panel (lý do cả lát này tồn tại)', hR > (hinh ?? 0));
    }
  }
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
  'CẢ BẢY cùng MỘT bán kính góc (r2) — đây là thứ làm cột đọc ra một họ',
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
  /* 🔴 ĐẢO CHIỀU CA NÀY 02/09 — và đảo có điều kiện, không phải nới.
   * Ca cũ CẤM nét đổi theo trạng thái, đúng khi hàng còn GẠCH DỌC 2px làm kênh hình dạng: lúc
   * đó nét đổi chỉ là thừa, đổi lại làm icon lệch họ. Gạch nay đã gỡ (viên nang thay nó), nên
   * nếu vẫn cấm thì "đang mở" chỉ còn sống bằng NỀN — tức chỉ còn kênh TÔNG MÀU, chết khi in
   * trắng đen hoặc với mắt kém phân biệt sắc độ. Ca nay đòi ĐÚNG HAI kênh phi-màu thay gạch. */
  ok(
    'nét icon ĐỔI theo trạng thái — kênh phi-màu ① thay gạch dọc đã gỡ',
    /strokeWidth=\{dangMo \? ICON_RAIL\.netDangMo : ICON_RAIL\.net\}/.test(rail),
  );
  ok(
    'nhãn dưới icon ĐẬM lên khi đang mở — kênh phi-màu ②',
    /fontWeight: dangMo \? 600 : 500/.test(rail),
  );
  ok(
    'gạch dọc 2px đã gỡ THẬT (không còn span width:2 làm dấu chỉ)',
    !/data-chi-dau="dang-mo"\s*\n?\s*style=\{\{[^}]*width: 2/.test(rail),
  );
  ok('có DẤU CHỈ hình dạng cho mục đang mở (kênh sống được khi bỏ màu)', /data-chi-dau="dang-mo"/.test(rail));
  ok('có kênh trợ năng độc lập màu: aria-current', /aria-current=/.test(rail));
  // Nền phải là trường tông RẤT NHẸ, không phải "ô vuông tím to" (Hoà bác 20/08).
  // Khoá bằng SỐ: `--accent-soft` là 14%; trần là 8%.
  //
  // 🟣 SỬA 01/09 (amend lease 15:29, QĐ GĐ1) — ĐỔI KÊNH, KHÔNG NỚI LUẬT. Bản cũ neo cứng
  // `var(--accent)` trần 6%. Bản vẽ GĐ1 (`design-if/Main.dc.html`) chốt hàng đang mở của rail là
  // sương TRUNG TÍNH (trắng-mờ trên nền tối), KHÔNG tím — accent để dành cho CTA + trạng thái
  // chạy. Nên cổng nay đòi `var(--t1)` (mực, đảo cực theo theme) trần **8%**.
  // ⛔ Tinh thần GIỮ NGUYÊN từng chữ: nền vẫn chỉ là trường tông rất nhẹ, VẠCH MÉP vẫn là kênh
  // chính. Đừng đọc lượt sửa này thành "được phép nâng nền" — trần chỉ nhích 6→8 vì `--t1` là
  // mực trung tính, tương phản thấp hơn accent bão hoà ở cùng một %.
  const mNen = /color-mix\(in srgb, var\(--(accent|t1)\) ([0-9.]+)%/.exec(rail);
  ok('nền hàng đang mở khai bằng color-mix, không dùng lại --accent-soft 14%', mNen !== null && !/dangMo \? 'var\(--accent-soft\)'/.test(rail));
  ok('nền hàng đang mở đi kênh TRUNG TÍNH --t1 (GĐ1: rail không tím)', mNen !== null && mNen[1] === 't1');
  /* Trần 8 → 14 (02/09). Trần cũ đặt khi VẠCH MÉP là kênh chính và nền chỉ là trường tông rất
   * nhẹ. Vạch đã gỡ ⇒ viên nang phải tự đủ rõ (8% gần như tan trên mặt frosted). Vẫn giữ TRẦN,
   * không mở tự do: quá 14% là quay lại "ô đặc to" mà Hoà bác 20/08. */
  ok('nền hàng đang mở ≤ 14% — đủ rõ khi không còn vạch, chưa thành ô đặc', mNen !== null && parseFloat(mNen[2]) <= 14);
  ok(
    'icon đang mở đổi TƯƠNG PHẢN (--t1), không đổi HUE (--accent) — hue chỉ còn ở vạch mép',
    /color: dangMo \? 'var\(--t1\)'/.test(rail),
  );
  // 🔴 ĐẢO LUẬT 22/08 (hotfix "stop mini-app UI"). Bản cũ khoá đúng cái Hoà vừa BÁC: một HỘP
  // QUANG HỌC (`color-mix(--t1 3%)` + bo r3) ôm cả ba chặng. Cái khay đó làm 2D/3D/Trình chiếu
  // đọc ra BA ỨNG DỤNG đóng gói chung — đúng mô hình "mini-app" phải giết.
  // Nay khoá chiều NGƯỢC LẠI: cụm CHẶNG là XƯƠNG SỐNG (đường dọc mảnh nối ba mục), KHÔNG khay.
  ok(
    'ĐẢO CHẶNG là XƯƠNG SỐNG, KHÔNG phải hộp bo ôm cả ba',
    /cum === 'chang'/.test(rail) && /if-rail-spine/.test(rail),
  );
  ok(
    'cụm CHẶNG KHÔNG còn nền khay `--t1 3%` (chống tái phát hộp bo lớn)',
    !/color-mix\(in srgb, var\(--t1\) 3%/.test(rail),
  );
  ok('đảo chặng giãn dọc GỌN hơn đảo việc', /gonDoc \? 30 :/.test(rail));
  /* 🔴 VIÊN NHÃN NỞ-KHI-RÊ ĐÃ THAY BẰNG NHÃN TĨNH (02/09, dáng tab bar iPad — chốt 14).
   * Ba ca cũ canh chất lượng của một cơ chế HOVER. Cơ chế đó có một lỗ mà chính chúng không
   * bắt được: máy CHẠM không có hover ⇒ ở nấc hẹp, bảy mục là bảy hình câm, muốn biết hình nào
   * là gì phải rê từng cái — phạm luật nền `tablet-khong-giau-sau-hover` và chốt 5 của Hoà.
   * Ca mới canh điều MẠNH HƠN: nhãn phải LUÔN có mặt, không núp sau tương tác nào. */
  ok('nấc hẹp có NHÃN TĨNH dưới icon (không núp sau hover)', /data-nhan-rail=""/.test(rail));
  ok(
    'nhãn KHÔNG còn phụ thuộc trạng thái rê — không có viên nở từ tâm nữa',
    !/data-vien-nhan/.test(rail) && !/transformOrigin: 'left center'/.test(rail),
  );
  ok('nhãn tĩnh aria-hidden — tên mục đã ở aria-label, không đọc hai lần', /data-nhan-rail=""/.test(rail) && /aria-hidden\s*\n?\s*data-nhan-rail/.test(rail));
  ok('ô đặt icon cố định để tâm quang học thẳng trục', /data-o-icon/.test(rail));
}

console.log(fail ? `\n❌ ${fail} kiểm HỎNG\n` : '\n✅ Tất cả kiểm ĐẠT\n');
if (fail) process.exit(1);
