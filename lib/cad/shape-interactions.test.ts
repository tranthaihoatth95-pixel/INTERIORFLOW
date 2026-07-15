/**
 * lib/cad/shape-interactions.test.ts — test logic thuần B2.2 (auto-snap) + B2.6 (collision) +
 * B2.3 (resize) + B2.7 (clearance). Chạy: node_modules/.bin/sucrase-node lib/cad/shape-interactions.test.ts
 */
import assert from 'node:assert';
import { emptyDoc } from './model';
import type { Doc, BlockEntity, Pt, LineEntity } from './model';
import {
  extractWallSegments,
  autoSnapToWall,
  resizeBlockCorner,
  detectCollisions,
  polygonsOverlap,
  blockWorldCorners,
  clearanceWorldPolygon,
  effectiveBlockSize,
} from './shape-interactions';
import { MOCK_BED, MOCK_CABINET, MOCK_TOILET, MOCK_BLOCK_MAP } from './shape-mocks';

let pass = 0;
function ok(cond: boolean, msg: string) {
  assert.ok(cond, msg);
  pass++;
  // eslint-disable-next-line no-console
  console.log(`  ok — ${msg}`);
}

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

function blockEnt(partial: Partial<BlockEntity> & { block: string }): BlockEntity {
  return {
    id: partial.id ?? 'e1',
    type: 'block',
    layer: 'l-furniture',
    at: partial.at ?? { x: 0, y: 0 },
    rot: partial.rot ?? 0,
    sx: partial.sx ?? 1,
    sy: partial.sy ?? 1,
    block: partial.block,
    variant: partial.variant,
  };
}

function lineEnt(a: Pt, b: Pt, layer = 'l-wall'): LineEntity {
  return { id: `w-${a.x}-${a.y}`, type: 'line', layer, a, b };
}

function docWithWalls(...segs: [Pt, Pt][]): Doc {
  const d = emptyDoc();
  d.entities.push(...segs.map(([a, b]) => lineEnt(a, b)));
  return d;
}

/* ───────── effectiveBlockSize (B2.5) ───────── */
console.log('effectiveBlockSize — variant switch (B2.5)');
{
  const e = blockEnt({ block: 'mock-bed' });
  const sizeDefault = effectiveBlockSize(e, MOCK_BLOCK_MAP);
  ok(sizeDefault.w === 1000 && sizeDefault.h === 2000, 'không có variant → w/h gốc (1000x2000)');

  const eDouble = blockEnt({ block: 'mock-bed', variant: 'double' });
  const sizeDouble = effectiveBlockSize(eDouble, MOCK_BLOCK_MAP);
  ok(sizeDouble.w === 1600 && sizeDouble.h === 2000, 'variant "double" → 1600x2000');

  const eBad = blockEnt({ block: 'mock-bed', variant: 'nonexistent' });
  const sizeBad = effectiveBlockSize(eBad, MOCK_BLOCK_MAP);
  ok(sizeBad.w === 1000, 'variant id lạ → fallback w/h gốc');
}

/* ───────── extractWallSegments ───────── */
console.log('extractWallSegments');
{
  const doc = docWithWalls([{ x: 0, y: 0 }, { x: 1000, y: 0 }]);
  const segs = extractWallSegments(doc);
  ok(segs.length === 1, 'lấy đúng 1 đoạn tường từ 1 LINE entity');
  ok(segs[0].a.x === 0 && segs[0].b.x === 1000, 'toạ độ đoạn tường khớp entity gốc');
}

/* ───────── autoSnapToWall (B2.2) ───────── */
console.log('autoSnapToWall — wall-back anchor (B2.2)');
{
  // Tường ngang tại y=0, phòng ở phía +y. MOCK_CABINET anchor tại local (0,300) normal (0,1)
  // (nghĩa là mặt sau tủ ở +y, trỏ vào tường phía +y — dùng phòng khi tường ở TRÊN tủ).
  // Dựng lại kịch bản đơn giản: tường DƯỚI tủ (y=0), tủ đặt lệch trên 1 chút (y=500) — anchor
  // MOCK_CABINET (0,300, normal (0,1)) sẽ không khớp hướng "trỏ vào tường phía dưới" — nên viết
  // test bằng chính anchor đã khai báo, kiểm bất biến thay vì số cụ thể.
  const wallDoc = docWithWalls([{ x: 0, y: 0 }, { x: 2000, y: 0 }]);
  // anchor local (0,300) → world y = at.y+300; muốn cách tường (y=0) trong ngưỡng 400mm ⇒ at.y=50.
  const e = blockEnt({ block: 'mock-cabinet', at: { x: 500, y: 50 } });
  const snapped = autoSnapToWall(e, wallDoc, { blockMap: MOCK_BLOCK_MAP, thresholdMm: 400 });
  ok(snapped !== e, 'có tường trong ngưỡng → trả về entity MỚI (đã snap)');

  const anchor = MOCK_CABINET.anchors![0];
  const anchorWorld = { x: snapped.at.x, y: snapped.at.y }; // recompute below via blockToWorld
  // dùng blockWorldCorners gián tiếp không đủ — tính tay bằng công thức giống blockToWorld
  const cos = Math.cos(snapped.rot);
  const sin = Math.sin(snapped.rot);
  const wx = snapped.at.x + (anchor.pt.x * snapped.sx) * cos - (anchor.pt.y * snapped.sy) * sin;
  const wy = snapped.at.y + (anchor.pt.x * snapped.sx) * sin + (anchor.pt.y * snapped.sy) * cos;
  ok(approx(wy, 0, 1e-6), `anchor world sau snap phải nằm ĐÚNG trên tường y=0 (được ${wy})`);
  void anchorWorld;

  // normal đã xoay phải trỏ NGƯỢC với hướng ra phòng (tức trỏ vào tường, y âm vì phòng ở +y)
  const nx = anchor.normal.x * cos - anchor.normal.y * sin;
  const ny = anchor.normal.x * sin + anchor.normal.y * cos;
  ok(ny < 0, `normal sau khi xoay phải trỏ VÀO tường (ny<0), được ${ny}`);
}

