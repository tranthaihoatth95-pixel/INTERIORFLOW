/**
 * lib/cad/idf-neutrality.test.ts — Test cưỡng chế LUẬT TRUNG TÍNH (docs/IF-FEATURE-TREE.md PHẦN E,
 * chốt 30/07 — số luật do Claude Code điền). Rationale (Hoà): "luật không có test thì 3 tuần là
 * có người vi phạm". Chạy: node_modules/.bin/sucrase-node lib/cad/idf-neutrality.test.ts
 *
 * Quét TĨNH (đọc source .ts như text, không parse AST đầy đủ — đủ dùng vì lib/cad/idf.ts +
 * lib/cad/model.ts đều là interface/type PHẲNG, không có interface lồng interface) 2 file định
 * dạng nguồn `.idf`: lib/cad/idf.ts (vỏ export/import/migrate) + lib/cad/model.ts (Doc/Entity/
 * Layer — nội dung thật bên trong mỗi sheet .idf). FAIL nếu bất kỳ property nào trong danh sách
 * khoá TRÌNH BÀY (fontSize/fontFamily/color/fill/stroke/x/y/left/top/margin/padding/zIndex/
 * opacity/align) xuất hiện làm field của 1 interface/type MÀ KHÔNG có trong EXEMPTIONS bên dưới.
 *
 * ⚠️ Ngoại lệ đã rà (12 field, 4 tên khoá, 6 interface) — TẤT CẢ đều là dữ liệu HÌNH HỌC/NGHỀ vẽ
 * kỹ thuật của CHÍNH bản vẽ (toạ độ world mm, màu layer theo quy ước AutoCAD ACI, độ mờ do người
 * dùng đặt khi vẽ hatch/zone/ảnh nền — tương đương chọn nét/bút, lưu 1 lần trong .idf), KHÔNG
 * phải "trông thế nào" do ATLAS/IF2/ArchiNote áp lên khi xuất — xem lý do chi tiết ở từng dòng
 * EXEMPTIONS. KHÔNG nới lỏng luật để chiều các field này — chỉ liệt kê có lý do, và bất kỳ khoá
 * TRÌNH BÀY nào KHÁC lọt vào (vd fontSize/fontFamily/left/top/margin/padding/zIndex/align, hoặc
 * color/opacity/x/y ở 1 interface MỚI chưa có trong danh sách) vẫn FAIL test này.
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

/** Khoá TRÌNH BÀY theo LUẬT TRUNG TÍNH — field ④ trong docs/IF-FEATURE-TREE.md PHẦN E. */
const FORBIDDEN_KEYS = [
  'fontSize',
  'fontFamily',
  'color',
  'fill',
  'stroke',
  'x',
  'y',
  'left',
  'top',
  'margin',
  'padding',
  'zIndex',
  'opacity',
  'align',
];

interface Hit {
  file: string;
  typeName: string;
  key: string;
  line: number;
  text: string;
}

interface Exemption {
  file: string;
  typeName: string;
  key: string;
  reason: string;
}

/** Quét 1 file .ts, tìm property khớp FORBIDDEN_KEYS bên trong body của `interface X {...}` hoặc
 * `type X = {...}` (theo dõi bằng đếm độ sâu ngoặc `{}` — đủ dùng cho style phẳng của model.ts/
 * idf.ts, không cần parser TS đầy đủ). Bỏ qua dòng comment (`//`, `*`, `/*`). */
function scanSource(file: string, src: string): Hit[] {
  const lines = src.split('\n');
  const hits: Hit[] = [];
  const openRe = /^(?:export\s+)?(?:interface|type)\s+(\w+)\b/;
  const propRe = new RegExp(`^\\s*(${FORBIDDEN_KEYS.join('|')})\\??\\s*:`);
  let depth = 0;
  const stack: { name: string; openDepth: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');

    const openMatch = !isComment ? openRe.exec(raw) : null;
    if (openMatch) {
      stack.push({ name: openMatch[1], openDepth: depth });
    }

    if (!isComment && stack.length) {
      const currentType = stack[stack.length - 1].name;
      const propMatch = propRe.exec(raw);
      if (propMatch) {
        hits.push({ file, typeName: currentType, key: propMatch[1], line: i + 1, text: trimmed });
      }
    }

    const opens = (raw.match(/\{/g) || []).length;
    const closes = (raw.match(/\}/g) || []).length;
    depth += opens - closes;
    while (stack.length && depth <= stack[stack.length - 1].openDepth) {
      stack.pop();
    }
  }
  return hits;
}

