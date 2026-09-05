/** 2D vòng 2 — W+Enter, hai điểm, rồi ENTER (không phải Esc) để chốt chuỗi tường. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
const GOC = 'http://localhost:3081';
const PID = 'cmtmdaaws00017dmmhactp691';
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
const tt = () => page.evaluate(() => ({
  tool: [...document.querySelectorAll('[aria-pressed="true"]')].map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 18))[0],
  banTrong: !!document.querySelector('[data-empty-drawing-overlay]'),
  dongTrangThai: (document.body.innerText.match(/Chọn: click[^\n]*|Tường[^\n]*|Điểm[^\n]*/g) || []).slice(0, 2),
}));

await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const vn = page.getByRole('button', { name: /Vẽ ngay|Start drawing/ });
if (await vn.count()) { await vn.first().click(); await page.waitForTimeout(400); }

await page.keyboard.press('KeyW'); await page.waitForTimeout(250);
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
g({ s: 'tool sau W+Enter', ...(await tt()) });

const cv = page.locator('canvas').first();
const h = await cv.boundingBox();
await page.mouse.move(h.x + 300, h.y + 320); await page.waitForTimeout(120);
await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(350);
g({ s: 'sau điểm 1', ...(await tt()) });
await page.mouse.move(h.x + 760, h.y + 320, { steps: 16 }); await page.waitForTimeout(250);
await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(350);
g({ s: 'sau điểm 2', ...(await tt()) });
await page.screenshot({ path: '.nen-kiem/out/2d-D-2diem.png' });
await page.keyboard.press('Enter'); await page.waitForTimeout(900);
g({ s: 'sau ENTER chốt', ...(await tt()) });
await page.screenshot({ path: '.nen-kiem/out/2d-D-enter.png' });
await page.waitForTimeout(2500); // chờ autosave
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3200);
g({ s: 'SAU TẢI LẠI', ...(await tt()) });
await page.screenshot({ path: '.nen-kiem/out/2d-D-tai-lai.png' });
await b.close();
