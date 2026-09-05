#!/usr/bin/env node
/**
 * scripts/nghiem-thu-g2-hanh-trinh.mjs — BỘ CHẠY HÀNH TRÌNH NGHỀ (cổng G2).
 *
 * ⛔ VÌ SAO TỒN TẠI. `docs/delivery/JOURNEY-MATRIX.md` có 22 hành trình, và ô đáng sợ nhất
 * không phải "14 UNVERIFIED" mà là **cột KẾT QUẢ ĐÃ LƯU gần như trống**: mọi bằng chứng đang
 * có chứng minh *app phản ứng đúng lúc bấm*, chưa mẩu nào chứng minh *việc còn đó sau khi
 * đóng app*. Tệp này đóng đúng mắt đó, và đóng theo LÔ chứ không kiểm tay từng cái.
 *
 * BẤT BIẾN DUY NHẤT, ÁP CHO MỌI HÀNH TRÌNH:
 *
 *     THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI HẲN → VÀO LẠI → CÙNG MỘT SỰ THẬT
 *
 * ⭐ "ĐÓNG HẲN" LÀ ĐÓNG THẬT, KHÔNG PHẢI `reload()`. Với hành trình trình duyệt, bộ này dùng
 * `launchPersistentContext(<hồ sơ trên đĩa>)` — hồ sơ đó ĐÓNG VAI MÁY NGƯỜI DÙNG. Đóng bối
 * cảnh = đóng app; mở lại cùng thư mục hồ sơ = mở lại app. Dùng `browser.newContext()` như
 * bộ G1 thì IndexedDB bị vứt lúc đóng ⇒ phép "mở lại" vô nghĩa ngay từ định nghĩa.
 *
 * ⭐ ĐỌC TỪ NƠI LƯU THẬT, KHÔNG ĐỌC CHỮ TRÊN MÀN: IndexedDB · tệp trên đĩa · CSDL · tệp xuất
 * ra. Màn hình nói "đã lưu" không chứng minh gì.
 *
 * HÌNH DẠNG: mỗi hành trình là **một mục khai báo** trong mảng `HANH_TRINH` — khung chạy sở
 * hữu bất biến, hành trình chỉ khai 6 việc nhỏ (chuẩn bị · mở phiên · thao tác · đọc sự thật ·
 * vào lại · so sánh). Thêm hành trình thứ năm = thêm một mục, KHÔNG sửa khung.
 *
 * ⚠️ TỰ HIỆU CHUẨN. `--hieu-chuan` dựng thế giới BIẾT CHẮC HỎNG (chặn đúng đường ghi của
 * hành trình) rồi đòi chính bộ khẳng định đó phải ĐỎ. Bộ nghiệm thu chưa từng thấy nó đỏ là
 * bộ vô giá trị — 04/09 đã có một máy canh bị mù mà vẫn báo đạt.
 *
 * CÁCH DÙNG
 *   node scripts/nghiem-thu-g2-hanh-trinh.mjs                 # chạy cả lô
 *   node scripts/nghiem-thu-g2-hanh-trinh.mjs --ca=J16        # một hành trình
 *   node scripts/nghiem-thu-g2-hanh-trinh.mjs --hieu-chuan    # chỉ phép hiệu chuẩn
 *
 * ĐIỀU KIỆN: dev server chạy ở --goc (mặc định http://localhost:3061) và trỏ vào ĐÚNG
 * CSDL --db. ⛔ `DATABASE_URL` phải TUYỆT ĐỐI — Prisma nạp `.env` theo đường thật của
 * node_modules, nên worktree dùng symlink sẽ âm thầm ghi vào CSDL repo chính (đã xảy ra thật).
 */

import { createRequire } from 'node:module';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

/* ─────────────────────────── tham số ─────────────────────────── */

const arg = (ten, mac) => {
  const m = process.argv.find((a) => a.startsWith(`--${ten}=`));
  return m ? m.slice(ten.length + 3) : mac;
};
const co = (ten) => process.argv.includes(`--${ten}`);

const GOC = arg('goc', 'http://localhost:3061');
const DB = arg('db', process.env.G2_DB || '');
const THU_MUC_ANH = arg('anh', 'docs/delivery/anh-duyet-mat/g2-hanh-trinh');
const CHI_CA = arg('ca', '');
const HIEU_CHUAN = co('hieu-chuan');
const BO_HIEU_CHUAN = co('bo-hieu-chuan');
const GOC_HO_SO = path.join(os.tmpdir(), 'g2-ho-so');
/** Playwright 1.62 tìm bản chromium theo số hiệu của nó; máy này có bản khác ⇒ chỉ đường thẳng. */
const CHROMIUM = arg('chromium', process.env.G2_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');

const TK = { email: 'g2@kiemthu.local', matKhau: 'kiemthu123' };

/* ─────────────────────── tiện ích dùng chung ─────────────────────── */

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/** Hồ sơ trình duyệt trên đĩa = MÁY của người dùng. Xoá đi là "máy sạch". */
function duongHoSo(ma) {
  return path.join(GOC_HO_SO, ma);
}

/**
 * Mở một phiên trình duyệt trên hồ sơ CÓ SẴN trên đĩa. Lần 1 và lần 2 dùng CÙNG thư mục —
 * đó là điều kiện để câu "đóng app rồi mở lại" có nghĩa.
 */
async function moPhienTrinhDuyet(ma, { chanIdb = false, chanResume = false, canThiep = [] } = {}) {
  const dir = duongHoSo(ma);
  mkdirSync(dir, { recursive: true });
  const opt = {
    args: ['--no-sandbox'],
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  };
  if (CHROMIUM) opt.executablePath = CHROMIUM;
  const ctx = await chromium.launchPersistentContext(dir, opt);
  if (chanIdb) {
    // THẾ GIỚI BIẾT CHẮC HỎNG: ĐỌC vẫn được, GHI thì ném — app vẫn dựng lên bình thường (nếu
    // chặn cả `open` thì editor không mount nổi và bộ ngã vì HẠ TẦNG, tức "đỏ giả": nó sẽ đỏ ở
    // MỌI thế giới, kể cả thế giới lành ⇒ không chứng minh được gì).
    await ctx.addInitScript(`(() => {
      try {
        const goc = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (...a) {
          if (this.transaction?.db?.name === 'interiorflow-sheets') throw new DOMException('QuotaExceededError', 'QuotaExceededError');
          return goc.apply(this, a);
        };
      } catch {}
    })();`);
  }
  if (chanResume) {
    // THẾ GIỚI BIẾT CHẮC HỎNG cho J05: chặn ĐÚNG đường ghi dấu vết việc-đang-dở, không chặn
    // localStorage nói chung — chặn hết thì app không dựng nổi và bộ ngã vì HẠ TẦNG (đỏ giả).
    await ctx.addInitScript(`(() => {
      try {
        const goc = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) {
          if (String(k).startsWith('interiorflow.resume.')) return;
          return goc.call(this, k, v);
        };
      } catch {}
    })();`);
  }
  // CAN THIỆP MẠNG — chỉ dùng để dựng THẾ GIỚI BIẾT CHẮC HỎNG cho phép hiệu chuẩn (J18, J22,
  // J04). Mỗi mục `{ mau, tra }`: `mau` là chuỗi con của URL, `tra` là phản hồi giả. Ở lượt
  // chạy THẬT mảng này LUÔN rỗng — bộ đo không được phép đụng vào mạng của thế giới lành.
  for (const ct of canThiep) {
    await ctx.route(
      (u) => String(u).includes(ct.mau),
      async (route) => {
        if (ct.chiPhuongThuc && route.request().method() !== ct.chiPhuongThuc) return route.continue();
        await route.fulfill({
          status: ct.tra.status,
          contentType: 'application/json',
          body: JSON.stringify(ct.tra.body ?? {}),
        });
      },
    );
  }
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  return { ctx, page, dir };
}

/**
 * ĐỌC BẢN SAO TRÊN MÁY CHỦ — nơi lưu thật THỨ HAI của bản vẽ 2D, khác hẳn IndexedDB.
 * `lib/cad/luu-len-may-chu.ts` ghi một hàng `ProjectFile` tên `ban-ve.sao-luu.idf` (nhịp 30s);
 * đây đọc lại ĐÚNG đường đó và PARSE nội dung ra để đếm thực thể — không tin cái tên, không tin
 * kích thước tệp. Chạy trong page nên cookie phiên đi kèm như người dùng thật.
 */
function docBanSaoMayChu(page, projectId, ten) {
  return page.evaluate(
    async ([pid, tenTep]) => {
      try {
        const ds = await fetch(`/api/project-files?projectId=${encodeURIComponent(pid)}`).then((r) =>
          r.ok ? r.json() : null,
        );
        const files = (ds?.files ?? []).filter((f) => f.name === tenTep);
        if (!files.length) return { co: false, soHang: 0, tenThay: (ds?.files ?? []).map((f) => f.name) };
        files.sort((a, b) => new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime());
        const txt = await fetch(`/api/project-files/${files[0].id}/file`).then((r) => (r.ok ? r.text() : ''));
        if (!txt) return { co: true, soHang: files.length, docDuoc: false };
        const j = JSON.parse(txt);
        const sheets = j?.sheets ?? [];
        const ents = sheets.flatMap((s) => s?.doc?.entities ?? []);
        return {
          co: true,
          soHang: files.length,
          docDuoc: true,
          soThucThe: ents.length,
          dsId: ents.map((e) => String(e?.id ?? '')).filter(Boolean),
          byte: txt.length,
        };
      } catch (e) {
        return { co: false, loi: String(e).slice(0, 120) };
      }
    },
    [projectId, ten],
  );
}

async function dongPhien(phien, { thoBao = false } = {}) {
  if (!phien?.ctx) return;
  if (thoBao) {
    // ĐÓNG ĐỘT NGỘT: giết tiến trình trình duyệt, không cho `beforeunload`/flush chạy —
    // đúng ca "máy tắt ngang / app bị kill" mà J17 hỏi.
    const pr = phien.ctx.browser()?.process?.();
    if (pr) {
      pr.kill('SIGKILL');
      await cho(1500);
      return;
    }
  }
  await phien.ctx.close().catch(() => {});
}

/** Đăng nhập bằng API ngay trong bối cảnh ⇒ cookie phiên nằm trong hồ sơ như người dùng thật. */
async function dangNhap(ctx) {
  const r = await ctx.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: TK.email, password: TK.matKhau },
  });
  if (r.status() !== 200) throw new Error(`đăng nhập thất bại: ${r.status()}`);
  const me = await ctx.request.get(`${GOC}/api/auth/me`);
  const id = (await me.json())?.user?.id;
  if (!id) throw new Error('không lấy được userId');
  return id;
}

/** ĐỌC NƠI LƯU THẬT — mọi bản ghi trong IndexedDB `interiorflow-sheets`, kèm khoá. */
function docKhoSheets(page) {
  return page.evaluate(
    () =>
      new Promise((res) => {
        let xong = false;
        const tra = (v) => { if (!xong) { xong = true; res(v); } };
        setTimeout(() => tra({ loi: 'het-gio', ban: [] }), 8000);
        let rq;
        try { rq = indexedDB.open('interiorflow-sheets'); } catch { return tra({ loi: 'khong-mo-duoc', ban: [] }); }
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
            gv.onsuccess = () =>
              tra({
                ban: gv.result.map((r, i) => ({
                  khoa: String(khoa[i]),
                  ts: r?.ts ?? 0,
                  soThucThe: (r?.sheets?.[0]?.doc?.entities ?? []).length,
                  soSheet: (r?.sheets ?? []).length,
                  // ADDITIVE (lượt 2). J06 cần DANH TÍNH thực thể chứ không chỉ số đếm: "gia phả
                  // không đứt" nghĩa là id của nét vẽ lần trước còn nguyên sau khi sửa tiếp —
                  // số đếm tăng vẫn có thể là "xoá sạch rồi vẽ lại 2 nét", tức đứt gia phả.
                  dsId: (r?.sheets?.[0]?.doc?.entities ?? []).map((e) => String(e?.id ?? '')).filter(Boolean),
                  // Deck của chặng Trình bày ở khoá `/present-editor` mang `deck.slides[].elements[]`
                  // chứ không mang `doc.entities` — J12 đọc số này.
                  soPhanTu: (r?.sheets ?? []).reduce(
                    (t, s) => t + (s?.deck?.slides ?? []).reduce((u, sl) => u + (sl?.elements ?? []).length, 0),
                    0,
                  ),
                  soTrang: (r?.sheets ?? []).reduce((t, s) => t + (s?.deck?.slides ?? []).length, 0),
                })),
              });
          };
        };
      }),
  );
}

/**
 * ĐỌC NƠI LƯU THẬT của DẤU VẾT VIỆC-ĐANG-DỞ — `localStorage['interiorflow.resume.<uid>']`.
 *
 * ⛔ VÌ SAO PHẢI CÓ (D6, `docs/delivery/PRODUCT-DEFECTS.md`). J16 trước nay chỉ đo IndexedDB, nên
 * nó chứng minh được *bản vẽ còn đó* mà KHÔNG chứng minh được *người dùng quay lại được chỗ đó*.
 * Hai thứ khác nhau, và ca deep-link hỏng đúng thứ thứ hai: resume ghi ra
 * `{route:'/cad-editor', sheetId}` **không có `flowId`** ⇒ `buildResumeCard()` tính `routeId=null`
 * ⇒ `resumeHref()` trả route toàn cục cũ ⇒ bấm thẻ tiêu điểm là **dội về `/`**.
 *
 * Trả NGUYÊN VĂN chuỗi đã lưu để bảng lỗi chép được, không diễn giải hộ.
 */
function docResumeKho(page, userId) {
  return page.evaluate((uid) => {
    try {
      const raw = localStorage.getItem('interiorflow.resume.' + uid);
      let j = null;
      try { j = raw ? JSON.parse(raw) : null; } catch { j = null; }
      return { raw, route: j?.route ?? null, flowId: j?.flowId ?? null, sheetId: j?.sheetId ?? null };
    } catch {
      return { raw: null, route: null, flowId: null, sheetId: null, loi: 'localStorage-bi-chan' };
    }
  }, userId);
}

const KHO_MO_HO = ['local', '', 'undefined', 'null', 'anon'];
const laKhoMoHo = (khoa) => KHO_MO_HO.includes(String(khoa).split('::')[0]);

async function boQuaLopChe(page) {
  for (const ten of ['Vẽ ngay', 'Bỏ qua']) {
    try {
      const l = page.getByRole('button', { name: ten, exact: true });
      if (await l.count()) await l.first().click({ timeout: 2500 });
    } catch { /* không có lớp che */ }
  }
  await cho(600);
}

/**
 * QUA CỬA "DỰ ÁN CHƯA CÓ BẢN VẼ" (`components/studio/ProjectScopeEmptyState.tsx`).
 *
 * ✅ 04/09 — ĐÂY LẠI LÀ THAO TÁC THẬT CỦA NGƯỜI DÙNG. Trước đó hàm này phải `reload()` để đi
 * vòng lỗi chặn D-J04b: bấm "Tạo bản vẽ mới" thì máy chủ sinh Flow thật (0 → 1) nhưng màn hình
 * kẹt "Đang tạo…" vô hạn, vì `handleCreate` kết bằng `router.push` tới ĐÚNG URL đang đứng ⇒
 * `useProjectScopeSync` không tính lại `status` ⇒ màn rỗng không bao giờ nhường chỗ.
 * Gốc đã sửa (hook nhận `currentFlowId` làm đầu vào; đường tắt của `ensureProjectScope` đòi có
 * flow thật) ⇒ **cái `reload()` giấu bệnh ĐÃ GỠ**. Nay hàm chỉ bấm rồi ĐỢI canvas hiện ra —
 * nếu bệnh quay lại, các hành trình dùng hàm này sẽ ĐỎ chứ không âm thầm xanh nhờ liều thuốc.
 */
async function quaCuaDuAnRong(page) {
  const tao = page.getByRole('button', { name: /Tạo bản vẽ mới/i });
  if (!(await tao.count().catch(() => 0))) return false;
  await tao.first().click({ timeout: 8000 }).catch(() => {});
  // KHÔNG reload. Màn phải TỰ nhường chỗ — đó chính là điều đang được kiểm.
  // Điều kiện dừng là "màn RỖNG biến mất", KHÔNG phải "có <canvas>": chặng Trình bày không
  // dựng canvas nào, đợi canvas ở đó là đợi một thứ không bao giờ tới (ngã vì hạ tầng, không
  // phải vì khẳng định — đúng thứ khung này cấm).
  await tao.first().waitFor({ state: 'hidden', timeout: 30000 });
  await cho(2500);
  return true;
}

/** Mở mặt vẽ 2D của dự án (tạo bản vẽ nếu dự án còn rỗng) và đợi canvas thật. */
async function moMatVe(page, duAn) {
  await page.goto(`${GOC}/projects/${duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(4000);
  try {
    await quaCuaDuAnRong(page);
  } catch { /* dự án đã có bản vẽ */ }
  await page.waitForSelector('canvas', { timeout: 60000 });
  await cho(3000);
  await boQuaLopChe(page);
}

/**
 * MỞ BOOKMARK ROUTE CŨ (`/cad-editor`) và ĐO CẢ ĐƯỜNG ĐI, không chỉ đích (D7, 04/09).
 *
 * `components/studio/LegacyStageRedirect.tsx` tra "dự án đang hoạt động" rồi `router.replace`.
 * Chỉ đọc URL cuối thì không phân biệt được "đưa thẳng tới việc đang dở" với "dội về Home rồi
 * mới bò về" — với mắt người dùng đó là hai chuyện khác hẳn. `framenavigated` ghi lại từng chặng
 * nên khẳng định `loeHome` đứng trên bằng chứng, không đứng trên ảnh chụp.
 */
async function moBookmark(page, duAn) {
  const chang = [];
  const nghe = (f) => {
    if (f === page.mainFrame()) chang.push({ url: f.url().replace(GOC, ''), t: Date.now() });
  };
  page.on('framenavigated', nghe);
  try {
    await page.goto(`${GOC}/cad-editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(12000);
  } finally {
    page.off('framenavigated', nghe);
  }
  const t0 = chang.length ? chang[0].t : Date.now();
  const duong = chang.map((c) => ({ url: c.url, sau_ms: c.t - t0 }));
  const iDich = duong.findIndex((d) => d.url.startsWith(`/projects/${duAn}/`));
  return {
    dich: page.url().replace(GOC, ''),
    chang: duong,
    // "Loé Home" = có chặng dừng ở Home/`?notice=` TRƯỚC khi tới đích dự án.
    loeHome: iDich > 0 && duong.slice(0, iDich).some((d) => d.url === '/' || d.url.startsWith('/?')),
  };
}

/** VẼ THẬT một đoạn thẳng — đây là "việc thiết kế" mà bất biến bảo vệ. */
async function veMotDuong(page, { doiAutosave = 6000 } = {}) {
  await page.getByRole('button', { name: 'Đường', exact: true }).first().click();
  await cho(600);
  const b = await page.locator('canvas').first().boundingBox();
  const dx = Math.floor(Math.random() * 100);
  await page.mouse.click(b.x + 170 + dx, b.y + 190);
  await cho(350);
  await page.mouse.click(b.x + 430 + dx, b.y + 340);
  await cho(350);
  await page.keyboard.press('Escape');
  await cho(doiAutosave); // autosave debounce ≥1s + vòng ghi IDB
}

async function chup(page, ten) {
  try {
    mkdirSync(THU_MUC_ANH, { recursive: true });
    await page.screenshot({ path: path.join(THU_MUC_ANH, `${ten}.png`), fullPage: false });
  } catch { /* ảnh là bằng chứng phụ, không được làm gãy hành trình */ }
}

/* ══════════════════════════ KHAI BÁO HÀNH TRÌNH ══════════════════════════ */

/**
 * J16 — VÀO THẲNG DEEP-LINK, LÀM VIỆC, RỒI MỞ LẠI.
 * Lỗi P0 duy nhất đang mở (`PRODUCT-DEFECTS.md` D1): trình duyệt chưa từng đi qua Home/đăng
 * nhập thì `interiorflow.lastUserId` rỗng ⇒ bản vẽ không xuống một byte nào, KHÔNG báo lỗi.
 * Bản vá đã có; chưa ai mở app thật nhìn. Đây là lượt nhìn đó.
 */
