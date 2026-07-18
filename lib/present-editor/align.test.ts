/**
 * lib/present-editor/align.test.ts — kiểm căn chỉnh + phân bố đều (logic thuần, không DOM). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/align.test.ts
 */
import { groupBounds, alignFrames, distributeFrames } from './align';
import type { Frame } from './model';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
};
const approx = (a: number, b: number, eps = 0.001) => Math.abs(a - b) <= eps;

function f(x: number, y: number, w: number, h: number): Frame {
  return { x, y, w, h, rotation: 0 };
}

console.log('[1] groupBounds — bounding box chung của nhiều frame');
{
  const frames = [f(10, 10, 20, 20), f(50, 5, 10, 10), f(30, 40, 15, 15)];
  const b = groupBounds(frames);
  ok('x0 = mép trái nhỏ nhất', approx(b.x0, 10));
  ok('y0 = mép trên nhỏ nhất', approx(b.y0, 5));
  ok('x1 = mép phải lớn nhất', approx(b.x1, 60)); // 50+10
  ok('y1 = mép dưới lớn nhất', approx(b.y1, 55)); // 40+15
}
{
  const b = groupBounds([]);
  ok('groupBounds rỗng → toàn 0', b.x0 === 0 && b.y0 === 0 && b.x1 === 0 && b.y1 === 0);
}

console.log('[2] alignFrames — left/right/hcenter dùng bounding box CHUNG (không phải biên sân khấu)');
{
  const frames = [f(10, 0, 20, 10), f(50, 0, 10, 10)]; // bbox chung x: 10..60
  const left = alignFrames(frames, 'left');
  ok('left: mọi x = x0 chung (10)', left.every((fr) => approx(fr.x, 10)));

  const right = alignFrames(frames, 'right');
  ok('right: mép phải mọi frame = x1 chung (60)', right.every((fr) => approx(fr.x + fr.w, 60)));

  const hcenter = alignFrames(frames, 'hcenter');
  const cx = (10 + 60) / 2; // 35
  ok('hcenter: tâm ngang mọi frame = tâm bbox chung', hcenter.every((fr) => approx(fr.x + fr.w / 2, cx)));
}

console.log('[3] alignFrames — top/bottom/vcenter theo trục dọc');
{
  const frames = [f(0, 10, 10, 20), f(0, 50, 10, 10)]; // bbox chung y: 10..60
  const top = alignFrames(frames, 'top');
  ok('top: mọi y = y0 chung (10)', top.every((fr) => approx(fr.y, 10)));

  const bottom = alignFrames(frames, 'bottom');
  ok('bottom: mép dưới mọi frame = y1 chung (60)', bottom.every((fr) => approx(fr.y + fr.h, 60)));

  const vcenter = alignFrames(frames, 'vcenter');
  const cy = (10 + 60) / 2; // 35
  ok('vcenter: tâm dọc mọi frame = tâm bbox chung', vcenter.every((fr) => approx(fr.y + fr.h / 2, cy)));
}

console.log('[4] alignFrames — <2 frame trả nguyên (không có gì để canh theo nhau)');
{
  const one = [f(5, 5, 10, 10)];
  const out = alignFrames(one, 'left');
  ok('1 frame → giữ nguyên vị trí', approx(out[0].x, 5) && approx(out[0].y, 5));
  ok('trả BẢN SAO (không cùng tham chiếu)', out[0] !== one[0]);

  const none = alignFrames([], 'left');
  ok('mảng rỗng → mảng rỗng', none.length === 0);
}

console.log('[5] distributeFrames — phân bố đều ngang, giữ nguyên 2 mốc biên, khoảng cách bằng nhau');
{
  // 3 phần tử: trái (x=0,w=10) · phải (x=90,w=10) · giữa (đặt lệch, sẽ được xếp lại cho đều)
  const frames = [f(0, 0, 10, 10), f(90, 0, 10, 10), f(40, 0, 10, 10)];
  const out = distributeFrames(frames, 'horizontal');
  ok('mốc trái giữ nguyên x=0', approx(out[0].x, 0));
  ok('mốc phải giữ nguyên x=90', approx(out[1].x, 90));
  // tổng span 0..100, 3 phần tử rộng 10 mỗi cái → 2 khoảng gap = (100 - 30)/2 = 35
  // phần tử giữa (out[2]) phải nằm ở x = 0 + 10 + 35 = 45
  ok('phần tử giữa xếp cách đều (gap bằng nhau cả 2 phía)', approx(out[2].x, 45));

  // khoảng cách giữa các mép phải bằng nhau
  const gap1 = out[2].x - (out[0].x + out[0].w);
  const gap2 = out[1].x - (out[2].x + out[2].w);
  ok('2 khoảng gap bằng nhau', approx(gap1, gap2));
}

console.log('[6] distributeFrames — phân bố đều dọc');
{
  const frames = [f(0, 0, 10, 10), f(0, 40, 10, 20), f(0, 100, 10, 10)];
  const out = distributeFrames(frames, 'vertical');
  ok('mốc trên giữ nguyên y=0', approx(out[0].y, 0));
  ok('mốc dưới giữ nguyên y=100', approx(out[2].y, 100));
  const gap1 = out[1].y - (out[0].y + out[0].h); // sau phần tử đầu (h=10)
  const gap2 = out[2].y - (out[1].y + out[1].h); // sau phần tử giữa (h=20)
  ok('2 khoảng gap dọc bằng nhau', approx(gap1, gap2));
}

console.log('[7] distributeFrames — <3 frame trả nguyên (không đủ để chia đều)');
{
  const two = [f(0, 0, 10, 10), f(50, 0, 10, 10)];
  const out = distributeFrames(two, 'horizontal');
  ok('2 frame → giữ nguyên vị trí (x=0)', approx(out[0].x, 0));
  ok('2 frame → giữ nguyên vị trí (x=50)', approx(out[1].x, 50));
  ok('trả BẢN SAO (không cùng tham chiếu)', out[0] !== two[0]);
}

console.log('[8] distributeFrames — giữ ĐÚNG thứ tự mảng gốc dù thứ tự không gian khác');
{
  // truyền vào theo thứ tự KHÔNG gian ngược (phải → giữa → trái)
  const frames = [f(90, 0, 10, 10), f(40, 0, 10, 10), f(0, 0, 10, 10)];
  const out = distributeFrames(frames, 'horizontal');
  // out[0] tương ứng frames[0] (x gốc=90) → vẫn phải là mốc PHẢI sau khi phân bố
  ok('out[0] (gốc x=90) vẫn là mốc phải sau phân bố', approx(out[0].x, 90));
  ok('out[2] (gốc x=0) vẫn là mốc trái sau phân bố', approx(out[2].x, 0));
  ok('out[1] (gốc x=40) nằm giữa, cách đều', approx(out[1].x, 45));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
