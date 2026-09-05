/* React #418 = hydration mismatch: chữ máy chủ dựng ≠ chữ trình duyệt dựng.
 * Bản rút gọn không nói ở ĐÂU. Chạy trên bản DEV (không rút gọn) để có tên component. */
import { chromium } from 'playwright';
const CONG = process.env.CONG || '3210';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const loi=[]; p.on('pageerror', e=>loi.push(String(e.message)));
p.on('console', m=>{ if(m.type()==='error') loi.push('[console] '+m.text()); });
// 404 trong console KHÔNG nói tài nguyên nào — bắt ở tầng mạng mới có URL.
const hong=[]; p.on('response', r=>{ if(r.status()>=400) hong.push(r.status()+' '+r.url()); });
const BASE=`http://localhost:${CONG}`;
const e=`hy.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('HY');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(e);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
loi.length=0;
await p.goto(BASE+'/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
console.log(`cổng ${CONG} · /settings · ${loi.length} lỗi\n`);
const thay=new Set();
for(const l of loi){ const k=l.slice(0,300); if(!thay.has(k)){ thay.add(k); console.log('—', k.replace(/\s+/g,' ')); } }
if(hong.length){ console.log('\nyêu cầu hỏng:'); for(const h of new Set(hong)) console.log('  ', h); }
await b.close();
