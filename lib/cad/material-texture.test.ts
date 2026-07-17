/**
 * lib/cad/material-texture.test.ts — kiểm thử phần THUẦN của sinh hoạ tiết vật liệu procedural
 * (E1.2). Chỉ test generateTexturePixels + tiện ích (mulberry32/seedFromId/hexToRgb) — KHÔNG đụng
 * DOM (materialTextureDataUrl cần <canvas>, không test được ở đây). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/material-texture.test.ts
 */
import { generateTexturePixels, mulberry32, seedFromId, hexToRgb } from './material-texture';
import { MATERIALS } from './materials';
import type { MaterialDef } from './materials';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** Độ sáng trung bình (luminance) của 1 buffer RGBA. */
function avgLum(buf: Uint8ClampedArray): number {
  let s = 0;
  const n = buf.length / 4;
  for (let i = 0; i < buf.length; i += 4) s += 0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2];
  return s / n;
}

/** Tỉ lệ pixel khác nhau giữa 2 buffer cùng kích thước (RGB, bỏ alpha). */
function diffRatio(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let d = 0;
  const n = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) d += 1;
  }
  return d / n;
}

/** Số màu RGB phân biệt (lượng hoá thô về bước 8) — đo "độ có hoạ tiết". */
function distinctColors(buf: Uint8ClampedArray): number {
  const set = new Set<number>();
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i] >> 3, g = buf[i + 1] >> 3, b = buf[i + 2] >> 3;
    set.add((r << 10) | (g << 5) | b);
  }
  return set.size;
}

const byId = (id: string): MaterialDef => {
  const m = MATERIALS.find((x) => x.id === id);
  if (!m) throw new Error('không thấy material ' + id);
  return m;
};

function testUtils() {
  console.log('\n[1] tiện ích thuần');
  ok('hexToRgb #ffffff = [255,255,255]', JSON.stringify(hexToRgb('#ffffff')) === '[255,255,255]');
  ok('hexToRgb #000 (3 ký tự) = [0,0,0]', JSON.stringify(hexToRgb('#000')) === '[0,0,0]');
  ok('hexToRgb #8a3b2e đúng', JSON.stringify(hexToRgb('#8a3b2e')) === '[138,59,46]');
  ok('hexToRgb lỗi → xám trung tính', JSON.stringify(hexToRgb('xyz')) === '[128,128,128]');
  const r1 = mulberry32(123);
  const r2 = mulberry32(123);
  ok('mulberry32 tất định (cùng seed → cùng chuỗi)', r1() === r2() && r1() === r2());
  const r3 = mulberry32(123);
  const r4 = mulberry32(124);
  ok('mulberry32 seed khác → chuỗi khác', r3() !== r4());
  let inRange = true;
  const r5 = mulberry32(999);
  for (let i = 0; i < 500; i++) { const v = r5(); if (v < 0 || v >= 1) inRange = false; }
  ok('mulberry32 luôn trong [0,1)', inRange);
  ok('seedFromId khác nhau cho id khác nhau', seedFromId('san-go-soi') !== seedFromId('san-go-oc-cho'));
  ok('seedFromId ổn định', seedFromId('abc') === seedFromId('abc'));
}

function testBufferShape() {
  console.log('\n[2] hình dạng buffer & biên giá trị');
  const size = 64;
  const buf = generateTexturePixels(byId('san-go-soi'), size);
  ok('độ dài = size*size*4', buf.length === size * size * 4);
  ok('là Uint8ClampedArray', buf instanceof Uint8ClampedArray);
  let alphaOpaque = true;
  let rangeOk = true;
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i + 3] !== 255) alphaOpaque = false;
    for (let k = 0; k < 3; k++) { const v = buf[i + k]; if (v < 0 || v > 255) rangeOk = false; }
  }
  ok('mọi pixel alpha = 255 (đục)', alphaOpaque);
  ok('mọi kênh RGB trong 0..255', rangeOk);
}

function testDeterministic() {
  console.log('\n[3] tất định — cùng material → cùng buffer');
  for (const id of ['san-go-oc-cho', 'da-marble-trang', 'gach-terrazzo']) {
    const a = generateTexturePixels(byId(id), 48);
    const b = generateTexturePixels(byId(id), 48);
    let same = a.length === b.length;
    for (let i = 0; same && i < a.length; i++) if (a[i] !== b[i]) same = false;
    ok(`${id}: 2 lần sinh giống hệt`, same);
  }
}

function testDistinct() {
  console.log('\n[4] material khác nhau → hoạ tiết khác nhau rõ');
  const oc = generateTexturePixels(byId('san-go-oc-cho'), 64);
  const soi = generateTexturePixels(byId('san-go-soi'), 64);
  ok('gỗ óc chó vs gỗ sồi khác > 80% pixel (không chỉ đổi màu)', diffRatio(oc, soi) > 0.8);
  const marble = generateTexturePixels(byId('da-marble-trang'), 64);
  const granite = generateTexturePixels(byId('da-granite-den'), 64);
  ok('marble vs granite khác > 90% pixel', diffRatio(marble, granite) > 0.9);
  // mọi cặp preset đều cho buffer khác nhau
  let allPairsDiffer = true;
  const bufs = MATERIALS.map((m) => generateTexturePixels(m, 32));
  for (let i = 0; i < bufs.length; i++) {
    for (let j = i + 1; j < bufs.length; j++) {
      if (diffRatio(bufs[i], bufs[j]) < 0.05) { allPairsDiffer = false; }
    }
  }
  ok('mọi cặp trong 13 preset đều phân biệt được', allPairsDiffer);
}

function testTexturedNotFlat() {
  console.log('\n[5] có hoạ tiết thật (không phải ô màu phẳng)');
  // vật liệu có vân/đốm phải có nhiều màu phân biệt, không như 1 ô phẳng (~1-2 màu)
  for (const id of ['san-go-oc-cho', 'da-marble-trang', 'da-granite-den', 'gach-terrazzo', 'gach-bong', 'da-travertine']) {
    const n = distinctColors(generateTexturePixels(byId(id), 64));
    ok(`${id}: >= 12 sắc độ phân biệt (n=${n})`, n >= 12);
  }
  // sơn đặc: chấp nhận phẳng hơn, nhưng vignette + nhiễu vẫn cho > 3 sắc độ (không hoàn toàn trơ)
  const solidN = distinctColors(generateTexturePixels(byId('son-xam-am'), 64));
  ok(`sơn xám: có vignette/nhiễu nhẹ (> 3 sắc độ, n=${solidN})`, solidN > 3);
}

function testLuminanceOrder() {
  console.log('\n[6] độ sáng khớp trực giác vật liệu');
  const white = avgLum(generateTexturePixels(byId('son-trang'), 64));
  const blackGranite = avgLum(generateTexturePixels(byId('da-granite-den'), 64));
  ok('sơn trắng sáng hơn granite đen', white > blackGranite);
  ok('granite đen thực sự tối (< 90)', blackGranite < 90);
  ok('sơn trắng thực sự sáng (> 200)', white > 200);
  const ocCho = avgLum(generateTexturePixels(byId('san-go-oc-cho'), 64));
  const soi = avgLum(generateTexturePixels(byId('san-go-soi'), 64));
  ok('gỗ sồi sáng hơn gỗ óc chó', soi > ocCho);
}

testUtils();
testBufferShape();
testDeterministic();
testDistinct();
testTexturedNotFlat();
testLuminanceOrder();

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
