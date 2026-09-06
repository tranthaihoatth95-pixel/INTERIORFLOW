import { computeBoq } from '../boq/compute';
import { emptyDoc, type BlockEntity, type HatchEntity, type WallType } from '../cad/model';
import { inspectMaterialImpact, replaceMaterialReferences, usageKey } from './impact';

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

/* ═════════ V6 (06/09) — PHẠM VI TỚI TỪNG CHỖ DÙNG, và DANH TÍNH 3D đi cùng ═════════
   Hai lỗ đo được trước lượt này: (a) phạm vi chỉ có nhị phân toàn-dự-án ↔ tập-entity, không cách
   nào nói "8 trong 12"; (b) `matId` (UUID vật liệu, thứ `lib/three/cad-to-obj.ts` đọc để tra ảnh
   vân) KHÔNG đi theo lượt thay ⇒ entity ngoài vùng chọn mang mã thương mại MỚI mà vẫn dựng vân CŨ. */

console.log('\n[5] mỗi chỗ dùng có KHOÁ riêng — hai lớp của cùng một loại tường không lẫn nhau');
{
  const impact = inspectMaterialImpact(fixture(), OLD);
  const keys = impact.usages.map((u) => u.key);
  ok('khoá không trùng nhau', new Set(keys).size === keys.length);
  ok('mặc định của loại tường và lớp ốp là HAI khoá khác nhau',
    keys.includes(usageKey('wall-default', 'wall-type-1')) && keys.includes(usageKey('wall-layer', 'wall-type-1', 1)));
}

console.log('\n[6] usageKeys — đổi ĐÚNG những chỗ được tick, không hơn không kém');
{
  const original = fixture();
  const chi2 = [usageKey('surface', 'floor-1'), usageKey('wall-layer', 'wall-type-1', 1)];
  const r = replaceMaterialReferences(original, OLD, NEW, { usageKeys: chi2 });
  ok('đổi đúng 2 trong 4 chỗ', r.changedReferences === 2);
  ok('vùng tô được tick đã đổi', (r.doc.entities[0] as HatchEntity).specId === NEW);
  ok('món rời KHÔNG tick thì đứng yên', (r.doc.entities[1] as BlockEntity).specId === OLD);
  ok('lớp ốp được tick đã đổi', r.doc.wallTypes![0].layers![1].specId === NEW);
  ok('mặc định của loại tường KHÔNG tick thì đứng yên', r.doc.wallTypes![0].specId === OLD);
  ok('còn lại đúng 2 chỗ vẫn dùng mã cũ', inspectMaterialImpact(r.doc, OLD).totalReferences === 2);
}

console.log('\n[7] usageKeys rỗng ≠ không truyền — rỗng là KHÔNG chỗ nào');
{
  const original = fixture();
  const r = replaceMaterialReferences(original, OLD, NEW, { usageKeys: [] });
  ok('không đổi chỗ nào', r.changedReferences === 0);
  ok('trả lại ĐÚNG object cũ ⇒ store không tạo nấc Undo rỗng', r.doc === original);
  ok('bốn chỗ dùng vẫn còn nguyên mã cũ', inspectMaterialImpact(r.doc, OLD).totalReferences === 4);
}

console.log('\n[8] matId đi theo lượt thay — 3D không còn dựng vân của vật liệu vừa bị bỏ');
{
  const original = fixture();
  (original.entities[0] as HatchEntity).matId = 'uuid-cu';
  (original.entities[1] as BlockEntity).matId = 'uuid-cu';

  const giuNguyen = replaceMaterialReferences(original, OLD, NEW);
  ok('KHÔNG khai matId ⇒ giữ nguyên mã đang có (mọi nơi gọi cũ chạy y như trước)',
    (giuNguyen.doc.entities[0] as HatchEntity).matId === 'uuid-cu');

  const coMoi = replaceMaterialReferences(original, OLD, NEW, {}, { matId: 'uuid-moi' });
  ok('khai matId mới ⇒ vùng tô mang UUID mới', (coMoi.doc.entities[0] as HatchEntity).matId === 'uuid-moi');
  ok('khai matId mới ⇒ món rời cũng mang UUID mới', (coMoi.doc.entities[1] as BlockEntity).matId === 'uuid-moi');

  const xoa = replaceMaterialReferences(original, OLD, NEW, {}, { matId: null });
  ok('matId null ⇒ XOÁ hẳn (3D rơi về màu phẳng — sự thật của bản ghi mới)',
    (xoa.doc.entities[0] as HatchEntity).matId === undefined);
  ok('xoá matId KHÔNG đụng specId', (xoa.doc.entities[0] as HatchEntity).specId === NEW);
  ok('Doc gốc vẫn nguyên vẹn sau cả ba lượt', (original.entities[0] as HatchEntity).matId === 'uuid-cu'
    && (original.entities[0] as HatchEntity).specId === OLD);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