const J16 = {
  ma: 'J16',
  ten: 'Deep-link studio → vẽ → đóng app → mở lại',
  chan: 'G2 + G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IndexedDB (đường ghi của bản vẽ)',
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J16${mt.hauTo}`, { chanIdb: mt.hongCoY });
    // Cookie phiên nằm sẵn trong hồ sơ từ lần 1; lần 2 chỉ đăng nhập lại nếu hồ sơ mất phiên.
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    // ⭐ ĐI THẲNG vào route studio. KHÔNG ghé Home, KHÔNG qua màn đăng nhập — đúng ca lỗi.
    await moMatVe(p.page, mt.duAn);
    await veMotDuong(p.page);
    await chup(p.page, 'J16-1-sau-khi-ve');
  },
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${mt.duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(7000);
    await boQuaLopChe(p.page);
    await chup(p.page, 'J16-2-vao-lai');
  },
  async ghiXuong(p, mt, st) {
    const kho = await docKhoSheets(p.page);
    const khoaDung = `${st.userId}::/cad-editor::${mt.duAn}`;
    const ban = kho.ban.find((b) => b.khoa === khoaDung) ?? null;
    return {
      khoaDung,
      coBanGhi: !!ban,
      soThucThe: ban?.soThucThe ?? 0,
      moHo: kho.ban.filter((b) => laKhoMoHo(b.khoa)).map((b) => b.khoa),
      moiKhoa: kho.ban.map((b) => b.khoa),
      // `soSanh` chỉ nhận (truoc, sau, st) — không có `mt`. Mang id dự án theo bản đọc thay vì
      // với tay ra biến ngoài phạm vi (đã ngã một lần vì đúng chỗ này).
      duAn: mt.duAn,
      // D6 — dấu vết ĐƯỜNG QUAY LẠI, đọc cùng lượt với dấu vết BẢN VẼ (xem `docResumeKho`).
      resume: await docResumeKho(p.page, st.userId),
    };
  },
  soSanh(truoc, sau, st) {
    if (truoc.moHo.length) return { dat: false, vi: `rơi vào kho mơ hồ: ${truoc.moHo.join(',')}` };
    if (!truoc.coBanGhi || truoc.soThucThe < 1)
      return { dat: false, vi: `sau khi vẽ, IndexedDB KHÔNG có bản ghi ở ${truoc.khoaDung} (khoá thấy: ${truoc.moiKhoa.join('|') || 'không có'})` };
    if (!sau.coBanGhi)
      return { dat: false, vi: `mở lại: bản ghi biến mất khỏi ${sau.khoaDung}` };
    if (sau.soThucThe !== truoc.soThucThe)
      return { dat: false, vi: `số thực thể đổi sau khi mở lại: ${truoc.soThucThe} → ${sau.soThucThe}` };

    /**
     * ⭐ KHẲNG ĐỊNH D6 — VIỆC CÒN ĐÓ CHƯA ĐỦ, PHẢI QUAY LẠI ĐƯỢC.
     * Bản vẽ nằm nguyên trong IndexedDB mà resume mất `flowId` thì thẻ tiêu điểm ở Home dội
     * người dùng về `/`: việc vẫn còn, nhưng không có đường nào đi tới nó bằng một cú bấm.
     *
     * 🔴 KHẲNG ĐỊNH TRÊN `truoc` TRƯỚC, VÀ ĐÓ MỚI LÀ CHỖ ĐAU. `truoc` là LƯỢT VÀO ĐẦU TIÊN sau
     * khi đăng nhập — đúng lúc cuộc đua xảy ra (`interiorflow.lastUserId` chưa gieo). `sau` là
     * phiên thứ hai trên CÙNG hồ sơ đĩa, nên `lastUserId` đã ấm sẵn từ phiên trước và ca hỏng
     * KHÔNG tái diễn ở đó. Đo bản vá chỉ bằng `sau` là đo một thế giới đã hết bệnh: bộ này đã
     * báo PASS đúng như vậy một lần trước khi khẳng định được đặt đúng chỗ.
     */
    const kiem = (r, khi) => {
      if (!r?.raw)
        return `${khi}: bản vẽ còn ${sau.soThucThe} thực thể, NHƯNG không có dấu vết việc-đang-dở nào (interiorflow.resume.${st.userId} rỗng) ⇒ thẻ tiêu điểm ở Home không hiện`;
      if (!r.flowId)
        return `${khi}: resume ghi ra THIẾU flowId: ${r.raw} ⇒ buildResumeCard() tính routeId=null ⇒ bấm thẻ tiêu điểm dội về '/'`;
      if (r.flowId !== sau.duAn)
        return `${khi}: resume trỏ SAI dự án: flowId=${r.flowId} nhưng đang đứng ở ${sau.duAn}`;
      return null;
    };
    const loiTruoc = kiem(truoc.resume, 'LƯỢT VÀO ĐẦU TIÊN sau đăng nhập');
    if (loiTruoc) return { dat: false, vi: loiTruoc };
    const loiSau = kiem(sau.resume, 'sau khi đóng hẳn rồi mở lại');
    if (loiSau) return { dat: false, vi: loiSau };

    return {
      dat: true,
      vi: `${sau.soThucThe} thực thể còn nguyên ở ${sau.khoaDung} sau khi ĐÓNG HẲN trình duyệt và mở lại; đường quay lại còn đủ NGAY TỪ LƯỢT ĐẦU (resume ${truoc.resume.route} → flowId ${truoc.resume.flowId})`,
    };
  },
};

/**
 * J16b — DEEP-LINK: ĐƯỜNG QUAY LẠI CÓ ĐỦ KHÔNG (tách riêng khỏi J16, có lý do).
 *
 * ⛔ VÌ SAO KHÔNG GỘP VÀO J16. J16 khai thế giới hỏng là *chặn IndexedDB*; ở thế giới đó bản
 * ghi bản vẽ mất nên khẳng định IDB đỏ TRƯỚC, và khẳng định `flowId` **không bao giờ chạy tới**
 * ⇒ phép hiệu chuẩn của J16 chứng minh được khẳng định IDB, **KHÔNG** chứng minh được khẳng định
 * đường-quay-lại. Một khẳng định chưa từng thấy mình đỏ là một khẳng định chưa đáng tin.
 * Nên nó cần THẾ GIỚI HỎNG RIÊNG: chặn đúng đường ghi `interiorflow.resume.*` (`chanResume`,
 * cơ chế đã có sẵn cho J05) — chặn hẹp, app vẫn dựng lên bình thường, đỏ vì khẳng định.
 *
 * Thêm một mục vào `HANH_TRINH`, KHÔNG sửa khung — đúng cách bộ này khai bản thân nó.
 *
 * KHÔNG VẼ. Chủ ý: đường ghi resume chạy ngay lúc vào route (`ResumeTracker`), không phụ thuộc
 * người dùng có thao tác gì. Bỏ bước vẽ làm hành trình này nhanh và cô lập đúng thứ nó đo — nếu
 * nó đỏ thì chắc chắn là chuyện resume, không lẫn với chuyện lưu bản vẽ.
 */
const J16b = {
  ma: 'J16b',
  ten: 'Deep-link studio → về Home → thẻ tiêu điểm còn trỏ đúng dự án',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn đường ghi interiorflow.resume.* (dấu vết việc-đang-dở)',
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J16b${mt.hauTo}`, { chanResume: mt.hongCoY });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    // ⭐ ĐI THẲNG vào route studio rồi VỀ HOME — đúng đường người dùng đi trước khi bấm thẻ.
    await p.page.goto(`${GOC}/projects/${mt.duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(5000);
    await chup(p.page, 'J16b-1-ve-home');
  },
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(5000);
    await chup(p.page, 'J16b-2-mo-lai');
  },
  async ghiXuong(p, mt, st) {
    return { duAn: mt.duAn, resume: await docResumeKho(p.page, st.userId) };
  },
  soSanh(truoc, sau, st) {
    const kiem = (r, khi) => {
      if (!r?.raw) return `${khi}: không có dấu vết việc-đang-dở (interiorflow.resume.${st.userId} rỗng) ⇒ thẻ tiêu điểm không hiện`;
      if (!r.flowId) return `${khi}: resume THIẾU flowId: ${r.raw} ⇒ bấm thẻ tiêu điểm dội về '/'`;
      if (r.flowId !== sau.duAn) return `${khi}: resume trỏ SAI dự án: ${r.flowId} ≠ ${sau.duAn}`;
      return null;
    };
    const loiTruoc = kiem(truoc.resume, 'LƯỢT VÀO ĐẦU TIÊN sau đăng nhập');
    if (loiTruoc) return { dat: false, vi: loiTruoc };
    const loiSau = kiem(sau.resume, 'sau khi đóng hẳn rồi mở lại');
    if (loiSau) return { dat: false, vi: loiSau };
    return {
      dat: true,
      vi: `vào thẳng deep-link, chưa thao tác gì, đường quay lại đã đủ: ${truoc.resume.route} → flowId ${truoc.resume.flowId}; còn nguyên sau khi ĐÓNG HẲN trình duyệt`,
    };
  },
};

/**
 * J23 — BOOKMARK ROUTE CŨ: mở `/cad-editor` thẳng, phải về ĐÚNG dự án đang dở (D7, đường ĐỌC).
 *
 * ⛔ VÌ SAO TÁCH KHỎI J16b, dù nghe rất giống. J16b hỏi **đường GHI**: dấu vết việc-đang-dở có
 * được ghi đủ `flowId` không. J23 hỏi **đường ĐỌC**: có ai chịu ĐỌC dấu vết ấy rồi đưa người
 * dùng tới đúng chỗ không. Hai câu độc lập — D7 là ca resume ĐÃ ĐỦ trên đĩa mà cầu chuyển hướng
 * vẫn dội về Home, tức J16b XANH trong khi người dùng vẫn không vào được việc của mình.
 *
 * ⭐ ĐO CẢ ĐƯỜNG ĐI, KHÔNG CHỈ ĐÍCH. "Về đúng chỗ" và "về đúng chỗ SAU KHI đã nháy qua Home" là
 * hai trải nghiệm khác nhau; chỉ đọc URL cuối thì không phân biệt được. `framenavigated` ghi
 * lại từng chặng ⇒ khẳng định `loeHome` có bằng chứng, không phải cảm nhận từ ảnh chụp.
 *
 * THẾ GIỚI HỎNG = `chanResume` (chặn đường ghi `interiorflow.resume.*`). Chọn cái này vì nó làm
 * ĐỎ ĐÚNG KHẲNG ĐỊNH NÀY mà KHÔNG chặn đường khẳng định phải đi qua: cầu chuyển hướng vẫn chạy,
 * vẫn quyết định, chỉ là không còn dấu vết nào để quyết đúng ⇒ nó về Home và khẳng định bắt được.
 * (Bài học J16: hiệu chuẩn chặn mất đường mà khẳng định cần đi qua thì khẳng định không bao giờ
 * chạy tới, và phép hiệu chuẩn đó không chứng minh gì.)
 *
 * ⚠️ KHẲNG ĐỊNH ĐẶT TRÊN `truoc` — LƯỢT VÀO ĐẦU TIÊN. `sau` chạy trên CÙNG hồ sơ đĩa nên bộ đệm
 * định danh đã ấm; ca hỏng của họ bệnh này KHÔNG tái diễn ở lượt thứ hai. Đúng cái bẫy J16/J16b
 * đã dính một lần.
 */
const J23 = {
  ma: 'J23',
  ten: 'Bookmark /cad-editor → vào thẳng việc đang dở, không dội về Home',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn đường ghi interiorflow.resume.* ⇒ không còn dấu vết để cầu chuyển hướng đọc',
  async chuanBi(mt) {
    return { duAn: await duAnRieng(mt, 'J23') };
  },
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J23${mt.hauTo}`, { chanResume: mt.hongCoY });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  /** Lượt 1: vào thẳng studio (gieo dấu vết), rồi mở BOOKMARK route cũ ngay trong phiên đó. */
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${st.duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(7000);
    await boQuaLopChe(p.page);
    st.diChuyen = await moBookmark(p.page, st.duAn);
    await chup(p.page, 'J23-1-bookmark-luot-dau');
  },
  /**
   * Lượt 2: máy đã tắt hẳn rồi mở lại — và ở đây dựng ĐÚNG trạng thái của D7.
   *
   * 🔴 VÌ SAO PHẢI DỰNG, KHÔNG ĐỢI NÓ TỰ XẢY RA. Hồ sơ đĩa mang sẵn `interiorflow.lastUserId` từ
   * lượt 1 ⇒ bộ đệm định danh ĐÃ ẤM ⇒ đường đọc đồng bộ vẫn tra ra dự án ⇒ hành trình này XANH
   * ngay cả khi bệnh D7 còn nguyên. Đó đúng cái bẫy "thế giới đã ấm" mà J16/J16b đã dính một lần.
   *
   * Trạng thái dựng ở đây là TRẠNG THÁI NGƯỜI DÙNG HỢP LỆ, không phải lỗi bơm vào: **phiên máy
   * chủ còn hiệu lực (cookie trong hồ sơ) nhưng bộ đệm định danh trong localStorage trống, trong
   * khi dấu vết `interiorflow.resume.<uid>` vẫn còn.** Nó sinh ra thật ở ít nhất hai đường:
   *   · `quenDangXuat()` (4 nơi bấm Đăng xuất) xoá `lastUserId` mà **cố ý giữ** `resume.<uid>`;
   *     phiên máy chủ chưa kịp/không kịp bị huỷ (mạng đứt giữa chừng, đóng tab ngay lúc đó).
   *   · người dùng xoá dữ liệu trang theo mục (Chrome cho xoá "site data" tách khỏi cookie).
   * Trong cả hai, người dùng ĐANG đăng nhập và việc đang dở vẫn còn — dội họ về Home là sai.
   *
   * Cần một lượt tải trang cùng gốc thì mới chạm được localStorage; dùng `/api/auth/me` vì nó
   * KHÔNG chạy JS của app ⇒ không vô tình gieo lại đúng thứ vừa xoá.
   */
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/api/auth/me`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    st.demTruocKhiVao = await p.page.evaluate(() => {
      try {
        const v = localStorage.getItem('interiorflow.lastUserId');
        localStorage.removeItem('interiorflow.lastUserId');
        return v;
      } catch {
        return null;
      }
    });
    st.diChuyen = await moBookmark(p.page, st.duAn);
    await chup(p.page, 'J23-2-bookmark-dinh-danh-nguoi');
  },
  async ghiXuong(p, mt, st) {
    return {
      duAn: st.duAn,
      diChuyen: st.diChuyen,
      resume: await docResumeKho(p.page, st.userId),
    };
  },
  soSanh(truoc, sau, st) {
    const kiem = (r, khi) => {
      const d = r.diChuyen;
      if (!d) return `${khi}: không đo được đường đi`;
      if (!d.dich.startsWith(`/projects/${r.duAn}/`))
        return `${khi}: bookmark /cad-editor dội về "${d.dich}" thay vì /projects/${r.duAn}/cad — dấu vết trên đĩa lúc đó: ${r.resume?.raw ?? 'RỖNG'}`;
      if (d.loeHome)
        return `${khi}: về đúng dự án NHƯNG loé qua Home dọc đường (${d.chang.map((c) => c.url).join(' → ')})`;
      return null;
    };
    // `truoc` = bộ đệm định danh ẤM (vừa đi qua route studio) — đường bookmark thông thường.
    const loiTruoc = kiem(truoc, 'bookmark ngay trong phiên (bộ đệm định danh ẤM)');
    if (loiTruoc) return { dat: false, vi: loiTruoc };
    // `sau` = ĐÓNG HẲN + bộ đệm định danh NGUỘI, phiên máy chủ vẫn hợp lệ — đúng trạng thái D7.
    const loiSau = kiem(sau, 'đóng hẳn rồi mở lại, bộ đệm định danh NGUỘI (đúng ca D7)');
    if (loiSau) return { dat: false, vi: loiSau };
    return {
      dat: true,
      vi: `bookmark /cad-editor về thẳng ${sau.diChuyen.dich} (không loé Home) ở CẢ hai ca: bộ đệm định danh ẤM, và NGUỘI sau khi đóng hẳn (đệm đã xoá: ${st.demTruocKhiVao ?? 'vốn đã rỗng'})`,
    };
  },
};

/**
 * J17 — ĐANG LÀM VIỆC THÌ APP TẮT NGANG (không bấm lưu, không đóng tử tế).
 * Khác J16 ở đúng một chỗ, và chỗ đó là chỗ đau: bối cảnh bị **SIGKILL**, nên `beforeunload`
 * và `saver.flush()` KHÔNG chạy. Chỉ nhịp autosave đã kịp ghi mới sống sót.
 */
const J17 = {
  ma: 'J17',
  ten: 'Đang vẽ → app bị tắt ngang (SIGKILL) → mở lại',
  chan: 'G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IndexedDB — nhịp autosave không còn chỗ ghi',
  moPhien: J16.moPhien,
  async thaoTac(p, mt, st) {
    await moMatVe(p.page, mt.duAn);
    await veMotDuong(p.page, { doiAutosave: 6000 });
    st.truocKhiGiet = await J16.ghiXuong(p, mt, st);
    // vẽ thêm một nét NỮA rồi giết ngay — đo đúng "nhịp cuối có kịp không".
    await veMotDuong(p.page, { doiAutosave: 2500 });
    await chup(p.page, 'J17-1-truoc-khi-tat-ngang');
  },
  async dong(p) { await dongPhien(p, { thoBao: true }); },
  vaoLai: J16.vaoLai,
  ghiXuong: J16.ghiXuong,
  soSanh(truoc, sau, st) {
    const neo = st.truocKhiGiet?.soThucThe ?? 0;
    if (!sau.coBanGhi)
      return { dat: false, vi: `tắt ngang xong mở lại: MẤT TRẮNG — không có bản ghi ở ${sau.khoaDung}` };
    if (sau.soThucThe < neo)
      return { dat: false, vi: `mất việc đã autosave: trước khi giết có ${neo} thực thể, mở lại còn ${sau.soThucThe}` };
    return {
      dat: true,
      vi: `bị SIGKILL giữa lúc vẽ: nhịp autosave giữ được ${sau.soThucThe} thực thể (neo an toàn ${neo}, trên màn lúc chết là ${truoc.soThucThe})`,
    };
  },
};

/**
 * J19 — NÂNG CẤP TRÊN MÁY ĐÃ CÓ DỮ LIỆU.
 * Hành trình DUY NHẤT có thể phá dữ liệu thật và KHÔNG sửa được sau khi phát hành. Bản đóng
 * gói nâng schema bằng `db push` (không lịch sử, không đường lùi), nên tấm lưới duy nhất là
 * snapshot trước khi Prisma chạm vào dữ liệu (`electron/main.js` §snapshotBeforeUpgrade), và
 * cơ chế đó phải CHẶN KHỞI ĐỘNG nếu snapshot thất bại.
 *
 * ⚠️ KHAI THẬT PHẠM VI: bộ này KHÔNG chạy Electron đóng gói (việc của G5/lane 07). Nó lấy
 * ĐÚNG THÂN HÀM đang ship trong `electron/main.js` — trích bằng dấu mốc rồi thi hành với `fs`
 * thật + một `app.getVersion()` giả — nên thứ được kiểm là mã sản phẩm, không phải bản chép.
 * Nếu không trích được thì hành trình FAIL to, KHÔNG âm thầm bỏ qua.
 */
const J19 = {
  ma: 'J19',
  ten: 'Máy đã có dữ liệu → cài đè bản mới → dữ liệu còn nguyên + có bản sao lùi',
  chan: 'G5',
  loai: 'dia',
  hieuChuanMo: 'chặn thư mục backups (đường sao lưu trước nâng cấp)',
  async chuanBi(mt) {
    const goc = path.join(os.tmpdir(), `g2-nang-cap${mt.hauTo}`);
    rmSync(goc, { recursive: true, force: true });
    mkdirSync(path.join(goc, 'uploads'), { recursive: true });
    const dbDich = path.join(goc, 'dev.db');
    copyFileSync(mt.duongDb, dbDich); // "máy đã có dữ liệu" — CSDL thật, có hàng thật
    writeFileSync(path.join(goc, 'uploads', 'anh-cua-khach.txt'), 'tệp người dùng đã tải lên\n');
    writeFileSync(
      path.join(goc, '.interiorflow-release-state.json'),
      JSON.stringify({ lastStartedVersion: '0.0.9', updatedAt: new Date().toISOString() }) + '\n',
    );
    return { goc, dbDich, phienBanMoi: '0.1.0' };
  },
  moPhien(mt, st) { return { dia: true }; },
  async thaoTac(_p, mt, st) {
    const chup = layHamSnapshot();
    st.trichDuoc = chup.trichDuoc;
    st.loiTrich = chup.loi;
    if (!chup.ham) return;
    st.soTruoc = await demHang(st.dbDich);
    if (mt.hongCoY) {
      // THẾ GIỚI BIẾT CHẮC HỎNG: `backups` là TỆP chứ không phải thư mục ⇒ mkdir ném.
      writeFileSync(path.join(st.goc, 'backups'), 'chan-duong-sao-luu');
    }
    try {
      chup.ham(st.goc, st.dbDich, st.phienBanMoi);
      st.nemLoi = null;
    } catch (e) {
      st.nemLoi = String(e.message || e);
    }
  },
  async vaoLai(_p, mt, st) { /* "mở lại" ở đây là đọc lại đĩa — không có màn hình nào */ },
  async ghiXuong(_p, mt, st) {
    const thuMucSao = path.join(st.goc, 'backups');
    let ban = [];
    try {
      ban = require('node:fs').readdirSync(thuMucSao).filter((d) => d.startsWith('20'));
    } catch { /* chưa có thư mục sao lưu */ }
    const dir = ban.length ? path.join(thuMucSao, ban[0]) : null;
    return {
      trichDuoc: st.trichDuoc,
      loiTrich: st.loiTrich,
      nemLoi: st.nemLoi,
      tenBanSao: ban[0] ?? null,
      dbSao: dir && existsSync(path.join(dir, 'dev.db')) ? path.join(dir, 'dev.db') : null,
      uploadsSao: dir ? existsSync(path.join(dir, 'uploads', 'anh-cua-khach.txt')) : false,
      soTruoc: st.soTruoc,
      soSau: await demHang(st.dbDich),
      soTrongBanSao: dir && existsSync(path.join(dir, 'dev.db')) ? await demHang(path.join(dir, 'dev.db')) : null,
    };
  },
  soSanh(truoc, sau, st) {
    if (!sau.trichDuoc)
      return { dat: false, vi: `không trích được snapshotBeforeUpgrade từ electron/main.js (${sau.loiTrich}) — hành trình không kiểm được, KHÔNG coi là đạt` };
    if (sau.nemLoi)
      return { dat: false, vi: `nâng cấp bị chặn: ${sau.nemLoi}` };
    if (!sau.tenBanSao || !sau.dbSao)
      return { dat: false, vi: 'không sinh được bản sao trước nâng cấp — dữ liệu người dùng đi vào đường một chiều' };
    if (!/^\d{4}-.*-before-0\.0\.9$/.test(sau.tenBanSao))
      return { dat: false, vi: `tên bản sao không mang mốc phiên bản cũ: ${sau.tenBanSao}` };
    if (!sau.uploadsSao)
      return { dat: false, vi: 'bản sao thiếu thư mục uploads — tệp người dùng tải lên không được bảo vệ' };
    if (JSON.stringify(sau.soTrongBanSao) !== JSON.stringify(sau.soTruoc))
      return { dat: false, vi: `bản sao KHÔNG khớp dữ liệu gốc: ${JSON.stringify(sau.soTruoc)} ≠ ${JSON.stringify(sau.soTrongBanSao)}` };
    if (JSON.stringify(sau.soSau) !== JSON.stringify(sau.soTruoc))
      return { dat: false, vi: `dữ liệu gốc bị đụng trong lúc nâng cấp: ${JSON.stringify(sau.soTruoc)} → ${JSON.stringify(sau.soSau)}` };
    return {
      dat: true,
      vi: `bản sao ${sau.tenBanSao} đọc lại bằng SQL thật: ${JSON.stringify(sau.soTrongBanSao)} — khớp gốc, kèm uploads`,
    };
  },
};

/**
 * TRÍCH ĐÚNG THÂN HÀM ĐANG SHIP. Không chép lại — chép lại là tự kiểm bản chép của mình.
 * `app.getVersion()` là thứ duy nhất bị thay (bằng tham số), vì nó là API Electron.
 */
function layHamSnapshot() {
  try {
    const nguon = readFileSync('electron/main.js', 'utf8');
    const dau = nguon.indexOf('function snapshotBeforeUpgrade(');
    if (dau < 0) return { trichDuoc: false, loi: 'không thấy khai báo hàm', ham: null };
    const ketThuc = nguon.indexOf('\n}\n', dau);
    if (ketThuc < 0) return { trichDuoc: false, loi: 'không thấy chỗ đóng hàm', ham: null };
    let than = nguon.slice(dau, ketThuc + 3);
    if (!than.includes('backups') || !than.includes('lastStartedVersion'))
      return { trichDuoc: false, loi: 'thân hàm không mang dấu hiệu mong đợi', ham: null };
    // Chỉ thay lời gọi Electron; mọi dòng khác giữ nguyên văn.
    than = than.replace(/function snapshotBeforeUpgrade\(userDataDir, dbPath\)/, 'function snapshotBeforeUpgrade(userDataDir, dbPath, __phienBan)');
    than = than.replace(/app\.getVersion\(\)/g, '__phienBan');
    const phu = `
      function releaseStatePath(d) { return path.join(d, '.interiorflow-release-state.json'); }
      function readReleaseState(d) { try { return JSON.parse(fs.readFileSync(releaseStatePath(d), 'utf8')); } catch { return {}; } }
    `;
    const ham = new Function('fs', 'path', `${phu}\n${than}\nreturn snapshotBeforeUpgrade;`)(require('node:fs'), path);
    return { trichDuoc: true, loi: null, ham };
  } catch (e) {
    return { trichDuoc: false, loi: String(e.message || e), ham: null };
  }
}

/** Đếm hàng bằng SQL thật trên tệp SQLite — đọc nơi lưu thật, không tin kích thước tệp. */
async function demHang(duongDb) {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient({ datasources: { db: { url: `file:${duongDb}` } } });
  try {
    return {
      user: await p.user.count(),
      project: await p.project.count(),
      flow: await p.flow.count(),
      projectMember: await p.projectMember.count(),
    };
  } finally {
    await p.$disconnect();
  }
}

/**
 * J20 — XUẤT PDF RỒI MỞ TỆP RA SOI.
 * LUẬT nghiệm thu chốt 11/08: hành trình nào sinh tệp thì nghiệm thu = **mở tệp đầu ra soi
 * theo `docs/CHUAN-DAU-RA-NGHE.md`**; `tsc`/test/ảnh chụp KHÔNG đủ. "Vào lại" ở đây là mở
 * chính tệp đã nằm trên đĩa bằng một trình đọc PDF khác — tệp phải đứng được một mình, không
 * cần app sinh ra nó.
 */
const J20 = {
  ma: 'J20',
  ten: 'Trình bày có nội dung → xuất PDF → mở tệp ra soi',
  chan: 'G5',
  loai: 'trinh-duyet',
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J20${mt.hauTo}`);
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    return p;
  },
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${mt.duAn}/present`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    st.buocUi = await dungNoiDungTrinhBay(p.page);
    await chup(p.page, 'J20-1-truoc-khi-xuat');
    mkdirSync(THU_MUC_ANH, { recursive: true });
    const nut = p.page.locator('button[title="Xuất file từ chặng Trình chiếu"]');
    await nut.first().click({ timeout: 20000 });
    await cho(700);
    const [tai] = await Promise.all([
      p.page.waitForEvent('download', { timeout: 120000 }),
      p.page.getByRole('menuitem', { name: /^PDF$/ }).first().click({ timeout: 15000 })
        .catch(() => p.page.locator('[role="menu"] >> text=/^PDF$/').first().click({ timeout: 15000 })),
    ]);
    st.duongPdf = path.join(THU_MUC_ANH, 'J20-deck-xuat.pdf');
    await tai.saveAs(st.duongPdf);
    await cho(1500);
    await chup(p.page, 'J20-2-sau-khi-xuat');
  },
  async vaoLai(_p, mt, st) { /* tệp trên đĩa không cần app để mở lại — đó là điểm của J20 */ },
  async ghiXuong(_p, mt, st) {
    if (!st.duongPdf || !existsSync(st.duongPdf)) return { coTep: false };
    return { coTep: true, ...(await soiPdf(st.duongPdf)) };
  },
  soSanh(truoc, sau, st) {
    if (!sau.coTep) return { dat: false, vi: 'không có tệp PDF nào trên đĩa sau khi bấm xuất' };
    const loi = [];
    if (!sau.hopLe) loi.push('tệp không mở được bằng trình đọc PDF độc lập');
    if (sau.soTrang < 1) loi.push('0 trang');
    if (sau.kichThuoc < 2000) loi.push(`tệp quá nhỏ (${sau.kichThuoc} byte) — nghi ngờ trang trắng`);
    if (!sau.coMuc) loi.push(`TRANG KHÔNG CÓ NỘI DUNG: ${sau.viMuc}`);
    if (loi.length) return { dat: false, vi: loi.join(' · ') };
    return {
      dat: true,
      vi: `tệp ${path.basename(st.duongPdf)} (${(sau.kichThuoc / 1024).toFixed(0)} KB) mở được độc lập: ${sau.soTrang} trang, khổ ${sau.khoTrang}, ${sau.soAnh} ảnh nhúng, ${sau.viMuc}; chữ trích được ${sau.soKyTuChu} ký tự (0 = trang raster, chữ KHÔNG chọn/tìm được)`,
    };
  },
};

/**
 * Dựng một deck CÓ NỘI DUNG THẬT. ⚠️ Lượt đầu (04/09) bước này chỉ bấm qua màn chọn rồi xuất
 * luôn ⇒ ra **một trang trắng tinh**, và bộ khẳng định lúc đó vẫn cho PASS. Nội dung thật là
 * ĐIỀU KIỆN của hành trình, không phải chi tiết phụ.
 */
async function dungNoiDungTrinhBay(page) {
  const buoc = [];
  const bam = async (ten) => {
    try {
      const n = page.getByRole('button', { name: ten });
      if (await n.count()) { await n.first().click({ timeout: 6000 }); buoc.push(String(ten)); await cho(2500); return true; }
    } catch { /* nút không có ở màn này */ }
    return false;
  };
  // ① thoát màn chọn lối vào (nếu có) — "Trang trống · Tự dàn từ đầu"
  await bam(/Trang trống/i) || (await bam(/Tạo hồ sơ trống/i));
  // ② đặt một khối CHỮ thật lên trang
  if (await bam(/^Chữ$/)) {
    await cho(1200);
    await page.keyboard.type('NGHIỆM THU G2 · HÀNH TRÌNH J20');
    await cho(800);
    await page.keyboard.press('Escape');
    await cho(1200);
  }
  // ③ và một khối HÌNH — để trang có mảng đặc, không chỉ nét chữ mảnh
  await bam(/^Hình$/);
  await cho(2500);
  return buoc;
}

/**
 * MỞ TỆP RA SOI bằng trình đọc PDF độc lập (unpdf) — không hỏi lại app đã sinh ra nó.
 *
 * ⛔ BÀI HỌC 04/09, ĐỪNG GỠ: bản đầu chỉ kiểm *mở được · có trang · đủ byte* ⇒ nó cho **một
 * trang TRẮNG TINH** đi qua với chữ PASS. Chỉ khi carve ảnh nhúng ra rồi NHÌN mới lộ. Nên nay
 * bộ soi phải ĐO MỰC: mọi điểm ảnh đúng 255 nghĩa là trang trắng, dù tệp 16 KB và "hợp lệ".
 */
async function soiPdf(duong) {
  const kichThuoc = statSync(duong).size;
  try {
    const { getDocumentProxy, extractText } = await import('unpdf');
    const bytes = new Uint8Array(readFileSync(duong));
    const pdf = await getDocumentProxy(bytes);
    const trang1 = await pdf.getPage(1);
    const vp = trang1.getViewport({ scale: 1 });
    const { text } = await extractText(pdf, { mergePages: true });
    const ops = await trang1.getOperatorList();
    const soAnh = ops.fnArray.filter((f) => f === 85 || f === 86 || f === 87).length;
    return {
      hopLe: true,
      soTrang: pdf.numPages,
      khoTrang: `${Math.round(vp.width)}×${Math.round(vp.height)}pt`,
      soKyTuChu: String(text ?? '').trim().length,
      mauChu: String(text ?? '').trim().slice(0, 120),
      soAnh,
      kichThuoc,
      ...(await doMuc(duong)),
    };
  } catch (e) {
    return { hopLe: false, soTrang: 0, khoTrang: '?', soKyTuChu: 0, soAnh: 0, kichThuoc, loi: String(e.message || e) };
  }
}

/** Bóc ảnh nhúng của trang 1 rồi ĐO MỰC. Trang trắng ⇒ mọi kênh min=max=255. */
async function doMuc(duong) {
  try {
    const buf = readFileSync(duong);
    const d = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
    const c = buf.indexOf(Buffer.from([0xff, 0xd9]), d + 3);
    if (d < 0 || c < 0) return { coMuc: false, viMuc: 'không tìm thấy ảnh nhúng nào trong trang' };
    // ⚠️ GHI RA .png CHỨ KHÔNG .jpg — `.gitignore:75` chặn `docs/**/*.jpg`, chỉ mở ngoại lệ cho
    // `docs/delivery/anh-duyet-mat/**/*.png` (`:96`). Bằng chứng nằm trong thư mục bị bỏ qua thì
    // coi như không có: 04/09 đã mất một lô ảnh đúng vì chuyện này. Byte gốc vẫn truy được từ
    // chính tệp PDF (đã commit) — đây chỉ là bản NHÌN ĐƯỢC của cùng khối ảnh đó.
    const sharp = require('sharp');
    const goc = buf.subarray(d, c + 2);
    const anh = path.join(THU_MUC_ANH, 'J20-trang-1.png');
    await sharp(goc).png().toFile(anh);
    const st = await sharp(goc).stats();
    const trang = st.channels.every((k) => k.min === 255 && k.max === 255);
    return {
      coMuc: !trang,
      anhTrang1: anh,
      doSang: st.channels.map((k) => +k.mean.toFixed(1)).join('/'),
      viMuc: trang ? 'MỌI điểm ảnh đúng 255 — trang TRẮNG TINH' : `có mực, độ sáng trung bình ${st.channels.map((k) => Math.round(k.mean)).join('/')}`,
    };
  } catch (e) {
    return { coMuc: false, viMuc: `không đo được mực: ${String(e.message || e)}` };
  }
}

/* ═══════════════ LƯỢT 2 — SÁU HÀNH TRÌNH THÊM (J07 J12 J04 J06 J18 J22) ═══════════════ */

/**
 * MỖI HÀNH TRÌNH MỘT DỰ ÁN RIÊNG. Bắt buộc, không phải cho gọn: `CadSheets.tsx:458` có LƯỚI ĐỠ
 * CUỐI — hồ sơ mới + IndexedDB rỗng thì tự khôi phục bản vẽ TỪ MÁY CHỦ. Dùng chung một dự án là
 * hành trình sau nhặt được nét của hành trình trước rồi báo PASS nhầm.
 */
async function duAnRieng(mt, ma) {
  const { PrismaClient } = require('@prisma/client');
  const pr = new PrismaClient({ datasources: { db: { url: `file:${mt.duongDb}` } } });
  try {
    const ten = `G2 ${ma}${mt.hauTo}`;
    let da = await pr.project.findFirst({ where: { userId: mt.userId, name: ten } });
    if (!da) da = await pr.project.create({ data: { userId: mt.userId, name: ten } });
    await pr.projectMember.upsert({
      where: { projectId_userId: { projectId: da.id, userId: mt.userId } },
      update: { role: 'owner' },
      create: { projectId: da.id, userId: mt.userId, role: 'owner' },
    });
    return da.id;
  } finally {
    await pr.$disconnect();
  }
}

/** Mở phiên CAD chuẩn: hồ sơ trên đĩa + đảm bảo có phiên đăng nhập. Dùng chung cho J07/J06. */
function moPhienChuan(ma) {
  return async function (mt, st, lan) {
    const p = await moPhienTrinhDuyet(`${ma}${mt.hauTo}`, { chanIdb: mt.hongCoY, canThiep: st.canThiep ?? [] });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  };
}

/**
 * J07 — VẼ 2D → LƯU → **MÁY KHÁC/MÁY SẠCH** MỞ LẠI VẪN THẤY NÉT.
 *
 * ⭐ KHÁC J16 Ở ĐIỂM CỐT TỬ, và đây là lý do nó đáng chạy dù nghe giống: J16 mở lại **cùng hồ
 * sơ** ⇒ nó chứng minh IndexedDB sống sót. Cột KẾT QUẢ ĐÃ LƯU của J07 trong ma trận lại ghi
 * **`Flow` version**, tức sự thật ở PHÍA MÁY CHỦ. Đo tại nguồn thì bản vẽ KHÔNG đi qua
 * `/api/flows` (grep `api/flows` trong `components/cad/` + `lib/cad/` = 0) mà đi qua
 * `lib/cad/luu-len-may-chu.ts` → `POST /api/project-files`, tên `ban-ve.sao-luu.idf`, nhịp 30s.
 * ⇒ J07 ở đây **XOÁ SẠCH HỒ SƠ** giữa hai phiên (máy mới tinh, IndexedDB rỗng) rồi đòi nét
 * phải quay lại — chỉ có đúng một đường làm được việc đó: lưới đỡ máy chủ ở `CadSheets.tsx:458`.
 * Sự thật được đọc ở HAI nơi độc lập: hàng `ProjectFile` parse ra được, và IndexedDB sau khôi phục.
 */
const J07 = {
  ma: 'J07',
  ten: 'Vẽ 2D → lưu → MÁY SẠCH (xoá hồ sơ) mở lại vẫn thấy nét',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn POST /api/project-files — cắt ĐÚNG đường máy chủ mà J07 khẳng định',
  async chuanBi(mt) {
    const duAn = await duAnRieng(mt, 'J07');
    const canThiep = mt.hongCoY
      ? [{ mau: '/api/project-files', chiPhuongThuc: 'POST', tra: { status: 500, body: { error: 'chan-hieu-chuan' } } }]
      : [];
    return { duAn, canThiep };
  },
  /**
   * ⚠️ CỐ Ý KHÔNG dùng `chanIdb` cho thế giới hỏng của J07 — đã thử và nó cho ĐỎ GIẢ: chặn
   * `IDBObjectStore.put` thì `CadSheets` không chốt được cờ hydrate, canvas không mount, bộ ngã
   * ở `waitForSelector` sau 60s ⇒ trạng thái LỖI (hạ tầng), không phải FAIL (khẳng định). Thế
   * giới hỏng phải cắt ĐÚNG đường mà hành trình này khẳng định — tức đường MÁY CHỦ — và để
   * mọi thứ khác chạy y như thật.
   */
  moPhien: async function (mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J07${mt.hauTo}`, { canThiep: st.canThiep ?? [] });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    await moMatVe(p.page, st.duAn);
    await veMotDuong(p.page);
    // Nhịp sao lưu máy chủ là `setInterval(30_000)` (CadSheets.tsx) — phải đợi qua ít nhất một
    // nhịp, nếu không thì thứ ta đo là "chưa tới giờ" chứ không phải "không lưu được".
    await cho(34000);
    st.sauKhiVe = await docKhoSheets(p.page).then((k) => k.ban.find((b) => b.khoa === `${st.userId}::/cad-editor::${st.duAn}`) ?? null);
    await chup(p.page, 'J07-1-sau-khi-ve');
  },
  /** ĐÓNG HẲN **VÀ XOÁ MÁY** — đây là chỗ J07 khác mọi hành trình khác. */
  async dong(p, mt, st, lan) {
    await dongPhien(p);
    if (lan !== 2) {
      await cho(800);
      rmSync(duongHoSo(`J07${mt.hauTo}`), { recursive: true, force: true });
      st.daXoaHoSo = true;
    }
  },
  async vaoLai(p, mt, st) {
    await moMatVe(p.page, st.duAn);
    await cho(6000);
    await chup(p.page, 'J07-2-may-sach-vao-lai');
  },
  async ghiXuong(p, mt, st) {
    const kho = await docKhoSheets(p.page);
    const khoaDung = `${st.userId}::/cad-editor::${st.duAn}`;
    const ban = kho.ban.find((b) => b.khoa === khoaDung) ?? null;
    return {
      khoaDung,
      soThucThe: ban?.soThucThe ?? 0,
      dsId: ban?.dsId ?? [],
      mayChu: await docBanSaoMayChu(p.page, st.duAn, 'ban-ve.sao-luu.idf'),
    };
  },
  soSanh(truoc, sau, st) {
    if (truoc.soThucThe < 1)
      return { dat: false, vi: `vẽ xong mà IndexedDB rỗng ở ${truoc.khoaDung} — chưa có gì để nói chuyện lưu` };
    if (!truoc.mayChu?.co)
      return { dat: false, vi: `sau 34s KHÔNG có hàng ProjectFile "ban-ve.sao-luu.idf" trên máy chủ (thấy: ${(truoc.mayChu?.tenThay ?? []).join(',') || 'không tệp nào'}) — bản vẽ chỉ sống trong trình duyệt` };
    if (!truoc.mayChu?.docDuoc || (truoc.mayChu?.soThucThe ?? 0) < 1)
      return { dat: false, vi: 'bản sao máy chủ có hàng nhưng KHÔNG parse lại ra thực thể nào — tệp cụt' };
    if (!st.daXoaHoSo) return { dat: false, vi: 'bộ đo không xoá được hồ sơ ⇒ phép "máy sạch" không thành, KHÔNG coi là đạt' };
    if (sau.soThucThe < truoc.soThucThe)
      return { dat: false, vi: `máy sạch mở lại: mất nét — trước ${truoc.soThucThe} thực thể, nay ${sau.soThucThe}` };
    const conNguyen = truoc.dsId.every((id) => sau.dsId.includes(id));
    if (!conNguyen) return { dat: false, vi: `máy sạch mở lại: số lượng đủ nhưng ID thực thể khác hẳn — không phải nét cũ` };
    return {
      dat: true,
      vi: `XOÁ SẠCH hồ sơ trình duyệt rồi mở lại: ${sau.soThucThe} thực thể quay về đúng ID cũ, khôi phục từ hàng ProjectFile trên máy chủ (${truoc.mayChu.byte} byte, ${truoc.mayChu.soThucThe} thực thể parse lại được)`,
    };
  },
};

