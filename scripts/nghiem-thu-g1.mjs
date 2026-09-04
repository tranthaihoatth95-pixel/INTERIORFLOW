#!/usr/bin/env node
/**
 * scripts/nghiem-thu-g1.mjs — NGHIỆM THU CỔNG G1 "DATA SAFE" TRÊN APP THẬT.
 *
 * ⛔ VÌ SAO TỒN TẠI: bản vá P0 (định danh phiên ↔ lưu dữ liệu, `lib/danh-tinh-phien.ts`) trước
 * nay chỉ được chứng minh bằng ĐỌC MÃ + test đơn vị. Luật của chủ dự án: `UNVERIFIED ≠ PASS`.
 * Tệp này lái Chromium thật, đăng nhập thật, VẼ THẬT, rồi ĐỌC LẠI TỪ INDEXEDDB — nơi lưu thật —
 * chứ không đọc chữ hiện trên màn. Màn hình nói "còn bản vẽ" không chứng minh được gì: bản vẽ có
 * thể đang nằm thuần trong bộ nhớ và bay mất khi đóng tab. Chỉ IndexedDB mới là bằng chứng.
 *
 * BA BẤT BIẾN ĐANG CANH (không thương lượng):
 *   1. KHÔNG BAO GIỜ MẤT việc thiết kế.
 *   2. Dữ liệu người A KHÔNG BAO GIỜ vào kho người B.
 *   3. Không xác lập được định danh an toàn ⇒ hỏng phải NHÌN THẤY ĐƯỢC / chặn ghi hẳn,
 *      TUYỆT ĐỐI không âm thầm rơi về kho mơ hồ (`local`, chuỗi rỗng, `undefined`).
 *
 * ⚠️ BỘ NÀY TỰ HIỆU CHUẨN. `--hieu-chuan` dựng một thế giới BIẾT CHẮC HỎNG (chặn đường định
 * danh) rồi chạy ĐÚNG bộ khẳng định của CA1 lên đó và đòi nó phải ĐỎ. Bộ nghiệm thu không đỏ nổi
 * ở ca hỏng là bộ vô giá trị — nó chỉ đang in chữ "PASS" chứ không kiểm gì.
 *
 * CÁCH DÙNG
 *   node scripts/nghiem-thu-g1.mjs                # chạy cả 8 ca
 *   node scripts/nghiem-thu-g1.mjs --ca=4         # chạy một ca
 *   node scripts/nghiem-thu-g1.mjs --hieu-chuan   # chỉ chạy phép hiệu chuẩn
 *   node scripts/nghiem-thu-g1.mjs --anh=<thư mục>  # nơi đổ ảnh bằng chứng
 *
 * ĐIỀU KIỆN CHẠY (soạn sẵn, xem docs/delivery/G1-DATA-SAFE-ACCEPTANCE.md §Môi trường):
 *   · dev server đang chạy ở --goc (mặc định http://localhost:3021), DÙNG DB RIÊNG
 *   · hai tài khoản + ba dự án + ba hàng ProjectMember đã gieo
 *   · Chromium: --chromium=<đường dẫn> hoặc để Playwright tự tìm
 */

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

/* ─────────────────────────── tham số ─────────────────────────── */

const arg = (ten, mac) => {
  const m = process.argv.find((a) => a.startsWith(`--${ten}=`));
  return m ? m.slice(ten.length + 3) : mac;
};
const co = (ten) => process.argv.includes(`--${ten}`);

const GOC = arg('goc', 'http://localhost:3021');
const THU_MUC_ANH = arg('anh', 'docs/delivery/anh-duyet-mat/g1-data-safe');
const CHROMIUM = arg('chromium', process.env.G1_CHROMIUM || '');
const CHI_CA = arg('ca', '');

/** Tài khoản + dự án dùng cho nghiệm thu. Gieo bằng tay — xem §Môi trường của báo cáo. */
const A = { email: 'g1.alpha@kiemthu.local', matKhau: 'kiemthu123', ten: 'A' };
const B = { email: 'g1.beta@kiemthu.local', matKhau: 'kiemthu123', ten: 'B' };
const DA1 = 'g1projA1';
const DA2 = 'g1projA2';
const DAB = 'g1projB1'; // dự án của chính B — dùng ở CA8 chặng đổi người

