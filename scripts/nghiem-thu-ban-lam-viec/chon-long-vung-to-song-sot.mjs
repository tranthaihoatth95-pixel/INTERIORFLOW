/**
 * scripts/nghiem-thu-ban-lam-viec/chon-long-vung-to-song-sot.mjs
 * LUẬT PASS cho lượt "trả lại mặt vẽ 2D":
 *   tô một vùng → bấm GIỮA LÒNG nó → chọn được → XOÁ → ĐÓNG HẲN trình duyệt → vào lại
 *   → vùng tô đã mất thật, và hình chữ nhật biên vẫn còn.
 *
 * ⛔ VÌ SAO KHÔNG NHÉT VÀO `mat-ve-2d-cham-toi-duoc.mjs`: máy kia trả lời *"cú bấm rơi vào ai"*
 * và chạy trên `newContext()` — đúng cho câu hỏi lớp-che, nhưng `newContext()` VỨT IndexedDB lúc
 * đóng nên nó không bao giờ trả lời được câu *"thứ vừa làm có sống sót qua một lần tắt máy
 * không"*. Máy này trả lời câu thứ hai, trên `launchPersistentContext` với hồ sơ trên ĐĨA.
 * Ba kỷ luật mượn nguyên của `vat-lieu-hat-giong-song-sot.mjs` (cùng họ, cùng cách đọc IDB):
 *   1. hồ sơ đĩa, KHÔNG `newContext()`;
 *   2. đọc từ NƠI LƯU THẬT (IndexedDB `interiorflow-sheets`, khoá `<uid>::/cad-editor::<pid>`),
 *      KHÔNG đọc chữ trên màn — chữ trên màn chỉ chứng minh React vừa render;
 *   3. KHÔNG `reload()` để đi vòng qua lỗi; phải tải lại mới thấy thì chính đó là phát hiện.
 *
 * HIỆU CHUẨN (`--tu-kiem`): chạy thêm lượt ĐỐI CHỨNG bấm ra CHỖ TRỐNG (ngoài vùng tô) rồi cũng
 * bấm Xoá. Lượt đó vùng tô phải CÒN NGUYÊN. Nếu cả hai lượt đều "xanh" thì phép đo không phân
 * biệt được hai thế giới ⇒ HIỆU CHUẨN THOÁI HOÁ, số chính không đáng tin.
 *
 * Chạy:
 *   node scripts/nghiem-thu-ban-lam-viec/chon-long-vung-to-song-sot.mjs \
 *        --url=http://localhost:3099 --pid=<projectId> [--tu-kiem] [--anh=<thư mục>]
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdtempSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const co = (t, m) => {
  const a = process.argv.find((x) => x.startsWith(`--${t}=`));
  return a ? a.slice(t.length + 3) : m;
};
const GOC = co('url', 'http://localhost:3099');
const PID = co('pid', '');
const ANH = co('anh', '');
const TU_KIEM = process.argv.includes('--tu-kiem');
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!PID) { console.error('thiếu --pid=<projectId>'); process.exit(2); }
if (ANH) mkdirSync(ANH, { recursive: true });

const in_ = (s) => console.log(s);
const ket = { fail: [], loi: [] };

/** Đọc thẳng bản ghi IndexedDB — NƠI LƯU THẬT của bản vẽ 2D. */
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
      const dem = {};
      for (const s of rec.sheets ?? []) for (const e of s.doc?.entities ?? []) dem[e.type] = (dem[e.type] ?? 0) + 1;
      res({ coBanGhi: true, khoa, soSheet: (rec.sheets ?? []).length, ts: rec.ts, dem });
    };
  };
});

/** Trục phải nói đang chọn mấy vật — đọc CHỮ TRÊN MÀN, chỉ dùng để mô tả bước giữa, không dùng
 *  làm bằng chứng sống sót (bằng chứng đó chỉ đến từ IndexedDB). */
