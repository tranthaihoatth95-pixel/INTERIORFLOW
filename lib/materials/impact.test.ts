import { computeBoq } from '../boq/compute';
import { emptyDoc, type BlockEntity, type HatchEntity, type WallType } from '../cad/model';
import { inspectMaterialImpact, replaceMaterialReferences } from './impact';

let pass = 0;
let fail = 0;
function ok(label: string, condition: boolean) {
  if (condition) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const OLD = 'spec-oak';
const NEW = 'spec-walnut';

const floor: HatchEntity = {
  id: 'floor-1', type: 'hatch', layer: 'Sàn', specId: OLD, solid: true,
  points: [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 3000 }, { x: 0, y: 3000 }],
};
const chair: BlockEntity = {
  id: 'chair-1', type: 'block', layer: 'Nội thất', block: 'chair', specId: OLD,
  at: { x: 500, y: 500 }, rot: 0, sx: 1, sy: 1,
};
const wallType: WallType = {
  id: 'wall-type-1', name: 'Tường hoàn thiện', thicknessMm: 220, kind: 'interior', specId: OLD,
  layers: [
    { name: 'Lõi', thicknessMm: 200, core: true },
    { name: 'Ốp gỗ', thicknessMm: 20, specId: OLD },
  ],
};

function fixture() {
  const doc = emptyDoc();
  doc.entities.push(floor, chair);
  doc.wallTypes = [wallType];
  return doc;
}

console.log('\n[1] kiểm kê đúng mọi nơi dùng vật liệu trong Doc');
{
  const impact = inspectMaterialImpact(fixture(), OLD);
  ok('4 tham chiếu', impact.totalReferences === 4);
  ok('đủ surface/component/wall default/wall layer',
    impact.counts.surface === 1 && impact.counts.component === 1 &&
    impact.counts['wall-default'] === 1 && impact.counts['wall-layer'] === 1);
  ok('BOQ và các đầu ra xuyên chặng được đánh dấu cần đọc lại',
    impact.consumers.boq && impact.consumers.model3d && impact.consumers.elevations &&
    impact.consumers.materialBoard && impact.consumers.presenting);
}

console.log('\n[2] thay toàn dự án là immutable và BOQ đọc mã mới');
{
  const original = fixture();
  const result = replaceMaterialReferences(original, OLD, NEW);
  ok('đổi đủ 4 tham chiếu', result.changedReferences === 4);
  ok('không sửa Doc gốc', inspectMaterialImpact(original, OLD).totalReferences === 4);
  ok('Doc mới hết mã cũ và có 4 mã mới',
    inspectMaterialImpact(result.doc, OLD).totalReferences === 0 &&
    inspectMaterialImpact(result.doc, NEW).totalReferences === 4);
  const boq = computeBoq(result.doc, [
    { id: NEW, name: 'Óc chó', unit: 'm2', priceVnd: 100, wastagePercent: 0 },
  ]);
  ok('BOQ bề mặt tự đọc mã mới', boq.rows.some((row) => row.matId === NEW && row.kind === 'area'));
}

console.log('\n[3] đổi một món không lan sang phần còn lại');
{
  const original = fixture();
  const result = replaceMaterialReferences(original, OLD, NEW, { entityIds: ['chair-1'] });
  const changedChair = result.doc.entities.find((e): e is BlockEntity => e.id === 'chair-1' && e.type === 'block');
  const unchangedFloor = result.doc.entities.find((e): e is HatchEntity => e.id === 'floor-1' && e.type === 'hatch');
  ok('chỉ đổi một tham chiếu', result.changedReferences === 1);
  ok('ghế đổi, sàn giữ',
    changedChair?.specId === NEW && unchangedFloor?.specId === OLD);
  ok('wall type không đổi theo scope entity', result.doc.wallTypes?.[0]?.specId === OLD);
}

console.log('\n[4] no-op không tạo Doc/snapshot mới');
{
  const original = fixture();
  const result = replaceMaterialReferences(original, OLD, OLD);
  ok('trả đúng object cũ', result.doc === original);
  ok('không báo thay đổi', result.changedReferences === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
