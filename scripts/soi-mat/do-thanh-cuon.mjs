import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`tc.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('TC');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.goto('http://localhost:3210/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);
console.log(JSON.stringify(await p.evaluate(()=>{
  const el=document.querySelector('.main'); if(!el) return {khong:1};
  const chain=[]; let n=el;
  while(n && n!==document.documentElement){ const s=getComputedStyle(n);
    chain.push({tag:n.tagName.toLowerCase(), cls:(n.className||'').toString().slice(0,30),
      sw:s.scrollbarWidth, ovY:s.overflowY, mangCuon:n.offsetWidth-n.clientWidth}); n=n.parentElement; }
  return { du:el.scrollHeight-el.clientHeight, chain:chain.slice(0,5) };
}),null,1));
await b.close();
