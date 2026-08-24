#!/usr/bin/env node
/**
 * scripts/soi-foundation.mjs — CANH NỀN: chữ · icon · chuyển động · vật liệu.
 * Nguồn luật: `docs/mocks/claude-foundation-system.dc.html` (Foundation System Sheet).
 *
 * ─── LUẬT TIN CẬY (§5 phiếu) ──────────────────────────────────────────────────
 * Bài học đắt nhất của repo này: một máy soi im lặng trông y hệt một máy soi sạch.
 * `soi-cam-dien` từng in `⚡ 0` trong khi có 5 entry sai — không ai nghi ngờ vì số 0 đọc
 * ra như tin tốt. Nên máy này KHÔNG được phép nói PASS bằng cách không tìm thấy gì.
 *
 * Mỗi họ luật phải khai: TỆP QUÉT · ỨNG VIÊN THẤY · VI PHẠM · MIỄN TRỪ.
 * `tệp quét = 0` hoặc `ứng viên = 0` khi sản phẩm rõ ràng có thứ đó ⇒ **PHÉP ĐO HỎNG**,
 * không phải ĐẠT. Đó là mã thoát 2, khác hẳn mã 1 (có vi phạm thật).
 *
 * ─── CHẠY ─────────────────────────────────────────────────────────────────────
 *   npm run soi:foundation            báo cáo gọn
 *   npm run soi:foundation -- --chi-tiet   liệt kê từng vi phạm (trần hiển thị 40 dòng/họ)
 *   npm run soi:foundation -- --tat-ca    liệt kê KHÔNG cắt — dùng khi đi hội tụ cả họ luật
 *   npm run soi:foundation -- --tran      CỔNG BÁNH CÓC: đỏ nếu một họ luật VƯỢT trần đã ghi
 *                                         (`scripts/foundation-tran.json`). Dùng trong `npm test`.
 *   npm run soi:foundation -- --tu-kiem    chèn mẫu hỏng, đòi máy phải ĐỎ, rồi gỡ
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRAN_MODE = process.argv.includes('--tran');
const TAT_CA = process.argv.includes('--tat-ca');
const CHI_TIET = process.argv.includes('--chi-tiet') || TAT_CA;
/* Trần 40 là trần HIỂN THỊ, không phải trần phát hiện — `viPham` luôn đủ. 40 dòng đọc vừa mắt
   trong một lượt soi thường, nhưng khi đi HỘI TỤ cả một họ luật thì cắt ở 40 làm việc không
   làm được: 874 vi phạm mà chỉ thấy 40 thì không lập được kế hoạch sửa. `--tat-ca` mở hết.
   ⛔ Đây là thay đổi HIỂN THỊ. Không nới một luật nào, không thêm miễn trừ nào (M-52). */
const TRAN_HIEN = TAT_CA ? Infinity : 40;
const TU_KIEM = process.argv.includes('--tu-kiem');

const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', 'out', 'coverage', 'uploads', 'public', 'docs']);
const laCayPhu = (t) => t.includes('worktree');
const DUOI = new Set(['.ts', '.tsx', '.css']);
const laTest = (p) => /\.(test|spec)\./.test(p);

function quet(dir, ra = []) {
  let ds; try { ds = readdirSync(dir); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten) || laCayPhu(ten)) continue;
    const p = join(dir, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quet(p, ra);
    else if (DUOI.has(extname(ten)) && !laTest(p)) ra.push(relative(ROOT, p));
  }
  return ra;
}
const TEP = [];
for (const g of ['app', 'components', 'lib']) if (existsSync(join(ROOT, g))) quet(join(ROOT, g), TEP);
/* ── TỰ KIỂM (`--tu-kiem`) ────────────────────────────────────────────────────
 * 🔴 SỬA 24/08 — CỜ NÀY TRƯỚC ĐÂY LÀ CỜ MA. `TU_KIEM` được KHAI ở đầu tệp và **không được
 * dùng ở đâu cả** (`grep TU_KIEM` = đúng 1 dòng, chính dòng khai). Docstring vẫn quảng cáo
 * *"chèn mẫu hỏng, đòi máy phải ĐỎ, rồi gỡ"*. ⇒ Ai chạy `--tu-kiem` sẽ thấy một lượt soi
 * BÌNH THƯỜNG rồi kết luận "máy tự kiểm ĐẠT" — trong khi không có phép tự kiểm nào chạy.
 * Đúng bệnh M-03 (có trong mã ≠ có tác dụng) + M-52 (dây bẫy đã bị tháo ngòi).
 *
 * Cách làm: chèn MỘT tệp ẢO chứa đúng một vi phạm cho mỗi họ luật soi-theo-tệp, rồi đòi
 * mỗi họ phải BẮT ĐƯỢC mẫu của mình. Không chạm đĩa ⇒ không có đường làm bẩn cây mã. */
