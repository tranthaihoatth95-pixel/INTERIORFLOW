import { inspectObjText } from './glb-import';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function main() {
  console.log('\n[OBJ] OBJ/MTL → dữ liệu tam giác IF');
  const obj = [
    'o Triangle',
    'v 0 0 0',
    'v 2 0 0',
    'v 0 3 0',
    'usemtl MAT',
    'f 1 2 3',
  ].join('\n');
  const inspected = inspectObjText(obj);
  ok('đếm đúng 3 vertex', inspected.vertices === 3);
  ok('đếm đúng một face', inspected.faces === 1);
  ok('không bịa MTL khi OBJ không khai', inspected.materialLibs.length === 0);
  ok('đọc tên MTL được khai', inspectObjText(`mtllib chair.mtl\n${obj}`).materialLibs[0] === 'chair.mtl');
  const invalid = inspectObjText('# comment only');
  ok('OBJ không có hình học bị nhận diện trước loader', invalid.vertices === 0 && invalid.faces === 0);

  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
