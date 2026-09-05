/* Đo CUỘN cho đúng chỗ: html/body có thể overflow:hidden, cuộn thật nằm ở container con. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`cuon.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('Cuon');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);

for (const path of ['/','/files','/library','/materials','/tasks','/settings']) {
  await p.goto('http://localhost:3210'+path,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);
  const r = await p.evaluate(()=>{
    const d=document.documentElement, bd=document.body;
    const oHtml=getComputedStyle(d).overflowY, oBody=getComputedStyle(bd).overflowY;
    const cuon=[];
    for (const el of document.querySelectorAll('body *')) {
      const s=getComputedStyle(el);
      if(!/auto|scroll|overlay/.test(s.overflowY)) continue;
      const du = el.scrollHeight - el.clientHeight;
      if (du > 4) cuon.push({ tag:el.tagName.toLowerCase(), cls:(el.className||'').toString().slice(0,55),
        cao:el.clientHeight, nd:el.scrollHeight, du });
    }
    // thứ bị CẮT ở mép dưới khung nhìn mà không ai cuộn được tới
    let catDay=0;
    for (const el of document.querySelectorAll('body *')) {
      const rc=el.getBoundingClientRect();
      if (rc.height>4 && rc.top < 900 && rc.bottom > 902) catDay++;
    }
    return { oHtml, oBody, htmlDu:d.scrollHeight-d.clientHeight, soCuon:cuon.length,
      cuon:cuon.sort((a,b)=>b.du-a.du).slice(0,3), catDay };
  });
  console.log(path.padEnd(12), JSON.stringify(r));
}
await b.close();
