/**
 * XÁC MINH CÁC CA H5 — cú chuột thật rơi vào TAY AI?
 *
 * 🔴 VÒNG 1 CỦA TỆP NÀY ĐO SAI, GHI LẠI VÌ BÀI HỌC ĐẮT: nó so "trước/sau cú bấm có đổi DOM
 * không" rồi kết luận *"🟢 chuột vẫn tới được"* cho cả ba ca. Sai ở chỗ **có việc xảy ra
 * không có nghĩa là việc của ĐÚNG NÚT ĐÓ** — bấm vào nút "Markup" mà thứ mở ra là "bảng
 * kiểm" thì DOM vẫn đổi, phép đo vẫn xanh, trong khi người dùng nhận nhầm hàng. Và đó là
 * biểu hiện TỆ HƠN im lặng: im lặng thì người dùng biết mà thử cách khác.
 *
 * ⇒ Vòng 2 bỏ hẳn phép so DOM, hỏi thẳng trình duyệt một câu tất định: gắn listener ở pha
 * BẮT trên `window`, bấm `mouse.click(tâm)`, rồi đọc `event.target`. Trúng đích khi target
 * là chính nút, con nó, hoặc tổ tiên nó. Không suy diễn, không phụ thuộc trạng thái còn
 * sót của lần bấm trước.
 *
 * Chạy: node scripts/nghiem-thu-ban-lam-viec/xac-minh-che.mjs
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const GOC = process.env.IF_URL ?? 'http://localhost:3094';
const PID = process.env.IF_PID ?? 'cmtmdaaws00017dmmhactp691';
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.IF_OUT ?? 'docs/delivery/anh-duyet-mat/nut-noi-doi';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
  });
  console.log('login', r.status());
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();

/** Đánh dấu nút đích, cài bẫy nghe cú bấm, trả tâm nút. */
const datBay = (khoa) => page.evaluate((k) => {
  const CHON = 'button,a[href],input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])';
  const ten = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || (e.textContent || '').trim() || e.getAttribute('placeholder') || '');
  const e = [...document.querySelectorAll(CHON)].find((x) => ten(x).includes(k));
  if (!e) return null;
  e.setAttribute('data-dich', '1');
  const r = e.getBoundingClientRect();
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const mo = (el) => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${(typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).slice(0, 2).join('.')}` : 'null';

  window.__batDuoc = null;
  window.__nghe = (ev) => {
    if (window.__batDuoc) return;
    const dich = document.querySelector('[data-dich]');
    window.__batDuoc = {
      nhan: mo(ev.target),
      nhanTen: ((ev.target.getAttribute?.('aria-label')) || (ev.target.textContent || '').trim()).slice(0, 40),
      TRUNG_DICH: !!dich && (ev.target === dich || dich.contains(ev.target) || ev.target.contains?.(dich)),
    };
  };
  window.addEventListener('click', window.__nghe, true); // pha BẮT — nghe trước mọi handler
  return { cx: Math.round(cx), cy: Math.round(cy), hop: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, taiTam: mo(document.elementFromPoint(cx, cy)) };
}, khoa);

const CA = [
  ['2D', `/projects/${PID}/cad`, 'Markup'],
  ['2D', `/projects/${PID}/cad`, 'Gõ lệnh'],
  ['3D', `/projects/${PID}/render`, 'Style Transfer'],
  ['3D', `/projects/${PID}/render`, 'Relight'],
];

let loi = 0;
for (const [man, duong, khoa] of CA) {
  await page.goto(`${GOC}${duong}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2800);
  const v = await datBay(khoa);
  if (!v) { console.log(`\n[${man}] "${khoa}" — KHÔNG THẤY trên màn ⇒ không kết luận`); continue; }

  await page.mouse.click(v.cx, v.cy);
  await page.waitForTimeout(900);
  const bat = await page.evaluate(() => window.__batDuoc);

  console.log(`\n[${man}] "${khoa}"  hộp=(${v.hop.x},${v.hop.y},${v.hop.w}×${v.hop.h})  tâm=(${v.cx},${v.cy})`);
  console.log(`   tại tâm đang đứng : ${v.taiTam}`);
  if (!bat) {
    console.log('   cú chuột rơi vào  : (không sự kiện nào) ⇒ 🔴 BẤM VÀO KHÔNG AI NHẬN');
    loi++;
  } else {
    console.log(`   cú chuột rơi vào  : ${bat.nhan} "${bat.nhanTen}"`);
    console.log(`   ⇒ ${bat.TRUNG_DICH ? '🟢 TRÚNG nút đích' : '🔴 TRẬT — người dùng nhắm nút này, máy trao việc cho nút khác'}`);
    if (!bat.TRUNG_DICH) loi++;
  }
  await page.screenshot({ path: `${OUT}/che-${man}-${khoa.replace(/[\s:]+/g, '-')}.png` });
}

console.log(`\n── ${loi}/${CA.length} ca TRẬT ĐÍCH`);
await b.close();
