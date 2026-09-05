/**
 * .nen-kiem/luong-nghe.mjs — ĐI BẰNG TAY MỘT LUỒNG NGHỀ TRÊN APP THẬT.
 * Home → vào dự án → 2D đặt một vật → sửa → 3D gán vật liệu → Trình chiếu → về Home.
 * Mỗi trạm: chụp ảnh + đếm thứ bấm được + BẤM THẬT rồi xem có việc gì xảy ra không.
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'fs';

const GOC = process.env.IF_URL ?? 'http://localhost:3081';
const RA = '.nen-kiem/out';
mkdirSync(RA, { recursive: true });

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
const loi = [];
page.on('console', (m) => { if (m.type() === 'error') loi.push(m.text().slice(0, 220)); });
page.on('pageerror', (e) => loi.push('PAGEERROR ' + String(e).slice(0, 220)));

const nhatKy = [];
const ghi = (o) => { nhatKy.push(o); console.log(JSON.stringify(o)); };

async function chup(ten) { await page.screenshot({ path: `${RA}/lg-${ten}.png` }); }

/** Liệt kê MỌI thứ bấm được đang hiện, kèm nhãn đọc được. */
async function damBam() {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('button,[role="button"],a[href],input,select,[tabindex]:not([tabindex="-1"])')];
    const hien = els.filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
    });
    const ten = (e) => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
    return {
      tong: hien.length,
      moVoHieu: hien.filter((e) => e.getAttribute('aria-disabled') === 'true' || e.hasAttribute('disabled')).length,
      khongNhan: hien.filter((e) => !ten(e)).length,
      nhan: hien.slice(0, 60).map(ten),
    };
  });
}

const projectId = process.env.IF_PROJ ?? '';

/* ── TRẠM 1 · HOME ─────────────────────────────────────────────── */
await page.goto(GOC, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await chup('01-home');
ghi({ tram: '1 Home', url: page.url(), ...(await damBam()) });

/* ── TRẠM 2 · VÀO DỰ ÁN (bấm THẬT một dòng ở cột phải) ──────────── */
const theDuAn = page.locator('.xuong-home .ke-ben').first();
const truoc = page.url();
await theDuAn.click({ timeout: 5000 }).catch((e) => ghi({ tram: '2', loi: 'không bấm được thẻ dự án: ' + String(e).slice(0, 120) }));
await page.waitForTimeout(1800);
ghi({ tram: '2 vào dự án', truoc, sau: page.url(), doi: truoc !== page.url() });
await chup('02-vao-du-an');

const m = page.url().match(/\/projects\/([^/]+)/);
const pid = m ? m[1] : projectId;
ghi({ pid });

/* ── TRẠM 3 · 2D ───────────────────────────────────────────────── */
if (pid) {
  await page.goto(`${GOC}/projects/${pid}/cad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await chup('03-2d');
  ghi({ tram: '3 · 2D', url: page.url(), ...(await damBam()) });

  // đếm entity TRƯỚC
  const dem0 = await page.evaluate(() => document.querySelectorAll('canvas').length);
  ghi({ tram: '3 · canvas', soCanvas: dem0 });

  // BẤM công cụ vẽ đường rồi kéo trên canvas — dùng page.mouse để KHÔNG bị lớp phủ chặn
  const cv = page.locator('canvas').first();
  const hop = await cv.boundingBox();
  const demEntity = () => page.evaluate(() => {
    // đọc kho CAD qua devtools hook nếu có; nếu không thì đếm nút "hoàn tác" bật/tắt
    const b = [...document.querySelectorAll('button,[role="button"]')].find((e) => /hoàn tác|undo/i.test(e.getAttribute('aria-label') || e.textContent || ''));
    return { undoCo: !!b, undoMo: b ? (b.getAttribute('aria-disabled') === 'true' || b.hasAttribute('disabled')) : null };
  });
  ghi({ tram: '3 · trước vẽ', ...(await demEntity()) });
  if (hop) {
    // ① cú chạm ĐẦU — theo mã, lớp phủ bàn-trống chỉ TỰ ĐÓNG, không chuyển tiếp xuống canvas
    await page.mouse.click(hop.x + 200, hop.y + 200);
    await page.waitForTimeout(400);
    const conPhu = await page.evaluate(() => !!document.querySelector('[data-empty-drawing-overlay]'));
    ghi({ tram: '3 · sau cú chạm đầu', conLopPhu: conPhu });
    // ② gõ W (cad.draw.wall) rồi kéo hai điểm
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(300);
    await page.mouse.click(hop.x + 300, hop.y + 300);
    await page.waitForTimeout(250);
    await page.mouse.move(hop.x + 620, hop.y + 300, { steps: 10 });
    await page.mouse.click(hop.x + 620, hop.y + 300);
    await page.waitForTimeout(250);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    await chup('04-2d-sau-thao-tac');
  }
  ghi({ tram: '3 · sau vẽ', ...(await demEntity()), loiConsole: loi.length });
  // ③ SỐNG SÓT SAU TẢI LẠI — luật PASS
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const conTrong = await page.evaluate(() => !!document.querySelector('[data-empty-drawing-overlay]'));
  ghi({ tram: '3 · sau TẢI LẠI', banVeVanTrong: conTrong });
  await chup('04b-2d-sau-tai-lai');
}

/* ── TRẠM 4 · 3D ───────────────────────────────────────────────── */
if (pid) {
  await page.goto(`${GOC}/projects/${pid}/render`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await chup('05-3d');
  ghi({ tram: '4 · 3D', url: page.url(), ...(await damBam()) });
}

/* ── TRẠM 5 · TRÌNH CHIẾU ──────────────────────────────────────── */
if (pid) {
  await page.goto(`${GOC}/projects/${pid}/present`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await chup('06-present');
  ghi({ tram: '5 · Trình chiếu', url: page.url(), ...(await damBam()) });
}

/* ── TRẠM 6 · VỀ HOME ──────────────────────────────────────────── */
await page.goto(GOC, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await chup('07-ve-home');
ghi({ tram: '6 · về Home', url: page.url() });

writeFileSync(`${RA}/luong-nghe.json`, JSON.stringify({ nhatKy, loiConsole: loi }, null, 1));
console.log('LỖI CONSOLE:', loi.length);
loi.slice(0, 12).forEach((l) => console.log('  ·', l));
await b.close();
