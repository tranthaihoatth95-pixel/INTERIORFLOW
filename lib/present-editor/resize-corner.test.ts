/**
 * lib/present-editor/resize-corner.test.ts — chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/resize-corner.test.ts
 */
import { shouldKeepRatio, resizeCornerKeepRatio, type ResizableFrame } from './resize-corner';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
};
const approx = (a: number, b: number, eps = 0.001) => Math.abs(a - b) <= eps;

console.log('\n[1] shouldKeepRatio — ẢNH đảo ngược so với text/shape (P2, 01/08)');
ok('ảnh, KHÔNG giữ Shift → GIỮ tỉ lệ (mặc định an toàn)', shouldKeepRatio('image', false) === true);
ok('ảnh, CÓ giữ Shift → BẺ tỉ lệ (đảo ngược)', shouldKeepRatio('image', true) === false);
ok('text, KHÔNG giữ Shift → tự do (hành vi cũ)', shouldKeepRatio('text', false) === false);
ok('text, CÓ giữ Shift → GIỮ tỉ lệ (hành vi cũ)', shouldKeepRatio('text', true) === true);
ok('shape, KHÔNG giữ Shift → tự do (hành vi cũ)', shouldKeepRatio('shape', false) === false);
ok('shape, CÓ giữ Shift → GIỮ tỉ lệ (hành vi cũ)', shouldKeepRatio('shape', true) === true);

console.log('\n[2] resizeCornerKeepRatio — toán giữ tỉ lệ theo từng góc');
const square: ResizableFrame = { x: 10, y: 10, w: 40, h: 20 }; // tỉ lệ 2:1

const se = resizeCornerKeepRatio(square, 'se', 10); // kéo góc se ra +10 theo x
ok('góc se: w tăng đúng delta (40+10=50)', approx(se.w, 50));
ok('góc se: h suy theo tỉ lệ 2:1 (50/2=25)', approx(se.h, 25));
ok('góc se: x/y KHÔNG đổi (góc neo là nw)', approx(se.x, 10) && approx(se.y, 10));

const nw = resizeCornerKeepRatio(square, 'nw', -10); // kéo góc nw ra ngoài (-dx thực chất +w)
ok('góc nw: w tăng đúng (dấu w đảo, dx=-10 → dw=+10 → w=50)', approx(nw.w, 50));
ok('góc nw: h suy theo tỉ lệ (25)', approx(nw.h, 25));
ok('góc nw: x lùi đúng lượng w tăng (10-(50-40)=0)', approx(nw.x, 0));
ok('góc nw: y lùi đúng lượng h tăng (10-(25-20)=5)', approx(nw.y, 5));

const ne = resizeCornerKeepRatio(square, 'ne', 10);
ok('góc ne: w tăng (50)', approx(ne.w, 50));
ok('góc ne: x KHÔNG đổi (không includes w)', approx(ne.x, 10));
ok('góc ne: y lùi (n → co theo h tăng)', approx(ne.y, 10 - (25 - 20)));

ok('w không bao giờ âm/0 — kẹp tối thiểu 3', resizeCornerKeepRatio(square, 'se', -1000).w === 3);
// w kẹp về 3 → w/ratio = 3/2 = 1.5 < 3 → h TỰ NÓ cũng chạm sàn riêng, kẹp về 3 (không phải 1.5).
ok('h cũng có sàn riêng 3 (không suy ra 1.5 dưới sàn)', resizeCornerKeepRatio(square, 'se', -1000).h === 3);

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
