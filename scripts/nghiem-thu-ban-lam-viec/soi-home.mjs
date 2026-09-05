/**
 * .nen-kiem/soi-home.mjs — MỞ APP THẬT, đo Home ở hai nền + hai khổ.
 * Chạy: node .nen-kiem/soi-home.mjs
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const GOC = process.env.IF_URL ?? 'http://localhost:3081';
const RA = '.nen-kiem/out';
mkdirSync(RA, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

// đăng nhập qua API rồi tắt màn chào lần đầu
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
  });
  if (!r.ok()) throw new Error('login rc=' + r.status());
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => {
    try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {}
  }, me?.user?.id ?? '');
  await p.close();
}

const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 200)); });

async function datTheme(t) {
  await page.evaluate((x) => {
    document.documentElement.dataset.theme = x;
    try { localStorage.setItem('interiorflow.theme', x); } catch {}
  }, t);
  await page.waitForTimeout(500);
}

/** Đo dải môi trường: nó có thực sự NHÌN THẤY ĐƯỢC không? */
async function doDai() {
  return page.evaluate(() => {
    const dai = document.querySelector('.xuong-home .dai');
    if (!dai) return { co: false };
    const r = dai.getBoundingClientRect();
    const con = dai.firstElementChild;
    const cs = con ? getComputedStyle(con) : null;
    const san = document.querySelector('.xuong-home .san');
    const csSan = san ? getComputedStyle(san) : null;
    return {
      co: true,
      hop: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
      conTen: con ? con.className : null,
      conBg: cs ? cs.backgroundImage.slice(0, 300) : null,
      conBgColor: cs ? cs.backgroundColor : null,
      conOpacity: cs ? cs.opacity : null,
      sanBg: csSan ? csSan.backgroundColor : null,
      theme: document.documentElement.dataset.theme || '(none)',
    };
  });
}

/** Lấy màu pixel trung bình của một vùng bằng cách chụp rồi đọc — làm ở Node. */
async function chup(ten) {
  const f = join(RA, `${ten}.png`);
  await page.screenshot({ path: f });
  return f;
}

async function doHinhHoc() {
  return page.evaluate(() => {
    const g = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
    };
    const rail = document.querySelector('[data-rail],nav');
    const railR = rail ? rail.getBoundingClientRect() : null;
    return {
      vp: { w: innerWidth, h: innerHeight },
      rail: railR ? { w: Math.round(railR.width), x: Math.round(railR.x) } : null,
      xuong: g('.xuong-home'),
      san: g('.xuong-home .san'),
      thang: g('.xuong-home .thang'),
      dai: g('.xuong-home .dai'),
      vat: g('.xuong-home .vat'),
      keBen: document.querySelectorAll('.xuong-home .ke-ben').length,
      oNen: document.querySelectorAll('.xuong-home .o-nen').length,
      oW: document.querySelectorAll('.xuong-home .o-w').length,
      scrollY: { s: document.scrollingElement.scrollHeight, c: document.scrollingElement.clientHeight },
    };
  });
}

const ket = {};
for (const kho of [{ width: 1600, height: 900 }, { width: 1280, height: 800 }]) {
  await page.setViewportSize(kho);
  await page.goto(GOC, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  for (const nen of ['toi', 'sang']) {
    await datTheme(nen === 'sang' ? 'light' : 'dark');
    await page.waitForTimeout(600);
    const k = `${kho.width}-${nen}`;
    ket[k] = { dai: await doDai(), hh: await doHinhHoc() };
    await chup(`home-${k}`);
  }
}
console.log(JSON.stringify(ket, null, 1));
await b.close();
