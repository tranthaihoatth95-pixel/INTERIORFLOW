/**
 * scripts/nghiem-thu-ban-lam-viec/luong-trinh-chieu.mjs
 * VÒNG NGHỀ THẬT CỦA CHẶNG TRÌNH CHIẾU — chạy trên app thật, HIỆN VẬT THẬT, không placeholder.
 *
 *   2D (bản vẽ thật + vật liệu thật có mã kho)
 *     → Trình chiếu → đặt TỜ bản vẽ (neo nguồn) → đặt ẢNH bản vẽ vào deck → chú thích
 *     → lưu → ĐÓNG HẲN trình duyệt → mở lại
 *     → SỬA THƯỢNG NGUỒN (đổi vật liệu ở 2D)
 *     → quay lại Trình chiếu → PHẢI THẤY TÁC ĐỘNG ("Có bản mới")
 *     → người XÁC NHẬN LẠI → xuất PDF
 *
 * ⛔ HIỆN VẬT THẬT: bản vẽ đến từ `buildOfficeTemplate()` (mẫu Văn phòng THẬT của app, tường bao +
 *   2 phòng họp + cửa + nhãn + kích thước); vật liệu đến từ `ProductSpec` THẬT trong kho
 *   (`gieo-kho-vat-lieu.mjs`); ảnh bản vẽ do `renderDocToDataURL` của app dựng. Không thẻ "Drawing",
 *   không hình chữ nhật xám.
 * 🧱 TƯỜNG LỬA §11.7: fixture TỔNG HỢP · ẨN DANH · TRUNG TÍNH — không mượn tên studio/khách/dự án thật.
 *
 * Chạy:
 *   DATABASE_URL="file:$PWD/prisma/dev.db" node scripts/nghiem-thu-ban-lam-viec/gieo-kho-vat-lieu.mjs
 *   IF_URL=http://localhost:3000 node scripts/nghiem-thu-ban-lam-viec/luong-trinh-chieu.mjs
 * (PID=<projectId> để dùng lại một fixture cũ thay vì tạo mới.)
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const GOC = process.env.IF_URL ?? 'http://localhost:3000';
const TK = { identifier: 'kiem@localhost.test', password: 'matkhau123' };
const RA = 'docs/ship/anh';
mkdirSync(RA, { recursive: true });

/**
 * 🔴 HỒ SƠ TRÌNH DUYỆT BỀN — chỗ này QUYẾT ĐỊNH mắt xích M6/M6b nói thật hay nói oan.
 * `browser.newContext()` là một hồ sơ TRỐNG mỗi lần ⇒ đóng rồi mở lại bằng nó không phải
 * "đóng hẳn trình duyệt", mà là **cài lại trình duyệt mới**: localStorage · IndexedDB · cookie
 * đều mất sạch. Người dùng thật đóng Chrome rồi mở lại thì CHỈ `sessionStorage` bị xoá.
 * Đo bằng context rời sẽ báo hỏng cả những thứ đang chạy đúng — báo oan cũng tệ như bỏ sót.
 * ⇒ dùng `launchPersistentContext` trên MỘT thư mục hồ sơ; "đóng hẳn" = đóng context đó rồi mở
 * lại từ ĐÚNG thư mục ấy. Thư mục là đồ dùng-xong-bỏ (không phải bằng chứng, §11.12 không áp),
 * xoá sạch ở đầu mỗi lượt để lượt chạy tất định.
 */
const HO_SO = join(tmpdir(), 'if-tc-profile');
rmSync(HO_SO, { recursive: true, force: true });
// Playwright của repo đòi build 1234, máy có 1194 ⇒ launch() trần THẤT BẠI. Trỏ tường minh.
const THAM_SO = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  viewport: { width: 1600, height: 900 },
  acceptDownloads: true,
  // Hồ sơ bền cần chỗ đổ tệp tải về TƯỜNG MINH — thiếu nó thì lượt xuất PDF im lặng không báo
  // gì (đo: M10 "bấm PDF nhưng không có tệp tải về" trong khi đường `newContext` cũ thì chạy).
  downloadsPath: join(tmpdir(), 'if-tc-tai-ve'),
};

