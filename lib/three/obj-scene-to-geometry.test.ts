/**
 * lib/three/obj-scene-to-geometry.test.ts — regression: từ khi SPEC-TANG-DU-LIEU-CAU-KIEN §8 Đ1
 * gán `entityId` cho CẢ Furn_i/Window_i (không chỉ Wall_i), lọc "group nào là tường push-pull"
 * (mode `massing`, `Scene3DViewer.tsx`) PHẢI xét cả `heightMm`, không chỉ `entityId` — nếu không,
 * nội thất/cửa sổ sẽ vừa bị loại khỏi scene tĩnh vừa không lọt vào `buildMassingWalls`, biến mất
 * khỏi màn hình. Chạy: node_modules/.bin/sucrase-node lib/three/obj-scene-to-geometry.test.ts
 */
import type { Scene3DData, SceneGroup } from './cad-to-obj';
import { buildMergedGeometries, buildMassingWalls, buildUnmergedGeometries, isMassingWallGroup } from './obj-scene-to-geometry';

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

const wallGroup: SceneGroup = { name: 'Wall_1', colorHex: '#e8e4dc', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], entityId: 'wall-1', heightMm: 2700 };
const furnGroup: SceneGroup = { name: 'Furn_1_sofa2', colorHex: '#8a6f52', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], entityId: 'sofa-1' };
const windowGroup: SceneGroup = { name: 'Window_1', colorHex: '#e8e4dc', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], entityId: 'win-1' };
const floorGroup: SceneGroup = { name: 'Floor', colorHex: '#b08d63', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0] };

const scene: Scene3DData = {
  groups: [wallGroup, furnGroup, windowGroup, floorGroup],
  bboxMm: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
  sizeM: { w: 1, d: 1, h: 2.7 },
};

console.log('isMassingWallGroup — CHỈ đúng khi có CẢ entityId VÀ heightMm');
{
  ok('Wall (entityId + heightMm) → true', isMassingWallGroup(wallGroup) === true);
  ok('Furn (entityId, KHÔNG heightMm) → false', isMassingWallGroup(furnGroup) === false);
  ok('Window (entityId, KHÔNG heightMm) → false', isMassingWallGroup(windowGroup) === false);
  ok('Floor (không entityId, không heightMm) → false', isMassingWallGroup(floorGroup) === false);
}

console.log('buildMassingWalls — chỉ tách tường, KHÔNG kéo theo nội thất/cửa sổ dù chúng đã có entityId');
{
  const walls = buildMassingWalls(scene);
  ok('chỉ có đúng 1 massing wall (Wall_1)', walls.length === 1 && walls[0].entityId === 'wall-1');
}

console.log('Scene3DViewer static-scene filter (mô phỏng) — Furn/Window KHÔNG bị loại khi lọc theo isMassingWallGroup');
{
  const staticGroups = scene.groups.filter((g) => !isMassingWallGroup(g));
  ok('static scene giữ Furn + Window + Floor (3 group)', staticGroups.length === 3);
  ok('static scene KHÔNG còn Wall_1', !staticGroups.some((g) => g.name === 'Wall_1'));
  // Bug đã vá: lọc bằng `!g.entityId` (cũ) sẽ SAI — chỉ còn lại đúng Floor (2 group Furn/Window
  // bị loại oan vì nay chúng cũng có entityId). Chốt lại để không tái phạm.
  const staticGroupsOldBuggyWay = scene.groups.filter((g) => !g.entityId);
  ok('(đối chứng) cách lọc CŨ chỉ `!g.entityId` sẽ loại oan Furn+Window — xác nhận đúng là bug đã né', staticGroupsOldBuggyWay.length === 1);
}

console.log('buildMergedGeometries/buildUnmergedGeometries — không throw, không đổi hành vi cũ');
{
  const merged = buildMergedGeometries(scene);
  ok('gộp theo màu — mỗi màu 1 geometry', merged.length === new Set(scene.groups.map((g) => g.colorHex)).size);
  const unmerged = buildUnmergedGeometries(scene);
  ok('unmerged — 1 geometry/group', unmerged.length === scene.groups.length);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
