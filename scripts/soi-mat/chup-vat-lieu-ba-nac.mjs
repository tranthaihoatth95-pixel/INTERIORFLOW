/* CHỤP KHO VẬT LIỆU — ba nấc SCAN / JUDGE / INSPECT của CÙNG MỘT vật liệu, trên app THẬT.
 *
 * 🔴 BA BẪY GIỮ NGUYÊN CÁCH CHẶN (chép khuôn `chup-toan-man.mjs`):
 *  ① cổng gõ cứng ⇒ chụp nhầm server làn khác. Nhận qua CONG.
 *  ② chụp sớm ⇒ ảnh vòng quay ⇒ đọc thành "màn trống". Chờ chữ ĐỨNG YÊN + hết phần tử quay.
 *  ③ đi trật route mà nuốt lỗi ⇒ bộ ảnh NÓI DỐI. Kiểm `location.pathname` sau mỗi lần đi.
 *
 * Đo kèm ảnh: `tongImg` · `tongCanvas` · số hàng · chuỗi ba mặt · chữ ở tiêu đề — để ảnh không
 * phải là bằng chứng duy nhất.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.env.OUT || '/tmp/vat-lieu-ba-nac';
const CONG = process.env.CONG || '3277';
const THEME = process.env.THEME || 'toi';
const RONG = Number(process.env.RONG || 1440);
/* WEBGL=tat — giả lập MÁY TẮT WEBGL. Không phải một cổng máy soi; là cách chạy lại BẰNG TAY cái
   proof cho bất biến "một ô hỏng chỉ hỏng chính nó". Ca đã xảy ra thật: lượt render ngã ⇒
   unhandled rejection ⇒ overlay lỗi toàn trang ⇒ TRẮNG cả kho vật liệu. */
const TAT_WEBGL = process.env.WEBGL === 'tat';
const BASE = `http://localhost:${CONG}`;
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: RONG, height: 900 } });
/* Khoá theme ĐỌC TỪ NGUỒN: `lib/store.ts:321` `THEME_KEY = 'interiorflow.theme'`. Đoán tên khoá
   là cách chắc chắn nhất để chụp hai lần cùng một theme rồi tưởng đã đo đủ hai. */
await ctx.addInitScript(({ th, tat }) => {
  try {
    localStorage.setItem('if_intro_seen_v1', '1');
    localStorage.setItem('interiorflow.theme', th === 'sang' ? 'light' : 'dark');
  } catch {}
  if (!tat) return;
  /* Chặn ĐÚNG ngữ cảnh webgl, để canvas 2D (vân procedural) vẫn chạy — nếu chặn cả hai thì
     phép thử không phân biệt được "mất quả cầu" với "mất mọi thứ". */
  const goc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) {
    if (typeof t === 'string' && t.includes('webgl')) return null;
    return goc.call(this, t, ...r);
  };
}, { th: THEME, tat: TAT_WEBGL });
const p = await ctx.newPage();
const loi = [];
p.on('pageerror', (e) => loi.push(String(e.message).slice(0, 140)));

async function doiYen(max = 20) {
  let truoc = -1, yen = 0;
  for (let k = 0; k < max; k++) {
    const s = await p.evaluate(() => ({
      chu: document.body.innerText.trim().length,
      quay: !!document.querySelector('[class*=animate-spin],[class*=spinner],[aria-busy=true]'),
    }));
    if (s.chu > 60 && s.chu === truoc && !s.quay) { if (++yen >= 2) break; } else yen = 0;
    truoc = s.chu;
    await p.waitForTimeout(1200);
  }
  await p.waitForTimeout(1200);
}

async function doMan() {
  return p.evaluate(() => ({
    tongImg: document.querySelectorAll('img').length,
    tongCanvas: document.querySelectorAll('canvas').length,
    soHang: document.querySelectorAll('tbody tr').length,
    oHong: document.querySelectorAll('[data-o-hong]').length,
    coBang: !!document.querySelector('table'),
    tieuDe: (document.body.innerText.split('\n').slice(0, 6).join(' | ')).slice(0, 160),
    baMat: [...document.querySelectorAll('[data-ba-mat]')].map((e) => e.getAttribute('data-ba-mat')),
  }));
}

const ket = {};

/* ── ① CHƯA ĐĂNG NHẬP — số đếm ở tiêu đề phải KHỚP thân trang ── */
await p.goto(BASE + '/materials', { waitUntil: 'domcontentloaded', timeout: 60000 });
await doiYen();
await p.screenshot({ path: `${OUT}/00-chua-dang-nhap-${THEME}-${RONG}.png` });
ket.chuaDangNhap = { ...(await doMan()), loi: loi.slice(0, 2) };
console.log('CHƯA ĐĂNG NHẬP', JSON.stringify(ket.chuaDangNhap));

