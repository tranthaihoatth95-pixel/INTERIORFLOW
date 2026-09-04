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
      /* NỀN THẬT SỰ SAU MỘT ĐOẠN CHỮ — ba đường, theo thứ tự tin cậy giảm dần:
         ① nếu chữ nằm trong <svg> có một <rect> phủ kín làm nền vẽ ⇒ lấy `fill` của rect đó
            (bộ study vẽ giấy/slide bằng rect, không bằng CSS — đó là nền THẬT của chữ);
         ② đi lên tìm tổ tiên đầu tiên có `background-color` đặc;
         ③ nếu trên đường đi gặp `background-image` (ảnh hoặc gradient) ⇒ **KHÔNG ĐO ĐƯỢC**, trả
            `null`. Đây là chỗ trước đây máy báo bừa: chữ trắng trên ảnh ở nền SÁNG bị so với màu
            giấy của trang và ra 1,15:1 — một con số vô nghĩa. Chữ trên ảnh phải soi bằng MẮT hoặc
            bằng phép đo điểm ảnh, không bằng cách tra `backgroundColor`. Nói "không đo được" là
            câu trả lời đúng; nói "trượt" là nói dối theo hướng ngược lại. */
      const nenSvg = (el) => {
        const svgg = el.ownerSVGElement; if (!svgg) return null;
        const vb = svgg.viewBox?.baseVal, r = svgg.querySelector('rect');
        if (!r || !vb) return null;
        const w = r.width?.baseVal?.value ?? 0, h = r.height?.baseVal?.value ?? 0;
        if (vb.width && w >= vb.width * .98 && h >= vb.height * .98) {
          const f = getComputedStyle(r).fill;
          if (f && !/none|rgba?\(0, 0, 0, 0\)/.test(f)) return f;
        }
        return null;
      };
      const nenCua = (el) => {
        const tuSvg = nenSvg(el); if (tuSvg) return tuSvg;
        /* Chữ TRONG một <svg> mà svg đó không có nền vẽ phủ kín ⇒ nó nằm trên hình do chính svg
           vẽ ra. CSS không biết gì về hình đó ⇒ KHÔNG ĐO ĐƯỢC, phải soi bằng mắt. */
        if (el.ownerSVGElement) return null;
        /* Khai báo tường minh: bản vẽ tự nhận "chỗ này chữ nằm trên ảnh". Cần vì ảnh nền có thể
           là PHẦN TỬ ANH EM xếp lớp bằng z-index — quan hệ đó CSS không diễn đạt qua tổ tiên,
           nên không có phép đo tự động nào bắt được. Bắt bản vẽ khai là cách trung thực nhất. */
        for (let n = el; n && n !== document.documentElement; n = n.parentElement)
          if (n.hasAttribute && n.hasAttribute('data-tren-anh')) return null;
        let n = el;
        while (n && n !== document.documentElement) {
          const cs = getComputedStyle(n);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; // ③ không đo được
          if (cs.backgroundColor && !/rgba?\(0, 0, 0, 0\)/.test(cs.backgroundColor)) return cs.backgroundColor;
          n = n.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
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
          /* 🔴 SỬA LẦN BA cùng một bệnh: hai bản trước gõ cứng tên class ('.to', rồi '.chinh') để tìm nền
             của chữ SVG ⇒ mỗi lần đổi tên class là máy đo lại so nhầm nền và báo lỗi giả. Nay KHÔNG
             hỏi tên nữa: đi từ chính phần tử <svg> lên trên, lấy tổ tiên ĐẦU TIÊN có nền thật.
             Bài học: mẫu bằng chứng bám TÊN thì hỏng mỗi lần đổi tên; bám CẤU TRÚC thì không. */
          const nen = nenCua(svg ? (el.ownerSVGElement ?? el) : el);
          out.chuMo.push([el.textContent.trim().slice(0,26), mau, nen, parseFloat(cs.fontSize), cs.fontWeight]); }
      }
      out.cuon = { docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight };
      return out;
    }, [W,H]);
    const khongDo = r.chuMo.filter(([,,bg]) => bg === null).length;
    const duoi = r.chuMo.filter(([,c,bg,fs,fw]) => { if (bg === null) return false;
        const t = tp(rgb(c), rgb(bg)); const to = fs>=24 || (fs>=18.66 && +fw>=600); return t < (to?3:4.5); })
      .map(([tx,c,bg,fs]) => `"${tx}" ${tp(rgb(c),rgb(bg)).toFixed(2)}:1 @${fs}px`);
    const nhan = `${tep.split('/').pop().replace('.html','')} ${W}×${H} ${nen}`;
    console.log(`\n── ${nhan}`);
    console.log(`   tràn khung: ${r.tran.length ? '🔴 '+r.tran.join(' · ') : '0'}`);
    console.log(`   cuộn: ${r.cuon.docW}×${r.cuon.docH} ${(r.cuon.docW>W||r.cuon.docH>H)?'🔴 vượt':'✓ vừa khung'}`);
    console.log(`   chữ dưới ngưỡng: ${duoi.length ? '🔴 '+duoi.join(' · ') : '0'}`);
    if (khongDo) console.log(`   ⚠️  ${khongDo} đoạn chữ NẰM TRÊN ẢNH/GRADIENT — máy không đo được, phải soi bằng mắt`);
    if (r.tran.length || duoi.length || r.cuon.docW>W || r.cuon.docH>H) loi++;
    await p.close();
  }
}
await br.close();
console.log(`\n${loi ? '🔴 '+loi+' khung có vấn đề' : '✅ 6/6 khung sạch'}`);
