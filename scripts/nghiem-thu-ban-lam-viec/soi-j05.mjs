#!/usr/bin/env node
/** Bàn soi J05 — in ra CẤU TRÚC thật của thẻ tiêu điểm ở Home để chẩn, không đoán. */
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const GOC = process.env.GOC || 'http://localhost:3098';
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = path.join(os.tmpdir(), 'soi-j05');
mkdirSync(dir, { recursive: true });
const ctx = await chromium.launchPersistentContext(dir, {
  args: ['--no-sandbox'], viewport: { width: 1440, height: 900 }, executablePath: CHROMIUM,
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 160)); });

await ctx.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'g2@kiemthu.local', password: 'kiemthu123' } });
const uid = (await (await ctx.request.get(`${GOC}/api/auth/me`)).json())?.user?.id;
console.log('userId', uid);

// gieo dấu vết "đang dở" thẳng vào nơi lưu thật, thay cho việc vẽ (nhanh hơn, cùng trạng thái)
const duAn = process.env.DU_AN || '';
await page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded' });
await cho(3000);
await page.evaluate(([u, d]) => {
  localStorage.setItem('interiorflow.lastUserId', u);
  localStorage.setItem('interiorflow.resume.' + u, JSON.stringify({ route: '/cad-editor', flowId: d, ts: Date.now() }));
}, [uid, duAn]);
await page.reload({ waitUntil: 'domcontentloaded' });
await cho(8000);

console.log('resume:', JSON.stringify(await page.evaluate((u) => localStorage.getItem('interiorflow.resume.' + u), uid)));
console.log('the:', JSON.stringify(await page.evaluate(() => {
  const vat = document.querySelector('.xuong-home .vat');
  if (!vat) return { coVat: false, htmlBody: document.body.className };
  const a = vat.querySelector('a.mo-lai');
  const r = a?.getBoundingClientRect();
  return {
    coVat: true, coA: !!a, href: a?.getAttribute('href') ?? null,
    hop: r ? { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) } : null,
    zIndex: a ? getComputedStyle(a).zIndex : null,
    chanCuoi: vat.querySelector('.vat-chan .day2')?.textContent?.trim(),
    tenVat: vat.getAttribute('aria-label'),
  };
}), null, 1));

// Tab tới lớp phủ
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
let toi = null;
for (let i = 1; i <= 40; i++) {
  await page.keyboard.press('Tab');
  const d = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = el ? getComputedStyle(el) : null;
    return { la: el?.className && typeof el.className === 'string' ? el.className : el?.tagName,
             ring: cs ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : '' };
  });
  if (String(d.la).includes('mo-lai')) { toi = { ...d, soTab: i }; break; }
}
console.log('tab:', JSON.stringify(toi));

if (toi) {
  const truoc = page.url();
  await page.keyboard.press('Enter');
  await cho(4000);
  console.log('sau Enter:', page.url(), '(trước:', truoc, ')');
  if (page.url() === truoc) {
    console.log('→ thử bấm CHUỘT để phân biệt "link chết" với "bàn phím không kích hoạt"');
    await page.locator('a.mo-lai').first().click({ timeout: 5000 }).catch((e) => console.log('  click lỗi:', String(e).slice(0, 120)));
    await cho(4000);
    console.log('sau click chuột:', page.url());
  }
}
await ctx.close();
