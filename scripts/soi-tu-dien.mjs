#!/usr/bin/env node
/**
 * scripts/soi-tu-dien.mjs — CHỐNG LỆCH ĐỊNH NGHĨA (Hoà đặt cơ chế 12/08: "từ ngữ không theo
 * chuẩn chung khiến ngữ nghĩa thay đổi, ảnh hưởng chất lượng và định hướng sản phẩm").
 *
 * Cùng họ soi-frontier/soi-hinh-hoc. Máy này nay soi HAI BỆNH NGƯỢC CHIỀU NHAU — cố ý tách
 * thành hai danh sách, hai mức nghiêm, vì cách chữa khác hẳn nhau:
 *
 *   ① TU_DIEN      — MỘT KHÁI NIỆM ↔ NHIỀU NHÃN.  "sai → đúng" rõ ràng, sửa là xong.
 *                     Mức 🔴 CHẶN (`--strict` exit 1).
 *   ② TU_DA_NGHIA  — MỘT CHỮ ↔ NHIỀU KHÁI NIỆM.   Máy chỉ biết "chữ này trần, chưa nói rõ
 *                     nghĩa nào"; TÊN thay thế thì phải người đặt và Hoà duyệt.
 *                     Mức 🟡 CẢNH BÁO (không chặn — xem MỨC NGHIÊM bên dưới).
 *
 * Nguồn chuẩn: SPEC-NGON-NGU-CHI-DAN §6 · các chốt tên trong 00-CHOT (vòng cuối 07/08 + 11/08) ·
 * bảng §V5 `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` (Hoà duyệt 9 dòng 🔴 ngày 16/08).
 * THÊM TỪ MỚI = thêm 1 entry lúc CHỐT TÊN — cùng kỷ luật với frontier-registry.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { CAP_DA_NHAU, THIEU_REACH, soiDong } from './_cap-da-nhau.mjs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STRICT = process.argv.includes('--strict');
/** Bật CHẶN cho cả lớp đa nghĩa — CHƯA dùng, để dành khi các tên ở §V5 đã thi hành xong. */
const STRICT_DA_NGHIA = process.argv.includes('--strict-da-nghia');

// ───────────────────────────────────────────────────────────────────────────────────────────
// ① TU_DIEN — một khái niệm, nhiều nhãn.  mau = regex bắt CHUỖI HIỂN THỊ sai (bọc quote/tag
//    để né văn xuôi thường); pham_vi = dirs quét.
// ───────────────────────────────────────────────────────────────────────────────────────────
const TU_DIEN = [
  { sai: "'Trình bày'|\"Trình bày\"|>Trình bày<", dung: 'Trình chiếu (tên chặng — chốt vòng cuối 07/08)', pham_vi: ['components', 'docs/mocks', '.claude/skills'] },
  { sai: "'2D Kỹ thuật'|\"2D Kỹ thuật\"|>2D Kỹ thuật<", dung: 'Thiết kế 2D (chốt 07/08)', pham_vi: ['components', '.claude/skills'] },
  { sai: "'3D Thiết kế'|\"3D Thiết kế\"|>3D Thiết kế<", dung: 'Thiết kế 3D (chốt 07/08)', pham_vi: ['components', '.claude/skills'] },
  { sai: 'Thẻ gu|thẻ gu', dung: 'Thẻ DNA Thiết kế / Design DNA Card (chốt 11/08)', pham_vi: ['components', 'docs/mocks', '.claude/skills'] },
  { sai: "'tự động'|\"tự động\"|>[Tt]ự động<", dung: 'Magic ✨ (CHOT-TACH-AI: cấm chữ "tự động" trong UI)', pham_vi: ['components', '.claude/skills'] },
  { sai: "'Thẻ gu'|GuCard", dung: 'DnaCard (khoá code — hợp nhất Design DNA)', pham_vi: ['lib', '.claude/skills'] },
  // 13/08 đêm (Hoà chốt khi duyệt mắt): trang gốc `/` là HOME Tổng quan (chốt 12/08) — nhãn cũ
  // "Về Thư viện dự án" trùng ngữ nghĩa với "Thư viện" (sheet vật liệu/asset), gây lẫn 2 nghĩa.
  { sai: 'Về Thư viện dự án|Back to project library', dung: 'Home (nhãn điều hướng về trang gốc — chốt 13/08 đêm)', pham_vi: ['components', 'app', 'lib', '.claude/skills'] },

  // ── 16/08 · §V5 dòng #3 và #8: hai ca ĐÃ THI HÀNH XONG ⇒ đứng đây làm CHỐT CHẶN TÁI PHÁT.
  //    Khác 7 entry trên (nhãn hiển thị), hai entry này canh TÊN KỸ THUẬT trong code.
  {
    // Bắt CÁCH DÙNG THẬT của biến CSS — khai `--mat-x:` hoặc tham chiếu `var(--mat-x)`.
    // Cố ý KHÔNG bắt chữ `--mat-` trần trong văn xuôi: comment giải thích "đổi tên TỪ --mat-*"
    // là tài liệu hoá lịch sử đổi tên, phải viết được. Đây là siết vào tín hiệu thật, không phải
    // nới cho qua cửa — mọi cách dùng của custom property đều rơi vào đúng hai dạng trên.
    sai: 'var\\(--mat-|--mat-[a-z-]+\\s*:',
    dung: '--nen-mo-* (§V5 #3 — `mat-card` cách `matId` đúng một dấu gạch: một bên là MÀU, một bên là TIỀN nối `ProductSpec.sku`)',
    pham_vi: ['app', 'components', 'lib', 'scripts', '.claude/skills'],
  },
  {
    // Bắt ca "trích nguyên văn câu của [Đ2] rồi gán số [Đ1]" — dạng sai khó thấy nhất vì
    // câu trích thì đúng. Nguồn chuẩn ĐỌC ĐƯỢC: TRIET-LY-IF.md:70 = [Đ1] "tầng sau là hệ quả
    // tầng trước" · :72 = [Đ2] "NHÌN VÀO TRONG TRƯỚC".
    sai: '\\[Đ1\\][^\\n]{0,80}(nhìn vào trong|nhìn-vào-trong|NHÌN VÀO TRONG)',
    dung: '[Đ2] (TRIET-LY-IF.md:72). [Đ1] ở :70 là "tầng sau phải là hệ quả tầng trước" — §V5 #8',
    pham_vi: ['app', 'components', 'lib', 'scripts', 'docs/phieu-giao', '.claude/skills'],
  },
];

