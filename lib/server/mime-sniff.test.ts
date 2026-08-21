/**
 * lib/server/mime-sniff.test.ts — kiểm nhận diện magic bytes (vá R3, `docs/AUDIT-BACKEND-2026-08-03.md`
 * §6.2). Chạy: node_modules/.bin/sucrase-node lib/server/mime-sniff.test.ts
 */
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from './mime-sniff';

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

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const GIF89 = Buffer.concat([Buffer.from('GIF89a', 'ascii'), Buffer.from([0, 0, 0, 0])]);
const GIF87 = Buffer.concat([Buffer.from('GIF87a', 'ascii'), Buffer.from([0, 0, 0, 0])]);
const WEBP = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP', 'ascii'), Buffer.from([0, 0])]);
const PDF = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj', 'utf8');
const AVIF = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif', 'ascii'), Buffer.from([0, 0, 0, 0])]);

console.log('sniffKind — đúng định dạng thật theo byte đầu (không tin nhãn client)');
{
  ok('PNG', sniffKind(PNG) === 'png');
  ok('JPEG', sniffKind(JPEG) === 'jpeg');
  ok('GIF89a', sniffKind(GIF89) === 'gif');
  ok('GIF87a', sniffKind(GIF87) === 'gif');
  ok('WEBP', sniffKind(WEBP) === 'webp');
  ok('PDF', sniffKind(PDF) === 'pdf');
  ok('AVIF', sniffKind(AVIF) === 'avif');
}

console.log('sniffKind — chặn HTML/SVG/JS giả trang ảnh (đúng kịch bản tấn công §6.2)');
{
  const html = Buffer.from('<html><body><script>fetch("/api/specs/x",{method:"DELETE"})</script></body></html>', 'utf8');
  ok('HTML thô → null (không khớp gì)', sniffKind(html) === null);

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>', 'utf8');
  ok('SVG chứa <script> → null (không có trong whitelist)', sniffKind(svg) === null);

  // Kịch bản CHÍNH audit mô tả: dataUrl khai "image/png" nhưng payload thật là HTML.
  const fakePngDataUrl = `data:image/png;base64,${html.toString('base64')}`;
  const match = /^data:([^;]+);base64,(.+)$/.exec(fakePngDataUrl)!;
  const decoded = Buffer.from(match[2], 'base64');
  ok('dataUrl khai image/png nhưng byte thật là HTML → sniff ra null, KHÔNG tin nhãn "image/png"', sniffKind(decoded) === null);

  ok('chuỗi rỗng/ngắn → null, không throw', sniffKind(Buffer.from([])) === null);
  ok('JS thuần (không phải file nhị phân nào) → null', sniffKind(Buffer.from('alert(1)', 'utf8')) === null);
}

console.log('isRasterImageKind — PDF KHÔNG tính là ảnh (để quyết định inline vs attachment)');
{
  ok('png → true', isRasterImageKind('png') === true);
  ok('avif → true', isRasterImageKind('avif') === true);
  ok('pdf → false (không phải ảnh raster)', isRasterImageKind('pdf') === false);
  ok('null → false', isRasterImageKind(null) === false);
}

console.log('SNIFFED_MIME — map đủ mọi SniffedKind sang MIME chuẩn');
{
  ok('png → image/png', SNIFFED_MIME.png === 'image/png');
  ok('jpeg → image/jpeg', SNIFFED_MIME.jpeg === 'image/jpeg');
  ok('gif → image/gif', SNIFFED_MIME.gif === 'image/gif');
  ok('webp → image/webp', SNIFFED_MIME.webp === 'image/webp');
  ok('avif → image/avif', SNIFFED_MIME.avif === 'image/avif');
  ok('pdf → application/pdf', SNIFFED_MIME.pdf === 'application/pdf');
}


/* ── .idfp — hồ sơ trình bày của chính IF (21/08) ─────────────────────────────────────────
   Nhận vào whitelist để deck có bản sao BỀN trên máy chủ. Điều kiện chặt hơn magic-bytes:
   phải parse được VÀ mang đúng chữ ký tài liệu. Bốn ca dưới khoá đúng ranh giới đó. */
const idfpThat = Buffer.from(JSON.stringify({ idfpVersion: 1, sheets: [{ id: 's1', name: 'A', deck: {} }] }), 'utf8');
ok('.idfp thật → application/json', sniffKind(idfpThat) === 'idfp' && SNIFFED_MIME.idfp === 'application/json');
ok('JSON thường (không chữ ký idfp) → null', sniffKind(Buffer.from('{"a":1}', 'utf8')) === null);
ok('HTML núp bóng JSON → null', sniffKind(Buffer.from('<html><script>alert(1)</script></html>', 'utf8')) === null);
ok(
  'JSON có idfpVersion nhưng sheets KHÔNG phải mảng → null',
  sniffKind(Buffer.from('{"idfpVersion":1,"sheets":"x"}', 'utf8')) === null,
);


const idfThat = Buffer.from(JSON.stringify({ idfVersion: 2, sheets: [{ id: 'cadsheet-0', name: 'Bản vẽ 1' }] }), 'utf8');
ok('.idf (bản vẽ 2D) → application/json', sniffKind(idfThat) === 'idfp');
ok('JSON có sheets nhưng KHÔNG chữ ký IF → null', sniffKind(Buffer.from('{"sheets":[]}', 'utf8')) === null);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
