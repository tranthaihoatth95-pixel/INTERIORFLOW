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
async function moPhienTrinhDuyet(ma, { chanIdb = false } = {}) {
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
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  return { ctx, page, dir };
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
                })),
              });
          };
        };
      }),
  );
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

/** Mở mặt vẽ 2D của dự án (tạo bản vẽ nếu dự án còn rỗng) và đợi canvas thật. */
async function moMatVe(page, duAn) {
  await page.goto(`${GOC}/projects/${duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(4000);
  try {
    const tao = page.getByRole('button', { name: /Tạo bản vẽ mới/i });
    if (await tao.count()) { await tao.first().click({ timeout: 5000 }); await cho(3000); }
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
    };
  },
  soSanh(truoc, sau) {
    if (truoc.moHo.length) return { dat: false, vi: `rơi vào kho mơ hồ: ${truoc.moHo.join(',')}` };
    if (!truoc.coBanGhi || truoc.soThucThe < 1)
      return { dat: false, vi: `sau khi vẽ, IndexedDB KHÔNG có bản ghi ở ${truoc.khoaDung} (khoá thấy: ${truoc.moiKhoa.join('|') || 'không có'})` };
    if (!sau.coBanGhi)
      return { dat: false, vi: `mở lại: bản ghi biến mất khỏi ${sau.khoaDung}` };
    if (sau.soThucThe !== truoc.soThucThe)
      return { dat: false, vi: `số thực thể đổi sau khi mở lại: ${truoc.soThucThe} → ${sau.soThucThe}` };
    return { dat: true, vi: `${sau.soThucThe} thực thể còn nguyên ở ${sau.khoaDung} sau khi ĐÓNG HẲN trình duyệt và mở lại` };
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

const HANH_TRINH = [J16, J17, J19, J20];

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
    if (ht.dong) await ht.dong(p1, mt, st);
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
  const cas = [
    { ht: J16, mo: 'chặn IndexedDB (đường ghi của bản vẽ)' },
    { ht: J19, mo: 'chặn thư mục backups (đường sao lưu trước nâng cấp)' },
  ];
  let tatCaDo = true;
  for (const { ht, mo } of cas) {
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
  const chuaChay = HANH_TRINH.filter((h) => !ketQua.some((r) => r.ma === h.ma));
  for (const h of chuaChay) console.log(`CHƯA  ${h.ma}  ${h.ten}`);
  const dat = ketQua.filter((r) => r.trangThai === 'PASS').length;
  console.log(`\nĐẠT ${dat}/${ketQua.length} · hiệu chuẩn ${okHieuChuan === null ? 'BỎ QUA' : okHieuChuan ? 'ĐẠT' : 'TRƯỢT'}`);
  writeFileSync(path.join(THU_MUC_ANH, 'ket-qua.json'), JSON.stringify({ okHieuChuan, ketQua }, null, 2));
  process.exit(dat === ketQua.length && okHieuChuan !== false ? 0 : 1);
}

main().catch((e) => { console.error('💥', e); process.exit(3); });