// ───────────────────────────────────────────────────────────────────────────────────────────
// ② TU_DA_NGHIA — một chữ, nhiều khái niệm.  Hoà duyệt §V5 ngày 16/08 (9 dòng 🔴).
//
//    LUẬT MÁY (tất định, grep thuần — KHÔNG AI):  từ đa nghĩa xuất hiện mà TRONG CÙNG DÒNG
//    không có định ngữ nào đã khai  →  báo, kèm danh sách TÊN RIÊNG đã duyệt để người chọn.
//    Máy KHÔNG hiểu nghĩa và không được phép đoán — nó chỉ đếm "chữ trần".
//
//    `ngoai_le` là BẮT BUỘC: có tiền lệ trong chính hệ — SPEC-NGON-NGU-CHI-DAN.md:104
//    "'Node' làm TÊN MODE chặng 3D là hợp lệ — ngoại lệ duy nhất".
// ───────────────────────────────────────────────────────────────────────────────────────────
const TU_DA_NGHIA = [
  {
    /* ══ THÊM 30/08 — Hoà chẩn đúng gốc của lỗi "xám bẩn" đã báo HƠN BA LẦN ══
     *   *"Nếu mình đoán không lầm, lỗi này xuất từ việc hiểu nghĩa tiếng Việt giữa: MÀU NỀN
     *   (toàn bộ màu base của các màn) = MÀU HÌNH NỀN, rồi sau đó lẫn lộn lấy làm nền luôn."*
     *
     * Bằng chứng đo được cùng ngày: `components/present-editor/PlayerElements.tsx:55` viết CẢ HAI
     * trong một câu — *"ảnh nền full-bleed (màu nền do SlidePlayer đặt…)"*. Và "màu nền" đang mang
     * ÍT NHẤT NĂM nghĩa trong mã: nền slide · nền khung avatar · màu nguội thanh tiến trình ·
     * nền của chính một vật · nền base toàn app.
     *
     * ⚠️ VÌ SAO CA NÀY QUAY LẠI BA LẦN: máy canh có, nhưng **nó không kêu** — `nền` chưa từng nằm
     * trong bảng này. Hoà: *"máy canh mà không kêu thì phải coi lại."*
     *
     * ══ CÁCH GIẢI, Hoà chốt — và đây là khuôn cho CẢ tính năng "Create with AI" ══
     *   canh → thấy sai HOẶC NGHI sai → báo thẳng AI/agent
     *        → agent TÓM GỌN điều người dùng vừa yêu cầu
     *        → rồi HỎI LUÔN: từ đó anh muốn nói nghĩa nào?
     *   ⇒ giải xong bài toán, ai cũng hiểu dù cùng một từ mà khác nghĩa.
     * Người dùng IF sẽ gõ "đổi màu nền" vào ô Create with AI. Nếu máy đoán bừa thì nó đổi nhầm
     * token base thay vì thay ảnh nền — đúng lỗi vừa xảy ra, chỉ khác là lần đó nạn nhân là chúng ta. */
    tu: 'nền',
    v5: '#0 🔴🔴 — ca đã trả giá 3 lần',
    ten: [
      'nền base (token mặt của app: --bg · --panel · --card · --field)',
      'hình nền / wallpaper (ẢNH khoác lên, thay lúc nào cũng được)',
      'nền của một vật (nền thẻ · nền nút · nền khung avatar)',
    ],
    /* Có một trong các định ngữ này thì đã rõ nghĩa ⇒ thôi báo. */
    dinh_ngu: /hình nền|wallpaper|ảnh nền|nền động|nền base|nền hệ|--bg\b|--panel\b|--card\b|--field\b|nền thẻ|nền nút|nền khung|nền mờ|background-image|backgroundImage/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'khối',
    v5: '#1 🔴🔴',
    ten: ['bước (node trên canvas)', 'khối (khối 3D đặc — GIỮ chữ)', 'mảng (khối giao diện)'],
    // Đã rõ nghĩa thì thôi báo. "khối lượng" là từ ghép khác hẳn (BOQ) — không phải ca đa nghĩa.
    dinh_ngu: /khối 3D|khối đặc|dựng khối|khối lượng|Công Thức Khối|BuildRecipe|khối hộp|khối tích|khối nhà|bước|mảng/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'kính',
    v5: '#2 🔴',
    ten: ['kính (VẬT LIỆU nội thất — GIỮ chữ, có giá + vào BOQ)', 'nền mờ (vibrancy giao diện)'],
    dinh_ngu: /nền mờ|kính cường lực|kính trong|kính mờ|vật liệu|transmission|vibrancy|backdrop-filter|--nen-mo|nen-mo-panel|nen-mo-card|vien-mo/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'nấc',
    v5: '#4 🔴',
    ten: ['nấc chi tiết (mức trình bày, người dùng bấm)', 'nấc cường độ (giảm chói/độ đậm)', 'cờ tin cậy (measured/inferred/verified — BỎ HẲN chữ "nấc")'],
    dinh_ngu: /nấc chi tiết|nấc cường độ|cờ tin cậy|chi tiết|thu gọn|sổ ra|mặc định|cường độ|giảm chói|độ đậm|measured|inferred|verified|tin cậy/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'lớp',
    v5: '#5 🔴',
    ten: ['lớp bản vẽ (CAD)', 'lớp slide (thứ tự z trong present-editor)', 'trục DNA (BỎ chữ lớp)', 'tuyến kiểm (BỎ chữ lớp)'],
    dinh_ngu: /lớp bản vẽ|lớp slide|trục DNA|tuyến kiểm|lớp phủ|lớp mặt|nhiều lớp|3 lớp|ba lớp|hai lớp|2 lớp|lớp luật|lớp góp ý|xếp lớp|lớp trên|lớp dưới/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'tầng',
    v5: '#6 🔴',
    ten: ['tầng (TẦNG NHÀ kiểu Revit — GIỮ chữ)', 'bậc AI (tier)', 'độ sâu (z giao diện)', 'kiểu sáng', 'cấp tool', 'cấp vai'],
    dinh_ngu: /bậc AI|độ sâu|kiểu sáng|cấp tool|cấp vai|tầng nhà|tầng trệt|cao độ|storey|Level|tầng sau|tầng trước|hạ tầng|tầng lớp/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'card|thẻ',
    v5: '#7 🔴',
    ten: ['khung thẻ (vỏ giao diện)', 'thẻ dự án', 'thẻ DNA', 'thẻ tác vụ', 'nền mờ thẻ', 'thẻ việc'],
    // ⚠️ CẤM đặt tên bằng chữ "tấm" — đã thuộc về tấm Thư viện (chốt 07/08).
    dinh_ngu: /khung thẻ|thẻ dự án|thẻ DNA|thẻ tác vụ|nền mờ thẻ|thẻ việc|thẻ vai|thẻ lật|WidgetCard|TaskCard|DesignDnaCard|ProjectOverviewCard|--card|card 3 nấc/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
  {
    tu: 'module',
    v5: '#13 🔴 (bốn tên một thứ)',
    // §V5 #13 duyệt "chọn MỘT tên" — nhưng tên nào thì CHƯA chốt. Máy KHÔNG được tự chọn:
    // nó chỉ báo rằng đây là tên thứ tư cho thứ đã có ba tên, để người chốt.
    ten: ['CHƯA CHỐT TÊN — widget · element · node · module đang là BỐN tên cho MỘT thứ (§V5 #13). Bằng chứng lệch đã lan: WidgetCard.tsx dùng token `--shadow-node`.'],
    dinh_ngu: /ES-module|node_modules|module-level|mức MODULE|biến module/i,
    pham_vi: ['docs/phieu-giao', '.claude/skills'],
    ngoai_le: [],
  },
];

// ───────────────────────────────────────────────────────────────────────────────────────────
// PHẠM VI QUÉT `.md` — vá lỗ máy soi mù văn bản (P-I tìm ra, Hoà chốt vá 16/08).
//
// Máy CŨ chỉ quét .ts/.tsx/.html/.css ⇒ mù đúng `docs/phieu-giao/` — nơi agent ĐỌC ĐỂ THI HÀNH.
// Nhãn lệch trong phiếu lan thẳng vào code của phiên sau, nên đó mới là chỗ đau.
//
// ⛔ KHÔNG quét cả `docs/` (đo 16/08: **561 tệp .md · 33 MB**). Phần lớn là NHẬT KÝ LỊCH SỬ —
//    sửa nhật ký cũ là VIẾT LẠI LỊCH SỬ, không phải sửa lỗi.  Ranh giới chọn theo một câu hỏi
//    duy nhất, trả lời được bằng có/không: **chữ trong tệp này còn ĐANG ĐIỀU KHIỂN việc không?**
// ───────────────────────────────────────────────────────────────────────────────────────────
const MD_QUET = [
  'docs/phieu-giao', // 59 tệp — agent đọc để THI HÀNH. Ưu tiên số 1.
  'docs/mocks', //  3 tệp — mock là hợp đồng giao diện (luật QUY TRÌNH DESIGN 02/08).
];
// ───────────────────────────────────────────────────────────────────────────────────────────
// ③ CẶP CHỮ ĐÁ NHAU — luật + hàm soi nằm ở `_cap-da-nhau.mjs`, dùng chung với
//    `cap-da-nhau.test.ts`. Đọc chú thích ở đó để biết BA TRỤC Owner/Storage/Reach và vì sao
//    bản đầu (per-user ↔ localStorage) đã bị Hoà bác 29/08 bằng một phản ví dụ.
/** Loại trừ tường minh + LÝ DO. Thừa so với MD_QUET, cố ý — chặn cả khi ai đó nới pham_vi sau này. */
const MD_LOAI_TRU = [
  ['CHANGELOG.md', 'nhật ký append-only 220K — luật cấm xoá lịch sử cũ'],
  ['docs/memory/', 'ký ức phiên đã nén — là BẢN GHI của quá khứ, không điều khiển việc nào'],
  ['docs/bao-cao-phien/', 'báo cáo đã nộp — sửa là sửa lời khai của phiên đã đóng'],
  ['docs/00-CHOT.md', 'sổ chốt append-only; sửa dòng cũ là viết lại quyết định của Hoà'],
  ['docs/nc/NC-TU-DA-NGHIA-2026-08-16.md', 'chính là nơi ĐỊNH NGHĨA các từ này — dùng từ trần là đúng việc'],
];

const EXT_MA = new Set(['.ts', '.tsx', '.html', '.css']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git']);

const chuanHoa = (p) => p.replace(ROOT, '').replace(/^\/+/, '');
const duocQuetMd = (rel) =>
  MD_QUET.some((d) => rel.startsWith(d)) && !MD_LOAI_TRU.some(([m]) => rel.startsWith(m) || rel === m);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
      continue;
    }
    const ext = name.slice(name.lastIndexOf('.'));
    if (EXT_MA.has(ext)) yield p;
    else if (ext === '.md' && duocQuetMd(chuanHoa(p))) yield p;
  }
}

