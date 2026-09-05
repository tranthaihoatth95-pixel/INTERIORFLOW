/* §30: nội dung ngoài tầm nhìn PHẢI có dấu hiệu còn tiếp. Đo xem có dấu hiệu nào không. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`dh.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('DauHieu');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);

for (const [ten,path,sel] of [['cai-dat','/settings','.main'],['files','/files',null]]) {
  await p.goto('http://localhost:3210'+path,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);
  const r = await p.evaluate((sel)=>{
    let el = sel ? document.querySelector(sel) : null;
    if (!el) { let max=0; for(const e of document.querySelectorAll('body *')){
      const s=getComputedStyle(e); if(!/auto|scroll|overlay/.test(s.overflowY)) continue;
      const du=e.scrollHeight-e.clientHeight; if(du>max&&e.clientHeight>400){max=du;el=e;} } }
    if(!el) return {khong:'không tìm thấy container cuộn'};
    const s=getComputedStyle(el);
    // thanh cuộn CÓ HIỆN không? clientWidth < offsetWidth ⇒ có chỗ cho thanh cuộn
    const coThanh = el.offsetWidth - el.clientWidth;
    return { cls:(el.className||'').toString().slice(0,50), du:el.scrollHeight-el.clientHeight,
      thanhCuonRong: coThanh, scrollbarWidth:s.scrollbarWidth||'(mặc định)',
      mask: s.maskImage!=='none'? s.maskImage.slice(0,40) : 'không',
      // có phần tử nào ở đáy container trông như gợi ý "còn tiếp"?
      };
  }, sel);
  console.log(ten, JSON.stringify(r));
  // chụp ở đáy để xem có gì dưới đó
  await p.evaluate((sel)=>{ let el=sel?document.querySelector(sel):null;
    if(!el){let max=0;for(const e of document.querySelectorAll('body *')){const s=getComputedStyle(e);
      if(!/auto|scroll|overlay/.test(s.overflowY))continue;const du=e.scrollHeight-e.clientHeight;
      if(du>max&&e.clientHeight>400){max=du;el=e;}}}
    if(el) el.scrollTop = el.scrollHeight; }, sel);
  await p.waitForTimeout(1200);
  await p.screenshot({ path:`/tmp/soi-mat/9-${ten}-cuon-day.png` });
}
await b.close();