const MAU_AO = '«tu-kiem-ao».tsx';
const MAU_NOI_DUNG = [
  "import { Search } from 'lucide-react';",
  'export const M = () => (',
  '  <svg viewBox="0 0 16 16" strokeWidth={2}>',   // ↯ VIEWBOX + STROKE
  '    <Search size={13} />',                       // ↯ SIZE
  '  </svg>',
  ');',
  'const x = { transition: `opacity var(--dur-fast)` };', // ↯ MOTION
].join('\n');
if (TU_KIEM) TEP.push(MAU_AO);

const doc = (p) => {
  if (p === MAU_AO) return MAU_NOI_DUNG;
  try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return ''; }
};

/* ── LUẬT ─────────────────────────────────────────────────────────────────────
 * Trích NGUYÊN VĂN từ Foundation Sheet, mục "The grammar — every clause measurable"
 * và "Motion — duration and easing per role". Không tự chế giá trị. */
const ICON_SIZES = new Set([14, 16, 18, 20]);
const ICON_STROKE = 1.5;
const NHIP = { '--nhip-bam': 130, '--nhip-vien': 170, '--nhip-bang': 220, '--nhip-ngu-canh': 300, '--nhip-bien-hinh': 460 };
const NHIP_CU = ['--dur-fast', '--dur-base']; // thang CŨ — Sheet chốt --nhip-* là chuẩn

const ho = {};
function moHo(id, ten) { ho[id] = { id, ten, tep: 0, ungVien: 0, viPham: [], mienTru: 0 }; }
/* ── MIỄN TRỪ CÓ KHAI BÁO ──────────────────────────────────────────────────────
 * 🔴 SỬA 24/08 — `mienTru` TRƯỚC ĐÂY LÀ SỐ MA: khởi tạo 0, IN RA ở mọi báo cáo, và
 * **không có một dòng nào tăng nó**. Máy khoe một cơ chế miễn trừ mà nó không có ⇒ người đọc
 * tưởng "0 miễn trừ" nghĩa là "không ai xin miễn", trong khi thật ra là "không xin được".
 * Cùng họ với cờ ma `--tu-kiem`. (M-03: có trong mã ≠ có tác dụng.)
 *
 * VÌ SAO CẦN THẬT: lane 5 gặp `<Icon size={30}>` nằm giữa một ô xem trước 16:9, `aria-hidden`
 * — nó đang làm việc của một TRANH, không phải của một icon gắn với hạng điều khiển. Ép nó về
 * 14–20 là bóp một hình minh hoạ. Ca đó có thật và sẽ còn tái diễn.
 *
 * LUẬT CỦA CƠ CHẾ — miễn trừ phải ĐẮT hơn sửa cho đúng, nếu không nó thành cửa thoát:
 *   · phải khai TẠI CHỖ, trên chính dòng đó hoặc dòng ngay trên;
 *   · phải nêu ĐÍCH DANH họ luật — miễn trừ không bao giờ là tấm khiên toàn diện;
 *   · phải có LÝ DO đọc được ≥ 12 ký tự. Khai suông ⇒ VẪN TÍNH LÀ VI PHẠM.
 *     (M-52: một máy soi bị "đóng" bằng cách thêm chữ vào chú thích là dây bẫy đã tháo ngòi.)
 *   · mọi miễn trừ được ĐẾM và IN RA. Miễn trừ im lặng thì không phải miễn trừ, là chỗ giấu rác. */
