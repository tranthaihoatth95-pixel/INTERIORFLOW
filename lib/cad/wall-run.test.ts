/**
 * lib/cad/wall-run.test.ts — P11 (`SPEC-VE-REVIT-MODE.md` §2): WallRun giữ tim/location line
 * sống, đổi bề dày thì cạnh `locationLine` ĐỨNG YÊN. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/wall-run.test.ts
 */
import type { HatchEntity, PolylineEntity } from './model';
import { wallSegment, wallLocationOffsets, wallSegmentOutline, wallRunOutlineEntities, createWallRun, regenWallRun } from './commands';

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

function pt(p: { x: number; y: number }, x: number, y: number, eps = 1e-6) {
  return Math.abs(p.x - x) < eps && Math.abs(p.y - y) < eps;
}

console.log('wallLocationOffsets — center/left/right, thần chú "path đứng yên = offset 0"');
{
  const c = wallLocationOffsets(200, 'center');
  ok('center: left=+t/2, right=-t/2', c.left === 100 && c.right === -100);
  const l = wallLocationOffsets(200, 'left');
  ok('left: offset phía mình = 0, dồn hết -t sang phải', l.left === 0 && l.right === -200);
  const r = wallLocationOffsets(200, 'right');
  ok('right: offset phía mình = 0, dồn hết +t sang trái', r.left === 200 && r.right === 0);
}

console.log('wallSegmentOutline loc=center — GIỐNG HỆT wallSegment cũ (không phá hành vi sketch/pro)');
{
  const a = { x: 0, y: 0 };
  const b = { x: 4000, y: 300 };
  const oldOut = wallSegment(a, b, 110, 'l-wall') as [HatchEntity, PolylineEntity];
  const newOut = wallSegmentOutline(a, b, 110, 'l-wall', 'center') as [HatchEntity, PolylineEntity];
  const oldPts = (oldOut[0] as HatchEntity).points;
  const newPts = (newOut[0] as HatchEntity).points;
  ok('4 điểm hatch trùng khớp toạ độ (center = center)', oldPts.every((p, i) => pt(p, newPts[i].x, newPts[i].y)));
}

console.log('wallSegmentOutline loc=left — path CHÍNH LÀ mặt trái, offset 0 phía đó');
{
  const a = { x: 0, y: 0 };
  const b = { x: 4000, y: 0 };
  const [hatch] = wallSegmentOutline(a, b, 110, 'l-wall', 'left') as [HatchEntity, PolylineEntity];
  const [p1, p2, p3, p4] = hatch.points;
  ok('p1 == a (mặt trái = path, không dịch)', pt(p1, 0, 0));
  ok('p2 == b (mặt trái = path, không dịch)', pt(p2, 4000, 0));
  ok('p3/p4 dồn bề dày 110mm sang phía kia (a→b nằm ngang, "trái" của chiều đi = +Y)', pt(p3, 4000, -110) && pt(p4, 0, -110));
  ok('entity mang elementType wall + wallThicknessMm đúng t truyền vào', hatch.elementType === 'wall' && hatch.wallThicknessMm === 110);
}

console.log('wallSegmentOutline loc=right — path CHÍNH LÀ mặt phải, offset 0 phía đó');
{
  const a = { x: 0, y: 0 };
  const b = { x: 4000, y: 0 };
  const [hatch] = wallSegmentOutline(a, b, 110, 'l-wall', 'right') as [HatchEntity, PolylineEntity];
  const [p1, p2, p3, p4] = hatch.points;
  ok('p3/p4 == b/a (mặt phải = path, không dịch)', pt(p3, 4000, 0) && pt(p4, 0, 0));
  ok('p1/p2 dồn bề dày 110mm sang phía kia', pt(p1, 0, 110) && pt(p2, 4000, 110));
}

