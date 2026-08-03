/**
 * lib/three/cad-to-obj.test.ts — kiểm TẦNG LÕI Bản vẽ → 3D + camera tất định. Chạy:
 *   node_modules/.bin/sucrase-node lib/three/cad-to-obj.test.ts
 */
import type { Doc, Entity, HatchEntity } from '../cad/model';
import { DEFAULT_LAYERS } from '../cad/model';
import { wallChain } from '../cad/commands';
import { docToObjScene, blockFootprint, furnitureHeightMm, cadAxesToThree, cadToThreeM, clampWallHeight } from './cad-to-obj';
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

console.log('docToObjScene — groups (nguyên liệu viewer 3D, SPEC-3D-CORE §3)');
{
  const scene = docToObjScene(demoDoc(), { wallHeightMm: 2700, theme: 'warm' });
  ok('có group tường + nội thất + sàn + phòng', scene.groups.some((g) => g.name === 'Wall_1') && scene.groups.some((g) => g.name.startsWith('Furn_1_')) && scene.groups.some((g) => g.name === 'Floor'));
  ok('mọi group có positions chia hết cho 9 (số nguyên tam giác × 3 đỉnh × 3 toạ độ)', scene.groups.every((g) => g.positions.length > 0 && g.positions.length % 9 === 0));
  ok('mọi group có colorHex hợp lệ (#rrggbb)', scene.groups.every((g) => /^#[0-9a-f]{6}$/i.test(g.colorHex)));
  const wall1 = scene.groups.find((g) => g.name === 'Wall_1')!;
  const wallYs: number[] = [];
  for (let i = 1; i < wall1.positions.length; i += 3) wallYs.push(wall1.positions[i]);
  ok('tam giác tường chạm đúng cao 2.7m (trục Y-up)', Math.max(...wallYs) - 2.7 < 1e-6 && Math.min(...wallYs) === 0);
  ok('tổng số tam giác toàn scene khớp verts/faces cùng cấp độ lớn (không rỗng, không nổ số)', scene.groups.reduce((n, g) => n + g.positions.length / 9, 0) > scene.stats.faces * 0.5);
}

console.log('docToObjScene — SPEC-TANG-DU-LIEU-CAU-KIEN §0.4/§8 Đ1: entityId cho MỌI nhóm ứng với 1 entity');
{
  const corners = [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 3000 },
    { x: 0, y: 3000 },
  ];
  const entities: Entity[] = [
    ...wallChain(corners, 200, 'l-wall', true),
    { id: 'sofa-a', type: 'block', layer: 'l-furniture', block: 'sofa2', at: { x: 1200, y: 800 }, rot: 0, sx: 1, sy: 1 },
    { id: 'win-a', type: 'block', layer: 'l-window', block: 'window', at: { x: 2000, y: 0 }, rot: 0, sx: 1, sy: 1 },
  ];
  const doc: Doc = { entities, layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
  const scene = docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' });

  const furn = scene.groups.find((g) => g.name.startsWith('Furn_'))!;
  ok('group nội thất mang đúng entityId của BlockEntity nguồn', furn.entityId === 'sofa-a');
  const win = scene.groups.find((g) => g.name.startsWith('Window_'))!;
  ok('group cửa sổ mang đúng entityId của BlockEntity nguồn', win.entityId === 'win-a');

  const floor = scene.groups.find((g) => g.name === 'Floor')!;
  ok('Floor CHƯA gán entityId — không ứng với 1 entity riêng (bbox toàn tường)', floor.entityId === undefined);
  const room = scene.groups.find((g) => g.name.startsWith('Room_'));
  ok('Room_i (nếu dò được) CHƯA gán entityId — dò lại runtime, không id bền (§0.5, chờ §6 RoomEntity)', !room || room.entityId === undefined);
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

console.log('docToObjScene — SPEC-TANG-DU-LIEU-CAU-KIEN §2.3: khai báo `elementType` thắng suy đoán (regression §0.3)');
{
  // §0.3 — mảng "tô sơn" (preset Sơn trắng: hatchPattern SOLID, solid:true) ở GIỮA phòng, layer
  // THƯỜNG (không phải l-wall) — đúng dữ liệu handleHatch() sinh khi applyMaterial('son-trang').
  // TRƯỚC vá: nhánh `|| e.pattern === 'SOLID' || e.solid === true` khiến nó bị đùn thành khối
  // tường cao 2.7m giữa phòng. SAU vá: elementType undefined + không nằm layer tường → bỏ qua.
  const paintPatch: HatchEntity = {
    id: 'paint-1',
    type: 'hatch',
    layer: 'l-furniture',
    points: [
      { x: 1500, y: 1000 },
      { x: 2500, y: 1000 },
      { x: 2500, y: 2000 },
      { x: 1500, y: 2000 },
    ],
    solid: true,
    pattern: 'SOLID',
    patternScale: 1,
    patternAngle: 0,
  };
  const doc: Doc = { entities: [...demoDoc().entities, paintPatch], layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
  const scene = docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' });
  ok('mảng sơn SOLID không trên layer tường → KHÔNG đùn khối (4 tường thật, không dư)', scene.stats.walls === 4);
  ok('không có group nào mang entityId của mảng sơn', !scene.groups.some((g) => g.entityId === 'paint-1'));

  // Khai báo elementType:'wall' rõ ràng (dù pattern KHÔNG phải SOLID, layer KHÔNG phải l-wall)
  // → vẫn PHẢI dựng thành tường — khai báo thắng suy đoán, đúng luật L3, bước 1 thang §2.3.
  const declaredWall: HatchEntity = {
    id: 'declared-wall-1',
    type: 'hatch',
    layer: 'l-furniture',
    elementType: 'wall',
    points: [
      { x: -1000, y: -1000 },
      { x: -800, y: -1000 },
      { x: -800, y: -800 },
      { x: -1000, y: -800 },
    ],
    pattern: 'ANSI31',
  };
  const doc2: Doc = { entities: [...demoDoc().entities, declaredWall], layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
  const scene2 = docToObjScene(doc2, { wallHeightMm: 2700, theme: 'warm' });
  ok('elementType:"wall" khai báo (pattern/layer khác) → VẪN dựng tường (5 tường)', scene2.stats.walls === 5);
  ok('group tường mới mang đúng entityId khai báo, KHÔNG gắn inferred', scene2.groups.some((g) => g.entityId === 'declared-wall-1' && g.inferred === undefined));

  // Khai báo elementType:null ("đã kiểm, không phải cấu kiện") trên layer tường thật + SOLID
  // → PHẢI loại khỏi tường — bước 2 thang §2.3, dừng ngay không suy đoán tiếp dù layer khớp.
  const notAWall: HatchEntity = {
    id: 'not-a-wall-1',
    type: 'hatch',
    layer: 'l-wall',
    elementType: null,
    points: [
      { x: 5000, y: 5000 },
      { x: 5200, y: 5000 },
      { x: 5200, y: 5200 },
      { x: 5000, y: 5200 },
    ],
    solid: true,
    pattern: 'SOLID',
  };
  const doc3: Doc = { entities: [...demoDoc().entities, notAWall], layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
  const scene3 = docToObjScene(doc3, { wallHeightMm: 2700, theme: 'warm' });
  ok('elementType:null trên layer tường + SOLID → VẪN loại (4 tường, không dư)', scene3.stats.walls === 4);

  // Tường CŨ không có elementType (undefined), chỉ có layer 'l-wall' (file .idf trước khi có
  // trường elementType) — phải suy đoán qua tên layer VÀ gắn cờ inferred (L4, lộ mặt suy đoán).
  const legacyDoc = demoDoc();
  const legacyWall = legacyDoc.entities.find((e) => e.type === 'hatch' && e.layer === 'l-wall') as HatchEntity;
  const sceneLegacy = docToObjScene(legacyDoc, { wallHeightMm: 2700, theme: 'warm' });
  const legacyGroup = sceneLegacy.groups.find((g) => g.entityId === legacyWall.id)!;
  ok('tường cũ (elementType chưa gán) vẫn suy đoán qua layer VÀ gắn cờ inferred', legacyGroup.inferred === true);
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

console.log('docToObjScene — heightMm riêng từng tường (3D-5 push-pull, ghi ngược Doc)');
{
  const doc = demoDoc();
  const scene0 = docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' });
  const wall1Group = scene0.groups.find((g) => g.name === 'Wall_1')!;
  ok('group tường có entityId (nối lại Doc)', typeof wall1Group.entityId === 'string' && wall1Group.entityId.length > 0);
  ok('group tường có heightMm = mặc định scene (2700) khi entity chưa gán riêng', wall1Group.heightMm === 2700);

  // Gán heightMm RIÊNG cho đúng entity đó (giả lập ghi ngược sau push-pull) — chỉ tường này đổi.
  const wall1Id = wall1Group.entityId!;
  const docPushed: Doc = { ...doc, entities: doc.entities.map((e) => (e.id === wall1Id ? { ...e, heightMm: 3400 } : e)) };
  const scene1 = docToObjScene(docPushed, { wallHeightMm: 2700, theme: 'warm' });
  const w1After = scene1.groups.find((g) => g.name === 'Wall_1')!;
  const w2After = scene1.groups.find((g) => g.name === 'Wall_2')!;
  ok('đúng tường được gán heightMm → group cao 3.4m', w1After.heightMm === 3400);
  ok('tường KHÁC không đụng — vẫn cao mặc định 2.7m (không giữ bản 3D riêng, chỉ đọc lại Doc)', w2After.heightMm === 2700);
  const w1Ys: number[] = [];
  for (let i = 1; i < w1After.positions.length; i += 3) w1Ys.push(w1After.positions[i]);
  ok('hình học tam giác tường 1 THẬT SỰ đùn tới 3.4m (không chỉ đổi field số)', Math.abs(Math.max(...w1Ys) - 3.4) < 1e-6);

  // Kẹp biên [2000,6000] — cùng khung cho mặc định scene lẫn heightMm riêng từng tường.
  const docExtreme: Doc = { ...doc, entities: doc.entities.map((e) => (e.id === wall1Id ? { ...e, heightMm: 9000 } : e)) };
  const sceneExtreme = docToObjScene(docExtreme, { wallHeightMm: 2700, theme: 'warm' });
  const wExtreme = sceneExtreme.groups.find((g) => g.name === 'Wall_1')!;
  ok('heightMm riêng vượt trần 6000 → bị kẹp lại 6000', wExtreme.heightMm === 6000);
  ok('clampWallHeight kẹp đúng 2 biên', clampWallHeight(500) === 2000 && clampWallHeight(9000) === 6000 && clampWallHeight(3000) === 3000);

  // Group không phải tường (Floor/Furn/Room) KHÔNG gán entityId/heightMm — chưa có nơi tiêu thụ.
  const floor = scene0.groups.find((g) => g.name === 'Floor')!;
  ok('group Floor không gán entityId/heightMm (chỉ tường mới có ý nghĩa push-pull)', floor.entityId === undefined && floor.heightMm === undefined);
}

console.log('cadAxesToThree/cadToThreeM — quy ước trục CAD→three.js (3D-2)');
{
  ok('hoán trục: x giữ, y→-z, z→y', JSON.stringify(cadAxesToThree(1, 2, 3)) === JSON.stringify([1, 3, -2]));
  ok('mm→m: chia 1000 sau khi hoán trục', JSON.stringify(cadToThreeM(1000, 2000, 3000)) === JSON.stringify([1, 3, -2]));
  ok('gốc toạ độ về gốc', JSON.stringify(cadToThreeM(0, 0, 0)) === JSON.stringify([0, 0, 0]));
}

console.log('docToObjScene — storey (SPEC-DUNG-3D-THONG-NHAT §5.1/D1)');
{
  // Doc mẫu KHÔNG gán storey — .idf cũ, mọi group phải undefined (không suy đoán, không bịa).
  const sceneNoStorey = docToObjScene(demoDoc(), { wallHeightMm: 2700, theme: 'warm' });
  ok('không gán storey ở Doc → mọi group storey undefined', sceneNoStorey.groups.every((g) => g.storey === undefined));

  // Gán storey cho 1 tường + 1 block — group tương ứng phải mang ĐÚNG giá trị đó, group khác
  // (Floor — hình học tổng hợp, không có 1 entity nguồn) vẫn undefined.
  const doc = demoDoc();
  const wallId = doc.entities.find((e) => e.type === 'hatch')!.id;
  const furnId = 'b1';
  const docWithStorey: Doc = {
    ...doc,
    entities: doc.entities.map((e) => {
      if (e.id === wallId) return { ...e, storey: 'GF' };
      if (e.id === furnId) return { ...e, storey: 'GF' };
      return e;
    }),
  };
  const scene = docToObjScene(docWithStorey, { wallHeightMm: 2700, theme: 'warm' });
  const wallGroup = scene.groups.find((g) => g.entityId === wallId);
  const furnGroup = scene.groups.find((g) => g.name.startsWith('Furn_1_'));
  const floorGroup = scene.groups.find((g) => g.name === 'Floor');
  ok('group tường mang đúng storey của entity gốc', wallGroup?.storey === 'GF');
  ok('group nội thất mang đúng storey của entity gốc', furnGroup?.storey === 'GF');
  ok('group Floor (hình học tổng hợp, không 1 entity nguồn) KHÔNG suy đoán storey', floorGroup?.storey === undefined);
  // Tường KHÁC (Wall_2..4) không gán storey riêng → vẫn undefined, không "lây" từ tường đã gán.
  const otherWalls = scene.groups.filter((g) => g.name.startsWith('Wall_') && g.entityId !== wallId);
  ok('tường khác không gán storey → vẫn undefined, không lây lan', otherWalls.every((g) => g.storey === undefined));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