/** Danh sách miễn trừ CÓ LÝ DO — rà thủ công 30/07 khi viết test này. Field mới lọt vào (khoá nào
 * trong FORBIDDEN_KEYS, ở BẤT KỲ interface nào chưa liệt kê ở đây) vẫn FAIL, kể cả khi trùng khoá
 * với 1 exemption đã có nhưng khác interface. */
const EXEMPTIONS: Exemption[] = [
  {
    file: 'model.ts',
    typeName: 'Pt',
    key: 'x',
    reason:
      'Toạ độ THẾ GIỚI (mm) của 1 điểm hình học — chính là NỘI DUNG bản vẽ (vị trí tường/điểm), không phải cách trình bày theo đích xuất. model.ts dòng 4-5: trục X/Y world (chuẩn CAD), khác hẳn toạ độ pixel của UI đích.',
  },
  {
    file: 'model.ts',
    typeName: 'Pt',
    key: 'y',
    reason: 'Cùng lý do với Pt.x — toạ độ world mm, là dữ liệu hình học.',
  },
  {
    file: 'model.ts',
    typeName: 'Layer',
    key: 'color',
    reason:
      'Màu layer theo quy ước AutoCAD ACI (đứng cạnh lineweight/lineType cùng interface, cùng vai trò phân loại/plot-style) — ràng buộc NGHỀ vẽ kỹ thuật, không phải màu trang trí do ATLAS/IF2/ArchiNote áp lên khi xuất.',
  },
  {
    file: 'model.ts',
    typeName: 'Base',
    key: 'color',
    reason: 'Override màu layer per-entity (hiếm dùng) — cùng cơ chế/lý do với Layer.color ở trên.',
  },
  {
    file: 'model.ts',
    typeName: 'RectEntity',
    key: 'x',
    reason: 'Toạ độ góc hình chữ nhật (mm, world) — dữ liệu hình học entity, giống Pt.x.',
  },
  {
    file: 'model.ts',
    typeName: 'RectEntity',
    key: 'y',
    reason: 'Cùng lý do với RectEntity.x.',
  },
  {
    file: 'model.ts',
    typeName: 'HatchEntity',
    key: 'opacity',
    reason:
      'Độ mờ per-entity do người dùng đặt khi vẽ hatch (tương đương chọn nét/pattern) — lưu 1 lần trong .idf như thuộc tính nội dung của entity, không đổi theo đích xuất.',
  },
  {
    file: 'model.ts',
    typeName: 'ZoneEntity',
    key: 'opacity',
    reason: 'Cùng lý do với HatchEntity.opacity — độ mờ zone do người dùng đặt, là dữ liệu nội dung.',
  },
  {
    file: 'model.ts',
    typeName: 'MarkupPin',
    key: 'color',
    reason:
      'Màu ghim do KH/người dùng tự chọn khi ghi chú lên bản vẽ (như chọn màu bút highlight) — dữ liệu người dùng nhập vào nội dung, không phải style do đích xuất áp lên.',
  },
  {
    file: 'model.ts',
    typeName: 'SiteImage',
    key: 'x',
    reason: 'Vị trí góc dưới-trái ảnh nền theo world mm — dữ liệu hình học vị trí ảnh, giống Pt.x.',
  },
  {
    file: 'model.ts',
    typeName: 'SiteImage',
    key: 'y',
    reason: 'Cùng lý do với SiteImage.x.',
  },
  {
    file: 'model.ts',
    typeName: 'SiteImage',
    key: 'opacity',
    reason:
      'Độ mờ lớp ảnh nền do người dùng chỉnh khi đặt ảnh để vẽ đè lên (canh hiện trạng) — thuộc tính nội dung của lớp ảnh trong tài liệu, lưu 1 lần, không phải trình bày theo đích.',
  },
];

