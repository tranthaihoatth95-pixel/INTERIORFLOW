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

console.log('resolveGroupGeometry — VIỆC 1 (nối arrayLinear thật): nhân bản N lần, dịch theo (dx,dy,dz) mm');
{
  const postPoly = [
    { x: -30, y: -30 },
    { x: 30, y: -30 },
    { x: 30, y: 30 },
    { x: -30, y: 30 },
  ];
  const postPositions = boxPositionsMm(postPoly, 0, 900);
  const groupArrayed: SceneGroup = {
    name: 'Wall_9', colorHex: '#e8e4dc', positions: postPositions, entityId: 'post-1', heightMm: 900,
    ops: [{ op: 'arrayLinear', n: 5, dx: 300, dy: 0, dz: 0 }],
  };
  const plain = geometryOf(postPositions);
  const resolved = resolveGroupGeometry(groupArrayed);
  ok('n=5 bản ⇒ 5× số vertex bản gốc', resolved.attributes.position.count === plain.attributes.position.count * 5);

  // Bản đầu (i=0) giữ NGUYÊN vị trí gốc (không dịch) — dò vertex x=-0.03 (mm→m của -30) còn tồn tại.
  const xs: number[] = [];
  for (let i = 0; i < resolved.attributes.position.count; i++) xs.push(resolved.attributes.position.getX(i));
  ok('bản đầu KHÔNG dịch (còn x=-0.03m gốc)', xs.some((x) => Math.abs(x - -0.03) < 1e-6));
  // dx=300mm CAD (trục X) → three.js X cũng +0.3m/bản (cadToThreeM giữ trục X) — bản cuối (i=4)
  // dịch 4×0.3=1.2m, vertex x=-30mm gốc trở thành -30mm+1200mm=1170mm=1.17m.
  ok('bản cuối (i=4) dịch đúng 4×300mm=1.2m theo trục X', xs.some((x) => Math.abs(x - 1.17) < 1e-6));
}

console.log('resolveGroupGeometry — arrayLinear n<=1 KHÔNG đổi hình (bỏ qua, đúng "n<=1 = tắt mảng")');
{
  const wallPositions2 = boxPositionsMm(wallPoly, 0, 2700);
  const groupN1: SceneGroup = {
    name: 'Wall_8', colorHex: '#e8e4dc', positions: wallPositions2, entityId: 'wall-8', heightMm: 2700,
    ops: [{ op: 'arrayLinear', n: 1, dx: 300, dy: 0, dz: 0 }],
  };
  const plain = geometryOf(wallPositions2);
  const resolved = resolveGroupGeometry(groupN1);
  ok('n=1 giữ nguyên số vertex (không nhân bản)', resolved.attributes.position.count === plain.attributes.position.count);
}

console.log('resolveGroupGeometry — arrayLinear + boolean cùng lúc: khoét TRƯỚC rồi mới nhân bản');
{
  const groupBoth: SceneGroup = {
    ...groupWithOps, // đã có ops:[boolean subtract] + opCutters ở trên
    ops: [...groupWithOps.ops!, { op: 'arrayLinear', n: 3, dx: 0, dy: 0, dz: 1000 }],
  };
  const booleanOnly = resolveGroupGeometry(groupWithOps);
  const both = resolveGroupGeometry(groupBoth);
  ok('kết quả 3× số vertex của bản ĐÃ khoét (không phải khoét sau khi nhân 3)', both.attributes.position.count === booleanOnly.attributes.position.count * 3);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