/** Khoá IndexedDB có dạng `userId::route::projectId` (lib/sheets-persist.ts:52). */
const ROUTE_CAD = '/cad-editor';

/* ─────────────────────────── tiện ích ─────────────────────────── */

const KHO_MO_HO = ['local', '', 'undefined', 'null', 'anon'];

/** Khoá này có phải "kho mơ hồ" không — bất biến #3 cấm âm thầm rơi vào đây. */
function laKhoMoHo(khoa) {
  const chu = String(khoa).split('::')[0];
  return KHO_MO_HO.includes(chu);
}

async function moTrinhDuyet() {
  const opt = { args: ['--no-sandbox'] };
  if (CHROMIUM) opt.executablePath = CHROMIUM;
  return chromium.launch(opt);
}

async function dangNhap(ctx, ai) {
  const r = await ctx.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: ai.email, password: ai.matKhau },
  });
  if (r.status() !== 200) throw new Error(`đăng nhập ${ai.ten} thất bại: ${r.status()}`);
  const me = await ctx.request.get(`${GOC}/api/auth/me`);
  const j = await me.json();
  const id = j?.user?.id;
  if (!id) throw new Error(`không lấy được userId của ${ai.ten}`);
  return id;
}

async function dangXuat(ctx) {
  await ctx.request.delete(`${GOC}/api/auth/me`);
}

/**
 * ĐỌC TỪ NƠI LƯU THẬT. Trả về MỌI bản ghi trong `interiorflow-sheets` kèm khoá và số thực thể —
 * không đọc DOM, không tin chữ trên màn.
 */
function docKho(page) {
  return page.evaluate(
    () =>
      new Promise((res) => {
        let xong = false;
        const tra = (v) => {
          if (!xong) {
            xong = true;
            res(v);
          }
        };
        setTimeout(() => tra({ loi: 'het-gio-doc-idb', ban: [] }), 8000);
        let rq;
        try {
          rq = indexedDB.open('interiorflow-sheets');
        } catch (e) {
          return tra({ loi: 'khong-mo-duoc-idb', ban: [] });
        }
        rq.onerror = () => tra({ loi: 'open-error', ban: [] });
        rq.onsuccess = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains('sheets')) return tra({ ban: [] });
          const st = db.transaction('sheets', 'readonly').objectStore('sheets');
          const gk = st.getAllKeys();
          gk.onerror = () => tra({ loi: 'getAllKeys-error', ban: [] });
          gk.onsuccess = () => {
            const khoa = gk.result;
            const gv = st.getAll();
            gv.onerror = () => tra({ loi: 'getAll-error', ban: [] });
            gv.onsuccess = () => {
              tra({
                ban: gv.result.map((r, i) => ({
                  khoa: String(khoa[i]),
                  ts: r?.ts ?? 0,
                  soThucThe: (r?.sheets?.[0]?.doc?.entities ?? []).length,
                })),
              });
            };
          };
        };
      }),
  );
}

const layBan = (kho, khoa) => kho.ban.find((b) => b.khoa === khoa) ?? null;
const soThucThe = (kho, khoa) => layBan(kho, khoa)?.soThucThe ?? 0;
const khoaCad = (userId, duAn) => `${userId}::${ROUTE_CAD}::${duAn}`;

/**
 * Mở editor 2D của một dự án và đợi canvas thật xuất hiện. Dự án chưa có bản vẽ nào thì bấm
 * "Tạo bản vẽ mới" — ca nghiệm thu cần một mặt vẽ, không cần màn rỗng.
 */