function isExempt(h: Hit): boolean {
  return EXEMPTIONS.some((e) => e.file === h.file && e.typeName === h.typeName && e.key === h.key);
}

/* ── 1) quét thật lib/cad/idf.ts + lib/cad/model.ts, đối chiếu EXEMPTIONS ── */
function testRealSchemaFiles() {
  console.log('\n[1] Quét thật idf.ts + model.ts — mọi khoá trình bày lọt vào phải nằm trong EXEMPTIONS có lý do');
  const files: { name: string; abs: string }[] = [
    { name: 'idf.ts', abs: path.join(__dirname, 'idf.ts') },
    { name: 'model.ts', abs: path.join(__dirname, 'model.ts') },
  ];

  const allHits: Hit[] = [];
  for (const f of files) {
    const src = fs.readFileSync(f.abs, 'utf8');
    allHits.push(...scanSource(f.name, src));
  }

  ok('quét ra ít nhất 1 field (sanity — nếu 0 field nghĩa là regex/tracker gãy, không phải schema sạch tuyệt đối)', allHits.length > 0);

  const violations = allHits.filter((h) => !isExempt(h));
  if (violations.length > 0) {
    for (const v of violations) {
      console.log(`  FAIL - ${v.file}:${v.line} [${v.typeName}] "${v.text}" — khoá "${v.key}" chưa có trong EXEMPTIONS`);
    }
  }
  ok(`0 field trình bày KHÔNG rõ lý do (thấy ${violations.length})`, violations.length === 0);

  ok('idf.ts (vỏ export/import) hoàn toàn sạch — không field trình bày nào, kể cả miễn trừ', allHits.filter((h) => h.file === 'idf.ts').length === 0);

  // Mọi exemption phải khớp ít nhất 1 hit thật — tránh exemption "chết" (field đã xoá khỏi code
  // nhưng quên xoá khỏi danh sách miễn trừ, khiến danh sách phình ra vô nghĩa theo thời gian).
  const staleExemptions = EXEMPTIONS.filter(
    (e) => !allHits.some((h) => h.file === e.file && h.typeName === e.typeName && h.key === e.key),
  );
  if (staleExemptions.length > 0) {
    for (const s of staleExemptions) console.log(`  FAIL - exemption chết (không còn khớp field nào): ${s.file} ${s.typeName}.${s.key}`);
  }
  ok(`0 exemption chết (thấy ${staleExemptions.length})`, staleExemptions.length === 0);
}

/* ── 2) meta-test: chứng minh scanner THẬT SỰ bắt được vi phạm — không phải test luôn xanh ── */
function testScannerCatchesRealViolation() {
  console.log('\n[2] Meta-test — chứng minh scanner bắt được field trình bày mới chưa miễn trừ (không phải test rỗng luôn pass)');

  const fakeSchemaWithViolation = `
export interface FakeDeckSlide {
  id: string;
  fontSize: number;
  fontFamily?: string;
  left: number;
  top: number;
}
`;
  const hits = scanSource('fake.ts', fakeSchemaWithViolation);
  ok('bắt đúng 4 field trình bày giả lập (fontSize/fontFamily/left/top)', hits.length === 4);
  const keys = hits.map((h) => h.key).sort().join(',');
  ok('đúng tên khoá bắt được', keys === 'fontFamily,fontSize,left,top');
  const violations = hits.filter((h) => !isExempt(h));
  ok('KHÔNG có exemption nào che giấu field giả lập này (đúng "chưa miễn trừ" phải FAIL)', violations.length === 4);

  const fakeSchemaClean = `
export interface FakeIdfEntity {
  id: string;
  layer: string;
  thicknessMm: number;
}
`;
  const cleanHits = scanSource('fake.ts', fakeSchemaClean);
  ok('schema sạch (không khoá trình bày nào) → 0 hit', cleanHits.length === 0);
}

testRealSchemaFiles();
testScannerCatchesRealViolation();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
