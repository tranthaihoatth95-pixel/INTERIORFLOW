/* Nghi vấn duy nhất còn lại của họ "nút trôi khỏi tầm nhìn": bảng chuông thông báo. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const e=`ch.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('CH');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(e);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
// chuông nằm ở thanh trên, ngay trái avatar — bấm mọi nút nhỏ ở dải y<45 cho tới khi có bảng mở ra
const nut = await p.locator('button').all();
for (const n of nut) {
  const bb = await n.boundingBox().catch(()=>null);
  if (!bb || bb.y > 45 || bb.width > 60) continue;
  await n.click().catch(()=>{}); await p.waitForTimeout(1200);
  const mo = await p.evaluate(()=>document.querySelectorAll('[role=dialog],[aria-modal=true],[class*=chuong],[class*=notif]').length);
  if (mo) { console.log('mở được bảng ở nút x=' + Math.round(bb.x)); break; }
}
const r = await p.evaluate(()=>{
  const duoi=[...document.querySelectorAll('button,a[href]')].filter(x=>{
    const c=x.getBoundingClientRect(); return c.height>8 && c.top>=900; })
    .map(x=>({chu:(x.innerText||x.getAttribute('aria-label')||'').trim().slice(0,26), y:Math.round(x.getBoundingClientRect().top)}));
  let scr=null; for(const x of document.querySelectorAll('body *')){ const s=getComputedStyle(x);
    if(/auto|scroll/.test(s.overflowY) && x.scrollHeight-x.clientHeight>4 && x.clientHeight<620){ scr=x; break; } }
  return { nutDuoiMep: duoi, hopCuon: scr? {cls:(scr.className||'').toString().slice(0,44), du:scr.scrollHeight-scr.clientHeight, mang:scr.offsetWidth-scr.clientWidth}:null };
});
console.log('nút DƯỚI MÉP:', r.nutDuoiMep.length ? JSON.stringify(r.nutDuoiMep) : '(không có)');
console.log('hộp cuộn nhỏ :', JSON.stringify(r.hopCuon));
await p.screenshot({ path:'/tmp/chuong.png' });
await b.close();
