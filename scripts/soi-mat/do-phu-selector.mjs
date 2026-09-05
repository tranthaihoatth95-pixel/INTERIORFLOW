/* Selector mới có TRÚNG các hộp cuộn thật không? Đo trên DOM sống, không cần dựng lại. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`ps.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('PS');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);

const SEL = '.overflow-y-auto, .overflow-auto, .if-vung-cuon';
for (const path of ['/','/files','/library','/materials','/tasks','/settings']) {
  await p.goto('http://localhost:3210'+path,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
  const r = await p.evaluate((SEL)=>{
    const cuon=[], trung=[], truot=[];
    for (const e of document.querySelectorAll('body *')) {
      const s=getComputedStyle(e);
      if(!/auto|scroll|overlay/.test(s.overflowY)) continue;
      if(e.scrollHeight-e.clientHeight<=4) continue;
      cuon.push(e);
      (e.matches(SEL)?trung:truot).push({cls:(e.className||'').toString().slice(0,45), du:e.scrollHeight-e.clientHeight});
    }
    return { hopCuon:cuon.length, trung:trung.length, truot:truot.length, aiTruot:truot };
  }, SEL);
  console.log(path.padEnd(12), `cuộn=${r.hopCuon} trúng=${r.trung} TRƯỢT=${r.truot}`, r.truot?JSON.stringify(r.aiTruot):'');
}
await b.close();