/**
 * J12 — CHẶNG TRÌNH BÀY: SỬA BỐ CỤC → LƯU → MỞ LẠI.
 * Ma trận nói thẳng vì sao J11 không thay được nó: *"J11 chứng minh **đưa sang được**, hoàn toàn
 * không chứng minh **lưu rồi mở lại được**"*. Kho thật là khoá `userId::/present-editor::projectId`
 * trong cùng IndexedDB `interiorflow-sheets`, payload là `deck.slides[].elements[]`
 * (`components/present-editor/PresentSheets.tsx:426`) — KHÔNG phải `doc.entities` như chặng Vẽ.
 */
const J12 = {
  ma: 'J12',
  ten: 'Trình bày: đặt nội dung lên trang → đóng app → mở lại còn nguyên',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IndexedDB — đường ghi duy nhất của deck lúc đóng app',
  async chuanBi(mt) {
    return { duAn: await duAnRieng(mt, 'J12') };
  },
  moPhien: moPhienChuan('J12'),
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${st.duAn}/present`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    st.quaCua = await quaCuaDuAnRong(p.page); // xem docstring: đi vòng lỗi chặn, không phải thao tác thật
    await boQuaLopChe(p.page);
    st.buocUi = await dungNoiDungTrinhBay(p.page);
    await cho(5000); // autosave deck debounce ≥1s
    await chup(p.page, 'J12-1-sau-khi-dat-noi-dung');
  },
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${st.duAn}/present`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(7000);
    await boQuaLopChe(p.page);
    await chup(p.page, 'J12-2-vao-lai');
  },
  async ghiXuong(p, mt, st) {
    const kho = await docKhoSheets(p.page);
    const khoaDung = `${st.userId}::/present-editor::${st.duAn}`;
    const ban = kho.ban.find((b) => b.khoa === khoaDung) ?? null;
    return {
      khoaDung,
      coBanGhi: !!ban,
      soPhanTu: ban?.soPhanTu ?? 0,
      soTrang: ban?.soTrang ?? 0,
      moiKhoa: kho.ban.map((b) => b.khoa),
    };
  },
  soSanh(truoc, sau, st) {
    if (!truoc.coBanGhi)
      return { dat: false, vi: `đặt nội dung xong, IndexedDB KHÔNG có bản ghi ở ${truoc.khoaDung} (khoá thấy: ${truoc.moiKhoa.join('|') || 'không có'}); bước UI đã bấm: ${(st.buocUi ?? []).join('→') || 'không bấm được nút nào'}` };
    if (truoc.soPhanTu < 1)
      return { dat: false, vi: `có bản ghi nhưng 0 phần tử trên trang — bước dựng nội dung không đặt được gì (đã bấm: ${(st.buocUi ?? []).join('→') || 'không nút nào'})` };
    if (!sau.coBanGhi) return { dat: false, vi: `mở lại: bản ghi biến mất khỏi ${sau.khoaDung}` };
    if (sau.soPhanTu !== truoc.soPhanTu)
      return { dat: false, vi: `số phần tử đổi sau khi mở lại: ${truoc.soPhanTu} → ${sau.soPhanTu}` };
    return {
      dat: true,
      vi: `${sau.soPhanTu} phần tử trên ${sau.soTrang} trang còn nguyên ở ${sau.khoaDung} sau khi ĐÓNG HẲN trình duyệt và mở lại`,
    };
  },
};

