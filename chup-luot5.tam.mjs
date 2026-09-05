/**
 * chup-luot5.mjs — CHỤP NGHIỆM THU MŨI ① (lượt 5, bàn cl:06).
 *
 * VÌ SAO LÀ MỘT LỆNH HOÀ CHẠY, KHÔNG PHẢI MÁY TỰ CHẠY: cổng `claude-role-guard` không xếp
 * `playwright`/`next dev` vào hạng đọc/verify, và writer KHÔNG tự nới cổng của chính mình
 * (y phiếu ROLE-GUARD 30/08). Nên phần cần quyền do Hoà bấm.
 *
 * KHÔNG ĐỤNG MẬT KHẨU: dùng lại HỒ SƠ PHIÊN đã có sẵn `~/.if-phien-chup-man` — đúng hồ sơ
 * `scripts/chup-man-duyet-mat.mjs` đang dùng. Chưa đăng nhập thì script DỪNG và chỉ đúng
 * lệnh đăng nhập tay, không tự nhập gì.
 *
 * CHẠY:  node <đường-dẫn-tệp-này>
 * Tuỳ chọn: IF_URL=http://localhost:3001 (mặc định) · IF_PROJECT_ID=<id>
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const URL_GOC = process.env.IF_URL ?? 'http://localhost:3001';
const PHIEN = join(homedir(), '.if-phien-chup-man');
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'anh-luot5');

const soDong = [];
const ghi = (s) => { console.log(s); soDong.push(s); };

async function main() {
  mkdirSync(OUT, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PHIEN, {
    headless: true,
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    locale: 'vi-VN',
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  page.on('console', (m) => { if (m.type() === 'error') ghi(`   ⚠️ console: ${m.text().slice(0, 200)}`); });

  // ── ⓪ ĐÚNG RUNTIME CHƯA — hỏi chính máy chủ, không suy từ cổng ──────────────
  const dv = await page.request.get(`${URL_GOC}/api/dev-identity`).catch(() => null);
  ghi(`⓪ /api/dev-identity → ${dv ? dv.status() : 'KHÔNG GỌI ĐƯỢC'}`);
  if (dv?.ok()) ghi(`   ${(await dv.text()).slice(0, 400)}`);

  await page.goto(URL_GOC, { waitUntil: 'domcontentloaded' });
  const me = await page.request.get(`${URL_GOC}/api/auth/me`).catch(() => null);
  if (!me?.ok()) {
    console.error(
      '\n⛔ CHƯA ĐĂNG NHẬP — hồ sơ phiên đã hết hạn.\n' +
      '   Chạy MỘT LẦN, đăng nhập tay rồi đóng cửa sổ:\n' +
      `     IF_URL=${URL_GOC} node scripts/chup-man-duyet-mat.mjs --dang-nhap\n` +
      '   Rồi chạy lại lệnh này.\n');
    await ctx.close();
    process.exit(1);
  }
  ghi('✅ phiên đăng nhập còn hiệu lực');

  // dự án thật để mở chặng 3D
  let duAn = process.env.IF_PROJECT_ID ?? '';
  if (!duAn) {
    await page.waitForTimeout(2500);
    duAn = await page.evaluate(() => {
      const a = document.querySelector('a[href*="/projects/"]');
      return a?.getAttribute('href')?.match(/\/projects\/([^/?#]+)/)?.[1] ?? '';
    }).catch(() => '');
  }
  ghi(`📁 dự án: ${duAn || '(KHÔNG TÌM RA — bỏ 2 khung cần dự án)'}`);

  const chup = async (ten) => {
    await page.screenshot({ path: join(OUT, `${ten}.png`) });
    ghi(`   📸 ${ten}.png`);
  };
  const bam = async (ten, opt = {}) => {
    const n = page.getByRole('button', { name: ten, exact: false }).first();
    await n.waitFor({ state: 'visible', timeout: opt.cho ?? 8000 });
    await n.click();
    await page.waitForTimeout(opt.sau ?? 900);
  };

  // ── ① DẢI GANTT ────────────────────────────────────────────────────────────
  ghi('\n① /tasks — tab Tiến độ');
  await page.goto(`${URL_GOC}/tasks`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  try {
    await bam('Tiến độ', { sau: 1200 });
    const so = await page.evaluate(() => {
      const t = document.body.innerText;
      return {
        cuaSo: t.match(/\d{2}\/\d{2}\/\d{4}\s*→\s*\d{2}\/\d{2}\/\d{4}/)?.[0] ?? null,
        ngayViec: t.match(/(\d+)\s*ngày\s*·\s*(\d+)\s*việc trên trục/)?.[0] ?? null,
        chuaXep: t.match(/(\d+)\s*việc chưa xếp được[^\n]*/)?.[0] ?? null,
        treHan: t.match(/(\d+)\s*việc quá hạn[^\n]*/)?.[0] ?? null,
        lyDo: Array.from(document.querySelectorAll('li')).map((l) => l.innerText).filter((s) => s.includes('—')).slice(0, 8),
      };
    });
    ghi(`   SỐ TRÊN MÀN: ${JSON.stringify(so, null, 1)}`);
    await chup('01-gantt-tien-do');
  } catch (e) { ghi(`   ⛔ ${String(e).slice(0, 300)}`); await chup('01-gantt-HONG'); }

  if (duAn) {
    // ── ② VIEWPORT 3D — chip điểm tụ ─────────────────────────────────────────
    ghi('\n② /projects/:id/render — chip điểm tụ + nút Máy 2 điểm tụ');
    await page.goto(`${URL_GOC}/projects/${duAn}/render`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    const doChip = () => page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div')).find((d) => /điểm tụ ·/.test(d.textContent ?? '') && d.children.length < 5);
      return el ? el.textContent.trim() : null;
    });
    try {
      ghi(`   chip TRƯỚC khi bấm: ${await doChip()}`);
      await chup('02a-viewport3d-truoc');
      await bam('Máy 2 điểm tụ', { sau: 1500 });
      ghi(`   chip SAU khi bấm  : ${await doChip()}`);
      await chup('02b-viewport3d-hai-diem-tu');
    } catch (e) {
      ghi(`   ⛔ ${String(e).slice(0, 300)}`);
      const nut = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean).slice(0, 60));
      ghi(`   nút đang thấy: ${JSON.stringify(nut)}`);
      await chup('02-viewport3d-HONG');
    }

    // ── ③ BẢN DỰNG THÔ ───────────────────────────────────────────────────────
    ghi('\n③ Tệp → Bản dựng thô (stringout)');
    try {
      await bam('Tệp', { sau: 700 });
      await bam('Bản dựng thô', { sau: 1500 });
      const so = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        const t = d?.innerText ?? '';
        return {
          maThoiGian: t.match(/\d{2}:\d{2}:\d{2}:\d{2}/)?.[0] ?? null,
          tong: t.match(/\d+\s*cảnh\s*·\s*\d+\s*khung\s*·\s*\d+\s*fps/)?.[0] ?? null,
          boQua: t.match(/Bỏ ra \d+ cảnh[^\n]*/)?.[0] ?? null,
          anh: t.match(/\d+ ảnh tĩnh[^\n]*/)?.[0] ?? null,
        };
      });
      ghi(`   SỐ TRÊN MÀN: ${JSON.stringify(so, null, 1)}`);
      await chup('03-stringout');
    } catch (e) { ghi(`   ⛔ ${String(e).slice(0, 300)}`); await chup('03-stringout-HONG'); }
  }

  writeFileSync(join(OUT, 'ket-qua.txt'), soDong.join('\n'));
  ghi(`\n📂 ảnh + sổ: ${OUT}`);
  await ctx.close();
}
main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
