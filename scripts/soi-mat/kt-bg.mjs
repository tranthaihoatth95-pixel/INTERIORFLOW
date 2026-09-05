import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const e=`k.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('K');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(e);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.goto('http://localhost:3210/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const el=document.querySelector('.main'); if(!el) return {khong:'.main'};
  const s=getComputedStyle(el);
  const b=getComputedStyle(el,'::before');
  return { gutter:s.scrollbarGutter, ovY:s.overflowY, du:el.scrollHeight-el.clientHeight,
    truoc_content:b.content, truoc_pos:b.position, truoc_top:b.top, truoc_h:b.height,
    truoc_z:b.zIndex, truoc_opacity:b.opacity, truoc_bg:b.backgroundImage.slice(0,90),
    truoc_animName:b.animationName, truoc_timeline:b.animationTimeline };
}),null,1));
await b.close();