function quetPhamVi(pham_vi, fn) {
  for (const d of pham_vi) {
    const dir = join(ROOT, d);
    if (!existsSync(dir)) continue;
    for (const f of walk(dir)) fn(f, chuanHoa(f));
  }
}

const ngay = new Date().toISOString().slice(0, 10);
console.log('\nSOI TỪ ĐIỂN — chống lệch định nghĩa ' + ngay);
console.log('─'.repeat(96));

// ── ① MỘT KHÁI NIỆM ↔ NHIỀU NHÃN (🔴 chặn khi --strict) ────────────────────────────────────
let tongNhan = 0;
for (const t of TU_DIEN) {
  const re = new RegExp(t.sai, 'g');
  const hits = [];
  quetPhamVi(t.pham_vi, (f, rel) => {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (re.test(line)) {
        hits.push(`${rel}:${i + 1}`);
        re.lastIndex = 0;
      }
    });
  });
  if (hits.length) {
    tongNhan += hits.length;
    console.log(`🔴 ${hits.length}× dùng sai → ĐÚNG là: ${t.dung}`);
    hits.slice(0, 5).forEach((h) => console.log(`     ${h}`));
    if (hits.length > 5) console.log(`     … +${hits.length - 5} chỗ nữa`);
  }
}
console.log(tongNhan ? `\n🔴 ${tongNhan} chỗ lệch NHÃN — sửa khi chạm file, chỗ nhãn hiển thị sửa NGAY` : '✅ 0 lệch nhãn');

