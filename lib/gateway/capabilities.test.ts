import { canOperate, capabilityFor, FORMAT_CAPABILITIES } from './capabilities';
import { detectFormat } from './detect';
import { routeFormat } from './route';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] Nhận diện định dạng nghề phổ biến không đồng nghĩa hỗ trợ');
for (const [name, expected] of [
  ['model.glb', 'glb'], ['scene.gltf', 'gltf'], ['chair.obj', 'obj'], ['chair.mtl', 'obj'],
  ['room.fbx', 'fbx'], ['house.skp', 'skp'], ['scene.max', 'max'], ['bim.ifc', 'ifc'],
  ['model.rvt', 'rvt'], ['brief.docx', 'docx'], ['movie.mp4', 'video'], ['voice.wav', 'audio'],
  ['deck.html', 'html'], ['deck.idfp', 'idfp'],
] as const) ok(`${name} → ${expected}`, detectFormat({ name }) === expected);

console.log('\n[2] Registry đủ mọi GatewayFormat và nói đúng fidelity');
ok('IDF mở/chỉnh được ở 2D', capabilityFor('idf', 'cad').import === 'editable');
ok('PPTX nhập có mất mát ở Trình bày', capabilityFor('pptx', 'present').import === 'lossy');
ok('PDF chưa nhập thành slide', capabilityFor('pdf', 'present').import === 'unavailable');
ok('DWG chưa xuất được', capabilityFor('dwg', 'cad').export === 'unavailable');
ok('ảnh là reference ở 3D', capabilityFor('image', 'render').import === 'reference');
ok('GLB được nhận diện nhưng chưa được khai import', !canOperate('glb', 'render', 'import'));
ok('mọi entry tự khai đúng key format', Object.entries(FORMAT_CAPABILITIES).every(([k, v]) => k === v.format));

console.log('\n[3] Router phải theo năng lực thật và theo đúng chặng');
ok('PPTX ở Present → import deck', routeFormat('pptx', 'present').kind === 'present-import-deck');
ok('PPTX ở CAD → unsupported', routeFormat('pptx', 'cad').kind === 'unsupported');
ok('IDFP ở Present → mở project', routeFormat('idfp', 'present').kind === 'present-open-project');
ok('PDF ở Present → unsupported, không nói dối đã nhập được', routeFormat('pdf', 'present').kind === 'unsupported');
ok('GLB ở Render → unsupported có lý do', (() => {
  const r = routeFormat('glb', 'render');
  return r.kind === 'unsupported' && Boolean(r.reason);
})());

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
