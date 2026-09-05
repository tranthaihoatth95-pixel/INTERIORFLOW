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
 *   node scripts/nghiem-thu-g1.mjs                # chạy cả 12 ca (2D 1-8 · Trình chiếu 9-10 · 3D 11-12)
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
/** Chặng Trình chiếu dùng khoá route RIÊNG (`PresentSheets.tsx:81`). */
const ROUTE_PRESENT = '/present-editor';

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
                  // Hai ĐƠN VỊ VIỆC khác nhau, cùng một kho: chặng vẽ đếm THỰC THỂ trong
                  // `doc.entities`, chặng trình chiếu đếm SLIDE trong `deck.slides`
                  // (đo thật 04/09: bản ghi present có `truong: [id, name, deck]`).
                  soThucThe: (r?.sheets?.[0]?.doc?.entities ?? []).length,
                  soSlide: (r?.sheets?.[0]?.deck?.slides ?? []).length,
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

/* ───────────────── BA MẶT LÀM VIỆC (2D · Trình chiếu · 3D) ─────────────────
 *
 * ⛔ VÌ SAO PHẢI CÓ: lượt nghiệm thu 03/09 chạy TÁM ca nhưng **chỉ trên chặng 2D**, rồi SUY ra
 * `PresentSheets` và autosave 3D cũng an toàn vì "đi cùng một `danhTinhChoLuot`". Suy KHÔNG phải
 * bằng chứng — và đúng chỗ này thì suy dễ trượt nhất: ba mặt có ba ĐƠN VỊ VIỆC khác nhau, hai
 * KHOÁ route khác nhau, và ba đường vào màn khác nhau. Nay mỗi mặt tự chạy ca của nó.
 *
 * ⚠️ 3D DÙNG CHUNG KHOÁ VỚI 2D (`/cad-editor`) — cố ý, không phải lỗi: `lib/cad/cad3d-autosave.ts`
 * gọi lại ĐÚNG `loadSheets`/`saveSheets` của `CadSheets` để không đẻ cơ chế lưu thứ hai. Nên ca 3D
 * đo TĂNG THÊM trên cùng khoá đó, không đi tìm khoá mới.
 */
const MAT = {
  '2d': {
    ten: '2D',
    route: (duAn) => `/projects/${duAn}/cad`,
    khoa: (userId, duAn) => `${userId}::${ROUTE_CAD}::${duAn}`,
    dem: (kho, khoa) => layBan(kho, khoa)?.soThucThe ?? 0,
    donVi: 'thực thể',
    moMat: async (page, duAn) => {
      await moEditor(page, duAn);
    },
    lamViec: (page) => veMotDuong(page),
  },
  present: {
    ten: 'Trình chiếu',
    route: (duAn) => `/projects/${duAn}/present`,
    khoa: (userId, duAn) => `${userId}::${ROUTE_PRESENT}::${duAn}`,
    dem: (kho, khoa) => layBan(kho, khoa)?.soSlide ?? 0,
    donVi: 'slide',
    moMat: async (page, duAn) => {
      await moTrang(page, `/projects/${duAn}/present`);
      // Dự án chưa có bản vẽ nào ⇒ màn chặn `ProjectScopeEmptyState`. Tạo một cái rồi đi tiếp.
      await bamNeuCo(page, 'Tạo bản vẽ mới', 14000);
      await boQuaLopChe(page);
      // Kệ mẫu hồ sơ đè lên canvas ở lần đầu — chọn hồ sơ trống để có mặt làm việc thật.
      // ⚠️ Kệ này hiện CHẬM (đo thật: dự án mới cần ~19s kể từ lúc mở), nên phải CHỜ NÓ chứ
      // không bấm một phát rồi đi tiếp — bấm hụt thì ca sau chết ở "Thêm slide" và ra
      // UNVERIFIED, tức là mất một phép đo chỉ vì nhịp máy chậm.
      await choMatSanSang(page, 'Thêm slide', 'Tạo hồ sơ trống');
    },
    lamViec: async (page) => {
      await page.getByRole('button', { name: 'Thêm slide', exact: true }).first().click({ timeout: 15000 });
      await page.waitForTimeout(5000); // autosave debounce ≥1s + vòng ghi IDB
    },
  },
  '3d': {
    ten: '3D',
    route: (duAn) => `/projects/${duAn}/render`,
    khoa: (userId, duAn) => `${userId}::${ROUTE_CAD}::${duAn}`,
    dem: (kho, khoa) => layBan(kho, khoa)?.soThucThe ?? 0,
    donVi: 'thực thể',
    moMat: async (page, duAn) => {
      await moTrang(page, `/projects/${duAn}/render`);
      await bamNeuCo(page, 'Tạo bản vẽ mới', 14000);
      await boQuaLopChe(page);
      await choMatSanSang(page, 'Vẽ 3D', 'Tạo bản vẽ mới');
      /**
       * ⛔ ĐỌC TRẠNG THÁI RỒI MỚI BẤM. `ModeSwitchCell.tsx:32` phơi `aria-pressed` — dùng nó.
       * Mode "Vẽ 3D" được NHỚ GIỮA CÁC LƯỢT, nên sang dự án thứ hai app đã ở sẵn 3D; bấm mù một
       * phát là **gạt ngược về Node**, và ca chết ở chỗ tưởng như không liên quan ("Thêm tường"
       * không hiện). Đo thật 04/09: đúng bẫy này đã làm CA12 ra UNVERIFIED hai lượt liền.
       */
      const congTac = page.getByRole('button', { name: 'Vẽ 3D', exact: true }).first();
      if ((await congTac.getAttribute('aria-pressed')) !== 'true') {
        await congTac.click({ timeout: 20000 });
      }
      await page.waitForSelector('canvas', { timeout: 60000 });
      /**
       * ⛔ CHỜ SUÔNG, TUYỆT ĐỐI KHÔNG BẤM LẠI "Vẽ 3D": nó là CÔNG TẮC GẠT, không phải nút mở.
       * Bấm lần hai là gạt NGƯỢC về mode Node ⇒ "Thêm tường" không bao giờ hiện ⇒ ca chết vì
       * chính cơ chế chờ của mình. Nút mở dùng được cho `choMatSanSang` phải là nút MỘT CHIỀU.
       */
      await choNut(page, 'Thêm tường');
      await page.waitForTimeout(3000);
    },
    lamViec: async (page) => {
      await page.getByRole('button', { name: 'Thêm tường', exact: true }).first().click({ timeout: 15000 });
      await page.waitForTimeout(5000);
    },
  },
};

