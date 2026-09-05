/**
 * scripts/soi-mat/do-chuan-bo-cuc.mjs — ĐO SỐNG bốn chuẩn của `docs/control/IF-CHUAN-BO-CUC.md`.
 *
 * VÌ SAO CẦN CẢ ĐO SỐNG khi đã có `npm run soi:bo-cuc`: máy soi tĩnh đọc KHAI BÁO trong mã, nó
 * mù với ba thứ — khoảng cách do lớp Tailwind sinh lúc chạy, bố cục do JS tính, và **độ dài dòng
 * thật** (phụ thuộc bề rộng khung + cỡ chữ lúc render). Hai thước BÙ NHAU, không thay nhau.
 * Cùng họ `scripts/soi-mat/do-bo-cuc.mjs` ([Đ2] mở rộng cách đo đã có, không đẻ đường thứ hai).
 *
 * CHẠY:  PORT=3255 node scripts/soi-mat/do-chuan-bo-cuc.mjs
 *
 * ⚠️ Máy này TẠO TÀI KHOẢN THỬ trên máy chủ dev đang chạy (`*@if.test`). Chỉ chạy trên dev.
 */
import { chromium } from 'playwright';

const PORT = process.env.PORT ?? '3255';
const GOC = `http://localhost:${PORT}`;
const MAN = (process.env.MAN ?? 'HOME:/,CAI-DAT:/settings,FILES:/files,THU-VIEN:/library,VAT-LIEU:/materials,VIEC:/tasks')
  .split(',').map((s) => s.split(':').map((x) => x.trim()));

const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();