const RE_MIEN_TRU = /soi-mien-tru:\s*([A-Z-]+)\s*[—:-]\s*(.+)/;
function xinMienTru(src, dong, id) {
  const d = src.split('\n');
  /* Cửa sổ 3 dòng trên: một lý do đọc được thường phải xuống dòng, và ép nó vào một dòng là ép
     người ta viết lý do cụt. 3 dòng vẫn là "tại chỗ" — đọc site là thấy, không phải đi tra bảng. */
  for (const l of [d[dong - 1], d[dong - 2], d[dong - 3], d[dong - 4]]) {
    const m = l && RE_MIEN_TRU.exec(l);
    if (m && m[1] === id && m[2].trim().replace(/[*/]+$/, '').trim().length >= 12) return true;
  }
  return false;
}
function viPham(id, p, dong, thay, mong, vi) {
  if (xinMienTru(doc(p), dong, id)) { ho[id].mienTru++; return; }
  ho[id].viPham.push({ p, dong, thay, mong, vi });
}
const soDong = (src, i) => src.slice(0, i).split('\n').length;

/* ── ICON ↔ MINH HOẠ: phân định bằng THANG, không bằng cảm tính ───────────────
 * 🔴 SỬA 24/08. Luật của Sheet nói "**every icon**", nhưng hai máy dưới đây đang soi
 * **MỌI `<svg>`** trong cây mã. Đo được các ca oan thật:
 *   · `components/intro/svgs/index.tsx`      viewBox 200×200 — TRANH MINH HOẠ
 *   · `components/avatar/AvatarRenderer.tsx` viewBox 200×240 — hình avatar
 *   · `app/api/render/premium/route.ts`      viewBox 768×512 — ảnh sinh phía máy chủ
 *   · `lib/render-core/text2image-core.ts`   `stroke-width="0.35"` trong CHUỖI sinh ảnh
 *   · `lib/idfc-import/surface-graph.ts`     `viewBox="0 0 ${X} ${Hmax+28}"` — đồ thị động
 * Ép tranh minh hoạ 200×200 về lưới 24×24 là **vô nghĩa**, và ép nét 0.35 của một ảnh sinh
 * lên 1.5 là **làm hỏng ảnh**. Một máy soi đếm quá tay nguy hiểm ngang máy đếm hụt: nó đẻ ra
 * việc giả, và người đi làm việc giả sẽ phá thứ đang chạy đúng.
 * ⛔ KHÔNG nới luật: ngưỡng vẫn là 24×24 và 1.5. Chỉ thu về ĐÚNG tập mà luật nói tới.
 * Thứ bị loại KHÔNG bị giấu — nó vào sổ `NGOAI_PHAM_VI` và được in ra cuối báo cáo. */
