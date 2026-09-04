/**
 * scripts/soi-ban-ve.mjs — MÁY KIỂM BẢN VẼ TRƯỚC KHI TRÌNH MẮT (north star N-16 · directive §33).
 *
 * Chỉ soi thứ MÁY PHÁN ĐƯỢC: **tràn khung · vượt khổ · tương phản chữ dưới ngưỡng WCAG**.
 * ⛔ KHÔNG được dùng kết quả "sạch" của tệp này để tự phán bố cục hay gu — đó là việc của mắt chủ
 *   dự án (N-16). Nó trả lời *"có lỗi máy nào không"*, KHÔNG trả lời *"màn này đọc ra là gì"*.
 *
 * 🔴 BÀI HỌC ĐÃ NƯỚNG VÀO ĐÂY, đừng gỡ nhánh SVG ra: lượt chạy đầu chấm chữ TRONG bản vẽ là
 * **1,04:1** và suýt khiến tôi đi "sửa" một bản vẽ không hỏng. Nguyên nhân: SVG tô bằng `fill`,
 * KHÔNG phải `color` — máy đo đọc `color` kế thừa từ body nên so nhầm mực tối với nền tối.
 * **Lỗi của MÁY ĐO, không phải của bản vẽ.** Cùng họ với ba lỗi giả mà bộ đo app thật đẻ ra cùng
 * ngày. Máy đo cũng phải được hiệu chuẩn trước khi tin nó.
 *
 * CHẠY:  node scripts/soi-ban-ve.mjs docs/mocks/<tên>.html[:1600x900] [...]
 *        không truyền tệp thì soi bộ Home Hybrid mặc định.
 *        IF_TRINH_DUYET=<đường dẫn chrome>  (gói playwright đóng đinh số hiệu bản — xem chup-mock.mjs)
 */
import { chromium } from 'playwright';
import { resolve } from 'path';
import { existsSync } from 'fs';

const MAC_DINH = [
  ['docs/mocks/mock-home-hybrid.html', 1600, 900],
  ['docs/mocks/mock-home-hybrid.html', 1280, 800],
  ['docs/mocks/mock-home-hybrid-rong.html', 1600, 900],
];
const ca = process.argv.length > 2
  ? process.argv.slice(2).map((a) => {
      const [t, kho] = a.split(':');
      const [w, h] = (kho ?? '1600x900').split('x').map(Number);
      return [t, w, h];
    })
  : MAC_DINH;
const CHROME = process.env.IF_TRINH_DUYET ?? '';
const br = await chromium.launch(CHROME && existsSync(CHROME) ? { executablePath: CHROME } : {});
const lum = (c) => { const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4}); return .2126*r+.7152*g+.0722*b; };
const tp = (a,b)=>{const L1=lum(a),L2=lum(b);return ((Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05));};
const rgb = (s)=>s.match(/\d+/g).slice(0,3).map(Number);
let loi = 0;
for (const [tep, W, H] of ca) {
  const duong = resolve(tep);
  for (const nen of ['light','dark']) {
    const p = await br.newPage({ viewport:{width:W,height:H}, deviceScaleFactor:1 });
    await p.goto('file://' + duong); await p.evaluate(v=>document.documentElement.setAttribute('data-theme',v), nen);
    if (W < 1400) await p.evaluate(()=>document.body.classList.add('hep')); // khổ hẹp hơn dùng biến thể .hep
    await p.waitForTimeout(250);
    const r = await p.evaluate(([W,H]) => {
      const out = { tran: [], chuMo: [], canhLe: [] };
      const nenCua = (el) => { let n = el; while (n && n !== document.documentElement) { const bg = getComputedStyle(n).backgroundColor; if (bg && !/rgba?\(0, 0, 0, 0\)/.test(bg)) return bg; n = n.parentElement; } return getComputedStyle(document.body).backgroundColor; };
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.width < 1 || b.height < 1) continue;
        if (b.right > W + .5 || b.bottom > H + .5 || b.left < -.5 || b.top < -.5)
          out.tran.push(`${el.tagName}.${String(el.className).slice(0,26)} → ${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}×${Math.round(b.height)}`);
        const t = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (t) { const cs = getComputedStyle(el);
          /* 🔴 SVG dùng `fill`, KHÔNG dùng `color` — lượt đo đầu chấm chữ trong bản vẽ là 1,04:1
             vì đọc nhầm `color` kế thừa từ body. Đó là lỗi của MÁY ĐO, không phải của bản vẽ. */
          const svg = el.namespaceURI && el.namespaceURI.includes('svg');
          const mau = svg ? cs.fill : cs.color;
          const nen = svg ? (getComputedStyle(el.closest('.to')||document.body).backgroundColor) : nenCua(el);
          out.chuMo.push([el.textContent.trim().slice(0,26), mau, nen, parseFloat(cs.fontSize), cs.fontWeight]); }
      }
      out.cuon = { docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight };
      return out;
    }, [W,H]);
    const duoi = r.chuMo.filter(([,c,bg,fs,fw]) => { const t = tp(rgb(c), rgb(bg)); const to = fs>=24 || (fs>=18.66 && +fw>=600); return t < (to?3:4.5); })
      .map(([tx,c,bg,fs]) => `"${tx}" ${tp(rgb(c),rgb(bg)).toFixed(2)}:1 @${fs}px`);
    const nhan = `${tep.split('/').pop().replace('.html','')} ${W}×${H} ${nen}`;
    console.log(`\n── ${nhan}`);
    console.log(`   tràn khung: ${r.tran.length ? '🔴 '+r.tran.join(' · ') : '0'}`);
    console.log(`   cuộn: ${r.cuon.docW}×${r.cuon.docH} ${(r.cuon.docW>W||r.cuon.docH>H)?'🔴 vượt':'✓ vừa khung'}`);
    console.log(`   chữ dưới ngưỡng: ${duoi.length ? '🔴 '+duoi.join(' · ') : '0'}`);
    if (r.tran.length || duoi.length || r.cuon.docW>W || r.cuon.docH>H) loi++;
    await p.close();
  }
}
await br.close();
console.log(`\n${loi ? '🔴 '+loi+' khung có vấn đề' : '✅ 6/6 khung sạch'}`);