async function moEditor(page, duAn) {
  await page.goto(`${GOC}/projects/${duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(4000);
  const tao = page.getByRole('button', { name: /Tạo bản vẽ mới/i });
  try {
    if (await tao.count()) {
      await tao.first().click({ timeout: 5000 });
      await page.waitForTimeout(3000);
    }
  } catch {
    /* không có màn rỗng — dự án đã có bản vẽ */
  }
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(4000);
  await boQuaLopChe(page);
}

/** Lớp giới thiệu che canvas ở lần đầu vào chặng — bấm bỏ qua nếu có. */
async function boQuaLopChe(page) {
  for (const ten of ['Vẽ ngay', 'Bỏ qua']) {
    const l = page.getByRole('button', { name: ten, exact: true });
    try {
      if (await l.count()) await l.first().click({ timeout: 2500 });
    } catch {
      /* không có lớp che — bình thường */
    }
  }
  await page.waitForTimeout(800);
}

/**
 * VẼ THẬT một đoạn thẳng bằng chuột (chọn công cụ Đường → 2 điểm → Esc), rồi đợi autosave
 * debounce ghi xuống IndexedDB. Đây là "việc thiết kế" mà bất biến #1 bảo vệ.
 */
async function veMotDuong(page) {
  await page.getByRole('button', { name: 'Đường', exact: true }).first().click();
  await page.waitForTimeout(600);
  const b = await page.locator('canvas').first().boundingBox();
  const dx = Math.floor(Math.random() * 120);
  await page.mouse.click(b.x + 160 + dx, b.y + 180);
  await page.waitForTimeout(400);
  await page.mouse.click(b.x + 420 + dx, b.y + 330);
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(5000); // autosave debounce ≥1s + vòng ghi IDB
}

/* ── kịch bản bơm lỗi, cài TRƯỚC khi trang chạy dòng script đầu tiên ── */

const CHAN_GHI_LOCAL = `(() => {
  const goc = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    if (this === window.localStorage) throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    return goc.call(this, k, v);
  };
})();`;

/**
 * Chặn HẲN localStorage — đọc cũng ném. Chỉ chặn `localStorage`, KHÔNG đụng `sessionStorage`
 * (Safari "Block All Cookies" và chế độ chặn dữ liệu trang của Chrome hành xử đúng như vậy).
 */
const CHAN_CA_LOCAL = `(() => {
  const g = Storage.prototype;
  const oS = g.setItem, oG = g.getItem, oR = g.removeItem;
  const chan = () => { throw new DOMException('SecurityError', 'SecurityError'); };
  g.setItem = function (k, v) { if (this === window.localStorage) chan(); return oS.call(this, k, v); };
  g.getItem = function (k) { if (this === window.localStorage) chan(); return oG.call(this, k); };
  g.removeItem = function (k) { if (this === window.localStorage) chan(); return oR.call(this, k); };
})();`;

const gieoDinhDanhCu = (userId) =>
  `try { localStorage.setItem('interiorflow.lastUserId', ${JSON.stringify(userId)}); } catch {}`;

/* ─────────────────────────── khung chạy ─────────────────────────── */

const ketQua = [];

function ghi(ma, ten, trangThai, bangChung, ghiChu = '') {
  ketQua.push({ ma, ten, trangThai, bangChung, ghiChu });
  const bieu = { PASS: '✅ PASS', FAIL: '❌ FAIL', UNVERIFIED: '🟡 UNVERIFIED' }[trangThai];
  console.log(`\n${bieu}  CA${ma} · ${ten}`);
  console.log(`   ${bangChung}`);
  if (ghiChu) console.log(`   ↳ ${ghiChu}`);
}

async function chup(page, ten) {
  try {
    mkdirSync(THU_MUC_ANH, { recursive: true });
    await page.screenshot({ path: path.join(THU_MUC_ANH, `${ten}.png`) });
  } catch {
    /* ảnh là phụ trợ — không được làm hỏng phép nghiệm thu */
  }
}

/**
 * Khung chung cho CA1-CA3: định danh PHẢI xác lập được, việc PHẢI sống qua tải lại, và PHẢI nằm
 * đúng kho của người đang đăng nhập.
 *
 * `tiemLoi` = đoạn script bơm hỏng localStorage (rỗng = ca sạch).
 * Trả về đối tượng phán quyết để `--hieu-chuan` dùng lại ĐÚNG bộ khẳng định này.
 */
async function chayCaSongSot(browser, { ma, ten, tiemLoi, chanAuthMe = false, anh }) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const idA = await dangNhap(ctx, A);
    if (chanAuthMe) await page.route('**/api/auth/me', (r) => r.abort('failed'));
    if (tiemLoi) await page.addInitScript(tiemLoi);

    await moEditor(page, DA1);
    const truoc = await docKho(page);
    const khoa = khoaCad(idA, DA1);
    const nTruoc = soThucThe(truoc, khoa);

    await veMotDuong(page);
    const sauVe = await docKho(page);
    const nSauVe = soThucThe(sauVe, khoa);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('canvas', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(6000);
    const sauTai = await docKho(page);
    const nSauTai = soThucThe(sauTai, khoa);
    if (anh) await chup(page, anh);

    const moHo = sauTai.ban.filter((b) => laKhoMoHo(b.khoa)).map((b) => b.khoa);
    const daGhi = nSauVe > nTruoc;
    const conNguyen = nSauTai >= nSauVe && nSauVe > 0;
    const dat = daGhi && conNguyen && moHo.length === 0;

    const bc =
      `kho "${khoa}": ${nTruoc} → ${nSauVe} (sau khi vẽ) → ${nSauTai} (sau khi tải lại) · ` +
      `khoá mơ hồ: ${moHo.length ? moHo.join(',') : 'không'}`;
    return { dat, bc, page, ctx, chiTiet: { nTruoc, nSauVe, nSauTai, moHo, khoa, ban: sauTai.ban } };
  } catch (e) {
    return { dat: false, loi: String(e).slice(0, 200), page, ctx, chiTiet: {} };
  }
}

/* ─────────────────────────── tám ca ─────────────────────────── */

async function ca1(browser) {
  const r = await chayCaSongSot(browser, {
    ma: 1,
    ten: 'Deep-link · localStorage RỖNG · đã đăng nhập ở máy chủ',
    tiemLoi: '',
    anh: 'ca1-deep-link-localstorage-rong',
  });
  await r.ctx.close();
  if (r.loi) return ghi(1, 'Deep-link · localStorage RỖNG', 'UNVERIFIED', `không dựng được ca: ${r.loi}`);
  ghi(
    1,
    'Deep-link · localStorage RỖNG',
    r.dat ? 'PASS' : 'FAIL',
    r.bc,
    'Việc vẽ ghi xuống IndexedDB đúng kho của người đang đăng nhập và sống qua tải lại.',
  );
}

async function ca2(browser) {
  const r = await chayCaSongSot(browser, {
    ma: 2,
    ten: 'localStorage GHI HỎNG',
    tiemLoi: CHAN_GHI_LOCAL,
    anh: 'ca2-localstorage-ghi-hong',
  });
  await r.ctx.close();
  if (r.loi) return ghi(2, 'localStorage GHI HỎNG (setItem ném lỗi)', 'UNVERIFIED', `không dựng được ca: ${r.loi}`);
  ghi(
    2,
    'localStorage GHI HỎNG (setItem ném lỗi)',
    r.dat ? 'PASS' : 'FAIL',
    r.bc,
    'Đường lùi trong bộ nhớ (lib/resume.ts demTrongBoNho) giữ định danh khi localStorage không ghi nổi.',
  );
}

/**
 * CA3 — localStorage bị CHẶN HẲN (đọc cũng ném). Ca này TÁCH HAI CHIỀU, vì kết quả thật lệch
 * nhau: an toàn dữ liệu thì không bị vi phạm, nhưng app CHẾT hẳn nên không ai làm việc được.
 * Gộp hai chiều vào một chữ PASS/FAIL sẽ nói dối về một trong hai.
 */
async function ca3(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const loiTrang = [];
  page.on('pageerror', (e) => loiTrang.push(String(e).slice(0, 60)));
  try {
    const idA = await dangNhap(ctx, A);
    await page.addInitScript(CHAN_CA_LOCAL);
    await page.goto(`${GOC}/projects/${DA1}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(10000);
    await chup(page, 'ca3-localstorage-chan-han');

    const dom = await page.evaluate(() => ({
      soNut: document.querySelectorAll('button').length,
      soCanvas: document.querySelectorAll('canvas').length,
      chu: document.body.innerText.trim().length,
    }));
    const kho = await docKho(page);
    const moHo = kho.ban.filter((b) => laKhoMoHo(b.khoa)).map((b) => b.khoa);
    const khoaNguoiKhac = kho.ban.filter((b) => !b.khoa.startsWith(`${idA}::`)).map((b) => b.khoa);

    const appDung = dom.soCanvas > 0 && dom.soNut > 0;
    const anToanDuLieu = moHo.length === 0 && khoaNguoiKhac.length === 0;

    const bc =
      `app dựng được: ${appDung ? 'CÓ' : 'KHÔNG (0 canvas, ' + dom.soNut + ' nút, ' + dom.chu + ' ký tự — trang trắng)'} · ` +
      `lỗi trang chưa bắt: ${loiTrang.length} · ` +
      `khoá mơ hồ: ${moHo.length ? moHo.join(',') : 'không'} · ghi nhờ kho người khác: ${khoaNguoiKhac.length ? khoaNguoiKhac.join(',') : 'không'}`;

    ghi(
      3,
      'localStorage CHẶN HẲN (đọc cũng ném)',
      appDung && anToanDuLieu ? 'PASS' : 'FAIL',
      bc,
      appDung
        ? 'App sống và không ghi bừa.'
        : 'AN TOÀN DỮ LIỆU KHÔNG BỊ VI PHẠM (không ghi được byte nào ra đâu cả) NHƯNG APP CHẾT HẲN: ' +
          'localStorage.getItem không bọc try/catch ở components/studio/Navigator.tsx:60 và ' +
          'lib/cad/touch-input.ts:38 (readFingerDrawPreference) ném trong effect ⇒ React gỡ cả cây ⇒ trang trắng. ' +
          'Hai tệp này NẰM NGOÀI bản vá P0; lib/danh-tinh-phien.ts và lib/resume.ts đều đã bọc đúng.',
    );
  } catch (e) {
    ghi(3, 'localStorage CHẶN HẲN (đọc cũng ném)', 'UNVERIFIED', `không dựng được ca: ${String(e).slice(0, 180)}`);
  } finally {
    await ctx.close();
  }
}

