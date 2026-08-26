/**
 * lib/gateway/upload.test.ts — planUpload MỘT CỬA NHẬN (R6 19/08).
 * Chạy: node_modules/.bin/sucrase-node lib/gateway/upload.test.ts
 */
import { planUpload } from './upload';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] phân loại theo Format Router — không taxonomy riêng');
ok('ảnh raster → format image, đủ 3 chặng nhập được', (() => {
  const p = planUpload({ name: 'moodboard.jpg' });
  return p.format === 'image' && p.importableStages.length === 3;
})());
ok('pdf → present nhập được (Smart Convert bậc 1)', (() => {
  const p = planUpload({ name: 'ho-so.pdf' });
  return p.format === 'pdf' && p.importableStages.includes('present');
})());
ok('dxf → chỉ chặng cad', (() => {
  const p = planUpload({ name: 'mat-bang.dxf' });
  return p.format === 'dxf' && p.importableStages.length === 1 && p.importableStages[0] === 'cad';
})());
ok('glb → chỉ chặng render', (() => {
  const p = planUpload({ name: 'chair.glb' });
  return p.format === 'glb' && p.importableStages.length === 1 && p.importableStages[0] === 'render';
})());

console.log('\n[2] loại chưa xử lý được → nói thật, không im lặng');
ok('video → 0 chặng nhập được + có note', (() => {
  const p = planUpload({ name: 'walkthrough.mp4' });
  return p.format === 'video' && p.importableStages.length === 0 && !!p.note;
})());
ok('unknown → 0 chặng + note "không nhận diện"', (() => {
  const p = planUpload({ name: 'la.xyz' });
  return p.format === 'unknown' && p.importableStages.length === 0 && !!p.note;
})());
ok('có importableStages thì KHÔNG kèm note (note chỉ dành cho ca bí)', planUpload({ name: 'a.png' }).note === undefined);

console.log('\n[3] magic byte thắng đuôi khi có bytes');
ok('file .png ruột %PDF → pdf', (() => {
  const p = planUpload({ name: 'gia.png', bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) });
  return p.format === 'pdf';
})());

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
