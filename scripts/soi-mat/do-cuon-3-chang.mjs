/* LÔ DUYỆT MẮT — chụp đúng những mặt mà 30 mục "cần mắt Hoà" đang sống trên đó.
 * Khác lượt chụp trước: TẠO DỰ ÁN rồi mới đi, vì 11/30 mục nằm ở ba chặng 2D/3D/Trình bày
 * mà không có dự án thì không vào được.
 * Tên tệp mang MÃ MỤC trong sổ frontier ⇒ Hoà phán "ok/lệch" là ánh xạ thẳng về sổ, không phải
 * dịch qua một lớp mô tả nào. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.env.OUT || '/tmp/lo-duyet-mat';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3210';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();
const loi = [];
p.on('pageerror', (e) => loi.push(String(e.message).slice(0, 120)));

const email = `lo.mat.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {});
await p.waitForTimeout(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Lô Duyệt');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {});
await p.waitForTimeout(7000);
console.log('đăng ký xong →', p.url());

// ── TẠO DỰ ÁN (không có dự án thì ba chặng đều khoá) ──
await p.locator('button:has-text("Tạo dự án mới")').first().click().catch(() => {});
await p.waitForTimeout(2500);
/* 🔴 BẪY: ô `input` ĐẦU TRANG là ô TÌM KIẾM trên thanh trên, không phải ô trong hộp thoại.
 * Lượt đầu tôi điền vào đó rồi tưởng app hỏng. Phải khoanh vùng trong [role=dialog]. */
/* 🔴 BẪY THỨ HAI: trang có HAI [role=dialog]; `.last()` lấy trúng cái KHÔNG chứa nút.
 * Chọn theo NỘI DUNG (hộp nào có nút "Tạo dự án") chứ không theo thứ tự. */
const hop = p.locator('[role=dialog],[aria-modal=true]').filter({ has: p.locator('button:has-text("Tạo dự án")') }).first();
await hop.locator('input[placeholder="Dự án mới"]').first().fill('Căn hộ Thảo Điền').catch(() => {});
await hop.locator('input[placeholder="120"]').first().fill('78').catch(() => {});
// khung việc: tick một mẫu để dự án có việc, đúng đường người dùng thật đi
await hop.locator('text=Concept dự án').first().click().catch(() => {});
await p.waitForTimeout(400);
// nút gửi nằm dưới đáy hộp thoại — cuộn hộp thoại xuống rồi mới tìm
await hop.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/00a-hop-thoai-tao-du-an.png` });
let daTao = false;
for (const nhan of ['Tạo dự án', 'Tạo', 'Bắt đầu', 'Xong', 'Lưu']) {
  const n = hop.locator(`button:has-text("${nhan}")`).last();
  if (await n.count()) { await n.click().catch(() => {}); await p.waitForTimeout(3500); daTao = true; break; }
}
console.log('đã bấm nút tạo:', daTao);
console.log('sau tạo dự án →', p.url());
await p.screenshot({ path: `${OUT}/00-sau-tao-du-an.png` });


const MAN = [['01-home','/'],['02-2d',null],['03-3d',null],['04-trinh-bay',null],
             ['05-vat-lieu','/materials'],['06-thu-vien','/library'],['09-files','/files']];
const RAIL = { '02-2d':'Thiết kế 2D','03-3d':'Thiết kế 3D','04-trinh-bay':'Trình chiếu' };
for (const [ten, path] of MAN) {
  if (path) await p.goto(BASE + path, { waitUntil:'domcontentloaded' }).catch(()=>{});
  else await p.locator(`text="${RAIL[ten]}"`).first().click({timeout:8000}).catch(()=>{});
  await p.waitForTimeout(3500);
  const r = await p.evaluate(()=>{
    const ra=[];
    for (const el of document.querySelectorAll('body *')) {
      const s=getComputedStyle(el);
      if(!/auto|scroll|overlay/.test(s.overflowY)) continue;
      const du=el.scrollHeight-el.clientHeight;
      if(du>8) ra.push({cls:(el.className||'').toString().slice(0,34)||el.tagName.toLowerCase(),
        cao:el.clientHeight, nd:el.scrollHeight, du, mang:el.offsetWidth-el.clientWidth});
    }
    return { url:location.pathname, cuon:ra.sort((a,b)=>b.du-a.du).slice(0,3) };
  });
  const xau = r.cuon.map(c=>`${c.cls}|thừa ${c.du}px|máng ${c.mang}`).join('  ·  ') || '(không vùng nào tràn)';
  console.log(`${ten.padEnd(13)} ${r.url.padEnd(46)} ${xau}`);
}
await b.close();