console.log('regenWallRun — LUẬT MÁU location line: đổi bề dày 110→220, cạnh locationLine ĐỨNG YÊN');
{
  const path = [{ x: 0, y: 0 }, { x: 4000, y: 0 }];
  const { run, entities } = createWallRun(path, 110, 'l-wall', 'left', false);
  ok('createWallRun sinh đúng 2 entity (1 đoạn = 1 hatch + 1 polyline)', entities.length === 2);
  ok('run.entityIds khớp id 2 entity vừa sinh', run.entityIds.length === 2 && run.entityIds.every((id) => entities.some((e) => e.id === id)));
  const hatch0 = entities.find((e) => e.type === 'hatch') as HatchEntity;
  const [op1, op2] = hatch0.points; // cạnh trái, offset 0 → phải == path

  const { run: run2, entities: entities2, removedEntityIds } = regenWallRun(run, { thicknessMm: 220 });
  ok('regen trả removedEntityIds ĐÚNG entityIds cũ (caller xoá đúng đám này)', removedEntityIds.length === 2 && removedEntityIds.every((id) => run.entityIds.includes(id)));
  ok('run2.thicknessMm cập nhật thành 220', run2.thicknessMm === 220);
  ok('run2 CẤP ID MỚI, không tái dùng id cũ', run2.entityIds.every((id) => !run.entityIds.includes(id)));

  const hatch1 = entities2.find((e) => e.type === 'hatch') as HatchEntity;
  const [np1, np2, np3, np4] = hatch1.points;
  ok('SAU regen: cạnh trái (locationLine) TRÙNG KHỚP TOẠ ĐỘ như trước khi đổi bề dày', pt(np1, op1.x, op1.y) && pt(np2, op2.x, op2.y));
  ok('SAU regen: cạnh phải dịch đúng bề dày mới (220mm, không phải 110mm)', pt(np3, 4000, -220) && pt(np4, 0, -220));
}

console.log('regenWallRun — đổi locationLine "left"→"right" (path giữ nguyên, chỉ đổi cạnh nào đứng yên)');
{
  const path = [{ x: 0, y: 0 }, { x: 2000, y: 0 }];
  const { run } = createWallRun(path, 110, 'l-wall', 'left', false);
  const { run: run2, entities: entities2 } = regenWallRun(run, { locationLine: 'right' });
  ok('run2.path KHÔNG đổi (path là dữ liệu sống, locationLine chỉ đổi cách offset)', run2.path === run.path || JSON.stringify(run2.path) === JSON.stringify(run.path));
  const hatch = entities2.find((e) => e.type === 'hatch') as HatchEntity;
  const [, , p3, p4] = hatch.points;
  ok('locationLine=right mới: cạnh PHẢI nay == path (đứng yên đúng theo mode mới)', pt(p3, 2000, 0) && pt(p4, 0, 0));
}

console.log('wallRunOutlineEntities — chuỗi 3 đoạn chữ U, closed=false, mỗi đoạn ĐỘC LẬP sinh quad (chưa nối)');
{
  const path = [{ x: 0, y: 0 }, { x: 0, y: 3000 }, { x: 4000, y: 3000 }, { x: 4000, y: 0 }];
  const entities = wallRunOutlineEntities({ path, thicknessMm: 110, locationLine: 'center', layer: 'l-wall', closed: false });
  ok('3 đoạn → 6 entity (3 hatch + 3 polyline)', entities.length === 6 && entities.filter((e) => e.type === 'hatch').length === 3);
}

console.log('wallRunOutlineEntities — closed=true khép thêm đoạn cuối→đầu');
{
  const path = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }];
  const open = wallRunOutlineEntities({ path, thicknessMm: 110, locationLine: 'center', layer: 'l-wall', closed: false });
  const closed = wallRunOutlineEntities({ path, thicknessMm: 110, locationLine: 'center', layer: 'l-wall', closed: true });
  ok('closed=true thêm đúng 1 đoạn (2 entity) so với open', closed.length === open.length + 2);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
