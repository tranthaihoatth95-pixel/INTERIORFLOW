/**
 * lib/cad/commands.test.ts — NC-12 VIỆC 3: `cutHoleInWall` + VIỆC 1 (nối extrude/arrayLinear
 * thật, `docs/SPEC-DUNG-BO-LENH-3D.md`): `setEntityBevel`/`setEntityArrayLinear`/`railingPosts`
 * (thuần, không đụng store/three.js). Chạy: node_modules/.bin/sucrase-node lib/cad/commands.test.ts
 */
import type { HatchEntity, PolylineEntity, RectEntity, LineEntity } from './model';
import {
  cutHoleInWall, setEntityBevel, setEntityArrayLinear, railingPosts,
  entityFootprintMm, setEntityTaper, setEntityBevelEx, setEntityMirror, setEntityArrayRadial,
  setEntitySweep, setEntityRevolve, setEntityLoft,
} from './commands';

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

/* ═════════ MỞ KHO 08/08 (`docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#1) — 6 bậc BuildOp mới ═════════ */

console.log('entityFootprintMm — rect/hatch/polyline kín trả đa giác; line/polyline hở trả null');
{
  const rect: RectEntity = { id: 'r1', type: 'rect', layer: 'l', x: 10, y: 20, w: 100, h: 50 };
  const poly = entityFootprintMm(rect);
  ok('rect ra đúng 4 góc', poly !== null && poly.length === 4 && poly[0].x === 10 && poly[0].y === 20 && poly[2].x === 110 && poly[2].y === 70);

  const hatchFootprint = entityFootprintMm(wall);
  ok('hatch trả đúng points gốc', hatchFootprint !== null && hatchFootprint.length === 4 && hatchFootprint[1].x === 4000);

  const openPolyline: PolylineEntity = { id: 'p1', type: 'polyline', layer: 'l', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], closed: false };
  ok('polyline HỞ không phải footprint kín → null', entityFootprintMm(openPolyline) === null);

  const line: LineEntity = { id: 'l1', type: 'line', layer: 'l', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
  ok('line không có đa giác → null', entityFootprintMm(line) === null);
}

