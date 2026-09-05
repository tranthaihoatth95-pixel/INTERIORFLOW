import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1','1'); } catch {} });
const p = await ctx.newPage();
const loi = []; p.on('pageerror', e => loi.push(String(e.message).slice(0,150)));
const api = []; p.on('response', r => { if (r.url().includes('/api/')) api.push(`${r.status()} ${r.request().method()} ${r.url().replace('http://localhost:3210','')}`); });
const email = `tdа.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('TDA');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);

api.length = 0; loi.length = 0;
const nut = p.locator('button:has-text("Tạo dự án mới")').first();
console.log('nút "Tạo dự án mới" có mặt:', await nut.count());
await nut.click().catch(e => console.log('bấm lỗi:', e.message.slice(0,80)));
await p.waitForTimeout(3500);
console.log('URL sau bấm:', p.url());
console.log('API gọi ra   :', api.length ? api.join(' | ') : '(KHÔNG GỌI API NÀO)');
console.log('lỗi JS       :', loi.length ? loi.join(' | ') : '(không)');
const sau = await p.evaluate(() => ({
  hopThoai: document.querySelectorAll('[role=dialog],dialog,[aria-modal=true]').length,
  oNhap: [...document.querySelectorAll('input:not([type=hidden])')].map(e=>e.placeholder||e.type).slice(0,6),
  chu: document.body.innerText.replace(/\s+/g,' ').slice(0,220),
}));
console.log('hộp thoại mở :', sau.hopThoai, '· ô nhập:', JSON.stringify(sau.oNhap));
console.log('chữ trên màn :', sau.chu);
await p.screenshot({ path: '/tmp/sau-bam-tao-du-an.png' });
await b.close();