const nhatKy = [];
const ghi = (o) => { nhatKy.push(o); console.log(JSON.stringify(o)); };
/** Phán ĐẠT/KHÔNG ĐẠT cho MỘT mắt xích của vòng — không có nhánh "chắc là được". */
const phan = (mx, dat, bangChung) => ghi({ matXich: mx, ket: dat ? 'ĐẠT' : 'KHÔNG ĐẠT', bangChung });

async function moPhien() {
  const ctx = await chromium.launchPersistentContext(HO_SO, THAM_SO);
  const p0 = await ctx.newPage();
  const r = await p0.request.post(`${GOC}/api/auth/login`, { data: TK });
  if (!r.ok()) throw new Error('login ' + r.status());
  const me = await (await p0.request.get(`${GOC}/api/auth/me`)).json();
  await p0.goto(GOC);
  await p0.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  const req = p0.request;
  await p0.close();
  const page = await ctx.newPage();
  const loi = [];
  /**
   * 🔴 SỬA BỘ ĐO 06/09 — LÝ DO M10 "bấm PDF nhưng không có tệp tải về" SUỐT MẤY LƯỢT.
   *
   * Đường xuất đi qua CỔNG CHUẨN ĐẦU RA (`PresentEditor.quaCongChuanDauRa`): deck còn ô chữ mẫu
   * thì app mở `window.confirm` hỏi "xuất luôn?". Playwright **tự động TỪ CHỐI** mọi hộp thoại
   * khi không ai đăng ký `dialog` — tức bộ đo âm thầm bấm "Huỷ" rồi kết luận app hỏng. App làm
   * ĐÚNG; thứ hỏng là chỗ đo.
   *
   * Nay: nhận hộp thoại (đúng động tác người dùng bấm OK) và GHI LẠI nguyên văn — cổng nói gì
   * phải nằm trong bằng chứng, không được nuốt im lặng.
   */
  page.on('dialog', async (d) => {
    ghi({ tram: 'hộp thoại', kieu: d.type(), loi: d.message().replace(/\s+/g, ' ').slice(0, 300) });
    await d.accept().catch(() => {});
  });
  page.on('console', (m) => { if (m.type() === 'error') loi.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => loi.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('response', (r) => { if (!r.ok() && /\/api\//.test(r.url())) loi.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(GOC, '')}`); });
  return { ctx, page, loi, req };
}

const damBam = (page) => page.evaluate(() => {
  const els = [...document.querySelectorAll('button,[role="button"],a[href],input,select')];
  const hien = els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
  const ten = (e) => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 34);
  return { tong: hien.length, moVoHieu: hien.filter((e) => e.getAttribute('aria-disabled') === 'true' || e.hasAttribute('disabled')).length,
           nhan: [...new Set(hien.map(ten))].slice(0, 90) };
});

/** §11.6 — mật độ nghề: bề rộng panel, cỡ chữ lớn nhất, chiều cao nút trên cùng một thanh. */
const doMatDo = (page) => page.evaluate(() => {
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const chuTo = [...document.querySelectorAll('h1,h2,h3,div,span,p')]
    .filter((e) => e.getBoundingClientRect().width > 0 && e.textContent.trim().length > 2 && e.children.length === 0)
    .map((e) => ({ t: e.textContent.trim().slice(0, 30), px: Math.round(parseFloat(getComputedStyle(e).fontSize)) }))
    .sort((a, b) => b.px - a.px).slice(0, 6);
  const aside = [...document.querySelectorAll('aside,[class*="panel"],[class*="Panel"],[class*="inspector"]')]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 80 && b.height > 200; })
    .map((e) => ({ tag: e.tagName + '.' + String(e.className).slice(0, 26), ...r(e) })).slice(0, 6);
  /* §11.6 NHỊP — chiều cao các nút NẰM TRÊN CÙNG MỘT HÀNG. Nhiều giá trị = vỡ nhịp. */
  const nut = [...document.querySelectorAll('button')]
    .map((e) => e.getBoundingClientRect())
    .filter((r) => r.width > 20 && r.height > 12 && r.top < 200);
  const theoHang = {};
  for (const r of nut) {
    const hang = Math.round(r.top / 8) * 8;
    (theoHang[hang] ??= new Set()).add(Math.round(r.height));
  }
  const caoTheoHang = Object.entries(theoHang)
    .map(([y, set]) => ({ y: +y, cao: [...set].sort((a, b) => a - b) }))
    .filter((h) => h.cao.length > 0);
  return { chuTo, panel: aside, caoTheoHang, man: { w: innerWidth, h: innerHeight } };
});

/**
 * Bấm mục trong một menu bật ra. `MenuButton`/`IOMenu` dựng mục với `role="menuitem"` (KHÔNG phải
 * `button`) — dò bằng `getByRole('button')` là luôn trượt, đó là lý do lượt chạy đầu trả `false`.
 */
async function menu(page, tenMenu, tenMuc) {
  const m = page.getByRole('button', { name: tenMenu });
  if (!(await m.count())) return false;
  await m.first().click({ force: true });
  await page.waitForTimeout(800);
  const muc = page.getByRole('menuitem', { name: tenMuc });
  if (!(await muc.count())) { await page.keyboard.press('Escape'); return false; }
  await muc.first().click({ force: true });
  await page.waitForTimeout(1800);
  return true;
}

/**
 * Bấm một dòng KHO trong bảng Vật liệu, dò theo **SKU** — tên vật liệu trùng với preset thị giác
 * (vd "Sàn gỗ sồi" có ở cả hai), mà chỉ dòng KHO mới mang danh tính (`specId` + `matId`).
 */
async function chonVatLieuKho(page, sku) {
  const nut = page.locator('button', { hasText: sku });
  await nut.first().waitFor({ timeout: 15000 }).catch(() => {});
  if (!(await nut.count())) return false;
  await nut.first().click({ force: true });
  await page.waitForTimeout(1200);
  return true;
}

/** Số hiện trên dòng trạng thái 2D — nguồn duy nhất app tự nói ra về thao tác vừa xong. */
const trangThai2D = (page) => page.evaluate(() => {
  const t = document.body.innerText;
  const m = t.match(/Hatch:[^\n]{0,90}|Đã nạp mẫu[^\n]{0,60}|Đã đổi vật liệu[^\n]{0,40}/g);
  return m ? m.slice(0, 4) : [];
});

/** Đo Doc THẬT của dự án qua chính API mà BOQ đi — không đoán từ giao diện. */
async function doDocQuaApi(req, pid, doc) {
  const r = await req.post(`${GOC}/api/boq/${pid}`, { data: { doc } });
  if (!r.ok()) return { loi: r.status() };
  const js = await r.json();
  return { soDong: Array.isArray(js.rows) ? js.rows.length : 0 };
}

/** Doc đang sống trong IndexedDB của chặng 2D (cùng kho `sheets-persist` mà app dùng). */
const docDocTuIdb = (page) => page.evaluate(() => new Promise((res) => {
  const req = indexedDB.open('interiorflow-sheets', 1);
  req.onerror = () => res(null);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction('sheets', 'readonly').objectStore('sheets');
    const all = tx.getAll();
    const keys = tx.getAllKeys();
    all.onsuccess = () => keys.onsuccess = () => {
      const i = keys.result.findIndex((k) => String(k).includes('/cad-editor'));
      if (i < 0) return res(null);
      const rec = all.result[i];
      const sheet = rec?.sheets?.[0];
      res(sheet?.doc ? {
        soEntity: sheet.doc.entities.length,
        // DANH TÍNH THƯƠNG MẠI — thứ BOQ đọc (`ProductSpec.id`).
        specIds: [...new Set(sheet.doc.entities.map((e) => e.specId).filter(Boolean))],
        // DANH TÍNH VẬT LIỆU (UUID) — thứ 3D tra ra ảnh vân. Kho gieo chưa backfill nên rỗng là
        // SỰ THẬT của bản ghi đó, không phải lỗi lượt chạy.
        matIds: [...new Set(sheet.doc.entities.map((e) => e.matId).filter(Boolean))],
        doc: sheet.doc,
      } : null);
    };
  };
}));

/**
 * Deck THẬT đang sống trong IndexedDB của chặng Trình chiếu (`sheets-persist`, route
 * `/present-editor`). Đọc ở đây thay vì đếm `<img>` trong DOM: canvas trình bày vẽ nhiều thứ
 * bằng `<canvas>`/nền CSS, đếm thẻ ảnh là đo nhầm cái khác.
 */
const docDeckTuIdb = (page) => page.evaluate(() => new Promise((res) => {
  const req = indexedDB.open('interiorflow-sheets', 1);
  req.onerror = () => res(null);
  req.onsuccess = () => {
    const st = req.result.transaction('sheets', 'readonly').objectStore('sheets');
    const all = st.getAll();
    const keys = st.getAllKeys();
    all.onsuccess = () => keys.onsuccess = () => {
      const i = keys.result.findIndex((k) => String(k).includes('/present-editor'));
      if (i < 0) return res(null);
      const sheets = all.result[i]?.sheets ?? [];
      const els = [];
      for (const sh of sheets) for (const sl of (sh.deck?.slides ?? [])) for (const e of (sl.elements ?? [])) els.push(e);
      res({
        soHoSo: sheets.length,
        soSlide: sheets.reduce((n, sh) => n + (sh.deck?.slides?.length ?? 0), 0),
        soPhanTu: els.length,
        anhThat: els.filter((e) => e.kind === 'image' && typeof e.src === 'string' && e.src.startsWith('data:image')).length,
        chu: els.filter((e) => e.kind === 'text').length,
      });
    };
  };
}));

/** Sổ DẤU VẾT NGUỒN mà 2D ghi và Trình chiếu đọc (`to-ban-ve.ts` §⑤, localStorage). Đọc nó để
 *  phân biệt *nguồn đổi thật* với *tờ bị đánh dấu oan*. */
const soDauVet = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('interiorflow.dauVetNguon') || '{}'); } catch { return {}; }
});