/**
 * CA4 — BẤT BIẾN #2. Định danh CŨ của người dùng TRƯỚC còn sót trong localStorage, phiên máy chủ
 * là người MỚI. Việc của người mới TUYỆT ĐỐI không được rơi vào kho người cũ.
 */
async function ca4(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    // Lấy id người B (người "trước") rồi đăng xuất — chỉ mượn id, không giữ phiên của B.
    const idB = await dangNhap(ctx, B);
    await dangXuat(ctx);
    // Người MỚI (A) đăng nhập ở máy chủ, nhưng localStorage vẫn còn định danh của B.
    const idA = await dangNhap(ctx, A);
    await page.addInitScript(gieoDinhDanhCu(idB));

    await moEditor(page, DA1);
    const truoc = await docKho(page);
    const khoaA = khoaCad(idA, DA1);
    const khoaB = khoaCad(idB, DA1);
    const bTruoc = soThucThe(truoc, khoaB);

    await veMotDuong(page);
    const sau = await docKho(page);
    await chup(page, 'ca4-dinh-danh-cu-con-sot');

    const bSau = soThucThe(sau, khoaB);
    const aSau = soThucThe(sau, khoaA);
    const doVaoKhoB = bSau > bTruoc;
    const lastUser = await page.evaluate(() => {
      try {
        return localStorage.getItem('interiorflow.lastUserId');
      } catch {
        return null;
      }
    });

    const bc =
      `phiên máy chủ = A(${idA.slice(-6)}), bộ đệm sót = B(${idB.slice(-6)}) · ` +
      `kho B "${khoaB}": ${bTruoc} → ${bSau} · kho A: ${aSau} · lastUserId sau lượt = ` +
      `${String(lastUser).slice(-6)}`;

    ghi(
      4,
      'BẤT BIẾN #2 · định danh người TRƯỚC còn sót',
      doVaoKhoB ? 'FAIL' : 'PASS',
      bc,
      doVaoKhoB
        ? 'VI PHẠM: việc của A vừa được ghi vào kho của B. giaiDanhTinh() đọc bộ đệm TRƯỚC và trả về ngay, không bao giờ hỏi máy chủ để đối chiếu.'
        : 'Không có byte nào của A rơi vào kho B.',
    );
  } catch (e) {
    ghi(4, 'BẤT BIẾN #2 · định danh người TRƯỚC còn sót', 'UNVERIFIED', `không dựng được ca: ${String(e).slice(0, 180)}`);
  } finally {
    await ctx.close();
  }
}