// ── ② MỘT CHỮ ↔ NHIỀU KHÁI NIỆM (🟡 cảnh báo, KHÔNG chặn) ──────────────────────────────────
console.log('\n' + '─'.repeat(96));
console.log('🟡 TỪ TRẦN ĐA NGHĨA — chữ dùng mà chưa nói rõ nghĩa nào (§V5 NC-TU-DA-NGHIA, Hoà duyệt 16/08)');
console.log('   Mức CẢNH BÁO: đếm và chỉ chỗ, KHÔNG chặn build. Máy không đặt tên hộ — người chọn.');
console.log('');
console.log('   ⇒ CÁCH GIẢI, Hoà chốt 30/08 — máy KHÔNG dừng ở việc kêu:');
console.log('       ① máy canh thấy sai HOẶC NGHI sai  →  báo thẳng AI/agent đang làm');
console.log('       ② agent TÓM GỌN điều người dùng vừa yêu cầu');
console.log('       ③ rồi HỎI LUÔN: từ đó anh muốn nói nghĩa nào trong các nghĩa dưới?');
console.log('     Giải xong bài toán: ai cũng hiểu, dù cùng một chữ mà khác nghĩa.');
console.log('     ⚠️ Đây cũng là khuôn bắt buộc cho tính năng CREATE WITH AI của IF — người dùng gõ');
console.log('     "đổi màu nền" thì máy phải HỎI, không được đoán. Đoán bừa là đổi nhầm token base');
console.log('     thay vì thay ảnh nền — đúng lỗi đã trả giá ba lần, chỉ khác là nạn nhân lần đó là ta.');
console.log('─'.repeat(96));