/* ════════════════════════ M0 · FIXTURE TRUNG TÍNH ════════════════════════ */
let { ctx, page, loi, req } = await moPhien();
let PID = process.env.PID;
if (!PID) {
  const pr = await req.post(`${GOC}/api/flows`, { data: { type: 'project', name: 'Van phong nho — fixture trung tinh' } });
  PID = (await pr.json()).project.id;
  await req.post(`${GOC}/api/flows`, { data: { projectId: PID, name: 'Mat bang tang tret' } });
}
ghi({ tram: 'M0 fixture', PID });

/* ════════════════════════ M1 · 2D CÓ BẢN VẼ THẬT ════════════════════════ */
await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
const daNap = await menu(page, /^Bắt đầu$/, /Mẫu dự án/);
await page.waitForTimeout(600);
const nutVanPhong = page.getByRole('button', { name: /^Văn phòng/ });
if (await nutVanPhong.count()) { await nutVanPhong.first().click({ force: true }); await page.waitForTimeout(2500); }
await page.screenshot({ path: `${RA}/tc-10-2d-ban-ve-that.png` });
let idb = await docDocTuIdb(page);
phan('M1 · 2D có bản vẽ thật', !!idb && idb.soEntity > 0, { moMenu: daNap, soEntity: idb?.soEntity ?? null, trangThai: await trangThai2D(page) });

