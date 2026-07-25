/**
 * lib/nodes/defs/pattern-flatten.test.ts — bước "dẹt thành stencil" (bảo đảm Pattern phẳng
 * PHẲNG THẬT dù model trả ảnh có khối/bóng).
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/defs/pattern-flatten.test.ts
 */
import { parseHex, stencilPalette, flattenToStencil, distinctColors, DEFAULT_STENCIL } from './pattern-flatten';

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

console.log('parseHex');
ok('#RRGGBB', String(parseHex('#C9BCA8')) === '201,188,168');
ok('không có #', String(parseHex('6B4A2F')) === '107,74,47');
ok('dạng 3 ký tự', String(parseHex('#ccc') ) === '204,204,204');
ok('rác → null', parseHex('xanh nhạt') === null);
ok('rỗng → null', parseHex('') === null);

console.log('stencilPalette');
{
  const pal = stencilPalette(['#6B4A2F', '#C9BCA8']);
  ok('sắp sáng → tối', pal[0][0] > pal[1][0]);
  ok('2 màu người dùng được dùng', pal.length === 2);
  ok('thiếu màu → palette mặc định', stencilPalette([''])[0][0] === DEFAULT_STENCIL[0][0]);
  ok('1 màu cũng dùng mặc định (cần ≥2)', stencilPalette(['#111']).length === DEFAULT_STENCIL.length);
}

console.log('flattenToStencil — kết quả phải PHẲNG THẬT');
{
  // ảnh gradient 256 mức xám = mô phỏng phù điêu có bóng
  const px = 256;
  const rgba = new Uint8Array(px * 4);
  for (let i = 0; i < px; i++) {
    rgba[i * 4] = i;
    rgba[i * 4 + 1] = i;
    rgba[i * 4 + 2] = i;
    rgba[i * 4 + 3] = 255;
  }
  ok('ảnh gốc có nhiều màu (còn bóng)', distinctColors(rgba) > 200);

  const pal2 = stencilPalette(['#C9BCA8', '#6B4A2F']);
  const flat2 = flattenToStencil(rgba, pal2);
  ok('sau khi dẹt chỉ còn ĐÚNG 2 màu', distinctColors(flat2) === 2);
  ok('pixel sáng nhất → màu sáng', flat2[255 * 4] === pal2[0][0]);
  ok('pixel tối nhất → màu tối', flat2[0] === pal2[1][0]);
  ok('alpha luôn đục', flat2[3] === 255 && flat2[255 * 4 + 3] === 255);

  const flat3 = flattenToStencil(rgba, [
    [240, 240, 240],
    [150, 140, 130],
    [60, 50, 40],
  ]);
  ok('3 mức → đúng 3 màu', distinctColors(flat3) === 3);
  ok('không sửa buffer gốc', distinctColors(rgba) > 200);
}
{
  // ảnh tone-on-tone: dải sáng rất hẹp (200–210). Nếu chia cứng 0–255 sẽ ra 1 màu → mất hoa văn.
  const px = 64;
  const rgba = new Uint8Array(px * 4);
  for (let i = 0; i < px; i++) {
    const v = 200 + (i % 11);
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }
  const flat = flattenToStencil(rgba, stencilPalette(['#C9BCA8', '#6B4A2F']));
  ok('tone-on-tone vẫn tách được 2 mảng (căn theo min/max thật)', distinctColors(flat) === 2);
}
{
  // ảnh 1 màu duy nhất: không được crash / chia 0
  const rgba = new Uint8Array([120, 120, 120, 255, 120, 120, 120, 255]);
  const flat = flattenToStencil(rgba, stencilPalette([]));
  ok('ảnh phẳng tuyệt đối → không crash', flat.length === rgba.length && distinctColors(flat) === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