let tongDaNghia = 0;
const theoTu = [];
for (const t of TU_DA_NGHIA) {
  const re = new RegExp(`(^|[^\\p{L}])(${t.tu})([^\\p{L}]|$)`, 'iu');
  const hits = [];
  quetPhamVi(t.pham_vi, (f, rel) => {
    if (t.ngoai_le.some((x) => rel.startsWith(x))) return;
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (re.test(line) && !t.dinh_ngu.test(line)) hits.push(`${rel}:${i + 1}`);
    });
  });
  theoTu.push([t, hits.length]);
  if (hits.length) {
    tongDaNghia += hits.length;
    console.log(`🟡 ${String(hits.length).padStart(3)}× «${t.tu}» trần  (§V5 ${t.v5})`);
    t.ten.forEach((n) => console.log(`        → ${n}`));
    hits.slice(0, 3).forEach((h) => console.log(`        ${h}`));
    if (hits.length > 3) console.log(`        … +${hits.length - 3} chỗ nữa`);
  }
}

// ── ③ CẶP CHỮ ĐÁ NHAU (🔴 CHẶN, không cần cờ) ─────────────────────────────────────────────
console.log('\n' + '─'.repeat(96));
console.log('🔴 CẶP CHỮ ĐÁ NHAU — hai chữ cùng dòng, nghĩa loại trừ nhau. Mức CHẶN.');
console.log('─'.repeat(96));
/* Lớp ③ TỰ ĐI, không mượn `quetPhamVi`: bộ lọc .md của hai lớp trên chỉ nhận `MD_QUET`
 * (docs/phieu-giao · docs/mocks), nên mượn nó thì `docs/control` và `.claude/skills` — hai chỗ
 * ra lệnh nhiều nhất — bị bỏ qua IM LẶNG, cổng vẫn xanh. Đo lúc thêm: mượn = 0 tệp .md ngoài
 * phiếu giao được quét. Cổng canh chỗ không ai viết thì canh cái gì. */