/* ════════════════════════ M2 · VẬT LIỆU THẬT CÓ MÃ KHO ════════════════════════ */
const nutVatLieu = page.getByRole('button', { name: /^Vật liệu$/ });
ghi({ tram: 'M2a nút Vật liệu', so: await nutVatLieu.count() });
if (await nutVatLieu.count()) { await nutVatLieu.first().click({ force: true }); await page.waitForTimeout(1200); }
await page.screenshot({ path: `${RA}/tc-11-kho-vat-lieu.png` });
ghi({ tram: 'M2b bảng vật liệu', ...(await damBam(page)) });
const daChonSoi = await chonVatLieuKho(page, 'KIEM-W-210');
ghi({ tram: 'M2c dòng KHO "Sàn gỗ sồi" (SKU KIEM-W-210)', daChon: daChonSoi });
// đóng bảng vật liệu rồi tô vào KHÔNG GIAN MỞ (nửa trái mặt bằng)
const dong = page.getByRole('button', { name: /^Đóng$/ });
if (await dong.count()) { await dong.first().click({ force: true }).catch(() => {}); await page.waitForTimeout(500); }
await page.mouse.click(560, 400);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${RA}/tc-12-da-to-vat-lieu.png` });
idb = await docDocTuIdb(page);
phan('M2 · vật liệu THẬT có mã kho gắn vào bản vẽ', !!idb && idb.specIds.length > 0,
  { specIds: idb?.specIds ?? [], matIds: idb?.matIds ?? [], soEntity: idb?.soEntity ?? null, trangThai: await trangThai2D(page) });
const boq1 = idb?.doc ? await doDocQuaApi(req, PID, idb.doc) : { loi: 'khong-co-doc' };
ghi({ tram: 'M2d BOQ đọc từ bản vẽ', ...boq1 });

/* ════════════════════════ M3 · GỬI TỜ BẢN VẼ SANG TRÌNH CHIẾU ════════════════════════ */
const nutGui = page.getByRole('button', { name: /Gửi sang Trình chiếu/ });
ghi({ tram: 'M3a nút Gửi sang Trình chiếu', so: await nutGui.count() });
if (await nutGui.count()) { await nutGui.first().click({ force: true }); await page.waitForTimeout(6000); }
await page.screenshot({ path: `${RA}/tc-13-to-sang-trinh-chieu.png` });
const chip = async () => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((e) => /Thiết lập trang/.test(e.textContent || ''));
  return b ? b.textContent.replace(/\s+/g, ' ').trim() : null;
});
const chip1 = await chip();
const dauVetM3 = await soDauVet(page);
phan('M3 · tờ bản vẽ (khổ · tỉ lệ · neo nguồn) sang được Trình chiếu', !!chip1, { chip: chip1, dauVet: dauVetM3, url: page.url() });

/* ════════════════════════ M4 · ĐẶT ẢNH BẢN VẼ THẬT VÀO DECK ════════════════════════ */
// mở hồ sơ trình bày trước (deck), rồi quay về 2D lấy ảnh bản vẽ THẬT đưa sang.
const batDau = page.getByRole('button', { name: /Bắt đầu trình bày/ });
if (await batDau.count()) { await batDau.first().click({ force: true }); await page.waitForTimeout(5000); }
await page.screenshot({ path: `${RA}/tc-14-deck-mo.png` });
ghi({ tram: 'M4a deck đã mở', ...(await damBam(page)) });
ghi({ tram: 'M4b mật độ trình dàn trang', ...(await doMatDo(page)) });

await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
const daDua = await menu(page, /^Xuất$/, /Đưa ảnh bản vẽ sang Trình chiếu/);
/**
 * 🔴 SỬA BỘ ĐO 06/09 — khối này TRƯỚC ĐÂY sai hai chỗ, và cả hai đều làm nó báo oan:
 *
 *  ① `waitForURL(/\/present/)` khớp CẢ `/present-editor` — mà đó chỉ là trạm chuyển hướng, chưa
 *     phải đích. Đồng hồ 4 s vì thế bắt đầu SỚM hơn ý định, có lượt nạp lại trang lúc điều hướng
 *     còn dở dang (đo được: một lượt kết thúc ở `/cad`, rồi báo "mất slide").
 *  ② "nạp lại một lần để ép flush" — nạp lại KHÔNG ép được gì; nó chỉ vô hại khi bản ghi đã kịp
 *     xuống đĩa. Trục thời gian đo trên app thật cho thấy có cửa sổ ~1,3–3,5 s mà tờ bản vẽ chỉ
 *     nằm trong bộ nhớ. Cửa sổ đó nay đã đóng ở tầng SẢN PHẨM (peek → chèn → chỉ xoá nguồn khi
 *     IndexedDB xác nhận, xem `lib/cad/present-handoff.ts`) — chứ không phải đóng bằng cách bộ đo
 *     bấm thêm một cái F5.
 *
 * ⇒ Nay: chờ ĐÚNG đích, rồi hỏi ĐÚNG câu hỏi của người dùng — "mở hồ sơ trình bày của dự án này
 * ra thì tờ bản vẽ có đó không".
 */
await page.waitForURL(new RegExp(`/projects/${PID}/present`), { timeout: 45000 }).catch(() => {});
await page.waitForTimeout(6000);
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${RA}/tc-15-anh-ban-ve-trong-deck.png` });
const deck1 = await docDeckTuIdb(page);
phan('M4 · ảnh bản vẽ THẬT nằm trong trang trình bày', !!deck1 && deck1.anhThat > 0, { daDua, ...(deck1 ?? {}), url: page.url() });

