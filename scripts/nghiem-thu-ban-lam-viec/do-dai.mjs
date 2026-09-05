/**
 * Đo dải môi trường bằng PIXEL THẬT — tránh mọi vùng có vật đè lên.
 * Toạ độ tuyệt đối trên màn 1600×900 (rail 240 · mép trên 42 · dải cao 420 · hiện vật x296..1144 y210..672).
 * Cột LỀ TRÁI x 246..290 là dải trần, không vật nào đè.
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'fs';
import sharp from '/home/user/INTERIORFLOW/node_modules/sharp/dist/index.mjs';

const GOC = process.env.IF_URL ?? 'http://localhost:3081';
mkdirSync('.nen-kiem/out', { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  if (!r.ok()) throw new Error('login ' + r.status());
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();

const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
const tp = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return +((hi + 0.05) / (lo + 0.05)).toFixed(3); };
const dL = (a, b) => +Math.abs(lum(a) - lum(b)).toFixed(4);

async function doMot(theme) {
  await page.goto(GOC, { waitUntil: 'networkidle' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; try { localStorage.setItem('interiorflow.theme', t); } catch {} }, theme);
  await page.waitForTimeout(1400);
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = (n) => cs.getPropertyValue(n).trim();
    return { bg: g('--bg'), panel: g('--panel'), card: g('--card'), border: g('--border') };
  });
  const buf = await page.screenshot();
  await sharp(buf).toFile(`.nen-kiem/out/home-${theme}.png`);
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (info.width * y + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  const vung = (x0, x1, y0, y1) => {
    const o = [];
    for (let y = y0; y <= y1; y += 3) for (let x = x0; x <= x1; x += 3) o.push(px(x, y));
    const s = o.reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0]);
    return s.map((v) => Math.round(v / o.length));
  };
  // LỀ TRÁI của sân — dải trần, không vật đè
  const daiTren = vung(248, 288, 100, 160);   // trong dải, trên hiện vật
  const daiGiua = vung(248, 288, 200, 300);   // giữa dải
  const daiCuoi = vung(248, 288, 400, 450);   // vùng mask tan
  const nenTran = vung(248, 288, 700, 800);   // dưới dải hẳn → nền app trần
  return {
    theme, tokens, daiTren, daiGiua, daiCuoi, nenTran,
    tp_tren_nen: tp(daiTren, nenTran), dL_tren_nen: dL(daiTren, nenTran),
    tp_giua_nen: tp(daiGiua, nenTran), dL_giua_nen: dL(daiGiua, nenTran),
    tp_cuoi_nen: tp(daiCuoi, nenTran),
  };
}

const ket = [await doMot('dark'), await doMot('light')];
console.log(JSON.stringify(ket, null, 1));
writeFileSync('.nen-kiem/out/do-dai.json', JSON.stringify(ket, null, 1));
await b.close();
