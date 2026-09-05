/* Máng đã giữ chỗ — nhưng CON TRƯỢT có VẼ RA không? Cắt dải mép phải, đếm pixel khác nền. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`ct.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('CT');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.goto('http://localhost:3210/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);
const hop = await p.evaluate(()=>{ const e=document.querySelector('.main'); const r=e.getBoundingClientRect();
  return { x:Math.round(r.right-14), y:Math.round(r.top+20), w:16, h:400, mang:e.offsetWidth-e.clientWidth }; });
console.log('máng =', hop.mang, '· cắt dải mép phải', JSON.stringify(hop));
await p.screenshot({ path:'/tmp/mep-phai.png', clip:{x:hop.x,y:hop.y,width:hop.w,height:hop.h} });
// và một lần nữa NGAY SAU khi cuộn (overlay chỉ hiện lúc cuộn)
await p.evaluate(()=>{ document.querySelector('.main').scrollTop = 400; });
await p.waitForTimeout(120);
await p.screenshot({ path:'/tmp/mep-phai-dang-cuon.png', clip:{x:hop.x,y:hop.y,width:hop.w,height:hop.h} });
await b.close();