async function moTrang(page, duong) {
  await page.goto(`${GOC}${duong}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(6000);
}

/**
 * CHỜ MẶT LÀM VIỆC SẴN SÀNG — lặp tối đa 6 lượt × 5s: thấy `nutDich` là xong; chưa thấy thì bấm
 * `nutMo` (nút mở màn, ví dụ "Tạo hồ sơ trống") rồi chờ tiếp.
 * Vì sao lặp thay vì một lần chờ dài: nút mở CHÍNH NÓ cũng hiện chậm, và có lượt phải bấm hai
 * lần (kệ đóng rồi mở lại). Chờ dài một lượt không phủ được ca đó.
 */
/** Chờ một nút xuất hiện, KHÔNG bấm gì thêm. Dùng khi nút mở là công tắc gạt (bấm lại là gạt ngược). */
async function choNut(page, ten, han = 45000) {
  try {
    await page.getByRole('button', { name: ten, exact: true }).first().waitFor({ timeout: han });
  } catch {
    const nut = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .map((b) => (b.textContent || '').trim().slice(0, 24))
        .filter(Boolean)
        .slice(0, 18),
    );
    throw new Error(`không thấy nút "${ten}" sau ${han}ms · url=${page.url()} · nút đang có: ${nut.join(' | ')}`);
  }
}

async function choMatSanSang(page, nutDich, nutMo) {
  for (let i = 0; i < 8; i += 1) {
    if (await page.getByRole('button', { name: nutDich, exact: true }).count()) return;
    await bamNeuCo(page, nutMo, 4000);
    await page.waitForTimeout(5000);
  }
  /**
   * ⛔ HẾT KIÊN NHẪN THÌ PHẢI NÓI RÕ ĐANG ĐỨNG Ở ĐÂU. Bản đầu chỉ để `locator.click` hết giờ ⇒
   * báo cáo chỉ có một dòng "Timeout" mà KHÔNG biết mặt nào, dự án nào, đang kẹt ở màn gì —
   * tức một ca mất trắng vì thiếu chẩn đoán, không phải vì app hỏng.
   */
  const nut = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .map((b) => (b.textContent || '').trim().slice(0, 24))
      .filter(Boolean)
      .slice(0, 18),
  );
  throw new Error(
    `không tới được nút "${nutDich}" (đã thử mở bằng "${nutMo}") · url=${page.url()} · nút đang có: ${nut.join(' | ')}`,
  );
}

/** Bấm một nút NẾU nó có mặt — màn chặn/kệ mẫu chỉ hiện ở lần đầu, không hiện là bình thường. */
async function bamNeuCo(page, ten, cho = 6000) {
  const n = page.getByRole('button', { name: ten, exact: true });
  try {
    if (await n.count()) {
      await n.first().click({ timeout: 8000 });
      await page.waitForTimeout(cho);
    }
  } catch {
    /* nút có nhưng không bấm được (đang chạy dở) — lượt sau sẽ tự qua */
  }
}

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

/**
 * CHẶN GHI IndexedDB, GIỮ NGUYÊN ĐƯỜNG ĐỌC — thế giới biết-chắc-hỏng dùng cho HIỆU CHUẨN mọi mặt.
 *
 * ⛔ VÌ SAO KHÔNG DÙNG "CHẶN ĐỊNH DANH" CHO MẶT TRÌNH CHIẾU VÀ 3D (đo thật 04/09): chặn
 * `/api/auth/me` làm app **không dựng nổi màn** — 401 rơi vào màn khoá ("Skip →"), mạng đứt rơi
 * vào "Chưa kết nối được máy chủ · Thử lại". Ca đỏ vì KHÔNG VỚI TỚI MẶT, chứ không phải vì bộ
 * khẳng định bắt được — loại đỏ đó **không chứng minh phép đo có hiệu lực**, mà chứng minh có
 * hiệu lực mới là toàn bộ mục đích của hiệu chuẩn.
 *
 * Thế giới này thì khác: app SỐNG, định danh giải ĐÚNG, người dùng làm việc THẬT, chỉ có lượt
 * GHI xuống đĩa là không bao giờ tới nơi. Đúng hình dạng của lỗi P0 gốc ("không ghi một byte nào
 * và không báo lỗi"), và đường ĐỌC vẫn nguyên nên `docKho` vẫn đo được — nghĩa là con số 0 nó
 * trả về là một PHÉP ĐO THẬT, không phải một phép đo bị mù.
 */
const CHAN_GHI_IDB = `(() => {
  const goc = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...a) {
    if (this.name === 'sheets') throw new DOMException('ConstraintError', 'ConstraintError');
    return goc.apply(this, a);
  };
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

/* ═════════ CA 9-12 · CÙNG HAI CA ĐẮT NHẤT, CHẠY TRÊN TRÌNH CHIẾU VÀ 3D ═════════
 *
 * Chọn CA1 và CA8 vì lượt trước chúng bắt được nhiều lỗi nhất: CA1 canh bất biến #1 (không mất
 * việc) qua đúng đường deep-link đã gây P0; CA8 canh bất biến #2 (không rò chéo người dùng) —
 * chính nó phát hiện lỗ `giaiDanhTinh` tin bộ đệm.
 */

/** Khung chung cho ca "deep-link · localStorage RỖNG" trên MỘT mặt bất kỳ. */
async function caDeepLinkMat(browser, maMat, { kieuHong = '' } = {}) {
  const mat = MAT[maMat];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const idA = await dangNhap(ctx, A);
    /**
     * HAI KIỂU DỰNG THẾ GIỚI HỎNG, và chúng KHÔNG tương đương — bài học từ lượt chạy đầu:
     * · `mang-dut` (abort) làm chặng 3D **không dựng nổi màn** ⇒ ca đỏ vì NGOẠI LỆ, không phải vì
     *   bộ khẳng định bắt được. Đỏ kiểu đó không chứng minh phép đo có hiệu lực.
     * · `401` giữ app SỐNG (cookie phiên vẫn hợp lệ cho `/api/flows`) nhưng máy chủ nói rõ "không
     *   có ai đăng nhập" ⇒ `giaiDanhTinh` trả `chua-dang-nhap` ⇒ KHÔNG ghi byte nào. Ca vẫn làm
     *   được đủ thao tác rồi mới đỏ ở đúng chỗ cần đỏ. Đây mới là phép hiệu chuẩn thật.
     */
    if (kieuHong === 'mang-dut') await page.route('**/api/auth/me', (r) => r.abort('failed'));
    if (kieuHong === '401') {
      await page.route('**/api/auth/me', (r) =>
        r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ user: null, reason: 'anonymous' }) }),
      );
    }
    if (kieuHong === 'chan-ghi-idb') await page.addInitScript(CHAN_GHI_IDB);

    await mat.moMat(page, DA1);
    const khoa = mat.khoa(idA, DA1);
    const nTruoc = mat.dem(await docKho(page), khoa);

    await mat.lamViec(page);
    const nSauVe = mat.dem(await docKho(page), khoa);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(9000);
    const sauTai = await docKho(page);
    const nSauTai = mat.dem(sauTai, khoa);

    const moHo = sauTai.ban.filter((b) => laKhoMoHo(b.khoa)).map((b) => b.khoa);
    const daGhi = nSauVe > nTruoc;
    const conNguyen = nSauTai >= nSauVe && nSauVe > 0;
    const bc =
      `kho "${khoa}": ${nTruoc} → ${nSauVe} (sau khi làm việc) → ${nSauTai} (sau khi tải lại) ${mat.donVi} · ` +
      `khoá mơ hồ: ${moHo.length ? moHo.join(',') : 'không'}`;
    return { dat: daGhi && conNguyen && moHo.length === 0, bc, ctx, page };
  } catch (e) {
    return { dat: false, loi: String(e).slice(0, 200), ctx, page };
  }
}

