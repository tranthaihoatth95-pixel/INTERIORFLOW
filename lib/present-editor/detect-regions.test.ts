/**
 * lib/present-editor/detect-regions.test.ts — kiểm TOÁN THUẦN của nhận diện lưới.
 * Chạy bằng:  node_modules/.bin/sucrase-node lib/present-editor/detect-regions.test.ts
 * (Không cần DOM — chỉ test hàm thuần; wrapper detectRegions cần canvas nên bỏ qua ở đây.)
 */
import { findGaps, cellsFromCuts, edgeFromLum, projectionProfiles } from './detect-regions';

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) { pass++; console.log('  ok  -', msg); }
  else { fail++; console.log('  FAIL-', msg); }
}
function approx(a: number, b: number, eps = 1e-6) { return Math.abs(a - b) <= eps; }

console.log('[1] findGaps — khe GIỮA');
{
  // profile cao ở 2 đầu, trũng ở giữa (index 10..19) → 1 khe, tâm ~14.5
  const p = new Float32Array(30).fill(10);
  for (let i = 10; i < 20; i++) p[i] = 0;
  const g = findGaps(p, 6);
  ok(g.length === 1, `đúng 1 khe (được ${g.length})`);
  // quy ước: i (một-quá-cuối run) - run/2 = 20 - 5 = 15 (tâm span [10,20))
  ok(g.length === 1 && approx(g[0], 15), `tâm khe ≈ 15 (được ${g[0]})`);
}

console.log('[2] findGaps — KHE CUỐI (bug đã sửa: flush sau vòng lặp)');
{
  // profile cao đầu, trũng kéo tới HẾT mảng (index 20..29) → phải ra 1 khe ở cuối
  const p = new Float32Array(30).fill(10);
  for (let i = 20; i < 30; i++) p[i] = 0;
  const g = findGaps(p, 6);
  ok(g.length === 1, `bắt được khe cuối (được ${g.length}) — bản cũ trả 0`);
  ok(g.length === 1 && approx(g[0], 25), `tâm khe cuối ≈ 25 (được ${g[0]})`);
}

console.log('[3] findGaps — run ngắn hơn minGap thì BỎ QUA');
{
  const p = new Float32Array(30).fill(10);
  for (let i = 27; i < 30; i++) p[i] = 0; // run = 3 < 6
  const g = findGaps(p, 6);
  ok(g.length === 0, `run ngắn ở cuối không tạo khe (được ${g.length})`);
}

console.log('[4] findGaps — profile phẳng 0 → không khe (không chia cho 0)');
{
  const g = findGaps(new Float32Array(20), 6);
  ok(g.length === 0, `max=0 → trả [] an toàn (được ${g.length})`);
}

console.log('[5] cellsFromCuts — 1 cột cắt giữa → 2 ô, mỗi ô 50% rộng');
{
  const cells = cellsFromCuts([120], [], 240, 135, 6);
  ok(cells.length === 2, `2 ô (được ${cells.length})`);
  ok(cells.every((c) => approx(c.w, 50)), 'mỗi ô rộng 50%');
  ok(approx(cells[0].x, 0) && approx(cells[1].x, 50), 'x = 0 và 50');
  ok(cells.every((c) => approx(c.h, 100)), 'cao full 100%');
}

console.log('[6] cellsFromCuts — cột×hàng → lưới 2×2, lọc ô nhỏ');
{
  const cells = cellsFromCuts([120], [67.5], 240, 135, 6);
  ok(cells.length === 4, `lưới 2×2 = 4 ô (được ${cells.length})`);
  // ô nhỏ hơn minCellPct bị loại: cắt sát mép (x=5px trên 240 → 2%)
  const tiny = cellsFromCuts([5], [], 240, 135, 6);
  ok(tiny.length === 1, `ô 2% bị lọc, còn 1 ô (được ${tiny.length})`);
}

console.log('[7] edge + projection — dải phẳng cho cạnh ~0, biên cho cạnh cao');
{
  // 10×10: nửa trái tối (0), nửa phải sáng (1) → cạnh dồn ở cột giữa
  const W = 10, H = 10;
  const lum = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) lum[y * W + x] = x < 5 ? 0 : 1;
  const edge = edgeFromLum(lum, W, H);
  const { col } = projectionProfiles(edge, W, H);
  // cột 4 và 5 (quanh ranh giới) phải có năng lượng cạnh > các cột phẳng
  ok(col[4] + col[5] > col[1] + col[8], 'năng lượng cạnh dồn quanh ranh giới sáng/tối');
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
