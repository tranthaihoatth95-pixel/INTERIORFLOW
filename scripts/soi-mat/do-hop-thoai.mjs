/* Hộp thoại "Dự án mới" có cao quá khung không, và nút tạo có nằm dưới mép không? */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const e=`hp.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('HP');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(e);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.locator('button:has-text("Tạo dự án mới")').first().click().catch(()=>{}); await p.waitForTimeout(3000);

console.log(JSON.stringify(await p.evaluate(()=>{
  const hop=[...document.querySelectorAll('[role=dialog],[aria-modal=true]')];
  const ra = hop.map(h=>{
    const r=h.getBoundingClientRect();
    // hộp cuộn thật bên trong
    let scr=null; for(const x of h.querySelectorAll('*')){ const s=getComputedStyle(x);
      if(/auto|scroll/.test(s.overflowY) && x.scrollHeight-x.clientHeight>4){ scr=x; break; } }
    const nut=[...h.querySelectorAll('button')].map(x=>({
      chu:(x.innerText||'').trim().slice(0,24), y:Math.round(x.getBoundingClientRect().top),
      duoiMep:x.getBoundingClientRect().top>900 || x.getBoundingClientRect().bottom>900 }));
    return { cao:Math.round(r.height), top:Math.round(r.top), bottom:Math.round(r.bottom),
      tranKhung: r.bottom>900,
      hopCuonCon: scr? { cls:(scr.className||'').toString().slice(0,40), du:scr.scrollHeight-scr.clientHeight, mang:scr.offsetWidth-scr.clientWidth } : null,
      nut: nut.filter(n=>n.chu) };
  });
  return ra;
}),null,1));
await p.screenshot({ path:'/tmp/hop-thoai-day-du.png', fullPage:true });
await b.close();
