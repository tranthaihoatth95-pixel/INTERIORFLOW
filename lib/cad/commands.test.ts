/**
 * lib/cad/commands.test.ts — NC-12 VIỆC 3: `cutHoleInWall` + VIỆC 1 (nối extrude/arrayLinear
 * thật, `docs/SPEC-DUNG-BO-LENH-3D.md`): `setEntityBevel`/`setEntityArrayLinear`/`railingPosts`
 * (thuần, không đụng store/three.js). Chạy: node_modules/.bin/sucrase-node lib/cad/commands.test.ts
 */
import type { HatchEntity } from './model';
import { cutHoleInWall, setEntityBevel, setEntityArrayLinear, railingPosts } from './commands';

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

console.log('setEntityBevel — đặt/xoá bậc extrude, SỬA tại chỗ (không cộng dồn nhiều bevel)');
{
  const beveled = setEntityBevel(wall, 30);
  ok('thêm ĐÚNG 1 bậc extrude, bevel=30', beveled.ops?.length === 1 && beveled.ops![0].op === 'extrude' && (beveled.ops![0] as { bevel?: number }).bevel === 30);
  ok('h lấy từ heightMm hiện tại của entity', (beveled.ops![0] as { h: number }).h === 2700);
  ok('wall gốc KHÔNG bị sửa tại chỗ (thuần)', wall.ops === undefined);

  const rebeveled = setEntityBevel(beveled, 50);
  ok('gọi lại SỬA giá trị cũ, KHÔNG cộng dồn 2 bậc extrude', rebeveled.ops?.length === 1 && (rebeveled.ops![0] as { bevel?: number }).bevel === 50);

  const cleared = setEntityBevel(rebeveled, 0);
  ok('bevelMm<=0 XOÁ bậc extrude (không để lại rác bevel:0)', cleared.ops === undefined);
}

console.log('setEntityBevel — giữ NGUYÊN các bậc khác trong ops (vd boolean đã có sẵn)');
{
  const withHole = cutHoleInWall(wall, { x: 500, y: -20, w: 300, h: 240 }, 'subtract').updatedWall;
  const beveled = setEntityBevel(withHole, 20);
  ok('vẫn còn bậc boolean cũ + thêm 1 bậc extrude', beveled.ops?.length === 2 && beveled.ops!.some((o) => o.op === 'boolean') && beveled.ops!.some((o) => o.op === 'extrude'));
}

console.log('setEntityArrayLinear — đặt/xoá bậc arrayLinear, SỬA tại chỗ');
{
  const arrayed = setEntityArrayLinear(wall, { n: 5, dx: 300, dy: 0, dz: 0 });
  ok('thêm ĐÚNG 1 bậc arrayLinear n=5', arrayed.ops?.length === 1 && arrayed.ops![0].op === 'arrayLinear' && (arrayed.ops![0] as { n: number }).n === 5);
  ok('wall gốc KHÔNG bị sửa tại chỗ (thuần)', wall.ops === undefined);

  const rearrayed = setEntityArrayLinear(arrayed, { n: 8, dx: 250, dy: 0, dz: 0 });
  ok('gọi lại SỬA giá trị cũ, KHÔNG cộng dồn 2 bậc arrayLinear', rearrayed.ops?.length === 1 && (rearrayed.ops![0] as { n: number }).n === 8);

  const cleared = setEntityArrayLinear(rearrayed, { n: 1, dx: 0, dy: 0, dz: 0 });
  ok('n<=1 XOÁ bậc arrayLinear', cleared.ops === undefined);
  ok('n làm tròn số nguyên', setEntityArrayLinear(wall, { n: 4.7, dx: 1, dy: 0, dz: 0 }).ops![0].op === 'arrayLinear' && (setEntityArrayLinear(wall, { n: 4.7, dx: 1, dy: 0, dz: 0 }).ops![0] as { n: number }).n === 5);
}

console.log('railingPosts — tái dùng wallSegment() dựng 1 cột + gắn arrayLinear dọc a→b');
{
  const posts = railingPosts({ x: 0, y: 0 }, { x: 2400, y: 0 }, 9, 300, 60, 900, 'l-wall');
  ok('trả đúng 2 entity như wallSegment (hatch + polyline)', posts.length === 2 && posts.some((e) => e.type === 'hatch') && posts.some((e) => e.type === 'polyline'));
  const hatch = posts.find((e) => e.type === 'hatch')!;
  ok('cột cao 900mm (heightMm riêng, không phải cao tường mặc định)', hatch.heightMm === 900);
  ok('mang ĐÚNG 1 bậc arrayLinear n=9', hatch.ops?.length === 1 && hatch.ops![0].op === 'arrayLinear' && (hatch.ops![0] as { n: number }).n === 9);
  ok('mảng chạy dọc trục a→b (dx=300, dy=0 vì a→b nằm ngang)', (hatch.ops![0] as { dx: number; dy: number }).dx === 300 && (hatch.ops![0] as { dy: number }).dy === 0);
  const widthX = hatch.type === 'hatch' ? Math.max(...hatch.points.map((p) => p.x)) - Math.min(...hatch.points.map((p) => p.x)) : NaN;
  ok('footprint cột là hình vuông 60×60mm quanh điểm a', Math.abs(widthX - 60) < 1e-9);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
