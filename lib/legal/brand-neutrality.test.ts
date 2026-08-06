/**
 * lib/legal/brand-neutrality.test.ts — Test CƯỠNG CHẾ luật trung tính ở tầng MÀU SẮC.
 *
 * Vì sao có file này (05/08): `CLAUDE.md` LUẬT NỀN TẢNG §1 cấm nhúng cứng thương hiệu của
 * bất kỳ studio nào vào sản phẩm, và `docs/LICENSE-NOTES.md §0` khẳng định IF là sản phẩm
 * độc lập bán ra ngoài. Nhưng luật chỉ nằm trong file .md thì 3 tuần là có người vi phạm
 * lại — đúng lý do `lib/cad/idf-neutrality.test.ts` ra đời. File này là bản song sinh của
 * nó cho MÀU: quét `lib/` `components/` `app/`, đỏ ngay khi có ai thêm lại màu thương hiệu.
 *
 * ⚠️ BÀI HỌC LÀM NÊN CÁCH QUÉT NÀY — quét hex là KHÔNG ĐỦ.
 * `docs/AUDIT-BRAND-PII.md` (25/07) quét bằng chuỗi hex nên bỏ sót TOÀN BỘ màu viết ở dạng
 * `rgba()`. Ngày 05/08 tìm lại thấy 15 chỗ như vậy, trong đó 3 chỗ CHẠY THẬT trên UI:
 * 12 chỗ trong 5 nền động màn đăng nhập (`app/globals.css`), pill cảnh báo Larkbase ở màn
 * chọn dự án (`components/ProjectSelect.tsx`), băng "phiên đứt" ở màn đăng nhập
 * (`components/entry/LoginScreen.tsx`). ⇒ Quét CẢ hex LẪN bộ ba rgb. Đây chính là luật N7
 * (`00-BAT-DAU-DOC-DAY.md §5`): grep phải đúng CHỈ BÁO của việc đang kiểm, không phải chỉ
 * báo gần đúng. (06/08 phải học lại đúng bài này một lần nữa ở cấp CÚ PHÁP — xem khối chú
 * thích tại chỗ bóc số rgb bên dưới.)
 *
 * Phạm vi CỐ Ý: chỉ `lib/` `components/` `app/` = thứ được đóng gói và ship ra.
 * KHÔNG quét `docs/` (nơi GHI luật, bắt buộc phải nêu tên màu bị cấm — vd chính
 * AUDIT-BRAND-PII), KHÔNG quét `scripts/` (`check-mocks.mjs` là script ĐI BẮT màu đó nên
 * bản thân nó phải chứa hằng số hex), KHÔNG quét `.worktrees/`/`node_modules/`/`.next/`.
 *
 * Chạy: `node_modules/.bin/sucrase-node lib/legal/brand-neutrality.test.ts`
 * (tự động nằm trong `npm test` — script đó quét mọi `*.test.ts`).
 */
import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