/**
 * J04 — HOME → TẠO DỰ ÁN MỚI → DỰ ÁN CÒN ĐÓ SAU KHI MỞ LẠI.
 * Sự thật đọc bằng **SQL trên CSDL thật**, không đọc thẻ trên màn. KHÔNG dựng lại phần
 * `lib/server/draft-project.test.ts` đã khoá (chống đẻ Flow mồ côi) — đây chỉ chạy đầu-cuối.
 */
const J04 = {
  ma: 'J04',
  ten: 'Home → bấm "Tạo dự án mới" → dự án có thật trong CSDL và còn sau khi mở lại',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn POST /api/flows — cắt đường tạo dự án ở phía máy chủ',
  async chuanBi(mt) {
    const canThiep = mt.hongCoY
      ? [{ mau: '/api/flows', chiPhuongThuc: 'POST', tra: { status: 500, body: { error: 'chan-hieu-chuan' } } }]
      : [];
    return { canThiep, soDuAnDau: (await demHang(mt.duongDb)).project };
  },
  moPhien: moPhienChuan('J04'),
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(8000);
    await boQuaLopChe(p.page);
    await chup(p.page, 'J04-1-home');
    st.nutThay = [];
    st.urlTruoc = p.page.url();
    // Bấm ĐÚNG nút mang nhãn "Tạo dự án mới" — hành trình là của NGƯỜI DÙNG, không gọi API tắt.
    const nut = p.page.getByRole('button', { name: /Tạo dự án mới/i });
    st.soNut = await nut.count().catch(() => 0);
    if (st.soNut) {
      await nut.first().click({ timeout: 10000 }).catch((e) => { st.loiBam = String(e.message || e).slice(0, 120); });
      await cho(2500);
      // Nút chính mở BẢNG KHỞI TẠO DỰ ÁN (`ProjectInitBoard`) — cửa tạo dự án chuẩn của app,
      // dùng chung với ProjectSelect. Hành trình của người dùng chưa xong ở cú bấm đầu: phải
      // bấm nốt nút tạo trong bảng. Mọi ô của bảng đều TUỲ CHỌN (tên trống ⇒ "Dự án mới").
      const bang = p.page.getByRole('dialog', { name: /Bảng khởi tạo dự án|New project setup/i });
      st.moBang = await bang.count().catch(() => 0);
      await chup(p.page, 'J04-2a-bang-khoi-tao');
      if (st.moBang) {
        const xacNhan = bang.getByRole('button', { name: /^Tạo dự án/i });
        st.nutXacNhan = await xacNhan.count().catch(() => 0);
        if (st.nutXacNhan) {
          await xacNhan.first().click({ timeout: 10000 }).catch((e) => { st.loiBam = String(e.message || e).slice(0, 120); });
        }
      }
      await cho(7000);
    }
    st.urlSau = p.page.url();
    await chup(p.page, 'J04-2-sau-khi-bam');
  },
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(7000);
    await chup(p.page, 'J04-3-mo-lai-home');
  },
  async ghiXuong(p, mt, st) {
    const so = await demHang(mt.duongDb);
    // Home lấy danh sách dự án từ GET /api/flows — đọc chính nguồn đó, không đọc chữ trên thẻ.
    const tuApi = await p.page.evaluate(async () => {
      try {
        const r = await fetch('/api/flows');
        if (!r.ok) return { ok: false, status: r.status };
        const d = await r.json();
        return { ok: true, soDuAn: (d?.projects ?? []).length, soFlow: (d?.flows ?? []).length };
      } catch (e) { return { ok: false, loi: String(e).slice(0, 80) }; }
    });
    return { soDuAnSql: so.project, soFlowSql: so.flow, tuApi };
  },
  soSanh(truoc, sau, st) {
    if (!st.soNut) return { dat: false, vi: 'Home KHÔNG có nút nào mang nhãn "Tạo dự án mới" — không vào được hành trình' };
    if (!st.moBang) return { dat: false, vi: 'bấm "Tạo dự án mới" xong KHÔNG có bảng khởi tạo nào mở ra — nút không dẫn đi đâu' };
    if (!st.nutXacNhan) return { dat: false, vi: 'bảng khởi tạo mở nhưng KHÔNG có nút tạo nào bấm được' };
    if (st.loiBam) return { dat: false, vi: `bấm nút không được: ${st.loiBam}` };
    if (truoc.soDuAnSql <= st.soDuAnDau)
      return {
        dat: false,
        vi: `bấm "Tạo dự án mới" → bảng khởi tạo → "Tạo dự án": SỐ DỰ ÁN TRONG CSDL KHÔNG ĐỔI (${st.soDuAnDau} → ${truoc.soDuAnSql}). URL ${st.urlTruoc} → ${st.urlSau}. Nút đổi màn nhưng KHÔNG tạo gì`,
      };
    if (sau.soDuAnSql < truoc.soDuAnSql)
      return { dat: false, vi: `mở lại: dự án biến mất khỏi CSDL (${truoc.soDuAnSql} → ${sau.soDuAnSql})` };
    if (!sau.tuApi?.ok || sau.tuApi.soDuAn < 1)
      return { dat: false, vi: `mở lại Home: nguồn dữ liệu của Home (GET /api/flows) không trả dự án nào (${JSON.stringify(sau.tuApi)})` };
    return {
      dat: true,
      vi: `dự án tạo thật trong CSDL (${st.soDuAnDau} → ${truoc.soDuAnSql} hàng Project, ${truoc.soFlowSql} Flow) · URL ${st.urlTruoc} → ${st.urlSau} · Home mở lại vẫn thấy (${sau.tuApi.soDuAn} dự án qua GET /api/flows)`,
    };
  },
};

/**
 * J06 — MỞ LẠI DỰ ÁN CŨ, **SỬA TIẾP**, GIA PHẢ KHÔNG ĐỨT.
 * Ba phiên gói trong khuôn hai phiên của khung: phiên 1 vẽ nét A, phiên 2 mở lại và vẽ THÊM nét
 * B rồi đọc lại. Điểm đo không phải "số tăng" mà là **ID của nét A còn nguyên** — xoá sạch rồi
 * vẽ lại hai nét cũng làm số tăng, và đó đúng là đứt gia phả.
 */
const J06 = {
  ma: 'J06',
  ten: 'Mở lại dự án cũ → vẽ tiếp → nét cũ còn nguyên ID (gia phả không đứt)',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IndexedDB — lần sửa thứ hai không xuống được đĩa',
  async chuanBi(mt) {
    return { duAn: await duAnRieng(mt, 'J06') };
  },
  moPhien: moPhienChuan('J06'),
  async thaoTac(p, mt, st) {
    await moMatVe(p.page, st.duAn);
    await veMotDuong(p.page);
    await chup(p.page, 'J06-1-net-dau');
  },
  async vaoLai(p, mt, st) {
    await moMatVe(p.page, st.duAn); // mở lại dự án CŨ
    await cho(3000);
    await veMotDuong(p.page); // ...rồi SỬA TIẾP
    await chup(p.page, 'J06-2-ve-tiep');
  },
  async ghiXuong(p, mt, st) {
    const kho = await docKhoSheets(p.page);
    const khoaDung = `${st.userId}::/cad-editor::${st.duAn}`;
    const ban = kho.ban.find((b) => b.khoa === khoaDung) ?? null;
    return { khoaDung, soThucThe: ban?.soThucThe ?? 0, dsId: ban?.dsId ?? [] };
  },
  soSanh(truoc, sau) {
    if (truoc.soThucThe < 1) return { dat: false, vi: `phiên 1 không ghi được gì ở ${truoc.khoaDung}` };
    if (sau.soThucThe <= truoc.soThucThe)
      return { dat: false, vi: `mở lại vẽ tiếp mà số thực thể KHÔNG tăng: ${truoc.soThucThe} → ${sau.soThucThe} — sửa tiếp không ăn` };
    const mat = truoc.dsId.filter((id) => !sau.dsId.includes(id));
    if (mat.length)
      return { dat: false, vi: `GIA PHẢ ĐỨT: ${mat.length}/${truoc.dsId.length} thực thể của lần trước biến mất sau khi sửa tiếp (${mat.slice(0, 3).join(',')})` };
    return {
      dat: true,
      vi: `mở lại dự án cũ vẽ tiếp: ${truoc.soThucThe} → ${sau.soThucThe} thực thể, TOÀN BỘ ${truoc.dsId.length} ID của lần trước còn nguyên (không phải vẽ đè lên bản trắng)`,
    };
  },
};

/**
 * J18 — HAI TAB CÙNG MỘT DỰ ÁN, CÙNG LƯU. Tầng cơ chế đã có khoá riêng
 * (`app/api/flows/[id]/route.test.ts` chạy Prisma thật). Việc còn lại — và là việc ma trận ghi
 * UNVERIFIED — là **TẦNG NGƯỜI DÙNG**: tab sau nhận 409 thì người ngồi trước màn hình THẤY GÌ,
 * và có mất việc đang gõ không.
 *
 * Cách đo: hai tab thật trong CÙNG một hồ sơ (đúng nghĩa "hai tab"), cùng cầm một `Flow`. Tab A
 * ghi trước để `rev` nhảy; tab B còn cầm `rev` cũ, ghi sau ⇒ máy chủ phải trả 409. Bộ đo bắt
 * phản hồi mạng THẬT (không giả lập) rồi soi DOM xem có gì nói cho người dùng biết.
 */
