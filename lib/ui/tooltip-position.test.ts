/**
 * lib/ui/tooltip-position.test.ts — kiểm clampHorizontalOffset (chống tràn màn hình
 * cho tag của Tooltip dùng chung). Chạy:
 *   node_modules/.bin/sucrase-node lib/ui/tooltip-position.test.ts
 */
import { clampHorizontalOffset, pickHorizontalSide } from './tooltip-position';

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

console.log('\n[5] pickHorizontalSide — nút trong lưới hẹp (LỖI 4, Command3DPanel)');
{
  // nút Tường ở CỘT ĐẦU lưới 3 cột trong panel 256px — đủ chỗ bên phải → 'right'
  ok('đủ chỗ bên phải → right', pickHorizontalSide(20, 90, 150, 1400) === 'right');
  // nút ở SÁT MÉP PHẢI viewport hẹp — không đủ chỗ → lật 'left'
  ok('sát mép phải viewport → lật left', pickHorizontalSide(900, 980, 150, 1000) === 'left');
  // đúng ngưỡng: anchorRight=100, tagWidth=50, margin=gap=8 mặc định → cần viewport ≥ 166
  ok('viewport=166 (đúng đủ) → right', pickHorizontalSide(50, 100, 50, 166) === 'right');
  ok('viewport=165 (thiếu 1px) → lật left', pickHorizontalSide(50, 100, 50, 165) === 'left');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
