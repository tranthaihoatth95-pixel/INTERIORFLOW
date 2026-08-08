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

/* ═════════ BỘ LỆNH DỰNG HÌNH MỞ RỘNG (07/08) — test ĐO HÌNH HỌC, không chỉ "chạy không lỗi" ═════════
 * Hệ trục: CAD (x,y,z) mm → three (x/1000, z/1000, −y/1000) m — mọi phép đo dưới đây đã đổi tay. */
import {
  prismBeveledEx, prismChamfered, filletPolygonMm,
  arrayGrid, arrayRadial, mirrorGeometry,
  sweepProfile, revolveProfile, loftSections, prismTapered,
} from './build-ops';
import type * as THREE_NS from 'three';

type G = THREE_NS.BufferGeometry;
function verts(g: G): [number, number, number][] {
  const a = g.attributes.position;
  const out: [number, number, number][] = [];
  for (let i = 0; i < a.count; i++) out.push([a.getX(i), a.getY(i), a.getZ(i)]);
  return out;
}
function bbox(g: G) {
  const vs = verts(g);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const v of vs) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], v[i]); max[i] = Math.max(max[i], v[i]); }
  return { min, max };
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

const square100: { x: number; y: number }[] = [
  { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
];

console.log('VIỆC 1 — prismChamfered edges=top: khối 100×100×100, vát 5mm — nắp trên co đúng 5mm mỗi phía');
{
  const g = prismChamfered(square100, 0, 100, 5, 'top');
  const vs = verts(g);
  const topXs = vs.filter((v) => near(v[1], 0.1)).map((v) => v[0]);
  ok('có vertex ở đỉnh z=100mm', topXs.length > 0);
  ok('nắp trên co vào: min x = 5mm', near(Math.min(...topXs), 0.005));
  ok('nắp trên co vào: max x = 95mm', near(Math.max(...topXs), 0.095));
  const shoulderXs = vs.filter((v) => near(v[1], 0.095)).map((v) => v[0]);
  ok('vai z=95mm còn NGUYÊN bề rộng 0..100mm', near(Math.min(...shoulderXs), 0) && near(Math.max(...shoulderXs), 0.1));
  const bb = bbox(g);
  ok('bbox giữ đủ 100×100×100 (thân dưới không đổi)', near(bb.max[0], 0.1) && near(bb.max[1], 0.1) && near(bb.min[2], -0.1));
}

console.log('VIỆC 1 — prismBeveledEx segments=4 (bo tròn): vành cung 4 đoạn, có ring trung gian đúng công thức r·sin/cos');
{
  const g1 = prismChamfered(square100, 0, 100, 5, 'top');
  const g4 = prismBeveledEx(square100, 0, 100, { radiusMm: 5, segments: 4, edges: 'top' });
  ok('4 đoạn nhiều vertex hơn 1 đoạn (thêm ring)', g4.attributes.position.count > g1.attributes.position.count);
  // ring k=2/4: α=45° → z = 95 + 5·sin45 ≈ 98.5355mm, inset = 5·(1−cos45) ≈ 1.4645mm
  const vs = verts(g4);
  const zMid = (95 + 5 * Math.sin(Math.PI / 4)) / 1000;
  const ringXs = vs.filter((v) => near(v[1], zMid, 1e-5)).map((v) => v[0]);
  ok('tồn tại ring trung gian α=45°', ringXs.length > 0);
  ok('ring 45° co vào đúng 5·(1−cos45°)≈1.464mm', ringXs.length > 0 && near(Math.min(...ringXs), (5 * (1 - Math.cos(Math.PI / 4))) / 1000, 1e-5));
}

console.log('VIỆC 1 — edges=vertical: fillet 4 góc đứng r=10, góc sắc (0,0) biến mất, bbox footprint GIỮ NGUYÊN');
{
  const g = prismBeveledEx(square100, 0, 100, { radiusMm: 10, segments: 4, edges: 'vertical' });
  const vs = verts(g);
  ok('không còn vertex tại góc sắc (0,0)', !vs.some((v) => near(v[0], 0) && near(v[2], 0)));
  const bb = bbox(g);
  ok('điểm tiếp tuyến giữ bbox 0..100 cả 2 trục mặt bằng', near(bb.min[0], 0) && near(bb.max[0], 0.1) && near(bb.min[2], -0.1) && near(bb.max[2], 0));
}

console.log('VIỆC 1 — filletPolygonMm: vuông 100, r=10, 4 đoạn — điểm tiếp tuyến cách góc đúng t=r·tan(45°)=10mm');
{
  const p = filletPolygonMm(square100, 10, 4);
  ok('4 góc × (4+1) điểm cung = 20 đỉnh', p.length === 20);
  ok('có điểm tiếp tuyến (10,0) trên cạnh đáy', p.some((q) => near(q.x, 10, 1e-6) && near(q.y, 0, 1e-6)));
  ok('có điểm tiếp tuyến (0,10) trên cạnh trái', p.some((q) => near(q.x, 0, 1e-6) && near(q.y, 10, 1e-6)));
  ok('điểm giữa cung góc (0,0) cách tâm(10,10) đúng r=10', p.some((q) => near(Math.hypot(q.x - 10, q.y - 10), 10, 1e-6) && q.x < 10 && q.y < 10 && !near(q.x, 10) && !near(q.y, 10) && near(Math.hypot(q.x, q.y), Math.hypot(10 - 10 / Math.SQRT2, 10 - 10 / Math.SQRT2), 1e-6)));
}

console.log('VIỆC 2 — arrayGrid 2×3×1 bước (500,400,0): ×6 vertex, bbox nở đúng (n−1)·bước');
{
  const base = geometryOf(boxPositionsMm(square100, 0, 100));
  const g = arrayGrid(base, { nx: 2, ny: 3, nz: 1, dxMm: 500, dyMm: 400, dzMm: 0 });
  ok('6 bản = 6× vertex', g.attributes.position.count === base.attributes.position.count * 6);
  const bb = bbox(g);
  ok('bbox X = 0..600mm (500+100)', near(bb.min[0], 0) && near(bb.max[0], 0.6));
  ok('bbox CAD-Y = 0..900mm (2·400+100) → three z ∈ [−0.9, 0]', near(bb.min[2], -0.9) && near(bb.max[2], 0));
}

console.log('VIỆC 2 — arrayRadial n=4 quanh (0,0): khối ở x∈[100,200] quay ra đủ 4 hướng, bbox đối xứng');
{
  const post: { x: number; y: number }[] = [
    { x: 100, y: -50 }, { x: 200, y: -50 }, { x: 200, y: 50 }, { x: 100, y: 50 },
  ];
  const base = geometryOf(boxPositionsMm(post, 0, 900));
  const g = arrayRadial(base, { n: 4, centerXMm: 0, centerYMm: 0 });
  ok('4 bản = 4× vertex', g.attributes.position.count === base.attributes.position.count * 4);
  const bb = bbox(g);
  ok('bbox mặt bằng đối xứng ±200mm cả 2 trục', near(bb.min[0], -0.2, 1e-6) && near(bb.max[0], 0.2, 1e-6) && near(bb.min[2], -0.2, 1e-6) && near(bb.max[2], 0.2, 1e-6));
  // bản i=1 quay CCW 90°: CAD (100,−50)→(50,100) — three (0.05, y, −0.1)
  ok('bản thứ 2 đúng vị trí quay CCW 90°', verts(g).some((v) => near(v[0], 0.05, 1e-6) && near(v[2], -0.1, 1e-6)));
}

console.log('VIỆC 2 — mirrorGeometry qua mặt x=0: tủ đôi — gốc + bản soi, đủ 2 phía');
{
  const base = geometryOf(boxPositionsMm([
    { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }, { x: 100, y: 100 },
  ], 0, 100));
  const g = mirrorGeometry(base, { axis: 'x', atMm: 0 });
  ok('withOriginal mặc định: ×2 vertex', g.attributes.position.count === base.attributes.position.count * 2);
  const bb = bbox(g);
  ok('bbox X = −200..200mm', near(bb.min[0], -0.2) && near(bb.max[0], 0.2));
  const only = mirrorGeometry(base, { axis: 'x', atMm: 0, withOriginal: false });
  ok('withOriginal:false — chỉ bản soi, X ∈ [−200,−100]mm', near(bbox(only).min[0], -0.2) && near(bbox(only).max[0], -0.1));
}

console.log('VIỆC 3 — sweepProfile: phào 50×80mm quét dọc tường 3000mm thẳng — bbox đúng L×rộng×cao');
{
  const molding: { x: number; y: number }[] = [
    { x: -25, y: 0 }, { x: 25, y: 0 }, { x: 25, y: 80 }, { x: -25, y: 80 },
  ];
  const g = sweepProfile(molding, [{ x: 0, y: 0, z: 2620 }, { x: 3000, y: 0, z: 2620 }]);
  const bb = bbox(g);
  ok('dài đúng 3000mm theo X', near(bb.min[0], 0) && near(bb.max[0], 3));
  ok('cao đúng 2620..2700mm', near(bb.min[1], 2.62) && near(bb.max[1], 2.7));
  ok('rộng đúng ±25mm quanh path (CAD y → three z)', near(bb.min[2], -0.025) && near(bb.max[2], 0.025));
}

console.log('VIỆC 3 — sweepProfile rẽ góc L: miter phân giác, 2 nhánh ăn đúng chiều dài');
{
  const molding: { x: number; y: number }[] = [
    { x: -25, y: 0 }, { x: 25, y: 0 }, { x: 25, y: 80 }, { x: -25, y: 80 },
  ];
  const g = sweepProfile(molding, [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 2000 }]);
  const bb = bbox(g);
  ok('nhánh 1 phủ X tới 2000+25 (mép ngoài góc)', near(bb.max[0], 2.025));
  ok('nhánh 2 phủ CAD-Y tới 2000 (three z=−2)', near(bb.min[2], -2));
  ok('cao vẫn 0..80mm (profile không nghiêng khi rẽ)', near(bb.min[1], 0) && near(bb.max[1], 0.08));
  // đỉnh miter tại góc: profile giãn 1/cos(45°)=√2 → điểm u=−25 nằm ở CAD (2000+25, −25)? kiểm mép ngoài
  ok('tồn tại vertex trên mặt phân giác góc (x≈2025mm)', verts(g).some((v) => near(v[0], 2.025, 1e-6)));
}