/**
 * Khung chung CA5-CA7 — máy chủ KHÔNG kết luận được định danh. Bất biến #3: thà không ghi còn
 * hơn ghi vào kho mơ hồ. Điều PHẢI đúng: không sinh khoá `local::`/rỗng/`undefined::`, và không
 * ghi nhờ vào kho của bất kỳ người nào khác.
 */
async function caKhongKetLuan(browser, { ma, ten, lapTuyen, ghiChu }) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const idA = await dangNhap(ctx, A);
    await lapTuyen(page);

    await moEditor(page, DA1);
    const truoc = await docKho(page);
    await veMotDuong(page);
    const sau = await docKho(page);
    await chup(page, `ca${ma}-${ten.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`);

    const moHo = sau.ban.filter((b) => laKhoMoHo(b.khoa)).map((b) => b.khoa);
    const khoaA = khoaCad(idA, DA1);
    // Bản ghi nào TĂNG số thực thể trong lượt này?
    const tang = sau.ban.filter((b) => b.soThucThe > soThucThe(truoc, b.khoa)).map((b) => b.khoa);
    const ghiLungTung = tang.filter((k) => k !== khoaA);

    const dat = moHo.length === 0 && ghiLungTung.length === 0;
    const bc =
      `khoá mơ hồ: ${moHo.length ? moHo.join(',') : 'không'} · ` +
      `kho được ghi trong lượt: ${tang.length ? tang.join(',') : 'không ghi gì'} · ` +
      `ghi sai kho: ${ghiLungTung.length ? ghiLungTung.join(',') : 'không'}`;
    ghi(ma, ten, dat ? 'PASS' : 'FAIL', bc, ghiChu);
  } catch (e) {
    ghi(ma, ten, 'UNVERIFIED', `không dựng được ca: ${String(e).slice(0, 180)}`);
  } finally {
    await ctx.close();
  }
}

