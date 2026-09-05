/**
 * ĐO NỀN CHO BÀN CHUẨN — vùng bấm · nhịp lưới · tỉ lệ nhóm.
 * Đo TRÊN APP THẬT, không suy từ CSS. Cùng họ scripts/soi-mat/do-bo-cuc.mjs (Đ2: mở rộng, không đẻ mới).
 */
import { chromium } from 'playwright';
const PORT = process.env.PORT ?? '3255';
const G = `http://localhost:${PORT}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1','1'); } catch {} });
const p = await ctx.newPage();
const email = `chuan.bc.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(G + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(()=>{});
await p.waitForTimeout(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Chuan BoCuc');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k=0;k<await pw.count();k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(()=>{});
await p.waitForTimeout(8000);

const MAN = [['HOME','/'],['CAI-DAT','/settings'],['FILES','/files'],['THU-VIEN','/library'],['VAT-LIEU','/materials'],['VIEC','/tasks']];
const ket = [];
for (const [ten, path] of MAN) {
  await p.goto(G + path, { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const out = {};
    // ── ① VÙNG BẤM: mọi đích chạm THẬT SỰ nhìn thấy được
    const SEL = 'button,a[href],[role=button],[role=tab],[role=menuitem],[role=switch],[role=checkbox],input:not([type=hidden]),select,textarea,summary';
    const hien = (el) => { const s = getComputedStyle(el);
      if (s.visibility==='hidden'||s.display==='none'||parseFloat(s.opacity)<0.05) return false;
      const r = el.getBoundingClientRect();
      return r.width>0 && r.height>0 && r.bottom>0 && r.top<innerHeight && r.right>0 && r.left<innerWidth; };
    const dich = [...document.querySelectorAll(SEL)].filter(hien)
      // bỏ đích LỒNG trong đích khác (nút trong nút) — chỉ giữ đích ngoài cùng
      .filter((el,_,arr)=>!arr.some(o=>o!==el&&o.contains(el)));
    const hop = dich.map(el=>{const r=el.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),x:r.left,y:r.top,
      nhan:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,26)||el.tagName,
      trongVanBan: !!el.closest('p,li,figcaption')};});
    const canh = (o)=>Math.min(o.w,o.h);
    out.dichTong = hop.length;
    out.duoi24 = hop.filter(o=>canh(o)<24 && !o.trongVanBan).length;
    out.duoi44 = hop.filter(o=>canh(o)<44 && !o.trongVanBan).length;
    out.nhoNhat = hop.length ? hop.reduce((a,o)=>canh(o)<canh(a)?o:a) : null;
    // WCAG 2.5.8: đích <24 phải có vòng tròn 24px KHÔNG cắt vòng của đích khác
    // ⇒ tâm-tới-tâm ≥ 24px với mọi đích khác. Đo đúng luật đó.
    const nho = hop.filter(o=>canh(o)<24 && !o.trongVanBan);
    let viPhamKhoangCach = 0; const viDu = [];
    for (const a of nho) {
      const ax=a.x+a.w/2, ay=a.y+a.h/2;
      for (const c of hop) { if (c===a) continue;
        const cx=c.x+c.w/2, cy=c.y+c.h/2;
        if (Math.hypot(ax-cx, ay-cy) < 24) { viPhamKhoangCach++; if(viDu.length<3) viDu.push(`${a.nhan}(${a.w}×${a.h})↔${c.nhan}`); break; } }
    }
    out.duoi24ThieuKhoangCach = viPhamKhoangCach;
    out.viDuKhoangCach = viDu;
    // ── ② NHỊP LƯỚI: mọi khoảng cách TÍNH RA (padding/gap) có phải bội số 4 không
    const mau = [...document.querySelectorAll('body *')].filter(hien).slice(0, 4000);
    const soDo = []; const le = {};
    for (const el of mau) { const s = getComputedStyle(el);
      for (const k of ['paddingTop','paddingBottom','paddingLeft','paddingRight','rowGap','columnGap','marginTop','marginBottom']) {
        const v = parseFloat(s[k]); if (!Number.isFinite(v) || v === 0) continue;
        soDo.push(v); if (Math.abs(v % 4) > 0.01) le[v] = (le[v]||0)+1; } }
    out.khoangCachTong = soDo.length;
    out.ngoaiLuoi4 = Object.values(le).reduce((a,c)=>a+c,0);
    out.giaTriLe = Object.entries(le).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([v,c])=>`${v}px×${c}`);
    // ── ③ ĐỘ DÀI DÒNG: khối văn bản dài, đo số ký tự/dòng
    const doDai = [];
    for (const el of document.querySelectorAll('p,li,dd,blockquote')) {
      if (!hien(el)) continue;
      const txt = el.textContent.trim(); if (txt.length < 60) continue;
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      const cw = parseFloat(s.fontSize) * 0.5; // xấp xỉ bề rộng ký tự trung bình
      doDai.push({ ch: Math.round(r.width / cw), w: Math.round(r.width), fs: Math.round(parseFloat(s.fontSize)), t: txt.slice(0,32) });
    }
    out.khoiVanBan = doDai.length;
    out.ngoai45_75 = doDai.filter(o=>o.ch<45||o.ch>75).length;
    out.viDuDoDai = doDai.filter(o=>o.ch<45||o.ch>75).slice(0,4);
    return out;
  }).catch(e=>({loi:String(e).slice(0,120)}));
  ket.push({ man: ten, ...r });
  console.log(ten, JSON.stringify(r));
}
console.log('\n===JSON===\n' + JSON.stringify(ket, null, 1));
await b.close();
