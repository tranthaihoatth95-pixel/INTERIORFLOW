/* Vệt mờ ĐẬM tới mức nào? Chụp → nạp lại vào canvas trong trình duyệt → đọc pixel thật. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{try{localStorage.setItem('if_intro_seen_v1','1')}catch{}});
const p = await ctx.newPage();
const email=`dv.${Date.now()}@if.test`, mk='MatThuong#2026';
await p.goto('http://localhost:3210/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{}); await p.waitForTimeout(600);
const t=p.locator('input[placeholder*="Tên"]').first(); if(await t.count()) await t.fill('DV');
const i=p.locator('input[placeholder*="Email"]').first(); if(await i.count()) await i.fill(email);
const pw=p.locator('input[type=password]'); for(let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{}); await p.waitForTimeout(7000);
await p.goto('http://localhost:3210/settings',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3200);

const tim = `(()=>{ let e=document.querySelector('.main');
  if(!e){let m=0;for(const x of document.querySelectorAll('body *')){const s=getComputedStyle(x);
    if(!/auto|scroll/.test(s.overflowY))continue;const d=x.scrollHeight-x.clientHeight;
    if(d>m&&x.clientHeight>400){m=d;e=x;}}} return e; })()`;
const hop = await p.evaluate(t=>{ const e=new Function('return '+t)(); const r=e.getBoundingClientRect();
  return { x:Math.round(r.left+60), y:Math.round(r.top), w:200, h:60 }; }, tim);

const doHang = async (top) => {
  await p.evaluate(({t,v})=>{ new Function('return '+t)().scrollTop=v; }, {t:tim,v:top});
  await p.waitForTimeout(300);
  const buf = await p.screenshot({ clip:{x:hop.x,y:hop.y,width:hop.w,height:hop.h} });
  return p.evaluate(async (b64)=>{
    const im = new Image(); im.src = 'data:image/png;base64,'+b64;
    await im.decode();
    const c = document.createElement('canvas'); c.width=im.width; c.height=im.height;
    c.getContext('2d').drawImage(im,0,0);
    const d = c.getContext('2d').getImageData(0,0,im.width,im.height).data;
    const hang=[];
    for(let y=0;y<im.height;y++){ let s=0; for(let x=0;x<im.width;x++){ const k=(y*im.width+x)*4;
      s += (d[k]+d[k+1]+d[k+2])/3; } hang.push(+(s/im.width).toFixed(1)); }
    return hang;
  }, buf.toString('base64'));
};
const dinh = await doHang(0), giua = await doHang(600);
console.log('ĐỈNH  (không được có vệt):', dinh.join(' '));
console.log('CUỘN  (phải có vệt)      :', giua.join(' '));
const nen = Math.max(...giua);
console.log(`\nnền=${nen} · dòng tối nhất khi cuộn=${Math.min(...giua)} · CHÊNH=${(nen-Math.min(...giua)).toFixed(1)}`);
console.log(`ở đỉnh CHÊNH=${(Math.max(...dinh)-Math.min(...dinh)).toFixed(1)} (càng gần 0 càng đúng)`);
await b.close();
