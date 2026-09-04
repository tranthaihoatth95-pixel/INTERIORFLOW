/**
 * scripts/nghiem-thu-ban-lam-viec/vat-lieu-hat-giong-song-sot.mjs
 * LUẬT PASS G4 · máy sạch → mở mặt vẽ 2D → CHỌN ĐƯỢC một vật liệu hạt giống → tô một vùng
 *                → ĐÓNG HẲN trình duyệt → vào lại → vùng còn đó, MANG ĐÚNG specId.
 *
 * ⛔ BA KỶ LUẬT, mỗi cái vá một cách tự lừa mình đã xảy ra thật:
 *  1. **`launchPersistentContext` trên hồ sơ đĩa** — `newContext()` vứt IndexedDB lúc đóng, nên
 *     "mở lại" bằng context mới là câu hỏi VÔ NGHĨA TỪ ĐỊNH NGHĨA: nó luôn trống, và nếu ta đọc
 *     ra trống rồi kết luận "mất dữ liệu" thì kết luận đó không nói gì về app.
 *  2. **Đọc từ NƠI LƯU THẬT** (IndexedDB `interiorflow-sheets`, khoá `<userId>::/cad-editor::<pid>`),
 *     KHÔNG đọc chữ trên màn. Chữ trên màn chứng minh React vừa render; nó không chứng minh có
 *     thứ gì sống sót qua một lần tắt máy.
 *  3. **KHÔNG `reload()` để đi vòng qua lỗi.** Nếu phải tải lại trang mới thấy dữ liệu thì chính
 *     việc đó là phát hiện, phải khai — không phải liều thuốc giấu bệnh.
 *
 * HIỆU CHUẨN (`--tu-kiem`): chạy thêm một lượt ĐỐI CHỨNG **không chọn vật liệu nào** — vùng tô
 * vẫn phải sinh ra nhưng `specId` phải RỖNG. Nếu lượt đối chứng cũng "xanh" thì phép đo không
 * phân biệt được hai thế giới ⇒ HIỆU CHUẨN THOÁI HOÁ, số chính không đáng tin.
 *
 * Chạy:
 *   node scripts/nghiem-thu-ban-lam-viec/vat-lieu-hat-giong-song-sot.mjs \
 *        --url=http://localhost:3097 --pid=<projectId> [--tu-kiem] [--ho-so=<thư mục>]
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const co = (t, m) => {
  const a = process.argv.find((x) => x.startsWith(`--${t}=`));
  return a ? a.slice(t.length + 3) : m;
};
const GOC = co('url', 'http://localhost:3097');
const PID = co('pid', '');
const TU_KIEM = process.argv.includes('--tu-kiem');
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!PID) { console.error('thiếu --pid'); process.exit(2); }

const in_ = (s) => console.log(s);

/** Đọc thẳng bản ghi IndexedDB — nơi lưu THẬT của bản vẽ 2D. */
const DOC_IDB = (khoa) => new Promise((res) => {
  const r = indexedDB.open('interiorflow-sheets', 1);
  r.onerror = () => res({ loi: 'không mở được IndexedDB' });
  r.onsuccess = () => {
    const db = r.result;
    if (!db.objectStoreNames.contains('sheets')) return res({ loi: 'chưa có store "sheets"' });
    const g = db.transaction('sheets', 'readonly').objectStore('sheets').get(khoa);
    g.onerror = () => res({ loi: 'đọc bản ghi lỗi' });
    g.onsuccess = () => {
      const rec = g.result;
      if (!rec) return res({ coBanGhi: false, khoa });
      const hatch = [];
      for (const s of rec.sheets ?? []) {
        for (const e of s.doc?.entities ?? []) {
          if (e.type === 'hatch') hatch.push({ id: e.id, specId: e.specId ?? null, pattern: e.pattern ?? null, diem: (e.points ?? e.pts ?? []).length });
        }
      }
      res({ coBanGhi: true, khoa, soSheet: (rec.sheets ?? []).length, ts: rec.ts, hatch });
    };
  };
});