/* ════════════════════════ M5 · CHÚ THÍCH ════════════════════════ */
const nutChu = page.getByRole('button', { name: /^Chữ$/ });
ghi({ tram: 'M5a nút Chữ', so: await nutChu.count() });
if (await nutChu.count()) { await nutChu.first().click({ force: true }); await page.waitForTimeout(1500); }
await page.screenshot({ path: `${RA}/tc-16-chu-thich.png` });
await page.reload({ waitUntil: 'networkidle' }); // ép flush như trên rồi mới đo
await page.waitForTimeout(6000);
const deck2 = await docDeckTuIdb(page);
phan('M5 · chú thích đặt được lên trang', !!deck2 && deck2.chu > (deck1?.chu ?? 0),
  { chuTruoc: deck1?.chu ?? null, chuSau: deck2?.chu ?? null, soPhanTu: deck2?.soPhanTu ?? null });

/* ════════════════════════ M6 · LƯU · ĐÓNG HẲN · MỞ LẠI ════════════════════════ */
await page.waitForTimeout(3000);
ghi({ tram: 'M6a lỗi phiên 1', so: loi.length, loi: loi.slice(0, 8) });
await ctx.close();
({ ctx, page, loi, req } = await moPhien());
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(7000);
await page.screenshot({ path: `${RA}/tc-17-mo-lai.png` });
const deck3 = await docDeckTuIdb(page);
const chipSauMoLai = await chip();
phan('M6 · đóng HẲN trình duyệt rồi mở lại — deck còn nguyên',
  !!deck3 && deck3.anhThat > 0 && deck3.chu > 0, { ...(deck3 ?? {}) });
