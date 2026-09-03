/**
 * lib/idfc-import/units-axis.test.ts — kiểm số khai + đối chiếu mesh↔số khai: chỉ báo lệch, không sửa.
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/units-axis.test.ts
 */
import { checkMeshAgainstDeclared, glbBoundsToMm, validateDimsMm, type BoundsMm } from './units-axis';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const codes = (xs: { code: string }[]) => xs.map((x) => x.code);

console.log('units-axis: validateDimsMm');
{
  ok('thiếu hết ⇒ 0 lỗi (thiếu là hợp lệ)', validateDimsMm({}).length === 0);
  ok('số hợp lệ ⇒ 0 lỗi', validateDimsMm({ wMm: 600, dMm: 600, hMm: 750 }).length === 0);
  ok('NaN ⇒ dim-not-finite', codes(validateDimsMm({ wMm: NaN })).includes('dim-not-finite'));
  ok('Infinity ⇒ dim-not-finite', codes(validateDimsMm({ hMm: Infinity })).includes('dim-not-finite'));
  ok('0 ⇒ dim-not-positive', codes(validateDimsMm({ dMm: 0 })).includes('dim-not-positive'));
  ok('âm ⇒ dim-not-positive', codes(validateDimsMm({ dMm: -5 })).includes('dim-not-positive'));
  ok('60000 mm ⇒ dim-out-of-range (nghi sai đơn vị)', codes(validateDimsMm({ wMm: 60_000 })).includes('dim-out-of-range'));
  ok('0.5 mm ⇒ dim-out-of-range', codes(validateDimsMm({ wMm: 0.5 })).includes('dim-out-of-range'));
  ok('mọi lỗi số khai là error', validateDimsMm({ wMm: NaN, dMm: 0, hMm: 99_999 }).every((i) => i.level === 'error'));
}

console.log('units-axis: glbBoundsToMm');
{
  const b = glbBoundsToMm({ min: [-0.3, 0, -0.3], max: [0.3, 0.75, 0.3], basis: 'scene' });
  ok('mét → mm đúng', !!b && b.xMm === 600 && b.yMm === 750 && b.zMm === 600);
  ok('min/max mm', !!b && b.minMm[0] === -300 && b.maxMm[1] === 750);
  ok('hộp suy biến (max<min) ⇒ null', glbBoundsToMm({ min: [1, 0, 0], max: [0, 1, 1], basis: 'scene' }) === null);
  ok('NaN ⇒ null', glbBoundsToMm({ min: [NaN, 0, 0], max: [1, 1, 1], basis: 'scene' }) === null);
}

const box = (x: number, y: number, z: number): BoundsMm => ({ xMm: x, yMm: y, zMm: z, minMm: [0, 0, 0], maxMm: [x, y, z] });

console.log('units-axis: checkMeshAgainstDeclared — khớp');
{
  ok('khớp trong 5% ⇒ 0 issue', checkMeshAgainstDeclared(box(600, 750, 600), { wMm: 610, dMm: 590, hMm: 760 }).length === 0);
  ok('không khai gì + mesh trong dải ⇒ 0 issue', checkMeshAgainstDeclared(box(600, 750, 600), {}).length === 0);
  ok('không khai gì + mesh 80m ⇒ implausible', codes(checkMeshAgainstDeclared(box(80_000, 750, 600), {})).includes('mesh-scale-implausible'));
  ok('không khai gì + mesh 0.6 mm (dựng bằng mét khai mm?) ⇒ implausible', codes(checkMeshAgainstDeclared(box(0.6, 0.75, 0.6), {})).includes('mesh-scale-implausible'));
}

console.log('units-axis: checkMeshAgainstDeclared — lệch đơn vị');
{
  // mesh dựng bằng mm nhưng khai là mét ⇒ hộp bao đọc ra to 1000 lần
  const r = checkMeshAgainstDeclared(box(600_000, 750_000, 600_000), { wMm: 600, dMm: 600, hMm: 750 });
  ok('lệch ×0.001 ⇒ mesh-scale-mismatch', codes(r).includes('mesh-scale-mismatch'));
  ok('nêu hệ số nghi ngờ 0.001', r[0]?.detail?.suspectFactor === 0.001);
  const r2 = checkMeshAgainstDeclared(box(0.6, 0.75, 0.6), { wMm: 600, dMm: 600, hMm: 750 });
  ok('lệch ×1000 ⇒ nêu hệ số 1000 (mesh nhỏ 1000 lần)', r2[0]?.detail?.suspectFactor === 1000);
  const inch = checkMeshAgainstDeclared(box(600 / 25.4, 750 / 25.4, 600 / 25.4), { wMm: 600, dMm: 600, hMm: 750 });
  ok('lệch ×25.4 ⇒ nêu inch', inch[0]?.detail?.suspectFactor === 25.4);
  const odd = checkMeshAgainstDeclared(box(600, 750, 900), { wMm: 600, dMm: 600, hMm: 750 });
  ok('lệch không đều ⇒ mismatch không nêu hệ số', codes(odd).includes('mesh-scale-mismatch') && odd[0]?.detail?.suspectFactor === undefined);
  ok('mọi lệch là error (biểu diễn 3D không dùng được)', [...r, ...r2, ...inch, ...odd].every((i) => i.level === 'error'));
}

console.log('units-axis: checkMeshAgainstDeclared — lệch trục');
{
  // mesh Z-up: cao 750 nằm ở trục z, sâu 600 ở trục y
  const r = checkMeshAgainstDeclared(box(600, 600, 750), { wMm: 600, dMm: 600, hMm: 750 });
  ok('h khớp z, d khớp y ⇒ axis-mismatch-likely', codes(r).includes('axis-mismatch-likely'));
  ok('không báo thêm scale-mismatch cho cùng ca', !codes(r).includes('mesh-scale-mismatch'));
  const r2 = checkMeshAgainstDeclared(box(600, 600, 750), { wMm: 600, hMm: 750 });
  ok('thiếu d nhưng h khớp z ⇒ vẫn nghi lệch trục', codes(r2).includes('axis-mismatch-likely'));
  const z = checkMeshAgainstDeclared(box(600, 750, 600), { wMm: 600, dMm: 600, hMm: 750 }, { upAxisDeclared: 'Z' });
  ok('khai Z-up ⇒ axis-declared-z-up dù mesh khớp', codes(z).includes('axis-declared-z-up'));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
