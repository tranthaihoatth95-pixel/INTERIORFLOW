/* Vệt mờ CÓ VẼ RA không, và có tự tắt ở đỉnh không? Đếm pixel, không nhìn bằng cảm giác. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:3 });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`vm.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('VM');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.goto('http://localhost:3210/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);

const hop = await p.evaluate(()=>{
  let e=document.querySelector('.main');
  if(!e){ let max=0; for(const x of document.querySelectorAll('body *')){ const s=getComputedStyle(x);
    if(!/auto|scroll/.test(s.overflowY)) continue; const du=x.scrollHeight-x.clientHeight;
    if(du>max&&x.clientHeight>400){max=du;e=x;} } }
  if(!e) return null;
  const r=e.getBoundingClientRect();
  return { x:Math.round(r.left+40), y:Math.round(r.top), w:260, h:34, du:e.scrollHeight-e.clientHeight }; });
if(!hop){ console.log('KHÔNG tìm thấy hộp cuộn — URL', p.url()); await b.close(); process.exit(1); }
console.log('hộp cuộn:', JSON.stringify(hop));
const {x,y,w,h}=hop;
for (const [ten, top] of [['dinh(0)',0],['giua(600)',600]]) {
  await p.evaluate((v)=>{ let e=document.querySelector('.main');
    if(!e){ let max=0; for(const x of document.querySelectorAll('body *')){ const s=getComputedStyle(x);
      if(!/auto|scroll/.test(s.overflowY)) continue; const du=x.scrollHeight-x.clientHeight;
      if(du>max&&x.clientHeight>400){max=du;e=x;} } }
    if(e) e.scrollTop = v; }, top);
  await p.waitForTimeout(250);
  await p.screenshot({ path:`/tmp/vet-${ten}.png`, clip:{x,y,width:w,height:h} });
  console.log(ten, '→ /tmp/vet-'+ten+'.png');
}
await b.close();