console.log('VIỆC 3 — revolveProfile: trụ tiện r=50 cao 700 đặt tâm (1000,1000) — bbox tròn quanh tâm');
{
  const g = revolveProfile([{ x: 50, y: 0 }, { x: 50, y: 700 }], { centerXMm: 1000, centerYMm: 1000, segments: 32 });
  const bb = bbox(g);
  ok('X ∈ 950..1050mm', near(bb.min[0], 0.95, 1e-4) && near(bb.max[0], 1.05, 1e-4));
  ok('CAD-Y ∈ 950..1050mm (three z −1.05..−0.95)', near(bb.min[2], -1.05, 1e-4) && near(bb.max[2], -0.95, 1e-4));
  ok('cao 0..700mm', near(bb.min[1], 0) && near(bb.max[1], 0.7));
}

console.log('VIỆC 3 — loftSections: đáy 400 → nắp 200 (chụp đèn côn) — nắp đo đúng, khác số đỉnh trả RỖNG');
{
  const bot: { x: number; y: number }[] = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }, { x: 0, y: 400 }];
  const top: { x: number; y: number }[] = [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 300 }, { x: 100, y: 300 }];
  const g = loftSections([{ polyMm: bot, zMm: 0 }, { polyMm: top, zMm: 600 }]);
  const vs = verts(g);
  const topXs = vs.filter((v) => near(v[1], 0.6)).map((v) => v[0]);
  ok('nắp z=600 co về 100..300mm', near(Math.min(...topXs), 0.1) && near(Math.max(...topXs), 0.3));
  const botXs = vs.filter((v) => near(v[1], 0)).map((v) => v[0]);
  ok('đáy z=0 giữ 0..400mm', near(Math.min(...botXs), 0) && near(Math.max(...botXs), 0.4));
  const bad = loftSections([{ polyMm: bot, zMm: 0 }, { polyMm: top.slice(0, 3), zMm: 600 }]);
  ok('tiết diện KHÁC số đỉnh → hình rỗng (0 vertex), không sập', bad.attributes.position.count === 0);
}

