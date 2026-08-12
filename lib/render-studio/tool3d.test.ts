/**
 * lib/render-studio/tool3d.test.ts — máy trạng thái công cụ 3D [marker: Tool3DStateMachine].
 * Chạy: node_modules/.bin/sucrase-node lib/render-studio/tool3d.test.ts
 */
import type { Entity } from '../cad/model';
import {
  tool3dKeyTransition,
  lineBlockEntities,
  rectBlockEntities,
  circleBlockEntities,
  linkedSelectionIds,
  moveSelectionUpdates,
  rotateSelectionUpdates,
  duplicateSelectionEntities,
  measureSelection,
} from './tool3d';

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

console.log('[1] tool3dKeyTransition — Enter/Esc/Space kết thúc, chữ tắt đổi tool');
ok('Esc khi cầm tool → select', tool3dKeyTransition('rect', 'Escape') === 'select');
ok('Enter khi cầm tool → select', tool3dKeyTransition('move', 'Enter') === 'select');
ok('Space khi cầm tool → select', tool3dKeyTransition('circle', ' ') === 'select');
ok('Esc khi đã ở select → null (không đổi)', tool3dKeyTransition('select', 'Escape') === null);
ok('L → line', tool3dKeyTransition('select', 'l') === 'line');
ok('R hoa → rect', tool3dKeyTransition('select', 'R') === 'rect');
ok('Q → rotate (đổi thẳng tool, không qua select)', tool3dKeyTransition('line', 'q') === 'rotate');
ok('phím lạ → null', tool3dKeyTransition('select', 'z') === null);
ok('phím trùng tool đang cầm → null', tool3dKeyTransition('line', 'l') === null);

console.log('\n[2] lineBlockEntities — tái dùng wallSegmentOutline + heightMm');
const line = lineBlockEntities({ x: 0, y: 0 }, { x: 4000, y: 0 }, 200, { heightMm: 2500, layer: 'l-wall' });
ok('2 entity (hatch + outline)', line.length === 2);
ok('hatch solid elementType wall', line[0].type === 'hatch' && line[0].elementType === 'wall');
ok('cả hai mang heightMm 2500', line.every((e) => e.heightMm === 2500));
ok('hatch neo outline (hostId)', line[0].hostId === line[1].id);

console.log('\n[3] rectBlockEntities — đáy đúng w×d');
const rect = rectBlockEntities({ x: 100, y: 200 }, 3000, 2000, { heightMm: 2700, layer: 'l-wall' });
const rectHatch = rect[0];
ok('hatch 4 đỉnh', rectHatch.type === 'hatch' && rectHatch.points.length === 4);
ok('đỉnh đối diện (3100, 2200)', rectHatch.type === 'hatch' && rectHatch.points[2].x === 3100 && rectHatch.points[2].y === 2200);
ok('outline closed', rect[1].type === 'polyline' && rect[1].closed === true);

console.log('\n[4] circleBlockEntities — N-gon đúng bán kính');
const circle = circleBlockEntities({ x: 0, y: 0 }, 600, { heightMm: 900, layer: 'l-wall' }, 32);
const circleHatch = circle[0];
ok('32 đỉnh', circleHatch.type === 'hatch' && circleHatch.points.length === 32);
ok(
  'mọi đỉnh cách tâm ~600',
  circleHatch.type === 'hatch' && circleHatch.points.every((p) => Math.abs(Math.hypot(p.x, p.y) - 600) < 1e-6),
);

console.log('\n[5] linkedSelectionIds — cụm hostId đi cùng nhau');
const docEntities: Entity[] = [
  ...rect,
  { id: 'khac', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 1, y: 1 } },
];
const hatchId = rect[0].id;
const outlineId = rect[1].id;
ok('chọn hatch kéo theo outline', linkedSelectionIds(docEntities, hatchId).has(outlineId));
ok('chọn outline kéo theo hatch', linkedSelectionIds(docEntities, outlineId).has(hatchId));
ok('entity rời không dính vào', !linkedSelectionIds(docEntities, hatchId).has('khac'));
ok('id không tồn tại → rỗng', linkedSelectionIds(docEntities, 'ma').size === 0);

console.log('\n[6] moveSelectionUpdates — dx/dy tịnh tiến, dz đổi elevationMm kẹp ≥0');
const moved = moveSelectionUpdates(docEntities, hatchId, 500, -100, 0);
ok('2 update (hatch+outline), không đụng entity rời', moved.length === 2 && moved.every((e) => e.id !== 'khac'));
const movedHatch = moved.find((e) => e.id === hatchId)!;
ok('điểm đầu dời đúng (600, 100)', movedHatch.type === 'hatch' && movedHatch.points[0].x === 600 && movedHatch.points[0].y === 100);
const raisedZ = moveSelectionUpdates(docEntities, hatchId, 0, 0, -300);
ok('dz âm từ 0 kẹp về 0, không xuống âm', raisedZ.every((e) => (e.elevationMm ?? 0) === 0));

console.log('\n[7] rotateSelectionUpdates — quay 90° quanh tâm khối, kích thước hoán đổi');
const rotated = rotateSelectionUpdates(docEntities, hatchId, 90);
const rotHatch = rotated.find((e) => e.id === hatchId)!;
const m0 = measureSelection(docEntities, hatchId)!;
const xs = rotHatch.type === 'hatch' ? rotHatch.points.map((p) => p.x) : [];
const ys = rotHatch.type === 'hatch' ? rotHatch.points.map((p) => p.y) : [];
const wSau = Math.round(Math.max(...xs) - Math.min(...xs));
const dSau = Math.round(Math.max(...ys) - Math.min(...ys));
ok('rộng↔sâu hoán chỗ sau 90°', wSau === m0.dMm && dSau === m0.wMm);
ok('góc 0 → không update nào', rotateSelectionUpdates(docEntities, hatchId, 0).length === 0);

console.log('\n[8] duplicateSelectionEntities — id mới + hostId remap');
const dup = duplicateSelectionEntities(docEntities, hatchId, 1200, 0);
ok('2 bản sao', dup.length === 2);
ok('id đều MỚI', dup.every((e) => e.id !== hatchId && e.id !== outlineId));
const dupHatch = dup.find((e) => e.type === 'hatch')!;
const dupOutline = dup.find((e) => e.type === 'polyline')!;
ok('hostId trỏ vào outline BẢN SAO, không phải bản gốc', dupHatch.hostId === dupOutline.id && dupHatch.hostId !== outlineId);
ok('đã dời 1200 theo X', dupHatch.type === 'hatch' && dupHatch.points[0].x === 1300);

console.log('\n[9] measureSelection — số thật từ Doc, thiếu heightMm nói null');
ok('rect 3000×2000 cao 2700', m0.wMm === 3000 && m0.dMm === 2000 && m0.hMm === 2700);
const flat: Entity[] = [{ id: 'f1', type: 'polyline', layer: 'l', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }], closed: true }];
ok('không heightMm → hMm null', measureSelection(flat, 'f1')?.hMm === null);
ok('id không có → null', measureSelection(flat, 'ma') === null);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
