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

const HANH_TRINH = [J16, J16b, J17, J19, J20, J07, J12, J04, J06, J18, J22, J05];

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
  writeFileSync(path.join(THU_MUC_ANH, 'ket-qua.json'), JSON.stringify({ okHieuChuan, ketQua }, null, 2));
  process.exit(dat === ketQua.length && okHieuChuan !== false ? 0 : 1);
}

main().catch((e) => { console.error('💥', e); process.exit(3); });