/** Một lượt: mở app trên MỘT hồ sơ đĩa, làm việc, rồi ĐÓNG HẲN. */
async function motLuot(hoSo, { chonVatLieu }) {
  const ctx = await chromium.launchPersistentContext(hoSo, {
    executablePath: CHROME,
    viewport: { width: 1600, height: 900 },
  });
  const page = ctx.pages()[0] ?? await ctx.newPage();
  const r = await page.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  if (!r.ok()) { await ctx.close(); return { loi: `login ${r.status()}` }; }
  const me = await (await page.request.get(`${GOC}/api/auth/me`)).json().catch(() => ({}));
  const uid = me?.user?.id ?? '';
  await page.goto(GOC);
  await page.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, uid);
  await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  for (const ten of [/Tạo bản vẽ mới|New drawing/, /Vẽ ngay|Start drawing/]) {
    const n = page.getByRole('button', { name: ten });
    if (await n.count().catch(() => 0)) { await n.first().click().catch(() => {}); await page.waitForTimeout(2500); }
  }
  await page.waitForTimeout(1200);
  if (!(await page.locator('canvas').count())) { await ctx.close(); return { loi: 'không dựng được mặt vẽ' }; }

  /* ── mở bảng chọn vật liệu (nút "Vật liệu" trên dock, hoặc sự kiện app đã có) ── */
  let soDongKho = null; let tenDaChon = null;
  if (chonVatLieu) {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cad:toggle-material')));
    // Danh sách kho nạp bất đồng bộ (`loadMaterialPicks` → `/api/specs`), `kho===null` cho tới khi
    // promise xong. Chờ tới khi tiêu đề "Kho vật liệu" hiện, đừng chốt một con số chờ cứng.
    await page.waitForFunction(
      () => [...document.querySelectorAll('div')].some((d) => /Kho vật liệu/.test(d.textContent || '') && d.children.length === 0),
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(2500);
    // Dòng kho = nút nằm dưới tiêu đề "Kho vật liệu · gán mã".
    const kho = await page.evaluate(() => {
      const heads = [...document.querySelectorAll('div')].filter((d) => /Kho vật liệu/.test(d.textContent || '') && d.children.length === 0);
      const head = heads[0];
      if (!head) return { co: false, lyDo: 'không thấy tiêu đề "Kho vật liệu"' };
      const list = head.parentElement?.querySelector('div[style*="flex-direction: column"]');
      const btns = list ? [...list.querySelectorAll('button')] : [];
      return {
        co: true,
        so: btns.length,
        ten: btns.map((b) => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)),
        ghiChu: (head.parentElement?.textContent || '').includes('Kho chưa có vật liệu nào') ? 'kho rỗng' : null,
      };
    });
    if (!kho.co) { await ctx.close(); return { loi: kho.lyDo }; }
    soDongKho = kho.so;
    /* 🔴 "kho rỗng" là FAIL, KHÔNG phải LỖI — phân biệt này là điểm sống của bộ đo.
       LỖI = hạ tầng ngã, không kết luận được gì (không có canvas · login hỏng).
       FAIL = phép đo CHẠY ĐƯỢC và khẳng định SAI: bảng chọn có mặt, đọc được, và nó rỗng.
       Gộp hai thứ thì lúc hiệu chuẩn (gỡ dây hạt giống) máy sẽ báo "LỖI" — nghe như bộ đo hỏng,
       trong khi đó chính là thứ nó phải bắt được. */
    if (!kho.so) { await ctx.close(); return { rong: `bảng chọn 2D KHÔNG có vật liệu nào (${kho.ghiChu ?? ''})`, soDongKho: 0 }; }
    tenDaChon = kho.ten[0];
    await page.evaluate(() => {
      const heads = [...document.querySelectorAll('div')].filter((d) => /Kho vật liệu/.test(d.textContent || '') && d.children.length === 0);
      const list = heads[0]?.parentElement?.querySelector('div[style*="flex-direction: column"]');
      list?.querySelector('button')?.click();
    });
    await page.waitForTimeout(900);
    // đóng bảng để nó không đứng che mặt vẽ lúc tô
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cad:toggle-material')));
    await page.waitForTimeout(600);
  }

  /* ── vẽ một hình kín rồi tô ─────────────────────────────────────────────── */
  const cv = await page.evaluate(() => { const c = document.querySelector('canvas'); const b = c.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const ox = Math.round(cv.x + cv.w * 0.45);
  const oy = Math.round(cv.y + cv.h * 0.32);
  /* Gõ lệnh QUA CHÍNH Ô LỆNH bằng chuột — đây là đường người dùng thật, và cũng là phép thử sống
     cho cú sửa ca 1: trước khi sửa, cú bấm vào tâm ô lệnh rơi vào `div` rỗng của dock nên đoạn
     này KHÔNG THỂ chạy. Gõ thẳng lên mặt vẽ không tương đương (đo được: `REC` gõ trên canvas
     không vào ô lệnh, công cụ vẫn đứng ở "Chọn"). */
  const goLenh = async (lenh) => {
    const o = page.locator('input[placeholder*="lệnh" i], input[aria-label*="lệnh" i]').first();
    await o.click({ timeout: 5000 });
    await o.fill(lenh);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  };
  await goLenh('REC');
  await page.mouse.click(ox - 140, oy - 90); await page.waitForTimeout(300);
  await page.mouse.click(ox + 140, oy + 90); await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await goLenh('HATCH');
  await page.mouse.click(ox, oy);
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  // autosave debounce ≥1.2s — chờ dư rồi mới đóng, KHÔNG reload để ép ghi.
  await page.waitForTimeout(3000);

  const khoa = `${uid}::/cad-editor::${PID}`;
  const truocKhiDong = await page.evaluate(DOC_IDB, khoa);
  await ctx.close();                       // ĐÓNG HẲN — hồ sơ ở lại trên đĩa
  return { uid, khoa, soDongKho, tenDaChon, truocKhiDong, ox, oy };
}

/** Mở lại trên CÙNG hồ sơ đĩa và đọc lại IndexedDB — không thao tác gì thêm. */
async function moLai(hoSo, khoa) {
  const ctx = await chromium.launchPersistentContext(hoSo, { executablePath: CHROME, viewport: { width: 1600, height: 900 } });
  const page = ctx.pages()[0] ?? await ctx.newPage();
  await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  const doc = await page.evaluate(DOC_IDB, khoa);
  const tren2D = await page.evaluate(() => document.querySelectorAll('canvas').length);
  await ctx.close();
  return { doc, coCanvas: tren2D > 0 };
}

async function chay(nhan, chonVatLieu) {
  const hoSo = mkdtempSync(join(tmpdir(), 'if-hs-'));
  in_(`\n▶ ${nhan}   (hồ sơ đĩa ${hoSo})`);
  const a = await motLuot(hoSo, { chonVatLieu });
  if (a.rong) { in_(`   🔴 FAIL: ${a.rong}`); rmSync(hoSo, { recursive: true, force: true }); return { rong: a.rong, soDongKho: 0 }; }
  if (a.loi) { in_(`   ⚠️ LỖI (không kết luận): ${a.loi}`); rmSync(hoSo, { recursive: true, force: true }); return { loi: a.loi, soDongKho: a.soDongKho }; }
  in_(`   dòng kho thấy trong bảng chọn 2D: ${a.soDongKho ?? '(không mở bảng)'}${a.tenDaChon ? ` · đã chọn: "${a.tenDaChon}"` : ''}`);
  in_(`   trước khi đóng — bản ghi=${a.truocKhiDong.coBanGhi} · hatch=${a.truocKhiDong.hatch?.length ?? 0}`);
  const b = await moLai(hoSo, a.khoa);
  rmSync(hoSo, { recursive: true, force: true });
  const h = b.doc.hatch ?? [];
  in_(`   SAU KHI ĐÓNG HẲN VÀ VÀO LẠI — bản ghi=${b.doc.coBanGhi} · hatch=${h.length}`);
  for (const x of h) in_(`      · ${x.id} · specId=${x.specId ?? '(rỗng)'} · pattern=${x.pattern}`);
  return { soDongKho: a.soDongKho, tenDaChon: a.tenDaChon, hatch: h, coBanGhi: b.doc.coBanGhi };
}

in_('🧾 LUẬT PASS G4 — vật liệu hạt giống có sống sót qua một lần tắt máy không');
const chinh = await chay('LƯỢT CHÍNH · có chọn vật liệu hạt giống', true);
let doiChung = null;
if (TU_KIEM) doiChung = await chay('ĐỐI CHỨNG · KHÔNG chọn vật liệu nào', false);

in_('\n── KẾT');
const fail = [];
const loi = [];
if (chinh.rong) fail.push(`lượt chính: ${chinh.rong}`);
else if (chinh.loi) loi.push(`lượt chính: ${chinh.loi}`);
else {
  if (!chinh.soDongKho) fail.push('bảng chọn 2D không có dòng kho nào');
  if (!chinh.hatch.length) fail.push('vùng tô KHÔNG sống sót qua lần tắt máy');
  else if (!chinh.hatch.some((x) => x.specId)) fail.push('vùng tô sống sót nhưng KHÔNG mang specId');
}
if (TU_KIEM) {
  if (doiChung?.loi) loi.push(`đối chứng: ${doiChung.loi}`);
  else {
    const dcCoMa = (doiChung?.hatch ?? []).some((x) => x.specId);
    in_(`   HIỆU CHUẨN — đối chứng (không chọn): hatch=${doiChung?.hatch?.length ?? 0} · có specId=${dcCoMa}`);
    if (dcCoMa) { fail.push('HIỆU CHUẨN THOÁI HOÁ — không chọn gì mà vẫn có specId ⇒ phép đo không phân biệt được hai thế giới'); }
    else in_('   ✅ đối chứng đúng: không chọn ⇒ không có mã. Phép đo phân biệt được hai thế giới.');
  }
}
in_(`   FAIL ${fail.length}`); for (const f of fail) in_(`     🔴 ${f}`);
in_(`   LỖI (không kết luận) ${loi.length}`); for (const l of loi) in_(`     ⚠️ ${l}`);
process.exit(fail.length ? 1 : 0);