// ── đăng ký một tài khoản thử để vào được các màn cần dự án
const email = `chuan.bc.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(GOC + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {});
await p.waitForTimeout(600);
const oTen = p.locator('input[placeholder*="Tên"]').first();
if (await oTen.count()) await oTen.fill('Do ChuanBoCuc');
const oMail = p.locator('input[placeholder*="Email"]').first();
if (await oMail.count()) await oMail.fill(email);
const oMk = p.locator('input[type=password]');
for (let k = 0; k < await oMk.count(); k++) await oMk.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {});
await p.waitForTimeout(8000);

const tatCa = [];
for (const [ten, duong] of MAN) {
  await p.goto(GOC + duong, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const hien = (el) => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < 0.05) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const out = {};

    /* ═══ ① VÙNG BẤM — WCAG 2.2 SC 2.5.8 (AA, 24px) · SC 2.5.5 + Apple HIG (44px) ═══════════ */
    const SEL = 'button,a[href],[role=button],[role=tab],[role=menuitem],[role=switch],'
      + '[role=checkbox],input:not([type=hidden]),select,textarea,summary';
    const dich = [...document.querySelectorAll(SEL)].filter(hien)
      // chỉ giữ đích NGOÀI CÙNG — nút lồng trong nút thì đích thật là cái ngoài
      .filter((el, _, arr) => !arr.some((o) => o !== el && o.contains(el)))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: r.left, y: r.top,
          nhan: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) || el.tagName,
          // WCAG 2.5.8 miễn trừ đích nằm TRONG một câu / khối văn bản
          trongVanBan: !!el.closest('p,li,figcaption,blockquote'),
        };
      });
    const canh = (o) => Math.min(o.w, o.h);
    const xet = dich.filter((o) => !o.trongVanBan);
    out.dichTong = dich.length;
    out.duoi24 = xet.filter((o) => canh(o) < 24).length;
    out.duoi44 = xet.filter((o) => canh(o) < 44).length;
    /* Miễn trừ KHOẢNG CÁCH của 2.5.8: đích <24 vẫn đạt nếu vòng tròn đường kính 24 đặt giữa
       hộp bao của nó KHÔNG cắt vòng/đích nào khác ⇒ tâm-tới-tâm ≥24px.
       ⚠️ XẤP XỈ: với đích rất thuôn dài (vd tay cầm 14×858) "tâm hộp bao" không đại diện tốt
       cho hình thật. Ca đó phải soi bằng mắt, máy chỉ nêu tên. */
    const nho = xet.filter((o) => canh(o) < 24);
    const thieuKhoang = [];
    for (const a of nho) {
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
      for (const c of dich) {
        if (c === a) continue;
        if (Math.hypot(ax - (c.x + c.w / 2), ay - (c.y + c.h / 2)) < 24) { thieuKhoang.push(`${a.nhan}↔${c.nhan}`); break; }
      }
    }
    out.duoi24ThieuKhoangCach = thieuKhoang.length;
    out.viDuThieuKhoangCach = thieuKhoang.slice(0, 3);
    out.dichNhoNhat = nho.sort((x, y) => canh(x) - canh(y)).slice(0, 4)
      .map((o) => `${o.nhan} ${o.w}×${o.h}`);

    /* ═══ ② NHỊP LƯỚI 4px — trên giá trị TÍNH RA, không phải giá trị khai ═════════════════ */
    const mau = [...document.querySelectorAll('body *')].filter(hien).slice(0, 4000);
    let tongKC = 0; const le = {};
    for (const el of mau) {
      const s = getComputedStyle(el);
      for (const k of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
        'rowGap', 'columnGap', 'marginTop', 'marginBottom']) {
        const v = parseFloat(s[k]);
        if (!Number.isFinite(v) || v === 0) continue;
        if (Math.abs(v) < 4) continue;           // nấc vi mô — tha, khớp máy soi tĩnh
        tongKC++;
        if (Math.abs(Math.abs(v) % 4) > 0.01) le[v] = (le[v] || 0) + 1;
      }
    }
    out.khoangCachTong = tongKC;
    out.ngoaiLuoi4 = Object.values(le).reduce((a, c) => a + c, 0);
    out.giaTriLe = Object.entries(le).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([v, c]) => `${v}px×${c}`);

    /* ═══ ③ ĐỘ DÀI DÒNG — Bringhurst 45–75 ký tự ════════════════════════════════════════ */
    const doDai = [];
    for (const el of document.querySelectorAll('p,li,dd,blockquote')) {
      if (!hien(el)) continue;
      const txt = el.textContent.trim();
      if (txt.length < 60) continue;            // đoạn quá ngắn thì "độ dài dòng" vô nghĩa
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      // xấp xỉ bề rộng ký tự trung bình ≈ 0.5em cho chữ sans thường
      const ch = Math.round(r.width / (parseFloat(s.fontSize) * 0.5));
      doDai.push({ ch, w: Math.round(r.width), t: txt.slice(0, 34) });
    }
    out.khoiVanBan = doDai.length;
    out.ngoai45_75 = doDai.filter((o) => o.ch < 45 || o.ch > 75).length;
    out.viDuDoDai = doDai.filter((o) => o.ch < 45 || o.ch > 75)
      .sort((a, b) => b.ch - a.ch).slice(0, 3).map((o) => `${o.ch}ch “${o.t}”`);

    /* ═══ ④ GESTALT — TỈ LỆ GIỮA-NHÓM / TRONG-NHÓM ════════════════════════════════════════
       🔴 BẪY ĐÃ SẬP MỘT LẦN, ghi lại để không ai gỡ: bản đầu đo mọi vùng chứa và báo
       "11/18 nhóm vi phạm" trên Home. SAI. Phần lớn có khe = 0 vì chúng được tách bằng
       VÙNG CHUNG (nền/viền/bóng — nguyên lý common region, Palmer 1992), chứ không bằng
       khoảng cách. Tách bằng vùng chung thì khe 0 là ĐÚNG, không phải lỗi.
       ⇒ Chỉ xét nhóm KHÔNG có vùng chung. Đó mới là ca mà proximity phải gánh việc. */
    const coVungChung = (el) => {
      const s = getComputedStyle(el);
      const cha = el.parentElement ? getComputedStyle(el.parentElement).backgroundColor : '';
      if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== cha) return true;
      if (s.backgroundImage && s.backgroundImage !== 'none') return true;
      for (const k of ['borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth'])
        if (parseFloat(s[k]) > 0) return true;
      return !!(s.boxShadow && s.boxShadow !== 'none');
    };
    const nhom = []; let boQuaVungChung = 0;
    for (const el of document.querySelectorAll('body *')) {
      if (!hien(el)) continue;
      const s = getComputedStyle(el);
      if (!/flex|grid/.test(s.display)) continue;
      const con = [...el.children].filter(hien);
      if (con.length < 3) continue;
      const me = el.parentElement; if (!me) continue;
      const ae = [...me.children].filter(hien);
      const idx = ae.indexOf(el); if (idx < 0 || ae.length < 2) continue;
      const ke = idx + 1 < ae.length ? ae[idx + 1] : ae[idx - 1]; if (!ke) continue;
      if (coVungChung(el) || coVungChung(ke)) { boQuaVungChung++; continue; }
      const doc = /column/.test(s.flexDirection) || s.display.includes('grid');
      const rs = con.map((c) => c.getBoundingClientRect());
      const khe = [];
      for (let k = 1; k < rs.length; k++) {
        const d = doc ? rs[k].top - rs[k - 1].bottom : rs[k].left - rs[k - 1].right;
        if (d >= 0 && d < 400) khe.push(d);
      }
      if (!khe.length) continue;
      khe.sort((a, c) => a - c);
      const trong = khe[Math.floor(khe.length / 2)];
      const rr = el.getBoundingClientRect(), rk = ke.getBoundingClientRect();
      const ms = getComputedStyle(me);
      const mdoc = /column/.test(ms.flexDirection) || ms.display.includes('grid') || !/flex/.test(ms.display);
      const ngoai = idx + 1 < ae.length
        ? (mdoc ? rk.top - rr.bottom : rk.left - rr.right)
        : (mdoc ? rr.top - rk.bottom : rr.left - rk.right);
      if (!Number.isFinite(ngoai) || ngoai < 0 || ngoai > 500) continue;
      nhom.push({ ti: +(ngoai / (trong || 0.5)).toFixed(2), trong: +trong.toFixed(1), ngoai: +ngoai.toFixed(1) });
    }
    out.nhomXetProximity = nhom.length;
    out.nhomTachBangVungChung = boQuaVungChung;
    out.nhomTiDuoi1 = nhom.filter((g) => g.ti < 1).length;
    /* Tỉ lệ nhóm dùng VÙNG CHUNG trên tổng nhóm — cao nghĩa là app đang gói mọi thứ vào HỘP.
       Nối thẳng cờ đỏ N-10 `thẻ-cho-mọi-thứ` của IF-KIEN-TRUC-OS. */
    const tongNhom = nhom.length + boQuaVungChung;
    out.tiLeGoiHop = tongNhom ? Math.round(boQuaVungChung * 100 / tongNhom) : null;
    return out;
  }).catch((e) => ({ loi: String(e).slice(0, 160) }));
  tatCa.push({ man: ten, ...r });
  console.log(ten.padEnd(10), JSON.stringify(r));
}

console.log('\n═══ TỔNG ═══');
const so = (k) => tatCa.reduce((s, m) => s + (m[k] ?? 0), 0);
console.log(`vùng bấm   : ${so('duoi24')} đích <24px · ${so('duoi44')} đích <44px / ${so('dichTong')} đích`);
console.log(`             ${so('duoi24ThieuKhoangCach')} đích <24px KHÔNG đủ khoảng cách 24px (⇒ trượt SC 2.5.8)`);
console.log(`nhịp lưới  : ${so('ngoaiLuoi4')} / ${so('khoangCachTong')} khoảng cách tính ra nằm ngoài lưới 4px`);
console.log(`độ dài dòng: ${so('ngoai45_75')} / ${so('khoiVanBan')} khối văn bản ngoài 45–75ch`);
console.log(`gestalt    : ${so('nhomTiDuoi1')} / ${so('nhomXetProximity')} nhóm có tỉ lệ giữa/trong < 1`);
console.log(`             ${so('nhomTachBangVungChung')} nhóm tách bằng VÙNG CHUNG (hộp) thay vì khoảng cách`);
console.log('\n===JSON===\n' + JSON.stringify(tatCa, null, 1));
await b.close();