/* ── đăng ký ── */
loi.length = 0;
const email = `vatlieu.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForTimeout(3000);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {});
await p.waitForTimeout(700);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Bàn Vật Liệu');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {});
await p.waitForTimeout(8000);

/* ── ② NẤC SCAN — bảng kho ── */
loi.length = 0;
await p.goto(BASE + '/materials', { waitUntil: 'domcontentloaded', timeout: 60000 });
await doiYen();
if (await p.evaluate(() => location.pathname) !== '/materials') { console.log('⛔ ĐI TRẬT'); process.exitCode = 1; }
await p.screenshot({ path: `${OUT}/01-scan-bang-${THEME}-${RONG}.png` });
ket.scan = { ...(await doMan()), loi: loi.slice(0, 2) };
console.log('SCAN', JSON.stringify(ket.scan));

/* ── ③ NẤC JUDGE — mở panel một-vật-ba-mặt của hàng ĐẦU ── */
loi.length = 0;
const moBaMat = p.locator('tbody tr').first().locator('[data-mo-ba-mat], button').filter({ hasText: /2D|3D|Giá/ }).first();
if (await moBaMat.count()) await moBaMat.click().catch(() => {});
else await p.locator('tbody tr').first().locator('button').nth(0).click().catch(() => {});
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/02-judge-${THEME}-${RONG}.png` });
ket.judge = { ...(await doMan()), loi: loi.slice(0, 2) };
console.log('JUDGE', JSON.stringify(ket.judge));

/* Kiểm THEO THẾ GIỚI: theme thật sự đang bật là gì. Chụp hai lần cùng một theme rồi khai là
   "đủ hai theme" là bộ ảnh nói dối. */
ket.themeThat = await p.evaluate(() => document.documentElement.dataset.theme || '(chưa đặt)');
console.log('THEME THẬT =', ket.themeThat);

/* ── ④ NẤC INSPECT — bấm nút soi khổ thật trong chính panel đó ── */
loi.length = 0;
const nutInspect = p.locator('[data-nac="inspect"]').first();
if (await nutInspect.count()) {
  await nutInspect.click().catch(() => {});
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/03-inspect-${THEME}-${RONG}.png` });
  /* SỐ, KHÔNG PHẢI MẮT: ảnh không chứng minh được "lát đúng khổ". Đo bề rộng dải THẬT trên DOM
     rồi chia cho bề rộng một tấm ⇒ phải ra đúng `repeat` mà hợp đồng khai (1,5 với ván 1200 mm
     trong khung soi 1800 mm). Lệch là ảnh và thước đang nói hai điều khác nhau. */
  ket.latDungKho = await p.evaluate(() => {
    const el = document.querySelector('[data-nen-van]');
    if (!el) return null;
    const rong = el.getBoundingClientRect().width;
    const co = el.getAttribute('data-nen-van') || '';
    const tile = parseFloat(co);
    return { rongDai: Math.round(rong * 10) / 10, coNen: co, soTamNgang: Math.round((rong / tile) * 100) / 100 };
  });
  console.log('LÁT ĐÚNG KHỔ', JSON.stringify(ket.latDungKho));
  ket.inspect = { ...(await doMan()), loi: loi.slice(0, 2) };
  console.log('INSPECT', JSON.stringify(ket.inspect));
} else {
  console.log('INSPECT — CHƯA CÓ NÚT');
  ket.inspect = null;
}

/* ── ⑤ MÓN THỨ HAI ở nấc JUDGE — hai vật liệu phải PHÂN BIỆT ĐƯỢC bằng vân, không chỉ bằng
      đậm nhạt. Không chụp món thứ hai thì không có cách nào phán câu đó. ── */
loi.length = 0;
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
const hang2 = p.locator('tbody tr').nth(1).locator('button').filter({ hasText: /2D|3D|Giá/ }).first();
if (await hang2.count()) {
  await hang2.click().catch(() => {});
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/04-judge-mon-2-${THEME}-${RONG}.png` });
  ket.judgeMon2 = { ...(await doMan()), loi: loi.slice(0, 2) };
  console.log('JUDGE MÓN 2', JSON.stringify(ket.judgeMon2));
}

if (TAT_WEBGL) {
  /* Ba khẳng định của bất biến, đo bằng SỐ chứ không bằng mắt. */
  const t = ket.judge || {};
  const cauBao = await p.evaluate(() => /WebGL/i.test(document.body.innerText));
  console.log(`\nWEBGL TẮT — bảng còn sống: ${t.coBang} · hàng: ${t.soHang} · ô tự khai hỏng: ${t.oHong} · có câu báo THẤY ĐƯỢC: ${cauBao} · lỗi trang: ${(t.loi || []).length}`);
  ket.webglTat = { ...t, cauBaoThayDuoc: cauBao };
}

fs.writeFileSync(`${OUT}/do-${THEME}-${RONG}.json`, JSON.stringify(ket, null, 2));
console.log(`\n→ ${OUT}`);
await b.close();
