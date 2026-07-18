/**
 * lib/photo-editor/hotkeys.test.ts — kiểm ánh xạ phím tắt (PS-7). Chạy:
 *   node_modules/.bin/sucrase-node lib/photo-editor/hotkeys.test.ts
 */
import { toolForHotkey, nextBrushSize, TOOL_HOTKEYS, BRUSH_SIZE_MIN, BRUSH_SIZE_MAX } from './hotkeys';

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

function testToolForHotkey() {
  console.log('\n[1] toolForHotkey — tra cứu tool theo phím chữ');
  ok('v → move', toolForHotkey('v') === 'move');
  ok('b → brush', toolForHotkey('b') === 'brush');
  ok('e → eraser', toolForHotkey('e') === 'eraser');
  ok('s → clone (Stamp)', toolForHotkey('s') === 'clone');
  ok('j → heal', toolForHotkey('j') === 'heal');
  ok('m → marquee', toolForHotkey('m') === 'marquee');
  ok('l → lasso', toolForHotkey('l') === 'lasso');
  ok('không phân biệt hoa/thường: V → move', toolForHotkey('V') === 'move');
  ok('không phân biệt hoa/thường: B → brush', toolForHotkey('B') === 'brush');
  ok('phím không map → undefined', toolForHotkey('q') === undefined);
  ok('phím không map (mask không có hotkey riêng) → undefined', toolForHotkey('k') === undefined);
  ok('chuỗi rỗng → undefined', toolForHotkey('') === undefined);
  ok('mọi giá trị trong TOOL_HOTKEYS đều tra được qua toolForHotkey', Object.entries(TOOL_HOTKEYS).every(([k, t]) => toolForHotkey(k) === t));
}

function testNextBrushSize() {
  console.log('\n[2] nextBrushSize — cỡ cọ khi bấm [ / ]');
  ok('] tăng cỡ cọ', nextBrushSize(40, 1) > 40);
  ok('[ giảm cỡ cọ', nextBrushSize(40, -1) < 40);
  ok('bước tỉ lệ theo cỡ: cọ lớn tăng nhiều hơn cọ nhỏ', nextBrushSize(200, 1) - 200 > nextBrushSize(20, 1) - 20);
  ok('không vượt quá BRUSH_SIZE_MAX', nextBrushSize(BRUSH_SIZE_MAX, 1) === BRUSH_SIZE_MAX);
  ok('không dưới BRUSH_SIZE_MIN', nextBrushSize(BRUSH_SIZE_MIN, -1) === BRUSH_SIZE_MIN);
  ok('cỡ rất nhỏ vẫn giảm được ít nhất 1px (kẹp ở min)', nextBrushSize(2, -1) >= BRUSH_SIZE_MIN);
  ok('cỡ 1 bấm [ vẫn ở min (không âm)', nextBrushSize(1, -1) === BRUSH_SIZE_MIN);
  ok('không NaN/âm ở biên dưới', nextBrushSize(0, -1) === BRUSH_SIZE_MIN);
}

testToolForHotkey();
testNextBrushSize();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