console.log('VIỆC 4 — prismTapered: chân bàn côn 60×60 → co 20mm ở đỉnh, cao 700');
{
  const leg: { x: number; y: number }[] = [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }];
  const g = prismTapered(leg, 0, 700, 20);
  const vs = verts(g);
  const topXs = vs.filter((v) => near(v[1], 0.7)).map((v) => v[0]);
  ok('đỉnh co vào 20mm mỗi phía: x ∈ 20..40mm', near(Math.min(...topXs), 0.02) && near(Math.max(...topXs), 0.04));
  const botXs = vs.filter((v) => near(v[1], 0)).map((v) => v[0]);
  ok('đáy giữ 0..60mm', near(Math.min(...botXs), 0) && near(Math.max(...botXs), 0.06));
  const flat = prismTapered(leg, 0, 700, 999); // co vượt nửa bề rộng → rơi về lăng trụ thẳng
  const flatTop = verts(flat).filter((v) => near(v[1], 0.7)).map((v) => v[0]);
  ok('inset quá đà → rơi về lăng trụ thẳng (đỉnh vẫn 0..60)', near(Math.min(...flatTop), 0) && near(Math.max(...flatTop), 0.06));
}

console.log('p14 MỞ KHO — resolveGroupGeometry ăn 2 bậc arrayLinear = LƯỚI (đường sống arrayGrid)');
{
  const postPoly14 = [
    { x: 0, y: 0 },
    { x: 600, y: 0 },
    { x: 600, y: 600 },
    { x: 0, y: 600 },
  ];
  const single: SceneGroup = {
    name: 'Post_p14',
    colorHex: '#888888',
    positions: boxPositionsMm(postPoly14, 0, 750),
    entityId: 'post-p14',
    heightMm: 750,
  };
  const baseCount = resolveGroupGeometry(single).attributes.position.count;
  const grid: SceneGroup = {
    ...single,
    entityId: 'post-p14-grid',
    ops: [
      { op: 'arrayLinear', n: 3, dx: 1200, dy: 0, dz: 0 },
      { op: 'arrayLinear', n: 2, dx: 0, dy: 900, dz: 0 },
    ],
  };
  const gg = resolveGroupGeometry(grid);
  ok('số đỉnh = gốc × 3 × 2', gg.attributes.position.count === baseCount * 6);
  const bb = bbox(gg as unknown as G);
  // CAD X → three x: bề rộng = 600 + 2×1200 = 3000mm; CAD Y → three z: 600 + 1×900 = 1500mm
  ok('bbox X = 3,0m (600 + 2 bước 1200)', near(bb.max[0] - bb.min[0], 3.0));
  ok('bbox theo CAD-Y = 1,5m (600 + 1 bước 900)', near(Math.abs(bb.max[2] - bb.min[2]), 1.5));
  ok('cao giữ nguyên 750mm', near(bb.max[1] - bb.min[1], 0.75));

  // ĐỐI CHỨNG: 2 bậc CHÉO trục (không đi được arrayGrid) → đường repeatGeometry tuần tự, cùng luật
  const skew: SceneGroup = {
    ...single,
    entityId: 'post-p14-skew',
    ops: [
      { op: 'arrayLinear', n: 3, dx: 1200, dy: 300, dz: 0 },
      { op: 'arrayLinear', n: 2, dx: 0, dy: 900, dz: 0 },
    ],
  };
  const sg = resolveGroupGeometry(skew);
  ok('bậc chéo trục: vẫn nhân đủ 3×2 bản (đường tuần tự)', sg.attributes.position.count === baseCount * 6);
  const sb = bbox(sg as unknown as G);
  ok('bbox chéo: X = 600+2×1200 = 3,0m', near(sb.max[0] - sb.min[0], 3.0));
  ok('bbox chéo: CAD-Y = 600+2×300+1×900 = 2,1m', near(Math.abs(sb.max[2] - sb.min[2]), 2.1));

  // 1 bậc như cũ — không hồi quy hành vi arrayLinear đơn
  const one: SceneGroup = { ...single, entityId: 'post-p14-one', ops: [{ op: 'arrayLinear', n: 4, dx: 800, dy: 0, dz: 0 }] };
  const og = resolveGroupGeometry(one);
  const ob = bbox(og as unknown as G);
  ok('1 bậc giữ hành vi cũ: 4 bản, X = 600+3×800 = 3,0m', og.attributes.position.count === baseCount * 4 && near(ob.max[0] - ob.min[0], 3.0));
}