const J18 = {
  ma: 'J18',
  ten: 'Hai tab cùng lưu → tab sau bị chặn, KHÔNG ghi đè âm thầm (tầng cơ chế)',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'ép máy chủ luôn trả 200 cho PUT /api/flows/* — mất cửa chặn thì khẳng định phải ĐỎ',
  async chuanBi(mt) {
    const canThiep = mt.hongCoY
      ? [{ mau: '/api/flows/', chiPhuongThuc: 'PUT', tra: { status: 200, body: { rev: 99 } } }]
      : [];
    return { duAn: await duAnRieng(mt, 'J18'), canThiep };
  },
  moPhien: moPhienChuan('J18'),
  async thaoTac(p, mt, st) {
    // TAB A phải ĐỨNG TRONG APP trước: `fetch('/api/…')` là đường dẫn tương đối, trang
    // `about:blank` không có gốc để ghép ⇒ ném ngay. (Bộ đo đã dính lỗi này một lần.)
    //
    // ⚠️ VÀ PHẢI ĐỨNG Ở ROUTE TRUNG TÍNH, KHÔNG PHẢI `/render`. Bài học từ chính lượt chạy
    // trước: mở `/projects/[id]/render` là mount `FlowCanvas`, `persistNow()` tự PUT lên Flow và
    // ĐẨY `rev` — nên `expectedRev` mà bộ đo vừa đọc đã cũ trước khi nó kịp ghi, và TAB A nhận
    // 409. Đó là cuộc đua do CHÍNH BỘ ĐO tạo ra, không phải hành vi sản phẩm. Đứng ở `/files`
    // thì hai lệnh PUT dưới đây là hai người viết DUY NHẤT ⇒ phép đo tất định.
    await p.page.goto(`${GOC}/files`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(3000);
    // Một Flow thật thuộc dự án này — đúng vật mà hai tab tranh nhau.
    const tao = await p.ctx.request.post(`${GOC}/api/flows`, { data: { projectId: st.duAn, name: 'J18 tranh ghi' } });
    st.flowId = (await tao.json())?.flow?.id;
    if (!st.flowId) throw new Error('không tạo được flow cho J18');

    st.maNhan = [];
    const ghiNhan = (res) => {
      if (res.request().method() === 'PUT' && res.url().includes(`/api/flows/${st.flowId}`))
        st.maNhan.push({ tab: res.request().headers()['x-g2-tab'] ?? '?', ma: res.status() });
    };
    p.page.on('response', ghiNhan);

    // TAB B mở trước và giữ `rev` cũ; TAB A ghi sau lưng nó.
    const tabB = await p.ctx.newPage();
    tabB.on('response', ghiNhan);
    await tabB.goto(`${GOC}/files`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(3000);
    // Đọc `rev` NGAY TRƯỚC lượt ghi đầu — đọc sớm là mời cuộc đua vào phép đo.
    st.revBanDau = await tabB.evaluate(async (id) => (await fetch(`/api/flows/${id}`).then((r) => (r.ok ? r.json() : null)))?.flow?.rev ?? null, st.flowId);
    if (typeof st.revBanDau !== 'number') throw new Error(`không đọc được rev của flow (nhận ${JSON.stringify(st.revBanDau)})`);

    // TAB A ghi trước ⇒ rev nhảy.
    st.tabA = await p.page.evaluate(
      async ([id, rev]) => {
        const r = await fetch(`/api/flows/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-g2-tab': 'A' },
          body: JSON.stringify({ graphJson: '{"nodes":[{"id":"a"}],"edges":[]}', name: 'tabA', expectedRev: rev }),
        });
        return { ma: r.status, than: await r.text().then((t) => t.slice(0, 160)) };
      },
      [st.flowId, st.revBanDau],
    );
    // TAB B ghi sau, VẪN CẦM rev cũ ⇒ đây là ca thật "hai người cùng sửa".
    st.tabB = await tabB.evaluate(
      async ([id, rev]) => {
        const r = await fetch(`/api/flows/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-g2-tab': 'B' },
          body: JSON.stringify({ graphJson: '{"nodes":[{"id":"b"}],"edges":[]}', name: 'tabB', expectedRev: rev }),
        });
        return { ma: r.status, than: await r.text().then((t) => t.slice(0, 160)) };
      },
      [st.flowId, st.revBanDau],
    );
    await cho(2500);
    // NGƯỜI DÙNG THẤY GÌ: quét chữ đang hiện trên tab B.
    st.chuTrenMan = await tabB.evaluate(() => document.body.innerText.slice(0, 4000));
    await chup(tabB, 'J18-1-tab-sau-bi-chan');
    await tabB.close();
  },
  async vaoLai(p, mt, st) { /* sự thật nằm ở CSDL + phản hồi mạng, không cần mở lại màn */ },
  async ghiXuong(p, mt, st) {
    const { PrismaClient } = require('@prisma/client');
    const pr = new PrismaClient({ datasources: { db: { url: `file:${mt.duongDb}` } } });
    try {
      const f = await pr.flow.findUnique({ where: { id: st.flowId }, select: { graphJson: true, rev: true, name: true } });
      return { ten: f?.name ?? null, rev: f?.rev ?? null, graph: f?.graphJson ?? '' };
    } finally { await pr.$disconnect(); }
  },
  soSanh(truoc, sau, st) {
    if (st.tabA?.ma !== 200) return { dat: false, vi: `tab A ghi không thành (${st.tabA?.ma}) — chưa dựng được ca tranh ghi` };
    if (st.tabB?.ma !== 409)
      return { dat: false, vi: `tab sau KHÔNG bị chặn: máy chủ trả ${st.tabB?.ma} cho lần ghi thứ hai ⇒ GHI ĐÈ ÂM THẦM việc của tab A` };
    if (!sau.graph.includes('"a"') || sau.graph.includes('"b"'))
      return { dat: false, vi: `CSDL giữ sai bản: mong bản của tab A, thực tế graphJson = ${sau.graph.slice(0, 80)}` };
    return {
      dat: true,
      vi: `hai tab tranh ghi CÙNG một Flow: tab A 200 · tab B 409 · CSDL giữ đúng bản của A (rev ${sau.rev}), KHÔNG ghi đè âm thầm`,
      // ⚠️ RANH GIỚI CỦA PHÉP ĐO NÀY — khai ngay tại chỗ để không ai đọc quá tay.
      ghiChu:
        'CHỈ chứng minh TẦNG CƠ CHẾ. Tab B ở đây gửi `fetch` PUT thô nên nó ĐI VÒNG qua bộ xử 409 ' +
        'của client (`lib/store.ts:1224`) ⇒ màn hình không hiện gì là ĐÚNG với phép đo này, KHÔNG ' +
        'phải bằng chứng app im lặng. Tầng người dùng vẫn UNVERIFIED — muốn đo phải làm tab B sửa ' +
        'bằng THAO TÁC THẬT trên canvas để `persistNow()` tự chạy.',
    };
  },
};

/**
 * J22 — KHÔNG CÓ API KEY: BÁO RÕ, KHÔNG NÚT GIẢ.
 * Môi trường này `.env` **không có `FAL_KEY`** ⇒ đây là ca thật, không phải mô phỏng. Điều phải
 * chứng minh có hai vế và vế hai mới khó: ① máy chủ từ chối bằng câu người đọc hiểu, nói được
 * PHẢI LÀM GÌ; ② app KHÔNG giả vờ chạy rồi trả hàng bịa.
 */
const J22 = {
  ma: 'J22',
  ten: 'Không có khoá cloud → báo rõ, không nút giả',
  chan: 'G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'ép /api/jobs trả 200 kèm job giả — app nuốt hàng bịa thì khẳng định phải ĐỎ',
  async chuanBi(mt) {
    const canThiep = mt.hongCoY
      ? [{ mau: '/api/jobs', chiPhuongThuc: 'POST', tra: { status: 200, body: { job: { id: 'gia', status: 'done', output: 'https://vi-du/gia.png' } } } }]
      : [];
    return { duAn: await duAnRieng(mt, 'J22'), canThiep };
  },
  moPhien: moPhienChuan('J22'),
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${st.duAn}/render`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    // Gọi ĐÚNG cửa mà node cloud đi qua, từ trong app, với phiên thật.
    st.traLoi = await p.page.evaluate(async () => {
      const r = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // Hợp đồng thật của cửa này (`app/api/jobs/route.ts:19-24`): `task` phải thuộc `AI_TASKS`,
        // `input` phải là object, `tier` là số ≥2 (mức 1 không gọi AI). Gửi sai hình dạng thì
        // nhận 400 "thiếu task hợp lệ" — đó là bộ đo sai, KHÔNG phải sản phẩm báo thiếu khoá.
        body: JSON.stringify({ task: 'sketch2render', tier: 2, input: { prompt: 'phong khach', image_url: 'https://vi-du/anh.png' } }),
      });
      const t = await r.text();
      let j = null; try { j = JSON.parse(t); } catch {}
      return { ma: r.status, loi: j?.error ?? null, code: j?.code ?? null, than: t.slice(0, 200) };
    });
    await chup(p.page, 'J22-1-goi-nang-luc-cloud');
  },
  async vaoLai(_p, _mt, _st) { /* không có gì để mở lại — sự thật là phản hồi + màn hình */ },
  async ghiXuong(p, mt, st) {
    return { traLoi: st.traLoi, congCuChet: st.congCuChet ?? null };
  },
  soSanh(truoc, sau, st) {
    const t = sau.traLoi ?? {};
    if (t.ma === 200)
      return { dat: false, vi: `KHÔNG có khoá cloud mà /api/jobs vẫn trả 200 (${t.than}) — app chạy giả, đúng thứ luật cấm` };
    if (t.ma !== 503)
      return { dat: false, vi: `mong 503 "chưa cấu hình", máy chủ trả ${t.ma}: ${t.than}` };
    if (t.code !== 'PROVIDER_NOT_CONFIGURED')
      return { dat: false, vi: `503 nhưng không mang mã máy đọc được (code=${t.code}) — UI không phân biệt được "thiếu khoá" với "mạng hỏng"` };
    if (!t.loi || t.loi.length < 15 || !/(FAL_KEY|cấu hình|COMFYUI)/i.test(t.loi))
      return { dat: false, vi: `câu báo không nói được phải làm gì: "${t.loi}"` };
    return {
      dat: true,
      vi: `gọi năng lực cloud khi máy không có khoá: 503 · code ${t.code} · câu báo nói rõ việc phải làm ("${t.loi}") · KHÔNG trả hàng giả`,
    };
  },
};

/**
 * J05 — THẺ TIÊU ĐIỂM Ở HOME ĐƯA VỀ ĐÚNG CHỖ ĐANG DỞ, VÀ VẪN ĐÚNG SAU KHI ĐÓNG APP.
 *
 * VÌ SAO CÓ (đo 04/09, TRƯỚC khi sửa): thân thẻ Resume KHÔNG bắt cú bấm nào — `hienVat.href`
 * được tính rồi bỏ đó — trong khi chân thẻ ghi hẳn "bấm để về đúng chỗ bạn rời đi". Giao diện
 * khẳng định một việc, việc đó không xảy ra (cùng họ D-J04a và WorkHub tự xưng trợ lý).
 *
 * ⭐ BẤM BẰNG BÀN PHÍM THUẦN, KHÔNG BẤM CHUỘT. Chuột chạy mà bàn phím không thì đó là CHƯA
 * XONG, và đúng loại lỗi 5 máy soi không bắt nổi (bài học 16/08: lý do CÓ trong mã nhưng
 * không bao giờ tới người dùng). Nên phép đo đi bằng Tab → Enter, và còn đọc luôn ring focus
 * đang vẽ ra màu gì.
 *
 * ⭐ ĐỌC TỪ NƠI LƯU THẬT: `localStorage['interiorflow.resume.<userId>']` (`lib/resume.ts:25`),
 * KHÔNG đọc chữ trên màn. Chữ trên thẻ có thể đúng trong khi đường dây đã đứt — đó chính là
 * trạng thái mà hành trình này sinh ra để bắt.
 */
const J05 = {
  ma: 'J05',
  ten: 'Home → bấm thẻ tiêu điểm → về đúng chặng đang dở → đóng app → thẻ vẫn trỏ đúng chỗ',
  chan: 'G2',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn localStorage.setItem cho khoá resume — không còn dấu vết việc đang dở',
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J05${mt.hauTo}`, { chanResume: mt.hongCoY });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.duAnMongDoi = mt.duAn; // `soSanh` không nhận `mt` — đích phải đi qua `st`
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    // ⓪ MỞ APP Ở HOME TRƯỚC — đây là luồng của J05 (Home → thẻ → chặng), KHÔNG phải liều thuốc.
    //   Deep-link thẳng vào studio là hành trình KHÁC (J16). Phân biệt này quan trọng vì lượt
    //   chạy đầu 04/09 đã lộ một LỖI THẬT ở nhánh deep-link: `ResumeTracker` bỏ qua lượt ghi khi
    //   `lastUserId` chưa kịp gieo (đua với `lib/danh-tinh-phien.ts`, docstring `:202` tự khai),
    //   và nó KHÔNG chạy lại vì `pathname` không đổi ⇒ resume ghi ra THIẾU `flowId` ⇒ thẻ Resume
    //   trỏ về route toàn cục cũ ⇒ dội về '/'. Lỗ đó nằm ngoài phạm vi phiếu này, đã khai ở
    //   `docs/delivery/PRODUCT-DEFECTS.md`; J05 đo đúng luồng của mình chứ không che nó.
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(5000);
    await boQuaLopChe(p.page);

    // ① làm một việc THẬT ở chặng 2D ⇒ sinh dấu vết "đang dở" đúng cách người dùng sinh ra nó
    await moMatVe(p.page, mt.duAn);
    await veMotDuong(p.page);

    // ② về Home. ResumeTracker cố ý KHÔNG ghi '/' (docstring ResumeTracker.tsx) và HomeScreen
    //    chỉ ghi khi `stageDone` — Home mới không bật cờ đó ⇒ dấu vết 2D không bị đè.
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    await chup(p.page, 'J05-1-home-co-viec-do');

    st.dauVetHome = await docTheTieuDiem(p.page);
    st.resumeLucBam = await p.page.evaluate(
      (u) => { try { return JSON.parse(localStorage.getItem('interiorflow.resume.' + u) || 'null'); } catch { return null; } },
      st.userId,
    );

    // ③ BẤM BẰNG BÀN PHÍM THUẦN — Tab cho tới khi tiêu điểm rơi vào lớp phủ, rồi Enter.
    st.banPhim = await bamTheBangBanPhim(p.page);
    if (st.banPhim.toiDuoc) {
      await p.page.keyboard.press('Enter');
      await p.page.waitForURL((u) => !new URL(String(u)).pathname.match(/^\/$/), { timeout: 20000 }).catch(() => {});
      await cho(2500);
    }
    st.urlSauBam = p.page.url();
    await chup(p.page, 'J05-2-sau-khi-bam-bang-ban-phim');

    // ④ về lại Home để `ghiXuong` đọc thẻ ở cùng một chỗ với lần 2
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
  },
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    await chup(p.page, 'J05-3-mo-lai-sau-khi-dong-han');
  },
  async ghiXuong(p, mt, st) {
    const the = await docTheTieuDiem(p.page);
    const resume = await p.page.evaluate(
      (uid) => {
        try {
          const raw = localStorage.getItem('interiorflow.resume.' + uid);
          return raw ? JSON.parse(raw) : null;
        } catch (e) { return { loi: String(e).slice(0, 80) }; }
      },
      st.userId,
    );
    return { ...the, resume };
  },
  soSanh(truoc, sau, st) {
    const dich = `/projects/${st.duAnMongDoi ?? ''}`;
    // ⓪ dấu vết phải tồn tại ở NƠI LƯU THẬT — không tin chữ trên thẻ
    if (!truoc.resume || truoc.resume.route !== '/cad-editor')
      return { dat: false, vi: `sau khi vẽ, localStorage resume không ghi chặng 2D (đọc được: ${JSON.stringify(truoc.resume)})` };

    // ① thẻ phải THẬT SỰ có đường đi, không chỉ có câu hứa ở chân thẻ
    if (!truoc.coLopPhu)
      return { dat: false, vi: `Home có việc đang dở nhưng thẻ tiêu điểm KHÔNG có lớp phủ bấm được (chân thẻ ghi: "${truoc.chanCuoi}")` };
    if (truoc.chanCuoi.includes('bấm') && !truoc.coLopPhu)
      return { dat: false, vi: 'chân thẻ hứa "bấm" mà không có gì bấm được — đúng lỗi J05 sinh ra để bắt' };

    // ② BÀN PHÍM: Tab tới được + Enter đi được. Chuột chạy mà bàn phím không là CHƯA XONG.
    if (!st.banPhim?.toiDuoc)
      return { dat: false, vi: `Tab KHÔNG tới được lớp phủ sau ${st.banPhim?.soTab ?? '?'} lần (tiêu điểm dừng ở: ${st.banPhim?.dungO ?? 'không rõ'})` };
    if (!st.banPhim?.coRing)
      return { dat: false, vi: `lớp phủ nhận tiêu điểm nhưng KHÔNG vẽ vòng focus (outline đo được: "${st.banPhim?.ring}")` };
    if (!String(st.urlSauBam || '').includes(dich))
      return {
        dat: false,
        vi: `Enter trên thẻ KHÔNG đưa tới dự án đang dở — đứng ở ${st.urlSauBam}. Lúc bấm thẻ trỏ "${st.dauVetHome?.href}" (lớp phủ ${st.dauVetHome?.coLopPhu ? 'có' : 'KHÔNG'}), resume lúc đó ${JSON.stringify(st.resumeLucBam)}`,
      };

    // ③ SỰ THẬT CÒN NGUYÊN sau khi ĐÓNG HẲN trình duyệt
    if (!sau.coLopPhu)
      return { dat: false, vi: `mở lại: thẻ tiêu điểm mất khả năng bấm (chân thẻ: "${sau.chanCuoi}")` };
    if (sau.href !== truoc.href)
      return { dat: false, vi: `mở lại: thẻ trỏ sang chỗ KHÁC — trước "${truoc.href}", sau "${sau.href}"` };
    if (!sau.resume || sau.resume.route !== truoc.resume.route || sau.resume.flowId !== truoc.resume.flowId)
      return { dat: false, vi: `mở lại: dấu vết ở localStorage đổi — trước ${JSON.stringify(truoc.resume)}, sau ${JSON.stringify(sau.resume)}` };

    return {
      dat: true,
      vi: `Tab ${st.banPhim.soTab} lần tới lớp phủ (ring ${st.banPhim.ring}) → Enter → ${st.urlSauBam}; ĐÓNG HẲN rồi mở lại: thẻ vẫn trỏ "${sau.href}", resume vẫn ${sau.resume.route}+${sau.resume.flowId}`,
    };
  },
};

/**
 * ĐỌC THẺ TIÊU ĐIỂM Ở HOME — đọc CẤU TRÚC (có lớp phủ không, trỏ đi đâu), không đọc chữ
 * quảng cáo. `chanCuoi` lấy về chỉ để nói được câu "hứa mà không làm" cho rõ khi FAIL.
 */
function docTheTieuDiem(page) {
  return page.evaluate(() => {
    const vat = document.querySelector('.xuong-home .vat');
    if (!vat) return { coThe: false, coLopPhu: false, href: '', chanCuoi: '' };
    const a = vat.querySelector('a.mo-lai');
    return {
      coThe: true,
      coLopPhu: !!a,
      href: a ? new URL(a.getAttribute('href') || '', location.origin).pathname : '',
      nhan: a?.getAttribute('aria-label') || '',
      chanCuoi: vat.querySelector('.vat-chan .day2')?.textContent?.trim() || '',
    };
  });
}

/**
 * TAB TỚI LỚP PHỦ RỒI ĐO VÒNG FOCUS. Trả về cả `ring` (giá trị `outline` tính được) để câu
 * FAIL nói được thẳng "nhận tiêu điểm nhưng không thấy gì" — thứ `tsc`/grep không bao giờ biết.
 */
async function bamTheBangBanPhim(page, tran = 40) {
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null));
  for (let i = 1; i <= tran; i++) {
    await page.keyboard.press('Tab');
    const d = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { la: '', ring: '' };
      const cs = getComputedStyle(el);
      return {
        la: el.className && typeof el.className === 'string' ? el.className : el.tagName,
        ring: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
        moTa: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 50),
      };
    });
    if (String(d.la).includes('mo-lai')) {
      const rong = parseFloat(d.ring) || 0;
      return { toiDuoc: true, soTab: i, ring: d.ring, coRing: rong > 0 && !d.ring.includes('none'), dungO: d.la };
    }
    if (i === tran) return { toiDuoc: false, soTab: i, ring: d.ring, coRing: false, dungO: `${d.la} · ${d.moTa}` };
  }
  return { toiDuoc: false, soTab: tran, coRing: false, dungO: '' };
}


/* ═══════════════ LƯỢT 7 (05/09) — J15 · VÒNG ĐỜI CẤU KIỆN `.idfc` ═══════════════ */

/**
 * ĐỌC NƠI LƯU THẬT của KHO CẤU KIỆN STUDIO — không đọc chữ trên kệ.
 *
 * Đường thật, đo tại nguồn chứ không nhớ hộ: `lib/library/idfc-store.ts:19` khai
 * `IDB_ROUTE = '/studio-idfc'`; kho đi qua `createStudioBlobStore` →
 * `lib/storage/studio-persist.ts:27,55` (`STUDIO_USER = 'studio'`) → `lib/sheets-persist.ts:54`
 * ghép khoá `userId::route` (không có projectId ⇒ KHÔNG có đoạn thứ ba) ⇒ khoá cuối cùng là
 * **`studio::/studio-idfc`** trong DB `interiorflow-sheets`, store `sheets`.
 *
 * ⚠️ KHÔNG dùng `docKhoSheets` cho việc này: hàm đó đếm `doc.entities`/`deck.slides` — hai hình
 * dạng của bản vẽ và deck. Kho cấu kiện mang `sheets[0].payload` là MẢNG `StoredIdfc`, nên đọc
 * bằng lăng kính kia sẽ ra `soThucThe: 0` cho một kho đầy hàng: **xanh giả**.
 */
function docKhoIdfc(page) {
  return page.evaluate(
    () =>
      new Promise((res) => {
        let xong = false;
        const tra = (v) => { if (!xong) { xong = true; res(v); } };
        setTimeout(() => tra({ loi: 'het-gio', mon: [] }), 8000);
        let rq;
        try { rq = indexedDB.open('interiorflow-sheets'); } catch { return tra({ loi: 'khong-mo-duoc', mon: [] }); }
        rq.onerror = () => tra({ loi: 'open-error', mon: [] });
        rq.onsuccess = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains('sheets')) return tra({ mon: [], khoaCo: false });
          const st = db.transaction('sheets', 'readonly').objectStore('sheets');
          const g = st.get('studio::/studio-idfc');
          g.onerror = () => tra({ loi: 'get-error', mon: [] });
          g.onsuccess = () => {
            const rec = g.result;
            const payload = rec?.sheets?.[0]?.payload;
            if (!Array.isArray(payload)) return tra({ mon: [], khoaCo: !!rec, viSao: 'payload không phải mảng' });
            tra({
              khoaCo: true,
              mon: payload.map((m) => ({
                code: String(m?.meta?.code ?? ''),
                ten: String(m?.meta?.name ?? ''),
                kind: String(m?.meta?.kind ?? ''),
                w: m?.body?.geom2d?.w ?? null,
                soPrim: (m?.body?.geom2d?.prims ?? []).length,
                the: (m?.meta?.tags ?? []).join(','),
                storedAt: String(m?.storedAt ?? ''),
              })),
            });
          };
        };
      }),
  );
}

const J15_MA = 'G2-J15-GHE';

/** Một `.idfc` HỢP LỆ v3 — `importIdfc` (`lib/cad/idfc.ts:427`) đòi: idfcVersion số, meta.name +
 *  meta.code chuỗi, meta.kind thuộc IDFC_KINDS, và ruột khớp loại (`component` ⇒ geom2d đủ
 *  group/w/h/prims). Dựng đúng ngần ấy, không hơn — thừa trường là thừa chỗ để sai. */
function tepIdfc({ ten, w, prims, the }) {
  return JSON.stringify({
    idfcVersion: 3,
    meta: {
      name: ten,
      code: J15_MA,
      kind: 'furniture',
      tags: the,
      createdAt: '2026-09-05T00:00:00.000Z',
      modifiedAt: new Date().toISOString(),
      appVersion: 'interiorflow-1.0.0',
    },
    body: { type: 'component', geom2d: { group: 'Phòng khách', w, h: 800, prims } },
  });
}

/** Mở tấm Thư viện bằng ĐÚNG thao tác người dùng (phím `l`, `use-library-sheet.ts:97`), bật chế
 *  độ "Nạp hàng loạt", thả tệp vào ô nhập thật rồi bấm "Đưa vào kho". Trả về những gì đã bấm để
 *  báo cáo không phải đoán bước nào chạy, bước nào không. */
async function napIdfcQuaThuVien(page, duongTep) {
  const buoc = [];
  await page.keyboard.press('l');
  await cho(1500);
  const nutNap = page.getByRole('button', { name: /Nạp hàng loạt|Bulk add/ });
  await nutNap.first().click({ timeout: 15000 });
  buoc.push('nạp hàng loạt');
  await cho(1200);
  await page.locator('[data-testid="lib-ingest-input"]').setInputFiles(duongTep);
  await cho(1800);
  // Dòng tệp phải mang dấu ✓ + mã — tức app ĐÃ PARSE được, không chỉ nhận tên tệp.
  const nhanDien = await page.locator('.droprow').first().innerText().catch(() => '');
  buoc.push(`dòng tệp: ${nhanDien.replace(/\s+/g, ' ').trim().slice(0, 90)}`);
  const nutKho = page.getByRole('button', { name: /Đưa vào kho|Add to store/ });
  await nutKho.first().click({ timeout: 15000 });
  buoc.push('đưa vào kho');
  await cho(2500);
  return { buoc, nhanDien };
}

/**
 * J15 — MỞ LẠI MỘT `.idfc` ĐÃ LƯU, SỬA, GHI LẠI.
 *
 * ⭐ BA LẦN ĐÓNG APP, KHÔNG PHẢI HAI. Khung chỉ chạy hai phiên, nhưng hành trình này đòi bản GỐC
 * phải sống sót qua một lần đóng TRƯỚC KHI được sửa — nếu không, ta chỉ chứng minh "ghi hai lần
 * trong cùng một phiên", thứ không ai nghi ngờ. Nên `chuanBi` chạy một **phiên mồi**: nhập bản
 * gốc rồi đóng hẳn. Phiên 1 của khung mới là lượt "mở lại — thấy bản gốc — sửa"; phiên 2 là lượt
 * "mở lại — bản sửa còn nguyên".
 *
 * ⛔ "SỬA" Ở ĐÂY LÀ NHẬP LẠI CÙNG MÃ, và đó là ngữ nghĩa DUY NHẤT app có. `idfc-store.ts:14-15`
 * khai thẳng: kho một chiều, *"không có hàm nào sửa nội dung một `.idfc` đã lưu tại chỗ (muốn
 * đổi: nhập file mới cùng mã, đè)"*, và `saveIdfcItems` upsert theo `meta.code`. Đo cái app có,
 * không đo cái ta mong nó có.
 *
 * KHẲNG ĐỊNH, ba vế rời nhau — vế nào hỏng cũng đỏ:
 *   ① bản gốc còn nguyên sau lần đóng thứ nhất (nếu không, "mở lại một .idfc đã lưu" vô nghĩa)
 *   ② sau khi nhập bản sửa: kho mang giá trị MỚI (tên · w · prims · thẻ), KHÔNG phải giá trị cũ
 *   ③ số món KHÔNG tăng — đè theo mã, không nhân bản. Đây là vế dễ hỏng nhất và cũng là vế mà
 *      màn hình không nói cho biết.
 */
