/**
 * lib/three/build-recipe.test.ts — Đợt 4 (12/08), phiếu `docs/phieu-giao/build-recipe.md` mục ⑥.
 * `evalRecipe`/`resolveSceneGroupGeometry` — ngăn xếp có thứ tự, bật/tắt, cờ lỗi từng bước; +
 * round-trip `Doc` có `recipe` qua `exportIdf`/`importIdf` (cơ chế serialize/deserialize hiện có,
 * KHÔNG viết đường mới). Chạy:
 *   node_modules/.bin/sucrase-node lib/three/build-recipe.test.ts
 */
import { boxPositionsMm } from './cad-to-obj';
import type { SceneGroup } from './cad-to-obj';
import { evalRecipe, resolveSceneGroupGeometry, type BuildRecipeStep } from './build-recipe';
import { geometryOf } from './build-ops';
import { emptyDoc, type Doc, type HatchEntity } from '../cad/model';
import { exportIdf, importIdf } from '../cad/idf';

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

const wallPoly = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 200 },
  { x: 0, y: 200 },
];
const wallPositions = boxPositionsMm(wallPoly, 0, 2700);

const cutterPoly = [
  { x: 1700, y: -20 },
  { x: 2300, y: -20 },
  { x: 2300, y: 220 },
  { x: 1700, y: 220 },
];
const cutterPositions = boxPositionsMm(cutterPoly, 0, 1200);

console.log('evalRecipe — recipe RỖNG: trả đúng geometryOf(positions), 0 stepErrors');
{
  const { geometry, stepErrors } = evalRecipe({ positions: wallPositions }, []);
  const plain = geometryOf(wallPositions);
  ok('cùng số vertex geometryOf trực tiếp', geometry.attributes.position.count === plain.attributes.position.count);
  ok('0 stepErrors', Object.keys(stepErrors).length === 0);
}

console.log('evalRecipe — bước disabled KHÔNG tác dụng gì (giữ nguyên base)');
{
  const steps: BuildRecipeStep[] = [
    { id: 's1', enabled: false, op: { op: 'arrayLinear', n: 5, dx: 300, dy: 0, dz: 0 } },
  ];
  const { geometry, stepErrors } = evalRecipe({ positions: wallPositions }, steps);
  const plain = geometryOf(wallPositions);
  ok('bước tắt bị bỏ qua — số vertex KHÔNG nhân 5', geometry.attributes.position.count === plain.attributes.position.count);
  ok('bước tắt không sinh stepErrors', Object.keys(stepErrors).length === 0);
}

console.log('evalRecipe — THỨ TỰ MẢNG là thứ tự áp dụng thật (khác resolveGroupGeometry ưu tiên theo loại)');
{
  const mirrorFirst: BuildRecipeStep[] = [
    { id: 'a', enabled: true, op: { op: 'mirror', axis: 'x', atMm: 0 } },
    { id: 'b', enabled: true, op: { op: 'arrayLinear', n: 3, dx: 500, dy: 0, dz: 0 } },
  ];
  const arrayFirst: BuildRecipeStep[] = [
    { id: 'a', enabled: true, op: { op: 'arrayLinear', n: 3, dx: 500, dy: 0, dz: 0 } },
    { id: 'b', enabled: true, op: { op: 'mirror', axis: 'x', atMm: 0 } },
  ];
  const r1 = evalRecipe({ positions: wallPositions }, mirrorFirst);
  const r2 = evalRecipe({ positions: wallPositions }, arrayFirst);
  ok('cùng số vertex (mirror ×2, array ×3 — giao hoán được số lượng)', r1.geometry.attributes.position.count === r2.geometry.attributes.position.count);
  const xsOf = (g: typeof r1.geometry) => {
    const xs: number[] = [];
    for (let i = 0; i < g.attributes.position.count; i++) xs.push(Math.round(g.attributes.position.getX(i) * 1000));
    return xs.sort((a, b) => a - b);
  };
  const xs1 = xsOf(r1.geometry);
  const xs2 = xsOf(r2.geometry);
  const sameOrder = xs1.length === xs2.length && xs1.every((v, i) => v === xs2[i]);
  ok('mirror-trước-array KHÔNG cho cùng tập toạ độ với array-trước-mirror (thứ tự đổi hình dạng)', !sameOrder);
}