const ca5 = (b) =>
  caKhongKetLuan(b, {
    ma: 5,
    ten: 'LỖI MẠNG khi gọi /api/auth/me',
    lapTuyen: (p) => p.route('**/api/auth/me', (r) => r.abort('failed')),
    ghiChu: 'Mạng đứt KHÔNG được suy ra "chưa đăng nhập"; không kết luận ⇒ không ghi bừa.',
  });

const ca6 = (b) =>
  caKhongKetLuan(b, {
    ma: 6,
    ten: '/api/auth/me trả 401',
    lapTuyen: (p) =>
      p.route('**/api/auth/me', (r) =>
        r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ user: null, reason: 'anonymous' }) }),
      ),
    ghiChu: 'Máy chủ nói rõ chưa đăng nhập ⇒ chạy thuần bộ nhớ, không ghi xuống đĩa.',
  });

const ca7 = (b) =>
  caKhongKetLuan(b, {
    ma: 7,
    ten: '/api/auth/me trả JSON MÉO',
    lapTuyen: (p) =>
      p.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"user":{"id":' })),
    ghiChu: 'Thân hỏng ⇒ nhánh "than-hong" ⇒ không gieo bộ đệm, không ghi.',
  });

/**
 * CA8 — đổi dự án giữa phiên + đăng xuất/đăng nhập ĐỔI NGƯỜI + tải lại. Ca tổng hợp, đúng đời
 * thật nhất: một máy dùng chung, hai người nối nhau.
 */
async function ca8(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const idA = await dangNhap(ctx, A);

    // ── Chặng 1: A làm việc ở dự án 1 ─────────────────────────────
    await moEditor(page, DA1);
    const t0 = await docKho(page);
    await veMotDuong(page);
    const t1 = await docKho(page);
    const kA1 = khoaCad(idA, DA1);
    const veDuoc1 = soThucThe(t1, kA1) > soThucThe(t0, kA1);

    // ── Chặng 2: ĐỔI DỰ ÁN (điều hướng trong app, component không remount) ──
    await moEditor(page, DA2);
    const t2 = await docKho(page);
    await veMotDuong(page);
    const t3 = await docKho(page);
    const kA2 = khoaCad(idA, DA2);
    const veDuoc2 = soThucThe(t3, kA2) > soThucThe(t2, kA2);
    // Đổi dự án KHÔNG được làm bẩn kho dự án cũ.
    const duAn1ConNguyen = soThucThe(t3, kA1) === soThucThe(t1, kA1);

    // ── Chặng 3: ĐỔI NGƯỜI trên cùng trình duyệt ──────────────────
    // B đi vào DỰ ÁN CỦA CHÍNH B (đời thật: máy dùng chung, người sau làm việc của mình).
    // Vào thẳng dự án của A thì máy chủ chặn vì B không phải thành viên — không kiểm được gì.
    await dangXuat(ctx);
    const idB = await dangNhap(ctx, B);
    await moEditor(page, DAB);

    const t4 = await docKho(page);
    const kA2Truoc = soThucThe(t4, kA2);
    const kA1Truoc = soThucThe(t4, kA1);
    const kB = khoaCad(idB, DAB);
    const kAB = khoaCad(idA, DAB); // kho SAI mà việc của B có thể rơi vào
    const abTruoc = soThucThe(t4, kAB);

    await veMotDuong(page); // B vẽ, trong dự án của chính B
    const t5 = await docKho(page);
    await chup(page, 'ca8-doi-du-an-va-doi-nguoi-dung');

    // Vi phạm nếu: việc của B rơi vào kho mang id của A, hoặc kho của A bị đụng vào.
    const bGhiVaoKhoA =
      soThucThe(t5, kAB) > abTruoc || soThucThe(t5, kA2) > kA2Truoc || soThucThe(t5, kA1) > kA1Truoc;
    const bGhiDungKho = soThucThe(t5, kB) > soThucThe(t4, kB);
    const lastUser = await page.evaluate(() => {
      try {
        return localStorage.getItem('interiorflow.lastUserId');
      } catch {
        return null;
      }
    });
    const demSai = lastUser === idA;

    const dat = veDuoc1 && veDuoc2 && duAn1ConNguyen && !bGhiVaoKhoA && bGhiDungKho;
    const bc =
      `A vẽ ở DA1: ${veDuoc1 ? 'ghi được' : 'KHÔNG'} · A vẽ ở DA2: ${veDuoc2 ? 'ghi được' : 'KHÔNG'} · ` +
      `DA1 còn nguyên sau khi đổi dự án: ${duAn1ConNguyen ? 'có' : 'KHÔNG'} · ` +
      `B vẽ vào ĐÚNG kho B: ${bGhiDungKho ? 'có' : 'KHÔNG'} · B ghi nhầm vào kho mang id A: ${bGhiVaoKhoA ? 'CÓ' : 'không'} · ` +
      `lastUserId=${String(lastUser).slice(-6)} (A=${idA.slice(-6)}, B=${idB.slice(-6)})`;

    ghi(
      8,
      'Đổi dự án + ĐỔI NGƯỜI DÙNG + tải lại',
      dat ? 'PASS' : 'FAIL',
      bc,
      bGhiVaoKhoA
        ? 'VI PHẠM BẤT BIẾN #2: sau khi đổi người, việc của B ghi thẳng vào kho của A.'
        : demSai
          ? 'Bộ đệm vẫn giữ id người cũ sau khi đổi người — mầm của vi phạm.'
          : 'Không có rò chéo giữa hai người và hai dự án.',
    );
  } catch (e) {
    ghi(8, 'Đổi dự án + ĐỔI NGƯỜI DÙNG + tải lại', 'UNVERIFIED', `không dựng được ca: ${String(e).slice(0, 180)}`);
  } finally {
    await ctx.close();
  }
}

