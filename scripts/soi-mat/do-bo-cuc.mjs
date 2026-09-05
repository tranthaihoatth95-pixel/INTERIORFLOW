import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1','1'); } catch {} });
const p = await ctx.newPage();
const email = `do.bocuc.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto('http://localhost:3210/', { waitUntil:'domcontentloaded', timeout:60000 });
await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{});
await p.waitForTimeout(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Do BoCuc');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{});
await p.waitForTimeout(7000);

for (const [ten, path] of [['HOME','/'],['CAI-DAT','/settings']]) {
  await p.goto('http://localhost:3210'+path, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    // mọi phần tử CÓ VẼ GÌ ĐÓ (nền, viền, hoặc chữ) và đủ lớn
    // MỰC = chữ · ảnh · svg/canvas · viền · HOẶC nền KHÁC nền trang.
    // Nền-trùng-nền-trang KHÔNG phải mực: một <div> tô đúng màu nền thì mắt không thấy gì.
    const nenTrang = getComputedStyle(document.body).backgroundColor;
    const coVe = (el) => { const s = getComputedStyle(el);
      if (s.visibility==='hidden'||s.display==='none'||parseFloat(s.opacity)<0.05) return false;
      const coChu = el.childNodes && [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if (coChu) return true;
      if (el.tagName==='IMG'||el.tagName==='CANVAS'||el.tagName==='svg'||el.tagName==='SVG') return true;
      if (parseFloat(s.borderTopWidth)>0||parseFloat(s.borderLeftWidth)>0) return true;
      const nen = s.backgroundColor;
      if (nen && nen!=='rgba(0, 0, 0, 0)' && nen!==nenTrang) return true;
      if (s.backgroundImage && s.backgroundImage!=='none') return true;
      return false; };
    // lưới 20px: ô nào không có phần tử vẽ nào phủ ⇒ TRỐNG
    const B = 20, cols = Math.floor(W/B), rows = Math.floor(H/B);
    const phu = new Uint8Array(cols*rows);
    for (const el of document.querySelectorAll('body *')) {
      if (!coVe(el)) continue;
      const rc = el.getBoundingClientRect();
      if (rc.width<4||rc.height<4) continue;
      if (rc.width>=W*0.98 && rc.height>=H*0.98) continue; // bỏ lớp bọc toàn màn
      const x0=Math.max(0,Math.floor(rc.left/B)), x1=Math.min(cols-1,Math.floor((rc.right-1)/B));
      const y0=Math.max(0,Math.floor(rc.top/B)), y1=Math.min(rows-1,Math.floor((rc.bottom-1)/B));
      for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) phu[y*cols+x]=1;
    }
    let trong=0; for(const v of phu) if(!v) trong++;
    // cột trái: bao nhiêu % ô trong dải x<280 là trống
    const gcot=(xa,xb)=>{let t=0,tt=0;for(let y=0;y<rows;y++)for(let x=Math.floor(xa/B);x<Math.floor(xb/B);x++){tt++;if(!phu[y*cols+x])t++;}return tt?Math.round(t*100/tt):0;};
    return { W,H, trongPhanTram: Math.round(trong*100/(cols*rows)),
      traiDuoi280: gcot(0,280), phai1120: gcot(1120,W), giua: gcot(280,1120) };
  });
  console.log(ten, JSON.stringify(r));
}
await b.close();