const dangChon = (page) => page.evaluate(() => {
  const t = document.body.innerText || '';
  const m = t.match(/—\s*(\d+)\s*đối tượng/);
  if (m) return Number(m[1]);
  if (/Chưa chọn đối tượng nào/.test(t)) return 0;
  return null;
});

async function motLuot(hoSo, { bamVaoLong }) {
  const ctx = await chromium.launchPersistentContext(hoSo, { executablePath: CHROME, viewport: { width: 1600, height: 900 } });
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
    if (await n.count().catch(() => 0)) { await n.first().click().catch(() => {}); await page.waitForTimeout(2000); }
  }
  await page.waitForTimeout(1200);
  if (!(await page.locator('canvas').count())) { await ctx.close(); return { loi: 'không dựng được mặt vẽ' }; }

  const cv = await page.evaluate(() => { const c = document.querySelector('canvas'); const b = c.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const ox = Math.round(cv.x + cv.w * 0.45);
  const oy = Math.round(cv.y + cv.h * 0.32);

  /* Gõ lệnh QUA CHÍNH Ô LỆNH bằng chuột — đường của người dùng thật. */
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
  await page.waitForTimeout(1500);

  const truocKhiXoa = await page.evaluate(DOC_IDB, `${uid}::/cad-editor::${PID}`);

  /* ── HÀNH ĐỘNG ĐANG ĐO: bấm GIỮA LÒNG (hoặc ra chỗ trống, lượt đối chứng) rồi XOÁ ── */
  const diem = bamVaoLong ? { x: ox, y: oy } : { x: Math.round(cv.x + cv.w * 0.85), y: Math.round(cv.y + cv.h * 0.85) };
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.mouse.click(diem.x, diem.y);
  await page.waitForTimeout(700);
  const soChon = await dangChon(page);
  if (ANH) await page.screenshot({ path: `${ANH}/2d-${bamVaoLong ? 'bam-giua-long' : 'doi-chung-cho-trong'}.png` }).catch(() => {});
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1200);
  const conLai = await dangChon(page);

  // autosave debounce ≥1.2s — chờ dư rồi mới đóng, KHÔNG reload để ép ghi.
  await page.waitForTimeout(3000);
  const truocKhiDong = await page.evaluate(DOC_IDB, `${uid}::/cad-editor::${PID}`);
  await ctx.close();                       // ĐÓNG HẲN — hồ sơ ở lại trên đĩa
  return { uid, khoa: `${uid}::/cad-editor::${PID}`, diem, soChon, conLai, truocKhiXoa, truocKhiDong };
}

/** Mở lại trên CÙNG hồ sơ đĩa và đọc lại IndexedDB — không thao tác gì thêm. */
async function moLai(hoSo, khoa) {
  const ctx = await chromium.launchPersistentContext(hoSo, { executablePath: CHROME, viewport: { width: 1600, height: 900 } });
  const page = ctx.pages()[0] ?? await ctx.newPage();
  await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  const doc = await page.evaluate(DOC_IDB, khoa);
  await ctx.close();
  return doc;
}

in_('🔎 CHỌN GIỮA LÒNG VÙNG TÔ — SỐNG SÓT QUA MỘT LẦN TẮT TRÌNH DUYỆT');
in_(`   ${GOC}/projects/${PID}/cad · khung nhìn 1600×900`);