const ROOT = path.join(__dirname, '..', '..');
const SCAN_DIRS = ['lib', 'components', 'app'];
const SCAN_EXT = ['.ts', '.tsx', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.worktrees']);

/**
 * Màu thương hiệu bị cấm — CÙNG danh sách với `scripts/check-mocks.mjs` (luật HEX-TTT), ở
 * đây thêm dạng rgb tương đương vì cùng một màu, chỉ khác cách viết.
 */
const BRAND_COLORS = [
  { name: 'cam', hex: '#F06020', rgb: '240,96,32' },
  { name: 'navy', hex: '#002850', rgb: '0,40,80' },
  { name: 'beige', hex: '#F1ECE3', rgb: '241,236,227' },
];

interface Hit {
  file: string;
  line: number;
  color: string;
  form: 'hex' | 'rgb';
  text: string;
}

interface Exemption {
  file: string;
  reason: string;
}

/**
 * Miễn trừ CÓ LÝ DO — rà thủ công 05/08, rà lại 06/08. Miễn trừ theo FILE (không theo dòng)
 * vì các file dưới đây là bảng màu / bảng dữ liệu, số dòng xê dịch mỗi lần sửa.
 *
 * 🟢 GỠ 06/08 — `lib/avatar.ts` + `components/avatar/AvatarRenderer.tsx` KHÔNG CÒN MIỄN TRỪ.
 * Miễn trừ cũ dựa vào hai lập luận, cả hai đã hết hiệu lực:
 *   ① "avatar thuộc UI của app, LUẬT §4 cho app có nhận diện riêng" — §4 nói nhận diện riêng
 *      của **InteriorFlow**, mà 3 màu đó là của một studio khách, nên lập luận này chưa từng
 *      đủ (chính docblock cũ đã tự nhận).
 *   ② "avatar sắp đổi sang ảnh thật, sửa màu bây giờ là sửa thứ sắp bị thay" — nhưng Memoji
 *      vẫn là FALLBACK sống, tức 3 màu đó vẫn ship ra pixel thật; và đợt đổi kiến trúc chưa
 *      có ngày. Không thể để một vi phạm trung tính chờ vô thời hạn.
 * TỔNG quyết 06/08: đổi hex, GIỮ NGUYÊN key (`navy`/`orange`/`white`) nên avatar người dùng
 * đã lưu chỉ đổi sắc độ. Hai file nay nằm TRONG vùng quét — thêm lại màu cấm là đỏ ngay.
 */
const EXEMPTIONS: Exemption[] = [
  {
    file: 'lib/ai/chat-assist.test.ts',
    reason:
      'CỐ Ý chứa hex: đây là test khẳng định system prompt KHÔNG hardcode thương hiệu nào — phải nêu tên màu cấm mới kiểm được. Cùng loại với scripts/check-mocks.mjs.',
  },
  {
    file: 'lib/legal/brand-neutrality.test.ts',
    reason:
      'CHÍNH FILE NÀY — chứa bảng BRAND_COLORS (thứ đi bắt) + dữ liệu giả của meta-test. Cùng lý do miễn trừ với scripts/check-mocks.mjs: không thể bắt một màu mà không được phép viết tên nó ra.',
  },
];

function isExempt(file: string): boolean {
  return EXEMPTIONS.some((e) => e.file === file);
}

/**
 * Xoá phần CHÚ THÍCH khỏi từng dòng, GIỮ NGUYÊN số dòng (trả về mảng cùng độ dài).
 *
 * Vì sao tha chú thích: chú thích không ship ra pixel nào, và phải được phép nêu tên màu
 * ĐÃ GỠ thì mới ghi lại được lịch sử quyết định — chính docblock file này, `app/globals.css`
 * và `docs/AUDIT-BRAND-PII.md` đều làm vậy. Nếu cấm luôn trong chú thích thì phiên sau không
 * biết màu nào từng bị gỡ và vì sao, rồi thêm lại.
 *
 * Xử lý CẢ khối `/* … *​/` NHIỀU DÒNG (ca thật: chú thích CSS trong `app/globals.css`, dòng
 * giữa khối không bắt đầu bằng `*` nên kiểu "nhìn ký tự đầu dòng" bỏ sót).
 * Đánh đổi đã biết: `//` trong chuỗi (vd `'https://…'`) bị coi là mở chú thích ⇒ có thể bỏ
 * sót màu nằm SAU nó trên cùng dòng. Chấp nhận: không có ca thật nào viết màu sau một URL,
 * và hướng sai này là bỏ-sót chứ không phải báo-động-giả (không làm repo đỏ oan).
 */
function stripComments(src: string): string[] {
  const out: string[] = [];
  let inBlock = false;
  for (const raw of src.split('\n')) {
    let keep = '';
    let i = 0;
    while (i < raw.length) {
      if (inBlock) {
        const end = raw.indexOf('*/', i);
        if (end === -1) break;
        inBlock = false;
        i = end + 2;
        continue;
      }
      const openBlock = raw.indexOf('/*', i);
      const openLine = raw.indexOf('//', i);
      if (openLine !== -1 && (openBlock === -1 || openLine < openBlock)) {
        keep += raw.slice(i, openLine);
        break;
      }
      if (openBlock !== -1) {
        keep += raw.slice(i, openBlock);
        i = openBlock + 2;
        inBlock = true;
        continue;
      }
      keep += raw.slice(i);
      break;
    }
    out.push(keep);
  }
  return out;
}

/** Dòng nối tiếp của docblock (`* …`) — khối đã bị `stripComments` nuốt khi quét CẢ file,
 *  nhưng khi quét một MẢNH rời (meta-test) thì chưa có `/*` mở đầu, nên chặn thêm ở đây. */
function isDocblockLine(trimmed: string): boolean {
  return trimmed.startsWith('*');
}

export function scanSource(file: string, src: string): Hit[] {
  const hits: Hit[] = [];
  const lines = stripComments(src);
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || isDocblockLine(trimmed)) continue;
    const upper = trimmed.toUpperCase();
    for (const c of BRAND_COLORS) {
      if (upper.includes(c.hex)) {
        hits.push({ file, line: i + 1, color: c.name, form: 'hex', text: trimmed });
      }
    }
    /* Dạng rgb/rgba — SỬA 06/08 sau vòng KIỂM PHẢN BIỆN.
     *
     * Bản cũ so chuỗi: bỏ hết khoảng trắng rồi tìm `rgb(240,96,32`. Cách đó chỉ bắt được ĐÚNG
     * một lối viết. Ba cú pháp CSS HỢP LỆ và đang phổ biến đi thẳng qua, đã dựng lại từng ca:
     *   · `RGBA(240,96,32,.5)`     — tên hàm viết HOA
     *   · `rgb(240 96 32)`         — CSS Color 4, cách nhau bằng DẤU CÁCH (bỏ khoảng trắng
     *                                 xong thành `rgb(2409632)`, không khớp gì nữa)
     *   · `rgb(240 96 32 / 50%)`   — cú pháp alpha mới
     * Đúng cùng loại lỗi mà docblock đầu file đã ghi ("quét hex là KHÔNG ĐỦ"), chỉ lùi một bậc.
     * Nay BÓC SỐ ra khỏi lời gọi thay vì so chuỗi: mọi dấu phân cách (phẩy, cách, gạch chéo)
     * đều được, không phân biệt hoa/thường.
     *
     * Giới hạn CÒN LẠI, ghi rõ để không ai tưởng đã kín: `hsl()` và `color(srgb …)` viết cùng
     * một màu vẫn lọt — muốn bắt phải đổi hệ màu, đắt hơn hẳn. Chưa có ca thật nào trong repo
     * dùng hai dạng đó; nếu sau này có, đây là chỗ phải sửa. */
    for (const m of trimmed.matchAll(/rgba?\(([^)]*)\)/gi)) {
      const nums = (m[1].match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 3).join(',');
      const c = BRAND_COLORS.find((b) => b.rgb === nums);
      if (c) hits.push({ file, line: i + 1, color: c.name, form: 'rgb', text: trimmed });
    }
  }
  return hits;
}