async function caDeepLink(browser, { ma, maMat, anh }) {
  const mat = MAT[maMat];
  const ten = `${mat.ten} · deep-link · localStorage RỖNG`;
  const r = await caDeepLinkMat(browser, maMat);
  await chup(r.page, anh).catch(() => {});
  await r.ctx.close();
  if (r.loi) return ghi(ma, ten, 'UNVERIFIED', `không dựng được ca: ${r.loi}`);
  ghi(
    ma,
    ten,
    r.dat ? 'PASS' : 'FAIL',
    r.bc,
    `Việc ở chặng ${mat.ten} ghi xuống IndexedDB đúng kho người đang đăng nhập và sống qua tải lại.`,
  );
}

/**
 * Khung chung cho ca "đổi dự án + ĐỔI NGƯỜI DÙNG" trên MỘT mặt bất kỳ — bản CA8 cho mặt khác.
 * Vì sao B làm việc trong DỰ ÁN CỦA CHÍNH B: vào dự án của A thì máy chủ chặn (B không phải
 * thành viên) nên không kiểm được gì.
 */
async function caDoiNguoiMat(browser, { ma, maMat, anh }) {
  const mat = MAT[maMat];
  const ten = `${mat.ten} · đổi dự án + ĐỔI NGƯỜI DÙNG`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const idA = await dangNhap(ctx, A);

    // ── Chặng 1: A làm việc ở dự án 1 ──
    await mat.moMat(page, DA1);
    const kA1 = mat.khoa(idA, DA1);
    const a1Truoc = mat.dem(await docKho(page), kA1);
    await mat.lamViec(page);
    const t1 = await docKho(page);
    const veDuoc1 = mat.dem(t1, kA1) > a1Truoc;

    // ── Chặng 2: ĐỔI DỰ ÁN (điều hướng trong app) ──
    await mat.moMat(page, DA2);
    const kA2 = mat.khoa(idA, DA2);
    const a2Truoc = mat.dem(await docKho(page), kA2);
    await mat.lamViec(page);
    const t3 = await docKho(page);
    const veDuoc2 = mat.dem(t3, kA2) > a2Truoc;
    const duAn1ConNguyen = mat.dem(t3, kA1) === mat.dem(t1, kA1);

    // ── Chặng 3: ĐỔI NGƯỜI trên cùng trình duyệt ──
    await dangXuat(ctx);
    const idB = await dangNhap(ctx, B);
    await mat.moMat(page, DAB);
    const t4 = await docKho(page);
    const kB = mat.khoa(idB, DAB);
    const kAB = mat.khoa(idA, DAB); // kho SAI mà việc của B có thể rơi vào
    const abTruoc = mat.dem(t4, kAB);
    const a1TruocB = mat.dem(t4, kA1);
    const a2TruocB = mat.dem(t4, kA2);
    const bTruoc = mat.dem(t4, kB);

    await mat.lamViec(page);
    const t5 = await docKho(page);
    await chup(page, anh);

    const bGhiVaoKhoA =
      mat.dem(t5, kAB) > abTruoc || mat.dem(t5, kA1) > a1TruocB || mat.dem(t5, kA2) > a2TruocB;
    const bGhiDungKho = mat.dem(t5, kB) > bTruoc;
    const lastUser = await page.evaluate(() => {
      try {
        return localStorage.getItem('interiorflow.lastUserId');
      } catch {
        return null;
      }
    });

    const dat = veDuoc1 && veDuoc2 && duAn1ConNguyen && !bGhiVaoKhoA && bGhiDungKho;
    const bc =
      `A làm ở DA1: ${veDuoc1 ? 'ghi được' : 'KHÔNG'} · A làm ở DA2: ${veDuoc2 ? 'ghi được' : 'KHÔNG'} · ` +
      `DA1 còn nguyên sau khi đổi dự án: ${duAn1ConNguyen ? 'có' : 'KHÔNG'} · ` +
      `B làm vào ĐÚNG kho B: ${bGhiDungKho ? 'có' : 'KHÔNG'} · B ghi nhầm vào kho mang id A: ${bGhiVaoKhoA ? 'CÓ' : 'không'} · ` +
      `lastUserId=${String(lastUser).slice(-6)} (A=${idA.slice(-6)}, B=${idB.slice(-6)})`;

    ghi(
      ma,
      ten,
      dat ? 'PASS' : 'FAIL',
      bc,
      bGhiVaoKhoA
        ? `VI PHẠM BẤT BIẾN #2 ở chặng ${mat.ten}: sau khi đổi người, việc của B ghi thẳng vào kho của A.`
        : 'Không có rò chéo giữa hai người và hai dự án.',
    );
  } catch (e) {
    ghi(ma, ten, 'UNVERIFIED', `không dựng được ca: ${String(e).slice(0, 180)}`);
  } finally {
    await ctx.close();
  }
}