async function chay(nhan, bamVaoLong) {
  const hoSo = mkdtempSync(join(tmpdir(), 'if-long-'));
  try {
    const a = await motLuot(hoSo, { bamVaoLong });
    if (a.loi) { ket.loi.push(`${nhan}: ${a.loi}`); in_(`\n■ ${nhan} — ⚠️ LỖI: ${a.loi}`); return null; }
    const sau = await moLai(hoSo, a.khoa);
    in_(`\n■ ${nhan}`);
    in_(`   bấm tại ${a.diem.x},${a.diem.y} · trục phải báo đang chọn ${a.soChon} · sau khi Xoá còn ${a.conLai}`);
    in_(`   IDB trước khi xoá : ${JSON.stringify(a.truocKhiXoa.dem ?? a.truocKhiXoa)}`);
    in_(`   IDB trước khi đóng: ${JSON.stringify(a.truocKhiDong.dem ?? a.truocKhiDong)}`);
    in_(`   IDB sau khi MỞ LẠI: ${JSON.stringify(sau.dem ?? sau)}`);
    return { ...a, sau };
  } finally {
    rmSync(hoSo, { recursive: true, force: true });
  }
}

const chinh = await chay('LƯỢT CHÍNH — bấm GIỮA LÒNG vùng tô rồi Xoá', true);
if (chinh) {
  const truoc = chinh.truocKhiXoa.dem ?? {};
  const sau = chinh.sau.dem ?? {};
  if (!truoc.hatch) {
    ket.loi.push('lượt chính: không tô được vùng nào ⇒ không kết luận');
    in_('   ⚠️ LỖI: không có vùng tô nào trong IDB trước bước xoá — hỏng ở khâu vẽ/tô, không kết luận');
  } else {
    const chonDuoc = chinh.soChon === 1;
    const xoaThat = (sau.hatch ?? 0) < truoc.hatch;
    const bienConDo = (sau.rect ?? 0) === (truoc.rect ?? 0);
    in_(`   ${chonDuoc ? '✅' : '🔴'} bấm giữa lòng CHỌN ĐƯỢC đúng 1 đối tượng (đọc trục phải: ${chinh.soChon})`);
    in_(`   ${xoaThat ? '✅' : '🔴'} sau khi ĐÓNG HẲN + vào lại: vùng tô ${truoc.hatch} → ${sau.hatch ?? 0}`);
    in_(`   ${bienConDo ? '✅' : '🔴'} hình chữ nhật biên còn nguyên ${truoc.rect ?? 0} → ${sau.rect ?? 0} (xoá ĐÚNG vật, không xoá lây)`);
    if (!chonDuoc) ket.fail.push('bấm giữa lòng không chọn được đúng 1 đối tượng');
    if (!xoaThat) ket.fail.push('xoá xong đóng hẳn vào lại — vùng tô vẫn còn ⇒ không ghi xuống');
    if (!bienConDo) ket.fail.push('xoá lây sang hình chữ nhật biên');
  }
}

if (TU_KIEM) {
  const dc = await chay('ĐỐI CHỨNG — bấm ra CHỖ TRỐNG rồi Xoá (vùng tô phải CÒN)', false);
  if (dc) {
    const truoc = dc.truocKhiXoa.dem ?? {};
    const sau = dc.sau.dem ?? {};
    const conNguyen = (sau.hatch ?? 0) === (truoc.hatch ?? 0) && (truoc.hatch ?? 0) > 0;
    in_(`   ${conNguyen ? '✅' : '🔴'} HIỆU CHUẨN: bấm chỗ trống ⇒ không chọn gì (${dc.soChon}) ⇒ vùng tô CÒN ${truoc.hatch ?? 0} → ${sau.hatch ?? 0}`);
    if (!conNguyen) {
      ket.fail.push('HIỆU CHUẨN THOÁI HOÁ: lượt đối chứng cũng xoá mất vùng tô ⇒ phép đo không phân biệt được hai thế giới');
    }
  }
}

in_('\n── KẾT');
in_(`   FAIL (khẳng định sai) ${ket.fail.length}`);
for (const f of ket.fail) in_(`     🔴 ${f}`);
in_(`   LỖI (hạ tầng ngã ⇒ KHÔNG kết luận) ${ket.loi.length}`);
for (const l of ket.loi) in_(`     ⚠️ ${l}`);
process.exit(ket.fail.length ? 1 : 0);
