/**
 * scripts/nen-chrome/do-va-chup.js — ĐO BẰNG TRÌNH DUYỆT THẬT rồi chụp lại bộ nền chrome.
 *
 * Chạy sau `dung-trang.ts`. In ra số ĐO ĐƯỢC (không phải số đọc từ mã):
 *   · vòng focus: có bắt :focus-visible không · kiểu/độ dày/màu/offset thật
 *   · từng bề mặt: nền · backdrop-filter · bo góc · z-index đã tính
 *   · nhãn nguồn: chiều cao · cỡ chữ · màu chữ · kiểu viền (đứt/chấm — kênh dự phòng khi mất màu)
 *
 * Ảnh đổ vào thư mục ra (mặc định `.nen-chrome-out/`, đã gitignore) — KHÔNG commit ảnh vào repo,
 * theo luật dọn ảnh 24/07 + `.gitignore:74 docs/**\/*.png`. Số đo thì chép vào báo cáo phiên.
 *
 * CHẠY: node scripts/nen-chrome/do-va-chup.js [thư-mục-ra]
 * Máy sandbox có sẵn Chromium ở /opt/pw-browsers/chromium (PLAYWRIGHT_BROWSERS_PATH).
 */
const { chromium } = require('playwright');
const { join } = require('path');
const { existsSync } = require('fs');

const RA = process.argv[2] ?? join(__dirname, '..', '..', '.nen-chrome-out');
const CHROMIUM = process.env.IF_CHROMIUM ?? '/opt/pw-browsers/chromium';

(async () => {
  const browser = await chromium.launch(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  let loi = 0;
  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto('file://' + join(RA, `trang-${theme}.html`));
    await page.waitForTimeout(400);

    // Focus bằng BÀN PHÍM (Tab), không phải .focus() — :focus-visible chỉ bắt đường bàn phím.
    await page.focus('#do-focus');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');

    const vongFocus = await page.evaluate(() => {
      const el = document.getElementById('do-focus');
      const cs = getComputedStyle(el);
      return {
        dangFocus: document.activeElement === el,
        batFocusVisible: el.matches(':focus-visible'),
        vien: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`,
      };
    });

    const beMat = await page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll('[data-surface]')].map((el) => [
        el.dataset.surface + (el.classList.contains('if-surface--solid') ? '(solid)' : ''),
        { nen: getComputedStyle(el).backgroundColor, kinh: getComputedStyle(el).backdropFilter, bo: getComputedStyle(el).borderRadius, z: getComputedStyle(el).zIndex },
      ])),
    );

    const nhanNguon = await page.evaluate(() =>
      [...document.querySelectorAll('.if-truth')].slice(0, 5).map((el) => {
        const cs = getComputedStyle(el);
        return { nac: el.dataset.truth, cao: Math.round(el.getBoundingClientRect().height), coChu: cs.fontSize, mau: cs.color, bo: cs.borderRadius, vien: cs.borderTopStyle };
      }),
    );

    if (!vongFocus.batFocusVisible || vongFocus.vien.startsWith('none')) { loi += 1; console.log(`  ❌ ${theme}: vòng focus KHÔNG hiện qua đường bàn phím`); }
    if (beMat['inspector'] && beMat['inspector'].kinh !== 'none') { loi += 1; console.log(`  ❌ ${theme}: inspector đang có kính (phải ĐẶC — nội dung dày chữ)`); }

    console.log(`\n── ${theme} ──`);
    console.log(JSON.stringify({ vongFocus, beMat, nhanNguon }, null, 1));
    await page.screenshot({ path: join(RA, `nen-chrome-${theme}.png`) });
    await page.close();
  }
  await browser.close();
  console.log(`\n${loi ? '❌' : '✅'} nen-chrome: ${loi ? loi + ' lệch' : 'đo xong, không lệch'} → ảnh ở ${RA}`);
  process.exit(loi ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