console.log('evalRecipe — boolean thiếu cutter: stepError riêng bước đó, KHÔNG throw, các bước SAU vẫn chạy');
{
  const steps: BuildRecipeStep[] = [
    { id: 'cut', enabled: true, op: { op: 'boolean', kind: 'subtract', withRef: 'khong-ton-tai' } },
    { id: 'arr', enabled: true, op: { op: 'arrayLinear', n: 2, dx: 5000, dy: 0, dz: 0 } },
  ];
  let threw = false;
  let result: ReturnType<typeof evalRecipe> | null = null;
  try {
    result = evalRecipe({ positions: wallPositions, opCutters: {} }, steps);
  } catch {
    threw = true;
  }
  ok('không throw', !threw);
  ok('stepErrors chỉ ghi ĐÚNG bước "cut", không đụng "arr"', !!result && Object.keys(result.stepErrors).length === 1 && 'cut' in result.stepErrors && !('arr' in result.stepErrors));
  const plain = geometryOf(wallPositions);
  ok('bước boolean lỗi bị bỏ qua nhưng bước array SAU vẫn chạy (×2)', !!result && result.geometry.attributes.position.count === plain.attributes.position.count * 2);
}

console.log('evalRecipe — boolean CÓ cutter hợp lệ: hình học đổi, 0 lỗi');
{
  const steps: BuildRecipeStep[] = [
    { id: 'cut', enabled: true, op: { op: 'boolean', kind: 'subtract', withRef: 'cutter-1' } },
  ];
  const { geometry, stepErrors } = evalRecipe({ positions: wallPositions, opCutters: { 'cutter-1': cutterPositions } }, steps);
  const plain = geometryOf(wallPositions);
  ok('0 stepErrors', Object.keys(stepErrors).length === 0);
  ok('số vertex khác bản KHÔNG khoét (có thêm mặt hốc)', geometry.attributes.position.count !== plain.attributes.position.count);
}

console.log('evalRecipe — 2 bậc thay-hình-gốc (taper/bevelEx/…) cùng bật: bậc THỨ 2 bị coi là LỖI (khác N4 lặng lẽ của resolveGroupGeometry)');
{
  const leg = [
    { x: -30, y: -30 },
    { x: 30, y: -30 },
    { x: 30, y: 30 },
    { x: -30, y: 30 },
  ];
  const steps: BuildRecipeStep[] = [
    { id: 't1', enabled: true, op: { op: 'taper', polyMm: leg, topInsetMm: 10 } },
    { id: 't2', enabled: true, op: { op: 'bevelEx', polyMm: leg, radiusMm: 5, segments: 2, edges: 'top' } },
  ];
  const { stepErrors } = evalRecipe({ positions: [], baseMm: 0, heightMm: 700 }, steps);
  ok('bậc thứ 2 (t2) bị flag lỗi', 't2' in stepErrors);
  ok('bậc đầu (t1) KHÔNG lỗi', !('t1' in stepErrors));
}

console.log('evalRecipe — tham số sai (n<1) bị flag lỗi, KHÔNG âm thầm ship geometry sai');
{
  const steps: BuildRecipeStep[] = [
    { id: 'bad', enabled: true, op: { op: 'arrayLinear', n: 0, dx: 100, dy: 0, dz: 0 } },
  ];
  const { geometry, stepErrors } = evalRecipe({ positions: wallPositions }, steps);
  ok('bước n=0 bị flag lỗi', 'bad' in stepErrors);
  const plain = geometryOf(wallPositions);
  ok('geometry giữ nguyên base (không nhân bản sai)', geometry.attributes.position.count === plain.attributes.position.count);
}

console.log('resolveSceneGroupGeometry — recipe có bước BẬT THẮNG ops[] cũ (ngăn xếp mới ưu tiên)');
{
  const g: SceneGroup = {
    name: 'Wall_recipe', colorHex: '#e8e4dc', positions: wallPositions, entityId: 'wall-r1', heightMm: 2700,
    ops: [{ op: 'arrayLinear', n: 9, dx: 100, dy: 0, dz: 0 }], // nếu đọc nhầm ops thay vì recipe, ra ×9
    recipe: { steps: [{ id: 's1', enabled: true, op: { op: 'arrayLinear', n: 3, dx: 500, dy: 0, dz: 0 } }] },
  };
  const resolved = resolveSceneGroupGeometry(g);
  const plain = geometryOf(wallPositions);
  ok('đọc theo recipe (×3), KHÔNG theo ops[] cũ (×9)', resolved.attributes.position.count === plain.attributes.position.count * 3);
}

