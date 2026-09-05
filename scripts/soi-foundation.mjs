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
import { trongChuThich } from './_chu-thich.mjs';

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
  /* ⛔ HAI KHỐI DƯỚI PHẢI **KHÔNG** BỊ BẮT — chúng khoá lại phần miễn trừ audit 05/09.
     Ai gỡ nhầm miễn trừ đó thì `--tu-kiem` TRƯỢT ngay, chứ không âm thầm kết tội bản vẽ. */
  'export const BanVe = ({ vb }) => (',
  '  <svg viewBox={vb}>',                             // thang KHÔNG đo được (biểu thức JSX)
  '    <motion.path strokeWidth={0.15} />',            // nét bản vẽ — KHÔNG được bắt
  '  </svg>',
  ');',
].join('\n');
/* Tệp ảo thứ hai, đuôi .css: nhánh CSS không có thẻ cũng không có viewBox, nên nó đi đường
   `selectorNoiToiIcon` riêng — phải tự kiểm riêng, cả chiều BẮT lẫn chiều KHÔNG BẮT. */
const MAU_AO_CSS = '«tu-kiem-ao».css';
const MAU_NOI_DUNG_CSS = [
  '/* dây nối giữa các node — không thuộc luật này, phải KHÔNG bị bắt */',
  '.react-flow__edge.selected .react-flow__edge-path { stroke-width: 2.5; }',
  '/* selector nói rõ đây là nét của một biểu tượng ⇒ PHẢI bắt */',
  '.if-icon svg { stroke-width: 2; }',
  '/* MÉP CUỘN — khai overflow dọc mà KHÔNG giữ chỗ thanh cuộn ⇒ PHẢI bắt */',
  '.ao-cuon-tran { overflow-y: auto; }',
  '/* ⛔ hai ca dưới PHẢI **KHÔNG** bị bắt — khoá cả hai chiều của luật mép cuộn */',
  '.ao-cuon-du { overflow-y: auto; scrollbar-gutter: stable; }',
  '.ao-cuon-ngang { overflow-x: auto; }',
].join('\n');
if (TU_KIEM) TEP.push(MAU_AO, MAU_AO_CSS);

