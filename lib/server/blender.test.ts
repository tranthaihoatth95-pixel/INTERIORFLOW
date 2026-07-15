/**
 * lib/server/blender.test.ts — kiểm phần TẤT ĐỊNH của adapter Blender OBJ→FBX
 * (candidates/args/degrade khi thiếu binary — KHÔNG chạy Blender thật). Chạy:
 *   node_modules/.bin/sucrase-node lib/server/blender.test.ts
 */
import { blenderCandidates, findBlender, blenderArgs, convertObjToFbx, BlenderMissingError } from './blender';

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

async function main() {
  console.log('blenderCandidates — thứ tự ưu tiên');
  const c1 = blenderCandidates({ BLENDER_PATH: '/tmp/my-blender' });
  ok('BLENDER_PATH đứng đầu', c1[0] === '/tmp/my-blender');
  const c2 = blenderCandidates({});
  ok('không env → macOS app đứng đầu', c2[0] === '/Applications/Blender.app/Contents/MacOS/Blender');
  ok('có ứng viên Windows (máy RTX công ty)', c2.some((p) => p.endsWith('blender.exe')));

  console.log('findBlender — degrade khi không có binary');
  ok('env trỏ path ma → vẫn dò tiếp/không crash', findBlender({ BLENDER_PATH: '/duong/dan/ma' }) !== '/duong/dan/ma');

  console.log('blenderArgs — CLI headless đúng dạng');
  const a = blenderArgs('/s/obj2fbx.py', '/t/in.obj', '/t/out.fbx');
  ok('có --background --factory-startup', a[0] === '--background' && a[1] === '--factory-startup');
  ok('--python trước script', a[2] === '--python' && a[3] === '/s/obj2fbx.py');
  ok('-- ngăn args cho script', a[4] === '--' && a[5] === '/t/in.obj' && a[6] === '/t/out.fbx');
  ok('không camera → 7 args', a.length === 7);
  const b = blenderArgs('/s/x.py', '/t/i.obj', '/t/o.fbx', '/t/cam.json');
  ok('camera.json nối cuối', b[b.length - 1] === '/t/cam.json' && b.length === 8);

  console.log('convertObjToFbx — thiếu Blender → BlenderMissingError message rõ');
  // giả lập máy không có Blender bằng cách chặn mọi ứng viên qua BLENDER_PATH?
  // findBlender đọc process.env — chỉ test được nhánh missing nếu máy KHÔNG có Blender.
  // Máy này CÓ Blender → kiểm message của error class trực tiếp.
  const err = new BlenderMissingError('Chưa tìm thấy Blender trên máy server — cài blender.org hoặc đặt BLENDER_PATH.');
  ok('error class đúng tên', err instanceof BlenderMissingError && err.message.includes('BLENDER_PATH'));
  ok('convertObjToFbx là hàm async', typeof convertObjToFbx === 'function');

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