const dauVetM6 = await soDauVet(page);
phan('M6b · tờ bản vẽ (neo nguồn) còn sống qua lần đóng trình duyệt', !!chipSauMoLai, { chip: chipSauMoLai });
// Chưa sửa gì ở 2D mà dấu vết đã đổi ⇒ tờ bị đánh dấu OAN (máy kêu sói). Đo, không đoán.
phan('M6c · chưa sửa gì thì tờ phải còn "Hiện hành"',
  !!chipSauMoLai && /Hiện hành/.test(chipSauMoLai),
  { chip: chipSauMoLai, dauVetLucGui: dauVetM3, dauVetSauMoLai: dauVetM6 });

/* ════════════════════════ M7 · SỬA THƯỢNG NGUỒN (đổi vật liệu ở 2D) ════════════════════════ */
await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
const nutVL2 = page.getByRole('button', { name: /^Vật liệu$/ });
if (await nutVL2.count()) { await nutVL2.first().click({ force: true }); await page.waitForTimeout(1200); }
const daChonOcCho = await chonVatLieuKho(page, 'KIEM-W-102');
ghi({ tram: 'M7a dòng KHO "Sàn gỗ óc chó" (SKU KIEM-W-102)', daChon: daChonOcCho });
const dong2 = page.getByRole('button', { name: /^Đóng$/ });
if (await dong2.count()) { await dong2.first().click({ force: true }).catch(() => {}); await page.waitForTimeout(500); }
// tô phòng họp 1 (nửa phải, dưới) — vùng kín thứ hai
await page.mouse.click(1230, 520);
await page.waitForTimeout(1800);
await page.screenshot({ path: `${RA}/tc-18-sua-thuong-nguon.png` });
const idb2 = await docDocTuIdb(page);
const boq2 = idb2?.doc ? await doDocQuaApi(req, PID, idb2.doc) : { loi: 'khong-co-doc' };
phan('M7 · sửa thượng nguồn — bản vẽ mang thêm vật liệu thứ hai',
  !!idb2 && idb2.specIds.length > (idb?.specIds.length ?? 0) && (boq2.soDong ?? 0) > (boq1.soDong ?? 0),
  { specIdsTruoc: idb?.specIds ?? [], specIdsSau: idb2?.specIds ?? [], boqTruoc: boq1, boqSau: boq2, trangThai: await trangThai2D(page) });

