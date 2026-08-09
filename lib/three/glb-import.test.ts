import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { objectToScene3D } from './glb-import';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[GLB] Scene glTF → dữ liệu tam giác IF');
const root = new Group();
const mesh = new Mesh(new BoxGeometry(2, 3, 4), new MeshStandardMaterial({ color: '#336699' }));
mesh.name = 'Cabinet';
mesh.position.set(5, 1.5, -2);
root.add(mesh);

const result = objectToScene3D(root);
ok('giữ một mesh thành một SceneGroup', result.meshes === 1 && result.scene.groups.length === 1);
ok('box có 12 tam giác', result.triangles === 12 && result.scene.groups[0].positions.length === 108);
ok('bake transform node vào bounds thế giới', result.scene.bboxMm.minX === 4000 && result.scene.bboxMm.maxX === 6000);
ok('đổi bounds X/Z sang mm, giữ kích thước mét', result.scene.sizeM.w === 2 && result.scene.sizeM.d === 4 && result.scene.sizeM.h === 3);
ok('giữ màu nền vật liệu', result.scene.groups[0].colorHex === '#336699');
ok('đếm material, không bịa texture', result.materials === 1 && result.textures === 0);

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