console.log('autoSnapToWall — không có tường trong ngưỡng → giữ nguyên');
{
  const wallDoc = docWithWalls([{ x: 0, y: 0 }, { x: 2000, y: 0 }]);
  const e = blockEnt({ block: 'mock-cabinet', at: { x: 500, y: 5000 } }); // quá xa
  const result = autoSnapToWall(e, wallDoc, { blockMap: MOCK_BLOCK_MAP, thresholdMm: 300 });
  ok(result === e, 'tường quá xa ngưỡng → trả lại nguyên entity (===)');
}

console.log('autoSnapToWall — block không có anchors → không đổi');
{
  const wallDoc = docWithWalls([{ x: 0, y: 0 }, { x: 2000, y: 0 }]);
  const e = blockEnt({ block: 'mock-toilet', at: { x: 500, y: 50 } });
  const result = autoSnapToWall(e, wallDoc, { blockMap: MOCK_BLOCK_MAP });
  ok(result === e, 'BlockDef không khai báo anchors → snap là no-op');
}

console.log('autoSnapToWall — tường DỌC (kiểm xoay đúng hướng)');
{
  // Tường dọc theo trục Y tại x=0, phòng ở phía +x.
  const wallDoc = docWithWalls([{ x: 0, y: 0 }, { x: 0, y: 2000 }]);
  const e = blockEnt({ block: 'mock-cabinet', at: { x: 300, y: 900 } });
  const snapped = autoSnapToWall(e, wallDoc, { blockMap: MOCK_BLOCK_MAP, thresholdMm: 400 });
  ok(snapped !== e, 'snap xảy ra với tường dọc trong ngưỡng');
  const anchor = MOCK_CABINET.anchors![0];
  const cos = Math.cos(snapped.rot);
  const sin = Math.sin(snapped.rot);
  const wx = snapped.at.x + (anchor.pt.x * snapped.sx) * cos - (anchor.pt.y * snapped.sy) * sin;
  ok(approx(wx, 0, 1e-6), `anchor world.x phải nằm trên tường x=0 sau snap (được ${wx})`);
  const nx = anchor.normal.x * cos - anchor.normal.y * sin;
  ok(nx < 0, `normal sau xoay phải trỏ vào tường (nx<0, phòng ở +x), được ${nx}`);
}

/* ───────── resizeBlockCorner (B2.3) ───────── */
console.log('resizeBlockCorner (B2.3)');
{
  // def w=1000,h=2000 (mock-bed mặc định), rot=0, sx=sy=1, kéo góc trên-phải (index 2, local (500,1000))
  // ra gấp đôi (1000,2000) → kỳ vọng sx=sy=2.
  const e = blockEnt({ block: 'mock-bed', at: { x: 0, y: 0 } });
  const resized = resizeBlockCorner(e, 2, { x: 1000, y: 2000 }, { blockMap: MOCK_BLOCK_MAP });
  ok(approx(resized.sx, 2), `sx phải = 2 (được ${resized.sx})`);
  ok(approx(resized.sy, 2), `sy phải = 2 (được ${resized.sy})`);
  ok(resized.at.x === e.at.x && resized.at.y === e.at.y, 'resize KHÔNG đổi tâm (at) — chỉ đổi sx/sy');

  // co lại còn 1 nửa
  const shrunk = resizeBlockCorner(e, 2, { x: 250, y: 500 }, { blockMap: MOCK_BLOCK_MAP });
  ok(approx(shrunk.sx, 0.5), `sx phải = 0.5 khi kéo góc về 1/2 (được ${shrunk.sx})`);
}

