import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { gltfDependencyUris, objectToScene3D, resolveGltfResource } from './glb-import';

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

console.log('\n[glTF bundle] Ghép URI với file phụ');
const resources = [
  { name: 'model.bin', dataUrl: 'data:application/octet-stream;base64,AA==' },
  { name: 'wood.png', dataUrl: 'data:image/png;base64,AA==' },
];
ok('khớp chính xác file .bin', resolveGltfResource('model.bin', resources) === resources[0].dataUrl);
ok('đường dẫn thư mục rơi về basename duy nhất', resolveGltfResource('textures/wood.png', resources) === resources[1].dataUrl);
ok('data URI nhúng đi thẳng, không cần file phụ', resolveGltfResource('data:image/png;base64,AA==', resources) === 'data:image/png;base64,AA==');
ok('thiếu file phụ → null', resolveGltfResource('missing.bin', resources) === null);
ok('basename trùng nhau → từ chối đoán', resolveGltfResource('textures/wood.png', [...resources, { name: 'other/wood.png', dataUrl: 'data:x' }]) === null);
ok('đọc đúng URI buffer + ảnh, bỏ field khác', JSON.stringify(gltfDependencyUris({
  buffers: [{ uri: 'model.bin' }], images: [{ uri: 'textures/wood.png' }, { bufferView: 2 }], extras: { uri: 'ignore.me' },
})) === JSON.stringify(['model.bin', 'textures/wood.png']));
ok('URI lặp chỉ kiểm một lần', gltfDependencyUris({ buffers: [{ uri: 'same.bin' }], images: [{ uri: 'same.bin' }] }).length === 1);

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