const NGOAI_PHAM_VI = [];
const THANG_ICON = 48;   // icon vẽ trên lưới 24; 48 là trần rộng rãi. Trên nữa là tranh.
function thangViewBox(v) {
  if (/\$\{|\$\(/.test(v)) return null;                 // nội suy ⇒ không đo được ⇒ không phải icon
  const n = v.trim().split(/\s+/).map(Number);
  if (n.length !== 4 || n.some(Number.isNaN)) return null;
  return Math.max(n[2], n[3]);
}
const laIcon = (v) => { const t = thangViewBox(v); return t !== null && t <= THANG_ICON; };
/** viewBox bao quanh vị trí `i` — dùng để biết một `stroke-width` nằm trong icon hay trong tranh. */
function viewBoxBaoQuanh(src, i) {
  const truoc = src.lastIndexOf('viewBox', i);
  if (truoc === -1) return null;
  const m = /viewBox=["']([^"']+)["']/.exec(src.slice(truoc, truoc + 200));
  return m ? m[1] : null;
}

moHo('F-ICON-STROKE', 'Icon · stroke-width phải = 1.5');
moHo('F-ICON-SIZE', 'Icon · cỡ quang học ∈ {14,16,18,20}');
moHo('F-ICON-VIEWBOX', 'Icon · inline svg viewBox = "0 0 24 24"');
moHo('F-MOTION-TOKEN', 'Chuyển động · chỉ dùng thang --nhip-*');
moHo('F-MAT-VOCAB', 'Vật liệu · G0–G3 phải có mặt trong token sản xuất');

for (const p of TEP) {
  const src = doc(p);

  // ── ICON: strokeWidth / stroke-width ────────────────────────────────────────
  {
    const re = /(?:strokeWidth=\{?\s*([0-9.]+)|stroke-width\s*[:=]\s*"?([0-9.]+))/g;
    let m, thay = false;
    while ((m = re.exec(src))) {
      const vb = viewBoxBaoQuanh(src, m.index);
      const v = parseFloat(m[1] ?? m[2]);
      if (vb !== null && !laIcon(vb)) {            // nét của TRANH, không phải nét của icon
        NGOAI_PHAM_VI.push({ ho: 'F-ICON-STROKE', p, dong: soDong(src, m.index), vi: `nét ${v} trong svg thang ${vb}` });
        continue;
      }
      thay = true; ho['F-ICON-STROKE'].ungVien++;
      if (v !== ICON_STROKE) viPham('F-ICON-STROKE', p, soDong(src, m.index), String(v), '1.5', 'Sheet: stroke-width ∉ {1.5} → reject');
    }
    if (thay) ho['F-ICON-STROKE'].tep++;
  }

  // ── ICON: size trên component ICON ──────────────────────────────────────────
  /* 🔴 SỬA 24/08 — BẢN CŨ ĐO SAI, VÀ ĐO SAI THEO HƯỚNG THỔI PHỒNG.
     Bản cũ: tệp nào có `import ... from 'lucide-react'` thì MỌI `size={N}` trong tệp đó bị tính,
     bất kể nó nằm trên component gì. Đo được ba ca oan thật:
       · `<MaterialSphere size={120}>`  quả cầu vật liệu — KHÔNG phải icon
       · `<UserAvatar size={68}>`       avatar — KHÔNG phải icon
       · `<VitalsStateDot size={7}>`    chấm trạng thái — KHÔNG phải icon
     Một máy đếm quá tay nguy hiểm ngang máy đếm hụt: ai tin số 874 rồi đi "sửa" sẽ bóp
     quả cầu vật liệu xuống 16px. Sửa CÁCH ĐO trước, rồi mới hội tụ (luật 7: lỗi hệ thống
     chữa bằng hệ thống). ⛔ Đây KHÔNG phải nới luật — ngưỡng {14,16,18,20} giữ nguyên,
     chỉ thu hẹp lại ĐÚNG tập ứng viên mà luật nói tới.

     Ứng viên = thẻ JSX mà tên của nó là MỘT icon:
       (a) định danh import từ 'lucide-react'
       (b) primitive nhà `Icon` (`components/ui/Icon.tsx`)
       (c) biến giữ icon theo quy ước đặt tên: `Icon` · `Glyph` · `<Gì đó>Icon`
           (mẫu `const Icon = muc.icon` rất phổ biến trong repo — vẫn là icon thật) */
  {
    const ten = new Set(['Icon', 'Glyph']);
    for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g))
      for (const t of m[1].split(',')) {
        const id = t.split(/\s+as\s+/).pop().trim();
        if (/^[A-Z]\w*$/.test(id)) ten.add(id);
      }
    for (const m of src.matchAll(/\b(?:const|let)\s+([A-Z]\w*(?:Icon|Glyph))\b/g)) ten.add(m[1]);
    /* Component icon của NHÀ, nhập từ module nội bộ chứ không từ lucide — vd
       `import { CommandIcon } from '@/components/ui/command-icon'`. Nó vẫn là icon và luật
       vẫn áp; bỏ sót nó là đếm hụt. Nhận theo quy ước tên `*Icon` / `*Glyph`. */
    for (const m of src.matchAll(/import\s*(?:\{([^}]*)\}|([A-Z]\w*))\s*from\s*['\"][^'\"]+['\"]/g)) {
      const ds = (m[1] ?? m[2] ?? '').split(',');
      for (const t of ds) {
        const id = t.split(/\s+as\s+/).pop().trim();
        if (/^[A-Z]\w*(?:Icon|Glyph)$/.test(id)) ten.add(id);
      }
    }

    if (ten.size > 2) ho['F-ICON-SIZE'].tep++;
    /* 🔴 SỬA 24/08 lần hai — bản trước ĐẾM HỤT, và đếm hụt còn tệ hơn đếm quá tay.
       Bản trước quét `<Tag ...size={N}` trong MỘT biểu thức. Nhưng JSX lồng trong prop thì
       giữa thẻ NGOÀI và `size=` của thẻ TRONG **không có ký tự `>` nào**:
           <IOMenu items={[{ icon: <FileUp size={15} /> }]}>
       ⇒ `[^>]*?` nuốt luôn, khớp ra tên `IOMenu` (không phải icon ⇒ bỏ qua), và con trỏ
       `lastIndex` nhảy QUA `size` thật của `FileUp`. Ba icon 15px trong `Toolbar.tsx` tàng hình
       đúng kiểu đó, trong khi máy báo tệp ấy SẠCH.
       Cách đúng: neo vào `size=`, rồi truy NGƯỢC ra thẻ SỞ HỮU nó. */
    const oSize = /\bsize=\{?\s*([0-9]+)/g; let m;
    while ((m = oSize.exec(src))) {
      const truoc = src.lastIndexOf('<', m.index);
      if (truoc === -1) continue;
      const giua = src.slice(truoc, m.index);
      if (giua.includes('>')) continue;        // thẻ đã đóng trước đó ⇒ `size` này không của nó
      const ten2 = /^<([A-Za-z][\w.]*)/.exec(giua);
      if (!ten2 || !ten.has(ten2[1])) continue;
      ho['F-ICON-SIZE'].ungVien++;
      const v = parseInt(m[1], 10);
      if (!ICON_SIZES.has(v)) viPham('F-ICON-SIZE', p, soDong(src, m.index), String(v), '14|16|18|20', 'Sheet: size ∉ {14,16,18,20} → reject');
    }
  }

  // ── ICON: inline svg viewBox ────────────────────────────────────────────────
  {
    const re = /viewBox=["']([^"']+)["']/g; let m, thay = false;
    while ((m = re.exec(src))) {
      if (!laIcon(m[1])) {                        // tranh minh hoạ / ảnh sinh / đồ thị động
        NGOAI_PHAM_VI.push({ ho: 'F-ICON-VIEWBOX', p, dong: soDong(src, m.index), vi: `viewBox ${m[1]} — thang tranh, không phải icon` });
        continue;
      }
      thay = true; ho['F-ICON-VIEWBOX'].ungVien++;
      if (m[1].trim() !== '0 0 24 24') viPham('F-ICON-VIEWBOX', p, soDong(src, m.index), m[1], '0 0 24 24', 'Sheet: viewBox ≠ "0 0 24 24" → reject');
    }
    if (thay) ho['F-ICON-VIEWBOX'].tep++;
  }

  // ── MOTION: thang cũ + ms thô trong transition/animation ────────────────────
  {
    let thay = false;
    for (const cu of NHIP_CU) {
      const re = new RegExp(cu.replace(/[-]/g, '\\-'), 'g'); let m;
      while ((m = re.exec(src))) {
        thay = true; ho['F-MOTION-TOKEN'].ungVien++;
        viPham('F-MOTION-TOKEN', p, soDong(src, m.index), cu, '--nhip-*', 'Sheet chốt thang --nhip-* (130/170/220/300/460); đây là thang CŨ');
      }
    }
    const re2 = /(?:transition|animation)[^;\n]*?\b([0-9]{2,4})ms\b/g; let m2;
    while ((m2 = re2.exec(src))) {
      thay = true; ho['F-MOTION-TOKEN'].ungVien++;
      const v = parseInt(m2[1], 10);
      if (!Object.values(NHIP).includes(v)) viPham('F-MOTION-TOKEN', p, soDong(src, m2.index), `${v}ms`, Object.values(NHIP).join('|'), 'ms thô ngoài thang chuẩn');
    }
    if (thay) ho['F-MOTION-TOKEN'].tep++;
  }
}

/* ── MATERIAL: G0–G3 có tồn tại trong từ vựng sản xuất không ─────────────────── */
{
  // 🔴 BẢN ĐẦU CỦA LUẬT NÀY BÁO ĐẠT SAI — và cái sai đó đáng giữ lại làm ví dụ.
  // Mẫu cũ có nhánh `\bG[0-3]\b`, nên nó khớp trúng chữ "luật G1"/"G2" trong CHÚ THÍCH
  // tiếng Việt của `app/globals.css` — mà "G1" ở đó là một luật HIỆU NĂNG (đừng animate
  // opacity), chẳng liên quan gì tới thang vật liệu. Máy đọc văn xuôi rồi tuyên bố token
  // tồn tại. Đúng họ lỗi F-03/F-12: KHỚP CHỮ ≠ CÓ THẬT.
  // Nay: bóc chú thích trước, và chỉ nhận DẠNG TOKEN THẬT, không nhận chữ trần.
  const h = ho['F-MAT-VOCAB'];
  h.tep = TEP.length;
  const bocChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const MAU_TOKEN = /(--surface-g[0-3]\b|--g[0-3]\b|surface\.g[0-3]\b|\bsurfaceG[0-3]\b)/;
  let hit = 0;
  for (const p of TEP) if (MAU_TOKEN.test(bocChuThich(doc(p)))) hit++;
  h.ungVien = TEP.length;
  if (hit === 0) viPham('F-MAT-VOCAB', '(toàn bộ cây)', 0, 'G0–G3 xuất hiện 0 lần dưới dạng TOKEN', 'token G0–G3 có thật trong mã', 'Luật vật liệu và từ vựng token đang RỜI NHAU — luật sống trong văn bản, không sống trong mã. Cần Claude Design chốt ánh xạ tên rồi mới di trú.');
}

/* ── IN ───────────────────────────────────────────────────────────────────────*/
console.log(`\nSOI NỀN — ${new Date().toISOString().slice(0, 10)}`);
console.log('─'.repeat(96));
console.log(`Quét ${TEP.length} tệp (.ts/.tsx/.css trong app|components|lib, bỏ test)`);
console.log('⚠️ Máy này canh thứ ĐO ĐƯỢC. Thứ bậc thị giác/bố cục là việc của Claude Design, không phải của nó.\n');

let tongViPham = 0, doHong = 0;
for (const h of Object.values(ho)) {
  const n = h.viPham.length; tongViPham += n;
  // LUẬT TIN CẬY: không thấy ứng viên nào ⇒ phép đo hỏng, KHÔNG phải đạt.
  const hong = h.ungVien === 0;
  if (hong) doHong++;
  const co = hong ? '🟠' : n ? '🔴' : '🟢';
  const trangThai = hong ? 'PHÉP ĐO HỎNG (0 ứng viên)' : n ? `ĐỎ — ${n} vi phạm` : 'ĐẠT';
  console.log(`${co} ${h.id.padEnd(18)} ${trangThai}`);
  console.log(`   ${h.ten}`);
  console.log(`   tệp có ứng viên=${h.tep} · ứng viên=${h.ungVien} · vi phạm=${n} · miễn trừ=${h.mienTru}`);
  if (n && CHI_TIET) for (const v of h.viPham.slice(0, TRAN_HIEN)) console.log(`     · ${v.p}:${v.dong}  thấy "${v.thay}"  mong "${v.mong}"`);
  else if (n) {
    const gom = new Map();
    for (const v of h.viPham) gom.set(v.thay, (gom.get(v.thay) ?? 0) + 1);
    const top = [...gom].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => `${k}×${c}`).join(' · ');
    console.log(`     hay gặp: ${top}`);
  }
  console.log('');
}

if (NGOAI_PHAM_VI.length) {
  /* In ra, KHÔNG giấu. Người đọc phải thấy máy đã bỏ qua cái gì và vì sao — bỏ qua trong im
     lặng là cách một máy soi biến thành một lời hứa suông. */
  console.log('─'.repeat(96));
  console.log(`NGOÀI PHẠM VI — ${NGOAI_PHAM_VI.length} chỗ là TRANH/ẢNH SINH/ĐỒ THỊ, không phải icon`);
  console.log('   Luật icon không áp cho chúng. Liệt kê để không ai tưởng máy bỏ sót.\n');
  const gom = new Map();
  for (const x of NGOAI_PHAM_VI) gom.set(x.p, (gom.get(x.p) ?? 0) + 1);
  for (const [f, c] of [...gom].sort((a, b) => b[1] - a[1])) console.log(`   ${String(c).padStart(3)}  ${f}`);
  console.log('');
}
console.log('─'.repeat(96));
console.log(`TỔNG — ${tongViPham} vi phạm · ${doHong} họ luật ĐO HỎNG`);
if (!CHI_TIET && tongViPham) console.log('   (thêm `-- --chi-tiet` để xem từng dòng)');
console.log('');
if (TU_KIEM) {
  /* Mỗi họ soi-theo-tệp phải BẮT ĐƯỢC vi phạm mà ta cố tình chèn. Không bắt được ⇒ luật đó
     đã chết mà vẫn in ra màu xanh ở những lượt chạy khác — nguy hiểm hơn hẳn một luật ĐỎ. */
  const CAN_BAT = ['F-ICON-STROKE', 'F-ICON-SIZE', 'F-ICON-VIEWBOX', 'F-MOTION-TOKEN'];
  console.log('─'.repeat(96));
  console.log('TỰ KIỂM — chèn 1 tệp ẢO có đúng 1 vi phạm mỗi họ, đòi mỗi họ phải BẮT ĐƯỢC\n');
  let truot = 0;
  for (const id of CAN_BAT) {
    const bat = ho[id].viPham.some((v) => v.p === MAU_AO);
    if (!bat) truot++;
    console.log(`   ${bat ? '🟢 BẮT ĐƯỢC' : '🔴 KHÔNG BẮT ĐƯỢC — LUẬT ĐÃ CHẾT'}  ${id}`);
  }
  console.log('\n   ⓘ F-MAT-VOCAB không tự kiểm được kiểu này: nó là luật TOÀN KHO (G0–G3 có mặt');
  console.log('     trong token sản xuất hay không), không phải luật soi từng tệp.\n');
  if (truot) { console.log(`🔴 TỰ KIỂM TRƯỢT — ${truot} họ luật không bắt được mẫu hỏng của chính nó.\n`); process.exit(3); }
  console.log('🟢 TỰ KIỂM ĐẠT — cả 4 họ soi-theo-tệp đều còn sống.\n');
  console.log('⚠️ Lượt chạy này CÓ tệp ảo ⇒ các con số ở trên KHÔNG dùng làm phép đo. Chạy lại không cờ.\n');
}
if (doHong) { console.log('🟠 CÓ HỌ LUẬT KHÔNG THẤY ỨNG VIÊN NÀO — coi là PHÉP ĐO HỎNG, không phải ĐẠT.\n'); process.exit(2); }
if (TRAN_MODE) {
  /* ── CỔNG BÁNH CÓC ────────────────────────────────────────────────────────────
   * 🔴 VÌ SAO CÓ (đo 24/08): `npm test` KHÔNG chạy một máy soi nào — `soi:foundation`,
   * `soi:frontier`, `soi:thao-tac`… đều chỉ chạy khi có người NHỚ chạy. Một máy canh không
   * nằm trong cổng thì nó là lời khuyên, không phải hàng rào; và đó chính là lý do nền trôi
   * tới 1.064 vi phạm mà không ai thấy lúc nó đang trôi.
   * Không thể bắt `npm test` đòi 0 ngay — còn 1.064 nợ thật. Nên dùng BÁNH CÓC:
   * mỗi họ luật có một TRẦN; vượt trần là ĐỎ. Trần chỉ được SIẾT XUỐNG, không được nới lên.
   * ⛔ Nới một con số trong `foundation-tran.json` để cho test xanh = tháo ngòi dây bẫy (M-52).
   *    Sửa mã cho đúng luật, rồi hạ trần. */
  const F = join(ROOT, 'scripts/foundation-tran.json');
  let tran; try { tran = JSON.parse(readFileSync(F, 'utf8')); }
  catch { console.log(`🟠 KHÔNG ĐỌC ĐƯỢC TRẦN: ${F}\n`); process.exit(2); }
  console.log('─'.repeat(96));
  console.log('CỔNG BÁNH CÓC — trần chỉ được siết xuống, cấm nới lên\n');
  let vuot = 0, siet = 0;
  for (const h of Object.values(ho)) {
    const t = tran[h.id];
    if (t === undefined) { console.log(`   🟠 ${h.id} — CHƯA CÓ TRẦN, thêm vào foundation-tran.json`); vuot++; continue; }
    const n = h.viPham.length;
    if (n > t) { console.log(`   🔴 ${h.id.padEnd(18)} ${n} > trần ${t}  — TĂNG ${n - t}, đây là bước LÙI`); vuot++; }
    else if (n < t) { console.log(`   🟢 ${h.id.padEnd(18)} ${n} < trần ${t}  — SIẾT TRẦN XUỐNG ${n}`); siet++; }
    else console.log(`   ⚪ ${h.id.padEnd(18)} ${n} = trần`);
  }
  console.log('');
  if (vuot) { console.log(`🔴 CỔNG ĐỎ — ${vuot} họ luật vượt trần. Sửa mã, đừng sửa trần.\n`); process.exit(1); }
  if (siet) console.log(`ⓘ ${siet} họ đã tốt hơn trần — hạ số trong foundation-tran.json để khoá tiến bộ lại.\n`);
  console.log('🟢 CỔNG XANH — không họ nào lùi.\n');
  process.exit(0);
}
process.exit(tongViPham ? 1 : 0);