/* ───────── detectCollisions (B2.6) ───────── */
console.log('detectCollisions (B2.6)');
{
  const a = blockEnt({ id: 'a', block: 'mock-toilet', at: { x: 0, y: 0 } }); // 400x620
  const bOverlap = blockEnt({ id: 'b', block: 'mock-toilet', at: { x: 200, y: 0 } }); // chồng lấn (nửa w=200)
  const cFar = blockEnt({ id: 'c', block: 'mock-toilet', at: { x: 5000, y: 5000 } }); // xa, không chạm

  const collided = detectCollisions([a, bOverlap, cFar], MOCK_BLOCK_MAP);
  ok(collided.has('a') && collided.has('b'), 'a và b chồng lấn → cả 2 đều trong tập collision');
  ok(!collided.has('c'), 'c ở xa → không collision');

  const noOverlap = detectCollisions([a, cFar], MOCK_BLOCK_MAP);
  ok(noOverlap.size === 0, 'không entity nào chồng nhau → tập rỗng');
}

console.log('detectCollisions — hình xoay (SAT, không chỉ AABB)');
{
  // 2 hình vuông 400x400 đặt cách tâm 500mm theo X (không chồng nếu KHÔNG xoay: nửa cạnh 200+200=400<500)
  // nhưng khi xoay 45° đường chéo dài hơn (200*sqrt2≈283) vẫn <500 nên KHÔNG chồng — dùng ca đơn giản
  // hơn: khoảng cách tâm 350mm, xoay 45° → nửa-đường-chéo ~283 mỗi bên, 283+283=566>350 ⇒ chồng lấn dù
  // AABB (nửa cạnh 200 mỗi bên = 400 < 350? không, AABB cũng sẽ báo chồng) — đổi lại kiểm SAT phát
  // hiện KHÔNG chồng khi 2 rect xoay lệch trục đúng cách né nhau (test âm cho SAT chính xác hơn AABB).
  const sq = (cx: number, cy: number, rot: number): Pt[] => {
    const hw = 200;
    const local: Pt[] = [{ x: -hw, y: -hw }, { x: hw, y: -hw }, { x: hw, y: hw }, { x: -hw, y: hw }];
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return local.map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
  };
  const a = sq(0, 0, 0);
  const b = sq(450, 0, 0); // 200+200=400 < 450 → không chạm
  ok(!polygonsOverlap(a, b), 'AABB cách xa (450 > 400) → không chồng lấn');
  const bRotated = sq(390, 0, Math.PI / 4); // xoay 45° làm bán kính hiệu dụng lớn hơn → có thể chồng
  ok(polygonsOverlap(a, bRotated), 'sau khi xoay 45°, khoảng cách 390 < bán kính hiệu dụng → SAT phát hiện chồng lấn');
}

/* ───────── clearanceWorldPolygon (B2.7) ───────── */
console.log('clearanceWorldPolygon (B2.7)');
{
  const e = blockEnt({ block: 'mock-toilet', at: { x: 1000, y: 1000 }, rot: 0 });
  const zone = MOCK_TOILET.clearance![0]; // { x:-450, y:-310, w:900, h:900 }
  const poly = clearanceWorldPolygon(e, zone);
  ok(poly.length === 4, 'clearance polygon có 4 đỉnh');
  ok(approx(poly[0].x, 1000 - 450) && approx(poly[0].y, 1000 - 310), 'góc đầu tiên = at + (x,y) khi rot=0');

  // xoay 90° → kiểm bất biến: khoảng cách từ tâm block tới từng đỉnh clearance không đổi
  const distsBefore = poly.map((p) => Math.hypot(p.x - e.at.x, p.y - e.at.y));
  const eRot = blockEnt({ block: 'mock-toilet', at: { x: 1000, y: 1000 }, rot: Math.PI / 2 });
  const polyRot = clearanceWorldPolygon(eRot, zone);
  const distsAfter = polyRot.map((p) => Math.hypot(p.x - eRot.at.x, p.y - eRot.at.y));
  distsBefore.forEach((d, i) => ok(approx(d, distsAfter[i], 1e-6), `khoảng cách đỉnh ${i} tới tâm giữ nguyên khi xoay (${d} vs ${distsAfter[i]})`));
}

/* ───────── blockWorldCorners (sanity — dùng chung bởi collision) ───────── */
console.log('blockWorldCorners');
{
  const e = blockEnt({ block: 'mock-toilet', at: { x: 0, y: 0 }, rot: 0 });
  const corners = blockWorldCorners(e, MOCK_BLOCK_MAP);
  ok(corners.length === 4, 'block có 4 góc');
  ok(approx(corners[0].x, -200) && approx(corners[0].y, -310), 'góc dưới-trái = (-w/2,-h/2) khi rot=0/at=(0,0)');
}

console.log(`\n✅ ${pass} assertion PASS — lib/cad/shape-interactions.test.ts`);
