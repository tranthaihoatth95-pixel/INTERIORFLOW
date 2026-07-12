/**
 * lib/present-editor/suggest.test.ts — kiểm suggestTemplate sau HOOK ML pha 1 (nhận grid
 * geometry từ detectRegions). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/suggest.test.ts
 */
import { suggestTemplate } from './suggest';
import type { RegionCell } from './detect-regions';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** lưới n×m ô đều (toạ độ % sân khấu) — giả lập detectRegions.cells. */
function evenGrid(nCols: number, nRows: number): RegionCell[] {
  const cells: RegionCell[] = [];
  const w = 100 / nCols;
  const h = 100 / nRows;
  for (let r = 0; r < nRows; r++) for (let c = 0; c < nCols; c++) cells.push({ x: c * w, y: r * h, w, h });
  return cells;
}

function testOldBehaviorUnchanged() {
  console.log('\n[1] KHÔNG truyền grid → heuristic cũ nguyên vẹn');
  ok('3 ảnh → grid', suggestTemplate({ images: ['a', 'b', 'c'] }).templateId === 'grid');
  ok('1 ảnh + ít chữ → full-bleed', suggestTemplate({ images: ['a'], title: 'Hi' }).templateId === 'full-bleed');
  ok('0 ảnh chữ ngắn → quote', suggestTemplate({ title: 'Ánh sáng là vật liệu.' }).templateId === 'quote');
  ok('0 ảnh nhiều bullet → two-column', suggestTemplate({ title: 'T', body: ['1', '2', '3', '4'] }).templateId === 'two-column');
  ok('grid: null cũng là hành vi cũ', suggestTemplate({ images: ['a'], title: 'Hi', grid: null }).templateId === 'full-bleed');
}

function testIconSetGrid() {
  console.log('\n[2] Ảnh mẫu lưới nhiều ô nhỏ đều → gợi grid (kể cả 2 ảnh — dưới ngưỡng cũ 3)');
  const cells = evenGrid(4, 3); // 12 ô đều ~8.3%×33% → nhỏ + đều
  const s = suggestTemplate({ images: ['a', 'b'], title: 'Vật liệu', body: ['đá', 'gỗ'], grid: { cells, gutterXPct: 3, gutterYPct: 4 } });
  ok('templateId = grid', s.templateId === 'grid');
  ok('reason nhắc lưới ảnh mẫu + gutter (explainable)', /lưới|ô nhỏ/.test(s.reason) && s.reason.includes('gutter'));
  // cùng nội dung KHÔNG grid → không phải grid (chứng minh hint là nguồn quyết định)
  ok('không grid → khác kết quả', suggestTemplate({ images: ['a', 'b'], title: 'Vật liệu', body: ['đá', 'gỗ'] }).templateId !== 'grid');
}

function testColorBlockFullBleed() {
  console.log('\n[3] Ảnh mẫu có khối lớn chiếm ưu thế → full-bleed');
  const cells: RegionCell[] = [
    { x: 0, y: 0, w: 100, h: 70 }, // khối 70% sân khấu
    { x: 0, y: 70, w: 50, h: 30 },
    { x: 50, y: 70, w: 50, h: 30 },
  ];
  const s = suggestTemplate({ images: ['a'], title: 'Không gian mở', body: ['Một ý'], grid: { cells } });
  ok('templateId = full-bleed', s.templateId === 'full-bleed');
  ok('reason giải thích khối lớn', /khối lớn/.test(s.reason));
}

function testNeutralGridFallsThrough() {
  console.log('\n[4] Lưới trung tính (không hint) → rơi xuống luật cũ');
  // lưới 3 cột 1 hàng: ô 33×100 → 33% < 45% (không khối lớn) và chỉ 3 ô (<6, không icon-set)
  const neutral = evenGrid(3, 1);
  const s = suggestTemplate({ images: ['a'], title: 'T', body: ['1', '2', '3'], grid: { cells: neutral } });
  const old = suggestTemplate({ images: ['a'], title: 'T', body: ['1', '2', '3'] });
  ok('trung tính → kết quả = heuristic cũ', s.templateId === old.templateId);
}

function testDeterministic() {
  console.log('\n[5] Tất định — cùng input ra cùng suggestion');
  const cells = evenGrid(4, 3);
  const mk = () => suggestTemplate({ images: ['a', 'b'], title: 'V', grid: { cells, gutterXPct: 3 } });
  ok('templateId + reason giống nhau', JSON.stringify([mk().templateId, mk().reason]) === JSON.stringify([mk().templateId, mk().reason]));
}

testOldBehaviorUnchanged();
testIconSetGrid();
testColorBlockFullBleed();
testNeutralGridFallsThrough();
testDeterministic();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
