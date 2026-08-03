/**
 * lib/three/build-ops.test.ts — NC-12 §4.3/VIỆC 3: `resolveGroupGeometry` (áp `ops` boolean lên
 * `SceneGroup`, cache runtime theo entityId+hash). Chạy:
 *   node_modules/.bin/sucrase-node lib/three/build-ops.test.ts
 */
import { boxPositionsMm } from './cad-to-obj';
import type { SceneGroup } from './cad-to-obj';
import { resolveGroupGeometry, geometryOf } from './build-ops';

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

const wallPoly = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 200 },
  { x: 0, y: 200 },
];
const wallPositions = boxPositionsMm(wallPoly, 0, 2700);

const cutterPoly = [
  { x: 1700, y: -20 },
  { x: 2300, y: -20 },
  { x: 2300, y: 220 },
  { x: 1700, y: 220 },
];
const cutterPositions = boxPositionsMm(cutterPoly, 0, 1200);

const groupNoOps: SceneGroup = { name: 'Wall_1', colorHex: '#e8e4dc', positions: wallPositions, entityId: 'wall-1', heightMm: 2700 };
const groupWithOps: SceneGroup = {
  ...groupNoOps,
  ops: [{ op: 'boolean', kind: 'subtract', withRef: 'cutter-1' }],
  opCutters: { 'cutter-1': cutterPositions },
};

console.log('resolveGroupGeometry — group KHÔNG có ops đi thẳng qua geometryOf, không đổi hình');
{
  const plain = geometryOf(wallPositions);
  const resolved = resolveGroupGeometry(groupNoOps);
  ok('cùng số vertex với geometryOf trực tiếp', resolved.attributes.position.count === plain.attributes.position.count);
}

console.log('resolveGroupGeometry — group có ops boolean chạy CSG thật, hình học ĐỔI');
{
  const plain = geometryOf(wallPositions);
  const resolved = resolveGroupGeometry(groupWithOps);
  ok('số vertex khác bản KHÔNG khoét (có thêm mặt hốc)', resolved.attributes.position.count !== plain.attributes.position.count);
}

console.log('resolveGroupGeometry — cache: gọi 2 lần CÙNG group trả ĐÚNG 1 instance (không tính lại)');
{
  const a = resolveGroupGeometry(groupWithOps);
  const b = resolveGroupGeometry(groupWithOps);
  ok('cùng instance BufferGeometry (cache hit)', a === b);
}

console.log('resolveGroupGeometry — entityId khác nhau KHÔNG dùng nhầm cache của nhau');
{
  const groupOtherWall: SceneGroup = { ...groupWithOps, entityId: 'wall-2' };
  const a = resolveGroupGeometry(groupWithOps);
  const b = resolveGroupGeometry(groupOtherWall);
  ok('kết quả tách biệt (không phải cùng object do trùng cache key)', a !== b);
  ok('nhưng hình dạng vẫn đúng — cùng số vertex vì cùng dữ liệu nguồn', a.attributes.position.count === b.attributes.position.count);
}

console.log('resolveGroupGeometry — withRef không tra được cutter: bỏ qua bậc đó, KHÔNG sập');
{
  const groupMissingCutter: SceneGroup = {
    ...groupNoOps,
    entityId: 'wall-3',
    ops: [{ op: 'boolean', kind: 'subtract', withRef: 'khong-ton-tai' }],
    opCutters: {},
  };
  let threw = false;
  let resolved: ReturnType<typeof resolveGroupGeometry> | null = null;
  try {
    resolved = resolveGroupGeometry(groupMissingCutter);
  } catch {
    threw = true;
  }
  ok('không throw', !threw);
  ok('giữ nguyên hình học gốc (bậc thiếu dữ liệu bị bỏ qua)', resolved !== null && resolved.attributes.position.count === geometryOf(wallPositions).attributes.position.count);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