function* diKhap(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* diKhap(p);
    else if (/\.(md|ts|tsx|html|css)$/.test(name)) yield p;
  }
}
let tongDaNhau = 0;
let tongThieuReach = 0;
for (const c of CAP_DA_NHAU) {
  const chan = [];
  const nhac = [];
  const quet = (fn) => { for (const d of c.pham_vi) for (const p of diKhap(join(ROOT, d))) fn(p, chuanHoa(p)); };
  quet((f, rel) => {
    if (c.ngoai_le.some((x) => rel.startsWith(x))) return;
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      const kq = soiDong(line, c);
      if (kq === 'chan') chan.push(`${rel}:${i + 1}`);
      else if (kq === 'canh-bao') nhac.push(`${rel}:${i + 1}`);
    });
  });
  tongDaNhau += chan.length;
  tongThieuReach += nhac.length;
  if (chan.length) {
    console.log(`🔴 ${chan.length}× «${c.ten}»`);
    console.log(`     ${c.vi_sao}`);
    chan.slice(0, 5).forEach((h) => console.log(`     ${h}`));
  }
  if (nhac.length) {
    console.log(`🟡 ${nhac.length}× «${THIEU_REACH.ten}»`);
    console.log(`     ${THIEU_REACH.vi_sao}`);
    nhac.slice(0, 5).forEach((h) => console.log(`     ${h}`));
  }
}
console.log(
  tongDaNhau
    ? `\n🔴 ${tongDaNhau} cặp đá nhau — CHẶN.`
    : `✅ 0 cặp chữ đá nhau (${CAP_DA_NHAU.length} cặp đang canh · ${tongThieuReach} chỗ thiếu trục Reach, chỉ nhắc)`
);

console.log('─'.repeat(96));
console.log(`   Phạm vi .md đang quét: ${MD_QUET.join(' · ')}`);
console.log(`   Loại trừ (nhật ký, không điều khiển việc): ${MD_LOAI_TRU.map(([m]) => m).join(' · ')}`);
console.log(
  tongDaNghia
    ? `🟡 ${tongDaNghia} chỗ dùng chữ trần — KHÔNG chặn. Sửa khi soạn phiếu MỚI; phiếu đã đóng thì để nguyên.`
    : '✅ 0 chỗ dùng chữ trần đa nghĩa'
);
console.log(
  `   Bật chặt: \`--strict\` chặn lớp ①. \`--strict-da-nghia\` chặn thêm lớp ② — CHƯA dùng, để dành khi §V5 thi hành xong.\n`
);

/* 🔴 `process.exitCode` CHỨ KHÔNG `process.exit()` — ĐO ĐƯỢC 05/09.
 * `console.log` ra PIPE là BẤT ĐỒNG BỘ trong Node (ra TTY/tệp thì đồng bộ). Máy soi in nhiều KB;
 * khi bên đọc rút chậm (xargs -P8, CI, `| less`, spawnSync) thì đường ống đầy, phần in còn lại nằm
 * trong hàng đợi, và `process.exit()` VỨT HÀNG ĐỢI ĐÓ ĐI — mã thoát vẫn đúng, CHỮ THÌ MẤT.
 * Đo thật trên `soi-frontier.mjs`: đọc nhanh 104.201 byte · đọc chậm 3 giây còn 56.930 byte,
 * MẤT 45%%. Tức chính cỗ máy canh "việc nào xong việc nào thiếu" có thể im lặng giấu một nửa
 * báo cáo của nó. Đặt exitCode rồi để Node tự thoát ⇒ nó chỉ thoát sau khi xả hết. */
process.exitCode = tongDaNhau || (STRICT && tongNhan) || (STRICT_DA_NGHIA && tongDaNghia) ? 1 : 0;