function walk(dir: string, out: string[]) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (SCAN_EXT.includes(path.extname(name))) out.push(abs);
  }
}

/* ── 1) quét thật lib/ components/ app/ ── */
function testProductSourceIsNeutral() {
  console.log('\n[1] Quét lib/ components/ app/ — 0 màu thương hiệu ngoài danh sách miễn trừ');

  const files: string[] = [];
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d), files);
  ok(`quét được file nguồn (sanity — thấy ${files.length})`, files.length > 100);

  const allHits: Hit[] = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs);
    allHits.push(...scanSource(rel, fs.readFileSync(abs, 'utf8')));
  }

  const violations = allHits.filter((h) => !isExempt(h.file));
  for (const v of violations) {
    console.log(`  FAIL - ${v.file}:${v.line} [${v.form}] màu ${v.color} — "${v.text.slice(0, 90)}"`);
  }
  ok(`0 vi phạm (thấy ${violations.length})`, violations.length === 0);

  // Miễn trừ "chết" — file đã sạch/đã xoá nhưng quên gỡ khỏi danh sách ⇒ danh sách phình vô
  // nghĩa theo thời gian và che mất vi phạm mới. Cùng cơ chế với idf-neutrality.test.ts.
  const stale = EXEMPTIONS.filter((e) => !allHits.some((h) => h.file === e.file));
  for (const s of stale) console.log(`  FAIL - miễn trừ chết (file đã sạch, gỡ khỏi danh sách): ${s.file}`);
  ok(`0 miễn trừ chết (thấy ${stale.length})`, stale.length === 0);
}