const J15 = {
  ma: 'J15',
  ten: 'Thư viện: mở lại `.idfc` đã lưu → sửa → ghi lại → đóng app → vẫn là bản sửa',
  chan: 'G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IDBObjectStore.put trên `interiorflow-sheets` — kho cấu kiện không ghi xuống được',
  async chuanBi(mt) {
    const thuMuc = path.join(os.tmpdir(), `g2-j15${mt.hauTo}`);
    mkdirSync(thuMuc, { recursive: true });
    const goc = path.join(thuMuc, 'ghe-goc.idfc');
    const sua = path.join(thuMuc, 'ghe-sua.idfc');
    writeFileSync(goc, tepIdfc({ ten: 'Ghế G2 bản gốc', w: 600, prims: [], the: ['g2', 'goc'] }));
    writeFileSync(sua, tepIdfc({
      ten: 'Ghế G2 ĐÃ SỬA',
      w: 940,
      prims: [{ t: 'rect', x: 0, y: 0, w: 940, h: 800 }],
      the: ['g2', 'da-sua'],
    }));

    // ── PHIÊN MỒI: nhập bản gốc rồi ĐÓNG HẲN. Sau lượt này, mọi thứ J15 đọc được đều đã đi qua
    //    ít nhất một lần tắt app.
    const p0 = await moPhienTrinhDuyet(`J15${mt.hauTo}`, { chanIdb: mt.hongCoY });
    try {
      const me = await p0.ctx.request.get(`${GOC}/api/auth/me`);
      if (!(await me.json())?.user?.id) await dangNhap(p0.ctx);
      await p0.page.goto(`${GOC}/files`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await cho(6000);
      await boQuaLopChe(p0.page);
      await napIdfcQuaThuVien(p0.page, goc);
      await chup(p0.page, 'J15-0-vua-nhap-ban-goc');
    } finally {
      await dongPhien(p0);
    }
    await cho(1200);
    return { tepGoc: goc, tepSua: sua };
  },
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J15${mt.hauTo}`, { chanIdb: mt.hongCoY });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/files`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    // ① MỞ LẠI: bản gốc phải còn — đọc từ IndexedDB, không tin kệ.
    st.khoLucMoLai = await docKhoIdfc(p.page);
    await chup(p.page, 'J15-1-mo-lai-thay-ban-goc');
    // ② SỬA: nhập lại cùng mã với nội dung khác.
    st.buocSua = await napIdfcQuaThuVien(p.page, st.tepSua);
    await chup(p.page, 'J15-2-vua-ghi-ban-sua');
  },
  async ghiXuong(p) {
    return docKhoIdfc(p.page);
  },
  async vaoLai(p) {
    await p.page.goto(`${GOC}/files`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    // Kho hydrate bất đồng bộ từ IDB (`hydrateIdfcStore`) — nhưng ta đọc THẲNG IndexedDB nên
    // không phụ thuộc app hydrate xong hay chưa. Chờ ở đây chỉ để ảnh chụp có nội dung.
    await chup(p.page, 'J15-3-mo-lai-sau-khi-sua');
  },
  soSanh(truoc, sau, st) {
    const g = (kho) => (kho?.mon ?? []).find((m) => m.code === J15_MA) ?? null;
    const banGoc = g(st.khoLucMoLai);
    const s = g(sau);
    const loi = [];
    if (!banGoc) loi.push(`① mở lại KHÔNG thấy bản gốc trong kho (khoá studio::/studio-idfc: ${JSON.stringify(st.khoLucMoLai).slice(0, 160)})`);
    else if (banGoc.w !== 600) loi.push(`① bản gốc sai giá trị: w=${banGoc.w}, đợi 600`);
    if (!s) loi.push('② sau khi sửa + đóng app: không còn món nào mang mã ' + J15_MA);
    else {
      if (s.w !== 940) loi.push(`② w vẫn là ${s.w} — bản sửa (940) KHÔNG ghi xuống`);
      if (!/ĐÃ SỬA/.test(s.ten)) loi.push(`② tên vẫn là "${s.ten}" — bản sửa không ghi xuống`);
      if (s.soPrim !== 1) loi.push(`② prims=${s.soPrim}, đợi 1`);
      if (!/da-sua/.test(s.the)) loi.push(`② thẻ vẫn là "${s.the}"`);
    }
    const soTruoc = (truoc?.mon ?? []).length;
    const soSau = (sau?.mon ?? []).length;
    if (soSau !== soTruoc) loi.push(`③ số món đổi qua lần đóng app: ${soTruoc} → ${soSau}`);
    const trung = (sau?.mon ?? []).filter((m) => m.code === J15_MA).length;
    if (trung > 1) loi.push(`③ NHÂN BẢN: ${trung} món cùng mã ${J15_MA} — đè theo mã đã hỏng`);
    if (loi.length) return { dat: false, vi: loi.join(' · ') };
    return {
      dat: true,
      vi: `khoá IndexedDB \`studio::/studio-idfc\`: bản gốc sống qua lần đóng #1 (w=600, "${banGoc.ten}") → nhập lại cùng mã ${J15_MA} → sau lần đóng #2 kho mang ĐÚNG bản sửa (w=940, "${s.ten}", ${s.soPrim} prim, thẻ "${s.the}"), tổng ${soSau} món, không nhân bản`,
      ghiChu: `nhận diện lúc thả tệp: ${String(st.buocSua?.nhanDien ?? '').replace(/\s+/g, ' ').trim().slice(0, 90)}`,
    };
  },
};


/* ═══════════════ LƯỢT 7 (05/09) — J13 · NHẬP TỆP THÔ → THƯ VIỆN → TỆP TRÊN ĐĨA ═══════════════ */

/**
 * ĐỌC NƠI LƯU THẬT #1 — MANIFEST của trang `/library/ingest`.
 * `lib/refingest.ts:161` khai `route: '/studio-ref-manifest'`, cùng đường studio-persist như kho
 * `.idfc` ⇒ khoá `studio::/studio-ref-manifest`.
 */
function docManifestIngest(page) {
  return page.evaluate(
    () =>
      new Promise((res) => {
        let xong = false;
        const tra = (v) => { if (!xong) { xong = true; res(v); } };
        setTimeout(() => tra({ loi: 'het-gio', asset: [] }), 8000);
        let rq;
        try { rq = indexedDB.open('interiorflow-sheets'); } catch { return tra({ loi: 'khong-mo-duoc', asset: [] }); }
        rq.onerror = () => tra({ loi: 'open-error', asset: [] });
        rq.onsuccess = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains('sheets')) return tra({ asset: [], khoaCo: false });
          const g = db.transaction('sheets', 'readonly').objectStore('sheets').get('studio::/studio-ref-manifest');
          g.onerror = () => tra({ loi: 'get-error', asset: [] });
          g.onsuccess = () => {
            const m = g.result?.sheets?.[0]?.payload;
            const ds = m?.assets;
            if (!Array.isArray(ds)) return tra({ asset: [], khoaCo: !!g.result, viSao: 'manifest không có mảng assets' });
            tra({ khoaCo: true, asset: ds.map((a) => ({ ten: String(a?.name ?? ''), loai: String(a?.type ?? ''), usage: String(a?.usage ?? ''), byte: a?.bytes ?? 0 })) });
          };
        };
      }),
  );
}

/** ĐỌC NƠI LƯU THẬT #2 — kho `LibraryAsset`, hỏi qua ĐÚNG cửa app dùng (`GET /api/library`,
 *  `app/api/library/route.ts:8`), trong page nên cookie phiên đi kèm như người dùng thật. */
function docKhoLibraryAsset(page, dauVet) {
  return page.evaluate(async (dv) => {
    try {
      const r = await fetch('/api/library');
      if (!r.ok) return { ok: false, ma: r.status, mon: [] };
      const j = await r.json();
      const ds = (j?.assets ?? []).filter((a) => String(a.name ?? '').includes(dv));
      return { ok: true, tong: (j?.assets ?? []).length, mon: ds.map((a) => ({ id: a.id, ten: a.name, category: a.category, tags: a.tags, usage: a.usage, url: a.url })) };
    } catch (e) {
      return { ok: false, loi: String(e).slice(0, 120), mon: [] };
    }
  }, dauVet);
}

/**
 * ĐỌC NƠI LƯU THẬT #3 — **BYTE THẬT TRÊN ĐĨA**, không qua app.
 * `lib/server/library-save.ts:15,55` ghi tệp vào `<cwd>/uploads/<path>` rồi mới tạo hàng DB. Đây
 * đọc thẳng cột `path` từ CSDL rồi băm nội dung tệp và so với tệp nguồn — hàng DB trỏ vào một tệp
 * KHÔNG tồn tại (hoặc rỗng) là ca hỏng mà mọi phép đo qua app đều bỏ lọt: `GET /api/library` chỉ
 * đọc bảng, nó không mở tệp ra xem.
 */
function docTepTrenDia(duongDb, dauVet, bamNguon) {
  const { PrismaClient } = require('@prisma/client');
  const crypto = require('node:crypto');
  const pr = new PrismaClient({ datasources: { db: { url: `file:${duongDb}` } } });
  return pr.libraryAsset
    .findMany({ where: { name: { contains: dauVet }, deletedAt: null }, select: { id: true, name: true, path: true, mime: true, tags: true, category: true } })
    .then((hang) => {
      const out = hang.map((h) => {
        const duong = path.join(process.cwd(), 'uploads', h.path);
        if (!existsSync(duong)) return { ...h, coTep: false, byte: 0, bam: '' };
        const b = readFileSync(duong);
        return { id: h.id, ten: h.name, tags: h.tags, category: h.category, coTep: true, byte: b.length, bam: crypto.createHash('sha256').update(b).digest('hex').slice(0, 16), duong };
      });
      return { hang: out, khopNguon: out.filter((o) => o.bam === bamNguon).length };
    })
    .finally(() => pr.$disconnect());
}

/** Một PNG THẬT (magic byte đúng) — `saveLibraryAssetFromBuffer` sniff magic chứ không tin nhãn
 *  client khai (`lib/server/mime-sniff.ts`), nên tệp giả tên `.png` sẽ bị chặn ở cửa. */
async function taoAnhThat(duong, mau) {
  const sharp = require('sharp');
  await sharp({ create: { width: 240, height: 160, channels: 3, background: mau } }).png().toFile(duong);
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(readFileSync(duong)).digest('hex').slice(0, 16);
}

const J13_DAU_VET = 'g2j13anhtho';

/**
 * DỌN SẠCH DẤU VẾT CŨ TRƯỚC MỖI LƯỢT — khung đã `rmSync` hồ sơ trình duyệt, nhưng hàng
 * `LibraryAsset` và tệp trong `uploads/` sống ở CSDL/đĩa nên lượt trước để lại.
 *
 * ⛔ ĐÂY LÀ BẪY "THẾ GIỚI ĐÃ ẤM", VÀ NÓ ĐÃ CẮN THẬT: lượt hiệu chuẩn đầu tiên báo **PASS trong
 * thế giới đã hỏng** — không phải vì cửa ghi vẫn chạy, mà vì phép đo ③ đọc CSDL và nhặt được hàng
 * của lượt LÀNH chạy trước đó. Trạng thái sẵn có làm bộ đo phát chứng chỉ cho một lần ghi chưa hề
 * xảy ra. Dọn ở đây là điều kiện để phép hiệu chuẩn có nghĩa, không phải dọn cho gọn.
 */
async function donDauVetJ13(duongDb) {
  const { PrismaClient } = require('@prisma/client');
  const pr = new PrismaClient({ datasources: { db: { url: `file:${duongDb}` } } });
  try {
    const hang = await pr.libraryAsset.findMany({ where: { name: { contains: J13_DAU_VET } }, select: { id: true, path: true } });
    for (const h of hang) {
      try { rmSync(path.join(process.cwd(), 'uploads', h.path), { force: true }); } catch { /* tệp đã mất — vẫn xoá hàng */ }
    }
    if (hang.length) await pr.libraryAsset.deleteMany({ where: { id: { in: hang.map((h) => h.id) } } });
    return hang.length;
  } finally {
    await pr.$disconnect();
  }
}

/**
 * J13 — NHẬP TỆP THÔ → GẮN ĐỊNH NGHĨA → LƯU VÀO THƯ VIỆN → MỞ LẠI CÒN TỆP TRÊN ĐĨA.
 *
 * 🔴 MỘT LỆCH CỦA CHÍNH MA TRẬN, ĐO ĐƯỢC TRƯỚC KHI VIẾT HÀNH TRÌNH NÀY. Ma trận khai đường vào là
 * `/library/ingest` và cột đã-lưu là *`LibraryAsset` + tệp trên đĩa*. Hai vế đó KHÔNG nối với
 * nhau: `app/library/ingest/page.tsx:98` `add()` chỉ đẩy tệp vào state rồi `saveManifest` (`:92`)
 * ghi **manifest xuống IndexedDB**; grep `'/api/library'` trong tệp đó = **0**. Tức thả tệp ở
 * trang ingest **không sinh hàng `LibraryAsset` nào và không đặt byte nào lên đĩa** — nó chỉ giữ
 * *tham chiếu metadata* (chính trang tự khai thế ở `:109`).
 * ⇒ Hành trình này đo **CẢ HAI** đường, mỗi đường một khẳng định riêng, không gộp làm một để
 * chữ PASS che mất chỗ hở:
 *   ① `/library/ingest` — nhập thô + gắn định nghĩa (`usage`) ⇒ sống trong manifest IDB
 *   ② `/inspiration` — tải cùng tệp lên kèm giấy phép ⇒ `POST /api/library`
 *      (`components/dna/InspirationBoard.tsx:228`) ⇒ hàng `LibraryAsset` + **byte trên đĩa**
 * Chỉ đường ② mới đáp được câu "mở lại còn tệp trên đĩa"; nói rõ ra là việc của bộ đo.
 */
const J13 = {
  ma: 'J13',
  ten: 'Nhập tệp thô → gắn định nghĩa → lưu vào Thư viện → mở lại còn hàng DB + byte trên đĩa',
  chan: 'G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn POST /api/library (500) — cửa ghi thật của LibraryAsset đóng, GET vẫn mở nên app dựng bình thường',
  async chuanBi(mt) {
    const thuMuc = path.join(os.tmpdir(), `g2-j13${mt.hauTo}`);
    mkdirSync(thuMuc, { recursive: true });
    const anh = path.join(thuMuc, `${J13_DAU_VET}.png`);
    const bam = await taoAnhThat(anh, { r: 32, g: 96, b: 120 });
    const daDon = await donDauVetJ13(mt.duongDb);
    return {
      daDon,
      tepAnh: anh,
      bamNguon: bam,
      canThiep: mt.hongCoY
        ? [{ mau: '/api/library', chiPhuongThuc: 'POST', tra: { status: 500, body: { error: 'chặn có chủ ý — thế giới biết chắc hỏng' } } }]
        : [],
    };
  },
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J13${mt.hauTo}`, { canThiep: st.canThiep ?? [] });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    // ── ① ĐƯỜNG MA TRẬN TRỎ TỚI: `/library/ingest`
    await p.page.goto(`${GOC}/library/ingest`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(5000);
    const oNhap = p.page.locator('input[type="file"]').first();
    await oNhap.setInputFiles(st.tepAnh);
    await cho(4000);
    // GẮN ĐỊNH NGHĨA: đổi vai trò của tệp vừa nhập (ô chọn `usage`, `page.tsx:423`).
    const chonUsage = p.page.locator('select').filter({ hasText: /.*/ });
    st.datUsage = false;
    try {
      const s = p.page.locator('select').last();
      await s.selectOption('material', { timeout: 6000 });
      st.datUsage = true;
    } catch { /* không có ô usage ⇒ khai thẳng ở kết quả, không giả vờ đã gắn */ }
    await cho(3000); // autosave manifest (`useEffect` ở `page.tsx:92`)
    await chup(p.page, 'J13-1-ingest-da-nhap-tho');
    st.manifestLucNhap = await docManifestIngest(p.page);

    // ── ② ĐƯỜNG SINH TỆP TRÊN ĐĨA THẬT: `/inspiration` → POST /api/library
    await p.page.goto(`${GOC}/inspiration`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    // Khối nhập ảnh MẶC ĐỊNH ĐÓNG (`InspirationBoard.tsx:116,337` — `importOpen` khởi tạo false),
    // nên ô nhập tệp chưa có trong DOM: phải bấm "Nhập ảnh có nguồn" như người dùng. Lượt chạy đầu
    // ngã đúng ở đây (`setInputFiles` hết 30s), và đó là bộ đo thiếu bước, không phải app hỏng.
    await p.page.getByRole('button', { name: /Nhập ảnh có nguồn|Import sourced image/ }).first().click({ timeout: 15000 });
    await cho(2500);
    // GẮN ĐỊNH NGHĨA #2: giấy phép — nó đi vào `tags` qua `buildInspirationTags` (`:227`).
    try {
      await p.page.locator('select.ins-select').filter({ has: p.page.locator('option[value="cc0"]') }).first().selectOption('cc0', { timeout: 6000 });
      st.datGiayPhep = true;
    } catch { st.datGiayPhep = false; }
    await p.page.locator('input[type="file"]').first().setInputFiles(st.tepAnh);
    await cho(9000); // đọc tệp → smartImportImage → POST → refresh
    await chup(p.page, 'J13-2-inspiration-da-tai-len');
  },
  async ghiXuong(p, mt, st) {
    return {
      manifest: await docManifestIngest(p.page),
      kho: await docKhoLibraryAsset(p.page, J13_DAU_VET),
      dia: await docTepTrenDia(mt.duongDb, J13_DAU_VET, st.bamNguon),
    };
  },
  async vaoLai(p) {
    await p.page.goto(`${GOC}/library/ingest`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(5000);
    await chup(p.page, 'J13-3-mo-lai-ingest');
    await p.page.goto(`${GOC}/inspiration`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await chup(p.page, 'J13-4-mo-lai-inspiration');
  },
  soSanh(truoc, sau, st) {
    const loi = [];
    // ① manifest của trang ingest
    const mTruoc = (truoc.manifest?.asset ?? []).filter((a) => a.ten.includes(J13_DAU_VET));
    const mSau = (sau.manifest?.asset ?? []).filter((a) => a.ten.includes(J13_DAU_VET));
    if (!mTruoc.length) loi.push(`① /library/ingest KHÔNG ghi tệp vào manifest (khoá studio::/studio-ref-manifest: ${JSON.stringify(truoc.manifest).slice(0, 140)})`);
    else if (!mSau.length) loi.push('① manifest mất tệp sau khi đóng app');
    else if (st.datUsage && mSau[0].usage !== 'material') loi.push(`① định nghĩa đã gắn không sống sót: usage="${mSau[0].usage}", đợi "material"`);
    // ② hàng LibraryAsset đọc qua đúng cửa app
    if (!sau.kho?.ok) loi.push(`② GET /api/library không trả được (${sau.kho?.ma ?? sau.kho?.loi})`);
    else if (!sau.kho.mon.length) loi.push('② sau khi đóng app: kho Thư viện KHÔNG còn hàng nào mang dấu vết ' + J13_DAU_VET);
    // ③ BYTE THẬT TRÊN ĐĨA — vế nặng nhất, và là vế app không tự kiểm
    const hang = sau.dia?.hang ?? [];
    if (!hang.length) loi.push('③ CSDL không có hàng LibraryAsset nào — cửa ghi không chạy');
    else {
      const mat = hang.filter((h) => !h.coTep);
      if (mat.length) loi.push(`③ ${mat.length} hàng DB trỏ vào tệp KHÔNG tồn tại trong uploads/`);
      if (!sau.dia.khopNguon) loi.push(`③ không tệp nào trên đĩa khớp băm nguồn ${st.bamNguon} (đĩa: ${hang.map((h) => h.bam).join(',')})`);
    }
    if (loi.length) return { dat: false, vi: loi.join(' · ') };
    const h = hang.find((x) => x.bam === st.bamNguon) ?? hang[0];
    return {
      dat: true,
      vi: `① manifest \`studio::/studio-ref-manifest\` giữ tệp thô (usage="${mSau[0].usage}") qua lần đóng app · ② \`GET /api/library\` còn ${sau.kho.mon.length} hàng (tags "${String(sau.kho.mon[0].tags).slice(0, 60)}") · ③ byte trên đĩa \`uploads/\`: ${h.byte} B, sha256 ${h.bam} — KHỚP tệp nguồn`,
      ghiChu: `⚠️ LỆCH MA TRẬN: đường \`/library/ingest\` (cột "đường vào" của J13) KHÔNG sinh \`LibraryAsset\` và KHÔNG đặt byte nào lên đĩa — nó chỉ ghi manifest IDB. Hàng DB + tệp đĩa ở trên đến từ \`/inspiration\` → POST /api/library. Hai đường, một cột.`,
    };
  },
};


/* ═══════════════ LƯỢT 7 (05/09) — J21 · XUẤT GÓI `.idfp` → MỞ TỆP RA SOI → MÁY SẠCH NẠP LẠI ═══ */

/**
 * MỞ TỆP `.idfp` RA SOI — bằng `JSON.parse` thuần, KHÔNG hỏi lại app đã sinh ra nó.
 *
 * ⛔ BÀI HỌC J20 (`JOURNEY-MATRIX` §1.6b), ĐỪNG LẶP: bộ khẳng định vòng đầu chỉ hỏi *mở được ·
 * có trang · đủ byte* nên nó **cho một trang trắng tinh đi qua với chữ PASS**. Với `.idfp` — một
 * gói JSON — ba câu đó còn rẻ hơn nữa: `{"idfpVersion":1,"sheets":[]}` dài 34 byte đã "hợp lệ".
 * Nên ở đây soi tới tận **phần tử của từng slide**, và soi luôn **chữ placeholder** (`makeText()`
 * đặt mặc định "Nhập nội dung", `lib/present-editor/model.ts` — đúng lỗi F1 mà mắt người bắt được
 * còn máy thì không, vì trong PDF nó đã thành điểm ảnh; trong `.idfp` thì nó là CHỮ, grep được).
 */
