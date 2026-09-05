/** 2D — đi ĐÚNG lời card bàn-trống dặn ("Gõ W…"), rồi đi đường W+Enter, so hai kết quả. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
const GOC = 'http://localhost:3081';
const PID = 'cmtmdaaws00017dmmhactp691';
mkdirSync('.nen-kiem/out', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();
const g = (o) => console.log(JSON.stringify(o));
const trangThai = () => page.evaluate(() => {
  const st = [...document.querySelectorAll('*')].map((e) => e.textContent || '').join(' ');
  return {
    congCuBat: [...document.querySelectorAll('[aria-pressed="true"]')].map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24)),
    coOLenh: !!document.querySelector('input[placeholder*="lệnh" i],input[aria-label*="lệnh" i]'),
    giaTriOLenh: (document.querySelector('input[placeholder*="lệnh" i],input[aria-label*="lệnh" i]') || {}).value ?? null,
    banTrong: !!document.querySelector('[data-empty-drawing-overlay]'),
    trangThaiChu: (document.querySelector('[data-cad-status],[class*="status"]')?.textContent || '').trim().slice(0, 120),
  };
});

await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const veNgay = page.getByRole('button', { name: /Vẽ ngay|Start drawing/ });
if (await veNgay.count()) { await veNgay.first().click(); await page.waitForTimeout(400); }
g({ b: 'nền', ...(await trangThai()) });

/* ĐƯỜNG A — đúng chữ trên card: chỉ gõ W */
await page.keyboard.press('KeyW');
await page.waitForTimeout(500);
g({ b: 'A · chỉ gõ W', ...(await trangThai()) });
await page.screenshot({ path: '.nen-kiem/out/2d-A-chi-W.png' });

/* ĐƯỜNG B — W rồi Enter */
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
g({ b: 'B · W + Enter', ...(await trangThai()) });
await page.screenshot({ path: '.nen-kiem/out/2d-B-W-enter.png' });

const cv = page.locator('canvas').first();
const hop = await cv.boundingBox();
if (hop) {
  await page.mouse.click(hop.x + 260, hop.y + 300);
  await page.waitForTimeout(300);
  g({ b: 'B · sau điểm 1', ...(await trangThai()) });
  await page.mouse.move(hop.x + 700, hop.y + 300, { steps: 14 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.nen-kiem/out/2d-B-keo.png' });
  await page.mouse.click(hop.x + 700, hop.y + 300);
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  g({ b: 'B · sau điểm 2 + Esc', ...(await trangThai()) });
  await page.screenshot({ path: '.nen-kiem/out/2d-B-xong.png' });
}
/* SỐNG SÓT SAU TẢI LẠI */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
g({ b: 'SAU TẢI LẠI', ...(await trangThai()) });
await page.screenshot({ path: '.nen-kiem/out/2d-C-tai-lai.png' });
await b.close();
