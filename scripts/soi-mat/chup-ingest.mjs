/** Chụp /library/ingest hai theme — bằng chứng TRƯỚC/SAU cho lượt gỡ 40 hex gõ cứng. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const CONG = process.env.CONG || '3230', NHAN = process.env.NHAN || 'truoc';
const RA = 'docs/delivery/anh-duyet-mat/ingest-hex'; mkdirSync(RA, { recursive: true });
const B = `http://localhost:${CONG}`, cho = m => new Promise(r => setTimeout(r, m));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
await c.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await c.newPage();
await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await cho(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {}); await cho(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('ING');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(`ing.${Date.now()}@if.test`);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill('MatThuong#2026');
await p.locator('button[type=submit]').first().click().catch(() => {}); await cho(7000);
for (const th of ['dark', 'light']) {
  await p.evaluate((v) => { document.documentElement.dataset.theme = v; try { localStorage.setItem('theme', v); } catch {} }, th);
  await p.goto(B + '/library/ingest', { waitUntil: 'domcontentloaded' }); await cho(3000);
  await p.evaluate((v) => { document.documentElement.dataset.theme = v; }, th); await cho(600);
  const f = `${RA}/${NHAN}-${th}.png`;
  await p.screenshot({ path: f, fullPage: true });
  console.log('→', f, await p.evaluate(() => getComputedStyle(document.body).backgroundColor));
}
await b.close();
