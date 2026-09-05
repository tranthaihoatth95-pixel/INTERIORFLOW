/* Thử 3 cách bù cho thanh cuộn overlay, đo xem cách nào THẬT SỰ hiện. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`tm.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('TM');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.goto('http://localhost:3210/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);

const tim = () => { let el=null,max=0;
  for(const e of document.querySelectorAll('body *')){ const s=getComputedStyle(e);
    if(!/auto|scroll/.test(s.overflowY)) continue; const du=e.scrollHeight-e.clientHeight;
    if(du>max&&e.clientHeight>400){max=du;el=e;} } return el; };

for (const [ten, css] of [
  ['0 · nguyên trạng', ''],
  ['A · scrollbar-gutter:stable', 'scrollbar-gutter: stable;'],
  ['B · gutter + bar dày 10px', 'scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--t3) 55%, transparent) transparent;'],
]) {
  const r = await p.evaluate(({css, fn})=>{
    const el = new Function('return ('+fn+')()')(); if(!el) return {khong:1};
    el.style.cssText = el.getAttribute('data-goc') ?? (el.setAttribute('data-goc', el.style.cssText), el.style.cssText);
    if (css) el.style.cssText += ';' + css;
    return { mangCuon: el.offsetWidth-el.clientWidth, du: el.scrollHeight-el.clientHeight };
  }, {css, fn: tim.toString()});
  console.log(ten.padEnd(30), JSON.stringify(r));
}
await b.close();