function soiIdfp(duong) {
  const kichThuoc = statSync(duong).size;
  let j;
  try {
    j = JSON.parse(readFileSync(duong, 'utf8'));
  } catch (e) {
    return { hopLe: false, kichThuoc, loi: `JSON hỏng: ${String(e.message || e).slice(0, 100)}` };
  }
  const sheets = Array.isArray(j?.sheets) ? j.sheets : [];
  const slides = sheets.flatMap((s) => s?.deck?.slides ?? []);
  const els = slides.flatMap((sl) => sl?.elements ?? []);
  const chu = els.filter((e) => typeof e?.text === 'string').map((e) => String(e.text));
  const anhNhung = els.filter((e) => typeof e?.src === 'string' && e.src.startsWith('data:')).length;
  const anhLink = els.filter((e) => typeof e?.src === 'string' && !e.src.startsWith('data:')).length;
  return {
    hopLe: true,
    kichThuoc,
    phienBan: j?.idfpVersion ?? null,
    coBrandKit: !!j?.brandKit,
    soHoSo: sheets.length,
    soTrang: slides.length,
    soPhanTu: els.length,
    loaiPhanTu: [...new Set(els.map((e) => String(e?.kind ?? e?.type ?? '?')))].join(','),
    chu,
    // Placeholder trong tệp GIAO ĐI — `CHUAN-DAU-RA-NGHE` §4 đòi 0 placeholder. `.idfp` là gói
    // "mở lại chỉnh tiếp" nên nó KHÔNG cùng luật với PDF giao khách; đo và khai, không phán vội.
    coPlaceholder: chu.filter((t) => /Nhập nội dung|Enter text/i.test(t)).length,
    anhNhung,
    anhLink,
  };
}

/** Đọc kho Trình bày trong IndexedDB — cùng lăng kính J12 dùng (`deck.slides[].elements[]`). */
async function docKhoTrinhBay(page, userId, duAn) {
  const kho = await docKhoSheets(page);
  const khoaDung = `${userId}::/present-editor::${duAn}`;
  const ban = kho.ban.find((b) => b.khoa === khoaDung) ?? null;
  return { khoaDung, soTrang: ban?.soTrang ?? 0, soPhanTu: ban?.soPhanTu ?? 0, moiKhoa: kho.ban.map((b) => b.khoa) };
}

/**
 * J21 — XUẤT GÓI `.idfp` → SOI TỆP → **MÁY SẠCH** NẠP LẠI ĐƯỢC.
 *
 * `SHIP-BLOCKERS` B4 ghi *".idf/.idfc sinh từ máy sạch chưa chạy lại sau khi thu 11 slice"* và ô
 * đó ⬜ chưa ai mở. Hành trình này mở đúng mắt ấy cho `.idfp`, và mở ở mức gắt nhất mà bất biến
 * cho phép: giữa hai phiên **XOÁ SẠCH hồ sơ trình duyệt** (như J07), nên bản deck quay lại KHÔNG
 * thể đến từ IndexedDB cũ — nó chỉ có thể đến từ CHÍNH TỆP vừa xuất.
 *
 * BA KHẲNG ĐỊNH RỜI NHAU:
 *   ① tệp sinh ra và **soi ra nội dung thật** — có hồ sơ, có trang, có phần tử, không rỗng
 *   ② máy sạch nạp lại: kho Trình bày mọc lại **đúng số trang và số phần tử** của tệp
 *   ③ chữ trong tệp là chữ NGƯỜI DÙNG gõ, không phải placeholder mặc định của model
 */
const J21 = {
  ma: 'J21',
  ten: 'Xuất gói `.idfp` → mở tệp ra soi → MÁY SẠCH nạp lại được',
  chan: 'G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IDBObjectStore.put trên `interiorflow-sheets` ở phiên NẠP LẠI — tệp vẫn mở ra được nhưng không có gì lưu lại',
  async chuanBi(mt) {
    const duAn = await duAnRieng(mt, 'J21');
    // DỰ ÁN THỨ HAI để nạp lại vào. Xoá hồ sơ trình duyệt là CHƯA ĐỦ để có "máy sạch" cho chặng
    // Trình bày: `PresentSheets` cũng ghi bản sao ra ĐĨA và tự khôi phục khi IndexedDB rỗng (cùng
    // họ lưới đỡ máy chủ mà J07 dựa vào ở chặng 2D) ⇒ lượt chạy trước đo ra "máy sạch mà kho đã có
    // sẵn 7 phần tử". Nạp vào một dự án CHƯA TỪNG CÓ GÌ thì con số không thể đến từ đâu khác ngoài
    // chính tệp — và nó chứng minh được điều mạnh hơn: gói mang nội dung SANG DỰ ÁN KHÁC được.
    const duAnNap = await duAnRieng(mt, 'J21b');
    return { duAn, duAnNap };
  },
  async moPhien(mt, st, lan) {
    // Thế giới hỏng chỉ chặn ở phiên 2 (lượt NẠP LẠI): chặn từ phiên 1 thì deck không có gì để
    // xuất, bộ sẽ đỏ vì "chưa dựng được nội dung" — đỏ ở bước TRƯỚC chỗ khẳng định, tức không
    // chứng minh được điều mình định chứng minh (bẫy ③ của phép hiệu chuẩn).
    const p = await moPhienTrinhDuyet(`J21${mt.hauTo}`, { chanIdb: mt.hongCoY && lan === 2 });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${st.duAn}/present`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    // Dự án RIÊNG nên nó rỗng: phải qua cửa "chưa có bản vẽ nào" trước, đúng thao tác người dùng
    // (`ProjectScopeEmptyState`). J20 không cần bước này vì nó dùng dự án chung đã có sẵn nội dung
    // — lượt chạy đầu của J21 ngã đúng ở đây, bộ đo thiếu bước chứ app không hỏng.
    await quaCuaDuAnRong(p.page).catch(() => {});
    st.buocUi = await dungNoiDungTrinhBay(p.page);
    // Chữ RIÊNG của lượt này — để câu "tệp mang đúng nội dung người dùng gõ" kiểm được, chứ
    // không chỉ kiểm "có chữ gì đó".
    st.chuGo = `G2-J21 chu that ${Date.now().toString(36)}`;
    // 🔴 GÕ CHỮ PHẢI VÀO ĐÚNG Ô. Lượt chạy đầu gõ thẳng vào canvas ⇒ chữ KHÔNG vào ô nào và tệp
    // xuất ra toàn `Nhập nội dung` (giá trị mặc định của `makeText()`). Panel bên phải nói đúng
    // cách: *"Nháp đúp chữ để sửa nội dung"* (`Element.tsx:349` → `onEditText`). Đây là sửa BỘ ĐO,
    // không phải sửa app — nhưng nó lộ ra một điều đáng ghi: bằng chứng "deck có nội dung thật"
    // của J20 hoá ra chỉ là ô placeholder.
    try {
      const oChu = p.page.getByText('Nhập nội dung').first();
      await oChu.dblclick({ timeout: 10000 });
      await cho(900);
      await p.page.keyboard.press('Control+a');
      await p.page.keyboard.type(st.chuGo);
      await cho(600);
      await p.page.keyboard.press('Escape');
      await cho(1500);
      st.daGoChu = true;
    } catch { st.daGoChu = false; }
    st.khoTruocKhiXuat = await docKhoTrinhBay(p.page, st.userId, st.duAn);
    await chup(p.page, 'J21-1-deck-truoc-khi-xuat');

    mkdirSync(THU_MUC_ANH, { recursive: true });
    await p.page.locator('button[title="Xuất file từ chặng Trình chiếu"]').first().click({ timeout: 20000 });
    await cho(700);
    const [tai] = await Promise.all([
      p.page.waitForEvent('download', { timeout: 120000 }),
      p.page.getByRole('menuitem', { name: /Toàn bộ project/ }).first().click({ timeout: 15000 }),
    ]);
    st.duongIdfp = path.join(THU_MUC_ANH, 'J21-project.idfp');
    await tai.saveAs(st.duongIdfp);
    await cho(1200);
    await chup(p.page, 'J21-2-sau-khi-xuat');
  },
  /** ĐÓNG HẲN **VÀ XOÁ MÁY** sau phiên 1 — bản nạp lại không được phép nhờ IndexedDB cũ. */
  async dong(p, mt, st, lan) {
    await dongPhien(p);
    if (lan !== 2) {
      await cho(800);
      rmSync(duongHoSo(`J21${mt.hauTo}`), { recursive: true, force: true });
      st.daXoaHoSo = true;
    }
  },
  async vaoLai(p, mt, st) {
    await p.page.goto(`${GOC}/projects/${st.duAnNap}/present`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(7000);
    await boQuaLopChe(p.page);
    // ĐO KHO (dự án nạp) TRƯỚC KHI CHẠM GÌ — đây là bằng chứng "máy thật sự sạch". Đo sau khi đã bấm qua các
    // màn thì con số mất nghĩa (bẫy ④ thế-giới-đã-ấm).
    st.khoLucMaySach = await docKhoTrinhBay(p.page, st.userId, st.duAn);
    // Rồi mới đi vào chỗ có thanh công cụ: qua cửa dự-án-rỗng (nếu còn) + màn chọn lối vào.
    await quaCuaDuAnRong(p.page).catch(() => {});
    for (const ten of [/Trang trống/i, /Tạo hồ sơ trống/i]) {
      const n = p.page.getByRole('button', { name: ten });
      if (await n.count().catch(() => 0)) { await n.first().click({ timeout: 8000 }).catch(() => {}); await cho(2500); break; }
    }
    // `openIdfpFile` hỏi `window.confirm` trước khi thay toàn bộ project (`Toolbar.tsx:229`) —
    // đó là hộp thoại NGƯỜI DÙNG bấm, nên phải trả lời chứ không tắt đi.
    p.page.once('dialog', (d) => d.accept().catch(() => {}));
    // 🔴 PHẢI CHỌN ĐÚNG Ô NHẬP. Toolbar có HAI `input[type=file]`: cổng chung (`Toolbar.tsx:613`,
    // KHÔNG khai `accept`) và ô nhận ẢNH (`:694`, `accept="image/*"`). Lượt đầu bộ đo lấy `.last()`
    // ⇒ tệp `.idfp` bị nạp như một tấm ẢNH, kho mọc ra đúng 1 phần tử `image` — đọc ra như "app
    // nạp thiếu", trong khi app chưa hề được yêu cầu mở project. Lọc theo `:not([accept])`.
    await p.page.locator('input[type="file"]:not([accept])').first().setInputFiles(st.duongIdfp);
    await cho(9000);
    await chup(p.page, 'J21-3-may-sach-da-nap-lai');
  },
  async ghiXuong(p, mt, st) {
    // Lượt 1 đọc kho của dự án NGUỒN, lượt 2 đọc kho của dự án ĐÍCH — hai con số khác vai, không
    // được gộp: cái đầu nói "đã dựng được nội dung", cái sau nói "gói nạp lại được".
    const duAnDoc = st.lan === 2 ? st.duAnNap : st.duAn;
    return {
      tep: st.duongIdfp && existsSync(st.duongIdfp) ? soiIdfp(st.duongIdfp) : { hopLe: false, viSao: 'không có tệp' },
      kho: await docKhoTrinhBay(p.page, st.userId, duAnDoc),
    };
  },
  soSanh(truoc, sau, st) {
    const t = sau.tep;
    const loi = [];
    // ① SOI TỆP
    if (!t?.hopLe) loi.push(`① tệp .idfp không mở ra được: ${t?.loi ?? t?.viSao}`);
    else {
      if (!t.soHoSo) loi.push('① gói có 0 hồ sơ');
      if (!t.soTrang) loi.push('① gói có 0 trang');
      if (!t.soPhanTu) loi.push(`① gói có 0 phần tử — GÓI RỖNG (đúng ca "trang trắng" mà J20 từng cho đi qua)`);
    }
    // ② MÁY SẠCH NẠP LẠI
    if (!st.daXoaHoSo) loi.push('② bộ đo không xoá được hồ sơ ⇒ phép "máy sạch" không thành');
    if ((st.khoLucMaySach?.soPhanTu ?? 0) > 0) loi.push(`② dự án đích chưa từng có gì mà kho đã có sẵn ${st.khoLucMaySach.soPhanTu} phần tử — phép đo không sạch, mọi kết luận sau vô nghĩa`);
    if ((sau.kho?.soPhanTu ?? 0) < (t?.soPhanTu ?? 0)) loi.push(`② nạp lại thiếu: tệp mang ${t?.soPhanTu} phần tử, kho sau khi nạp chỉ có ${sau.kho?.soPhanTu} (khoá ${sau.kho?.khoaDung})`);
    if ((sau.kho?.soTrang ?? 0) < (t?.soTrang ?? 0)) loi.push(`② nạp lại thiếu trang: tệp ${t?.soTrang}, kho ${sau.kho?.soTrang}`);
    if (loi.length) return { dat: false, vi: loi.join(' · ') };
    return {
      dat: true,
      vi: `tệp ${path.basename(st.duongIdfp)} (${(t.kichThuoc / 1024).toFixed(1)} KB, idfpVersion ${t.phienBan}, brandKit ${t.coBrandKit ? 'có' : 'không'}) soi ra ${t.soHoSo} hồ sơ · ${t.soTrang} trang · ${t.soPhanTu} phần tử [${t.loaiPhanTu}]; XOÁ SẠCH hồ sơ trình duyệt rồi mở một DỰ ÁN KHÁC chưa từng có gì (kho = ${st.khoLucMaySach.soPhanTu} phần tử) → nạp tệp → kho mọc lên ${sau.kho.soPhanTu} phần tử / ${sau.kho.soTrang} trang ở khoá ${sau.kho.khoaDung}`,
      ghiChu: t.coPlaceholder
        ? `🔴 MỞ TỆP RA SOI THẤY: ${t.coPlaceholder}/${t.soPhanTu} ô chữ mang nguyên văn "Nhập nội dung" — giá trị mặc định của \`makeText()\` (\`lib/present-editor/model.ts\`), tức đúng lỗi F1 mà J20 bắt được trên PDF, nay tái hiện trên \`.idfp\`. Khác PDF ở chỗ đắt giá: trong \`.idfp\` nó là CHỮ nên **máy grep được**, còn trong PDF nó đã thành điểm ảnh và chỉ mắt người bắt nổi. Kèm: ${t.chu.length} ô chữ đều **không có \`x\`/\`y\`** trong tệp ⇒ chồng khít một chỗ, nhìn trên màn tưởng chỉ có một ô.`
        : `ảnh nhúng ${t.anhNhung} · ảnh liên kết ngoài ${t.anhLink}`,
    };
  },
};


/* ═══════════════ LƯỢT 7 (05/09) — J14 · DÙNG VẬT LIỆU → BOQ KHỚP SỐ ═══════════════ */

// 🔴 ĐỔI MÓN SAU KHI ĐO ĐƯỢC LỖ CHẶN (xem báo cáo): thả từ kho `.idfc` cho ra **nét rời**
// (`LibraryDropBridge.tsx:112` tự khai *"specId KHÔNG gắn được lên nét rời — schema chỉ cho
// Block/Hatch entity mang specId"*) ⇒ cấu kiện `.idfc` **không bao giờ lên BOQ**, và tệ hơn là
// BOQ cũng KHÔNG báo `missing-specId-item` vì nét rời không được đếm là món rời. Nhánh ĐANG SỐNG
// là `via:'blockdef'` (`:145` gắn `specId` thật), nên hành trình đo nhánh đó: món `SOFA-3S` của
// kệ "Ký hiệu · khối" (`lib/library/shelves.ts:189`).
const J14_MA = 'SOFA-3S';
const J14_SPEC_ID = 'ps-g2-j14-ghe';
const J14_GIA = 1_500_000;
const J14_HAO = 10;

/** Gieo MỘT bản ghi `ProductSpec` có giá thật, `sku` = mã cấu kiện ⇒ `matchSpec` (`lib/library/
 *  spec-panel.ts:51`, khớp `code` ↔ `sku`) nối được món trong kệ với hàng giá. CSDL sạch có **0**
 *  ProductSpec (đo tại nguồn 05/09), mà `computeBoq` chỉ ra số khi entity mang `specId` trỏ tới một
 *  spec CÓ `priceVnd` — không gieo thì không có gì để nói chuyện "khớp". */
async function gieoSpecJ14(duongDb) {
  const { PrismaClient } = require('@prisma/client');
  const pr = new PrismaClient({ datasources: { db: { url: `file:${duongDb}` } } });
  try {
    const data = {
      kind: 'furniture', name: 'Ghế G2 J14', sku: J14_MA, vendor: 'NCC Kiểm',
      unit: 'cai', priceVnd: J14_GIA, wastagePercent: J14_HAO, materials: '[]', finishes: '[]',
    };
    await pr.productSpec.upsert({ where: { id: J14_SPEC_ID }, create: { id: J14_SPEC_ID, ...data }, update: data });
    const s = await pr.productSpec.findUnique({ where: { id: J14_SPEC_ID }, select: { id: true, sku: true, priceVnd: true, wastagePercent: true, matId: true } });
    // ⚠️ Prisma trả `Decimal` cho cả hai cột số ⇒ so `!==` với số JS luôn TRƯỢT dù giá trị bằng
    // nhau (lượt trước báo "hao hụt BOQ 10% ≠ kho 10%"). Ép về `number` NGAY TẠI NGUỒN đọc.
    return { id: s.id, sku: s.sku, priceVnd: Number(s.priceVnd), wastagePercent: Number(s.wastagePercent), matId: s.matId };
  } finally {
    await pr.$disconnect();
  }
}

/** Gọi ĐÚNG cửa mà màn BOQ đi (`BoqScreen.tsx:160` → `POST /api/boq/[projectId]` với Doc sống).
 *  Chạy trong page nên cookie phiên đi kèm; Doc lấy từ IndexedDB của chính phiên đó. */
