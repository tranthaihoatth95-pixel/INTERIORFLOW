/**
 * lib/nodes/mask-ops.test.ts — xử lý mask cho Smart Select (đảo vùng, nới/co biên).
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/mask-ops.test.ts
 */
import {
  rgbaToAlphaMask,
  invertMask,
  growMask,
  unionMask,
  subtractMask,
  maskCoverage,
  alphaMaskToRgba,
} from './mask-ops';

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

/** grid 5×5, bật 1 pixel giữa. */
const W = 5;
const H = 5;
function center(): Uint8Array {
  const m = new Uint8Array(W * H);
  m[2 * W + 2] = 255;
  return m;
}

console.log('rgbaToAlphaMask');
{
  // có kênh alpha (SAM trả PNG nền trong suốt) → dùng alpha
  const rgba = new Uint8Array([0, 0, 0, 255, 0, 0, 0, 0]);
  const m = rgbaToAlphaMask(rgba);
  ok('dùng alpha khi ảnh có vùng trong suốt', m[0] === 255 && m[1] === 0);
}
{
  // ảnh đục hoàn toàn (mask trắng/đen) → dùng độ sáng
  const rgba = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 255]);
  const m = rgbaToAlphaMask(rgba);
  ok('ảnh đục → theo độ sáng', m[0] === 255 && m[1] === 0);
}

console.log('invertMask');
{
  const m = invertMask(center());
  ok('pixel giữa tắt', m[2 * W + 2] === 0);
  ok('pixel khác bật', m[0] === 255);
  ok('đảo 2 lần = ban đầu', invertMask(m)[2 * W + 2] === 255);
}

console.log('growMask (nới/co biên)');
{
  const base = center();
  ok('radius 0 giữ nguyên', maskCoverage(growMask(base, W, H, 0)) === maskCoverage(base));
  const d1 = growMask(base, W, H, 1);
  // Chebyshev r=1 quanh 1 pixel → khối 3×3 = 9 pixel
  ok('nới 1px → 3×3 = 9 pixel', Math.round(maskCoverage(d1) * W * H) === 9);
  const e1 = growMask(d1, W, H, -1);
  ok('co lại 1px → về 1 pixel', Math.round(maskCoverage(e1) * W * H) === 1);
  ok('co quá → mask trống, không crash', maskCoverage(growMask(base, W, H, -3)) === 0);
}
{
  // mask không "chảy" ra ngoài khung: pixel ở góc, nới 1px → 2×2 = 4
  const corner = new Uint8Array(W * H);
  corner[0] = 255;
  ok('nới ở góc bị chặn bởi biên ảnh', Math.round(maskCoverage(growMask(corner, W, H, 1)) * W * H) === 4);
}

console.log('union / subtract (brush tinh chỉnh)');
{
  const a = center();
  const b = new Uint8Array(W * H);
  b[0] = 255;
  ok('union gộp 2 vùng', maskCoverage(unionMask(a, b)) === 2 / (W * H));
  ok('subtract trừ đúng', maskCoverage(subtractMask(unionMask(a, b), b)) === 1 / (W * H));
}

console.log('alphaMaskToRgba (xuất PNG trắng/đen)');
{
  const rgba = alphaMaskToRgba(center());
  const p = (2 * W + 2) * 4;
  ok('vùng chọn = trắng đục', rgba[p] === 255 && rgba[p + 3] === 255);
  ok('ngoài vùng = đen đục', rgba[0] === 0 && rgba[3] === 255);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