/* ════════════════════════ M8 · QUAY LẠI TRÌNH CHIẾU — PHẢI THẤY TÁC ĐỘNG ════════════════════════ */
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(7000);
await page.screenshot({ path: `${RA}/tc-19-tac-dong.png` });
const chip2 = await chip();
phan('M8 · Trình chiếu THẤY tác động của sửa thượng nguồn',
  !!chip2 && /Có bản mới/.test(chip2), { chip: chip2 });

/* ════════════════════════ M9 · NGƯỜI XÁC NHẬN LẠI ════════════════════════ */
const moChip = page.locator('button', { hasText: 'Thiết lập trang' });
if (await moChip.count()) { await moChip.first().click({ force: true }); await page.waitForTimeout(1500); }
await page.screenshot({ path: `${RA}/tc-20-panel-thiet-lap-trang.png` });
ghi({ tram: 'M9a panel Thiết lập trang', ...(await damBam(page)) });
const nutCapNhat = page.getByRole('button', { name: /^Cập nhật/ });
ghi({ tram: 'M9b nút Cập nhật', so: await nutCapNhat.count() });
if (await nutCapNhat.count()) { await nutCapNhat.first().click({ force: true }); await page.waitForTimeout(1500); }
const chip3 = await chip();
phan('M9 · người xác nhận lại — tờ về "Hiện hành"', !!chip3 && /Hiện hành/.test(chip3), { chipSauCapNhat: chip3 });

/* ════════════════════════ M10 · XUẤT PDF ════════════════════════ */
const daXuat = await (async () => {
  // Đóng panel Thiết lập trang bằng CHÍNH nút đã mở nó (nút là toggle) — Escape không đóng, và
  // panel mở thì nó nằm đè lên chỗ menu Xuất bung ra.
  const chipMo = page.locator('button', { hasText: 'Thiết lập trang' });
  if (await chipMo.count()) { await chipMo.first().click({ force: true }).catch(() => {}); }
  await page.waitForTimeout(1200);
  const cho = page.waitForEvent('download', { timeout: 180000 }).catch(() => null);
  const bam = await menu(page, /^Xuất$/, /^PDF \(xem nhanh/);
  if (!bam) return { ok: false, vi: 'không mở được menu Xuất hoặc không thấy mục PDF' };
  const dl = await cho;
  if (!dl) return { ok: false, vi: 'bấm PDF nhưng không có tệp tải về' };
  await dl.saveAs(`${RA}/tc-xuat.pdf`);
  return { ok: true, ten: dl.suggestedFilename() };
})();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${RA}/tc-21-sau-xuat.png` });
phan('M10 · xuất PDF ra tệp thật', daXuat.ok, daXuat);
ghi({ tram: 'M10b lỗi phiên 2', so: loi.length, loi: loi.slice(0, 8) });

writeFileSync(`${RA}/tc-nhat-ky.json`, JSON.stringify(nhatKy, null, 1));
await ctx.close();
console.log('\nPID=' + PID + '\nẢnh + nhật ký ở ' + RA);