const doc = (p) => {
  if (p === MAU_AO) return MAU_NOI_DUNG;
  if (p === MAU_AO_CSS) return MAU_NOI_DUNG_CSS;
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
/* 🔬 AUDIT THƯỚC 25/08 — chạy bộ probe 11 ca trước khi cho phép sửa 180 vị trí sản xuất.
   KẾT QUẢ: thước CHÍNH XÁC CAO. Bắt đúng icon nét sai; loại đúng tranh 200×200, SVG lồng sâu,
   và `strokeWidth:` camelCase trong style CSS-in-JS (regex đòi `=`, không khớp `:`).
   🔴 ĐÚNG MỘT LỚP BÁO OAN: `stroke-width` nằm trong CHUỖI/template literal sinh SVG, khi chính
   chuỗi đó khai viewBox thang icon. Đo trên mã thật: lớp này xuất hiện **0 lần** trong 180 ca —
   nên nó là lỗ TIỀM ẨN, chưa gây hại. Vá luôn để đừng chờ nó nổ.
   ⚠️ `vb === null` vẫn tính là ứng viên, và điều đó ĐÚNG: 134/180 ca thật là **prop trên
   component lucide** (`<Search size={16} strokeWidth={1.75} />`) — icon thật, không có viewBox
   trong mã nguồn. Đổi nhánh này thành "bỏ qua" sẽ làm thước mù 3/4 số ca. */
function trongChuoi(src, i) {
  // Đếm dấu backtick chưa đóng trước vị trí i ⇒ đang nằm trong template literal.
  let n = 0;
  for (let k = 0; k < i; k++) if (src[k] === '`' && src[k - 1] !== '\\') n++;
  return n % 2 === 1;
}


/** viewBox bao quanh vị trí `i` — dùng để biết một `stroke-width` nằm trong icon hay trong tranh. */
function viewBoxBaoQuanh(src, i) {
  const truoc = src.lastIndexOf('viewBox', i);
  if (truoc === -1) return null;
  const m = /viewBox=["']([^"']+)["']/.exec(src.slice(truoc, truoc + 200));
  return m ? m[1] : null;
}

/* ── AI SỞ HỮU NÉT NÀY? — phân định bằng THẺ, không bằng khoảng cách tới `viewBox` ──────────
 * 🔬 AUDIT THƯỚC 05/09 (luật `_siet-25-08`: audit trước, sửa sau). Chạy probe trên đủ 45 ca đang
 * bị kết tội, in ra THẺ SỞ HỮU của từng nét. Kết quả: **9 ca là BÁO OAN**, và cả 9 rơi đúng vào
 * một nhánh — nhánh mà thước KHÔNG CÓ BẰNG CHỨNG GÌ là đang nhìn một icon:
 *   · `DrawOnPreview.tsx:221,296`  `<motion.path 0.3>` `<motion.line 0.15>` — **bản vẽ mặt bằng**,
 *      toạ độ mm, 0.3/0.15 là BỀ RỘNG NÉT theo chuẩn bản vẽ. `viewBox={viewBox}` là biểu thức JSX
 *      nên `viewBoxBaoQuanh` (regex đòi dấu nháy) trả `null` ⇒ rơi vào nhánh `vb === null`.
 *   · `ClusterPanel.tsx:82`        `<g strokeWidth={1} vectorEffect="non-scaling-stroke">` — xem
 *      trước Prim[] CAD; `viewBox` khai ở dòng **131**, tức Ở DƯỚI, mà phép tìm chỉ lùi VỀ TRƯỚC.
 *   · `AdjustPanel.tsx:162,163,167` `<line 0.5>` — lưới của **đồ thị đường cong tông màu**; cả tệp
 *      KHÔNG có `viewBox` nào (svg đặt `width`/`height` thẳng).
 *   · `globals.css:1237` · `foldable.css:89,130` — `.react-flow__edge-path`,
 *      `.react-flow__connectionline` … tức **DÂY NỐI giữa các node**, không phải icon.
 *
 * ⚠️ Vì sao nhánh `vb === null` từng ĐÚNG, và vì sao nay phải chia đôi: chú thích 25/08 giữ nhánh
 * này là ứng viên vì *"134/180 ca thật là PROP trên component lucide"* — điều đó vẫn đúng, nhưng
 * chỉ đúng cho **THẺ COMPONENT** (`<Search strokeWidth={1.75}/>`), nơi việc không có `viewBox`
 * trong mã nguồn CHÍNH LÀ dấu hiệu của icon lucide. Với **HÌNH HỌC SVG THÔ** (`path`/`line`/`g`…)
 * thì ngược hẳn: nó luôn nằm trong MỘT `<svg>` nào đó, nên "không đo được viewBox" nghĩa là
 * ta KHÔNG CHỨNG MINH ĐƯỢC đây là icon — chứ không phải "đây là icon".
 *
 * ⛔ KHÔNG nới luật: ngưỡng vẫn 1.5, lưới vẫn 24. Chỉ thu về ĐÚNG tập mà luật nói tới — cùng việc
 * bản 24/08 đã làm cho F-ICON-SIZE (quả cầu vật liệu 120px từng bị đếm là icon). Một máy đếm quá
 * tay nguy hiểm ngang máy đếm hụt: ai tin số rồi đi "sửa" sẽ ép nét 0.15 của một đường kích thước
 * lên 1.5 và **làm hỏng bản vẽ**. Thứ bị loại KHÔNG bị giấu — nó vào sổ `NGOAI_PHAM_VI`, in ở cuối.
 * Bộ `--tu-kiem` khoá cả HAI chiều: bắt được icon hỏng, VÀ không bắt oan nét bản vẽ. */
const SVG_HINH_HOC = new Set([
  'svg', 'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'g', 'use',
  'text', 'tspan', 'defs', 'mask', 'clipPath', 'pattern', 'marker', 'symbol', 'image', 'foreignObject',
]);
/** Thẻ JSX sở hữu vị trí `i` — lùi về `<` gần nhất mà giữa đó không có `>` chen ngang. */
function theSoHuu(src, i) {
  const truoc = src.lastIndexOf('<', i);
  if (truoc === -1) return null;
  const giua = src.slice(truoc, i);
  if (giua.includes('>')) return null;                 // thẻ đã đóng trước đó ⇒ nét này không của nó
  return /^<([A-Za-z][\w.$-]*)/.exec(giua)?.[1] ?? null;
}
/** `motion.path` · `m.line` → `path` · `line`. framer-motion chỉ bọc, phần tử SVG vẫn là nó. */
const goiBoc = (t) => t.replace(/^(?:motion|m)\./, '');
const laHinhHocSvg = (t) => t !== null && SVG_HINH_HOC.has(goiBoc(t));
/** Selector CSS có nói tới icon không? Chỉ khi CÓ thì một `stroke-width` trong CSS mới là nét icon.
 *  Cắt ĐÚNG đoạn selector (giữa dấu ngắt khối gần nhất và `{` mở khối) rồi BỎ CHÚ THÍCH — nếu không,
 *  một chú thích kiểu `/* … không phải icon *\/` đứng ngay trên sẽ tự kết tội chính khối nó giải thích.
 *  Đây là PHÉP SUY ĐOÁN, khai thẳng: nó bắt được `.if-icon svg{}` và bỏ qua `.react-flow__edge-path{}`,
 *  nhưng một selector đặt tên icon mà không có chữ nào trong 4 từ khoá thì nó nhìn không ra. */
function selectorNoiToiIcon(src, i) {
  const moKhoi = src.lastIndexOf('{', i);
  if (moKhoi === -1) return false;
  const dau = Math.max(src.lastIndexOf('}', moKhoi), src.lastIndexOf('{', moKhoi - 1), src.lastIndexOf(';', moKhoi)) + 1;
  const sel = src.slice(dau, moKhoi).replace(/\/\*[\s\S]*?\*\//g, '');
  return /icon|glyph|lucide|\bsvg\b/i.test(sel);
}

moHo('F-ICON-STROKE', 'Icon · stroke-width phải = 1.5');
moHo('F-ICON-SIZE', 'Icon · cỡ quang học ∈ {14,16,18,20}');
moHo('F-ICON-VIEWBOX', 'Icon · inline svg viewBox = "0 0 24 24"');
moHo('F-MOTION-TOKEN', 'Chuyển động · chỉ dùng thang --nhip-*');
moHo('F-MAT-VOCAB', 'Vật liệu · G0–G3 phải có mặt trong token sản xuất');
/* ── F-NHAN-BIA · BỊA NHÃN KHI CHƯA BIẾT ──────────────────────────────────────────────────────
 * Hoà soi app thật **26/08**: thanh trên bày `Untitled flow` cho một hồ sơ có thật. Người ta vá
 * ĐÚNG MỘT CHỖ (`AppChrome.tsx:353`) rồi để nguyên gốc — **28/08 tái diễn**, ảnh Hoà gửi cho thấy
 * `Chưa đặt tên`, sinh từ `DaiNguCanh.tsx:79`. Vá ca thì mầm còn sống.
 *
 * Cùng lỗi với `Chào Hoa`: tên trong DB là `hoa` (không tin được) ⇒ app **tự viết hoa** thành một
 * cái tên SAI, thay vì nói "chưa biết" và mời gõ. Cùng lỗi với Vitals `calm` khi không đọc được
 * dữ liệu, với dải `2/2` khi có 17 dự án.
 *
 * ⇒ Một công thức: **lấp khoảng trống bằng phỏng đoán rồi trình bày như sự thật**
 *   (`docs/control/IF-MOT-LOI.md`). Thuốc thế giới đã dùng: *make illegal states unrepresentable*
 *   — không có luật ESLint sẵn cho ca này (đã tra 28/08), nên dựng máy riêng, nối vào bánh cóc đã có.
 *
 * ⚠️ **KHÔNG cấm chuỗi `Chưa đặt tên` tồn tại.** Nó hợp lệ khi là **lời mời đặt tên** (nút, ô nhập,
 * placeholder). Chỉ bắt khi nó đứng sau `||`/`??` để **thế chỗ một giá trị thật chưa biết** —
 * đó mới là chỗ phỏng đoán đội lốt sự thật. */
moHo('F-NHAN-BIA', 'Nhãn · cấm bịa tên khi giá trị thật chưa biết');
/* ── F-MEP-CUON · VÙNG CUỘN KHÔNG CÓ DẤU HIỆU "CÒN TIẾP" ─────────────────────────────────────
 * LUẬT NGẦM tìm ra 05/09, và nó là loại luật KHÔNG NẰM TRONG TÀI LIỆU NÀO — nó được thi hành
 * bằng MỘT DÒNG CSS: `AppShell.tsx:193` khoá `height:100dvh; overflow:hidden`. Trang không bao
 * giờ cao hơn màn ⇒ mỗi màn phải tự dựng hộp cuộn con. Đo: **122 chỗ / 95 tệp**, ≥4 phương ngữ.
 *
 * Vì `overflow:hidden` nằm ở VỎ, thanh cuộn cấp trang không bao giờ hiện. Và đo trên Chromium,
 * MỌI hộp cuộn con có `offsetWidth − clientWidth = 0` ⇒ thanh cuộn là OVERLAY: chỉ hiện TRONG
 * LÚC cuộn rồi tan. **Trước khi cuộn, không có tín hiệu nào.** Người dùng không khám phá được
 * thứ họ không biết là có. Hậu quả đo được cùng ngày:
 *   · Cài đặt  858 khung / 3737 nội dung → giấu 2879px, thấy 23%
 *   · Files    858 / 2548              → giấu 1690px, thấy 34%, 22 phần tử bị cắt ở mép
 *   · 0/122 vùng cuộn có bất kỳ dấu hiệu còn tiếp nào (mask · fade · bóng mép)
 *
 * ⇒ LUẬT: nơi nào khai `overflow[-y]: auto|scroll` thì nơi đó phải khai luôn `scrollbar-gutter`.
 * `stable` biến máng 0px bóng ma thành 8px THẬT (đo: 0 → 8) — thanh cuộn thành công dân của bố
 * cục, không phải bóng ma. `auto` là lối THOÁT CÓ KHAI cho ai cố ý ẩn thanh và đã tự dựng vệt mờ.
 *
 * ⚠️ THƯỚC LÀ XẤP XỈ, khai thẳng: nó tìm `scrollbar-gutter` trong cửa sổ ±260 ký tự quanh chỗ
 * khai overflow, KHÔNG phân tích cây CSS. Khai đúng luật mà đặt cách xa >260 ký tự thì bị báo oan;
 * ngược lại một khai báo của rule KHÁC nằm gần cũng có thể tha nhầm. Chấp nhận: rẻ, và sai số
 * này không che được ca thật nào đã đo. `overflow-x` KHÔNG tính — cuộn ngang là bài khác. */
moHo('F-MEP-CUON', 'Vùng cuộn · khai overflow thì phải khai scrollbar-gutter');

for (const p of TEP) {
  const src = doc(p);

  // ── MÉP CUỘN: khai overflow dọc mà không khai scrollbar-gutter ──────────────
  {
    const RE_CUON = /overflow(?:Y)?\s*:\s*['"`]?(auto|scroll)\b|overflow(?:-y)?\s*:\s*(auto|scroll)\b/g;
    let m, thay = false;
    while ((m = RE_CUON.exec(src))) {
      // `overflow-x` đã bị loại bởi chính mẫu; loại thêm ca `overflowX` viết hoa lạc vào.
      if (/overflow-?x/i.test(src.slice(Math.max(0, m.index - 2), m.index + 12))) continue;
      thay = true; ho['F-MEP-CUON'].ungVien++;
      /* 🔴 SỬA NGAY TRONG LƯỢT MỞ SỔ — bản đầu dùng CỬA SỔ ±260 KÝ TỰ và `--tu-kiem` bắt được
       * ngay: trong tệp ảo, rule `.ao-cuon-tran{overflow-y:auto}` nằm cách rule kế
       * `.ao-cuon-du{...scrollbar-gutter:stable}` đúng ~60 ký tự ⇒ nó ĐỌC GHÉ khai báo của hàng
       * xóm rồi tha oan. Kho thật còn dễ rò hơn: CSS-in-TS ở repo này viết mỗi rule một dòng sát
       * nhau. ⇒ Đổi sang phạm vi KHỐI `{...}` bao quanh — chính xác cho cả rule CSS phẳng lẫn
       * object `style={{…}}` trong JSX. Không có bước tự kiểm hai chiều thì thước này đã mở sổ
       * bằng một con số ĐẸP HƠN SỰ THẬT, và không ai biết. */
      const mo = src.lastIndexOf('{', m.index);
      const dong2 = src.indexOf('}', m.index);
      const khoi = src.slice(mo === -1 ? 0 : mo, dong2 === -1 ? src.length : dong2);
      if (/scrollbar-gutter|scrollbarGutter/.test(khoi)) continue;
      viPham('F-MEP-CUON', p, soDong(src, m.index), m[0].trim(),
        'kèm scrollbar-gutter', 'vùng cuộn không giữ chỗ cho thanh cuộn ⇒ 0 dấu hiệu "còn tiếp"');
    }
    if (thay) ho['F-MEP-CUON'].tep++;
  }

  // ── NHÃN BỊA: `x || 'Chưa đặt tên'` · `x ?? 'Untitled'` ─────────────────────
  {
    /* ỨNG VIÊN = **mọi** chỗ lùi về một chuỗi (`x || 'abc'`, `x ?? 'abc'`).
     * VI PHẠM  = trong số đó, chuỗi lùi về là một **DANH TÍNH BỊA**.
     *
     * Định nghĩa lượt đầu lấy ứng viên = vi phạm ⇒ sửa xong là `0 ứng viên` ⇒ máy tự tuyên
     * **PHÉP ĐO HỎNG** (đúng LUẬT TIN CẬY §5: không thấy gì ≠ sạch). Luật đó ĐÚNG, không nới.
     * Sai là ở định nghĩa: một thước mà "đạt" và "hỏng" trông giống nhau thì không dùng được. */
    const re = /(\|\||\?\?)\s*(?:tr\()?\s*['"`]([^'"`\n]{1,40})['"`]/g;
    const BIA = /^(Chưa đặt tên|Chưa có tên|Untitled.*|Unnamed.*|No name|Không tên)$/i;
    let m;
    let thayNhan = false;
    while ((m = re.exec(src))) {
      if (trongChuThich(src, m.index)) {
        NGOAI_PHAM_VI.push({ ho: 'F-NHAN-BIA', p, dong: soDong(src, m.index), vi: 'mẫu cũ trích lại trong chú thích' });
        continue;
      }
      ho['F-NHAN-BIA'].ungVien++; thayNhan = true;
      if (!BIA.test(m[2])) continue;           // lùi về một chuỗi KHÁC — hợp lệ, không phải danh tính bịa
      viPham('F-NHAN-BIA', p, soDong(src, m.index), `${m[1]} '${m[2]}'`,
        'trạng thái "chưa biết" hiện ra được, hoặc lời mời đặt tên',
        'Giá trị thật chưa biết mà app bịa một cái tên rồi trình bày như sự thật. Hoà bắt 26/08 (Untitled flow) và 28/08 (Chưa đặt tên) — vá một chỗ thì tái diễn ở chỗ khác.');
    }
    if (thayNhan) ho['F-NHAN-BIA'].tep++;
  }

  // ── ICON: strokeWidth / stroke-width ────────────────────────────────────────
  {
    const re = /(?:strokeWidth=\{?\s*([0-9.]+)|stroke-width\s*[:=]\s*"?([0-9.]+))/g;
    let m, thay = false;
    while ((m = re.exec(src))) {
      const vb = viewBoxBaoQuanh(src, m.index);
      const v = parseFloat(m[1] ?? m[2]);
      if (trongChuoi(src, m.index)) {          // SVG dựng bằng chuỗi — không phải icon render
        NGOAI_PHAM_VI.push({ ho: 'F-ICON-STROKE', p, dong: soDong(src, m.index), vi: `nét ${v} trong CHUỖI sinh SVG` });
        continue;
      }
      if (vb !== null && !laIcon(vb)) {            // nét của TRANH, không phải nét của icon
        NGOAI_PHAM_VI.push({ ho: 'F-ICON-STROKE', p, dong: soDong(src, m.index), vi: `nét ${v} trong svg thang ${vb}` });
        continue;
      }
      /* CHỈ KẾT TỘI KHI CÓ BẰNG CHỨNG LÀ ICON — xem khối audit 05/09 ở trên. */
      if (p.endsWith('.css')) {
        // CSS không có thẻ, không có viewBox. Bằng chứng duy nhất còn lại là SELECTOR.
        if (!selectorNoiToiIcon(src, m.index)) {
          NGOAI_PHAM_VI.push({ ho: 'F-ICON-STROKE', p, dong: soDong(src, m.index), vi: `nét ${v} trong luật CSS không nói tới icon` });
          continue;
        }
      } else if (vb === null && laHinhHocSvg(theSoHuu(src, m.index))) {
        // Hình học SVG thô mà không đo được thang của `<svg>` bao quanh ⇒ không chứng minh được là icon.
        NGOAI_PHAM_VI.push({ ho: 'F-ICON-STROKE', p, dong: soDong(src, m.index), vi: `nét ${v} trên <${theSoHuu(src, m.index)}> không có viewBox đo được` });
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
    /* 🔬 AUDIT THƯỚC 05/09 — BÁO OAN ①: THƯỚC BẮT CHÍNH CHÚ THÍCH GIẢI THÍCH LUẬT NÓ ÉP.
       Đo được 9 ca, và cả 9 đều là văn xuôi nói VỀ thang cũ chứ không phải mã dùng thang cũ:
         · `lib/ui/nhip.ts:11`   "[Đ2] EXTEND không NEW: `--ease-apple` + `--dur-fast/--dur-base` đã có sẵn"
         · `lib/motion.ts:24,25` "không khớp `--dur-fast` (180ms) lẫn `--dur-base` (320ms)"
         · `app/globals.css:616` "/* bổ sung hai nấc còn thiếu quanh --dur-fast/--dur-base *​/"
       ⇒ Hai tệp ĐẦU chính là nơi ĐỊNH NGHĨA thang MỚI. Thước đang phạt đúng bản vá của nó, y hệt
       ca `_siet-28-08` ("lượt đầu bắt luôn chú thích của chính bản vá"). Ai tin số rồi đi "sửa"
       sẽ xoá lời giải thích vì sao thang mới tồn tại — tức phá tài liệu để làm đẹp một con số.
       ⛔ KHÔNG nới luật: thang vẫn là --nhip-*. Chỉ thôi đọc văn xuôi như thể là mã.
       `trongChuThich` đã có sẵn và đã import từ 28/08 — nhưng chỉ nối vào F-NHAN-BIA. Nối nốt. */
    let thay = false;
    for (const cu of NHIP_CU) {
      const re = new RegExp(cu.replace(/[-]/g, '\\-'), 'g'); let m;
      while ((m = re.exec(src))) {
        if (trongChuThich(src, m.index)) {
          NGOAI_PHAM_VI.push({ ho: 'F-MOTION-TOKEN', p, dong: soDong(src, m.index), vi: `${cu} nhắc trong CHÚ THÍCH, không phải mã` });
          continue;
        }
        thay = true; ho['F-MOTION-TOKEN'].ungVien++;
        viPham('F-MOTION-TOKEN', p, soDong(src, m.index), cu, '--nhip-*', 'Sheet chốt thang --nhip-* (130/170/220/300/460); đây là thang CŨ');
      }
    }
    /* 🔬 AUDIT THƯỚC 25/08 — MIỄN TRỪ `prefers-reduced-motion`.
       Thước từng báo `0.001ms !important` (globals.css:528,531) là vi phạm nhịp. SAI, và sai ở
       chỗ nguy hiểm: đó là **lối thoát chuẩn của trợ năng** — kỹ thuật phổ biến để TẮT chuyển
       động cho người bật giảm-chuyển-động. Ai tin số rồi đi "sửa" `0.001ms` về `--nhip-bam`
       sẽ **bật lại chuyển động cho đúng nhóm người đã xin tắt nó**.
       ⇒ Một máy soi ép luật nhịp mà không biết miễn trừ trợ năng thì nó ép người dùng, không ép mã. */
    const KHOI_GIAM_CD = [...src.matchAll(/@media[^{]*prefers-reduced-motion[^{]*\{/g)]
      .map((k) => { // tìm ngoặc đóng khớp cặp
        let d = 0, i = k.index + k[0].length - 1;
        for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}') { d--; if (!d) break; } }
        return [k.index, i];
      });
    const trongGiamCD = (i) => KHOI_GIAM_CD.some(([a, b]) => i >= a && i <= b);

    /* 🔬 AUDIT THƯỚC 05/09 — BÁO OAN ②: ĐỘ TRỄ KHÔNG PHẢI THỜI LƯỢNG.
       `animation-delay:35ms` khớp mẫu vì nó bắt đầu bằng chữ "animation", nhưng nó đo một
       ĐẠI LƯỢNG KHÁC: khoảng CHỜ trước khi chạy, không phải thời gian chạy. Thang --nhip-*
       (130…460) là thang THỜI LƯỢNG; ép một stagger 35ms lên 130ms không phải "sửa cho đúng
       nhịp" mà là **giết hiệu ứng so le** — các phần tử sẽ vào cách nhau 130ms thay vì 35ms.
       Đây không phải suy diễn: `SPEC-APPLE-MOTION-MATERIAL` (chốt 02/08) ghi thẳng
       **"stagger 30-60ms"** — một dải nằm HOÀN TOÀN dưới nấc thấp nhất của thang nhịp.
       Hai luật cùng hiệu lực mà mâu thuẫn thì phép đo sai, không phải mã sai.
       ⛔ KHÔNG nới: chỉ `*-delay` được ra ngoài phạm vi. `transition-duration`,
       `animation-duration` và mọi ms trong shorthand VẪN bị bắt như cũ. */
    const re2 = /(?:transition|animation)[^;\n]*?\b([0-9]{2,4})ms\b/g; let m2;
    while ((m2 = re2.exec(src))) {
      if (trongGiamCD(m2.index)) {
        NGOAI_PHAM_VI.push({ ho: 'F-MOTION-TOKEN', p, dong: soDong(src, m2.index), vi: 'lối thoát prefers-reduced-motion' });
        continue;
      }
      if (trongChuThich(src, m2.index)) {
        NGOAI_PHAM_VI.push({ ho: 'F-MOTION-TOKEN', p, dong: soDong(src, m2.index), vi: `${m2[1]}ms nhắc trong CHÚ THÍCH, không phải mã` });
        continue;
      }
      if (/-delay\s*:[^;\n]*$/.test(src.slice(m2.index, m2.index + m2[0].length))) {
        NGOAI_PHAM_VI.push({ ho: 'F-MOTION-TOKEN', p, dong: soDong(src, m2.index), vi: `${m2[1]}ms là ĐỘ TRỄ (stagger), không phải thời lượng` });
        continue;
      }
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

  /* ── CHIỀU THỨ HAI (thêm 05/09): KHÔNG ĐƯỢC BẮT OAN ────────────────────────────────────
   * Bộ trên chỉ hỏi *"luật còn sống không"*. Nhưng một luật **sống quá tay** cũng nguy hiểm
   * ngang một luật chết: nó đẻ ra việc giả, và người đi làm việc giả sẽ ép nét 0.15 của một
   * đường kích thước lên 1.5 rồi **làm hỏng bản vẽ**. Audit 05/09 gỡ 9 ca báo oan; hai
   * khẳng định dưới đây KHOÁ phần miễn trừ đó lại, để lần sau gỡ nhầm là TRƯỢT ngay. */
  const netCua = (tep) => ho['F-ICON-STROKE'].viPham.filter((v) => v.p === tep).map((v) => v.thay);
  const mepCua = (tep) => ho['F-MEP-CUON'].viPham.filter((v) => v.p === tep);
  /* Đếm vi phạm rơi ĐÚNG dòng chứa một selector — đủ để phân biệt ba ca ảo nằm cùng một tệp. */
  const soDongViPham = (id, tep, selector) => {
    const d = doc(tep).split('\n');
    return ho[id].viPham.filter((v) => v.p === tep && (d[v.dong - 1] || '').includes(selector)).length;
  };
  const KHONG_BAT_OAN = [
    ['F-ICON-STROKE', 'BẮT   nét 2 trong <svg viewBox="0 0 16 16">', netCua(MAU_AO).includes('2')],
    ['F-ICON-STROKE', 'THA   nét 0.15 trên <motion.path> của bản vẽ (viewBox là biểu thức)', !netCua(MAU_AO).includes('0.15')],
    ['F-ICON-STROKE', 'BẮT   nét 2 của selector `.if-icon svg`', netCua(MAU_AO_CSS).includes('2')],
    ['F-ICON-STROKE', 'THA   nét 2.5 của dây nối `.react-flow__edge-path`', !netCua(MAU_AO_CSS).includes('2.5')],
    /* MÉP CUỘN — cùng kỷ luật: đòi máy phân định CẢ HAI CHIỀU, không chỉ chiều bắt.
     * Ai gỡ nhầm nhánh `scrollbar-gutter` hoặc nhánh `overflow-x` thì TRƯỢT ngay tại đây,
     * chứ không âm thầm kết tội một vùng đã khai đúng luật / một vùng cuộn NGANG. */
    ['F-MEP-CUON', 'BẮT   `overflow-y:auto` trần, không giữ chỗ thanh cuộn', mepCua(MAU_AO_CSS).length >= 1],
    ['F-MEP-CUON', 'THA   `overflow-y:auto` ĐÃ kèm `scrollbar-gutter:stable`', soDongViPham('F-MEP-CUON', MAU_AO_CSS, 'ao-cuon-du') === 0],
    ['F-MEP-CUON', 'THA   `overflow-x:auto` — cuộn NGANG là bài khác', soDongViPham('F-MEP-CUON', MAU_AO_CSS, 'ao-cuon-ngang') === 0],
  ];
  console.log('   RANH GIỚI ICON ↔ KHÔNG-PHẢI-ICON · MÉP CUỘN — đòi máy phân định ĐÚNG CẢ HAI CHIỀU\n');
  for (const [id, mo, dat] of KHONG_BAT_OAN) {
    if (!dat) truot++;
    console.log(`   ${dat ? '🟢 ĐÚNG' : '🔴 SAI — RANH GIỚI ĐÃ LỆCH'}  ${id}  ${mo}`);
  }
  console.log('');

  if (truot) { console.log(`🔴 TỰ KIỂM TRƯỢT — ${truot} khẳng định không đạt.\n`); process.exit(3); }
  console.log('🟢 TỰ KIỂM ĐẠT — các họ soi-theo-tệp còn sống; ranh giới icon VÀ mép cuộn phân định đúng cả hai chiều.\n');
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
/* 🔴 `process.exitCode` CHỨ KHÔNG `process.exit()` — ĐO ĐƯỢC 05/09.
 * `console.log` ra PIPE là BẤT ĐỒNG BỘ trong Node (ra TTY/tệp thì đồng bộ). Máy soi in nhiều KB;
 * khi bên đọc rút chậm (xargs -P8, CI, `| less`, spawnSync) thì đường ống đầy, phần in còn lại nằm
 * trong hàng đợi, và `process.exit()` VỨT HÀNG ĐỢI ĐÓ ĐI — mã thoát vẫn đúng, CHỮ THÌ MẤT.
 * Đo thật trên `soi-frontier.mjs`: đọc nhanh 104.201 byte · đọc chậm 3 giây còn 56.930 byte,
 * MẤT 45%%. Tức chính cỗ máy canh "việc nào xong việc nào thiếu" có thể im lặng giấu một nửa
 * báo cáo của nó. Đặt exitCode rồi để Node tự thoát ⇒ nó chỉ thoát sau khi xả hết. */
process.exitCode = tongViPham ? 1 : 0;