const ca9 = (b) => caDeepLink(b, { ma: 9, maMat: 'present', anh: 'ca9-present-deep-link' });
const ca10 = (b) => caDoiNguoiMat(b, { ma: 10, maMat: 'present', anh: 'ca10-present-doi-nguoi' });
const ca11 = (b) => caDeepLink(b, { ma: 11, maMat: '3d', anh: 'ca11-3d-deep-link' });
const ca12 = (b) => caDoiNguoiMat(b, { ma: 12, maMat: '3d', anh: 'ca12-3d-doi-nguoi' });

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
  console.log(`\n${doDung ? '✅' : '❌'}  HIỆU CHUẨN · thế giới biết-chắc-hỏng (2D · bộ khẳng định CA1)`);
  console.log(`   ${r.bc ?? r.loi}`);
  console.log(
    `   ↳ bộ khẳng định của CA1 chạy trên thế giới hỏng cho kết quả: ${r.dat ? 'XANH (bộ này VÔ GIÁ TRỊ)' : 'ĐỎ (bộ này có hiệu lực)'}`,
  );
  return doDung;
}

/**
 * HIỆU CHUẨN CHO MẶT MỚI — cùng phép thử, khác mặt. Ca thêm vào mà không có đường làm nó ĐỎ thì
 * nó chỉ đang in chữ PASS; luật này áp cho MỌI ca mới, không riêng ba ca gốc.
 */
