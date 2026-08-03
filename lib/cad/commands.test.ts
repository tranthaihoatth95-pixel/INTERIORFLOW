/**
 * lib/cad/commands.test.ts — NC-12 VIỆC 3: `cutHoleInWall` (thuần, không đụng store/three.js).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/commands.test.ts
 */
import type { HatchEntity } from './model';
import { cutHoleInWall } from './commands';

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

const wall: HatchEntity = {
  id: 'wall-1',
  type: 'hatch',
  layer: 'l-wall',
  points: [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 200 },
    { x: 0, y: 200 },
  ],
  solid: true,
  heightMm: 2700,
};

console.log('cutHoleInWall — tạo cutter + ghi bậc boolean lên tường');
{
  const { cutter, updatedWall } = cutHoleInWall(wall, { x: 1700, y: -20, w: 600, h: 240, heightMm: 1200 }, 'subtract');
  ok('cutter là RectEntity mới, id khác tường', cutter.type === 'rect' && cutter.id !== wall.id);
  ok('cutter kế thừa layer của tường', cutter.layer === wall.layer);
  ok('cutter đúng x/y/w/h truyền vào', cutter.type === 'rect' && cutter.x === 1700 && cutter.y === -20 && cutter.w === 600 && cutter.h === 240);
  ok('cutter mang heightMm riêng (1200, KHÔNG phải cao tường 2700)', cutter.heightMm === 1200);
  ok('tường giữ nguyên id/points/heightMm (chỉ thêm ops)', updatedWall.id === wall.id && updatedWall.heightMm === 2700);
  ok('updatedWall.ops có ĐÚNG 1 bậc boolean subtract → cutter.id', Array.isArray(updatedWall.ops) && updatedWall.ops!.length === 1 && updatedWall.ops![0].op === 'boolean' && (updatedWall.ops![0] as { withRef: string }).withRef === cutter.id && (updatedWall.ops![0] as { kind: string }).kind === 'subtract');
  ok('wall gốc KHÔNG bị sửa tại chỗ (thuần)', wall.ops === undefined);
}

console.log('cutHoleInWall — gọi lần 2 CỘNG DỒN ops (không ghi đè bậc cũ)');
{
  const first = cutHoleInWall(wall, { x: 500, y: -20, w: 300, h: 240 }, 'subtract');
  const second = cutHoleInWall(first.updatedWall, { x: 3000, y: -20, w: 300, h: 240 }, 'subtract');
  ok('2 bậc boolean, 2 withRef khác nhau', second.updatedWall.ops!.length === 2);
  const refs = new Set(second.updatedWall.ops!.map((o) => (o as { withRef: string }).withRef));
  ok('withRef không trùng nhau', refs.size === 2);
}

console.log('cutHoleInWall — kind mặc định là subtract khi không truyền');
{
  const { updatedWall } = cutHoleInWall(wall, { x: 0, y: 0, w: 100, h: 100 });
  ok('kind mặc định subtract', (updatedWall.ops![0] as { kind: string }).kind === 'subtract');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
