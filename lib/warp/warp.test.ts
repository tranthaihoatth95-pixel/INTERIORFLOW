/**
 * lib/warp/warp.test.ts — phần TOÁN của Perspective Warp (không cần canvas/DOM).
 * Chạy: node_modules/.bin/sucrase-node lib/warp/warp.test.ts
 */
import {
  DEFAULT_CORNERS,
  parseCorners,
  serializeCorners,
  quadPoint,
  quadBounds,
  type Corners,
} from './warp';

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
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

const unit: Corners = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

console.log('parseCorners — không bao giờ throw');
ok('rỗng → mặc định', parseCorners('') === DEFAULT_CORNERS);
ok('không phải JSON → mặc định', parseCorners('abc') === DEFAULT_CORNERS);
ok('thiếu điểm → mặc định', parseCorners('[{"x":0,"y":0}]') === DEFAULT_CORNERS);
ok('NaN → mặc định', parseCorners('[{"x":"a","y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":0,"y":1}]') === DEFAULT_CORNERS);
ok('undefined → mặc định', parseCorners(undefined) === DEFAULT_CORNERS);
{
  const round = parseCorners(serializeCorners(unit));
  ok('serialize → parse giữ nguyên 4 góc', round.every((p, i) => near(p.x, unit[i].x) && near(p.y, unit[i].y)));
}

console.log('quadPoint — nội suy trong tứ giác');
ok('(0,0) = góc trên trái', near(quadPoint(unit, 0, 0).x, 0) && near(quadPoint(unit, 0, 0).y, 0));
ok('(1,0) = góc trên phải', near(quadPoint(unit, 1, 0).x, 1) && near(quadPoint(unit, 1, 0).y, 0));
ok('(1,1) = góc dưới phải', near(quadPoint(unit, 1, 1).x, 1) && near(quadPoint(unit, 1, 1).y, 1));
ok('(0,1) = góc dưới trái', near(quadPoint(unit, 0, 1).x, 0) && near(quadPoint(unit, 0, 1).y, 1));
ok('tâm = 0.5/0.5', near(quadPoint(unit, 0.5, 0.5).x, 0.5) && near(quadPoint(unit, 0.5, 0.5).y, 0.5));
{
  // tứ giác nghiêng kiểu tường phối cảnh: cạnh phải cao hơn cạnh trái
  const wall: Corners = [
    { x: 0.1, y: 0.3 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.7 },
    { x: 0.1, y: 0.9 },
  ];
  const mid = quadPoint(wall, 0.5, 0);
  ok('điểm giữa cạnh trên nằm giữa 2 góc trên', near(mid.x, 0.5) && near(mid.y, 0.2));
  const midRight = quadPoint(wall, 1, 0.5);
  ok('điểm giữa cạnh phải đúng', near(midRight.x, 0.9) && near(midRight.y, 0.4));
}

console.log('quadBounds');
{
  const wall: Corners = [
    { x: 0.2, y: 0.3 },
    { x: 0.8, y: 0.1 },
    { x: 0.9, y: 0.7 },
    { x: 0.1, y: 0.95 },
  ];
  const b = quadBounds(wall);
  ok('minX/minY đúng', near(b.minX, 0.1) && near(b.minY, 0.1));
  ok('maxX/maxY đúng', near(b.maxX, 0.9) && near(b.maxY, 0.95));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
