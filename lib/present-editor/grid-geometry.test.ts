/**
 * lib/present-editor/grid-geometry.test.ts — kiểm gutter width + pattern/icon (PHA 1 Gu Engine).
 *   node_modules/.bin/sucrase-node lib/present-editor/grid-geometry.test.ts
 */
import { gutterBands, dominantGutter, patternIconHint } from './grid-geometry';
import { findGaps } from './detect-regions';
import type { RegionCell } from './detect-regions';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** profile: hai khối cao ngăn bởi 1 khe rộng ở giữa + lề trái/phải trắng. */
function twoBlockProfile(): number[] {
  const p: number[] = [];
  for (let i = 0; i < 100; i++) {
    // lề 0..9 trắng; khối 10..39 cao; khe 40..59 trũng; khối 60..89 cao; lề 90..99 trắng
    if (i < 10) p.push(0);
    else if (i < 40) p.push(10);
    else if (i < 60) p.push(0);
    else if (i < 90) p.push(10);
    else p.push(0);
  }
  return p;
}

function testGutterMatchesFindGaps() {
  console.log('\n[1] gutterBands center KHỚP findGaps (không lệch di trú)');
  const p = twoBlockProfile();
  const centers = findGaps(p, 6);
  const bands = gutterBands(p, 6);
  ok('cùng số khe', centers.length === bands.length);
  ok('center trùng khớp', bands.every((b, i) => Math.abs(b.center - centers[i]) < 1e-9));
  ok('có trả width', bands.every((b) => b.width > 0));
}

function testGutterWidth() {
  console.log('\n[2] gutterBands — bề rộng khe đúng');
  const p = twoBlockProfile();
  const bands = gutterBands(p, 6);
  // 3 khe: lề trái (~10), khe giữa (~20), lề phải (~10)
  ok('phát hiện 3 khe (2 lề + 1 giữa)', bands.length === 3);
  const mid = bands.find((b) => b.center > 40 && b.center < 60);
  ok('khe giữa rộng ~20', !!mid && Math.abs(mid!.width - 20) <= 1);
}

function testDominantGutter() {
  console.log('\n[3] dominantGutter — bỏ lề, lấy median khe trong');
  const p = twoBlockProfile();
  const bands = gutterBands(p, 6);
  const g = dominantGutter(bands, p.length);
  ok('gutter đại diện ~20 (chỉ khe giữa, bỏ 2 lề)', Math.abs(g - 20) <= 1);
  ok('profile phẳng → gutter 0', dominantGutter(gutterBands(new Array(50).fill(0), 6), 50) === 0);
}

function testEmptyProfile() {
  console.log('\n[4] biên — profile rỗng/phẳng');
  ok('toàn 0 → không khe', gutterBands([0, 0, 0, 0, 0, 0, 0, 0], 6).length === 0);
  ok('không đạt minGap → không khe', gutterBands([10, 0, 0, 10, 10], 6).length === 0);
}

function testPatternIconGrid() {
  console.log('\n[5] patternIconHint — lưới nhiều ô nhỏ đều → icon set');
  // 9 ô nhỏ đều (mỗi ô ~9%²)
  const cells: RegionCell[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push({ x: c * 33, y: r * 33, w: 30, h: 30 });
  const hint = patternIconHint(cells);
  ok('suggestIconSet = true', hint.suggestIconSet);
  ok('smallCellRatio cao', hint.smallCellRatio >= 0.9);
  ok('không gợi khối màu (không ô lớn)', !hint.suggestColorBlock);
}

function testPatternColorBlock() {
  console.log('\n[6] patternIconHint — 1 ô hero lớn → khối màu nền');
  const cells: RegionCell[] = [
    { x: 0, y: 0, w: 100, h: 60 }, // ô lớn 60%²
    { x: 0, y: 65, w: 40, h: 20 },
  ];
  const hint = patternIconHint(cells);
  ok('suggestColorBlock = true', hint.suggestColorBlock);
  ok('largestCellAreaPct ~60', Math.abs(hint.largestCellAreaPct - 60) < 1);
  ok('không gợi icon set', !hint.suggestIconSet);
}

function testPatternNeutral() {
  console.log('\n[7] patternIconHint — biên & trung tính');
  const empty = patternIconHint([]);
  ok('rỗng → cả hai false', !empty.suggestIconSet && !empty.suggestColorBlock);
  // 2 ô trung bình, không nhỏ-đều cũng không hero
  const neutral = patternIconHint([{ x: 0, y: 0, w: 45, h: 40 }, { x: 50, y: 0, w: 45, h: 40 }]);
  ok('trung tính → không ép pattern', !neutral.suggestIconSet && !neutral.suggestColorBlock);
}

testGutterMatchesFindGaps();
testGutterWidth();
testDominantGutter();
testEmptyProfile();
testPatternIconGrid();
testPatternColorBlock();
testPatternNeutral();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