console.log('setEntityTaper — đặt/xoá bậc taper, polyMm NƯỚNG từ footprint tường lúc gọi, SỬA tại chỗ');
{
  const tapered = setEntityTaper(wall, 20);
  ok('thêm ĐÚNG 1 bậc taper', tapered.ops?.length === 1 && tapered.ops![0].op === 'taper');
  const op = tapered.ops![0] as { op: 'taper'; polyMm: { x: number; y: number }[]; topInsetMm: number };
  ok('topInsetMm đúng tham số', op.topInsetMm === 20);
  ok('polyMm NƯỚNG đúng points của tường', op.polyMm.length === 4 && op.polyMm[1].x === 4000);
  ok('wall gốc KHÔNG bị sửa tại chỗ (thuần)', wall.ops === undefined);

  const retaper = setEntityTaper(tapered, 35);
  ok('gọi lại SỬA giá trị, KHÔNG cộng dồn 2 bậc taper', retaper.ops?.length === 1 && (retaper.ops![0] as { topInsetMm: number }).topInsetMm === 35);

  const cleared = setEntityTaper(retaper, 0);
  ok('topInsetMm<=0 XOÁ bậc taper', cleared.ops === undefined);

  const line: LineEntity = { id: 'l2', type: 'line', layer: 'l', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
  ok('entity không có footprint → giữ NGUYÊN, không sập', setEntityTaper(line, 20) === line);
}

console.log('setEntityBevelEx — đặt/xoá bậc bevelEx, SỬA tại chỗ');
{
  const beveled = setEntityBevelEx(wall, { radiusMm: 10, segments: 4, edges: 'all' });
  ok('thêm ĐÚNG 1 bậc bevelEx', beveled.ops?.length === 1 && beveled.ops![0].op === 'bevelEx');
  const op = beveled.ops![0] as { radiusMm: number; segments: number; edges: string };
  ok('tham số đúng + segments làm tròn/kẹp ≥1', op.radiusMm === 10 && op.segments === 4 && op.edges === 'all');
  ok('segments không nguyên → làm tròn', (setEntityBevelEx(wall, { radiusMm: 10, segments: 2.6, edges: 'top' }).ops![0] as { segments: number }).segments === 3);

  const cleared = setEntityBevelEx(beveled, { radiusMm: 0, segments: 1, edges: 'top' });
  ok('radiusMm<=0 XOÁ bậc bevelEx', cleared.ops === undefined);
}

console.log('setEntityTaper/setEntityBevelEx — cùng-nhóm "thay-hình-gốc" XOÁ NHAU (mutually exclusive, không rác 2 bậc mâu thuẫn)');
{
  const tapered = setEntityTaper(wall, 20);
  const thenBeveled = setEntityBevelEx(tapered, { radiusMm: 10, segments: 2, edges: 'top' });
  ok('đặt bevelEx SAU taper → chỉ còn 1 bậc bevelEx (taper bị dọn)', thenBeveled.ops?.length === 1 && thenBeveled.ops![0].op === 'bevelEx');

  const back = setEntityTaper(thenBeveled, 15);
  ok('đặt taper SAU bevelEx → chỉ còn 1 bậc taper (bevelEx bị dọn)', back.ops?.length === 1 && back.ops![0].op === 'taper');
}

console.log('setEntityMirror — đặt/xoá bậc mirror (KHÔNG nướng đa giác — modifier thuần), SỬA tại chỗ');
{
  const mirrored = setEntityMirror(wall, { axis: 'y', atMm: 100, withOriginal: false });
  ok('thêm ĐÚNG 1 bậc mirror', mirrored.ops?.length === 1 && mirrored.ops![0].op === 'mirror');
  const op = mirrored.ops![0] as { axis: string; atMm: number; withOriginal?: boolean };
  ok('tham số đúng (axis=y, atMm=100, withOriginal=false)', op.axis === 'y' && op.atMm === 100 && op.withOriginal === false);

  const remirrored = setEntityMirror(mirrored, { axis: 'x', atMm: 0 });
  ok('gọi lại SỬA giá trị, KHÔNG cộng dồn', remirrored.ops?.length === 1 && (remirrored.ops![0] as { axis: string }).axis === 'x');

  const cleared = setEntityMirror(remirrored, null);
  ok('opts=null XOÁ bậc mirror', cleared.ops === undefined);
  ok('atMm=0 vẫn là mặt gương hợp lệ (không bị coi là "tắt")', setEntityMirror(wall, { axis: 'x', atMm: 0 }).ops?.length === 1);
}

console.log('setEntityMirror — cùng khung "modifier" KHÔNG đụng bậc "thay-hình-gốc" đã có (2 nhóm độc lập)');
{
  const tapered = setEntityTaper(wall, 20);
  const withMirror = setEntityMirror(tapered, { axis: 'x', atMm: 0 });
  ok('giữ NGUYÊN bậc taper + thêm bậc mirror (2 bậc, không xoá nhau — khác nhóm)', withMirror.ops?.length === 2 && withMirror.ops!.some((o) => o.op === 'taper') && withMirror.ops!.some((o) => o.op === 'mirror'));
}

console.log('setEntityArrayRadial — đặt/xoá bậc arrayRadial, SỬA tại chỗ');
{
  const arrayed = setEntityArrayRadial(wall, { n: 6, centerXMm: 1000, centerYMm: 1000, sweepDeg: 180 });
  ok('thêm ĐÚNG 1 bậc arrayRadial n=6', arrayed.ops?.length === 1 && arrayed.ops![0].op === 'arrayRadial' && (arrayed.ops![0] as { n: number }).n === 6);
  ok('sweepDeg truyền đúng', (arrayed.ops![0] as { sweepDeg?: number }).sweepDeg === 180);

  const rearrayed = setEntityArrayRadial(arrayed, { n: 3, centerXMm: 0, centerYMm: 0 });
  ok('gọi lại SỬA giá trị, KHÔNG cộng dồn', rearrayed.ops?.length === 1 && (rearrayed.ops![0] as { n: number }).n === 3);
  ok('sweepDeg thiếu → field KHÔNG có mặt (undefined, không ghi rác)', !('sweepDeg' in (rearrayed.ops![0] as object)));

  const cleared = setEntityArrayRadial(rearrayed, { n: 1, centerXMm: 0, centerYMm: 0 });
  ok('n<=1 XOÁ bậc arrayRadial', cleared.ops === undefined);
  ok('opts=null XOÁ bậc arrayRadial', setEntityArrayRadial(arrayed, null).ops === undefined);
}

console.log('setEntitySweep — profileMm chữ nhật NƯỚNG từ widthMm/heightMm, pathMm NƯỚNG từ points tường');
{
  const swept = setEntitySweep(wall, { widthMm: 50, heightMm: 80 });
  ok('thêm ĐÚNG 1 bậc sweep', swept.ops?.length === 1 && swept.ops![0].op === 'sweep');
  const op = swept.ops![0] as { profileMm: { x: number; y: number }[]; pathMm: { x: number; y: number }[]; closed?: boolean };
  ok('profileMm là chữ nhật 50×80mm quanh tâm', op.profileMm.length === 4 && Math.min(...op.profileMm.map((p) => p.x)) === -25 && Math.max(...op.profileMm.map((p) => p.x)) === 25 && Math.min(...op.profileMm.map((p) => p.y)) === 0 && Math.max(...op.profileMm.map((p) => p.y)) === 80);
  ok('pathMm NƯỚNG đúng points của tường', op.pathMm.length === 4 && op.pathMm[1].x === 4000);
  ok('hatch → closed=true (đường bao khép kín)', op.closed === true);

  const cleared = setEntitySweep(swept, null);
  ok('opts=null XOÁ bậc sweep', cleared.ops === undefined);
  ok('widthMm<=0 → coi như tắt', setEntitySweep(wall, { widthMm: 0, heightMm: 80 }).ops === undefined);

  const line: LineEntity = { id: 'l3', type: 'line', layer: 'l', a: { x: 0, y: 0 }, b: { x: 500, y: 0 } };
  const sweptLine = setEntitySweep(line, { widthMm: 50, heightMm: 80 });
  ok('entity KIỂU line vẫn có path (2 điểm a/b) → áp được', sweptLine.ops?.length === 1);
  const openPolyline: PolylineEntity = { id: 'p2', type: 'polyline', layer: 'l', points: [{ x: 0, y: 0 }, { x: 500, y: 0 }], closed: false };
  ok('polyline HỞ → closed=false (không khép kín giả)', (setEntitySweep(openPolyline, { widthMm: 50, heightMm: 80 }).ops![0] as { closed?: boolean }).closed === false);
}

console.log('setEntityRevolve — centerXMm/centerYMm suy từ TÂM bbox entity, không cần gõ tay');
{
  const revolved = setEntityRevolve(wall, { profileMm: [{ x: 50, y: 0 }, { x: 50, y: 700 }] });
  ok('thêm ĐÚNG 1 bậc revolve', revolved.ops?.length === 1 && revolved.ops![0].op === 'revolve');
  const op = revolved.ops![0] as { centerXMm: number; centerYMm: number; profileMm: unknown[] };
  ok('tâm = TÂM bbox tường (0..4000mm × 0..200mm) = (2000,100)', op.centerXMm === 2000 && op.centerYMm === 100);

  const cleared = setEntityRevolve(revolved, null);
  ok('opts=null XOÁ bậc revolve', cleared.ops === undefined);
  ok('profileMm<2 điểm → coi như tắt', setEntityRevolve(wall, { profileMm: [{ x: 50, y: 0 }] }).ops === undefined);
}

console.log('setEntityLoft — cần ≥2 tiết diện, SỬA tại chỗ');
{
  const bot = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }, { x: 0, y: 400 }];
  const top = [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 300 }, { x: 100, y: 300 }];
  const lofted = setEntityLoft(wall, [{ polyMm: bot, zMm: 0 }, { polyMm: top, zMm: 600 }]);
  ok('thêm ĐÚNG 1 bậc loft với 2 tiết diện', lofted.ops?.length === 1 && lofted.ops![0].op === 'loft' && (lofted.ops![0] as { sections: unknown[] }).sections.length === 2);

  ok('1 tiết diện → coi như tắt (loft cần ≥2)', setEntityLoft(wall, [{ polyMm: bot, zMm: 0 }]).ops === undefined);
  const cleared = setEntityLoft(lofted, null);
  ok('sections=null XOÁ bậc loft', cleared.ops === undefined);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
