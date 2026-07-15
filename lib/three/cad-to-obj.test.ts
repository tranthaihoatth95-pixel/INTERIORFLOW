/**
 * lib/three/cad-to-obj.test.ts — kiểm TẦNG LÕI Bản vẽ → 3D + camera tất định. Chạy:
 *   node_modules/.bin/sucrase-node lib/three/cad-to-obj.test.ts
 */
import type { Doc, Entity } from '../cad/model';
import { DEFAULT_LAYERS } from '../cad/model';
import { wallChain } from '../cad/commands';
import { docToObjScene, blockFootprint, furnitureHeightMm } from './cad-to-obj';
import { presetCamera, parseCameraSpec, placeCamera, fovFromLens, CAMERA_PRESETS } from './camera';

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

/* ---- Doc demo chặng 1: phòng 4×3m tường dày 200 + sofa + bàn ăn ---- */
function demoDoc(): Doc {
  const corners = [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 3000 },
    { x: 0, y: 3000 },
  ];
  const entities: Entity[] = [
    ...wallChain(corners, 200, 'l-wall', true),
    { id: 'b1', type: 'block', layer: 'l-furniture', block: 'sofa2', at: { x: 1200, y: 800 }, rot: 0, sx: 1, sy: 1 },
    { id: 'b2', type: 'block', layer: 'l-furniture', block: 'dining4', at: { x: 2800, y: 1800 }, rot: Math.PI / 2, sx: 1, sy: 1 },
  ];
  return { entities, layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
}

console.log('docToObjScene — dựng khối từ Doc thật');
{
  const scene = docToObjScene(demoDoc(), { wallHeightMm: 2700, theme: 'warm' });
  ok('4 mảng tường từ wallChain khép vòng', scene.stats.walls === 4);
  ok('2 block nội thất', scene.stats.furniture === 2);
  ok('OBJ có mtllib', scene.obj.includes('mtllib scene.mtl'));
  ok('OBJ có object tường + nội thất', scene.obj.includes('o Wall_1') && scene.obj.includes('o Furn_1_sofa2'));
  ok('MTL đủ 5 vật liệu', ['wall', 'floor', 'ceiling', 'furniture', 'room_floor'].every((m) => scene.mtl.includes(`newmtl ${m}`)));
  ok('có vertex + face', scene.stats.verts > 40 && scene.stats.faces > 20);
  // Cao tường 2.7m: vertex OBJ y (trục cao) đạt 2.7
  const ys = scene.obj
    .split('\n')
    .filter((l) => l.startsWith('v '))
    .map((l) => Number(l.split(/\s+/)[2]));
  const maxY = Math.max(...ys);
  ok(`đỉnh tường ở 2.7m (max y = ${maxY})`, Math.abs(maxY - 2.7) < 1e-6);
  // bbox ~ 4.2 × 3.2m (tim tường + dày 200)
  ok(
    `kích thước thật ~4.2×3.2m (được ${scene.stats.sizeM.w}×${scene.stats.sizeM.d})`,
    Math.abs(scene.stats.sizeM.w - 4.2) < 0.05 && Math.abs(scene.stats.sizeM.d - 3.2) < 0.05,
  );
  ok('phòng dò được qua findHatchBoundary (≥1)', scene.stats.rooms >= 1);
  // tất định: chạy 2 lần cho cùng chuỗi (bỏ id ngẫu nhiên — obj không chứa id)
  const again = docToObjScene(demoDoc(), { wallHeightMm: 2700, theme: 'warm' });
  ok('tất định — 2 lần chạy cùng OBJ', again.obj === scene.obj && again.mtl === scene.mtl);
}

console.log('docToObjScene — biên & lỗi rõ ràng');
{
  let threw = '';
  try {
    docToObjScene({ entities: [], layers: DEFAULT_LAYERS }, {});
  } catch (e) {
    threw = e instanceof Error ? e.message : String(e);
  }
  ok('Doc trống → báo lỗi tiếng Việt rõ', threw.includes('Bản vẽ trống'));

  // chỉ có block, không tường → vẫn dựng + warning
  const onlyFurn: Doc = {
    entities: [
      { id: 'b1', type: 'block', layer: 'l-furniture', block: 'bedD', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 },
    ],
    layers: DEFAULT_LAYERS.map((l) => ({ ...l })),
  };
  const s = docToObjScene(onlyFurn, {});
  ok('không tường → vẫn ra scene + warning', s.stats.walls === 0 && s.warnings.length > 0 && s.stats.furniture === 1);
}

console.log('blockFootprint + furnitureHeightMm');
{
  const fp = blockFootprint({
    id: 'b',
    type: 'block',
    layer: 'l-furniture',
    block: 'sofa2', // 1600×900
    at: { x: 1000, y: 500 },
    rot: 0,
    sx: 1,
    sy: 1,
  });
  ok('footprint sofa2 đúng 1600×900 quanh tâm', !!fp && Math.abs(fp[1].x - fp[0].x - 1600) < 1e-6 && Math.abs(fp[2].y - fp[1].y - 900) < 1e-6);
  const fpRot = blockFootprint({
    id: 'b',
    type: 'block',
    layer: 'l-furniture',
    block: 'sofa2',
    at: { x: 0, y: 0 },
    rot: Math.PI / 2,
    sx: 1,
    sy: 1,
  });
  // xoay 90°: bề ngang trở thành 900
  ok('footprint xoay 90° đổi trục', !!fpRot && Math.abs(Math.abs(fpRot[1].y - fpRot[0].y) - 1600) < 1e-6);
  ok('block lạ → null (không crash)', blockFootprint({ id: 'b', type: 'block', layer: 'l', block: 'unknown', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 }) === null);
  ok('cao proxy: tủ áo 2100 · giường 500 · mặc định 750', furnitureHeightMm('wardrobe') === 2100 && furnitureHeightMm('bedD') === 500 && furnitureHeightMm('xyz') === 750);
}

console.log('camera — preset tất định + parse an toàn');
{
  const eye = presetCamera(CAMERA_PRESETS[0], '35mm', '16:9');
  ok('tầm mắt: cao 1.5m, 35mm', eye.heightM === 1.5 && eye.lensMm === 35 && eye.kind === 'eye');
  ok('fov 35mm ≈ 54.4°', Math.abs(fovFromLens(35) - 54.4) < 0.1);
  const wide = presetCamera(CAMERA_PRESETS[1], '50mm', '4:3');
  ok('góc rộng ép tiêu cự ≤24mm', wide.lensMm === 24 && wide.prompt.includes('wide angle'));
  const macro = presetCamera(CAMERA_PRESETS[2], '35mm', '1:1');
  ok('cận vật liệu ép ≥85mm', macro.lensMm === 85);
  ok('parse round-trip', parseCameraSpec(JSON.stringify(eye))?.lensMm === 35);
  ok('parse rác → null', parseCameraSpec('not-json') === null && parseCameraSpec('') === null);

  const placed = placeCamera({ minX: 0, minY: 0, maxX: 4000, maxY: 3000 }, eye);
  ok('đặt máy trong bbox, cao 1.5m', placed.pos[2] === 1.5 && placed.pos[0] === 2 && placed.pos[1] > 0 && placed.pos[1] < 3);
  const top = placeCamera({ minX: 0, minY: 0, maxX: 4000, maxY: 3000 }, presetCamera(CAMERA_PRESETS[3], '35mm', '16:9'));
  ok('trên cao: z ≥ 3.6m', top.pos[2] >= 3.6);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
