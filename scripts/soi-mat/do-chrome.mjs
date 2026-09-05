import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`chrome.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('Chrome');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);

for (const path of ['/','/settings','/files']) {
  await p.goto('http://localhost:3210'+path,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
  const r = await p.evaluate(()=>{
    const trong=[];
    for (const el of document.querySelectorAll('button,a[href],[role=button]')) {
      const rc = el.getBoundingClientRect(); if (rc.width<8||rc.height<8) continue;
      const s = getComputedStyle(el); if (s.visibility==='hidden'||s.display==='none') continue;
      const chu=(el.innerText||'').trim();
      const nhan=el.getAttribute('aria-label')||el.getAttribute('title')||'';
      const coHinh=el.querySelector('svg,img')!==null;
      if(!chu && !nhan && !coHinh) trong.push({ x:Math.round(rc.x),y:Math.round(rc.y),w:Math.round(rc.width),h:Math.round(rc.height), cls:(el.className||'').toString().slice(0,60) });
    }
    // nút CHỈ có icon mà không nhãn (NT-8: icon luôn có nhãn)
    const iconKhongNhan=[];
    for (const el of document.querySelectorAll('button,[role=button]')) {
      const rc=el.getBoundingClientRect(); if(rc.width<8) continue;
      const chu=(el.innerText||'').trim(); const nhan=el.getAttribute('aria-label')||el.getAttribute('title')||'';
      if(!chu && !nhan && el.querySelector('svg')) iconKhongNhan.push({x:Math.round(rc.x),y:Math.round(rc.y),cls:(el.className||'').toString().slice(0,50)});
    }
    // vùng chạm < 44px
    let nho=0, tong=0;
    for (const el of document.querySelectorAll('button,a[href],[role=button],input,select')) {
      const rc=el.getBoundingClientRect(); if(rc.width<4||rc.height<4) continue; tong++;
      if (rc.height<32) nho++;
    }
    return { rong:trong.length, rongVD:trong.slice(0,3), iconKhongNhan:iconKhongNhan.length, iconVD:iconKhongNhan.slice(0,4), chamNho:nho, chamTong:tong };
  });
  console.log(path, JSON.stringify(r));
}
await b.close();