/* ── 2) meta-test: chứng minh scanner BẮT ĐƯỢC thật, không phải test luôn xanh ── */
function testScannerCatchesRealViolation() {
  console.log('\n[2] Meta-test — scanner phải bắt cả 3 màu ở CẢ 2 cách viết, và tha chú thích');

  const hexHits = scanSource('fake.tsx', `  <rect fill="#F06020" />\n  color: '#002850';\n  background: '#f1ece3';`);
  ok('bắt 3 màu dạng hex, không phân biệt hoa/thường', hexHits.length === 3 && hexHits.every((h) => h.form === 'hex'));

  // Đây là ca mà bản quét cũ (chỉ hex) BỎ SÓT — 15 chỗ thật trong repo ngày 05/08.
  const rgbHits = scanSource('fake.css', `  background: rgba(240, 96, 32, 0.28);\n  border: 1px solid rgb(0,40,80);`);
  ok('bắt dạng rgb/rgba kể cả có khoảng trắng (ca AUDIT-BRAND-PII bỏ sót)', rgbHits.length === 2 && rgbHits.every((h) => h.form === 'rgb'));

  // 3 ca KIỂM PHẢN BIỆN 06/08 dựng ra và bản cũ để lọt hết — nay phải bắt được.
  const cssModern = scanSource('fake.css', `  a{color:RGBA(240,96,32,.5)}\n  b{color:rgb(240 96 32)}\n  c{color:rgb(0 40 80 / 50%)}`);
  ok('bắt RGBA( viết HOA · rgb() cách bằng DẤU CÁCH · cú pháp alpha `/` (3 ca từng lọt)', cssModern.length === 3);

  const commentHits = scanSource('fake.ts', ` * Trước đây là #F06020 / rgba(0, 40, 80, 0.4) — đã gỡ 05/08.\n  // navy cũ: #002850`);
  ok('CHÚ THÍCH được phép nêu tên màu đã gỡ (ghi lịch sử quyết định)', commentHits.length === 0);

  // Ca THẬT bỏ sót nếu chỉ nhìn ký tự đầu dòng: dòng GIỮA một khối chú thích CSS.
  const cssBlock = scanSource('fake.css', `/* ghi chú nhiều dòng\n   nêu rgba(240, 96, 32) và #002850 đã gỡ\n   hết ghi chú */\n.x { color: #F1ECE3; }`);
  ok('bỏ qua dòng GIỮA khối /* */ nhiều dòng, nhưng vẫn bắt dòng code sau khối', cssBlock.length === 1 && cssBlock[0].line === 4);

  const cleanHits = scanSource('fake.tsx', `  background: 'var(--accent)';\n  fill="#6a57f5"`);
  ok('nguồn sạch (token + accent IF) → 0 hit', cleanHits.length === 0);

  ok(
    'miễn trừ chỉ che ĐÚNG file được nêu',
    isExempt('lib/ai/chat-assist.test.ts') && !isExempt('lib/ai/chat-assist-other.test.ts'),
  );
}

/* ── 3) khoá riêng 2 file avatar — thứ vừa được gỡ miễn trừ 06/08 ── */
/**
 * Vì sao tách thành bài kiểm RIÊNG thay vì tin vào [1]: [1] chỉ nói "0 vi phạm trong toàn
 * vùng quét". Nếu mai có ai đổi `SCAN_DIRS`, đổi `SCAN_EXT`, hay đơn giản là ĐỔI TÊN file
 * avatar, [1] vẫn xanh trong khi hai file này đã rơi ra ngoài lưới — im lặng, không ai biết.
 * Bài này khẳng định hai điều RIÊNG BIỆT: (a) file THỰC SỰ nằm trong tập được quét,
 * (b) nội dung nó sạch. Cùng cơ chế "miễn trừ chết" ở [1]: bắt lưới thủng, không chỉ bắt màu.
 */
const AVATAR_FILES = ['lib/avatar.ts', 'components/avatar/AvatarRenderer.tsx'];

function testAvatarFilesAreScannedAndClean() {
  console.log('\n[3] Hai file avatar — nằm TRONG lưới quét và sạch màu thương hiệu');

  const files: string[] = [];
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d), files);
  const scanned = new Set(files.map((abs) => path.relative(ROOT, abs)));

  for (const rel of AVATAR_FILES) {
    ok(`${rel} — nằm trong tập file được quét`, scanned.has(rel));
    ok(`${rel} — KHÔNG còn nằm trong danh sách miễn trừ`, !isExempt(rel));

    const abs = path.join(ROOT, rel);
    const hits = fs.existsSync(abs) ? scanSource(rel, fs.readFileSync(abs, 'utf8')) : [];
    for (const h of hits) console.log(`  FAIL - ${h.file}:${h.line} [${h.form}] màu ${h.color} — "${h.text.slice(0, 90)}"`);
    ok(`${rel} — 0 màu thương hiệu (thấy ${hits.length})`, hits.length === 0);
  }
}

testProductSourceIsNeutral();
testScannerCatchesRealViolation();
testAvatarFilesAreScannedAndClean();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