async function hieuChuanMat(browser, maMat) {
  const mat = MAT[maMat];
  const r = await caDeepLinkMat(browser, maMat, { kieuHong: 'chan-ghi-idb' });
  await r.ctx.close();
  const doDung = r.dat === false;
  console.log(`\n${doDung ? '✅' : '❌'}  HIỆU CHUẨN · thế giới biết-chắc-hỏng (${mat.ten} · chặn ghi IndexedDB)`);
  console.log(`   ${r.bc ?? r.loi}`);
  console.log(
    `   ↳ kết quả: ${r.dat ? 'XANH (ca của mặt này VÔ GIÁ TRỊ)' : 'ĐỎ (ca của mặt này có hiệu lực)'}`,
  );
  return doDung;
}

/* ─────────────────────────── chạy ─────────────────────────── */

const CAC_CA = {
  1: ca1, 2: ca2, 3: ca3, 4: ca4, 5: ca5, 6: ca6, 7: ca7, 8: ca8,
  9: ca9, 10: ca10, 11: ca11, 12: ca12,
};
/** Ca nào thuộc mặt nào — để chỉ hiệu chuẩn đúng mặt sắp chạy, khỏi tốn lượt thừa. */
const MAT_CUA_CA = { 9: 'present', 10: 'present', 11: '3d', 12: '3d' };

const browser = await moTrinhDuyet();
let hcDat = null;
try {
  const ds = co('hieu-chuan') ? [] : CHI_CA ? [Number(CHI_CA)] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // Mặt 2D luôn được hiệu chuẩn (nó canh cả khung chung); mặt khác chỉ khi có ca của nó chạy.
  hcDat = await hieuChuan(browser);
  const matCanHc = [...new Set(ds.map((n) => MAT_CUA_CA[n]).filter(Boolean))];
  for (const m of matCanHc) {
    const ok = await hieuChuanMat(browser, m);
    hcDat = hcDat && ok;
  }
  for (const n of ds) {
    if (CAC_CA[n]) await CAC_CA[n](browser);
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
