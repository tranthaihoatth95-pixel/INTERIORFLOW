/**
 * .nen-chup/luong-home.mjs — chấm Home theo LUỒNG trên app thật, và chứng minh LUẬT PASS.
 *
 *   ① tạo dữ liệu THẬT bằng chính API của app (không nhét thẳng vào CSDL)
 *   ② mở app → Home → thấy dự án thật ở bậc KỀ BÊN
 *   ③ bấm một dự án → vào trong → quay về Home  (ngữ cảnh không đứt)
 *   ④ ⭐ LUẬT PASS: THAO TÁC → GHI XUỐNG → TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT
 *      (bày lại kệ widget bằng BÀN PHÍM, không bằng chuột — kéo thả không được là kênh duy nhất)
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const GOC = 'http://localhost:3031';
const RA = '.nen-chup/out';
const DICH = 'docs/delivery/anh-duyet-mat/home-that';
mkdirSync(RA, { recursive: true });
mkdirSync(DICH, { recursive: true });

const ghi = [];
function noi(...a) {
  const s = a.join(' ');
  ghi.push(s);
  console.log(s);
}

const bh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await bh.newContext({ viewport: { width: 1600, height: 900 } });

// ── ① dữ liệu THẬT qua chính API của app ──────────────────────────────────────
const api = await ctx.newPage();
await api.request.post(`${GOC}/api/auth/login`, {
  data: { identifier: 'tho@interiorflow.test', password: 'matkhau123' },
});
const me = await (await api.request.get(`${GOC}/api/auth/me`)).json();
const uid = me.user.id;

// ⚠️ TÊN PHẢI TỰ KHAI LÀ DEMO (§28 + CONTENT-RULES: dữ liệu app · demo · khách hàng KHÔNG
// được trộn). Bản trước dùng tên địa danh/chủ đầu tư thật ("Thảo Điền" · "Nam Long" · "An Phú")
// — chúng đọc ra như dự án KHÁCH THẬT trên màn mà không có dấu hiệu nào nói là mẫu. Nay tên
// mang tiền tố DEMO nên nhìn phát biết, không cần thêm trường dữ liệu nào.
const TEN = ['DEMO · Căn hộ mẫu A', 'DEMO · Nhà phố mẫu B', 'DEMO · Văn phòng mẫu C'];
const daCo = await (await api.request.get(`${GOC}/api/flows`)).json();
if ((daCo.projects?.length ?? 0) < TEN.length) {
  for (const ten of TEN) {
    const r = await api.request.post(`${GOC}/api/flows`, { data: { type: 'project', name: ten } });
    const b = await r.json();
    if (b?.project?.id) {
      await api.request.post(`${GOC}/api/flows`, {
        data: { name: `${ten} · bản vẽ`, projectId: b.project.id },
      });
    }
  }
}
const sau = await (await api.request.get(`${GOC}/api/flows`)).json();
noi('① dữ liệu thật:', sau.projects?.length ?? 0, 'dự án ·', sau.flows?.length ?? 0, 'flow');
await api.goto(GOC);
await api.evaluate((id) => {
  try {
    localStorage.setItem(`interiorflow.tourDone.${id}`, '1');
  } catch {}
}, uid);
await api.close();

const page = await ctx.newPage();
async function chup(ten) {
  const f = join(RA, `${ten}.png`);
  await page.screenshot({ path: f });
  copyFileSync(f, join(DICH, `${ten}.png`));
}

// ── ② Home với dữ liệu THẬT ───────────────────────────────────────────────────
await page.goto(GOC, { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
const b2 = await page.evaluate(() => ({
  keBen: [...document.querySelectorAll('.xuong-home .ke-ben .ten')].map((n) => n.textContent),
  nen: [...document.querySelectorAll('.xuong-home .o-nen .ten')].map((n) => n.textContent),
  than: document.querySelector('.xuong-home .vat .ten')?.textContent ?? null,
  demo: !!document.querySelector('.xuong-home .the-demo'),
}));
noi('② Home dữ liệu THẬT · tiêu điểm:', JSON.stringify(b2.than), '· kề bên:', b2.keBen.length, '· nền:', b2.nen.length, '· nhãn demo:', b2.demo);
await chup('luong-1-home-that');

// ── ③ bấm một dự án → vào trong → quay về ────────────────────────────────────
if (b2.keBen.length > 0) {
  await page.click('.xuong-home .ke-ben');
  // Chờ ĐÚNG đích thay vì chờ mù một khoảng thời gian: điều hướng phía client mất bao lâu là
  // tuỳ máy, chờ mù thì lúc bắt được lúc không — và một phép đo lúc được lúc không thì
  // KHÔNG PHẢI bằng chứng.
  await page.waitForURL(/\/projects\/[^/]+\/overview/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  noi('③ vào dự án · URL:', page.url().replace(GOC, ''));
  await chup('luong-2-vao-du-an');
  await page.goto(GOC, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  const ve = await page.evaluate(() => ({
    than: document.querySelector('.xuong-home .vat .ten')?.textContent ?? null,
    kem: document.querySelector('.xuong-home .vat .kem')?.textContent ?? null,
  }));
  noi('③ về Home · tiêu điểm nay là:', JSON.stringify(ve.than), '·', JSON.stringify(ve.kem));
  await chup('luong-3-ve-home');
} else {
  noi('③ BỎ QUA — không có mục kề bên nào để bấm');
}

// ── ④ ⭐ LUẬT PASS ────────────────────────────────────────────────────────────
const truoc = await page.evaluate(() =>
  [...document.querySelectorAll('.xuong-home .o-w .nh')].map((n) => n.textContent),
);
noi('④ kệ widget TRƯỚC:', JSON.stringify(truoc));

if (truoc.length >= 2) {
  // Thao tác BẰNG BÀN PHÍM: Tab tới nút "sang phải" của ô đầu rồi Enter.
  const nut = page.locator('.xuong-home .o-w').first().locator('button[aria-label*="sang phải"]');
  await nut.focus();
  const coVongTieuDiem = await nut.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineWidth + ' ' + s.outlineStyle + ' ' + s.outlineColor, laFocus: el.matches(':focus-visible') };
  });
  noi('④ vòng tiêu điểm bàn phím trên nút bày lại:', JSON.stringify(coVongTieuDiem));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);

  const sauThaoTac = await page.evaluate(() =>
    [...document.querySelectorAll('.xuong-home .o-w .nh')].map((n) => n.textContent),
  );
  const daGhi = await page.evaluate((id) => localStorage.getItem(`interiorflow.home.ke-widget.${id}`), uid);
  noi('④ SAU THAO TÁC:', JSON.stringify(sauThaoTac));
  noi('④ ĐÃ GHI XUỐNG:', daGhi);

  // TẢI LẠI TRANG
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const sauTaiLai = await page.evaluate(() =>
    [...document.querySelectorAll('.xuong-home .o-w .nh')].map((n) => n.textContent),
  );
  noi('④ SAU TẢI LẠI:', JSON.stringify(sauTaiLai));

  // ĐI CHỖ KHÁC RỒI VÀO LẠI
  await page.goto(`${GOC}/files`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.goto(GOC, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const sauVaoLai = await page.evaluate(() =>
    [...document.querySelectorAll('.xuong-home .o-w .nh')].map((n) => n.textContent),
  );
  noi('④ SAU VÀO LẠI:', JSON.stringify(sauVaoLai));

  const doi = JSON.stringify(truoc) !== JSON.stringify(sauThaoTac);
  const giu =
    JSON.stringify(sauThaoTac) === JSON.stringify(sauTaiLai) &&
    JSON.stringify(sauTaiLai) === JSON.stringify(sauVaoLai);
  noi(`④ KẾT LUẬN LUẬT PASS: thao tác có đổi = ${doi} · tải lại và vào lại GIỮ NGUYÊN = ${giu} ⇒ ${doi && giu ? 'PASS' : 'KHÔNG PASS'}`);
  await chup('luong-4-luat-pass');
} else {
  noi('④ BỎ QUA — kệ widget có ít hơn 2 ô');
}

// ── ⑤ prefers-reduced-motion — nhánh THẬT, không phải khai suông ─────────────
const ctx2 = await bh.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' });
const p2 = await ctx2.newPage();
await p2.request.post(`${GOC}/api/auth/login`, {
  data: { identifier: 'tho@interiorflow.test', password: 'matkhau123' },
});
await p2.goto(`${GOC}/?demo=co-viec`, { waitUntil: 'networkidle' });
await p2.waitForTimeout(1200);
const rm = await p2.evaluate(() => {
  const v = document.querySelector('.xuong-home .vat');
  const k = document.querySelector('.xuong-home .ke-ben');
  const g = (n) => (n ? { animation: getComputedStyle(n).animationName, transition: getComputedStyle(n).transitionProperty } : null);
  return { vat: g(v), keBen: g(k) };
});
noi('⑤ giảm chuyển động BẬT →', JSON.stringify(rm));
await ctx2.close();

await bh.close();
console.log('\n--- xong ---');