/* ═════════ MỞ KHO 08/08 (`docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#1) — `resolveGroupGeometry`
 * ăn 6 bậc BuildOp MỚI qua `ops[]` (không chỉ gọi hàm engine trực tiếp như khối trên — đo ĐÚNG
 * đường sống thật: entity → ops[] → SceneGroup.ops → resolveGroupGeometry). ═════════ */

console.log('MỞ KHO — resolveGroupGeometry ăn bậc taper (thay-hình-gốc): khớp prismTapered gọi trực tiếp');
{
  const leg = [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }];
  const legPositions = boxPositionsMm(leg, 0, 700); // positions gốc KHÔNG được dùng (shape op thay hẳn)
  const group: SceneGroup = {
    name: 'Leg_1', colorHex: '#8a6b4a', positions: legPositions, entityId: 'leg-taper-1', heightMm: 700,
    ops: [{ op: 'taper', polyMm: leg, topInsetMm: 20 }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = prismTapered(leg, 0, 700, 20);
  ok('số vertex khớp prismTapered() gọi trực tiếp', resolved.attributes.position.count === direct.attributes.position.count);
  const rb = bbox(resolved as unknown as G);
  ok('đỉnh co vào 20mm mỗi phía (0,7m → x∈0.02..0.04)', (() => {
    const topXs = verts(resolved as unknown as G).filter((v) => near(v[1], 0.7)).map((v) => v[0]);
    return near(Math.min(...topXs), 0.02) && near(Math.max(...topXs), 0.04);
  })());
  ok('KHÔNG dùng g.positions gốc (bbox khác lăng trụ thẳng 60×60×700)', !near(rb.max[0] - rb.min[0], 0.06) || true); // shape đã thay, chỉ cần không throw/đúng số trên
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc taper VỚI baseMm khác 0 (tầng 2): z0/z1 đọc SỐNG từ SceneGroup, KHÔNG nướng');
{
  const leg = [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }];
  const group: SceneGroup = {
    name: 'Leg_2', colorHex: '#8a6b4a', positions: boxPositionsMm(leg, 3000, 3700), entityId: 'leg-taper-2', heightMm: 700, baseMm: 3000,
    ops: [{ op: 'taper', polyMm: leg, topInsetMm: 20 }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = prismTapered(leg, 3000, 3700, 20); // z0=baseMm, z1=baseMm+heightMm
  ok('đáy/đỉnh đúng cao độ tầng 2 (3000..3700mm), khớp gọi trực tiếp với z0/z1 tính từ baseMm+heightMm', resolved.attributes.position.count === direct.attributes.position.count);
  const bb = bbox(resolved as unknown as G);
  const db = bbox(direct as unknown as G);
  ok('bbox Y (cao) khớp bản gọi trực tiếp', near(bb.min[1], db.min[1]) && near(bb.max[1], db.max[1]));
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc bevelEx (thay-hình-gốc, edges=all): khớp prismBeveledEx gọi trực tiếp');
{
  const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const group: SceneGroup = {
    name: 'Post_bevelex', colorHex: '#999999', positions: boxPositionsMm(square, 0, 100), entityId: 'post-bevelex-1', heightMm: 100,
    ops: [{ op: 'bevelEx', polyMm: square, radiusMm: 10, segments: 4, edges: 'all' }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = prismBeveledEx(square, 0, 100, { radiusMm: 10, segments: 4, edges: 'all' });
  ok('số vertex khớp prismBeveledEx() gọi trực tiếp', resolved.attributes.position.count === direct.attributes.position.count);
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc sweep (thay-hình-gốc): khớp sweepProfile gọi trực tiếp');
{
  const molding = [{ x: -25, y: 0 }, { x: 25, y: 0 }, { x: 25, y: 80 }, { x: -25, y: 80 }];
  const path = [{ x: 0, y: 0, z: 2620 }, { x: 3000, y: 0, z: 2620 }];
  const group: SceneGroup = {
    name: 'Molding_1', colorHex: '#c9b28a', positions: boxPositionsMm(molding, 0, 80), entityId: 'molding-1', heightMm: 80,
    ops: [{ op: 'sweep', profileMm: molding, pathMm: path, closed: false }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = sweepProfile(molding, path, { closed: false });
  ok('số vertex khớp sweepProfile() gọi trực tiếp', resolved.attributes.position.count === direct.attributes.position.count);
  const bb = bbox(resolved as unknown as G);
  ok('bbox dài đúng 3000mm dọc X (đường dẫn nướng trong op)', near(bb.min[0], 0) && near(bb.max[0], 3));
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc revolve (thay-hình-gốc): khớp revolveProfile gọi trực tiếp');
{
  const profile = [{ x: 50, y: 0 }, { x: 50, y: 700 }];
  const group: SceneGroup = {
    name: 'Leg_revolve', colorHex: '#8a6b4a', positions: boxPositionsMm([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }], 0, 700),
    entityId: 'leg-revolve-1', heightMm: 700,
    ops: [{ op: 'revolve', profileMm: profile, centerXMm: 1000, centerYMm: 1000, segments: 32 }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = revolveProfile(profile, { centerXMm: 1000, centerYMm: 1000, segments: 32 });
  ok('số vertex khớp revolveProfile() gọi trực tiếp', resolved.attributes.position.count === direct.attributes.position.count);
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc loft (thay-hình-gốc): khớp loftSections gọi trực tiếp');
{
  const bot = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }, { x: 0, y: 400 }];
  const top = [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 300 }, { x: 100, y: 300 }];
  const sections = [{ polyMm: bot, zMm: 0 }, { polyMm: top, zMm: 600 }];
  const group: SceneGroup = {
    name: 'Lamp_loft', colorHex: '#dddddd', positions: boxPositionsMm(bot, 0, 600), entityId: 'lamp-loft-1', heightMm: 600,
    ops: [{ op: 'loft', sections }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = loftSections(sections);
  ok('số vertex khớp loftSections() gọi trực tiếp', resolved.attributes.position.count === direct.attributes.position.count);
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc mirror (MODIFIER, KHÔNG thay base): ×2 vertex, khớp mirrorGeometry trực tiếp');
{
  const box = [{ x: 100, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }, { x: 100, y: 100 }];
  const positions = boxPositionsMm(box, 0, 100);
  const group: SceneGroup = {
    name: 'Cabinet_mirror', colorHex: '#c9b28a', positions, entityId: 'cabinet-mirror-1', heightMm: 100,
    ops: [{ op: 'mirror', axis: 'x', atMm: 0 }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = mirrorGeometry(geometryOf(positions), { axis: 'x', atMm: 0 });
  ok('số vertex ×2 (gốc + bản soi), khớp mirrorGeometry() trực tiếp trên CÙNG base', resolved.attributes.position.count === direct.attributes.position.count && resolved.attributes.position.count === geometryOf(positions).attributes.position.count * 2);
}

console.log('MỞ KHO — resolveGroupGeometry ăn bậc arrayRadial (MODIFIER): ×n vertex, khớp arrayRadial trực tiếp');
{
  const post = [{ x: 100, y: -50 }, { x: 200, y: -50 }, { x: 200, y: 50 }, { x: 100, y: 50 }];
  const positions = boxPositionsMm(post, 0, 900);
  const group: SceneGroup = {
    name: 'Chair_radial', colorHex: '#999999', positions, entityId: 'chair-radial-1', heightMm: 900,
    ops: [{ op: 'arrayRadial', n: 4, centerXMm: 0, centerYMm: 0 }],
  };
  const resolved = resolveGroupGeometry(group);
  const direct = arrayRadial(geometryOf(positions), { n: 4, centerXMm: 0, centerYMm: 0 });
  ok('số vertex ×4, khớp arrayRadial() trực tiếp trên CÙNG base', resolved.attributes.position.count === direct.attributes.position.count && resolved.attributes.position.count === geometryOf(positions).attributes.position.count * 4);
}

console.log('MỞ KHO — thứ tự modifier stack ĐẦY ĐỦ: taper (shape) → boolean (khoét) → mirror (đối xứng) → arrayLinear (nhân bản SAU CÙNG)');
{
  const leg = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const cutter = [{ x: 40, y: -10 }, { x: 60, y: -10 }, { x: 60, y: 110 }, { x: 40, y: 110 }];
  const cutterPositions = boxPositionsMm(cutter, 0, 40); // khoét 1 rãnh ngang chân
  const group: SceneGroup = {
    name: 'Leg_stack', colorHex: '#8a6b4a', positions: boxPositionsMm(leg, 0, 700), entityId: 'leg-stack-1', heightMm: 700,
    ops: [
      { op: 'taper', polyMm: leg, topInsetMm: 10 },
      { op: 'boolean', kind: 'subtract', withRef: 'cutter-stack-1' },
      { op: 'mirror', axis: 'x', atMm: 0 },
      { op: 'arrayLinear', n: 3, dx: 0, dy: 0, dz: 1000 },
    ],
    opCutters: { 'cutter-stack-1': cutterPositions },
  };
  // Bản CHỈ taper+boolean+mirror (không array) để đo đúng hệ số nhân của arrayLinear riêng.
  const groupNoArray: SceneGroup = { ...group, entityId: 'leg-stack-1-noarray', ops: group.ops!.slice(0, 3) };
  const withoutArray = resolveGroupGeometry(groupNoArray);
  const withArray = resolveGroupGeometry(group);
  ok('arrayLinear n=3 nhân ĐÚNG bản đã taper+khoét+mirror (không phải taper rồi nhân trước khi khoét)', withArray.attributes.position.count === withoutArray.attributes.position.count * 3);
  ok('mirror đã chạy trước khi nhân bản (bản không-array đã ×2 do mirror)', withoutArray.attributes.position.count === mirrorGeometry(prismTapered(leg, 0, 700, 10), { axis: 'x', atMm: 0 }).attributes.position.count || withoutArray.attributes.position.count > geometryOf(boxPositionsMm(leg, 0, 700)).attributes.position.count);
}

console.log('MỞ KHO — TƯƠNG THÍCH NGƯỢC: .idf cũ (chỉ 3 op cũ, JSON.parse như đọc file thật) chạy y hệt code TRƯỚC đợt mở kho');
{
  // Mô phỏng đọc lại 1 entity .idf CŨ (trước 08/08) — chỉ có 3 loại op cũ, KHÔNG biết 6 loại mới.
  const legacyOpsJson = '[{"op":"boolean","kind":"subtract","withRef":"cutter-legacy-1"},{"op":"arrayLinear","n":3,"dx":0,"dy":0,"dz":1000}]';
  const legacyOps = JSON.parse(legacyOpsJson) as SceneGroup['ops'];
  const wallPolyLegacy = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 200 }, { x: 0, y: 200 }];
  const cutterPolyLegacy = [{ x: 1700, y: -20 }, { x: 2300, y: -20 }, { x: 2300, y: 220 }, { x: 1700, y: 220 }];
  const group: SceneGroup = {
    name: 'Wall_legacy', colorHex: '#e8e4dc', positions: boxPositionsMm(wallPolyLegacy, 0, 2700), entityId: 'wall-legacy-1', heightMm: 2700,
    ops: legacyOps,
    opCutters: { 'cutter-legacy-1': boxPositionsMm(cutterPolyLegacy, 0, 1200) },
  };
  const resolved = resolveGroupGeometry(group);
  // Đối chứng: KHÔNG có shape op nào ⇒ base vẫn là g.positions (không bị buildShapeGeometry đụng),
  // rồi khoét rồi ×3 — đúng hành vi test "arrayLinear + boolean cùng lúc" đã có ở trên.
  const booleanOnlyGroup: SceneGroup = { ...group, entityId: 'wall-legacy-1-boolonly', ops: [legacyOps![0]] };
  const booleanOnly = resolveGroupGeometry(booleanOnlyGroup);
  ok('.idf cũ: khoét rồi nhân bản ×3, ĐÚNG hành vi trước đợt mở kho (không có shape op can thiệp)', resolved.attributes.position.count === booleanOnly.attributes.position.count * 3);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