console.log('resolveSceneGroupGeometry — recipe THIẾU hoặc TOÀN BỘ bước tắt: lùi về ops[]/resolveGroupGeometry cũ, tương thích ngược');
{
  const gNoRecipe: SceneGroup = {
    name: 'Wall_legacy', colorHex: '#e8e4dc', positions: wallPositions, entityId: 'wall-legacy', heightMm: 2700,
    ops: [{ op: 'arrayLinear', n: 4, dx: 200, dy: 0, dz: 0 }],
  };
  const plain = geometryOf(wallPositions);
  ok('không có recipe ⇒ vẫn chạy ops[] cũ (×4)', resolveSceneGroupGeometry(gNoRecipe).attributes.position.count === plain.attributes.position.count * 4);

  const gAllDisabled: SceneGroup = {
    ...gNoRecipe,
    entityId: 'wall-legacy-2',
    recipe: { steps: [{ id: 's1', enabled: false, op: { op: 'arrayLinear', n: 99, dx: 1, dy: 0, dz: 0 } }] },
  };
  ok('recipe toàn bộ tắt ⇒ vẫn lùi về ops[] cũ (×4), không phải ×99 hay ×1', resolveSceneGroupGeometry(gAllDisabled).attributes.position.count === plain.attributes.position.count * 4);
}

console.log('resolveSceneGroupGeometry — không ops, không recipe: đi thẳng geometryOf, không đổi hình');
{
  const g: SceneGroup = { name: 'Wall_plain', colorHex: '#e8e4dc', positions: wallPositions };
  const plain = geometryOf(wallPositions);
  ok('cùng số vertex', resolveSceneGroupGeometry(g).attributes.position.count === plain.attributes.position.count);
}

console.log('ROUND-TRIP — Doc có entity.recipe qua exportIdf/importIdf (cơ chế serialize hiện có, lib/cad/idf.ts)');
{
  const doc: Doc = emptyDoc();
  const wallLayer = doc.layers[0].id;
  const hatch: HatchEntity = {
    id: 'wall-with-recipe-1',
    type: 'hatch',
    layer: wallLayer,
    points: wallPoly,
    pattern: 'SOLID',
    heightMm: 2700,
    recipe: {
      steps: [
        { id: 's1', enabled: true, op: { op: 'arrayLinear', n: 3, dx: 500, dy: 0, dz: 0 }, label: 'Cột lặp' },
        { id: 's2', enabled: false, op: { op: 'mirror', axis: 'x', atMm: 0 } },
      ],
    },
  };
  doc.entities.push(hatch);
  const json = exportIdf([{ id: 's1', name: 'Bản vẽ 1', doc }]);
  const parsed = importIdf(json);
  const back = parsed?.sheets[0].doc.entities.find((e) => e.id === 'wall-with-recipe-1') as HatchEntity | undefined;
  ok('round-trip: entity còn recipe', !!back?.recipe);
  ok('round-trip: đủ 2 bước, ĐÚNG thứ tự', back?.recipe?.steps.length === 2 && back.recipe.steps[0].id === 's1' && back.recipe.steps[1].id === 's2');
  ok('round-trip: enabled/label/op giữ nguyên bước 1', back?.recipe?.steps[0].enabled === true && back.recipe.steps[0].label === 'Cột lặp' && back.recipe.steps[0].op.op === 'arrayLinear');
  ok('round-trip: bước 2 giữ enabled=false', back?.recipe?.steps[1].enabled === false);

  // .idf CŨ (không recipe) vẫn mở được — additive/optional, không migrate.
  const legacyDoc: Doc = emptyDoc();
  const legacyLayer = legacyDoc.layers[0].id;
  legacyDoc.entities.push({ id: 'wall-legacy', type: 'hatch', layer: legacyLayer, points: wallPoly, pattern: 'SOLID', heightMm: 2700 } as HatchEntity);
  const legacyBack = importIdf(exportIdf([{ id: 's1', name: 'Bản vẽ 1', doc: legacyDoc }]));
  const legacyEntity = legacyBack?.sheets[0].doc.entities.find((e) => e.id === 'wall-legacy') as HatchEntity | undefined;
  ok('.idf cũ không có recipe → parse sạch, field undefined', !!legacyEntity && legacyEntity.recipe === undefined);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