/**
 * HIỆU CHUẨN — dựng thế giới BIẾT CHẮC HỎNG (chặn `/api/auth/me` + localStorage rỗng ⇒ không thể
 * có định danh ⇒ không ghi được gì xuống đĩa) rồi chạy ĐÚNG bộ khẳng định của CA1. Bộ khẳng định
 * đó PHẢI ra ĐỎ. Nếu nó vẫn xanh thì mọi chữ PASS ở trên đều vô nghĩa.
 */
async function hieuChuan(browser) {
  const r = await chayCaSongSot(browser, {
    ma: 0,
    ten: 'hiệu chuẩn',
    tiemLoi: '',
    chanAuthMe: true,
    anh: 'hieu-chuan-the-gioi-biet-chac-hong',
  });
  await r.ctx.close();
  const doDung = r.dat === false;
  console.log(`\n${doDung ? '✅' : '❌'}  HIỆU CHUẨN · thế giới biết-chắc-hỏng`);
  console.log(`   ${r.bc ?? r.loi}`);
  console.log(
    `   ↳ bộ khẳng định của CA1 chạy trên thế giới hỏng cho kết quả: ${r.dat ? 'XANH (bộ này VÔ GIÁ TRỊ)' : 'ĐỎ (bộ này có hiệu lực)'}`,
  );
  return doDung;
}

