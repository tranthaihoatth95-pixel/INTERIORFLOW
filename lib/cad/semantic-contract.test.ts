import type { Entity } from './model';
import { derivedSpatial, spatialIdentity } from './semantic-contract';

let pass = 0;
let fail = 0;
function ok(label: string, condition: boolean) {
  if (condition) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.error(`  FAIL - ${label}`); }
}

console.log('semantic contract — identity/provenance shared 2D ↔ 3D');
const wall = {
  id: 'wall-l2-a', type: 'hatch', layer: 'l-wall', points: [],
  levelId: 'level-2', typeId: 'wall-200', elementType: 'wall',
} as Entity;
const declared = spatialIdentity(wall, 'wall', 'declared');
ok('giữ id nguồn duy nhất', declared.entityId === 'wall-l2-a');
ok('mang level/type, không sao chép bản ghi', declared.levelId === 'level-2' && declared.typeId === 'wall-200');
ok('khai báo và suy đoán phân biệt được', declared.semanticProvenance === 'declared' && spatialIdentity(wall, 'wall', 'inferred').semanticProvenance === 'inferred');
const floor = derivedSpatial('floor');
ok('hình học dẫn xuất không giả danh entity', floor.semanticKind === 'floor' && floor.semanticProvenance === 'derived' && floor.entityId === undefined);

if (fail) process.exit(1);
console.log(`PASS ${pass}/${pass + fail}`);
