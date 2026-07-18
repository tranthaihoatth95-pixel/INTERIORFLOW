/**
 * lib/ui/tooltip-position.test.ts — kiểm clampHorizontalOffset (chống tràn màn hình
 * cho tag của Tooltip dùng chung). Chạy:
 *   node_modules/.bin/sucrase-node lib/ui/tooltip-position.test.ts
 */
import { clampHorizontalOffset } from './tooltip-position';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] Icon giữa màn hình — không cần lệch');
ok('centerX=500 giữa viewport 1000, tag rộng 80 → offset 0', clampHorizontalOffset(500, 40, 1000) === 0);

console.log('\n[2] Icon sát mép TRÁI — tag phải đẩy sang phải');
{
  // centerX=10, halfWidth=40 → left = -30, cần offset để left >= margin(8) → offset = 8-(-30) = 38
  const off = clampHorizontalOffset(10, 40, 1000, 8);
  ok('offset dương (đẩy phải)', off === 38);
  ok('sau khi cộng offset, mép trái >= margin', 10 - 40 + off >= 8);
}

console.log('\n[3] Icon sát mép PHẢI — tag phải đẩy sang trái');
{
  // viewport 1000, centerX=990, halfWidth=40 → right=1030, cần right <= 992 → offset = 992-1030 = -38
  const off = clampHorizontalOffset(990, 40, 1000, 8);
  ok('offset âm (đẩy trái)', off === -38);
  ok('sau khi cộng offset, mép phải <= viewport-margin', 990 + 40 + off <= 1000 - 8);
}

console.log('\n[4] margin tuỳ chỉnh + tag rất rộng vẫn không NaN/Infinity');
{
  const off = clampHorizontalOffset(5, 200, 400, 4);
  ok('số hữu hạn', Number.isFinite(off));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