/* ─────────────────────────── chạy ─────────────────────────── */

const CAC_CA = { 1: ca1, 2: ca2, 3: ca3, 4: ca4, 5: ca5, 6: ca6, 7: ca7, 8: ca8 };

const browser = await moTrinhDuyet();
let hcDat = null;
try {
  if (co('hieu-chuan')) {
    hcDat = await hieuChuan(browser);
  } else {
    hcDat = await hieuChuan(browser);
    const ds = CHI_CA ? [Number(CHI_CA)] : [1, 2, 3, 4, 5, 6, 7, 8];
    for (const n of ds) {
      if (CAC_CA[n]) await CAC_CA[n](browser);
    }
  }
} finally {
  await browser.close();
}

if (ketQua.length) {
  console.log('\n' + '─'.repeat(78));
  console.log('BẢNG TỔNG — CỔNG G1 DATA SAFE');
  console.log('─'.repeat(78));
  for (const k of ketQua) console.log(`CA${k.ma}  ${k.trangThai.padEnd(11)} ${k.ten}`);
  const fail = ketQua.filter((k) => k.trangThai === 'FAIL').length;
  const unv = ketQua.filter((k) => k.trangThai === 'UNVERIFIED').length;
  console.log('─'.repeat(78));
  console.log(`hiệu chuẩn: ${hcDat ? 'ĐẠT (bộ có hiệu lực)' : 'KHÔNG ĐẠT — mọi kết quả trên vô giá trị'}`);
  console.log(`FAIL=${fail}  UNVERIFIED=${unv}  PASS=${ketQua.length - fail - unv}`);
  console.log(
    `\nKẾT LUẬN CỔNG G1: ${fail === 0 && unv === 0 && hcDat ? 'PASS' : 'CHƯA ĐÓNG ĐƯỢC'}`,
  );
  process.exitCode = fail === 0 && unv === 0 && hcDat ? 0 : 1;
} else {
  process.exitCode = hcDat ? 0 : 1;
}