function docBangBoq(page, duAn, userId) {
  return page.evaluate(
    async ([pid, uid]) => {
      const doc = await new Promise((res) => {
        let xong = false;
        const tra = (v) => { if (!xong) { xong = true; res(v); } };
        setTimeout(() => tra(null), 8000);
        let rq;
        try { rq = indexedDB.open('interiorflow-sheets'); } catch { return tra(null); }
        rq.onerror = () => tra(null);
        rq.onsuccess = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains('sheets')) return tra(null);
          const g = db.transaction('sheets', 'readonly').objectStore('sheets').get(`${uid}::/cad-editor::${pid}`);
          g.onerror = () => tra(null);
          g.onsuccess = () => tra(g.result?.sheets?.[0]?.doc ?? null);
        };
      });
      if (!doc) return { coDoc: false };
      const ents = doc.entities ?? [];
      const mangSpec = ents.filter((e) => e?.specId).map((e) => ({ type: e.type, specId: e.specId }));
      const r = await fetch(`/api/boq/${pid}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc }),
      });
      if (!r.ok) return { coDoc: true, soThucThe: ents.length, mangSpec, ok: false, ma: r.status };
      const j = await r.json();
      return {
        coDoc: true, soThucThe: ents.length, mangSpec, ok: true,
        rows: (j.rows ?? []).map((x) => ({ specId: x.specId ?? x.matId, ten: x.ten ?? x.name, kind: x.kind, khoiLuong: x.khoiLuong ?? x.qty, donGia: x.donGia ?? x.priceVnd, hao: x.haoHutPhanTram ?? x.wastagePercent, thanhTien: x.thanhTien ?? x.amount })),
        errors: (j.errors ?? []).map((e) => `${e.code ?? e.ma ?? '?'}:${e.specId ?? e.matId ?? ''}`),
        tong: j.totalAmount,
      };
    },
    [duAn, userId],
  );
}

/** Thả một món từ tấm Thư viện xuống bản vẽ đang mở — đường người dùng thật
 *  (`LibrarySheet.instantiate` → sự kiện → `LibraryDropBridge`). */
async function thaMonTuThuVien(page, ma) {
  const buoc = [];
  // 🔴 KHÔNG DÙNG PHÍM `l` Ở CHẶNG 2D. Đo được ở lượt chạy đầu (ảnh `J14-0`): phím `l` bị **dòng
  // lệnh CAD nuốt** — bảng gợi ý `L / LEN / LINE / LENGTHEN` bật lên, tấm Thư viện KHÔNG mở. Cùng
  // phím đó chạy đúng ở `/files` (J15 dùng được), nên đây là **va phím tắt theo chặng**, không
  // phải phím hỏng. Đường chắc chắn là bấm nút "Thư viện" ở chân panel trái.
  await page.keyboard.press('Escape').catch(() => {});
  await cho(500);
  const nutTV = page.getByRole('button', { name: /^Thư viện$/ });
  if (await nutTV.count().catch(() => 0)) {
    await nutTV.first().click({ timeout: 10000 });
    buoc.push('bấm nút Thư viện');
  } else {
    await page.keyboard.press('l');
    buoc.push('phím l (không thấy nút)');
  }
  await cho(3000);
  // Tấm mở ra ở kệ "Ký hiệu · khối"; món `.idfc` vừa nhập nằm ở kệ **Cấu kiện (.idfc)** — không
  // chuyển kệ thì ô tìm trả "Không có món nào khớp bộ lọc" (đo được ở ảnh `J14-0` lượt trước).
  try {
    await page.locator('.if-lib-root').getByText(/Ký hiệu · khối/).first().click({ timeout: 8000 });
    await cho(1500);
    buoc.push('chuyển kệ Ký hiệu · khối');
  } catch { buoc.push('KHÔNG chuyển được kệ'); }
  // Ô tìm của tấm Thư viện — gõ mã để lọc đúng món vừa nhập.
  try {
    const o = page.locator('.if-lib-root input[type="search"], .if-lib-root input').first();
    await o.fill(ma, { timeout: 6000 });
    await cho(1500);
    buoc.push('lọc theo mã');
  } catch { buoc.push('KHÔNG lọc được'); }
  await chup(page, 'J14-0-tam-thu-vien-truoc-khi-chon');
  buoc.push(`kệ đang có: ${(await page.locator('.if-lib-root').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200)}`);
  // Bấm chính thẻ món (nhãn mang tên + mã).
  const the = page.locator('.if-lib-root').getByText(ma, { exact: false }).first();
  await the.click({ timeout: 12000 });
  await cho(1200);
  buoc.push('chọn món');
  // Nhãn THẬT của nút thả (`LibrarySheet.tsx:1109-1112`): "Kéo ra bàn làm việc" (mechanic `keo`)
  // hoặc "Dùng cho vật đang chọn" (mechanic `ap`). Bốn nhãn bộ đo đoán ở lượt trước đều không có
  // thật ⇒ nó bấm hụt, bản vẽ 0 thực thể mà không ai báo lỗi.
  for (const ten of [/Kéo ra bàn làm việc/i, /Dùng cho vật đang chọn/i, /^Sửa bản sao$/]) {
    const n = page.locator('.if-lib-root').getByRole('button', { name: ten });
    if (await n.count().catch(() => 0)) { await n.first().click({ timeout: 8000 }); buoc.push(`bấm ${ten}`); break; }
  }
  await cho(3000);
  await page.keyboard.press('Escape').catch(() => {});
  await cho(1500);
  return buoc;
}

/**
 * J14 — DÙNG MỘT VẬT LIỆU → XUẤT BOQ → SỐ TRONG BOQ KHỚP VẬT LIỆU.
 *
 * ⚠️ NỢ DỮ LIỆU ĐÃ BIẾT, KHAI TRƯỚC KHI ĐO: `ProductSpec.matId` **toàn `null`** (backfill treo từ
 * 19/08, `scripts/backfill-material-matid.ts` mặc định dry-run) ⇒ **nhánh `matId` chưa chạy sống
 * lần nào**. Hành trình này đo nhánh ĐANG SỐNG — `specId` (= `ProductSpec.id`, khoá mà
 * `computeBoq` thật sự dùng, `lib/boq/model.ts`) — và **ghi lại giá trị `matId` đọc được**, không
 * bịa dữ liệu để bảng xanh.
 *
 * KHẲNG ĐỊNH: ① bản vẽ có entity mang `specId` ② BOQ ra dòng cho đúng spec đó, **đơn giá và hao
 * hụt bằng ĐÚNG số trong CSDL** ③ đóng app mở lại: vẫn ra đúng bảng đó (Doc sống trong IndexedDB,
 * giá sống trong CSDL — hai nơi lưu khác nhau, cùng phải sống sót).
 */
const J14 = {
  ma: 'J14',
  ten: 'Dùng một vật liệu → BOQ → đơn giá/hao hụt khớp kho giá, còn đúng sau khi đóng app',
  chan: 'G5',
  loai: 'trinh-duyet',
  hieuChuanMo: 'chặn IDBObjectStore.put trên `interiorflow-sheets` — bản vẽ không lưu được nên BOQ không còn gì để tính',
  async chuanBi(mt) {
    const duAn = await duAnRieng(mt, 'J14');
    const spec = await gieoSpecJ14(mt.duongDb);
    const thuMuc = path.join(os.tmpdir(), `g2-j14${mt.hauTo}`);
    mkdirSync(thuMuc, { recursive: true });
    const tep = path.join(thuMuc, 'ghe-j14.idfc');
    writeFileSync(tep, JSON.stringify({
      idfcVersion: 3,
      meta: { name: 'Ghế G2 J14', code: J14_MA, kind: 'furniture', createdAt: '2026-09-05T00:00:00.000Z', modifiedAt: new Date().toISOString(), appVersion: 'interiorflow-1.0.0' },
      // ⚠️ Khoá của `Prim` là **`k`**, không phải `t` (`lib/cad/furniture.ts:18-22`). Lượt trước bộ
      // đo dựng `{t:'rect'}` ⇒ hình học rỗng, và app **báo đúng sự thật** ở thanh trạng thái:
      // *"«Ghế G2 J14» là mẫu .idfc không mang hình vẽ 2D — chưa thả xuống bản vẽ được"*. Nó
      // KHÔNG thả bừa một khối rỗng rồi để BOQ đếm nhầm — điểm này đáng ghi có lợi cho app.
      body: {
        type: 'component',
        geom2d: {
          group: 'Phòng khách', w: 500, h: 500,
          prims: [{ k: 'poly', pts: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 500 }, { x: 0, y: 500 }], closed: true }],
        },
      },
    }));
    return { duAn, spec, tepIdfc: tep };
  },
  async moPhien(mt, st, lan) {
    const p = await moPhienTrinhDuyet(`J14${mt.hauTo}`, { chanIdb: mt.hongCoY });
    const me = await p.ctx.request.get(`${GOC}/api/auth/me`);
    st.userId = (await me.json())?.user?.id || (await dangNhap(p.ctx));
    st.lan = lan;
    return p;
  },
  async thaoTac(p, mt, st) {
    // ① đưa cấu kiện vào kệ (kệ Cấu kiện đọc `loadIdfcStore()`)
    await p.page.goto(`${GOC}/files`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    // (không cần nhập .idfc nữa — món SOFA-3S là hàng sẵn của kệ "Ký hiệu · khối")
    // ② mở bản vẽ 2D rồi THẢ món xuống — đây là "dùng một vật liệu"
    await moMatVe(p.page, st.duAn);
    st.buocTha = await thaMonTuThuVien(p.page, J14_MA);
    await cho(2500);
    await chup(p.page, 'J14-1-da-tha-mon-xuong-ban-ve');
    // ③ mở màn BOQ bằng tay (thao tác thật; số thì đọc từ nơi tính, không đọc chữ trên màn)
    await p.page.goto(`${GOC}/projects/${st.duAn}/present`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(6000);
    await boQuaLopChe(p.page);
    await quaCuaDuAnRong(p.page).catch(() => {});
    for (const ten of [/Bảng khối lượng/i, /^BOQ$/]) {
      const n = p.page.getByRole('button', { name: ten });
      if (await n.count().catch(() => 0)) { await n.first().click({ timeout: 8000 }).catch(() => {}); await cho(4000); st.moManBoq = true; break; }
    }
    await chup(p.page, 'J14-2-man-boq');
  },
  async ghiXuong(p, mt, st) {
    return docBangBoq(p.page, st.duAn, st.userId);
  },
  async vaoLai(p, mt, st) {
    await moMatVe(p.page, st.duAn);
    await cho(4000);
    await chup(p.page, 'J14-3-mo-lai-sau-khi-dong');
  },
  soSanh(truoc, sau, st) {
    const loi = [];
    if (!truoc.coDoc) loi.push('① sau khi thả: KHÔNG có Doc nào trong IndexedDB');
    else if (!truoc.mangSpec?.length) loi.push(`① thả xong nhưng KHÔNG entity nào mang specId (bản vẽ có ${truoc.soThucThe} thực thể; bước đã bấm: ${(st.buocTha ?? []).join(' → ')})`);
    const dong = (kq) => (kq?.rows ?? []).find((r) => r.specId === st.spec.id) ?? null;
    const t = dong(truoc);
    const s = dong(sau);
    if (!t) loi.push(`② BOQ ngay sau khi thả KHÔNG có dòng cho spec ${st.spec.id} (dòng: ${JSON.stringify(truoc.rows ?? []).slice(0, 160)} · lỗi: ${(truoc.errors ?? []).join(',')})`);
    else {
      if (Number(t.donGia) !== st.spec.priceVnd) loi.push(`② đơn giá BOQ ${t.donGia} ≠ giá trong kho ${st.spec.priceVnd}`);
      if (Number(t.hao) !== st.spec.wastagePercent) loi.push(`② hao hụt BOQ ${t.hao}% ≠ kho ${st.spec.wastagePercent}%`);
      const cho_ = Math.round(Number(t.khoiLuong) * st.spec.priceVnd * (1 + st.spec.wastagePercent / 100));
      if (Math.abs(Number(t.thanhTien) - cho_) > 1) loi.push(`② thành tiền ${t.thanhTien} ≠ ${t.khoiLuong}×${st.spec.priceVnd}×(1+${st.spec.wastagePercent}%) = ${cho_}`);
    }
    if (!s) loi.push('③ sau khi ĐÓNG APP mở lại: BOQ mất dòng — bản vẽ hoặc kho giá không sống sót');
    else if (t && (Number(s.thanhTien) !== Number(t.thanhTien) || Number(s.khoiLuong) !== Number(t.khoiLuong)))
      loi.push(`③ mở lại ra số KHÁC: trước ${t.khoiLuong}×${t.donGia}=${t.thanhTien}, sau ${s.khoiLuong}×${s.donGia}=${s.thanhTien}`);
    if (loi.length) return { dat: false, vi: loi.join(' · ') };
    return {
      dat: true,
      vi: `thả 1 cấu kiện mang \`specId=${st.spec.id}\` xuống bản vẽ → \`POST /api/boq\` ra dòng ${s.kind}: khối lượng ${s.khoiLuong}, đơn giá ${s.donGia} và hao ${s.hao}% ĐÚNG BẰNG hàng \`ProductSpec\` trong CSDL, thành tiền ${s.thanhTien}; đóng app mở lại vẫn ra y hệt (Doc ở IndexedDB, giá ở CSDL — hai nơi lưu, cùng sống sót)`,
      ghiChu: `⚠️ NỢ DỮ LIỆU ĐANG SỐNG: \`ProductSpec.matId\` của chính hàng này đọc ra **${st.spec.matId === null ? 'null' : st.spec.matId}** ⇒ nhánh matId-UUID vẫn CHƯA chạy sống lần nào; hành trình này đo nhánh \`specId\` — nhánh mà \`computeBoq\` thật sự dùng. Backfill (\`scripts/backfill-material-matid.ts\`, dry-run) vẫn là việc chưa làm.`,
    };
  },
};

const HANH_TRINH = [J16, J16b, J23, J17, J19, J20, J07, J12, J04, J06, J18, J22, J05, J15, J13, J21, J14];

/* ─────────────────────────── khung chạy ─────────────────────────── */

const ketQua = [];

function ghi(ht, trangThai, vi, ghiChu = '') {
  ketQua.push({ ma: ht.ma, ten: ht.ten, trangThai, vi, ghiChu });
  const bieu = { PASS: '✅ PASS', FAIL: '❌ FAIL', LOI: '💥 LỖI' }[trangThai] ?? trangThai;
  console.log(`\n${bieu}  ${ht.ma} · ${ht.ten}`);
  console.log(`   ${vi}`);
  if (ghiChu) console.log(`   ⚠️ ${ghiChu}`);
}

/**
 * BẤT BIẾN NẰM Ở ĐÂY, KHÔNG NẰM TRONG TỪNG HÀNH TRÌNH. Hành trình chỉ khai *làm gì*;
 * *thứ tự* và *nghĩa của đạt* thuộc về khung.
 */
async function chayMot(ht, mt) {
  const st = {};
  let p1 = null;
  let p2 = null;
  try {
    if (ht.chuanBi) Object.assign(st, await ht.chuanBi(mt));

    // ① THAO TÁC
    p1 = await ht.moPhien(mt, st, 1);
    await ht.thaoTac(p1, mt, st);

    // ② GHI XUỐNG — đọc từ nơi lưu thật, ngay sau thao tác
    const truoc = await ht.ghiXuong(p1, mt, st);

    // ③ ĐÓNG HẲN
    if (ht.dong) await ht.dong(p1, mt, st, 1);
    else await dongPhien(p1);
    p1 = null;
    await cho(1200);

    // ④ VÀO LẠI — phiên MỚI trên CÙNG thế giới (hồ sơ trên đĩa / đĩa)
    p2 = await ht.moPhien(mt, st, 2);
    await ht.vaoLai(p2, mt, st);

    // ⑤ CÙNG MỘT SỰ THẬT
    const sau = await ht.ghiXuong(p2, mt, st);
    if (ht.dong) await ht.dong(p2, mt, st, 2);
    else await dongPhien(p2);
    p2 = null;

    const kq = ht.soSanh(truoc, sau, st);
    ghi(ht, kq.dat ? 'PASS' : 'FAIL', kq.vi, kq.ghiChu);
    return kq.dat;
  } catch (e) {
    ghi(ht, 'LOI', String(e?.message || e).slice(0, 400));
    return false;
  } finally {
    if (p1) await dongPhien(p1).catch(() => {});
    if (p2) await dongPhien(p2).catch(() => {});
  }
}

/**
 * HIỆU CHUẨN — dựng thế giới BIẾT CHẮC HỎNG rồi đòi ĐÚNG bộ khẳng định đó phải ĐỎ.
 * Bộ nghiệm thu không đỏ nổi ở ca hỏng thì mọi chữ PASS của nó vô giá trị.
 */
async function hieuChuan(mtGoc) {
  console.log('\n══════ HIỆU CHUẨN — ca biết-chắc-hỏng phải ĐỎ ══════');
  const mt = { ...mtGoc, hongCoY: true, hauTo: '-hong' };
  // Nguồn danh sách là CHÍNH khai báo hành trình (`hieuChuanMo`) — không còn danh sách gõ cứng
  // ở đây. Thêm hành trình mà quên khai thế-giới-hỏng thì nó LỘ RA ở dòng "KHÔNG KHAI HIỆU
  // CHUẨN" bên dưới, thay vì im lặng trôi qua với chữ PASS.
  const cas = HANH_TRINH.filter((h) => h.hieuChuanMo).map((h) => ({ ht: h, mo: h.hieuChuanMo }));
  const thieu = HANH_TRINH.filter((h) => !h.hieuChuanMo).map((h) => h.ma);
  if (thieu.length) console.log(`⚠️ KHÔNG KHAI HIỆU CHUẨN: ${thieu.join(', ')} — mọi chữ PASS của chúng chỉ là lời khai`);
  let tatCaDo = true;
  for (const { ht, mo } of cas) {
    if (CHI_CA && ht.ma !== CHI_CA) continue;
    rmSync(duongHoSo(`${ht.ma}${mt.hauTo}`), { recursive: true, force: true });
    console.log(`\n· ${ht.ma}: ${mo}`);
    await chayMot(ht, mt);
    const r = ketQua.pop(); // kết quả hiệu chuẩn không tính vào bảng tổng
    // ⛔ ĐỎ VÌ HẠ TẦNG KHÔNG TÍNH LÀ ĐỎ. Nếu bộ ngã vì không mở nổi trình duyệt thì nó
    // "đỏ" ở MỌI thế giới, kể cả thế giới lành — đúng kiểu máy canh mù mà vẫn báo đạt.
    if (r?.trangThai === 'FAIL') {
      console.log(`   ✔ đúng như phải thế — ${ht.ma} ĐỎ vì bộ khẳng định, không vì hạ tầng`);
    } else if (r?.trangThai === 'LOI') {
      console.log(`   💀 HIỆU CHUẨN KHÔNG KẾT LUẬN: ${ht.ma} ngã vì hạ tầng (${r.vi.slice(0, 120)}) — không phải phép đo.`);
      tatCaDo = false;
    } else {
      console.log(`   💀 HIỆU CHUẨN HỎNG: ${ht.ma} vẫn báo ĐẠT trong thế giới đã hỏng.`);
      tatCaDo = false;
    }
  }
  console.log(tatCaDo ? '\n✅ HIỆU CHUẨN ĐẠT — bộ này biết báo đỏ.' : '\n❌ HIỆU CHUẨN TRƯỢT.');
  return tatCaDo;
}

async function main() {
  if (!DB) { console.error('⛔ thiếu --db=file:<đường tuyệt đối tới dev.db>'); process.exit(2); }
  const duongDb = DB.replace(/^file:/, '');

  // gieo tài khoản + dự án vào ĐÚNG CSDL được chỉ định (tuyệt đối, không nhờ .env)
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const pr = new PrismaClient({ datasources: { db: { url: DB } } });
  const hash = await bcrypt.hash(TK.matKhau, 10);
  const u = await pr.user.upsert({
    where: { email: TK.email },
    update: { passwordHash: hash },
    create: { email: TK.email, name: 'G2', passwordHash: hash },
    select: { id: true },
  });
  let da = await pr.project.findFirst({ where: { userId: u.id, name: 'G2 hanh trinh' } });
  if (!da) da = await pr.project.create({ data: { userId: u.id, name: 'G2 hanh trinh' } });
  await pr.projectMember.upsert({
    where: { projectId_userId: { projectId: da.id, userId: u.id } },
    update: { role: 'owner' },
    create: { projectId: da.id, userId: u.id, role: 'owner' },
  });
  await pr.$disconnect();

  const mt = { GOC, duongDb, duAn: da.id, userId: u.id, hongCoY: false, hauTo: '' };
  console.log(`· gốc ${GOC} · dự án ${da.id} · user ${u.id}`);

  if (HIEU_CHUAN) {
    const ok = await hieuChuan(mt);
    process.exit(ok ? 0 : 1);
  }

  const okHieuChuan = BO_HIEU_CHUAN ? null : await hieuChuan(mt);

  console.log('\n══════ LÔ HÀNH TRÌNH ══════');
  for (const ht of HANH_TRINH) {
    if (CHI_CA && ht.ma !== CHI_CA) continue;
    rmSync(duongHoSo(ht.ma), { recursive: true, force: true }); // máy sạch trước mỗi hành trình
    await chayMot(ht, mt);
  }

  console.log('\n══════ BẢNG TỔNG ══════');
  for (const r of ketQua) console.log(`${r.trangThai.padEnd(5)} ${r.ma}  ${r.ten}`);
  // ⚠️ HIỆU CHUẨN THOÁI HOÁ. Hành trình ĐỎ ngay ở thế giới LÀNH thì phép hiệu chuẩn của nó
  // không chứng minh được gì: nó đỏ ở cả hai thế giới, đúng thứ khung này cấm coi là bằng chứng
  // (xem docstring `hieuChuan`). Nói thẳng ra thay vì để chữ "HIỆU CHUẨN ĐẠT" che mất.
  const doSan = ketQua.filter((r) => r.trangThai === 'FAIL').map((r) => r.ma);
  if (doSan.length)
    console.log(`\n⚠️ HIỆU CHUẨN THOÁI HOÁ cho ${doSan.join(', ')} — đã đỏ ở thế giới lành, nên đỏ ở thế giới hỏng KHÔNG chứng minh gì.`);
  const chuaChay = HANH_TRINH.filter((h) => !ketQua.some((r) => r.ma === h.ma));
  for (const h of chuaChay) console.log(`CHƯA  ${h.ma}  ${h.ten}`);
  const dat = ketQua.filter((r) => r.trangThai === 'PASS').length;
  console.log(`\nĐẠT ${dat}/${ketQua.length} · hiệu chuẩn ${okHieuChuan === null ? 'BỎ QUA' : okHieuChuan ? 'ĐẠT' : 'TRƯỢT'}`);
  // 🔴 CHẠY MỘT CA KHÔNG ĐƯỢC XOÁ BẰNG CHỨNG CỦA CA KHÁC. Trước 05/09 dòng này ghi đè cả tệp, nên
  // `--ca=J14` biến sổ 10 mục (bằng chứng của nhiều lượt/nhiều lane) thành 1 mục — mất sạch, im
  // lặng, và người chạy không có dấu hiệu nào để biết. Nay HỢP NHẤT theo mã: mục mới đè mục cũ
  // CÙNG MÃ, mục không liên quan giữ nguyên. `okHieuChuan` chỉ ghi đè khi lượt này thật sự chạy
  // hiệu chuẩn (`--bo-hieu-chuan` cho `null`, không được phép xoá kết quả cũ).
  const duong = path.join(THU_MUC_ANH, 'ket-qua.json');
  let cu = { okHieuChuan: null, ketQua: [] };
  try { cu = JSON.parse(readFileSync(duong, 'utf8')); } catch { /* chưa có sổ — lượt đầu */ }
  const theoMa = new Map((cu.ketQua ?? []).map((r) => [r.ma, r]));
  for (const r of ketQua) theoMa.set(r.ma, r);
  writeFileSync(duong, JSON.stringify({
    okHieuChuan: okHieuChuan === null ? (cu.okHieuChuan ?? null) : okHieuChuan,
    ketQua: [...theoMa.values()],
  }, null, 2));
  process.exit(dat === ketQua.length && okHieuChuan !== false ? 0 : 1);
}

main().catch((e) => { console.error('💥', e); process.exit(3); });
