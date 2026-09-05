/**
 * KIỂM CHỨNG VIỆC A trên app THẬT — ⌘J có mặt nào tiêu thụ không, và câu hỏi gõ ở
 * StatusBar rồi Enter có bốc hơi không.
 *
 * ⚠️ VÌ SAO CÓ TỆP NÀY: phiếu 04/09 giao việc A với tiền đề *"⌘J vô chủ, không mặt nào
 * tiêu thụ ở cả 4 màn"*. Tiền đề đó lấy theo mốc `0f52737b`; nhánh tích hợp đã tiến 197
 * commit và một lane khác đã dựng khẩu độ mép trên (`711d5c73`). Chú thích trong mã
 * khẳng định đã sửa — nhưng **chú thích cũng từng nói dối** (đó chính là họ bệnh lượt này
 * đi đóng), nên phải đo bằng bàn phím thật trên trình duyệt thật.
 *
 * Chạy: dev server sống ở IF_URL (mặc định 3094), rồi
 *   node scripts/nghiem-thu-ban-lam-viec/kiem-a-vitals.mjs
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const GOC = process.env.IF_URL ?? 'http://localhost:3094';
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.IF_OUT ?? 'docs/delivery/anh-duyet-mat/nut-noi-doi';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
  });
  console.log('login', r.status());
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => {
    try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {}
  }, me?.user?.id ?? '');
  await p.close();
}

const page = await ctx.newPage();
/** ảnh DOM rút gọn — chỉ đếm thứ NHÌN THẤY được, để so trước/sau một cú bấm phím. */
const anh = () => page.evaluate(() => ({
  n: document.querySelectorAll('body *').length,
  chu: document.body.innerText.length,
}));
const doi = (a, c) => a.n !== c.n || Math.abs(a.chu - c.chu) > 4;

await page.goto(GOC, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

/* ── ① khẩu độ Vitals có THẬT trên DOM không ────────────────────────────────── */
const co = await page.evaluate(() => {
  const el = document.querySelector('[data-vitals-aperture]')
    ?? [...document.querySelectorAll('[aria-label]')].find((e) => /Vitals/i.test(e.getAttribute('aria-label') || ''));
  if (!el) return { thay: false };
  const r = el.getBoundingClientRect();
  return {
    thay: true,
    tag: el.tagName,
    aria: el.getAttribute('aria-label'),
    hop: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
  };
});
console.log('① khẩu độ trên DOM:', JSON.stringify(co));

/* ── ② ⌘J có làm gì không ───────────────────────────────────────────────────── */
const t1 = await anh();
await page.keyboard.press('Meta+j');
await page.waitForTimeout(900);
const s1 = await anh();
console.log('② ⌘J:', JSON.stringify({ truoc: t1, sau: s1, COVIEC: doi(t1, s1) }));
await page.screenshot({ path: `${OUT}/a-sau-cmdJ.png` });

/* ── ③ Ctrl+J ───────────────────────────────────────────────────────────────── */
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
const t2 = await anh();
await page.keyboard.press('Control+j');
await page.waitForTimeout(900);
const s2 = await anh();
console.log('③ Ctrl+J:', JSON.stringify({ truoc: t2, sau: s2, COVIEC: doi(t2, s2) }));

/* ── ④ CÂU HỎI CÓ BỐC HƠI KHÔNG — gõ vào ô nhanh ở thanh trạng thái rồi Enter ── */
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
const oNhanh = await page.evaluate(() => {
  const els = [...document.querySelectorAll('input, textarea')];
  const o = els.find((e) => /vitals|hỏi|trợ lý|ask/i.test(
    (e.getAttribute('placeholder') || '') + (e.getAttribute('aria-label') || ''),
  ));
  if (!o) return null;
  const r = o.getBoundingClientRect();
  return { ph: o.getAttribute('placeholder'), aria: o.getAttribute('aria-label'), y: Math.round(r.y) };
});
console.log('④ ô gõ nhanh:', JSON.stringify(oNhanh));
if (oNhanh) {
  const o = page.locator('input, textarea').filter({ hasNot: page.locator('x') }).first();
  const muc = page.locator('input, textarea').all();
  const ds = await muc;
  for (const e of ds) {
    const ph = (await e.getAttribute('placeholder')) || '';
    const ar = (await e.getAttribute('aria-label')) || '';
    if (!/vitals|hỏi|trợ lý|ask/i.test(ph + ar)) continue;
    const t4 = await anh();
    await e.click();
    await e.fill('kiểm câu hỏi có bốc hơi không');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1400);
    const s4 = await anh();
    const conChu = await page.evaluate((q) => document.body.innerText.includes(q), 'kiểm câu hỏi có bốc hơi không');
    console.log('   Enter:', JSON.stringify({ truoc: t4, sau: s4, COVIEC: doi(t4, s4), CAUHOI_CON_TREN_MAN: conChu }));
    await page.screenshot({ path: `${OUT}/a-sau-enter.png` });
    break;
  }
}

await b.close();
